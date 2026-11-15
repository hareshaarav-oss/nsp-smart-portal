import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/nss/shell";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { MediaThumb } from "@/components/nss/media-thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLongDate } from "@/lib/nss/format";
import { ensurePublicGallery } from "@/lib/nss/public-gallery";
import { useSessionStore } from "@/lib/nss/session";
import { useNssStore } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/gallery")({ component: GalleryPage });

type FeedComment = { id: string; name: string; text: string; at: string };
type FeedMark = { id: string; likes: string[]; comments: FeedComment[] };

function viewerKey() {
  try {
    const saved = localStorage.getItem("nsp-feed-who");
    if (saved) return saved;
    const next = `v${Date.now().toString(36)}`;
    localStorage.setItem("nsp-feed-who", next);
    return next;
  } catch {
    return "guest";
  }
}

function GalleryPage() {
  const gallerySource = useNssStore((s) => s.gallery);
  const gallery = useMemo(() => gallerySource ?? [], [gallerySource]);
  const session = useSessionStore((s) => s.session);
  const { lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const [view, setView] = useState<"feed" | "grid">("feed");
  const [marks, setMarks] = useState<FeedMark[]>([]);
  const [name, setName] = useState(session?.name || "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  useEffect(() => {
    void ensurePublicGallery();
    void fetch("/api/nss-cloud?feed=1")
      .then((res) => res.json())
      .then((data: { marks?: FeedMark[] }) => {
        if (Array.isArray(data.marks)) setMarks(data.marks);
      })
      .catch(() => undefined);
  }, []);
  const folders = useMemo(() => {
    const set = new Set(gallery.map((g) => g.folder || g.eventName || "General"));
    return [...set].sort();
  }, [gallery]);
  const [folder, setFolder] = useState("all");
  const shown = gallery.filter((g) => (g.src || g.mediaKey) && (folder === "all" || (g.folder || g.eventName || "General") === folder));
  const who = viewerKey();

  async function react(photoId: string, action: "feed-like" | "feed-comment", text = "") {
    const res = await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, photoId, who, name: session?.name || name, text }),
    });
    const data = (await res.json()) as { ok?: boolean; marks?: FeedMark[]; error?: string };
    if (!res.ok || !data.ok || !data.marks) {
      setNote(data.error || tr("Could not save.", "સાચવાયું નહીં."));
      return;
    }
    setMarks(data.marks);
    setNote("");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <OfficialLetterhead title={tr("Activity feed", "પ્રવૃત્તિ ફીડ")} compact className="mb-4" />
        <div className="flex gap-2">
          <Button size="sm" variant={view === "feed" ? "default" : "outline"} onClick={() => setView("feed")}>{tr("Feed", "ફીડ")}</Button>
          <Button size="sm" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>{tr("Grid", "જાળી")}</Button>
        </div>
        {view === "grid" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant={folder === "all" ? "default" : "outline"} onClick={() => setFolder("all")}>{tr("All", "બધા")}</Button>
            {folders.map((item) => (
              <Button key={item} size="sm" variant={folder === item ? "default" : "outline"} onClick={() => setFolder(item)}>{item}</Button>
            ))}
          </div>
        ) : null}
        {note ? <p className="mt-3 text-sm text-danger">{note}</p> : null}
        {shown.length === 0 ? <p className="mt-8 text-sm text-muted-foreground">{tr("No photographs yet.", "હજી ફોટા નથી.")}</p> : null}
        {view === "grid" ? (
          <div className="mt-4 grid grid-cols-3 gap-1">
            {shown.map((item) => (
              <button key={item.id} type="button" className="aspect-square overflow-hidden bg-navy" onClick={() => setView("feed")}>
                <MediaThumb item={item} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {shown.map((item) => {
              const mark = marks.find((row) => row.id === item.id);
              const liked = Boolean(mark?.likes.includes(who));
              return (
                <article key={item.id} className="overflow-hidden border border-navy/10 bg-card shadow-sm">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="flex size-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-paper">{(item.eventName || item.caption || "N").slice(0, 1)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{item.eventName || item.folder || tr("NSS activity", "NSS પ્રવૃત્તિ")}</p>
                      <p className="text-[11px] text-muted-foreground">{formatLongDate(item.date)}</p>
                    </div>
                  </div>
                  <MediaThumb item={item} className="aspect-square w-full bg-navy object-cover" controls={item.kind === "video"} />
                  <div className="space-y-2 px-3 py-3">
                    <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-navy" onClick={() => void react(item.id, "feed-like")}>
                      <Heart className={`size-5 ${liked ? "fill-danger text-danger" : ""}`} />
                      {mark?.likes.length || 0}
                    </button>
                    <p className="text-sm text-navy"><span className="font-semibold">{item.eventName || "NSS"}</span> {item.caption}</p>
                    {(mark?.comments || []).map((comment) => (
                      <p key={comment.id} className="text-sm"><span className="font-semibold">{comment.name}</span> {comment.text}</p>
                    ))}
                    {!session?.name ? (
                      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={tr("Your name", "તમારું નામ")} className="gu" />
                    ) : null}
                    <form className="flex gap-2" onSubmit={(event) => {
                      event.preventDefault();
                      const text = (drafts[item.id] || "").trim();
                      if ((session?.name || name).trim().length < 2 || !text) {
                        setNote(tr("Write your name and a short comment.", "નામ અને ટૂંકી ટિપ્પણી લખો."));
                        return;
                      }
                      setDrafts((current) => ({ ...current, [item.id]: "" }));
                      void react(item.id, "feed-comment", text);
                    }}>
                      <Input value={drafts[item.id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={tr("Add a comment", "ટિપ્પણી લખો")} className="gu" />
                      <Button type="submit" size="sm">{tr("Post", "મોકલો")}</Button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}