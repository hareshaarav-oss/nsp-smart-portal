import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Award, Cake, CreditCard, Fingerprint, KeyRound, Lock, LogOut, Pencil, Star } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { htmlForCertificate, openCertificateDocument } from "@/lib/nss/certificates";
import { daysUntilBirthday, formatLongDate, idCardName, isBirthdayOn, parseDob, todayIso } from "@/lib/nss/format";
import { openIdCard } from "@/lib/nss/id-card";
import { blobToDataUrl, compressPassport } from "@/lib/nss/media";
import { findSessionVolunteer, isOfficer, registerFingerprint, useSessionStore } from "@/lib/nss/session";
import { attendanceOf, bestVolunteer, rsvpOf, useNssStore, volunteerHours } from "@/lib/nss/store";

export const Route = createFileRoute("/volunteer")({ component: VolunteerDash });

function VolunteerDash() {
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const volunteers = useNssStore((s) => s.volunteers) ?? [];
  const events = useNssStore((s) => s.events) ?? [];
  const notices = useNssStore((s) => s.notices) ?? [];
  const attendance = useNssStore((s) => s.attendance) ?? [];
  const certificates = useNssStore((s) => s.certificates) ?? [];
  const settings = useNssStore((s) => s.settings);
  const updateVolunteer = useNssStore((s) => s.updateVolunteer);
  const setEventRSVP = useNssStore((s) => s.setEventRSVP);
  const bestId = useNssStore((s) => bestVolunteer(s)?.id ?? "");
  const portalState = useNssStore();

  const [panel, setPanel] = useState<"none" | "edit" | "password">("none");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [wait, setWait] = useState(true);
  const meRef = useRef<typeof volunteers[number] | undefined>(undefined);

  useEffect(() => {
    const t = window.setTimeout(() => setWait(false), 1600);
    return () => window.clearTimeout(t);
  }, []);

  if (!session) return <Navigate to="/login" search={{ role: "volunteer" }} />;
  if (isOfficer(session)) return <Navigate to="/po" />;

  const meFound = findSessionVolunteer(volunteers, session);
  if (meFound) meRef.current = meFound;
  const me = meFound ?? meRef.current;
  if (!me) {
    if (wait) {
      return (
        <AppShell eyebrow="NSS STUDENT DASHBOARD" current="dashboard">
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading your profile…</p>
        </AppShell>
      );
    }
    return <Navigate to="/login" search={{ role: "volunteer" }} />;
  }

  const hours = volunteerHours(portalState, me.id);
  const myAtt = attendance.filter((a) => a.volunteerId === me.id);
  const present = myAtt.filter((a) => a.present).length;
  const attPct = myAtt.length ? Math.round((present / myAtt.length) * 100) : 0;
  const myNotices = notices.filter((n) => {
    if (n.audience === "leaders") return me.nssRole === "Leader";
    if (n.audience === "girls") return me.gender === "Female";
    if (n.audience === "boys") return me.gender === "Male";
    return true;
  });
  const upcoming = [...events]
    .filter((e) => {
      if (e.status === "cancelled") return false;
      if (e.audience === "girls" && me.gender !== "Female") return false;
      if (e.audience === "boys" && me.gender !== "Male") return false;
      if (e.audience === "leaders" && me.nssRole !== "Leader") return false;
      return e.status === "upcoming" || e.date >= todayIso();
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
  const mine = certificates
    .filter((c) => c.volunteerId === me.id && c.sentAt)
    .map((c) => {
      const event = events.find((e) => e.id === c.eventId);
      return event ? { cert: c, event } : null;
    })
    .filter((row): row is { cert: (typeof certificates)[number]; event: (typeof events)[number] } => Boolean(row))
    .sort((a, b) => b.event.date.localeCompare(a.event.date));
  const isBest = bestId === me.id;
  const myBirthday = parseDob(me.dob);
  const birthdayDays = myBirthday ? daysUntilBirthday(myBirthday, todayIso()) : null;

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    const expected = me.loginPassword || me.mobile;
    if (cur.trim() !== expected && cur.trim() !== me.mobile) {
      toast.error("Current password is incorrect.");
      return;
    }
    if (next.trim().length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    updateVolunteer(me.id, { loginPassword: next.trim() });
    toast.success("Password updated. Use it the next time you sign in.");
    setCur("");
    setNext("");
    setConfirm("");
    setPanel("none");
  }

  return (
    <AppShell eyebrow="NSS STUDENT DASHBOARD" current="dashboard">
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16">
        <div className="overflow-hidden rounded-2xl bg-navy p-5 text-paper shadow-md md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="saffron" onClick={() => void openIdCard(me, settings)}>
                <CreditCard />
                Digital ID Card
              </Button>
              <Button
                className="bg-sky-600 text-white hover:bg-sky-700"
                onClick={() => setPanel(panel === "edit" ? "none" : "edit")}
              >
                <Pencil />
                Edit Profile
              </Button>
              <Button
                className="bg-forest text-primary-foreground hover:bg-forest/90"
                onClick={() => setPanel(panel === "password" ? "none" : "password")}
              >
                <Lock />
                Change Password
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setSession(null);
                }}
              >
                <LogOut />
                Logout
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {me.photoUrl ? (
              <img src={me.photoUrl} alt="" className="h-28 w-24 rounded-xl object-cover ring-4 ring-white/20" />
            ) : (
              <div className="flex h-28 w-24 items-center justify-center rounded-xl bg-white/15 font-display text-2xl">
                {me.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
            )}
            <div className="text-center sm:text-left">
              <div className="mb-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
                  {me.course} · Sem {me.semester}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Role: {me.nssRole}</span>
                {isBest ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-saffron px-3 py-1 text-xs font-semibold text-saffron-foreground">
                    <Star className="size-3" /> Best volunteer
                  </span>
                ) : null}
              </div>
              <h1 className="font-display text-3xl font-semibold">{idCardName(me.fullName)}</h1>
              <p className="text-sm text-paper/70">
                {me.volunteerId} · {me.enrollment} · {me.unit}
              </p>
              <p className="mt-1 text-xs text-paper/60">{settings.collegeName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Attendance" value={`${attPct}%`} />
          <Stat label="NSS hours" value={String(hours)} />
          <Stat label="Certificates" value={String(mine.length)} />
          <Stat label="Activities present" value={String(present)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card className="shadow-md"><CardHeader><CardTitle>My Attendance & Service Progress</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={events.filter((e)=>myAtt.some((a)=>a.eventId===e.id)).map((e)=>({name:e.name.length>12?e.name.slice(0,12)+"…":e.name, attendance: attendanceOf(portalState, me.id, e.id)?.present?100:0, hours: attendanceOf(portalState, me.id, e.id)?.present?e.hours:0}))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" hide/><YAxis/><Tooltip/><Bar dataKey="attendance" name="Attendance %"/><Bar dataKey="hours" name="Hours"/></BarChart></ResponsiveContainer></div></CardContent></Card>
          <Card className="shadow-md"><CardHeader><CardTitle>My Progress</CardTitle></CardHeader><CardContent className="space-y-4"><ProgressRow label="Attendance" value={attPct} suffix="%"/><ProgressRow label="Regular service hours" value={Math.min(100, Math.round(hours / Math.max(1, settings.serviceHourTarget) * 100))} suffix={`% of ${settings.serviceHourTarget} hrs target`}/><ProgressRow label="240-hour NSS progress" value={Math.min(100, Math.round(hours / 240 * 100))} suffix={`${hours} / 240 hours completed`}/><ProgressRow label="Certificates" value={Math.min(100, mine.length * 20)} suffix={`${mine.length} earned`}/><div className="rounded-xl border border-saffron/30 bg-saffron/5 p-3 text-sm"><strong>Achievement badges</strong><div className="mt-2 flex flex-wrap gap-2">{present >= 5 ? <Badge tone="forest">Attendance Champion</Badge> : null}{hours >= 40 ? <Badge tone="saffron">Community Service</Badge> : null}{hours >= 120 ? <Badge tone="navy">Service Milestone</Badge> : null}{isBest ? <Badge tone="saffron">Best Volunteer</Badge> : null}{present === 0 && hours === 0 ? <span className="text-muted-foreground">Participate in activities to earn badges.</span> : null}</div></div><div className="rounded-xl bg-muted p-3 text-sm"><strong>NSS Impact</strong><p className="mt-1 text-muted-foreground">Keep participating in activities to improve your attendance, service hours and achievements.</p></div></CardContent></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Recent Activity Table</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="border-b border-border text-left text-muted-foreground"><tr><th className="py-2">Activity</th><th>Date</th><th>Attendance</th><th>Hours</th></tr></thead><tbody>{events.filter((e)=>myAtt.some((a)=>a.eventId===e.id)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map((e)=>{const r=attendanceOf(portalState,me.id,e.id);return <tr key={e.id} className="border-b border-border"><td className="py-2 font-medium">{e.name}</td><td>{formatLongDate(e.date)}</td><td><Badge tone={r?.present?"forest":"danger"}>{r?.present?"Present":"Absent"}</Badge></td><td>{r?.present?e.hours:0}</td></tr>})}</tbody></table></CardContent></Card>
          <Card><CardHeader><CardTitle>Upcoming Events & RSVP</CardTitle></CardHeader><CardContent className="space-y-3">{upcoming.length?upcoming.slice(0,5).map((e)=>{const rsvp=rsvpOf(portalState,me.id,e.id);return <div key={e.id} className="rounded-xl border border-border p-3"><div className="flex flex-wrap justify-between gap-2"><strong>{e.name}</strong><Badge tone="saffron">Upcoming</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatLongDate(e.date)}{e.endDate&&e.endDate!==e.date?` – ${formatLongDate(e.endDate)}`:""} · {e.location}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={rsvp?.status === "will_attend" ? "forest" : "outline"} onClick={()=>setEventRSVP(me.id,e.id,"will_attend")}>🟢 હા, હું હાજર રહીશ</Button><Button size="sm" variant={rsvp?.status === "will_not_attend" ? "danger" : "outline"} onClick={()=>setEventRSVP(me.id,e.id,"will_not_attend")}>🔴 ના, હું હાજર રહીશ નહીં</Button></div>{rsvp?<p className="mt-2 text-xs text-muted-foreground">Your response: {rsvp.status === "will_attend" ? "Will Attend" : "Will Not Attend"}</p>:<p className="mt-2 text-xs text-muted-foreground">Please respond before the event.</p>}</div>}):<p className="text-sm text-muted-foreground">No upcoming events.</p>}</CardContent></Card>
        </div>

        {panel === "edit" ? <EditProfile volunteerId={me.id} /> : null}

        {panel === "password" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-4" />
                Change password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:max-w-md" onSubmit={changePassword}>
                <div className="space-y-1.5">
                  <Label>Current password (registered mobile)</Label>
                  <Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <Button type="submit">Update password</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">MPIN and fingerprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Username is your first name in CAPITAL letters. Password is your registered mobile until you change
              it here — the new password is saved at once. You can also set a 4-digit MPIN or enable this phone’s
              fingerprint.
            </p>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const pin = (document.getElementById("mpin-set") as HTMLInputElement | null)?.value ?? "";
                if (!/^\d{4}$/.test(pin)) {
                  toast.error("MPIN must be 4 digits.");
                  return;
                }
                updateVolunteer(me.id, { mpin: pin });
                toast.success("MPIN saved. Use Login with MPIN next time.");
                const el = document.getElementById("mpin-set") as HTMLInputElement | null;
                if (el) el.value = "";
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="mpin-set">Set 4-digit MPIN</Label>
                <Input id="mpin-set" inputMode="numeric" placeholder={me.mpin ? "MPIN is set" : "1234"} />
              </div>
              <Button type="submit">
                <KeyRound />
                Save MPIN
              </Button>
            </form>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void registerFingerprint(me)
                  .then((id) => {
                    updateVolunteer(me.id, { webauthnId: id });
                    toast.success("Fingerprint enabled on this device.");
                  })
                  .catch((error: unknown) => {
                    toast.error(error instanceof Error ? error.message : "Fingerprint not available.");
                  });
              }}
            >
              <Fingerprint />
              {me.webauthnId ? "Fingerprint enabled — tap to re-link" : "Enable fingerprint login"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest notices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myNotices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notices yet.</p>
              ) : (
                myNotices.map((n) => (
                  <div key={n.id}>
                    <p className="font-medium">{n.title}</p>
                    <p className="gu text-sm text-muted-foreground">{n.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming event.</p>
              ) : (
                upcoming.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatLongDate(e.date)} · {e.location}
                      </p>
                    </div>
                    <Badge tone="saffron">Upcoming</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {settings.birthdayShowOnDashboard !== false && myBirthday ? (
          <Card className="border-saffron/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><Cake className="size-5 text-saffron" /> My Birthday</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{formatLongDate(myBirthday)}</p><p className="mt-1 text-sm font-medium">{birthdayDays === 0 ? "🎉 Today is your birthday!" : `🎂 ${birthdayDays} day${birthdayDays === 1 ? "" : "s"} to go`}</p></CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-4 text-saffron" />
              My earned certificates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Certificates issued by the Programme Officer will appear here.
              </p>
            ) : (
              mine.map(({ cert, event }) => (
                <div
                  key={cert.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatLongDate(event.date)} · {event.hours} hrs · {event.location}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void htmlForCertificate(cert, me, event, settings).then(openCertificateDocument)
                    }
                  >
                    View / Print
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((e) => {
                const rec = attendanceOf(portalState, me.id, e.id);
                return (
                  <div key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatLongDate(e.date)} · {e.hours} hrs
                      </p>
                    </div>
                    {rec ? (
                      <Badge tone={rec.present ? "forest" : "danger"}>{rec.present ? "Present" : "Absent"}</Badge>
                    ) : (
                      <Badge tone="muted">{e.status === "upcoming" ? "Upcoming" : "Not marked"}</Badge>
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function EditProfile({ volunteerId }: { volunteerId: string }) {
  const volunteer = useNssStore.getState().volunteers.find((v) => v.id === volunteerId);
  const update = useNssStore.getState().updateVolunteer;
  const [form, setForm] = useState({
    mobile: volunteer?.mobile ?? "",
    email: volunteer?.email ?? "",
    address: volunteer?.address ?? "",
    bloodGroup: volunteer?.bloodGroup ?? "",
    abcId: volunteer?.abcId ?? "",
    myBharatId: volunteer?.myBharatId ?? "",
    emergencyContact: volunteer?.emergencyContact ?? "",
    photoUrl: volunteer?.photoUrl ?? "",
  });
  if (!volunteer) return null;

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    const { blob } = await compressPassport(file);
    const url = await blobToDataUrl(blob);
    setForm((f) => ({ ...f, photoUrl: url }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    update(volunteerId, form);
    toast.success("Profile saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <div className="sm:col-span-2 flex items-center gap-3">
            {form.photoUrl ? <img src={form.photoUrl} alt="" className="h-20 w-16 rounded object-cover" /> : null}
            <input type="file" accept="image/*" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </div>
          <Field label="Mobile">
            <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Address" wide>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Blood group">
            <Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
          </Field>
          <Field label="ABC ID">
            <Input value={form.abcId} onChange={(e) => setForm({ ...form, abcId: e.target.value })} />
          </Field>
          <Field label="MY Bharat ID">
            <Input value={form.myBharatId} onChange={(e) => setForm({ ...form, myBharatId: e.target.value })} />
          </Field>
          <Field label="Emergency contact">
            <Input
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ProgressRow({ label, value, suffix }: { label: string; value: number; suffix: string }) { return <div><div className="flex justify-between text-sm"><span>{label}</span><strong>{value}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><p className="mt-1 text-[11px] text-muted-foreground">{suffix}</p></div>; }

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
