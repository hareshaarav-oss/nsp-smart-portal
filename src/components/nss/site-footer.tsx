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
    const timer = window.setInterval(() => void tick(), 15000);
    window.addEventListener("online", tick);
    window.addEventListener("offline", tick);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("online", tick);
      window.removeEventListener("offline", tick);
    };
  }, []);

  const label = !online
    ? "Offline · saved on this device. College cloud will update when the internet is back."
    : pending > 0
      ? `Saved on this device. ${pending} change${pending === 1 ? "" : "s"} waiting for the college cloud.`
      : "Saved on this device and the college cloud.";

  return <p className="mt-2 text-[11px] text-paper/45">{label}</p>;
}

export function SiteFooter() {
  const settings = useNssStore((s) => s.settings);

  return (
    <footer className="no-print mt-auto border-t border-border bg-navy-deep px-4 py-8 text-center text-paper">
      <p className="font-display text-lg">NSS Smart Portal</p>
      <p className="mt-1 text-sm text-paper/80">{settings.collegeName}</p>
      <p className="mt-1 text-sm text-paper/70">
        National Service Scheme · “{settings.sloganEn}” / {settings.sloganGu}
      </p>
      <DualStatus />
      <p className="mt-4 text-xs text-paper/50">Created by Dr. Hareshkumar I. Prajapati · Assistant Professor</p>
    </footer>
  );
}
