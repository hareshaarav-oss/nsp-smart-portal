import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaThumb } from "@/components/nss/media-thumb";
import type { GalleryItem } from "@/lib/nss/types";

export function PhotoCarousel({ items }: { items: GalleryItem[] }) {
  const photos = items.filter((item) => item.src || item.mediaKey).slice(0, 16);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (photos.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % photos.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [photos.length, paused]);

  useEffect(() => {
    if (index >= photos.length) setIndex(0);
  }, [index, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg bg-navy text-sm text-paper/80 md:h-80">
        Photographs appear here after they are uploaded from the gallery desk.
      </div>
    );
  }

  const current = photos[index];

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative h-56 w-full md:h-[28rem]">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={
              i === index
                ? "absolute inset-0 opacity-100 transition-opacity duration-700"
                : "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700"
            }
          >
            <MediaThumb
              item={photo}
              controls={photo.kind === "video"}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-navy/75 px-4 py-2 text-center text-xs text-paper">
        {current?.caption}
        {current?.eventName ? ` · ${current.eventName}` : ""}
        {current?.kind === "video" ? " · Video" : ""}
      </div>
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-paper"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            aria-label="Previous photograph"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-paper"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            aria-label="Next photograph"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
