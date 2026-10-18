import { useEffect, useState, type ReactNode } from "react";
import { rememberVolunteer, useNssStore } from "@/lib/nss/store";
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
    const cached = readPhotoCache();
    for (const key of ["nsp-portal-data-v1", "nsp-portal-data", STORAGE_DATA]) {
      const raw = localStorage.getItem(key);
      if (!raw || !raw.includes("data:image")) continue;
      const parsed = JSON.parse(raw) as {
        state?: { settings?: { poPhoto?: string; principalPhoto?: string }; volunteers?: { id?: string; volunteerId?: string; fullName?: string; photoUrl?: string }[] };
        settings?: { poPhoto?: string; principalPhoto?: string };
        volunteers?: { id?: string; volunteerId?: string; fullName?: string; photoUrl?: string }[];
      };
      const settings = parsed.state?.settings || parsed.settings;
      const poPhoto = settings?.poPhoto || "";
      const principalPhoto = settings?.principalPhoto || "";
      if (poPhoto.startsWith("data:image") || principalPhoto.startsWith("data:image")) {
        sessionStorage.setItem("nsp-rescued-photos", JSON.stringify({ poPhoto, principalPhoto }));
      }
      const volunteers = parsed.state?.volunteers || parsed.volunteers || [];
      for (const volunteer of volunteers) {
        const photo = volunteer.photoUrl || "";
        if (!photo.startsWith("data:image/") && !photo.startsWith("https://")) continue;
        if (volunteer.volunteerId) cached[volunteer.volunteerId] = photo;
        if (volunteer.id) cached[volunteer.id] = photo;
        if (volunteer.fullName) cached[volunteer.fullName.toLowerCase()] = photo;
      }
    }
    writePhotoCache(cached);
  } catch {
    /* keep going */
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
    const raw = localStorage.getItem("nsp-photo-map-v2") || localStorage.getItem("nsp-photo-map");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.fromEntries(Object.entries(parsed).filter(([, photo]) => photo.startsWith("data:image/") || photo.startsWith("https://")));
  } catch {
    return {};
  }
}

function writePhotoCache(map: Record<string, string>) {
  try {
    const photos = Object.fromEntries(Object.entries(map).filter(([, photo]) => photo.startsWith("data:image/") || photo.startsWith("https://")));
    localStorage.setItem("nsp-photo-map-v2", JSON.stringify(photos));
  } catch {
    /* storage full */
  }
}

function applyPhotoMap(map: Map<string, string>) {
  if (!map.size) return;
  const state = useNssStore.getState();
  useNssStore.setState({
    volunteers: state.volunteers.map((volunteer) => {
      const photo =
        map.get(volunteer.volunteerId) ||
        map.get(volunteer.id) ||
        map.get(volunteer.fullName.toLowerCase()) ||
        volunteer.photoUrl ||
        "";
      return photo ? { ...volunteer, photoUrl: photo } : volunteer;
    }),
  });
}

function applyCachedPhotos() {
  const cached = readPhotoCache();
  applyPhotoMap(new Map(Object.entries(cached).filter(([, photo]) => photo.startsWith("data:image/") || photo.startsWith("https://"))));
}

async function pullPhotos() {
  const cached = readPhotoCache();
  applyPhotoMap(new Map(Object.entries(cached)));
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
    const map = new Map<string, string>();
    for (const photo of data.photos) rememberPhoto(photo, data.roster, cached, map);
    applyPhotoMap(map);
    writePhotoCache(cached);
    for (const photo of data.photos) seen.add(photo.docId);
  }
  const misses = readMisses();
  const pending = data.roster.filter((row) => {
    const known = cached[row.docId] || cached[row.volunteerId] || "";
    return row.docId && !seen.has(row.docId) && !misses.has(row.docId) && !known.startsWith("data:image/") && !known.startsWith("https://");
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
      const map = new Map<string, string>();
      const found = new Set(batch.photos.map((photo) => photo.docId));
      for (const row of slice) {
        if (!found.has(row.docId)) markPhotoMiss(row.docId);
      }
      for (const photo of batch.photos) rememberPhoto(photo, slice, cached, map);
      applyPhotoMap(map);
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
  cached: Record<string, string>,
  map: Map<string, string>,
) {
  if (!photo.photoUrl) return;
  const keys = [photo.id || "", photo.docId, photo.name || ""].filter(Boolean);
  const rosterRow = roster.find((row) => row.docId === photo.docId);
  if (rosterRow?.volunteerId) keys.push(rosterRow.volunteerId);
  if (rosterRow?.name) keys.push(rosterRow.name);
  for (const key of keys) {
    cached[key] = photo.photoUrl;
    map.set(key, photo.photoUrl);
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
    keepPrivate: Boolean(cloud.private),
    degraded: Boolean(cloud.degraded),
    brand: cloud.brand,
  });
  return Array.isArray(cloud.volunteers) && cloud.volunteers.length >= 20;
}

export function HydrateGate({ children }: { children: ReactNode }) {
  const [ready] = useState(true);
  const [status, setStatus] = useState("Loading the college NSS roll…");

  useEffect(() => {
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
      else nextPull = Date.now() + 3 * 60 * 1000;
      if (!cancelled) {
        applyBody(cloud);
        applyCachedPhotos();
        void ensurePhotos();
      }
    }

    async function pullVisitors() {
      if (cancelled || document.hidden) return;
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "visitors" }),
      });
      const data = (await res.json()) as { ok?: boolean; visitors?: number };
      if (!data.ok || typeof data.visitors !== "number" || data.visitors < 1) return;
      const current = useNssStore.getState().visitors;
      if (data.visitors !== current) useNssStore.setState({ visitors: Math.max(current, data.visitors) });
    }

    async function pullPulse() {
      if (cancelled || document.hidden) return;
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "live" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        live?: {
          visitors?: number;
          volunteerCount?: number;
          hours?: number;
          latest?: { id?: string; volunteerId?: string; fullName?: string; unit?: string; createdAt?: string };
          best?: { id?: string; volunteerId?: string; fullName?: string; unit?: string; hours?: number };
        };
      };
      if (!data.ok || !data.live) return;
      const state = useNssStore.getState();
      const patch: { visitors?: number; liveVolunteerCount?: number; liveHours?: number; liveBest?: NonNullable<typeof state.liveBest> } = {};
      if (typeof data.live.visitors === "number" && data.live.visitors > state.visitors) patch.visitors = data.live.visitors;
      if (typeof data.live.hours === "number" && data.live.hours > (state.liveHours ?? 0)) {
        patch.liveHours = data.live.hours;
      }
      if (typeof data.live.volunteerCount === "number" && data.live.volunteerCount > (state.liveVolunteerCount ?? 0)) {
        patch.liveVolunteerCount = data.live.volunteerCount;
      }
      const best = data.live.best;
      if (best?.fullName && typeof best.hours === "number") {
        const currentHours = state.liveBest?.hours ?? -1;
        if (best.hours !== currentHours || best.fullName !== state.liveBest?.fullName) {
          patch.liveBest = {
            id: best.id || best.volunteerId || best.fullName,
            volunteerId: best.volunteerId || "",
            fullName: best.fullName,
            unit: best.unit === "Unit 2" ? "Unit 2" : "Unit 1",
            hours: best.hours,
          };
        }
      }
      if (Object.keys(patch).length) useNssStore.setState(patch);
      const latest = data.live.latest;
      const known = latest?.volunteerId
        ? (state.volunteers ?? []).some((row) => row.volunteerId === latest.volunteerId || row.id === latest.volunteerId)
        : true;
      if (latest?.fullName && latest.volunteerId && !known) {
        rememberVolunteer({
          id: latest.volunteerId,
          volunteerId: latest.volunteerId,
          enrollment: "",
          fullName: latest.fullName,
          mobile: "",
          email: "",
          course: "B.Com.",
          semester: "1",
          unit: latest.unit === "Unit 2" ? "Unit 2" : "Unit 1",
          nssRole: "Volunteer",
          fatherName: "",
          dob: "",
          gender: "Other",
          bloodGroup: "",
          address: "",
          parentMobile: "",
          photoUrl: "",
          status: "active",
          createdAt: latest.createdAt || "",
        });
      }
    }

    void (async () => {
      rescueOfficerPhotos();
      dropStalePortalCache();
      try {
        await Promise.all([
          Promise.resolve(useNssStore.persist.rehydrate()),
          Promise.resolve(useSessionStore.persist.rehydrate()),
        ]);
        applyCachedPhotos();
        const session = useSessionStore.getState().session;
        try {
          if (session && localStorage.getItem("nsp-view") === "app" && window.location.pathname === "/") {
            window.location.replace(session.role === "po" || session.role === "admin" ? "/po" : "/volunteer");
            return;
          }
        } catch {
          /* stay on the portal */
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
        setStatus("Could not reach the college roll. Showing saved data.");
      }
      if (!photosLoaded) void ensurePhotos();
      void pullVisitors().catch(() => undefined);
      void pullPulse().catch(() => undefined);
    })();

    const timer = window.setInterval(() => {
      void pullLive().catch(() => undefined);
      void pullVisitors().catch(() => undefined);
      void pullPulse().catch(() => undefined);
      void ensurePhotos();
    }, 45000);
    const wake = () => {
      void pullLive().catch(() => undefined);
      void pullVisitors().catch(() => undefined);
      void pullPulse().catch(() => undefined);
      void ensurePhotos();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
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
