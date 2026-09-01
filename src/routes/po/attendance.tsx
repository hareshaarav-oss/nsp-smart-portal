import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Download,
  QrCode,
  RefreshCw,
  Square,
  Users,
  XCircle,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";

import {
  eventColumnLabel,
  downloadAttendanceExcel,
  printAttendanceReport,
} from "@/lib/nss/reports";

import {
  activeVolunteers,
  attendanceOf,
  rsvpOf,
  useNssStore,
} from "@/lib/nss/store";

import {
  academicYear,
  formatLongDate,
  todayIso,
} from "@/lib/nss/format";

import { qrSvg } from "@/lib/nss/qr";

export const Route = createFileRoute("/po/attendance")({
  component: AttendancePage,
});

type ScanResult = {
  volunteerId: string;
  eventId: string;
};

type BarcodeDetectorLike = {
  detect: (
    source: HTMLVideoElement,
  ) => Promise<Array<{ rawValue?: string }>>;
};

function AttendancePage() {
  const state = useNssStore();

  const events = useMemo(
    () =>
      [...(state.events ?? [])].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [state.events],
  );

  const volunteers = useMemo(
    () => activeVolunteers(state),
    [state],
  );

  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [month, setMonth] = useState(todayIso().slice(0, 7));

  const [qrSvgMarkup, setQrSvgMarkup] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrCreatedAt, setQrCreatedAt] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [manualPayload, setManualPayload] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  const current =
    events.find((e) => e.id === eventId) ?? events[0];

  /*
   * Keep selected event valid when events change.
   */
  useEffect(() => {
    if (!events.length) {
      if (eventId) setEventId("");
      return;
    }

    if (!events.some((event) => event.id === eventId)) {
      setEventId(events[0].id);
    }
  }, [events, eventId]);

  /*
   * Stop camera safely.
   */
  const stopScanner = useCallback(() => {
    scanningRef.current = false;

    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerOpen(false);
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, [stopScanner]);

  /*
   * Generate a fresh event QR.
   *
   * Payload format:
   * NSP_ATTENDANCE|eventId|timestamp|nonce
   *
   * A fresh nonce is generated every time, so the displayed
   * event QR changes instead of being one permanent QR.
   */
  const generateEventQr = useCallback(
    async () => {
      if (!current) {
        toast.error("Please select an event first.");
        return;
      }

      const timestamp = Date.now().toString(36);
      const nonce = crypto.randomUUID();

      const payload = [
        "NSP_ATTENDANCE",
        current.id,
        timestamp,
        nonce,
      ].join("|");

      try {
        const svg = await qrSvg(payload, 260);

        setQrSvgMarkup(svg);
        setQrToken(payload);
        setQrCreatedAt(new Date().toLocaleString());

        state.addLog(
          "Attendance QR generated",
          `Dynamic attendance QR generated for ${current.name}.`,
        );

        toast.success("Fresh event QR generated.");
      } catch {
        toast.error("Unable to generate QR.");
      }
    },
    [current, state],
  );

  /*
   * Parse a QR payload.
   *
   * Supports:
   *  NSP_ATTENDANCE|eventId|timestamp|nonce
   *
   * Also supports:
   *  NSP_VOLUNTEER|volunteerId|eventId
   *
   * The second format is useful when a volunteer QR carries
   * both volunteer and event information.
   */
  const parseQrPayload = useCallback(
    (raw: string): ScanResult | null => {
      const value = raw.trim();

      if (!value) return null;

      const parts = value.split("|");

      if (parts[0] === "NSP_VOLUNTEER") {
        const volunteerId = parts[1];
        const payloadEventId = parts[2];

        if (!volunteerId) return null;

        return {
          volunteerId,
          eventId: payloadEventId || current?.id || "",
        };
      }

      if (parts[0] === "NSP_ATTENDANCE") {
        const payloadEventId = parts[1];

        if (!payloadEventId) return null;

        /*
         * Event QR alone identifies the event.
         * Volunteer identity is then requested manually if
         * the scanned QR does not carry a volunteer ID.
         */
        return {
          volunteerId: "",
          eventId: payloadEventId,
        };
      }

      /*
       * Accept a plain volunteer ID as a fallback.
       */
      const volunteer = volunteers.find(
        (v) =>
          v.id === value ||
          v.volunteerId.toLowerCase() === value.toLowerCase(),
      );

      if (volunteer) {
        return {
          volunteerId: volunteer.id,
          eventId: current?.id ?? "",
        };
      }

      return null;
    },
    [current, volunteers],
  );

  /*
   * Actually mark one volunteer present.
   */
  const markPresent = useCallback(
    (volunteerId: string, targetEventId: string) => {
      const event = state.events.find(
        (e) => e.id === targetEventId,
      );

      const volunteer = state.volunteers.find(
        (v) =>
          v.id === volunteerId ||
          v.volunteerId === volunteerId,
      );

      if (!event) {
        toast.error("Event not found.");
        return false;
      }

      if (!volunteer) {
        toast.error("Volunteer not found.");
        return false;
      }

      const existing = attendanceOf(
        state,
        volunteer.id,
        event.id,
      );

      if (existing?.present) {
        toast.info(
          `${volunteer.fullName} is already marked Present.`,
        );
        return false;
      }

      state.setAttendance(
        volunteer.id,
        event.id,
        true,
      );

      state.addLog(
        "QR Attendance",
        `${volunteer.fullName} marked Present for ${event.name}.`,
      );

      toast.success(
        `${volunteer.fullName} marked Present.`,
      );

      return true;
    },
    [state],
  );

  /*
   * Process scanned/manual payload.
   */
  const processPayload = useCallback(
    (raw: string) => {
      const result = parseQrPayload(raw);

      if (!result) {
        toast.error("Invalid NSP QR / Volunteer ID.");
        return;
      }

      const targetEventId =
        result.eventId || current?.id || "";

      if (!targetEventId) {
        toast.error("No event selected.");
        return;
      }

      /*
       * Event QR without volunteer identity:
       * show the event confirmation and ask for volunteer ID.
       */
      if (!result.volunteerId) {
        const event = state.events.find(
          (e) => e.id === targetEventId,
        );

        if (!event) {
          toast.error("QR belongs to an unknown event.");
          return;
        }

        if (targetEventId !== current?.id) {
          toast.error(
            `QR belongs to "${event.name}". Select that event first.`,
          );
          return;
        }

        toast.info(
          "Event QR verified. Scan the volunteer QR or enter Volunteer ID.",
        );
        return;
      }

      const event = state.events.find(
        (e) => e.id === targetEventId,
      );

      if (!event) {
        toast.error("QR belongs to an unknown event.");
        return;
      }

      if (current && event.id !== current.id) {
        toast.error(
          `This QR belongs to "${event.name}".`,
        );
        return;
      }

      markPresent(result.volunteerId, targetEventId);
    },
    [
      current,
      markPresent,
      parseQrPayload,
      state.events,
    ],
  );

  /*
   * Native browser QR scanner.
   *
   * BarcodeDetector is available in supported Chromium-based
   * browsers. Unsupported browsers receive a clear message.
   */
  const startScanner = useCallback(async () => {
    if (!current) {
      toast.error("Please select an event first.");
      return;
    }

    setScannerError("");

    const BarcodeDetectorCtor = (
      window as Window & {
        BarcodeDetector?: new (options?: {
          formats?: string[];
        }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;

    if (!BarcodeDetectorCtor) {
      setScannerError(
        "આ browserમાં QR camera scanner ઉપલબ્ધ નથી. Chrome/Edgeમાં ખોલો અથવા નીચે QR payload / Volunteer ID manually નાખો.",
      );
      setScannerOpen(true);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError(
        "Camera access આ browserમાં ઉપલબ્ધ નથી.",
      );
      setScannerOpen(true);
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

      streamRef.current = stream;
      setScannerOpen(true);

      /*
       * Wait until video element is rendered.
       */
      window.setTimeout(() => {
        const video = videoRef.current;

        if (!video) {
          setScannerError("Camera preview could not start.");
          return;
        }

        video.srcObject = stream;
        void video.play();

        const detector = new BarcodeDetectorCtor({
          formats: ["qr_code"],
        });

        scanningRef.current = true;

        const scan = async () => {
          if (!scanningRef.current) return;

          try {
            if (
              video.readyState >=
              HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
              const codes =
                await detector.detect(video);

              const raw = codes[0]?.rawValue?.trim();

              if (raw) {
                processPayload(raw);
                stopScanner();
                return;
              }
            }
          } catch {
            /*
             * Continue scanning. A transient detector error
             * should not terminate the camera session.
             */
          }

          scanTimerRef.current =
            window.setTimeout(scan, 450);
        };

        void scan();
      }, 100);
    } catch (error) {
      console.error(error);
      setScannerError(
        "Camera permission મળી નથી. Browser camera permission Allow કરો.",
      );
      setScannerOpen(true);
    }
  }, [current, processPayload, stopScanner]);

  /*
   * Manual QR / volunteer ID fallback.
   */
  function submitManualPayload() {
    if (!manualPayload.trim()) {
      toast.error("Volunteer ID અથવા QR payload નાખો.");
      return;
    }

    processPayload(manualPayload);
    setManualPayload("");
  }

  const attendanceSummary = useMemo(() => {
    if (!current) {
      return {
        present: 0,
        absent: 0,
        notMarked: volunteers.length,
        willAttend: 0,
        willNotAttend: 0,
        noResponse: volunteers.length,
      };
    }

    const assigned = volunteers;

    let present = 0;
    let absent = 0;
    let notMarked = 0;
    let willAttend = 0;
    let willNotAttend = 0;
    let noResponse = 0;

    for (const volunteer of assigned) {
      const attendance = attendanceOf(
        state,
        volunteer.id,
        current.id,
      );

      if (!attendance) {
        notMarked += 1;
      } else if (attendance.present) {
        present += 1;
      } else {
        absent += 1;
      }

      const rsvp = rsvpOf(
        state,
        volunteer.id,
        current.id,
      );

      if (!rsvp) {
        noResponse += 1;
      } else if (rsvp.status === "will_attend") {
        willAttend += 1;
      } else {
        willNotAttend += 1;
      }
    }

    return {
      present,
      absent,
      notMarked,
      willAttend,
      willNotAttend,
      noResponse,
    };
  }, [current, state, volunteers]);

  const attendancePercent = useMemo(() => {
    const total =
      attendanceSummary.present +
      attendanceSummary.absent;

    return total
      ? Math.round(
          (attendanceSummary.present / total) * 100,
        )
      : 0;
  }, [attendanceSummary]);

  return (
    <div className="space-y-6">
      <OfficialLetterhead
        title="Attendance"
        compact
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Attendance
          </h2>

          <p className="text-sm text-muted-foreground">
            Manual + QR attendance, event-wise records,
            RSVP comparison and Excel reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button
            onClick={() =>
              downloadAttendanceExcel(state, {
                mode: "yearly",
              })
            }
          >
            <Download />
            Full yearly Excel
          </Button>

          <label className="space-y-1 text-xs text-muted-foreground">
            Month
            <input
              type="month"
              className="flex h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
              value={month}
              onChange={(e) =>
                setMonth(e.target.value)
              }
            />
          </label>

          <Button
            variant="outline"
            onClick={() =>
              downloadAttendanceExcel(state, {
                mode: "monthly",
                month,
              })
            }
          >
            <Download />
            Monthly Excel
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              void printAttendanceReport(state, {
                mode: "yearly",
              })
            }
          >
            <Printer />
            Print yearly
          </Button>
        </div>
      </div>

      {/* EVENT SELECTOR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Attendance Event
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">
                Event
              </span>

              <select
                className="flex h-10 min-w-72 rounded-md border border-border bg-card px-3 text-sm"
                value={current?.id ?? ""}
                onChange={(e) =>
                  setEventId(e.target.value)
                }
              >
                {events.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                  >
                    {event.name} —{" "}
                    {formatLongDate(event.date)}
                  </option>
                ))}
              </select>
            </label>

            {current ? (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm">
                <b>{current.name}</b>
                <span className="text-muted-foreground">
                  {" "}
                  · {current.hours} service hours
                </span>
              </div>
            ) : null}
          </div>

          {/* SUMMARY */}
          {current ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <SummaryCard
                icon={<CheckCircle2 />}
                title="Present"
                value={attendanceSummary.present}
              />

              <SummaryCard
                icon={<XCircle />}
                title="Absent"
                value={attendanceSummary.absent}
              />

              <SummaryCard
                icon={<Users />}
                title="Not Marked"
                value={attendanceSummary.notMarked}
              />

              <SummaryCard
                icon={<CheckCircle2 />}
                title="RSVP Yes"
                value={attendanceSummary.willAttend}
              />

              <SummaryCard
                icon={<XCircle />}
                title="RSVP No"
                value={attendanceSummary.willNotAttend}
              />

              <SummaryCard
                icon={<Users />}
                title="Attendance %"
                value={`${attendancePercent}%`}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* QR ATTENDANCE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5" />
            Smart QR Attendance
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                void generateEventQr()
              }
              disabled={!current}
            >
              <QrCode />
              Generate Fresh Event QR
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!qrSvgMarkup) {
                  toast.info(
                    "પહેલા Event QR generate કરો.",
                  );
                  return;
                }

                void generateEventQr();
              }}
            >
              <RefreshCw />
              Refresh QR
            </Button>

            <Button
              variant="forest"
              onClick={() =>
                void startScanner()
              }
              disabled={!current}
            >
              <Camera />
              Scan Volunteer QR
            </Button>
          </div>

          {qrSvgMarkup ? (
            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4">
                <div
                  className="h-[260px] w-[260px]"
                  dangerouslySetInnerHTML={{
                    __html: qrSvgMarkup,
                  }}
                />

                <p className="mt-3 text-center text-xs text-slate-600">
                  {current?.name}
                </p>

                {qrCreatedAt ? (
                  <p className="text-center text-[11px] text-slate-500">
                    Generated: {qrCreatedAt}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">
                    Dynamic Event QR
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    આ QR selected event માટે fresh
                    attendance session payload ધરાવે છે.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    QR Payload
                  </p>

                  <code className="block break-all text-xs">
                    {qrToken}
                  </code>
                </div>

                <p className="text-xs text-muted-foreground">
                  Volunteer QR scan થયા પછી volunteerને
                  selected event માટે Present કરવામાં આવશે.
                  Existing attendance record હોય તો duplicate
                  entry નહીં બને.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Event પસંદ કરીને{" "}
              <b>Generate Fresh Event QR</b> દબાવો.
            </div>
          )}
        </CardContent>
      </Card>

      {/* CAMERA SCANNER */}
      {scannerOpen ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Camera Scanner
              </span>

              <Button
                size="sm"
                variant="danger"
                onClick={stopScanner}
              >
                <Square />
                Stop
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {scannerError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                {scannerError}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-black">
                <video
                  ref={videoRef}
                  className="mx-auto aspect-video w-full max-w-2xl object-cover"
                  muted
                  playsInline
                />
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                placeholder="Volunteer ID અથવા QR payload"
                value={manualPayload}
                onChange={(e) =>
                  setManualPayload(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitManualPayload();
                  }
                }}
              />

              <Button onClick={submitManualPayload}>
                Mark Present
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* MANUAL ATTENDANCE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Manual Attendance
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {current ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="forest"
                onClick={() =>
                  state.markAllAttendance(
                    current.id,
                    true,
                  )
                }
              >
                <CheckCircle2 />
                All present
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  state.markAllAttendance(
                    current.id,
                    false,
                  )
                }
              >
                <XCircle />
                All absent
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  state.addLog(
                    "Attendance saved",
                    `Attendance saved for ${current.name}.`,
                  );

                  toast.success(
                    "Attendance saved successfully.",
                  );
                }}
              >
                Save attendance
              </Button>
            </div>
          ) : null}

          {current ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left">
                      Unit
                    </th>
                    <th className="px-3 py-2 text-left">
                      RSVP
                    </th>
                    <th className="px-3 py-2 text-left">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {volunteers.map((v) => {
                    const rec = attendanceOf(
                      state,
                      v.id,
                      current.id,
                    );

                    const rsvp = rsvpOf(
                      state,
                      v.id,
                      current.id,
                    );

                    const present =
                      rec?.present === true;

                    return (
                      <tr
                        key={v.id}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2">
                          {v.volunteerId}
                        </td>

                        <td className="px-3 py-2">
                          {v.fullName}
                        </td>

                        <td className="px-3 py-2">
                          {v.unit}
                        </td>

                        <td className="px-3 py-2">
                          {!rsvp ? (
                            <span className="text-muted-foreground">
                              No Response
                            </span>
                          ) : rsvp.status ===
                            "will_attend" ? (
                            <span className="font-medium">
                              Will Attend
                            </span>
                          ) : (
                            <span className="font-medium">
                              Will Not Attend
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={
                                present && rec
                                  ? "forest"
                                  : "outline"
                              }
                              onClick={() =>
                                state.setAttendance(
                                  v.id,
                                  current.id,
                                  true,
                                )
                              }
                            >
                              Present
                            </Button>

                            <Button
                              size="sm"
                              variant={
                                rec && !present
                                  ? "danger"
                                  : "outline"
                              }
                              onClick={() =>
                                state.setAttendance(
                                  v.id,
                                  current.id,
                                  false,
                                )
                              }
                            >
                              Absent
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No events available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* EVENT-WISE SHEET */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Event-wise sheet preview · Academic year{" "}
            {academicYear()}
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-2 py-2">
                  Sr.
                </th>

                <th className="px-2 py-2">
                  Volunteer ID
                </th>

                <th className="px-2 py-2">
                  Volunteer Name
                </th>

                <th className="px-2 py-2">
                  NSS Unit
                </th>

                {events.map((e) => (
                  <th
                    key={e.id}
                    className="px-2 py-2"
                  >
                    {eventColumnLabel(e)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {volunteers.map((v, i) => (
                <tr
                  key={v.id}
                  className="border-t border-border"
                >
                  <td className="px-2 py-1.5">
                    {i + 1}
                  </td>

                  <td className="px-2 py-1.5">
                    {v.volunteerId}
                  </td>

                  <td className="px-2 py-1.5">
                    {v.fullName}
                  </td>

                  <td className="px-2 py-1.5">
                    {v.unit}
                  </td>

                  {events.map((e) => {
                    const rec = attendanceOf(
                      state,
                      v.id,
                      e.id,
                    );

                    return (
                      <td
                        key={e.id}
                        className="px-2 py-1.5"
                      >
                        {rec
                          ? rec.present
                            ? "Present"
                            : "Absent"
                          : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {title}
      </div>

      <div className="mt-1 text-xl font-semibold">
        {value}
      </div>
    </div>
  );
}