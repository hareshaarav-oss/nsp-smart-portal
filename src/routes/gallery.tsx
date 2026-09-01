import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/nss/shell";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { MediaThumb } from "@/components/nss/media-thumb";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/gallery")({ component: GalleryPage });

function GalleryPage() {
  const gallery = useNssStore((s) => s.gallery) ?? [];
  const folders = useMemo(() => {
    const set = new Set(gallery.map((g) => g.folder || g.eventName || "General"));
    return [...set].sort();
  }, [gallery]);
  const [folder, setFolder] = useState("all");
  const shown = gallery.filter((g) => folder === "all" || (g.folder || g.eventName || "General") === folder);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <OfficialLetterhead title="Activity photographs" compact className="mb-6" />
        <h1 className="font-display text-2xl font-semibold">Activity photographs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Event-wise folders. Photos saved from the PO desk also appear on Home.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant={folder === "all" ? "default" : "outline"} onClick={() => setFolder("all")}>
            All
          </Button>
          {folders.map((name) => (
            <Button key={name} size="sm" variant={folder === name ? "default" : "outline"} onClick={() => setFolder(name)}>
              {name}
            </Button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <MediaThumb item={item} className="aspect-4/3 w-full bg-navy object-contain" controls={item.kind === "video"} />
              <figcaption className="px-4 py-3">
                <p className="font-medium">{item.caption}</p>
                <p className="text-xs text-muted-foreground">
                  {item.folder || item.eventName} · {formatLongDate(item.date)}
                  {item.kind === "video" ? " · Video" : ""}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
