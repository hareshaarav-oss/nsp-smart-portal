import { useNssStore } from "./store";
import type { GalleryItem } from "./types";

function asSlides(value: unknown): GalleryItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: GalleryItem[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<GalleryItem>;
    if (typeof item.id !== "string" || typeof item.src !== "string" || !item.src.startsWith("data:image/")) continue;
    if (item.src.length < 80 || item.src.length >= 220000) continue;
    rows.push({
      id: item.id,
      src: item.src,
      caption: typeof item.caption === "string" ? item.caption : "NSS activity",
      date: typeof item.date === "string" ? item.date : "",
      eventName: typeof item.eventName === "string" ? item.eventName : "",
      folder: typeof item.folder === "string" ? item.folder : item.eventName || "",
      kind: "photo",
    });
  }
  return rows.length ? rows : undefined;
}

const FRESH_MS = 10 * 60 * 1000;
let flight: Promise<void> | null = null;

function slidesFresh() {
  const has = (useNssStore.getState().gallery ?? []).some(
    (item) => (item.src || "").startsWith("data:image/") && item.src.length > 80,
  );
  if (!has) return false;
  try {
    const at = Number(sessionStorage.getItem("nsp-gallery-at") || 0);
    return Date.now() - at < FRESH_MS;
  } catch {
    return false;
  }
}

export function ensurePublicGallery() {
  if (typeof window === "undefined") return Promise.resolve();
  if (slidesFresh()) return Promise.resolve();
  if (!flight) {
    flight = fetch("/api/nss-cloud?gallery=1")
      .then((res) => res.json())
      .then((data: { ok?: boolean; gallery?: unknown; brand?: { poPhoto?: string; principalPhoto?: string; poQuote?: string; principalQuote?: string } }) => {
        if (!data?.ok) {
          flight = null;
          return;
        }
        const gallery = asSlides(data.gallery);
        useNssStore.getState().applyCloud({ gallery, brand: data.brand });
        try {
          sessionStorage.setItem("nsp-gallery-at", String(Date.now()));
        } catch {
          /* private mode */
        }
        if (!gallery) flight = null;
      })
      .catch(() => {
        flight = null;
      });
  }
  return flight;
}
