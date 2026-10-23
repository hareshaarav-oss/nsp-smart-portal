import { useEffect, useState } from "react";
import { useSessionStore } from "@/lib/nss/session";

export function useChatUnread() {
  const token = useSessionStore((s) => s.session?.chatToken || "");
  const me = useSessionStore((s) => s.session?.volunteerId || s.session?.role || "");
  const [count, setCount] = useState(0);

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
        const data = (await res.json()) as { ok?: boolean; messages?: { threadId: string; senderId: string; createdAt: string; text: string }[] };
        if (stop || !data.ok) return;
        const seen = JSON.parse(localStorage.getItem("nsp-chat-seen") || "{}") as Record<string, string>;
        const fresh = (data.messages || []).filter((row) => row.senderId !== me && row.createdAt > (seen[row.threadId] || ""));
        setCount(fresh.length);
        if (fresh.length && Notification.permission === "granted" && document.hidden) {
          const last = fresh[fresh.length - 1];
          new Notification("NSS Chat", { body: last?.text?.slice(0, 80) || "New message" });
        }
      } catch {
        /* stay quiet while offline */
      }
    }
    void pull();
    const timer = window.setInterval(() => void pull(), 30000);
    const ask = () => {
      if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    };
    window.addEventListener("pointerdown", ask, { once: true });
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [token, me]);

  return count;
}
