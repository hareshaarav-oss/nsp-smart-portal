import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { MediaThumb } from "@/components/nss/media-thumb";
import { formatLongDate } from "@/lib/nss/format";
import { defaultGujaratiPress, defaultNaacEnglish, openGujaratiPress, openNaacReport } from "@/lib/nss/press";
import { eventPhotoDataUrls } from "@/lib/nss/reports";
import { getMedia, putMedia } from "@/lib/nss/media";
import { presentVolunteers, useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/po/press")({ component: PressPage });

function PressPage() {
  const state = useNssStore();
  const events = useMemo(
    () => [...state.events].sort((a, b) => b.date.localeCompare(a.date)),
    [state.events],
  );
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId) ?? events[0];
  const present = event ? presentVolunteers(state, event.id) : [];
  const photos = useMemo(() => {
    if (!event) return [];
    return (state.gallery ?? []).filter(
      (g) =>
        g.eventId === event.id ||
        (g.eventName && g.eventName === event.name) ||
        (g.caption && event.name && g.caption.toLowerCase().includes(event.name.toLowerCase())),
    );
  }, [state.gallery, event]);

  const [gu, setGu] = useState("");
  const [en, setEn] = useState("");
  const pressReports = state.pressReports ?? [];

  useEffect(() => {
    if (!event) return;
    setGu(defaultGujaratiPress(event, state.settings, present.length));
    setEn(defaultNaacEnglish(event, state.settings, present));
  }, [event?.id, present.length, state.settings]);


  async function uploadExternal(file: File | undefined) {
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (!allowed.includes(file.type) && !/\.(pdf|docx?|PDF|DOCX?)$/.test(file.name)) {
      toast.error("Upload PDF, DOCX or DOC press report only.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Press report must be 30 MB or smaller.");
      return;
    }
    const mediaKey = `press-${Date.now()}-${file.name.replace(/[^a-z0-9]+/gi, "-")}`;
    await putMedia(mediaKey, file);
    state.addPressReport({
      id: `press-${Date.now()}`, name: event ? event.name : "External Press Report", date: new Date().toISOString().slice(0, 10),
      eventId: event?.id, fileName: file.name, mimeType: file.type || "application/octet-stream", mediaKey,
    });
    toast.success("External press report uploaded.");
  }

  async function downloadExternal(id: string) {
    const item = pressReports.find((r) => r.id === id);
    if (!item) return;
    const blob = await getMedia(item.mediaKey);
    if (!blob) { toast.error("File is not available on this device."); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = item.fileName; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function viewGujarati() {
    if (!event) return;
    const urls = await eventPhotoDataUrls(state, event.id);
    await openGujaratiPress({ state: useNssStore.getState(), event, body: gu, photos: urls });
  }

  async function viewNaac() {
    if (!event) return;
    const urls = await eventPhotoDataUrls(state, event.id);
    await openNaacReport({ state: useNssStore.getState(), event, body: en, photos: urls });
  }

  return (
    <div className="space-y-6">
      <OfficialLetterhead title="Press report" compact />
      <div>
        <h2 className="font-display text-xl font-semibold">Press report</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Select an event. Photographs from the Gallery folder for that event load automatically. Write or
          paste the Gujarati note. Present volunteers appear at the bottom. Then View the report — nothing
          downloads until you print from the preview. The same file also makes the English NAAC report.
        </p>
      </div>

      <Card className="border-forest/30">
        <CardHeader><CardTitle className="text-base">External Press Report Upload</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Upload a PDF, DOC or DOCX prepared outside the portal. It is automatically added to this Press Desk and remains available here for download.</p>
          <Input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => { void uploadExternal(e.target.files?.[0]); e.currentTarget.value = ""; }} />
          {pressReports.length ? <div className="space-y-2">{pressReports.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"><span className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><FileText /></span><span className="min-w-0"><strong className="block truncate">{r.fileName}</strong><span className="block text-xs text-muted-foreground">{r.name} · {formatLongDate(r.date)}</span></span></span><span className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={() => void downloadExternal(r.id)}><Download />Download</Button><Button size="sm" variant="ghost" onClick={() => state.removePressReport(r.id)}><Trash2 />Remove</Button></span></div>)}</div> : <p className="text-sm text-muted-foreground">No external press reports uploaded yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Choose event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-11 w-full max-w-lg rounded-md border border-border bg-card px-3 text-sm"
            value={event?.id ?? ""}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {formatLongDate(e.date)}
              </option>
            ))}
          </select>
          {event ? (
            <p className="text-sm text-muted-foreground">
              {event.location} · {photos.length} photograph(s) · {present.length} present (hours stay 0 until
              you mark Present)
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Photographs (from Gallery)</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No photos for this event yet. Open Gallery, choose this event name, and add photographs. They
              appear here automatically.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.slice(0, 12).map((item) => (
                <div key={item.id} className="overflow-hidden rounded-md border border-border">
                  <MediaThumb item={item} className="h-28 w-full object-cover" />
                  <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{item.caption}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Gujarati write-up — type or paste</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea className="gu min-h-56" value={gu} onChange={(e) => setGu(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Attendance list (auto)</CardTitle>
        </CardHeader>
        <CardContent>
          {present.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Mark Present on the Attendance page. Names then print at the foot of the press note, like the
              Rakshabandhan file.
            </p>
          ) : (
            <ol className="columns-2 text-sm">
              {present.map((v) => (
                <li key={v.id} className="mb-1">
                  {v.fullName} · {v.volunteerId}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void viewGujarati()}>
          <Eye />
          View Gujarati press report
        </Button>
        <Button variant="outline" onClick={() => void viewNaac()}>
          <Eye />
          View English NAAC report
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (!event) return;
            setGu(defaultGujaratiPress(event, state.settings, present.length));
            setEn(defaultNaacEnglish(event, state.settings, present));
            toast.success("Draft restored from event details.");
          }}
        >
          Restore draft
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>English NAAC draft (editable)</Label>
        <Textarea className="min-h-48 font-mono text-xs" value={en} onChange={(e) => setEn(e.target.value)} />
      </div>
    </div>
  );
}
