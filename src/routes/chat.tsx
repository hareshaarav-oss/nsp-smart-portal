import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

function ChatPage() {
  const session = useSessionStore((s) => s.session);
  const [me, setMe] = useState<Me | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [active, setActive] = useState("college");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const [mobileList, setMobileList] = useState(true);
  const [sending, setSending] = useState(false);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [liveAt, setLiveAt] = useState(0);
  const [alsoWa, setAlsoWa] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const token = session?.chatToken || "";
  const poWhatsapp = useNssStore((s) => s.settings.poWhatsapp);
  const roll = useNssStore((s) => s.volunteers) ?? [];

  useEffect(() => {
    setSeen(readSeen());
  }, []);

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
        setMe(data.me);
        setPeople(data.people ?? []);
        setMessages(data.messages ?? []);
        setLiveAt(Date.now());
      } catch {
        /* keep the last messages on screen */
      }
    }
    void pull();
    const timer = window.setInterval(() => void pull(), 8000);
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
    if (!me) return group.id === "college";
    if (group.id === "leaders") return me.role === "leader" || me.role === "po" || me.role === "admin";
    if (group.id === "unit-1") return me.role === "po" || me.role === "admin" || me.unit === "Unit 1";
    if (group.id === "unit-2") return me.role === "po" || me.role === "admin" || me.unit === "Unit 2";
    return true;
  });

  const dmThreads = useMemo(() => {
    const ids = new Set<string>();
    for (const message of messages) {
      if (message.threadId.startsWith("dm:")) ids.add(canonicalThread(message.threadId));
    }
    if (active.startsWith("dm:")) ids.add(canonicalThread(active));
    return [...ids].sort((a, b) => (lastOf(b) || "").localeCompare(lastOf(a) || ""));
  }, [messages, active]);

  function lastOf(id: string) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (canonicalThread(messages[i].threadId) === id) return messages[i].createdAt;
    }
    return "";
  }

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
    if (!id) return "";
    if (id === "po" || id === "admin") return poWhatsapp || "";
    const person = people.find((row) => row.id === id);
    if (person?.mobile) return person.mobile;
    const stored = roll.find((row) => row.volunteerId === id || row.id === id);
    return stored?.mobile || "";
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
    setPicking(false);
    setMobileList(false);
    const last = lastMessage(id);
    const next = { ...seen, [id]: last?.createdAt || new Date().toISOString() };
    setSeen(next);
    localStorage.setItem("nsp-chat-seen", JSON.stringify(next));
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "chat-send", chatToken: token, threadId: canonicalThread(active), text }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: ChatMessage };
      if (!res.ok || !data.ok || !data.message) throw new Error(data.error || "Message was not sent.");
      setMessages((current) => [...current.filter((row) => row.id !== data.message?.id), data.message!]);
      setDraft("");
      stick.current = true;
      if (active.startsWith("dm:") && alsoWa && phoneFor(otherId())) openWhatsAppChat(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message was not sent.");
    } finally {
      setSending(false);
    }
  }

  if (!session) return <Navigate to="/login" search={{ role: "volunteer" }} />;

  const threadMessages = messages.filter((message) => canonicalThread(message.threadId) === canonicalThread(active));
  const needle = query.trim().toLowerCase();
  const directory = people.filter((person) => person.id !== me?.id && (!needle || `${person.name} ${person.id} ${person.unit}`.toLowerCase().includes(needle)));
  const matchesThread = (id: string) => !needle || threadTitle(id).toLowerCase().includes(needle) || (lastMessage(id)?.text || "").toLowerCase().includes(needle);
  const personalThreads = dmThreads.filter(matchesThread);
  const groupThreads = allowedGroups.map((group) => group.id).filter(matchesThread);
  const activePerson = people.find((person) => person.id === otherId());
  const activeRoll = roll.find((row) => row.volunteerId === otherId() || row.id === otherId());
  const activeHours = activeRoll ? volunteerHours(useNssStore.getState(), activeRoll.id) : 0;
  const activePhone = phoneFor(otherId());
  const live = liveAt > 0 && Date.now() - liveAt < 6000;

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
      <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-6xl overflow-hidden border-y border-border bg-[#efe7d6] md:my-4 md:rounded-2xl md:border">
        <aside className={`${mobileList ? "flex" : "hidden"} w-full flex-col bg-card md:flex md:w-80 md:border-r md:border-border`}>
          <div className="bg-navy px-4 py-3 text-paper">
            <p className="font-display text-lg">NSS Chat</p>
            <p className="text-xs text-paper/70">{live ? "Live · refreshing" : me?.name || session.name}</p>
          </div>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or chat" className="pl-9" />
            </div>
            <Button className="mt-2 w-full bg-forest text-primary-foreground hover:bg-forest/90" onClick={() => setPicking((open) => !open)}>
              <MessageCircle />
              {picking ? "Back to chats" : "New personal chat"}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {picking ? (
              <div>
                <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Personal</p>
                {me && me.id !== "po" && me.id !== "admin" ? (
                  <button type="button" className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted" onClick={() => openThread(canonicalThread(`dm:${me.id}:po`))}>
                    <span className="flex size-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-paper">PO</span>
                    <span>
                      <span className="block font-medium text-navy">Programme Officer</span>
                      <span className="block text-xs text-muted-foreground">Personal · WhatsApp {poWhatsapp ? "ready" : ""}</span>
                    </span>
                  </button>
                ) : null}
                {directory.map((person) => (
                  <button key={person.id} type="button" className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted" onClick={() => openThread(canonicalThread(`dm:${me?.id}:${person.id}`))}>
                    <span className="flex size-10 items-center justify-center rounded-full bg-forest text-xs font-semibold text-paper">{person.name.slice(0, 1)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-navy">{person.name}</span>
                      <span className="block text-xs text-muted-foreground">{person.id} · {person.unit}{person.mobile ? " · WhatsApp" : ""}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Personal</p>
                {personalThreads.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No personal chat yet. Start one above.</p> : personalThreads.map(threadButton)}
                <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Groups</p>
                {groupThreads.map(threadButton)}
              </div>
            )}
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
                {live ? " · Live" : ""}
              </p>
            </div>
            {active.startsWith("dm:") && activePhone ? (
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
              <span className="text-forest">{live ? "Updating automatically" : "Waiting for refresh"}</span>
            </div>
          ) : null}
          {!token ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="font-medium text-navy">Sign in again to open chat.</p>
              <p className="max-w-sm text-sm text-muted-foreground">Your old login does not have a chat key yet. Sign in once more and the messages will stay on the college roll.</p>
              <Button asChild className="bg-forest text-primary-foreground">
                <Link to="/login" search={{ role: session.role === "po" || session.role === "admin" ? "po" : "volunteer" }}>Go to login</Link>
              </Button>
            </div>
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
                {threadMessages.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p> : null}
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
                {active.startsWith("dm:") ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={alsoWa} onChange={(e) => setAlsoWa(e.target.checked)} />
                    Also open WhatsApp with this message{activePhone ? "" : " when a number is available"}
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
