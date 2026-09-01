import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  MessageCircle,
  Newspaper,
  QrCode,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppSendPanel } from "@/components/nss/whatsapp-send";
import { Badge } from "@/components/ui/badge";

import { qrSvg } from "@/lib/nss/qr";
import { audienceLabel, eventBroadcastText } from "@/lib/nss/whatsapp";
import { formatLongDate, todayIso } from "@/lib/nss/format";
import { completeActivityReports } from "@/lib/nss/reports";
import { activeVolunteers, useNssStore } from "@/lib/nss/store";

import type { Audience, EventStatus } from "@/lib/nss/types";

export const Route = createFileRoute("/po/events")({
  component: EventsPage,
});

function EventsPage() {
  const state = useNssStore();

  const [form, setForm] = useState({
    name: "",
    date: todayIso(),
    endDate: todayIso(),
    startTime: "09:00",
    endTime: "13:00",
    location: "Mansa",
    hours: 4,
    status: "upcoming" as EventStatus,
    description: "",
    audience: "all" as Audience,
    participantIds: [] as string[],
    qrEnabled: true,
    geofenceEnabled: false,
    geofenceLatitude: undefined as number | undefined,
    geofenceLongitude: undefined as number | undefined,
    geofenceRadiusMeters: 200,
  });

  const [broadcast, setBroadcast] = useState<{
    text: string;
    audience: Audience;
  } | null>(null);

  const [qrEventId, setQrEventId] = useState<string | null>(null);
  const [qrSvgMarkup, setQrSvgMarkup] = useState("");

  async function openEventQr(
    eventId: string,
    regenerate = false,
  ) {
    const store = useNssStore.getState();

    const token = regenerate
      ? store.regenerateEventQr(eventId)
      : store.generateEventQr(eventId);

    if (!token) {
      toast.error("Event not found.");
      return;
    }

    const event = useNssStore
      .getState()
      .events.find((row) => row.id === eventId);

    if (!event) {
      toast.error("Event not found.");
      return;
    }

    const payload = JSON.stringify({
      type: "NSS_EVENT_ATTENDANCE",
      eventId: event.id,
      eventName: event.name,
      token,
      issuedAt: new Date().toISOString(),
    });

    try {
      const svg = await qrSvg(payload, 280);

      setQrSvgMarkup(svg);
      setQrEventId(eventId);

      toast.success(
        regenerate
          ? "Event QR regenerated."
          : "Event QR ready.",
      );
    } catch {
      toast.error("Unable to generate Event QR.");
    }
  }

  function printEventQr() {
    if (!qrSvgMarkup || !qrEventId) return;

    const event = state.events.find(
      (row) => row.id === qrEventId,
    );

    if (!event) return;

    const popup = window.open(
      "",
      "_blank",
      "width=600,height=760",
    );

    if (!popup) {
      toast.error(
        "Please allow pop-ups to print the QR.",
      );
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>NSS Event QR</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
            }

            svg {
              max-width: 320px;
              margin: 25px auto;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <h1>${escapeHtml(event.name)}</h1>

          <p>
            ${escapeHtml(formatLongDate(event.date))}
            ·
            ${escapeHtml(event.location)}
          </p>

          <p>Scan this QR for NSS attendance</p>

          ${qrSvgMarkup}

          <button onclick="window.print()">
            Print QR
          </button>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
  }

  const participation = useMemo(() => {
    const rows = state.volunteers.filter(
      (v) => v.status !== "alumni",
    );

    return new Map(
      state.events.map((event) => {
        const assigned = event.participantIds?.length
          ? rows.filter((v) =>
              event.participantIds?.includes(v.id),
            )
          : rows.filter((v) => {
              if (event.audience === "girls") {
                return v.gender === "Female";
              }

              if (event.audience === "boys") {
                return v.gender === "Male";
              }

              if (event.audience === "leaders") {
                return v.nssRole === "Leader";
              }

              return true;
            });

        const ids = new Set(
          assigned.map((v) => v.id),
        );

        const rsvps = (
          state.eventRsvps ?? []
        ).filter(
          (r) =>
            r.eventId === event.id &&
            ids.has(r.volunteerId),
        );

        const will = rsvps.filter(
          (r) => r.status === "will_attend",
        ).length;

        const wont = rsvps.filter(
          (r) => r.status === "will_not_attend",
        ).length;

        return [
          event.id,
          {
            assigned: assigned.length,
            will,
            wont,
            noResponse: Math.max(
              0,
              assigned.length - will - wont,
            ),
          },
        ] as const;
      }),
    );
  }, [
    state.events,
    state.eventRsvps,
    state.volunteers,
  ]);

  const photoCount = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of state.gallery ?? []) {
      const key =
        item.eventId ||
        item.eventName ||
        "";

      if (!key) continue;

      map.set(
        key,
        (map.get(key) ?? 0) + 1,
      );

      if (item.eventName) {
        map.set(
          item.eventName,
          (map.get(item.eventName) ?? 0) + 1,
        );
      }
    }

    return map;
  }, [state.gallery]);

  function save(openWhatsApp: boolean) {
    if (!form.name.trim()) {
      toast.error("Enter event name.");
      return;
    }

    const created = state.addEvent({
      name: form.name.trim(),
      date: form.date,
      endDate: form.endDate || form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      hours: Number(form.hours) || 0,
      status: form.status,
      description: form.description.trim(),
      audience: form.audience,
      participantIds: form.participantIds.length
        ? form.participantIds
        : undefined,
      qrEnabled: form.qrEnabled,
      geofenceEnabled: form.geofenceEnabled,
      geofenceLatitude: form.geofenceEnabled ? form.geofenceLatitude : undefined,
      geofenceLongitude: form.geofenceEnabled ? form.geofenceLongitude : undefined,
      geofenceRadiusMeters: form.geofenceEnabled ? Number(form.geofenceRadiusMeters) || 200 : undefined,
    });

    toast.success("Event saved.");

    if (openWhatsApp) {
      setBroadcast({
        text: eventBroadcastText(
          created.name,
          formatLongDate(created.date),
          created.location,
          created.description,
        ),
        audience: created.audience ?? "all",
      });

      window.setTimeout(() => {
        document
          .getElementById("wa-all")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 80);
    }

    setForm({
      name: "",
      date: todayIso(),
      endDate: todayIso(),
      startTime: "09:00",
      endTime: "13:00",
      location: "Mansa",
      hours: 4,
      status: "upcoming",
      description: "",
      audience: "all",
      participantIds: [],
      qrEnabled: true,
      geofenceEnabled: false,
      geofenceLatitude: undefined,
      geofenceLongitude: undefined,
      geofenceRadiusMeters: 200,
    });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    save(true);
  }

  async function completeActivity(
    id: string,
    name: string,
  ) {
    state.updateEvent(id, {
      status: "completed",
    });

    state.addLog(
      "Activity completed",
      `Completed ${name}. Press report and yearly report generated.`,
    );

    toast.success(
      "Activity completed. Opening press report with photos and yearly Excel.",
    );

    await completeActivityReports(
      useNssStore.getState(),
      id,
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">
        Events
      </h2>

      <Card>
        <CardContent className="pt-5">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={add}
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Event name</Label>

              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Start date</Label>

              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                    endDate:
                      form.endDate ||
                      e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>End date</Label>

              <Input
                type="date"
                min={form.date}
                value={form.endDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Start time</Label>

              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startTime: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>End time</Label>

              <Input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endTime: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Location</Label>

              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Service hours</Label>

              <Input
                type="number"
                min={0}
                value={form.hours}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hours: Number(
                      e.target.value,
                    ),
                  })
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2 rounded-xl border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.geofenceEnabled}
                  onChange={(e) => setForm({ ...form, geofenceEnabled: e.target.checked })}
                />
                Enable GPS / Geofence attendance
              </label>
              <p className="text-xs text-muted-foreground">When enabled, QR attendance must be marked within the configured radius of this event location.</p>
              {form.geofenceEnabled ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input type="number" step="any" placeholder="Latitude" value={form.geofenceLatitude ?? ""} onChange={(e) => setForm({ ...form, geofenceLatitude: e.target.value ? Number(e.target.value) : undefined })} />
                  <Input type="number" step="any" placeholder="Longitude" value={form.geofenceLongitude ?? ""} onChange={(e) => setForm({ ...form, geofenceLongitude: e.target.value ? Number(e.target.value) : undefined })} />
                  <Input type="number" min="25" step="25" placeholder="Radius (m)" value={form.geofenceRadiusMeters} onChange={(e) => setForm({ ...form, geofenceRadiusMeters: Number(e.target.value) || 200 })} />
                  <Button type="button" variant="outline" onClick={() => {
                    if (!navigator.geolocation) { toast.error("GPS is not available in this browser."); return; }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setForm({ ...form, geofenceEnabled: true, geofenceLatitude: pos.coords.latitude, geofenceLongitude: pos.coords.longitude }),
                      () => toast.error("Could not read current location. Allow GPS permission."),
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                    );
                  }}>Use current location</Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>

              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value as EventStatus,
                  })
                }
              >
                <option value="upcoming">
                  Upcoming
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Audience (WhatsApp group)
              </Label>

              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                value={form.audience}
                onChange={(e) =>
                  setForm({
                    ...form,
                    audience:
                      e.target.value as Audience,
                  })
                }
              >
                <option value="all">
                  All (girls + boys groups)
                </option>

                <option value="girls">
                  Girls only
                </option>

                <option value="boys">
                  Boys only
                </option>

                <option value="leaders">
                  Leaders group
                </option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Assign volunteers (optional)
              </Label>

              <p className="text-xs text-muted-foreground">
                Leave empty to assign by the
                selected audience. Select specific
                volunteers when this event is for a
                fixed group.
              </p>

              <div className="grid max-h-48 gap-2 overflow-auto rounded-xl border border-border p-3 sm:grid-cols-2">
                {activeVolunteers(state).map(
                  (v) => {
                    const checked =
                      form.participantIds.includes(
                        v.id,
                      );

                    return (
                      <label
                        key={v.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              participantIds:
                                e.target.checked
                                  ? [
                                      ...form.participantIds,
                                      v.id,
                                    ]
                                  : form.participantIds.filter(
                                      (id) =>
                                        id !== v.id,
                                    ),
                            })
                          }
                        />

                        <span>
                          {v.fullName}{" "}
                          <span className="text-muted-foreground">
                            ({v.volunteerId})
                          </span>
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>

              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit">
                <MessageCircle />
                Save & WhatsApp
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => save(false)}
              >
                Save only
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {state.events
          .slice()
          .sort((a, b) =>
            b.date.localeCompare(a.date),
          )
          .map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-5">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {e.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {formatLongDate(e.date)}

                    {e.endDate &&
                    e.endDate !== e.date
                      ? ` – ${formatLongDate(
                          e.endDate,
                        )}`
                      : ""}

                    {e.startTime
                      ? ` · ${e.startTime}${
                          e.endTime
                            ? `–${e.endTime}`
                            : ""
                        }`
                      : ""}

                    {" · "}
                    {e.location}
                    {" · "}
                    {e.hours} hrs
                    {" · "}
                    {audienceLabel(
                      e.audience,
                    )}

                    {(photoCount.get(e.id) ||
                      photoCount.get(
                        e.name,
                      ))
                      ? ` · ${
                          photoCount.get(
                            e.id,
                          ) ||
                          photoCount.get(
                            e.name,
                          )
                        } gallery file(s)`
                      : ""}
                  </p>

                  {e.description ? (
                    <p className="mt-1 text-sm">
                      {e.description}
                    </p>
                  ) : null}

                  {(() => {
                    const p =
                      participation.get(e.id);

                    return p ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge tone="muted">
                          Assigned {p.assigned}
                        </Badge>

                        <Badge tone="forest">
                          Will Attend {p.will}
                        </Badge>

                        <Badge tone="danger">
                          Will Not Attend {p.wont}
                        </Badge>

                        <Badge tone="saffron">
                          No Response{" "}
                          {p.noResponse}
                        </Badge>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      e.status === "completed"
                        ? "forest"
                        : e.status ===
                            "upcoming"
                          ? "saffron"
                          : "muted"
                    }
                  >
                    {e.status}
                  </Badge>

                  <select
                    className="h-8 rounded-md border border-border bg-card px-2 text-xs"
                    value={e.status}
                    onChange={(ev) => {
                      const status =
                        ev.target.value as EventStatus;

                      if (
                        status ===
                          "completed" &&
                        e.status !==
                          "completed"
                      ) {
                        void completeActivity(
                          e.id,
                          e.name,
                        );
                      } else {
                        state.updateEvent(
                          e.id,
                          { status },
                        );
                      }
                    }}
                  >
                    <option value="upcoming">
                      Upcoming
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void completeActivity(
                        e.id,
                        e.name,
                      )
                    }
                  >
                    <Newspaper />
                    Complete + press
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void completeActivityReports(
                        useNssStore.getState(),
                        e.id,
                      )
                    }
                  >
                    <FileSpreadsheet />
                    Yearly report
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void openEventQr(e.id)
                    }
                  >
                    <QrCode />
                    Event QR
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void openEventQr(
                        e.id,
                        true,
                      )
                    }
                  >
                    <RefreshCw />
                    Regenerate QR
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setBroadcast({
                        text: eventBroadcastText(
                          e.name,
                          formatLongDate(
                            e.date,
                          ),
                          e.location,
                          e.description,
                        ),
                        audience:
                          e.audience ?? "all",
                      });

                      window.setTimeout(
                        () =>
                          document
                            .getElementById(
                              "wa-all",
                            )
                            ?.scrollIntoView({
                              behavior:
                                "smooth",
                            }),
                        80,
                      );
                    }}
                  >
                    <MessageCircle />
                    WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      state.deleteEvent(e.id)
                    }
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {qrEventId && qrSvgMarkup ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-5 text-center">
            <div>
              <p className="font-display text-lg font-semibold">
                Event Attendance QR
              </p>

              <p className="text-sm text-muted-foreground">
                {state.events.find(
                  (event) =>
                    event.id ===
                    qrEventId,
                )?.name ?? "Event"}
              </p>
            </div>

            <div
              className="rounded-xl border border-border bg-white p-3"
              dangerouslySetInnerHTML={{
                __html: qrSvgMarkup,
              }}
            />

            <p className="max-w-md text-xs text-muted-foreground">
              Event-specific QR. Duplicate
              attendance for the same volunteer
              and event is prevented.
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void openEventQr(
                    qrEventId,
                    true,
                  )
                }
              >
                <RefreshCw />
                Regenerate
              </Button>

              <Button
                size="sm"
                onClick={printEventQr}
              >
                Print QR
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQrEventId(null);
                  setQrSvgMarkup("");
                }}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {broadcast ? (
        <WhatsAppSendPanel
          key={
            broadcast.text +
            broadcast.audience
          }
          title={`Send this event to ${audienceLabel(
            broadcast.audience,
          ).toLowerCase()} on WhatsApp`}
          recipients={activeVolunteers(state)}
          message={broadcast.text}
          audience={broadcast.audience}
        />
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}