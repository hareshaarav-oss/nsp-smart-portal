import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, Copy, Eraser, FileText, Lock, MapPin, Mic, MoreVertical, Paperclip, Phone, PhoneOff, Reply, Search, SendHorizonal, Smile, Star, Trash2, UserRound, Video, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/nss/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/lib/nss/session";
import { useNssStore, volunteerHours } from "@/lib/nss/store";
import { openWhatsApp } from "@/lib/nss/whatsapp";

export const Route = createFileRoute("/chat")({ component: ChatPage });

type Person = { id: string; name: string; unit: string; role: string; mobile?: string };
type ChatExtra = {
  kind?: string;
  editedAt?: string;
  expiresAt?: string;
  viewOnce?: boolean;
  opened?: boolean;
  reactions?: Record<string, string>;
  poll?: { q: string; options: string[]; votes: Record<string, string> };
  fileName?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactUnit?: string;
  forwarded?: boolean;
};
type ChatMessage = {
  id: string;
  threadId: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  replyName?: string;
  replyText?: string;
  media?: string;
  mediaType?: "" | "image" | "video" | "audio" | "file";
  extra?: ChatExtra;
};
type Me = { id: string; name: string; role: string; unit: string };

const GROUPS = [
  { id: "channel", title: "NSS Channel", subtitle: "Updates from the Programme Officer" },
  { id: "college", title: "College NSS", subtitle: "Community group" },
  { id: "unit-1", title: "Unit 1", subtitle: "Community group" },
  { id: "unit-2", title: "Unit 2", subtitle: "Community group" },
  { id: "leaders", title: "Leaders", subtitle: "Leaders and Programme Officer" },
];

const STICKERS = ["😀", "😁", "😂", "😊", "😍", "🙏", "👍", "👏", "🎉", "💪", "❤️", "🔥", "🌟", "🇮🇳", "📚", "🏆"];
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const WALLS = ["#efeae2", "#d6eaf8", "#e8f5e9", "#fdebd0", "#111b21"];

type Prefs = {
  stars: string[];
  hidden: string[];
  pins: string[];
  mutes: string[];
  archives: string[];
  marked: string[];
  wallpaper: string;
  dark: boolean;
  lock: string;
  disappear: Record<string, number>;
};

function blankPrefs(): Prefs {
  return { stars: [], hidden: [], pins: [], mutes: [], archives: [], marked: [], wallpaper: "#efeae2", dark: false, lock: "", disappear: {} };
}

function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem("nsp-chat-prefs") || "{}") as Partial<Prefs>;
    const base = blankPrefs();
    return {
      ...base,
      ...raw,
      stars: Array.isArray(raw.stars) ? raw.stars.filter((id) => typeof id === "string") : [],
      hidden: Array.isArray(raw.hidden) ? raw.hidden.filter((id) => typeof id === "string") : [],
      pins: Array.isArray(raw.pins) ? raw.pins.filter((id) => typeof id === "string") : [],
      mutes: Array.isArray(raw.mutes) ? raw.mutes.filter((id) => typeof id === "string") : [],
      archives: Array.isArray(raw.archives) ? raw.archives.filter((id) => typeof id === "string") : [],
      marked: Array.isArray(raw.marked) ? raw.marked.filter((id) => typeof id === "string") : [],
      wallpaper: typeof raw.wallpaper === "string" ? raw.wallpaper : base.wallpaper,
      disappear: raw.disappear && typeof raw.disappear === "object" ? raw.disappear : {},
    };
  } catch {
    return blankPrefs();
  }
}

function pinHash(value: string) {
  let hash = 2166136261;
  for (const ch of value) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}

function firstLink(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/i);
  if (!match) return "";
  try {
    return new URL(match[0]).toString();
  } catch {
    return "";
  }
}

const EMOJI = ["😀", "😁", "😂", "😊", "😍", "🙏", "👍", "👏", "🎉", "💪", "✅", "❤️", "🔥", "🌟", "🇮🇳", "📚", "🏆", "⏰"];

function previewLine(message: { text?: string; mediaType?: string }) {
  if (message.mediaType === "image") return message.text || "Photo";
  if (message.mediaType === "video") return message.text || "Video";
  return message.text || "";
}

function readData(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

async function shrinkImage(file: File) {
  const src = await readData(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Photo could not be opened."));
    img.src = src;
  });
  const scale = Math.min(1, 720 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.52);
}

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
  const [emojiOn, setEmojiOn] = useState(false);
  const [reply, setReply] = useState<{ name: string; text: string } | null>(null);
  const [picked, setPicked] = useState("");
  const [ask, setAsk] = useState<"" | "clear" | "delete">("");
  const [pending, setPending] = useState<{ media: string; mediaType: "image" | "video" | "audio" | "file"; name?: string } | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(blankPrefs);
  const [menu, setMenu] = useState(false);
  const [finder, setFinder] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinDraft, setPinDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [archivesOn, setArchivesOn] = useState(false);
  const [starredOn, setStarredOn] = useState(false);
  const [pollOn, setPollOn] = useState(false);
  const [pollOptions, setPollOptions] = useState("Yes, No");
  const [peer, setPeer] = useState<{ lastSeen?: string; typingThread?: string; typingAt?: string; readThread?: string; readAt?: string; call?: string; callThread?: string; callAt?: string; sdp?: string } | null>(null);
  const [statuses, setStatuses] = useState<{ id: string; text: string; senderId: string; senderName: string; createdAt: string }[]>([]);
  const [callOn, setCallOn] = useState<"" | "audio" | "video">("");
  const [viewOnce, setViewOnce] = useState(false);
  const [forwarded, setForwarded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const mediaBag = useRef(new Map<string, { media: string; mediaType: "image" | "video" | "audio" | "file" }>());
  const recorder = useRef<MediaRecorder | null>(null);
  const draftRef = useRef("");
  const token = session?.chatToken || "";
  const setSession = useSessionStore((s) => s.setSession);
  const poWhatsapp = useNssStore((s) => s.settings.poWhatsapp);
  const roll = useNssStore((s) => s.volunteers) ?? [];

  useEffect(() => {
    setSeen(readSeen());
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (peer?.call !== "answer" || !peer.sdp || !callPeer.current?.localDescription) return;
    void callPeer.current.setRemoteDescription({ type: "answer", sdp: peer.sdp }).catch(() => undefined);
  }, [peer]);

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
        const incoming = (data.messages ?? []).map((row) => {
          const kept = mediaBag.current.get(row.id);
          return kept && !row.media ? { ...row, media: kept.media, mediaType: kept.mediaType } : row;
        });
        setMessages((current) => {
          if (
            current.length === incoming.length &&
            current.every((row, index) => row.id === incoming[index]?.id && row.text === incoming[index]?.text && row.media === incoming[index]?.media)
          ) {
            return current;
          }
          return incoming;
        });
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
    if (!token) return;
    const thread = canonicalThread(active);
    const missing = messages
      .filter((message) => canonicalThread(message.threadId) === thread && message.mediaType && !message.media && !mediaBag.current.has(message.id))
      .slice(0, 4)
      .map((message) => message.id);
    if (!missing.length) return;
    let stop = false;
    void fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "chat-media", chatToken: token, ids: missing }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; media?: { id: string; media: string; mediaType: "image" | "video" }[] }) => {
        if (stop || !data.ok || !data.media?.length) return;
        for (const row of data.media) {
          if (row.media) mediaBag.current.set(row.id, { media: row.media, mediaType: row.mediaType });
        }
        setMessages((current) =>
          current.map((message) => {
            const kept = mediaBag.current.get(message.id);
            return kept && !message.media ? { ...message, media: kept.media, mediaType: kept.mediaType } : message;
          }),
        );
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [token, active, messages]);

  useEffect(() => {
    if (!token) return;
    const other = active.startsWith("dm:") ? active.slice(3).split(":").find((part) => part !== (me?.id || "")) || "" : "";
    let stop = false;
    const push = () => {
      void fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "chat-presence",
          chatToken: token,
          threadId: active,
          peerId: other,
          typing: draftRef.current.trim().length > 0,
        }),
      })
        .then((res) => res.json())
        .then((data: { ok?: boolean; peer?: typeof peer; statuses?: typeof statuses }) => {
          if (stop || !data.ok) return;
          setPeer(data.peer ?? null);
          if (data.statuses) setStatuses(data.statuses);
        })
        .catch(() => undefined);
    };
    push();
    const timer = window.setInterval(push, 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [token, active, me?.id]);

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

  const allowedGroups = GROUPS.filter((group) => group.id === "channel" || session?.role === "po" || session?.role === "admin");

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

  async function attachFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.type.startsWith("video/")) {
        if (file.size > 380000) {
          toast.error("Video is too large.");
          return;
        }
        const media = await readData(file);
        if (!media.startsWith("data:video/") || media.length > 520000) {
          toast.error("Video is too large.");
          return;
        }
        setPending({ media, mediaType: "video" });
        return;
      }
      if (!file.type.startsWith("image/") || file.type === "image/gif") {
        if (file.size > 380000) {
          toast.error("That file is too large.");
          return;
        }
        const media = await readData(file);
        if (!media.startsWith("data:") || media.length > 500000) {
          toast.error("That file is too large.");
          return;
        }
        setPending({ media, mediaType: file.type.startsWith("image/") ? "image" : "file", name: file.name });
        return;
      }
      const media = await shrinkImage(file);
      if (!media.startsWith("data:image/") || media.length > 520000) {
        toast.error("Photo is too large.");
        return;
      }
      setPending({ media, mediaType: "image" });
    } catch {
      toast.error("Could not attach that file.");
    }
  }

  async function send(e?: React.FormEvent, threadId = active) {
    e?.preventDefault();
    const text = draft.trim();
    const attachment = pending;
    if ((!text && !attachment && !pollOn) || sending) return;
    const desk = session?.role === "po" || session?.role === "admin";
    const mine = me?.id || session?.volunteerId || "";
    const thread = desk ? canonicalThread(threadId) : mine ? canonicalThread(`dm:${mine}:po`) : "";
    if (!thread || (!desk && !thread.endsWith(":po") && !thread.includes(":po"))) return;
    const hours = prefs.disappear[thread] || 0;
    setSending(true);
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "chat-send",
          chatToken: token,
          threadId: thread,
          text,
          replyName: reply?.name || "",
          replyText: reply?.text || "",
          media: attachment?.media || "",
          mediaType: attachment?.mediaType || "",
          fileName: attachment?.name || "",
          kind: pollOn ? "poll" : attachment?.mediaType === "file" ? "file" : "",
          pollOptions: pollOn ? pollOptions.split(",").map((item) => item.trim()).filter(Boolean) : [],
          expiresAt: hours ? new Date(Date.now() + hours * 3600000).toISOString() : "",
          viewOnce,
          forwarded,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: ChatMessage };
      if (!res.ok || !data.ok || !data.message) throw new Error(data.error || "Message was not sent.");
      setMessages((current) => [...current.filter((row) => row.id !== data.message?.id), data.message!]);
      setDraft("");
      setReply(null);
      setPending(null);
      setEmojiOn(false);
      setPollOn(false);
      setViewOnce(false);
      setForwarded(false);
      setSheet(false);
      stick.current = true;
      if ((session?.role === "po" || session?.role === "admin") && active.startsWith("dm:") && alsoWa && phoneFor(otherId())) openWhatsAppChat(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message was not sent.");
    } finally {
      setSending(false);
    }
  }

  function savePrefs(next: Prefs) {
    setPrefs(next);
    localStorage.setItem("nsp-chat-prefs", JSON.stringify(next));
  }

  function togglePref(key: "stars" | "hidden" | "pins" | "mutes" | "archives" | "marked", id: string) {
    const has = prefs[key].includes(id);
    savePrefs({ ...prefs, [key]: has ? prefs[key].filter((item) => item !== id) : [...prefs[key], id] });
  }

  async function patchMessage(action: string, messageId: string, fields: Record<string, unknown> = {}) {
    const res = await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, chatToken: token, messageId, ...fields }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; text?: string; extra?: ChatExtra };
    if (!res.ok || !data.ok) throw new Error(data.error || "Could not update that message.");
    setMessages((current) => current.map((row) => (row.id === messageId ? { ...row, text: data.text ?? row.text, extra: data.extra ?? row.extra, media: action === "chat-once" ? "" : row.media } : row)));
  }

  async function toggleVoice() {
    if (recorder.current && recorder.current.state === "recording") {
      recorder.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const bits: Blob[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) bits.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(bits, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 380000) {
          toast.error("Voice message is too long.");
          return;
        }
        void readData(new File([blob], "voice.webm", { type: blob.type })).then((media) => {
          if (media.startsWith("data:") && media.length < 520000) setPending({ media, mediaType: "audio", name: "Voice message" });
        });
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone is not available.");
    }
  }

  async function postChat(fields: Record<string, unknown>, threadId = active) {
    const desk = session?.role === "po" || session?.role === "admin";
    const mine = me?.id || session?.volunteerId || "";
    const thread = desk ? canonicalThread(threadId) : mine ? canonicalThread(`dm:${mine}:po`) : "";
    if (!thread || (!desk && !thread.includes(":po"))) return;
    const res = await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "chat-send", chatToken: token, threadId: thread, ...fields }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; message?: ChatMessage };
    if (!res.ok || !data.ok || !data.message) throw new Error(data.error || "Message was not sent.");
    setMessages((current) => [...current.filter((row) => row.id !== data.message?.id), data.message!]);
    setSheet(false);
    setEmojiOn(false);
  }

  function sendSticker(emoji: string, threadId: string) {
    void postChat({ text: emoji, kind: "sticker" }, threadId).catch((error) => toast.error(error instanceof Error ? error.message : "Sticker was not sent."));
  }

  function sendContact(personId: string) {
    const person = people.find((row) => row.id === personId);
    const name = personId === "po" ? "Programme Officer" : personId === "admin" ? "Admin" : person?.name || me?.name || "NSS";
    const unit = person?.unit || me?.unit || "";
    void postChat({ text: name, kind: "contact", contactName: name, contactUnit: unit }, active).catch((error) => toast.error(error instanceof Error ? error.message : "Contact was not sent."));
  }

  const callPeer = useRef<RTCPeerConnection | null>(null);

  async function ring(kind: "" | "audio" | "video" | "answer", sdp = "") {
    await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "chat-presence", chatToken: token, threadId: active, peerId: otherId(), call: kind, sdp, typing: false }),
    });
  }

  function endCall() {
    callPeer.current?.close();
    callPeer.current = null;
    setCallOn("");
    void ring("");
  }

  async function startCall(kind: "audio" | "video", remoteSdp?: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      callPeer.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = () => setCallOn(kind);
      if (remoteSdp) {
        await pc.setRemoteDescription({ type: "offer", sdp: remoteSdp });
        await pc.setLocalDescription(await pc.createAnswer());
        await new Promise((resolve) => setTimeout(resolve, 1200));
        await ring("answer", pc.localDescription?.sdp || "");
      } else {
        await pc.setLocalDescription(await pc.createOffer());
        await new Promise((resolve) => setTimeout(resolve, 1200));
        await ring(kind, pc.localDescription?.sdp || "");
      }
      setCallOn(kind);
    } catch {
      toast.error("Call could not start.");
    }
  }

  async function broadcast() {
    const text = draft.trim();
    if (!text || !officer) return;
    for (const person of directory.slice(0, 12)) {
      await postChat({ text, kind: "broadcast" }, canonicalThread(`dm:${meId}:${person.id}`)).catch(() => undefined);
    }
    setDraft("");
  }

  async function shareLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setDraft(link);
      },
      () => toast.error("Location was not shared."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function erase(messageId: string) {
    if (!messageId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "chat-delete", chatToken: token, messageId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Message was not deleted.");
      setMessages((current) => current.filter((row) => row.id !== messageId));
      setPicked("");
      setAsk("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message was not deleted.");
    } finally {
      setSending(false);
    }
  }

  async function clearThread(threadId: string) {
    if (!threadId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "chat-clear", chatToken: token, threadId: canonicalThread(threadId) }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Chat was not cleared.");
      const gone = canonicalThread(threadId);
      setMessages((current) => current.filter((row) => canonicalThread(row.threadId) !== gone));
      setPicked("");
      setAsk("");
      setReply(null);
      setPending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat was not cleared.");
    } finally {
      setSending(false);
    }
  }

  if (!session) return <Navigate to="/login" search={{ role: "volunteer" }} />;

  const officer = (session.role === "po" || session.role === "admin") && (!me || me.role === "po" || me.role === "admin");
  const meId = me?.id || (session.role === "po" ? "po" : session.role === "admin" ? "admin" : session.volunteerId || "");
  const poThread = meId && meId !== "po" ? canonicalThread(`dm:${meId}:po`) : "";

  function talk(list: ChatMessage[], threadId: string, showNames: boolean) {
    const chosen = list.find((message) => message.id === picked);
    const canDelete = Boolean(chosen && (officer || chosen.senderId === me?.id || chosen.senderId === meId));
    return (
      <>
        <div
          ref={scroller}
          onScroll={() => {
            const node = scroller.current;
            if (!node) return;
            stick.current = node.scrollHeight - node.scrollTop - node.clientHeight < 90;
          }}
          style={{ backgroundColor: prefs.wallpaper }}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-[radial-gradient(#d9d0c3_0.6px,transparent_0.6px)] bg-[length:16px_16px] px-3 py-3"
        >
          {list.filter((message) => !prefs.hidden.includes(message.id) && (!starredOn || prefs.stars.includes(message.id)) && (!finder || `${message.text} ${message.senderName}`.toLowerCase().includes(finder.toLowerCase()))).map((message, index, shown) => {
            const mine = message.senderId === me?.id || message.senderId === meId;
            const previous = shown[index - 1];
            const showDay = !previous || previous.createdAt.slice(0, 10) !== message.createdAt.slice(0, 10);
            const extra = message.extra || {};
            const link = firstLink(message.text);
            const read = Boolean(peer?.readThread === canonicalThread(threadId) && (peer?.readAt || "") >= message.createdAt);
            const delivered = Boolean(peer?.lastSeen && peer.lastSeen >= message.createdAt);
            const sticker = extra.kind === "sticker";
            return (
              <div key={message.id}>
                {showDay ? <p className="mx-auto my-2 w-fit rounded-full bg-white/80 px-3 py-1 text-[11px] text-[#54656f]">{dayLabel(message.createdAt)}</p> : null}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`max-w-[82%] rounded-lg px-2 py-1 text-left shadow-sm ${mine ? "rounded-tr-none bg-[#d9fdd3] text-[#111b21]" : "rounded-tl-none bg-white text-[#111b21]"} ${picked === message.id ? "ring-2 ring-[#25d366]" : ""}`}
                    onClick={() => {
                      setAsk("");
                      setPicked((current) => (current === message.id ? "" : message.id));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setPicked((current) => (current === message.id ? "" : message.id));
                    }}
                  >
                    {showNames && !mine ? <p className="px-1 text-[12px] font-semibold text-[#0b846d]">{message.senderName}</p> : null}
                    {extra.forwarded ? <p className="px-1 text-[11px] italic text-[#667781]">Forwarded</p> : null}
                    {message.replyText ? <p className="mb-1 rounded-md bg-black/5 px-2 py-1 text-[11px] text-[#111b21]">{message.replyName ? `${message.replyName}: ` : ""}{message.replyText}</p> : null}
                    {extra.viewOnce && !message.media ? <p className="px-1 text-sm">Opened</p> : null}
                    {extra.viewOnce && message.media ? (
                      <button type="button" className="px-1 text-sm underline" onClick={(event) => { event.stopPropagation(); void patchMessage("chat-once", message.id).then(() => { if (message.media) window.open(message.media, "_blank", "noopener"); }); }}>View once</button>
                    ) : null}
                    {!extra.viewOnce && message.mediaType === "image" && message.media ? <img src={message.media} alt="" className="mb-1 max-h-64 rounded-md object-cover" /> : null}
                    {!extra.viewOnce && message.mediaType === "video" && message.media ? <video src={message.media} controls className="mb-1 max-h-64 w-full rounded-md" onClick={(e) => e.stopPropagation()} /> : null}
                    {message.mediaType === "audio" && message.media ? <audio src={message.media} controls className="mb-1 w-56" onClick={(e) => e.stopPropagation()} /> : null}
                    {message.mediaType === "file" && message.media ? <a href={message.media} download={extra.fileName || "file"} className="mb-1 flex items-center gap-1 px-1 text-sm underline" onClick={(e) => e.stopPropagation()}><FileText className="size-4" />{extra.fileName || "Document"}</a> : null}
                    {message.mediaType && !message.media && !extra.opened ? <p className="px-1 text-xs text-[#667781]">Loading…</p> : null}
                    {extra.poll ? (
                      <div className="px-1 py-1">
                        <p className="text-sm font-medium">{extra.poll.q}</p>
                        {extra.poll.options.map((option, optionIndex) => {
                          const votes = Object.values(extra.poll?.votes || {}).filter((vote) => vote === String(optionIndex)).length;
                          return (
                            <button key={option} type="button" className="mt-1 block w-full rounded-md bg-black/5 px-2 py-1 text-left text-sm" onClick={(event) => { event.stopPropagation(); void patchMessage("chat-vote", message.id, { option: optionIndex }).catch((error) => toast.error(error instanceof Error ? error.message : "Vote was not saved.")); }}>
                              {option} · {votes}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    {extra.contactName ? <p className="px-1 text-sm"><UserRound className="mr-1 inline size-4" />{extra.contactName}{extra.contactUnit ? ` · ${extra.contactUnit}` : ""}</p> : null}
                    {sticker ? <p className="px-1 text-5xl leading-none">{message.text}</p> : null}
                    {!sticker && !extra.poll && message.text ? <p className="whitespace-pre-wrap break-words px-1 text-[14.5px] leading-snug">{message.text}</p> : null}
                    {link ? <a href={link} target="_blank" rel="noreferrer" className="mx-1 mt-1 block rounded-md bg-black/5 px-2 py-1 text-xs text-[#027eb5]" onClick={(e) => e.stopPropagation()}>{link.replace(/^https?:\/\//, "").slice(0, 48)}</a> : null}
                    {extra.reactions && Object.keys(extra.reactions).length ? <p className="px-1 text-sm">{Object.values(extra.reactions).join(" ")}</p> : null}
                    <p className="mt-0.5 flex items-center justify-end gap-1 px-1 text-[11px] text-[#667781]">
                      {prefs.stars.includes(message.id) ? <Star className="size-3 fill-current" /> : null}
                      {extra.editedAt ? <span>Edited</span> : null}
                      {clock(message.createdAt)}
                      {mine ? delivered || read ? <CheckCheck className={`size-3.5 ${read ? "text-[#53bdeb]" : ""}`} /> : <Check className="size-3.5" /> : null}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {chosen ? (
          <div className="flex flex-wrap items-center gap-1 border-t border-border bg-white px-2 py-1">
            {REACTIONS.map((emoji) => (
              <button key={emoji} type="button" className="px-1 text-base" onClick={() => void patchMessage("chat-react", chosen.id, { emoji }).catch((error) => toast.error(error instanceof Error ? error.message : "Reaction was not saved."))}>{emoji}</button>
            ))}
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-navy" onClick={() => { setReply({ name: chosen.senderName, text: previewLine(chosen).slice(0, 140) }); setPicked(""); }}>
              <Reply className="size-3.5" /> Reply
            </button>
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-navy" onClick={() => { void navigator.clipboard?.writeText(chosen.text || previewLine(chosen)); setPicked(""); }}>
              <Copy className="size-3.5" /> Copy
            </button>
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-navy" onClick={() => { togglePref("stars", chosen.id); setPicked(""); }}>
              <Star className="size-3.5" /> Star
            </button>
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-navy" onClick={() => { setDraft(chosen.text); setForwarded(true); setPicked(""); }}>
              Forward
            </button>
            {chosen.senderId === me?.id || chosen.senderId === meId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-navy" onClick={() => { const next = window.prompt("Edit message", chosen.text); if (next && next.trim()) void patchMessage("chat-edit", chosen.id, { text: next.trim() }).catch((error) => toast.error(error instanceof Error ? error.message : "Edit was not saved.")); }}>
                Edit
              </button>
            ) : null}
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-navy" onClick={() => { togglePref("hidden", chosen.id); setPicked(""); }}>
              Delete for me
            </button>
            {canDelete ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-red-700" onClick={() => setAsk("delete")}>
                <Trash2 className="size-3.5" /> Delete for everyone
              </button>
            ) : null}
          </div>
        ) : null}
        {ask === "delete" && chosen ? (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-white px-3 py-2 text-sm text-navy">
            <span>Delete for everyone</span>
            <span className="flex gap-2">
              <button type="button" className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white" onClick={() => void erase(chosen.id)}>Delete</button>
              <button type="button" className="rounded-full px-3 py-1 text-xs" onClick={() => setAsk("")}>Cancel</button>
            </span>
          </div>
        ) : null}
        {ask === "clear" ? (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-white px-3 py-2 text-sm text-navy">
            <span>Clear this chat</span>
            <span className="flex gap-2">
              <button type="button" className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white" onClick={() => void clearThread(threadId)}>Clear</button>
              <button type="button" className="rounded-full px-3 py-1 text-xs" onClick={() => setAsk("")}>Cancel</button>
            </span>
          </div>
        ) : null}
        {threadId === "channel" && !officer ? <div className="bg-[#f0f2f5] px-3 py-3 text-center text-xs text-[#667781]">Only the Programme Officer can post here.</div> : (
        <form className="bg-[#f0f2f5] px-2 py-2" onSubmit={(e) => void send(e, threadId)}>
          {reply ? (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-navy">
              <span className="min-w-0 truncate">{reply.name}: {reply.text}</span>
              <button type="button" aria-label="Cancel reply" onClick={() => setReply(null)}><X className="size-3.5" /></button>
            </div>
          ) : null}
          {pending ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-navy">
              {pending.mediaType === "image" ? <img src={pending.media} alt="" className="size-10 rounded object-cover" /> : <span>{pending.name || pending.mediaType}</span>}
              <button type="button" aria-label="Remove attachment" onClick={() => setPending(null)}><X className="size-3.5" /></button>
            </div>
          ) : null}
          {sheet ? (
            <div className="mb-2 grid grid-cols-4 gap-2 text-center text-[11px] text-[#111b21]">
              <label className="rounded-lg bg-white py-2">Photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void attachFile(file); }} /></label>
              <label className="rounded-lg bg-white py-2">Video<input type="file" accept="video/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void attachFile(file); }} /></label>
              <label className="rounded-lg bg-white py-2">GIF<input type="file" accept="image/gif" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void attachFile(file); }} /></label>
              <label className="rounded-lg bg-white py-2">Document<input type="file" accept=".pdf,.txt,.doc,.docx,application/pdf" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void attachFile(file); }} /></label>
              <button type="button" className="rounded-lg bg-white py-2" onClick={() => { setEmojiOn(true); setSheet(false); }}>Sticker</button>
              <button type="button" className="rounded-lg bg-white py-2" onClick={() => { const person = otherId(threadId); setDraft(""); void sendContact(person); }}>Contact</button>
              <button type="button" className="rounded-lg bg-white py-2" onClick={() => { setSheet(false); void shareLocation(); }}><MapPin className="mx-auto size-4" />Location</button>
              {officer ? <button type="button" className="rounded-lg bg-white py-2" onClick={() => setPollOn(true)}>Poll</button> : null}
            </div>
          ) : null}
          {emojiOn ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {STICKERS.map((emoji) => (
                <button key={emoji} type="button" className="rounded-md px-1.5 py-1 text-2xl" onClick={() => { setDraft(emoji); setEmojiOn(false); void sendSticker(emoji, threadId); }}>{emoji}</button>
              ))}
              {EMOJI.map((emoji) => (
                <button key={emoji} type="button" className="rounded-md px-1.5 py-1 text-lg" onClick={() => setDraft((current) => `${current}${emoji}`)}>{emoji}</button>
              ))}
            </div>
          ) : null}
          {pollOn ? <input value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} className="mb-2 w-full rounded-lg px-3 py-2 text-sm" placeholder="Yes, No, Maybe" /> : null}
          {pending && (pending.mediaType === "image" || pending.mediaType === "video") ? (
            <label className="mb-2 flex items-center gap-2 text-xs text-[#667781]"><input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} />View once</label>
          ) : null}
          <div className="flex items-end gap-2">
            <button type="button" className="flex size-11 items-center justify-center rounded-full text-[#54656f]" aria-label="Emoji" onClick={() => { setSheet(false); setEmojiOn((on) => !on); }}>
              <Smile className="size-5" />
            </button>
            <button type="button" className="flex size-11 items-center justify-center rounded-full text-[#54656f]" aria-label="Attach" onClick={() => setSheet((on) => !on)}>
              <Paperclip className="size-5" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(undefined, threadId);
                }
              }}
              rows={1}
              placeholder="Message"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-sm outline-none"
            />
            {draft.trim() || pending || pollOn ? (
              <Button type="submit" disabled={sending || !threadId} className="size-11 rounded-full bg-[#00a884] p-0 text-white hover:bg-[#008f72]" aria-label="Send">
                <SendHorizonal />
              </Button>
            ) : (
              <button type="button" className={`flex size-11 items-center justify-center rounded-full text-white ${recording ? "bg-red-600" : "bg-[#00a884]"}`} aria-label="Voice message" onClick={() => void toggleVoice()}>
                <Mic className="size-5" />
              </button>
            )}
          </div>
          {officer && threadId.startsWith("dm:") ? (
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={alsoWa} onChange={(e) => setAlsoWa(e.target.checked)} />
              Also open WhatsApp
            </label>
          ) : null}
        </form>
        )}
      </>
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
      .sort((a, b) => Number(prefs.pins.includes(`dm:${[meId, b.id].sort().join(":")}`)) - Number(prefs.pins.includes(`dm:${[meId, a.id].sort().join(":")}`)) || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  })();
  const activePerson = directory.find((person) => person.id === otherId()) || people.find((person) => person.id === otherId());
  const activeRoll = roll.find((row) => row.volunteerId === otherId() || row.id === otherId());
  const activeHours = activeRoll ? volunteerHours(useNssStore.getState(), activeRoll.id) : 0;
  const activePhone = phoneFor(otherId());

  function threadButton(id: string) {
    const last = lastMessage(id);
    const group = GROUPS.find((item) => item.id === id);
    const archived = prefs.archives.includes(id);
    if (archivesOn ? !archived : archived) return null;
    const count = prefs.mutes.includes(id) ? 0 : prefs.marked.includes(id) ? Math.max(1, unreadCount(id)) : unreadCount(id);
    return (
      <button key={id} type="button" className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left ${active === id ? "bg-forest/10" : "hover:bg-muted"}`} onClick={() => openThread(id)}>
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-paper ${group ? "bg-navy" : "bg-forest"}`}>{group ? group.title.slice(0, 1) : threadTitle(id).slice(0, 1)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-navy">{threadTitle(id)}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{last ? clock(last.createdAt) : ""}</span>
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">{last ? previewLine(last) : group?.subtitle || "Personal chat"}</span>
            {count > 0 ? <span className="min-w-5 rounded-full bg-forest px-1.5 text-center text-[10px] font-semibold text-white">{count}</span> : null}
          </span>
        </span>
      </button>
    );
  }

  if (prefs.lock && !unlocked) {
    return (
      <AppShell eyebrow="NSS CHAT" current="page">
        <form className="mx-auto mt-16 flex max-w-xs flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (pinHash(pinDraft) === prefs.lock) setUnlocked(true); else toast.error("Wrong PIN"); }}>
          <Lock className="mx-auto size-8 text-[#075e54]" />
          <input value={pinDraft} onChange={(e) => setPinDraft(e.target.value)} inputMode="numeric" className="rounded-lg border px-3 py-2 text-center" />
          <Button type="submit" className="bg-[#075e54] text-white">Open</Button>
        </form>
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="NSS CHAT" current="page">
      <div className={`mx-auto flex h-[calc(100dvh-13.5rem)] w-full max-w-6xl overflow-hidden border-y border-[#d1d7db] md:my-4 md:h-[calc(100dvh-8.5rem)] md:rounded-xl md:border ${prefs.dark ? "bg-[#0b141a]" : "bg-[#efeae2]"}`}>
        <aside className={`${mobileList ? "flex" : "hidden"} w-full flex-col md:flex md:w-80 md:border-r md:border-[#d1d7db] ${prefs.dark ? "bg-[#111b21] text-white" : "bg-white"}`}>
          <div className="bg-[#075e54] px-4 py-3 text-white">
            <p className="font-medium">Chats</p>
            <p className="text-xs text-white/70">{me?.name || session.name}</p>
          </div>
          {officer ? (
          <div className="border-b border-[#d1d7db] bg-white p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[#667781]" />
                <Input id="chat-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="rounded-lg border-0 bg-[#f0f2f5] pl-9" />
              </div>
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
                  const archived = prefs.archives.includes(thread);
                  if (archivesOn ? !archived : archived) return null;
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
            {officer ? <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">NSS Community</p> : <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Channel</p>}
            {allowedGroups.map((group) => threadButton(group.id))}
          </div>
        </aside>
        <section className={`${mobileList ? "hidden" : "flex"} min-w-0 flex-1 flex-col md:flex`}>
          <header className="flex items-center gap-3 bg-[#075e54] px-2 py-2 text-white">
            <button type="button" className="rounded-md p-2 hover:bg-white/10 md:hidden" onClick={() => setMobileList(true)} aria-label="Back to chats">
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{threadTitle(active)}</p>
              <p className="truncate text-xs text-white/70">
                {peer?.typingThread === canonicalThread(active) && peer.typingAt && Date.now() - new Date(peer.typingAt).getTime() < 25000
                  ? "typing..."
                  : peer?.lastSeen && Date.now() - new Date(peer.lastSeen).getTime() < 40000
                    ? "online"
                    : peer?.lastSeen
                      ? `last seen ${clock(peer.lastSeen)}`
                      : active.startsWith("dm:")
                        ? "encrypted"
                        : GROUPS.find((group) => group.id === active)?.subtitle}
              </p>
            </div>
            {active.startsWith("dm:") ? (
              <>
                <button type="button" className="rounded-full p-2 hover:bg-white/10" aria-label="Voice call" onClick={() => void startCall("audio")}><Phone className="size-4" /></button>
                <button type="button" className="rounded-full p-2 hover:bg-white/10" aria-label="Video call" onClick={() => void startCall("video")}><Video className="size-4" /></button>
              </>
            ) : null}
            <button type="button" className="rounded-full p-2 hover:bg-white/10" aria-label="Menu" onClick={() => setMenu((on) => !on)}>
              <MoreVertical className="size-4" />
            </button>
          </header>
          {menu ? (
            <div className="flex flex-wrap gap-2 bg-[#075e54] px-3 pb-3 text-xs text-white">
              <button type="button" onClick={() => { setFinder(finder ? "" : " "); setMenu(false); }}>Search</button>
              <button type="button" onClick={() => { setStarredOn((on) => !on); setMenu(false); }}>Starred</button>
              <button type="button" onClick={() => { togglePref("pins", canonicalThread(active)); setMenu(false); }}>Pin</button>
              <button type="button" onClick={() => { togglePref("mutes", canonicalThread(active)); setMenu(false); }}>Mute</button>
              <button type="button" onClick={() => { togglePref("archives", canonicalThread(active)); setMenu(false); }}>Archive</button>
              <button type="button" onClick={() => { togglePref("marked", canonicalThread(active)); setMenu(false); }}>Unread</button>
              <button type="button" onClick={() => { const hours = prefs.disappear[canonicalThread(active)] ? 0 : 24; savePrefs({ ...prefs, disappear: { ...prefs.disappear, [canonicalThread(active)]: hours } }); setMenu(false); }}>Disappearing</button>
              <button type="button" onClick={() => { const next = WALLS[(WALLS.indexOf(prefs.wallpaper) + 1) % WALLS.length]; savePrefs({ ...prefs, wallpaper: next }); setMenu(false); }}>Wallpaper</button>
              <button type="button" onClick={() => { savePrefs({ ...prefs, dark: !prefs.dark }); setMenu(false); }}>Dark mode</button>
              <button type="button" onClick={() => { const pin = window.prompt("4 digit chat lock", ""); if (pin && pin.length >= 4) { savePrefs({ ...prefs, lock: pinHash(pin) }); setUnlocked(false); } setMenu(false); }}>Lock</button>
              {active.startsWith("dm:") ? <button type="button" onClick={() => { void fetch("/api/nss-cloud", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "chat-block", chatToken: token, blockId: otherId() }) }); setMenu(false); }}>Block</button> : null}
              <button type="button" onClick={() => { const status = window.prompt("Status", ""); if (status?.trim()) void fetch("/api/nss-cloud", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "chat-status", chatToken: token, text: status.trim() }) }); setMenu(false); }}>Status</button>
              {officer ? <button type="button" onClick={() => { void broadcast(); setMenu(false); }}>Broadcast</button> : null}
              <button type="button" onClick={() => { setArchivesOn((on) => !on); setMenu(false); }}>Archived chats</button>
              <button type="button" onClick={() => { const blob = new Blob([JSON.stringify(messages.map((row) => ({ ...row, media: row.media ? "attached" : "" })))], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "nss-chat-backup.json"; link.click(); setMenu(false); }}>Backup</button>
              <button type="button" onClick={() => { setAsk("clear"); setMenu(false); }}>Clear chat</button>
              {!active.startsWith("dm:") ? <span>Admin: Programme Officer</span> : null}
            </div>
          ) : null}
          {finder ? <input value={finder.trim() ? finder : ""} onChange={(e) => setFinder(e.target.value)} placeholder="Search in chat" className="border-b px-3 py-2 text-sm outline-none" /> : null}
          {statuses.length ? (
            <div className="flex gap-3 overflow-x-auto bg-white px-3 py-2">
              {statuses.slice(0, 8).map((status) => (
                <button key={status.id} type="button" className="w-16 shrink-0 text-center text-[10px]" onClick={() => toast(status.text)}>
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full border-2 border-[#25d366] text-xs">{status.senderName.slice(0, 1)}</span>
                  {status.senderName.split(" ")[0]}
                </button>
              ))}
            </div>
          ) : null}
          {callOn ? (
            <div className="flex items-center justify-between bg-[#111b21] px-3 py-2 text-sm text-white">
              <span>{callOn === "video" ? "Video call" : "Voice call"}</span>
              <button type="button" className="rounded-full bg-red-600 p-2" aria-label="End call" onClick={() => endCall()}><PhoneOff className="size-4" /></button>
            </div>
          ) : (peer?.call === "audio" || peer?.call === "video") && peer.callThread === canonicalThread(active) && !callOn ? (
            <div className="flex items-center justify-between bg-[#111b21] px-3 py-2 text-sm text-white">
              <span>Incoming {peer.call} call</span>
              <button type="button" className="rounded-full bg-[#00a884] px-3 py-1" onClick={() => void startCall(peer.call === "video" ? "video" : "audio", peer.sdp)}>Answer</button>
            </div>
          ) : null}
          {active.startsWith("dm:") && activeRoll ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-3 py-2 text-xs text-navy">
              <span className="font-semibold">Smart record</span>
              <span>{activeRoll.nssRole}</span>
              <span>{activeHours} hours</span>
              <span>{activeRoll.course} Sem {activeRoll.semester}</span>
            </div>
          ) : null}
          {!token ? <div className="flex flex-1" /> : talk(threadMessages, canonicalThread(active), !active.startsWith("dm:"))}
        </section>
      </div>
    </AppShell>
  );
}
