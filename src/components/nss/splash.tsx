import { useEffect, useRef, useState } from "react";
import { COLLEGE_LOGO, NSS_LOGO } from "@/lib/nss/constants";
import { useNssStore } from "@/lib/nss/store";

const DURATION_MS = 10000;
export const SPLASH_SEEN_KEY = "nsp-splash-seen";

export function markSplashSeen() {
  try { sessionStorage.setItem(SPLASH_SEEN_KEY, "1"); } catch (error) { void error; }
}

export function shouldShowSplash() {
  try { return sessionStorage.getItem(SPLASH_SEEN_KEY) !== "1"; } catch { return true; }
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const finished = useRef(false);
  const settings = useNssStore((s) => s.settings);

  useEffect(() => {
    const finish = () => {
      if (finished.current) return;
      finished.current = true; markSplashSeen(); onDone();
    };
    const start = performance.now();
    const timeout = window.setTimeout(finish, DURATION_MS);
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS); setProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick); else finish();
    };
    frame = requestAnimationFrame(tick);
    return () => { window.clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, [onDone]);

  const skip = () => { finished.current = true; markSplashSeen(); onDone(); };

  return (
    <div className="nsp-splash-overlay fixed inset-0 z-50 overflow-auto bg-navy text-paper" role="dialog" aria-label="Welcome to NSP">
      <div className="tri-strip" aria-hidden="true"><span /><span /><span /></div>
      <div className="mx-auto flex min-h-[calc(100dvh-6px)] w-full max-w-6xl flex-col justify-center px-4 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[180px_1fr_180px] lg:items-center">
          <OfficerMini title="Programme Officer" name={settings.poName} photo={settings.poPhoto} />
          <div className="text-center">
            <div className="flex items-center justify-center gap-4"><img src={settings.collegeLogo || COLLEGE_LOGO} alt="College emblem" className="h-20 w-20 object-contain rounded-full bg-white/90 p-1 md:h-24 md:w-24" /><img src={settings.nssLogo || NSS_LOGO} alt="NSS emblem" className="h-28 w-28 object-contain md:h-36 md:w-36" /></div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-saffron">Welcome message</p>
            <h1 className="mt-1 font-display text-4xl font-bold md:text-6xl">Welcome to Avyansh Tech</h1>
            <p className="mt-3 text-lg font-semibold md:text-xl">{settings.portalName}</p>
            <p className="mt-2 text-sm text-paper/75">Created by Dr. Hareshkumar I. Prajapati</p>
            <p className="mt-4 text-base font-semibold md:text-lg">{settings.collegeName}</p>
            <p className="mt-2 text-sm text-paper/70">{settings.sloganEn} · {settings.sloganGu}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
              <span className="rounded-full border border-white/20 px-3 py-1.5">☁ Cloud Ready</span>
              <span className="rounded-full border border-white/20 px-3 py-1.5">📱 Installable PWA</span>
              <span className="rounded-full border border-white/20 px-3 py-1.5">🧠 Smart Portal</span>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 w-full max-w-md">
          <button type="button" onClick={skip} className="mx-auto block min-h-11 w-full rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/15">Enter NSP · આગળ વધો</button>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-navy-deep"><div className="h-full bg-saffron transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

function OfficerMini({ title, name, photo }: { title: string; name: string; photo?: string }) {
  return <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center backdrop-blur-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-saffron">{title}</p>{photo ? <img src={photo} alt={name} className="mx-auto mt-3 h-24 w-20 rounded-xl object-cover" /> : <div className="mx-auto mt-3 flex h-24 w-20 items-center justify-center rounded-xl bg-white/10 text-2xl">👤</div>}<p className="mt-3 text-sm font-semibold">{name}</p></div>;
}
