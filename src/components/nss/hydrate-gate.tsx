import { useEffect, useState, type ReactNode } from "react";
import { useNssStore } from "@/lib/nss/store";
import { useSessionStore } from "@/lib/nss/session";
import { COLLEGE_LOGO, NSS_LOGO } from "@/lib/nss/constants";

export function HydrateGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading the college NSS roll…");

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };

    void (async () => {
      try {
        await Promise.all([
          Promise.resolve(useNssStore.persist.rehydrate()),
          Promise.resolve(useSessionStore.persist.rehydrate()),
        ]);
      } catch {
        /* continue */
      }

      async function applyResponse(res: Response) {
        if (!res.ok) return false;
        const cloud = (await res.json()) as {
          ok?: boolean;
          volunteers?: unknown;
          events?: unknown;
          attendance?: unknown;
          notices?: unknown;
          gallery?: unknown;
          visitors?: number;
          alumniCount?: number;
        };
        if (!cloud.ok) return false;
        useNssStore.getState().applyCloud({
          volunteers: Array.isArray(cloud.volunteers) ? cloud.volunteers : undefined,
          events: Array.isArray(cloud.events) ? cloud.events : undefined,
          attendance: Array.isArray(cloud.attendance) ? cloud.attendance : undefined,
          notices: Array.isArray(cloud.notices) ? cloud.notices : undefined,
          gallery: Array.isArray(cloud.gallery) ? cloud.gallery : undefined,
          visitors: cloud.visitors,
          alumniCount: cloud.alumniCount,
        });
        return Array.isArray(cloud.volunteers) && cloud.volunteers.length >= 20;
      }

      setStatus("Connecting to NSS cloud…");
      try {
        const res = await fetch("/api/nss-cloud");
        const ok = await applyResponse(res);
        if (ok) setStatus("College roll loaded.");
      } catch {
        setStatus("Could not reach the college roll. Showing saved data.");
      }
      finish();
      void fetch("/api/nss-cloud?gallery=1")
        .then(applyResponse)
        .catch(() => undefined);
    })();

    const safety = window.setTimeout(finish, 12000);
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-navy px-6 text-paper">
        <div className="flex items-center gap-5">
          <img src={COLLEGE_LOGO} alt="College emblem" className="size-16 object-contain" />
          <img src={NSS_LOGO} alt="NSS emblem" className="size-16 object-contain" />
        </div>
        <p className="mt-6 text-center font-display text-lg tracking-[0.18em]">NSS SMART PORTAL</p>
        <p className="mt-2 text-center text-sm text-paper/70">
          S.D. Arts & Shah B.R. Commerce College, Mansa
        </p>
        <p className="mt-6 text-center text-xs tracking-[0.16em] text-paper/55">{status}</p>
      </div>
    );
  }
  return children;
}
