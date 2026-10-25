import { useNssStore } from "./store";
import type { GalleryItem } from "./types";

function asSlides(value: unknown): GalleryItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: GalleryItem[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<GalleryItem>;
    if (typeof item.id !== "string" || typeof item.src !== "string" || !item.src.startsWith("data:image/")) continue;
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

let flight: Promise<void> | null = null;

export function ensurePublicGallery() {
  const ready = (useNssStore.getState().gallery ?? []).some((item) => item.src?.startsWith("data:image/") && item.src.length > 80);
  if (ready) return Promise.resolve();
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
        if (!gallery) flight = null;
      })
      .catch(() => {
        flight = null;
      });
  }
  return flight;
}
