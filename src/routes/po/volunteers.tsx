import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, QrCode, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { Badge } from "@/components/ui/badge";
import { academicYear, formatLongDate, parseDob } from "@/lib/nss/format";
import { openIdCard } from "@/lib/nss/id-card";
import { blobToDataUrl, compressPassport } from "@/lib/nss/media";
import { downloadVolunteerExcel } from "@/lib/nss/reports";
import { qrSvg } from "@/lib/nss/qr";
import { htmlForCertificate, openPreparedCertificate, preparedCertificate } from "@/lib/nss/certificates";
import {
  activeVolunteers,
  attendanceOf,
  bestVolunteer,
  useNssStore,
  volunteerHours,
  volunteerRecord,
} from "@/lib/nss/store";
import type { NssRole, Volunteer } from "@/lib/nss/types";

export const Route = createFileRoute("/po/volunteers")({ component: VolunteersPage });

function VolunteersPage() {
  const state = useNssStore();
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Volunteer | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const best = bestVolunteer(state);
  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return activeVolunteers(state).filter((v) => {
      const hit =
        !needle ||
        v.fullName.toLowerCase().includes(needle) ||
        v.volunteerId.toLowerCase().includes(needle) ||
        v.enrollment.toLowerCase().includes(needle) ||
        v.mobile.includes(needle);
      const c = !course || v.course === course;
      const s = !semester || v.semester === semester;
      return hit && c && s;
    });
  }, [state, q, course, semester]);

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function promote() {
    if (!selected.length) {
      toast.error("Select at least one volunteer.");
      return;
    }
    const n = state.promoteVolunteers(selected);
    toast.success(`Promoted ${n} volunteer(s) to the next semester.`);
    setSelected([]);
  }

  function removeSelected() {
    if (!selected.length) {
      toast.error("Select at least one volunteer.");
      return;
    }
    if (!confirm(`Delete ${selected.length} volunteer(s) permanently?`)) return;
    state.deleteVolunteers(selected);
    toast.success("Removed from the roll.");
    setSelected([]);
  }

  return (
    <div className="space-y-4">
      <OfficialLetterhead title="Volunteer roll" compact />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Volunteers</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} on the roll · A–Z · first name in CAPITAL · tick to promote or delete
          </p>
        </div>
        <Button onClick={() => downloadVolunteerExcel(state)}>Download Excel</Button>
      </div>
      {best ? (
        <Card className="border-saffron/40 bg-saffron/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <p className="text-sm">
              <Star className="mr-2 inline size-4 text-saffron" />
              Best volunteer: <strong>{best.fullName}</strong> · {best.volunteerId} ·{" "}
              {volunteerHours(state, best.id)} hrs
            </p>
            <Button size="sm" variant="outline" onClick={() => setRecordId(best.id)}>
              Smart record
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <Button size="sm" onClick={promote} disabled={!selected.length}>
          Promote selected (Sem++)
        </Button>
        <Button size="sm" variant="danger" onClick={removeSelected} disabled={!selected.length}>
          Delete selected
        </Button>
        <span className="self-center text-xs text-muted-foreground">{selected.length} selected</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="Search name, ID, mobile" value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        >
          <option value="">All courses</option>
          <option>B.A.</option>
          <option>B.Com.</option>
          <option>B.Sc.</option>
        </select>
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">All semesters</option>
          {["1", "2", "3", "4", "5", "6"].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>
      {editing ? <EditVolunteer volunteer={editing} onClose={() => setEditing(null)} /> : null}
      {recordId ? <SmartRecord volunteerId={recordId} onClose={() => setRecordId(null)} /> : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["", "#", "ID", "Name", "DOB", "Mobile", "Course", "Role", "Hours", "Actions"].map((h) => (
                  <th key={h || "sel"} className="px-3 py-2 font-medium">
                    {h === "" ? (
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && rows.every((v) => selected.includes(v.id))}
                        onChange={(e) => setSelected(e.target.checked ? rows.map((v) => v.id) : [])}
                      />
                    ) : (
                      h
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((v, i) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{v.volunteerId}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {v.photoUrl ? (
                        <img src={v.photoUrl} alt="" className="size-8 rounded object-cover" />
                      ) : null}
                      {v.fullName}
                      {best?.id === v.id ? <Star className="size-3.5 text-saffron" /> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">{v.dob ? formatLongDate(parseDob(v.dob)) : "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{v.mobile}</td>
                  <td className="px-3 py-2">
                    {v.course} {v.semester}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded-md border border-border bg-card px-2 py-1 text-xs"
                      value={v.nssRole}
                      onChange={(e) => state.updateVolunteer(v.id, { nssRole: e.target.value as NssRole })}
                    >
                      <option>Volunteer</option>
                      <option>Leader</option>
                      <option>Group Leader</option>
                      <option>Discipline Head</option>
                      <option>Camp Coordinator</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{volunteerHours(state, v.id)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setRecordId(v.id)}>
                        Record
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void openIdCard(v, state.settings)}>
                        <CreditCard />
                        ID
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          state.moveToAlumni(v.id, `Moved ${academicYear()}`);
                          toast.success(`${v.fullName} sent to Alumni file`);
                        }}
                      >
                        Alumni
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete ${v.fullName}?`)) {
                            state.deleteVolunteer(v.id);
                            toast.success("Removed");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SmartRecord({ volunteerId, onClose }: { volunteerId: string; onClose: () => void }) {
  const state = useNssStore();
  const [qrMarkup, setQrMarkup] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const rec = volunteerRecord(state, volunteerId);
  const v = rec.volunteer;
  const events = [...state.events].sort((a, b) => b.date.localeCompare(a.date));
  if (!v) return null;

  async function showVolunteerQr() {
    const store = useNssStore.getState();
    const current = store.volunteers.find((row) => row.id === volunteerId);
    if (!current) return;

    const token =
      current.qrToken ||
      `nss-vol-${current.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (!current.qrToken) {
      store.updateVolunteer(current.id, {
        qrToken: token,
        qrGeneratedAt: new Date().toISOString(),
      });
    }

    try {
      const svg = await qrSvg(
        JSON.stringify({
          type: "NSS_VOLUNTEER_ID",
          volunteerId: current.id,
          token,
        }),
        260,
      );
      setQrMarkup(svg);
      setQrOpen(true);
    } catch {
      toast.error("Unable to generate volunteer QR.");
    }
  }

  function printVolunteerQr() {
    if (!qrMarkup) return;

    const printVolunteer = useNssStore
      .getState()
      .volunteers.find((row) => row.id === volunteerId);

    if (!printVolunteer) {
      toast.error("Volunteer record not found.");
      return;
    }

    const popup = window.open("", "_blank", "width=600,height=720");
    if (!popup) {
      toast.error("Please allow pop-ups to print the QR.");
      return;
    }
    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>NSS Volunteer QR</title>
          <style>
            body{font-family:Arial,sans-serif;text-align:center;padding:30px}
            svg{max-width:300px;margin:20px auto}
            @media print{button{display:none}}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(printVolunteer.fullName)}</h2>
          <p>${escapeHtml(printVolunteer.volunteerId)} · ${escapeHtml(printVolunteer.unit)}</p>
          ${qrMarkup}
          <button onclick="window.print()">Print QR</button>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
  }
  return (
    <Card className="border-navy/30">
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {v.photoUrl ? (
              <img src={v.photoUrl} alt="" className="h-24 w-20 rounded-md object-cover" />
            ) : (
              <div className="flex h-24 w-20 items-center justify-center rounded-md bg-navy text-paper">
                {v.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs tracking-[0.16em] text-muted-foreground">SMART RECORD</p>
              <h3 className="font-display text-xl font-semibold">{v.fullName}</h3>
              <p className="text-sm text-muted-foreground">
                {v.volunteerId} · {v.enrollment} · {v.unit} · {v.nssRole}
              </p>
              {rec.isBest ? (
                <Badge tone="saffron" className="mt-1">
                  Best volunteer
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void openIdCard(v, state.settings)}>
              ID card
            </Button>
            <Button size="sm" variant="outline" onClick={() => void showVolunteerQr()}>
              <QrCode />
              QR
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        {qrOpen && qrMarkup ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Volunteer Identity QR</p>
                <p className="text-xs text-muted-foreground">
                  Scan this QR after the Event QR to identify this volunteer.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={printVolunteerQr}>
                  Print QR
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setQrOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div
              className="mx-auto mt-3 w-fit rounded-xl border border-border bg-white p-3"
              dangerouslySetInnerHTML={{ __html: qrMarkup }}
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-muted/30 p-3"><p className="text-sm font-medium">Achievement badges</p><div className="mt-2 flex flex-wrap gap-2">{(v.badges ?? []).map((badge) => <button key={badge} type="button" className="rounded-full bg-saffron/15 px-3 py-1 text-xs" onClick={() => state.removeBadge(v.id, badge)}>{badge} ×</button>)}{["Eco Warrior","Blood Donation Champion","Best Volunteer","Event Leader","Community Service","Attendance Champion","Special Camp Participant"].filter((b)=>!(v.badges??[]).includes(b)).map((badge)=><Button key={badge} size="sm" variant="outline" onClick={()=>state.awardBadge(v.id,badge)}>+ {badge}</Button>)}</div></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label="Attendance" value={`${rec.pct}%`} />
          <Mini label="Present" value={`${rec.present}/${rec.marked}`} />
          <Mini label="Hours" value={String(rec.hours)} />
          <Mini label="Certificates" value={String(rec.certs.length)} />
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Row k="Mobile" val={v.mobile} />
          <Row k="Email" val={v.email || "—"} />
          <Row k="Course" val={`${v.course} · Sem ${v.semester}`} />
          <Row k="Gender / Blood" val={`${v.gender || "—"} · ${v.bloodGroup || "—"}`} />
          <Row k="Emergency" val={v.emergencyContact || v.parentMobile || "—"} />
          <Row k="Address" val={v.address || "—"} />
        </dl>
        <div>
          <p className="mb-2 text-sm font-medium">Activity history</p>
          <div className="max-h-56 overflow-auto rounded-md border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-1.5">Event</th>
                  <th className="px-2 py-1.5">Date</th>
                  <th className="px-2 py-1.5">Status</th>
                  <th className="px-2 py-1.5">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const att = attendanceOf(state, v.id, e.id);
                  const cert = rec.certs.find((c: { eventId: string }) => c.eventId === e.id);
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-2 py-1.5">{e.name}</td>
                      <td className="px-2 py-1.5">{formatLongDate(e.date)}</td>
                      <td className="px-2 py-1.5">
                        {att ? (att.present ? "Present" : "Absent") : e.status === "upcoming" ? "Upcoming" : "—"}
                      </td>
                      <td className="px-2 py-1.5">
                        {att?.present ? (
                          <button
                            type="button"
                            className="text-forest underline"
                            onClick={() =>
                              void openPreparedCertificate(() =>
                                htmlForCertificate(
                                  preparedCertificate(v, e, cert),
                                  v,
                                  e,
                                  state.settings,
                                ),
                              )
                            }
                          >
                            View
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{val}</dd>
    </div>
  );
}

function EditVolunteer({ volunteer, onClose }: { volunteer: Volunteer; onClose: () => void }) {
  const update = useNssStore((s) => s.updateVolunteer);
  const addLog = useNssStore((s) => s.addLog);
  const [form, setForm] = useState({
    fullName: volunteer.fullName,
    enrollment: volunteer.enrollment,
    mobile: volunteer.mobile,
    course: volunteer.course,
    semester: volunteer.semester,
    nssRole: volunteer.nssRole,
    photoUrl: volunteer.photoUrl ?? "",
    emergencyContact: volunteer.emergencyContact ?? "",
  });

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    const { blob } = await compressPassport(file);
    const url = await blobToDataUrl(blob);
    setForm((f) => ({ ...f, photoUrl: url }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    update(volunteer.id, form);
    addLog("Updated Student", `Updated details for ${form.fullName}`);
    toast.success("Student details saved");
    onClose();
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <p className="font-medium">Edit {volunteer.fullName}</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <div className="sm:col-span-2 flex items-center gap-3">
            {form.photoUrl ? <img src={form.photoUrl} alt="" className="h-20 w-16 rounded object-cover" /> : null}
            <input type="file" accept="image/*" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </div>
          <Field label="Full name">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Enrollment">
            <Input value={form.enrollment} onChange={(e) => setForm({ ...form, enrollment: e.target.value })} />
          </Field>
          <Field label="Mobile">
            <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </Field>
          <Field label="Course">
            <select
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
            >
              <option>B.A.</option>
              <option>B.Com.</option>
              <option>B.Sc.</option>
            </select>
          </Field>
          <Field label="Semester">
            <select
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              {["1", "2", "3", "4", "5", "6"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Role">
            <select
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={form.nssRole}
              onChange={(e) => setForm({ ...form, nssRole: e.target.value as NssRole })}
            >
              <option>Volunteer</option>
              <option>Leader</option>
            </select>
          </Field>
          <Field label="Emergency contact">
            <Input
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit">Save changes</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
