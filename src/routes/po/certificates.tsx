import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  htmlForCertificates,
  openPreparedCertificate,
  preparedCertificate,
} from "@/lib/nss/certificates";
import { formatLongDate } from "@/lib/nss/format";
import { certificateOf, presentVolunteers, useNssStore } from "@/lib/nss/store";
import { useSessionStore } from "@/lib/nss/session";
import type { IssuedCertificate, NssEvent, Volunteer } from "@/lib/nss/types";

export const Route = createFileRoute("/po/certificates")({ component: CertificatesPage });

function pushSent(certs: IssuedCertificate[]) {
  const token = useSessionStore.getState().session?.chatToken || "";
  const rows = certs.filter((cert) => cert.sentAt);
  if (!token || !rows.length) return;
  void fetch("/api/nss-cloud", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "push-certificates",
      chatToken: token,
      certificates: rows.map((cert) => ({
        id: cert.id,
        volunteerId: cert.volunteerId,
        eventId: cert.eventId,
        generatedAt: cert.generatedAt,
        sentAt: cert.sentAt,
        certificateId: cert.certificateId || "",
        printReady: true,
      })),
    }),
  }).catch(() => undefined);
}

function bestEventId(
  events: NssEvent[],
  presentCounts: Record<string, number>,
) {
  const ranked = [...events].sort((a, b) => {
    const diff = (presentCounts[b.id] ?? 0) - (presentCounts[a.id] ?? 0);
    if (diff) return diff;
    const completed = Number(b.status === "completed") - Number(a.status === "completed");
    if (completed) return completed;
    return b.date.localeCompare(a.date);
  });
  return ranked[0]?.id ?? "";
}

function CertificatesPage() {
  const state = useNssStore();
  const events = useMemo(
    () => [...state.events].sort((a, b) => b.date.localeCompare(a.date)),
    [state.events],
  );
  const presentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.id] = presentVolunteers(state, event.id).length;
    }
    return counts;
  }, [events, state]);
  const [eventId, setEventId] = useState(() => bestEventId(events, presentCounts));
  const event = events.find((e) => e.id === eventId) ?? events[0];
  const present = event ? presentVolunteers(state, event.id) : [];
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      if (sessionStorage.getItem("nsp-cert-pushed")) return;
      const sent = (useNssStore.getState().certificates ?? []).filter((cert) => cert.sentAt);
      if (!sent.length) return;
      sessionStorage.setItem("nsp-cert-pushed", "1");
      pushSent(sent);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!events.length) return;
    const currentCount = eventId ? presentCounts[eventId] ?? 0 : 0;
    if (currentCount > 0) return;
    const nextId = bestEventId(events, presentCounts);
    if (nextId && nextId !== eventId) setEventId(nextId);
  }, [events, presentCounts, eventId]);

  const selectedIds = present.filter((v) => picked[v.id] !== false).map((v) => v.id);

  function toggle(id: string) {
    setPicked((prev) => ({ ...prev, [id]: prev[id] === false }));
  }

  function selectAll(on: boolean) {
    const next: Record<string, boolean> = {};
    present.forEach((v) => {
      next[v.id] = on;
    });
    setPicked(next);
  }

  function rowsFor(ids: string[]) {
    if (!event) return [];
    const latest = useNssStore.getState();
    return present
      .filter((v) => ids.includes(v.id))
      .map((v) => ({
        cert: preparedCertificate(v, event, certificateOf(latest, v.id, event.id)),
        volunteer: v,
        event,
      }));
  }

  function generate() {
    if (!event) return;
    if (selectedIds.length === 0) {
      toast.error("Select at least one present volunteer.");
      return;
    }
    const already = selectedIds.filter((id) => certificateOf(state, id, event.id));
    const added = state.generateCertificates(event.id, selectedIds);
    if (added.length === 0) {
      toast.message("No duplicates. Certificates already generated for the selected names.");
    } else if (already.length) {
      toast.success(
        `Generated ${added.length} new certificate${added.length === 1 ? "" : "s"}. ${already.length} already issued — skipped.`,
      );
    } else {
      toast.success(`Generated ${added.length} certificate${added.length === 1 ? "" : "s"}.`);
    }
  }

  function send() {
    if (!event) return;
    if (selectedIds.length === 0) {
      toast.error("Select at least one present volunteer.");
      return;
    }
    state.generateCertificates(event.id, selectedIds);
    const ids = useNssStore
      .getState()
      .certificates.filter((c) => c.eventId === event.id && !c.sentAt && selectedIds.includes(c.volunteerId))
      .map((c) => c.id);
    if (ids.length === 0) {
      toast.message("Selected certificates are already on volunteer dashboards.");
      return;
    }
    const n = state.sendCertificates(ids);
    pushSent(useNssStore.getState().certificates.filter((cert) => ids.includes(cert.id)));
    toast.success(`Sent ${n} certificate${n === 1 ? "" : "s"} to volunteer dashboards.`);
  }

  async function printRows(ids: string[]) {
    if (!event) return;
    if (ids.length === 0) {
      toast.error("Select at least one present volunteer.");
      return;
    }
    state.generateCertificates(event.id, ids);
    const rows = rowsFor(ids);
    const opened = await openPreparedCertificate(() => htmlForCertificates(rows, state.settings));
    if (!opened) toast.message("Popup was blocked. The certificate file was downloaded instead.");
  }

  async function printSelected() {
    await printRows(selectedIds);
  }

  async function viewOne(volunteer: Volunteer) {
    if (!event) return;
    await printRows([volunteer.id]);
  }

  function removeOne(volunteer: Volunteer) {
    if (!event) return;
    const cert = certificateOf(useNssStore.getState(), volunteer.id, event.id);
    if (!cert) {
      toast.message(`No certificate to delete for ${volunteer.fullName}.`);
      return;
    }
    const removed = useNssStore.getState().deleteCertificate(cert.id);
    if (!removed) {
      toast.error("Could not delete that certificate.");
      return;
    }
    toast.success(`Deleted ${cert.certificateId || "certificate"} for ${volunteer.fullName}.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Certificates</h2>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Event</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={event?.id ?? ""}
              onChange={(e) => {
                setEventId(e.target.value);
                setPicked({});
              }}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {formatLongDate(e.date)} ({e.status}
                  {presentCounts[e.id] ? `, ${presentCounts[e.id]} present` : ""})
                </option>
              ))}
            </select>
          </label>

          {event ? (
            <p className="text-sm text-muted-foreground">
              {event.location} · {event.hours} hrs · {present.length} present of {state.volunteers.length}{" "}
              volunteers
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Button type="button" onClick={() => void printSelected().then(() => send())}>
              Issue
            </Button>
            <Button type="button" variant="outline" onClick={send}>
              Send
            </Button>
            <Button type="button" variant="outline" onClick={() => void printSelected()}>
              Print
            </Button>
            <Button type="button" variant="ghost" onClick={() => selectAll(true)}>
              All
            </Button>
            <Button type="button" variant="ghost" onClick={() => selectAll(false)}>
              None
            </Button>
          </div>
        </CardContent>
      </Card>

      {present.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">
            No one marked present.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-3 py-2 font-medium"> </th>
                <th className="px-3 py-2 font-medium">Volunteer ID</th>
                <th className="px-3 py-2 font-medium">Name (NSS roll)</th>
                <th className="px-3 py-2 font-medium">Certificate ID</th>
                <th className="px-3 py-2 font-medium">Unit</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {present.map((v) => {
                const cert = event ? certificateOf(state, v.id, event.id) : undefined;
                const on = picked[v.id] !== false;
                return (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={on}
                        onChange={() => toggle(v.id)}
                        aria-label={`Select ${v.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums">{v.volunteerId}</td>
                    <td className="px-3 py-2 font-medium">{v.fullName}</td>
                    <td className="px-3 py-2 font-mono text-xs">{cert?.certificateId || "—"}</td>
                    <td className="px-3 py-2">{v.unit}</td>
                    <td className="px-3 py-2">
                      {cert?.sentAt ? (
                        <Badge tone="forest">Sent to dashboard</Badge>
                      ) : cert ? (
                        <Badge tone="saffron">Generated</Badge>
                      ) : (
                        <Badge tone="muted">Ready to print</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {event ? (
                        <div className="flex flex-wrap gap-1">
                          <Button type="button" size="sm" variant="outline" onClick={() => void viewOne(v)}>
                            View
                          </Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => removeOne(v)}>
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}