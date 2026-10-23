import { useEffect, useState } from "react";
import { useNssStore } from "@/lib/nss/store";
import { outboxCount } from "@/lib/nss/dual-store";

function DualStatus() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
      setPending(await outboxCount());
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 60000);
    window.addEventListener("online", tick);
    window.addEventListener("offline", tick);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("online", tick);
      window.removeEventListener("offline", tick);
    };
  }, []);
  const label = !online ? "Offline" : pending > 0 ? `${pending} waiting for the college cloud` : "College cloud connected";
  return <p className="mt-2 text-xs text-paper/70">{label}</p>;
}

export function SiteFooter() {
  const settings = useNssStore((s) => s.settings);
  return (
    <footer className="no-print mt-auto border-t border-saffron/50 bg-navy px-4 py-8 text-center text-paper">
      <p className="font-display text-lg">{settings.collegeName}</p>
      <p className="mt-1 text-sm text-paper/80">NSS Smart Portal</p>
      <p className="mt-1 text-sm text-paper/70">{settings.sloganEn} · {settings.sloganGu}</p>
      <DualStatus />
      <p className="mt-3 text-xs text-paper/60">Created by Dr. Hareshkumar I. Prajapati · Assistant Professor</p>
    </footer>
  );
}
