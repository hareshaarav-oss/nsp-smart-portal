import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, DatabaseBackup, UploadCloud, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNssStore } from "@/lib/nss/store";
import type { PortalState } from "@/lib/nss/types";

export const Route = createFileRoute("/po/backup")({ component: BackupPage });

function BackupPage() {
  const state = useNssStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const recycleBin = state.recycleBin ?? [];

  const exportBackup = () => {
    const payload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      source: "NSP",
      state: {
        volunteers: state.volunteers, events: state.events, attendance: state.attendance, eventRsvps: state.eventRsvps,
        notices: state.notices, gallery: state.gallery, certificates: state.certificates, pressReports: state.pressReports,
        logs: state.logs, settings: state.settings, visitors: state.visitors, recycleBin: state.recycleBin,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
    a.download = `NSP-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success("Complete NSP backup downloaded.");
  };

  async function importBackup(file?: File) {
    if (!file) return; setBusy(true);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const data = (parsed && typeof parsed === "object" && "state" in parsed ? (parsed as { state: unknown }).state : parsed) as Record<string, unknown>;
      if (!Array.isArray(data.volunteers) || !Array.isArray(data.events)) throw new Error("Invalid NSP backup");
      state.importBackup(data as Partial<PortalState>); toast.success("Backup restored on this device.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not restore backup."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div><h2 className="font-display text-2xl font-bold">Backup & Restore</h2><p className="text-sm text-muted-foreground">Portable full backup for NSS records, including RSVP, press reports and Recycle Bin.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><DatabaseBackup className="size-5" /> Create full backup</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Exports students, events, RSVP, attendance, gallery, certificates, press reports, settings and audit logs.</p><Button className="mt-4" onClick={exportBackup}><Download /> Download NSP Backup</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><UploadCloud className="size-5" /> Restore backup</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Restore a previously exported NSP JSON file to this browser.</p><input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void importBackup(e.target.files?.[0])} /><Button className="mt-4" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Restoring…" : "Choose Backup File"}</Button></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trash2 className="size-5" /> Recycle Bin <span className="text-sm font-normal text-muted-foreground">({recycleBin.length})</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Deleted volunteers and events are retained here instead of being permanently lost.</p>
          {recycleBin.length === 0 ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Recycle Bin is empty.</p> : <div className="space-y-2">{recycleBin.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><p className="font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.kind} · {new Date(item.deletedAt).toLocaleString()}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { state.restoreDeleted(item.id); toast.success("Restored from Recycle Bin."); }}><RotateCcw /> Restore</Button><Button size="sm" variant="danger" onClick={() => { if (confirm("Permanently delete this item?")) state.permanentlyDelete(item.id); }}><Trash2 /> Delete</Button></div></div>)}</div>}
          {recycleBin.length ? <Button variant="outline" onClick={() => { if (confirm("Permanently empty the Recycle Bin?")) state.emptyRecycleBin(); }}>Empty Recycle Bin</Button> : null}
        </CardContent>
      </Card>
    </div>
  );
}
