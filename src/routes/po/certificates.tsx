import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, Printer, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { htmlForCertificate, htmlForCertificates, openPreparedCertificate } from "@/lib/nss/certificates";
import { formatLongDate } from "@/lib/nss/format";
import { certificateOf, presentVolunteers, useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/po/certificates")({ component: CertificatesPage });

function CertificatesPage() {
  const state = useNssStore();
  const events = useMemo(
    () => [...state.events].sort((a, b) => b.date.localeCompare(a.date)),
    [state.events],
  );
  const defaultEvent =
    events.find((e) => e.status === "completed")?.id ?? events[0]?.id ?? "";
  const [eventId, setEventId] = useState(defaultEvent);
  const event = events.find((e) => e.id === eventId) ?? events[0];
  const present = event ? presentVolunteers(state, event.id) : [];
  const [picked, setPicked] = useState<Record<string, boolean>>({});

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
    const ids = state.certificates
      .filter((c) => c.eventId === event.id && !c.sentAt && selectedIds.includes(c.volunteerId))
      .map((c) => c.id);
    if (ids.length === 0) {
      toast.error("Generate first, then send. Only generated certificates go to dashboards.");
      return;
    }
    const n = state.sendCertificates(ids);
    toast.success(`Sent ${n} certificate${n === 1 ? "" : "s"} to volunteer dashboards.`);
  }

  async function printSelected() {
    if (!event) return;
    const rows = present
      .filter((v) => selectedIds.includes(v.id))
      .map((v) => {
        const cert = certificateOf(state, v.id, event.id);
        return cert ? { cert, volunteer: v, event } : null;
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    if (rows.length === 0) {
      toast.error("Generate certificates before printing.");
      return;
    }
    const opened = await openPreparedCertificate(() => htmlForCertificates(rows, state.settings));
    if (!opened) toast.message("Popup was blocked. The certificate file was downloaded instead.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Certificates</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Select an event. Volunteers marked present load automatically. Generate, then send — each
          certificate appears on that registered volunteer's dashboard. The same student cannot receive
          a second certificate for the same event.
        </p>
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
                  {e.name} — {formatLongDate(e.date)} ({e.status})
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

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={generate}>
              <Award />
              Generate certificate
            </Button>
            <Button type="button" variant="forest" onClick={send}>
              <Send />
              Send to volunteer dashboards
            </Button>
            <Button type="button" variant="outline" onClick={() => void printSelected()}>
              <Printer />
              View / Print
            </Button>
            <Button type="button" variant="ghost" onClick={() => selectAll(true)}>
              Select all
            </Button>
            <Button type="button" variant="ghost" onClick={() => selectAll(false)}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {present.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">
            No present volunteers for this event. Mark attendance first, then return here.
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
                    <td className="px-3 py-2">{v.unit}</td>
                    <td className="px-3 py-2">
                      {cert?.sentAt ? (
                        <Badge tone="forest">Sent to dashboard</Badge>
                      ) : cert ? (
                        <Badge tone="saffron">Generated</Badge>
                      ) : (
                        <Badge tone="muted">Not generated</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {cert && event ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void openPreparedCertificate(() =>
                              htmlForCertificate(cert, v, event, state.settings),
                            )
                          }
                        >
                          View
                        </Button>
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
