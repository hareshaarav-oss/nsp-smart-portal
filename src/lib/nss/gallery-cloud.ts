import { compressSlideJpeg, getMedia } from "./media";
import { isDemoRecord } from "./seed";
import { useSessionStore } from "./session";
import { useNssStore } from "./store";
import type { GalleryItem } from "./types";

const MAX_SLIDE = 180000;

export function isCloudSlide(src: string | undefined) {
  return Boolean(src && src.startsWith("data:image/jpeg") && src.length > 80 && src.length < MAX_SLIDE);
}

function pushedIds() {
  try {
    return new Set((localStorage.getItem("nsp-slide-pushed") || "").split(",").filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

function markPushed(id: string) {
  try {
    const next = pushedIds();
    next.add(id);
    localStorage.setItem("nsp-slide-pushed", [...next].slice(-80).join(","));
  } catch {
    /* the phone is full */
  }
}

async function postSlide(slide: { id: string; image: string; caption: string; eventName: string; date: string }) {
  const token = useSessionStore.getState().session?.chatToken || "";
  if (!token) return "auth" as const;
  const res = await fetch("/api/nss-cloud", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "save-gallery",
      chatToken: token,
      id: slide.id,
      image: slide.image,
      caption: slide.caption,
      eventName: slide.eventName,
      date: slide.date,
    }),
  });
  if (res.status === 401 || res.status === 403) return "auth" as const;
  if (!res.ok) return "fail" as const;
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
  return data.ok === false ? ("fail" as const) : ("ok" as const);
}

async function slideImage(item: GalleryItem) {
  if (isCloudSlide(item.src)) return item.src;
  const key = item.kind === "video" ? item.posterKey : item.mediaKey;
  if (!key) return "";
  const blob = await getMedia(key);
  if (!blob || !blob.type.startsWith("image/")) return "";
  return compressSlideJpeg(blob);
}

export async function pushGallerySlides(items: GalleryItem[]) {
  const session = useSessionStore.getState().session;
  if (session?.role !== "po" && session?.role !== "admin") return "skip" as const;
  if (!session.chatToken) return "auth" as const;
  let result: "ok" | "auth" | "fail" | "skip" = "skip";
  for (const item of items.slice(0, 12)) {
    if (!item?.id || isDemoRecord(item.id)) continue;
    const image = await slideImage(item);
    if (!image) continue;
    const posted = await postSlide({
      id: item.id,
      image,
      caption: item.caption || item.eventName || "NSS activity",
      eventName: item.eventName || item.folder || "NSS activity",
      date: String(item.date || "").slice(0, 10),
    });
    if (posted === "auth") return "auth";
    if (posted === "ok") {
      result = "ok";
      markPushed(item.id);
      if (item.kind !== "video") {
        useNssStore.setState((state) => ({
          gallery: (state.gallery ?? []).map((row) => (row.id === item.id ? { ...row, src: image } : row)),
        }));
      }
    } else if (result !== "ok") {
      result = "fail";
    }
  }
  return result;
}

let flight: Promise<"ok" | "auth" | "fail" | "skip"> | null = null;

export function publishLocalSlides() {
  if (typeof window === "undefined") return Promise.resolve("skip" as const);
  const session = useSessionStore.getState().session;
  if (session?.role !== "po" && session?.role !== "admin") return Promise.resolve("skip" as const);
  const done = pushedIds();
  const pending = (useNssStore.getState().gallery ?? [])
    .filter((item) => {
      if (!item?.id || isDemoRecord(item.id) || done.has(item.id)) return false;
      if (isCloudSlide(item.src)) return true;
      return Boolean(item.mediaKey || item.posterKey);
    })
    .slice(0, 12);
  if (!pending.length) return Promise.resolve("skip" as const);
  if (!flight) {
    flight = pushGallerySlides(pending).finally(() => {
      flight = null;
    });
  }
  return flight;
}
