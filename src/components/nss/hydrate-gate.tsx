import { useEffect, useState, type ReactNode } from "react";
import { useNssStore } from "@/lib/nss/store";
import { useSessionStore } from "@/lib/nss/session";
import { COLLEGE_LOGO, NSS_LOGO, STORAGE_DATA } from "@/lib/nss/constants";
import { startDualSync } from "@/lib/nss/dual-store";

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
    for (const key of ["nsp-portal-data-v1", "nsp-portal-data", STORAGE_DATA]) {
      const raw = localStorage.getItem(key);
      if (!raw || !raw.includes("data:image")) continue;
      const parsed = JSON.parse(raw) as {
        state?: { settings?: { poPhoto?: string; principalPhoto?: string } };
        settings?: { poPhoto?: string; principalPhoto?: string };
      };
      const settings = parsed.state?.settings || parsed.settings;
      const poPhoto = settings?.poPhoto || "";
      const principalPhoto = settings?.principalPhoto || "";
      if (!poPhoto.startsWith("data:image") && !principalPhoto.startsWith("data:image")) continue;
      const kept = {
        poPhoto: poPhoto.startsWith("data:image") ? poPhoto : "",
        principalPhoto: principalPhoto.startsWith("data:image") ? principalPhoto : "",
      };
      sessionStorage.setItem("nsp-rescued-photos", JSON.stringify(kept));
      try {
        localStorage.setItem("nsp-officer-photos", JSON.stringify(kept));
      } catch {
        /* this device cannot keep the photographs */
      }
    }
  } catch {
    /* keep going */
  }
}

function rememberedOfficerPhotos() {
  try {
    const raw = localStorage.getItem("nsp-officer-photos") || sessionStorage.getItem("nsp-rescued-photos") || "";
    if (!raw) return { poPhoto: "", principalPhoto: "" };
    const saved = JSON.parse(raw) as { poPhoto?: string; principalPhoto?: string };
    return {
      poPhoto: saved.poPhoto?.startsWith("data:image") ? saved.poPhoto : "",
      principalPhoto: saved.principalPhoto?.startsWith("data:image") ? saved.principalPhoto : "",
    };
  } catch {
    return { poPhoto: "", principalPhoto: "" };
  }
}

function applyRememberedOfficerPhotos() {
  const saved = rememberedOfficerPhotos();
  if (!saved.poPhoto && !saved.principalPhoto) return;
  const state = useNssStore.getState();
  useNssStore.setState({
    settings: {
      ...state.settings,
      poPhoto: state.settings.poPhoto || saved.poPhoto,
      principalPhoto: state.settings.principalPhoto || saved.principalPhoto,
    },
  });
}

async function publishRememberedBrand() {
  const session = useSessionStore.getState().session;
  if (!session?.chatToken || (session.role !== "po" && session.role !== "admin")) return;
  try {
    if (sessionStorage.getItem("nsp-brand-pushed") === "1") return;
  } catch {
    return;
  }
  const saved = rememberedOfficerPhotos();
  if (!saved.poPhoto && !saved.principalPhoto) return;
  const state = useNssStore.getState();
  try {
    const res = await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-brand",
        chatToken: session.chatToken,
        poPhoto: saved.poPhoto || state.settings.poPhoto || "",
        principalPhoto: saved.principalPhoto || state.settings.principalPhoto || "",
        poQuote: state.settings.poQuote || "",
        principalQuote: state.settings.principalQuote || "",
      }),
    });
    const data = (await res.json()) as { ok?: boolean };
    if (res.ok && data.ok) sessionStorage.setItem("nsp-brand-pushed", "1");
  } catch {
    /* the officer can save again from settings */
  }
}

function readMisses() {
  try {
    const raw = JSON.parse(localStorage.getItem("nsp-photo-miss") || "[]") as string[];
    return new Set(raw);
  } catch {
    return new Set<string>();
  }
}

function markPhotoMiss(id: string) {
  const misses = readMisses();
  misses.add(id);
  try {
    localStorage.setItem("nsp-photo-miss", JSON.stringify([...misses].slice(-200)));
  } catch {
    /* ignore */
  }
}

function readPhotoCache() {
  try {
    const raw = localStorage.getItem("nsp-photo-map-v4");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { url?: string; name?: string }>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, photo]) => (photo?.url || "").startsWith("data:image/") || (photo?.url || "").startsWith("https://")),
    );
  } catch {
    return {};
  }
}

function writePhotoCache(map: Record<string, { url?: string; name?: string }>) {
  try {
    const photos = Object.fromEntries(
      Object.entries(map).flatMap(([key, photo]) => {
        const url = photo?.url || "";
        const name = personKey(photo?.name);
        if (!name || (!url.startsWith("data:image/") && !url.startsWith("https://"))) return [];
        return [[key, { url, name }]];
      }),
    );
    localStorage.setItem("nsp-photo-map-v4", JSON.stringify(photos));
  } catch {
    /* storage full */
  }
}

function forgetMismatchedPhotoCache() {
  try {
    localStorage.removeItem("nsp-photo-map-v3");
    localStorage.removeItem("nsp-photo-map-v2");
    localStorage.removeItem("nsp-photo-map");
  } catch {
    /* private mode */
  }
}

function personKey(name: string | undefined) {
  return (name || "").toLowerCase().replace(/[^a-z]/g, "");
}

function applyPhotoMap(map: Map<string, { url: string; name: string }>, replace: boolean) {
  if (!map.size) return;
  const state = useNssStore.getState();
  useNssStore.setState({
    volunteers: state.volunteers.map((volunteer) => {
      const hit = map.get(volunteer.volunteerId) || map.get(volunteer.id);
      if (!hit?.url) return volunteer;
      const volName = personKey(volunteer.fullName);
      if (!hit.name || (volName && hit.name !== volName)) return volunteer;
      if (!replace && volunteer.photoUrl) return volunteer;
      return hit.url === volunteer.photoUrl ? volunteer : { ...volunteer, photoUrl: hit.url };
    }),
  });
}

function applyCachedPhotos() {
  const cached = readPhotoCache();
  applyPhotoMap(new Map(Object.entries(cached).map(([key, photo]) => [key, { url: photo.url || "", name: personKey(photo.name) }])), false);
}

async function pullPhotos() {
  const cached = readPhotoCache();
  applyCachedPhotos();
  const res = await fetch("/api/nss-cloud", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ action: "photo-sync" }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    roster?: { docId: string; volunteerId: string; name?: string }[];
    photos?: { id: string; docId: string; photoUrl: string; name?: string }[];
    brand?: { poPhoto?: string; principalPhoto?: string };
  };
  if (!res.ok || !data.ok || !Array.isArray(data.roster) || data.roster.length === 0) return false;
  if (data.brand?.poPhoto || data.brand?.principalPhoto) {
    const state = useNssStore.getState();
    useNssStore.setState({
      settings: {
        ...state.settings,
        poPhoto: data.brand.poPhoto || state.settings.poPhoto || "",
        principalPhoto: data.brand.principalPhoto || state.settings.principalPhoto || "",
      },
    });
  }
  const seen = new Set<string>();
  if (Array.isArray(data.photos) && data.photos.length) {
    const map = new Map<string, { url: string; name: string }>();
    for (const photo of data.photos) rememberPhoto(photo, data.roster, cached, map);
    applyPhotoMap(map, true);
    writePhotoCache(cached);
    for (const photo of data.photos) seen.add(photo.docId);
  }
  const misses = readMisses();
  const pending = data.roster.filter((row) => {
    const known = cached[row.docId] || cached[row.volunteerId];
    const knownUrl = known?.url || "";
    return row.docId && !seen.has(row.docId) && !misses.has(row.docId) && !knownUrl.startsWith("data:image/") && !knownUrl.startsWith("https://");
  });
  let failed = false;
  for (let i = 0; i < pending.length; i += 8) {
    const slice = pending.slice(i, i + 8);
    const ids = slice.map((row) => row.docId);
    try {
      const batchRes = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "photo-sync", ids }),
      });
      const batch = (await batchRes.json()) as { ok?: boolean; photos?: { id: string; docId: string; photoUrl: string; name?: string }[] };
      if (!batchRes.ok || !batch.ok || !Array.isArray(batch.photos)) {
        failed = true;
        continue;
      }
      const map = new Map<string, { url: string; name: string }>();
      const found = new Set(batch.photos.map((photo) => photo.docId));
      for (const row of slice) {
        if (!found.has(row.docId)) markPhotoMiss(row.docId);
      }
      for (const photo of batch.photos) rememberPhoto(photo, slice, cached, map);
      applyPhotoMap(map, true);
      writePhotoCache(cached);
    } catch {
      failed = true;
    }
  }
  return !failed;
}

function rememberPhoto(
  photo: { id?: string; docId: string; photoUrl?: string; name?: string },
  roster: { docId: string; volunteerId: string; name?: string }[],
  cached: Record<string, { url?: string; name?: string }>,
  map: Map<string, { url: string; name: string }>,
) {
  if (!photo.photoUrl) return;
  const rosterRow = roster.find((row) => row.docId === photo.docId);
  const name = personKey(photo.name || rosterRow?.name);
  if (!name) return;
  const keys = [photo.docId, rosterRow?.volunteerId || ""].filter((key) => key.length > 1 && !key.includes(" "));
  for (const key of keys) {
    cached[key] = { url: photo.photoUrl, name };
    map.set(key, { url: photo.photoUrl, name });
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
  eventRsvps?: { volunteerId: string; eventId: string; status: "will_attend" | "will_not_attend"; updatedAt: string }[];
  brand?: { poPhoto?: string; principalPhoto?: string };
  degraded?: boolean;
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
    eventRsvps: Array.isArray(cloud.eventRsvps) ? cloud.eventRsvps : undefined,
    keepPrivate: Boolean(cloud.private),
    degraded: Boolean(cloud.degraded),
    brand: cloud.brand,
  });
  return Array.isArray(cloud.volunteers) && cloud.volunteers.length >= 1;
}

export function HydrateGate({ children }: { children: ReactNode }) {
  const [ready] = useState(true);
  const [status, setStatus] = useState("Loading the college NSS roll…");

  useEffect(() => {
    startDualSync();
    let cancelled = false;
    let nextPull = 0;
    let photosLoaded = false;
    let photoFlight = false;

    async function ensurePhotos() {
      if (cancelled || photosLoaded || photoFlight || document.hidden) return;
      photoFlight = true;
      try {
        photosLoaded = await pullPhotos();
      } catch {
        photosLoaded = false;
      } finally {
        photoFlight = false;
      }
    }

    async function pullLive() {
      if (cancelled || document.hidden || Date.now() < nextPull) return;
      const token = useSessionStore.getState().session?.chatToken || "";
      const res = token
        ? await fetch("/api/nss-cloud", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "roll-sync", chatToken: token }),
          })
        : await fetch("/api/nss-cloud");
      const cloud = (await res.json()) as CloudBody;
      if (cloud.degraded || !res.ok) nextPull = Date.now() + 10 * 60 * 1000;
      else nextPull = Date.now() + 40 * 1000;
      if (!cancelled) {
        applyBody(cloud);
        applyCachedPhotos();
        applyRememberedOfficerPhotos();
      }
    }

    void (async () => {
      forgetMismatchedPhotoCache();
      rescueOfficerPhotos();
      dropStalePortalCache();
      try {
        await Promise.all([
          Promise.resolve(useNssStore.persist.rehydrate()),
          Promise.resolve(useSessionStore.persist.rehydrate()),
        ]);
        applyCachedPhotos();
        applyRememberedOfficerPhotos();
        void publishRememberedBrand();
        const session = useSessionStore.getState().session;
        try {
          if (session && localStorage.getItem("nsp-view") === "app") localStorage.removeItem("nsp-view");
        } catch {
          /* stay on the home page */
        }
        if (session && !session.chatToken) {
          const renewed = await fetch("/api/nss-cloud", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              action: "resume-session",
              role: session.role,
              name: session.name,
              volunteerId: session.volunteerId || "",
              unit: "",
            }),
          }).then((res) => res.json() as Promise<{ ok?: boolean; chatToken?: string }>);
          if (renewed.ok && renewed.chatToken) {
            useSessionStore.getState().setSession({ ...session, chatToken: renewed.chatToken });
          }
        }
      } catch {
        /* continue */
      }

      setStatus("Opening the college roll…");
      try {
        await pullLive();
      } catch {
        setStatus("The college cloud is busy. The roll will open when Firestore is free.");
      }
      const session = useSessionStore.getState().session;
      const officer = session?.role === "po" || session?.role === "admin";
      if (officer) {
        window.setTimeout(() => {
          if (!cancelled) void ensurePhotos();
        }, 1500);
      }
    })();

    const retry = window.setInterval(() => {
      void pullLive().catch(() => undefined);
    }, 20_000);
    const wake = () => {
      if (document.hidden) return;
      if (nextPull - Date.now() > 15_000) nextPull = 0;
      void pullLive().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelled = true;
      window.clearInterval(retry);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-navy px-6 text-paper">
        <div className="flex items-center gap-5">
          <img src={COLLEGE_LOGO} alt="College emblem" className="size-16 object-contain" />
          <img src={NSS_LOGO} alt="NSS emblem" className="size-16 object-contain" />
        </div>
        <p className="mt-6 text-center font-display text-lg">NSS Smart Portal</p>
        <p className="mt-1 text-center text-sm tracking-[0.16em] text-paper/80">NSS SMART PORTAL</p>
        <p className="mt-2 text-center text-sm text-paper/70">
          S.D. Arts & Shah B.R. Commerce College, Mansa
        </p>
        <p className="mt-6 text-center text-xs tracking-[0.16em] text-paper/55">{status}</p>
      </div>
    );
  }
  return children;
}
