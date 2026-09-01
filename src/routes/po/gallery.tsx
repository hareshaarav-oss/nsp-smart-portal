import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderOpen, ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaThumb } from "@/components/nss/media-thumb";
import { formatLongDate, todayIso } from "@/lib/nss/format";
import { assertVideoSize, compressImageFile, folderName, putMedia, videoPoster } from "@/lib/nss/media";
import { useNssStore } from "@/lib/nss/store";
import type { GalleryItem } from "@/lib/nss/types";

export const Route = createFileRoute("/po/gallery")({ component: PoGallery });

function PoGallery() {
  const events = useNssStore((s) => s.events);
  const gallery = useNssStore((s) => s.gallery) ?? [];
  const addGalleryItems = useNssStore((s) => s.addGalleryItems);
  const removeGalleryItem = useNssStore((s) => s.removeGalleryItem);
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.date.localeCompare(a.date)),
    [events],
  );
  const [eventId, setEventId] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [folderFilter, setFolderFilter] = useState("all");
  const [dropOver, setDropOver] = useState(false);

  useEffect(() => {
    if (eventId) return;
    if (sortedEvents[0]) setEventId(sortedEvents[0].id);
    else setEventId("__general__");
  }, [sortedEvents, eventId]);

  const selectedEvent = eventId === "__general__" ? undefined : sortedEvents.find((e) => e.id === eventId);
  const eventName = selectedEvent?.name ?? "General";
  const folders = useMemo(() => {
    const set = new Set(gallery.map((g) => g.folder || g.eventName || "General"));
    return [...set].sort();
  }, [gallery]);
  const shown = gallery.filter((g) => folderFilter === "all" || (g.folder || g.eventName || "General") === folderFilter);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const added: GalleryItem[] = [];
    try {
      for (const file of Array.from(list)) {
        const id = `gal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) {
          toast.error(`${file.name} is not a photo or video.`);
          continue;
        }
        if (isVideo) {
          assertVideoSize(file);
          const mediaKey = `video-${id}`;
          await putMedia(mediaKey, file);
          let posterKey: string | undefined;
          const poster = await videoPoster(file);
          if (poster) {
            posterKey = `poster-${id}`;
            await putMedia(posterKey, poster);
          }
          added.push({
            id,
            src: "",
            caption: caption.trim() || file.name.replace(/\.[^.]+$/, ""),
            date: selectedEvent?.date || todayIso(),
            eventId: selectedEvent?.id,
            eventName,
            kind: "video",
            folder: folderName(eventName),
            mediaKey,
            posterKey,
          });
        } else {
          const { blob } = await compressImageFile(file);
          const mediaKey = `photo-${id}`;
          await putMedia(mediaKey, blob);
          added.push({
            id,
            src: "",
            caption: caption.trim() || `${eventName} · ${file.name.replace(/\.[^.]+$/, "")}`,
            date: selectedEvent?.date || todayIso(),
            eventId: selectedEvent?.id,
            eventName,
            kind: "photo",
            folder: folderName(eventName),
            mediaKey,
          });
        }
      }
      if (added.length) {
        addGalleryItems(added);
        toast.success(`${added.length} file(s) saved in HD to “${eventName}”. They appear on Home.`);
        setCaption("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Gallery</h2>
        <p className="text-sm text-muted-foreground">
          Pick an event — the folder name fills automatically. Multi-select or drag-and-drop photos and videos. Any size
          is compressed to HD JPEG (1920px) before saving. Videos keep their quality and a poster is generated. Saved
          files appear on the Home page.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Event (folder fills automatically)</Label>
            <select
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="__general__">General (no event)</option>
              {sortedEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} — {formatLongDate(event.date)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Caption (optional)</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={eventName} />
          </div>
          <div
            className={`sm:col-span-2 rounded-lg border-2 border-dashed p-4 ${dropOver ? "border-forest bg-forest/5" : "border-border"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropOver(true);
            }}
            onDragLeave={() => setDropOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropOver(false);
              void onFiles(e.dataTransfer.files);
            }}
          >
            <Label className="mb-2 flex items-center gap-2">
              <Upload className="size-4" />
              Multi-select photos / videos — or drop files here
            </Label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              disabled={busy}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {busy ? "Compressing and saving…" : `Saving into folder: ${eventName}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={folderFilter === "all" ? "default" : "outline"} onClick={() => setFolderFilter("all")}>
          All ({gallery.length})
        </Button>
        {folders.map((folder) => (
          <Button
            key={folder}
            size="sm"
            variant={folderFilter === folder ? "default" : "outline"}
            onClick={() => setFolderFilter(folder)}
          >
            <FolderOpen />
            {folder}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <MediaThumb item={item} className="aspect-4/3 w-full object-cover" controls={item.kind === "video"} />
            <figcaption className="flex items-start justify-between gap-2 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{item.caption}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.folder || item.eventName} · {formatLongDate(item.date)} · {item.kind === "video" ? "Video" : "HD photo"}
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm("Remove this file from the gallery?")) removeGalleryItem(item.id);
                }}
              >
                <Trash2 />
              </Button>
            </figcaption>
          </figure>
        ))}
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <ImagePlus className="mr-1 inline size-4" />
            No files in this folder yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
