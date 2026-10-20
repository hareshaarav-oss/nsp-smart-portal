import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, MessageCircle, Phone, Search, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/nss/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/lib/nss/session";
import { useNssStore, volunteerHours } from "@/lib/nss/store";
import { openWhatsApp } from "@/lib/nss/whatsapp";

export const Route = createFileRoute("/chat")({ component: ChatPage });

type Person = { id: string; name: string; unit: string; role: string; mobile?: string };
type ChatMessage = { id: string; threadId: string; text: string; senderId: string; senderName: string; createdAt: string };
type Me = { id: string; name: string; role: string; unit: string };

const GROUPS = [
  { id: "college", title: "College NSS", subtitle: "Everyone on the roll" },
  { id: "unit-1", title: "Unit 1", subtitle: "Unit group" },
  { id: "unit-2", title: "Unit 2", subtitle: "Unit group" },
  { id: "leaders", title: "Leaders", subtitle: "Leaders and Programme Officer" },
];

const QUICK = [
  "Please come for the NSS activity.",
  "Bring your ID card and uniform.",
  "Your attendance is updated.",
  "Please reply when you see this.",
];

function canonicalThread(threadId: string) {
  if (!threadId.startsWith("dm:")) return threadId;
  const parts = threadId.slice(3).split(":");
  if (parts.length !== 2) return threadId;
  return `dm:${[parts[0], parts[1]].sort().join(":")}`;
}

function clock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

function dayLabel(iso: string) {
  const day = iso.slice(0, 10);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (day === today) return "Today";
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem("nsp-chat-seen") || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function looksLikePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
}

function ChatPage() {
  const session = useSessionStore((s) => s.session);
  const [me, setMe] = useState<Me | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [active, setActive] = useState("college");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [mobileList, setMobileList] = useState(true);
  const [sending, setSending] = useState(false);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [liveAt, setLiveAt] = useState(0);
  const [alsoWa, setAlsoWa] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const token = session?.chatToken || "";
  const setSession = useSessionStore((s) => s.setSession);
  const poWhatsapp = useNssStore((s) => s.settings.poWhatsapp);
  const roll = useNssStore((s) => s.volunteers) ?? [];

  useEffect(() => {
    setSeen(readSeen());
  }, []);

  useEffect(() => {
    if (!session || session.role === "po" || session.role === "admin") return;
    const id = me?.id || session.volunteerId || "";
    if (!id) return;
    setActive(canonicalThread(`dm:${id}:po`));
  }, [session, me?.id]);

  useEffect(() => {
    if (!session || session.chatToken) return;
    let stop = false;
    void fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "resume-session",
        role: session.role,
        name: session.name,
        volunteerId: session.volunteerId || "",
      }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; chatToken?: string }) => {
        if (stop || !data.ok || !data.chatToken) return;
        setSession({ ...session, chatToken: data.chatToken });
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [session, setSession]);

  useEffect(() => {
    if (!token) return;
    let stop = false;
    async function pull() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/nss-cloud", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "chat-sync", chatToken: token }),
        });
        const data = (await res.json()) as { ok?: boolean; me?: Me; people?: Person[]; messages?: ChatMessage[] };
        if (stop || !res.ok || !data.ok || !data.me) return;
        const desk = data.me.role === "po" || data.me.role === "admin";
        setMe(data.me);
        setPeople(desk ? (data.people ?? []).map((person) => ({ ...person, mobile: undefined })) : []);
        setMessages(data.messages ?? []);
        setLiveAt(Date.now());
      } catch {
        /* keep the last messages on screen */
      }
    }
    void pull();
    const timer = window.setInterval(() => void pull(), 20000);
    const wake = () => void pull();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [token]);

  useEffect(() => {
    const node = scroller.current;
    if (!node || !stick.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, active, mobileList]);

  useEffect(() => {
    if (mobileList) return;
    const last = [...messages].reverse().find((message) => canonicalThread(message.threadId) === canonicalThread(active));
    if (!last) return;
    setSeen((prev) => {
      if ((prev[active] || "") >= last.createdAt) return prev;
      const next = { ...prev, [active]: last.createdAt };
      localStorage.setItem("nsp-chat-seen", JSON.stringify(next));
      return next;
    });
  }, [messages, active, mobileList]);

  const allowedGroups = GROUPS.filter((group) => {
    if (!me) return false;
    return me.role === "po" || me.role === "admin";
  });

  function personName(id: string) {
    if (id === "po") return "Programme Officer";
    if (id === "admin") return "Admin";
    return people.find((person) => person.id === id)?.name || id;
  }

  function threadTitle(id: string) {
    const group = GROUPS.find((item) => item.id === id);
    if (group) return group.title;
    const other = id.slice(3).split(":").find((part) => part !== me?.id) || "";
    return personName(other);
  }

  function lastMessage(id: string) {
    return [...messages].reverse().find((message) => canonicalThread(message.threadId) === id);
  }

  function unreadCount(id: string) {
    const seenAt = seen[id] || "";
    return messages.filter((message) => canonicalThread(message.threadId) === id && message.senderId !== me?.id && message.createdAt > seenAt).length;
  }

  function otherId(threadId = active) {
    if (!threadId.startsWith("dm:") || !me) return "";
    return threadId.slice(3).split(":").find((part) => part !== me.id) || "";
  }

  function phoneFor(id: string) {
    if (session?.role !== "po" && session?.role !== "admin") return "";
    if (!id || id === "po" || id === "admin") return id === "po" || id === "admin" ? poWhatsapp || "" : "";
    const stored = roll.find((row) => row.volunteerId === id || row.id === id);
    const mobile = stored?.mobile || "";
    return mobile.replace(/\D/g, "").length >= 10 ? mobile : "";
  }

  function openWhatsAppChat(text: string) {
    const phone = phoneFor(otherId());
    if (!phone) {
      toast.error("WhatsApp number is not on this chat.");
      return;
    }
    openWhatsApp(phone, text || `Namaste, this is ${me?.name || "NSS"}.`);
  }

  function openThread(id: string) {
    setActive(id);
    setMobileList(false);
    const last = lastMessage(id);
    const next = { ...seen, [id]: last?.createdAt || new Date().toISOString() };
    setSeen(next);
    localStorage.setItem("nsp-chat-seen", JSON.stringify(next));
  }

  async function send(e?: React.FormEvent, threadId = active) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const desk = session?.role === "po" || session?.role === "admin";
    const mine = me?.id || session?.volunteerId || "";
    const thread = desk ? canonicalThread(threadId) : mine ? canonicalThread(`dm:${mine}:po`) : "";
    if (!thread || (!desk && !thread.endsWith(":po") && !thread.includes(":po"))) return;
    setSending(true);
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "chat-send", chatToken: token, threadId: thread, text }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: ChatMessage };
      if (!res.ok || !data.ok || !data.message) throw new Error(data.error || "Message was not sent.");
      setMessages((current) => [...current.filter((row) => row.id !== data.message?.id), data.message!]);
      setDraft("");
      stick.current = true;
      if ((session?.role === "po" || session?.role === "admin") && active.startsWith("dm:") && alsoWa && phoneFor(otherId())) openWhatsAppChat(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message was not sent.");
    } finally {
      setSending(false);
    }
  }

  if (!session) return <Navigate to="/login" search={{ role: "volunteer" }} />;

  const officer = (session.role === "po" || session.role === "admin") && (!me || me.role === "po" || me.role === "admin");
  const meId = me?.id || (session.role === "po" ? "po" : session.role === "admin" ? "admin" : session.volunteerId || "");
  const poThread = meId && meId !== "po" ? canonicalThread(`dm:${meId}:po`) : "";

  if (!officer) {
    const threadMessages = messages.filter((message) => poThread && canonicalThread(message.threadId) === poThread);
    return (
      <AppShell eyebrow="NSS CHAT" current="page">
        <div className="mx-auto flex h-[calc(100dvh-13.5rem)] w-full max-w-3xl flex-col overflow-hidden border-y border-border bg-[#efe7d6] md:my-4 md:h-[calc(100dvh-8.5rem)] md:rounded-2xl md:border">
          <header className="bg-navy px-4 py-3 text-paper">
            <p className="font-medium">Programme Officer</p>
            <p className="text-xs text-paper/70">{me?.name || session.name}</p>
          </header>
          {!token ? (
            <div className="flex-1" />
          ) : (
            <>
              <div
                ref={scroller}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(#e4d5b4_0.7px,transparent_0.7px)] bg-[length:14px_14px] px-3 py-4"
              >
                {threadMessages.map((message, index) => {
                  const mine = message.senderId === me?.id || message.senderId === meId;
                  const previous = threadMessages[index - 1];
                  const showDay = !previous || previous.createdAt.slice(0, 10) !== message.createdAt.slice(0, 10);
                  return (
                    <div key={message.id}>
                      {showDay ? <p className="mx-auto my-2 w-fit rounded-full bg-white/80 px-3 py-1 text-[11px] text-muted-foreground">{dayLabel(message.createdAt)}</p> : null}
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-sm bg-forest text-white" : "rounded-bl-sm bg-white text-navy"}`}>
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                          <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/75" : "text-muted-foreground"}`}>
                            {clock(message.createdAt)}
                            {mine ? <CheckCheck className="size-3.5" /> : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="border-t border-border bg-card p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (poThread) setActive(poThread);
                  void send(e);
                }}
              >
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (poThread) setActive(poThread);
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Message"
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none focus:border-forest"
                  />
                  <Button type="submit" disabled={sending || !draft.trim() || !poThread} className="size-11 rounded-full bg-forest p-0 text-primary-foreground hover:bg-forest/90" aria-label="Send">
                    <SendHorizonal />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const threadMessages = messages.filter((message) => canonicalThread(message.threadId) === canonicalThread(active));
  const directory = (() => {
    const map = new Map<string, Person>();
    for (const volunteer of roll) {
      if (!volunteer.fullName || volunteer.status === "alumni") continue;
      const id = volunteer.volunteerId || volunteer.id;
      if (!id || id === meId) continue;
      map.set(id, { id, name: volunteer.fullName, unit: volunteer.unit || "Unit 1", role: volunteer.nssRole || "Volunteer" });
    }
    for (const person of people) {
      if (!person.id || person.id === meId) continue;
      const prev = map.get(person.id);
      map.set(person.id, {
        id: person.id,
        name: person.name || prev?.name || person.id,
        unit: person.unit || prev?.unit || "Unit 1",
        role: person.role || prev?.role || "Volunteer",
      });
    }
    const needle = query.trim().toLowerCase();
    return [...map.values()]
      .filter((person) => !needle || `${person.name} ${person.id} ${person.unit}`.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  })();
  const activePerson = directory.find((person) => person.id === otherId()) || people.find((person) => person.id === otherId());
  const activeRoll = roll.find((row) => row.volunteerId === otherId() || row.id === otherId());
  const activeHours = activeRoll ? volunteerHours(useNssStore.getState(), activeRoll.id) : 0;
  const activePhone = phoneFor(otherId());

  function threadButton(id: string) {
    const last = lastMessage(id);
    const group = GROUPS.find((item) => item.id === id);
    const count = unreadCount(id);
    return (
      <button key={id} type="button" className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left ${active === id ? "bg-forest/10" : "hover:bg-muted"}`} onClick={() => openThread(id)}>
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-paper ${group ? "bg-navy" : "bg-forest"}`}>{group ? group.title.slice(0, 1) : threadTitle(id).slice(0, 1)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-navy">{threadTitle(id)}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{last ? clock(last.createdAt) : ""}</span>
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">{last?.text || group?.subtitle || "Personal chat"}</span>
            {count > 0 ? <span className="min-w-5 rounded-full bg-forest px-1.5 text-center text-[10px] font-semibold text-white">{count}</span> : null}
          </span>
        </span>
      </button>
    );
  }

  return (
    <AppShell eyebrow="NSS CHAT" current="page">
      <div className="mx-auto flex h-[calc(100dvh-13.5rem)] w-full max-w-6xl overflow-hidden border-y border-border bg-[#efe7d6] md:my-4 md:h-[calc(100dvh-8.5rem)] md:rounded-2xl md:border">
        <aside className={`${mobileList ? "flex" : "hidden"} w-full flex-col bg-card md:flex md:w-80 md:border-r md:border-border`}>
          <div className="bg-navy px-4 py-3 text-paper">
            <p className="font-display text-lg">NSS Chat</p>
            <p className="text-xs text-paper/70">{me?.name || session.name}</p>
          </div>
          {officer ? (
          <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="chat-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a volunteer" className="pl-9" />
              </div>
              <Button className="mt-2 w-full bg-forest text-primary-foreground hover:bg-forest/90" onClick={() => document.getElementById("chat-search")?.focus()}>
                <MessageCircle />
                Personal volunteers ({directory.length})
              </Button>
          </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Personal</p>
            {meId && meId !== "po" ? (
              <button type="button" className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted" onClick={() => openThread(canonicalThread(`dm:${meId}:po`))}>
                <span className="flex size-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-paper">PO</span>
                <span>
                  <span className="block font-medium text-navy">Programme Officer</span>
                  <span className="block text-xs text-muted-foreground">Personal chat</span>
                </span>
              </button>
            ) : null}
            {officer && meId !== "admin" ? (
              <button type="button" className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted" onClick={() => openThread(canonicalThread(`dm:${meId}:admin`))}>
                <span className="flex size-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-paper">AD</span>
                <span>
                  <span className="block font-medium text-navy">Admin</span>
                  <span className="block text-xs text-muted-foreground">Personal chat</span>
                </span>
              </button>
            ) : null}
            {officer && directory.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No volunteer on the roll yet.</p> : null}
            {officer
              ? directory.map((person) => {
                  const thread = canonicalThread(`dm:${meId}:${person.id}`);
                  const photo = roll.find((row) => row.volunteerId === person.id || row.id === person.id)?.photoUrl;
                  const count = unreadCount(thread);
                  return (
                    <button key={person.id} type="button" className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left ${active === thread ? "bg-forest/10" : "hover:bg-muted"}`} onClick={() => openThread(thread)}>
                      {photo ? <img src={photo} alt="" className="size-10 rounded-full object-cover" /> : <span className="flex size-10 items-center justify-center rounded-full bg-forest text-xs font-semibold text-paper">{person.name.slice(0, 1)}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-navy">{person.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{person.unit}{person.id && !looksLikePhone(person.id) ? ` · ${person.id}` : ""}</span>
                      </span>
                      {count > 0 ? <span className="min-w-5 rounded-full bg-forest px-1.5 text-center text-[10px] font-semibold text-white">{count}</span> : null}
                    </button>
                  );
                })
              : null}
            {officer ? <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Groups</p> : null}
            {officer ? allowedGroups.map((group) => threadButton(group.id)) : null}
          </div>
        </aside>
        <section className={`${mobileList ? "hidden" : "flex"} min-w-0 flex-1 flex-col md:flex`}>
          <header className="flex items-center gap-3 bg-navy px-3 py-3 text-paper">
            <button type="button" className="rounded-md p-2 hover:bg-white/10 md:hidden" onClick={() => setMobileList(true)} aria-label="Back to chats">
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{threadTitle(active)}</p>
              <p className="truncate text-xs text-paper/70">
                {active.startsWith("dm:") ? `Personal chat${activePerson ? ` · ${activePerson.unit}` : ""}` : GROUPS.find((group) => group.id === active)?.subtitle}
                {""}
              </p>
            </div>
            {officer && active.startsWith("dm:") && activePhone ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white" onClick={() => openWhatsAppChat(draft)}>
                <Phone className="size-3.5" />
                WhatsApp
              </button>
            ) : null}
          </header>
          {active.startsWith("dm:") && activeRoll ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-3 py-2 text-xs text-navy">
              <span className="font-semibold">Smart record</span>
              <span>{activeRoll.nssRole}</span>
              <span>{activeHours} hours</span>
              <span>{activeRoll.course} Sem {activeRoll.semester}</span>
            </div>
          ) : null}
          {!token ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center" />
          ) : (
            <>
              <div
                ref={scroller}
                onScroll={() => {
                  const node = scroller.current;
                  if (!node) return;
                  stick.current = node.scrollHeight - node.scrollTop - node.clientHeight < 90;
                }}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(#e4d5b4_0.7px,transparent_0.7px)] bg-[length:14px_14px] px-3 py-4"
              >
                {threadMessages.map((message, index) => {
                  const mine = message.senderId === me?.id;
                  const previous = threadMessages[index - 1];
                  const showDay = !previous || previous.createdAt.slice(0, 10) !== message.createdAt.slice(0, 10);
                  return (
                    <div key={message.id}>
                      {showDay ? <p className="mx-auto my-2 w-fit rounded-full bg-white/80 px-3 py-1 text-[11px] text-muted-foreground">{dayLabel(message.createdAt)}</p> : null}
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-sm bg-forest text-white" : "rounded-bl-sm bg-white text-navy"}`}>
                          {!mine && !active.startsWith("dm:") ? <p className="text-[11px] font-semibold text-saffron">{message.senderName}</p> : null}
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                          <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/75" : "text-muted-foreground"}`}>
                            {clock(message.createdAt)}
                            {mine ? <CheckCheck className="size-3.5" /> : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="border-t border-border bg-card p-3" onSubmit={(e) => void send(e)}>
                {active.startsWith("dm:") ? (
                  <div className="mb-2 flex gap-2 overflow-x-auto">
                    {QUICK.map((line) => (
                      <button key={line} type="button" className="shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-navy" onClick={() => setDraft(line)}>
                        {line}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder={active.startsWith("dm:") ? "Personal message" : "Message the group"}
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none focus:border-forest"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()} className="size-11 rounded-full bg-forest p-0 text-primary-foreground hover:bg-forest/90" aria-label="Send">
                    <SendHorizonal />
                  </Button>
                </div>
                {officer && active.startsWith("dm:") ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={alsoWa} onChange={(e) => setAlsoWa(e.target.checked)} />
                    Also open WhatsApp
                  </label>
                ) : null}
              </form>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
