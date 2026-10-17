import { useEffect, useState, type ReactNode } from "react";
import { useNssStore } from "@/lib/nss/store";
import { useSessionStore } from "@/lib/nss/session";
import { COLLEGE_LOGO, NSS_LOGO, STORAGE_DATA } from "@/lib/nss/constants";

let seenBuild = "";

function noteBuild(build: unknown) {
  const value = typeof build === "string" ? build : "";
  if (!value) return;
  if (!seenBuild) {
    seenBuild = value;
    return;
  }
  if (seenBuild !== value) {
    seenBuild = value;
    window.location.reload();
  }
}

function rescueOfficerPhotos() {
  try {
    for (const key of ["nsp-portal-data-v1", STORAGE_DATA]) {
      const raw = localStorage.getItem(key);
      if (!raw || !raw.includes("data:image")) continue;
      const parsed = JSON.parse(raw) as { state?: { settings?: { poPhoto?: string; principalPhoto?: string } }; settings?: { poPhoto?: string; principalPhoto?: string } };
      const settings = parsed.state?.settings || parsed.settings;
      const poPhoto = settings?.poPhoto || "";
      const principalPhoto = settings?.principalPhoto || "";
      if (!poPhoto.startsWith("data:image") && !principalPhoto.startsWith("data:image")) continue;
      sessionStorage.setItem("nsp-rescued-photos", JSON.stringify({ poPhoto, principalPhoto }));
      return;
    }
  } catch {
    /* keep going */
  }
}

function dropStalePortalCache() {
  try {
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("nsp-portal-data") && key !== STORAGE_DATA) drop.push(key);
    }
    for (const key of drop) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

type CloudBody = {
  ok?: boolean;
  private?: boolean;
  build?: string;
  volunteers?: unknown;
  events?: unknown;
  attendance?: unknown;
  notices?: unknown;
  gallery?: unknown;
  visitors?: number;
  alumniCount?: number;
  serviceHours?: number;
  brand?: { poPhoto?: string; principalPhoto?: string };
};

function applyBody(cloud: CloudBody) {
  if (!cloud.ok) return false;
  noteBuild(cloud.build);
  useNssStore.getState().applyCloud({
    volunteers: Array.isArray(cloud.volunteers) ? cloud.volunteers : undefined,
    events: Array.isArray(cloud.events) ? cloud.events : undefined,
    attendance: Array.isArray(cloud.attendance) ? cloud.attendance : undefined,
    notices: Array.isArray(cloud.notices) ? cloud.notices : undefined,
    gallery: Array.isArray(cloud.gallery) ? cloud.gallery : undefined,
    visitors: cloud.visitors,
    alumniCount: cloud.alumniCount,
    serviceHours: cloud.serviceHours,
    keepPrivate: Boolean(cloud.private),
    brand: cloud.brand,
  });
  return Array.isArray(cloud.volunteers) && cloud.volunteers.length >= 20;
}

export function HydrateGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading the college NSS roll…");

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };

    async function pullLive() {
      if (cancelled || document.hidden) return;
      const token = useSessionStore.getState().session?.chatToken || "";
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "roll-sync", ...(token ? { chatToken: token } : {}) }),
      });
      const cloud = (await res.json()) as CloudBody;
      if (!cancelled) applyBody(cloud);
    }

    void (async () => {
      rescueOfficerPhotos();
      dropStalePortalCache();
      try {
        await Promise.all([
          Promise.resolve(useNssStore.persist.rehydrate()),
          Promise.resolve(useSessionStore.persist.rehydrate()),
        ]);
      } catch {
        /* continue */
      }

      setStatus("Opening the college roll…");
      try {
        await pullLive();
        if (!cancelled) setStatus("College roll loaded.");
      } catch {
        setStatus("Could not reach the college roll. Showing saved data.");
      }
      finish();
      void fetch("/api/nss-cloud", { cache: "no-store" })
        .then((res) => res.json())
        .then((cloud: CloudBody) => {
          if (!cancelled) applyBody(cloud);
          const saved = sessionStorage.getItem("nsp-rescued-photos");
          if (!saved) return;
          const photos = JSON.parse(saved) as { poPhoto?: string; principalPhoto?: string };
          const settings = useNssStore.getState().settings;
          if (!settings.poPhoto && photos.poPhoto) useNssStore.getState().updateSettings({ poPhoto: photos.poPhoto });
          if (!settings.principalPhoto && photos.principalPhoto) useNssStore.getState().updateSettings({ principalPhoto: photos.principalPhoto });
        })
        .catch(() => undefined);
      void fetch("/api/nss-cloud?gallery=1", { cache: "no-store" })
        .then((res) => res.json())
        .then((cloud: CloudBody) => {
          if (!cancelled) applyBody(cloud);
        })
        .catch(() => undefined);
    })();

    const timer = window.setInterval(() => {
      void pullLive().catch(() => undefined);
    }, 10000);
    const wake = () => {
      void pullLive().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    const safety = window.setTimeout(finish, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(safety);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
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
