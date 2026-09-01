import { useEffect, useState } from "react";
import { getMedia } from "@/lib/nss/media";
import type { GalleryItem } from "@/lib/nss/types";

export function useMediaUrl(mediaKey?: string, fallback = "") {
  const [url, setUrl] = useState(fallback);
  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    if (!mediaKey) {
      setUrl(fallback);
      return;
    }
    void getMedia(mediaKey).then((blob) => {
      if (!alive) return;
      if (!blob) {
        setUrl(fallback);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaKey, fallback]);
  return url;
}

export function MediaThumb({
  item,
  className,
  controls = false,
  preferPoster = false,
}: {
  item: Pick<GalleryItem, "src" | "kind" | "mediaKey" | "posterKey" | "caption">;
  className?: string;
  controls?: boolean;
  preferPoster?: boolean;
}) {
  const url = useMediaUrl(item.mediaKey, item.src);
  const poster = useMediaUrl(item.posterKey, "");
  if (!url && !poster) {
    return <div className={className} />;
  }
  if (item.kind === "video") {
    if (preferPoster && poster) {
      return <img src={poster} alt={item.caption} className={className} />;
    }
    return (
      <video
        src={url}
        poster={poster || undefined}
        className={className}
        controls={controls}
        playsInline
        muted={!controls}
      />
    );
  }
  return <img src={url} alt={item.caption} className={className} />;
}
