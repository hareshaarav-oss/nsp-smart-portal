import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Award, Cake, Fingerprint, KeyRound, Lock } from "lucide-react";
import { TomorrowBanner } from "@/components/nss/tomorrow";
import { AppShell } from "@/components/nss/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { htmlForCertificate, openPreparedCertificate, preparedCertificate } from "@/lib/nss/certificates";
import { daysUntilBirthday, formatLongDate, idCardName, parseDob, todayIso } from "@/lib/nss/format";
import { openIdCard } from "@/lib/nss/id-card";
import { blobToDataUrl, compressCardPhoto, compressPassport, rememberPhoto } from "@/lib/nss/media";
import { findSessionVolunteer, isOfficer, registerFingerprint, useSessionStore } from "@/lib/nss/session";
import { attendanceOf, bestVolunteer, rsvpOf, useNssStore, volunteerHours } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";
import type { IssuedCertificate, Volunteer } from "@/lib/nss/types";

type OwnProfile = Pick<
  Volunteer,
  "mobile" | "email" | "address" | "bloodGroup" | "fatherName" | "abcId" | "myBharatId" | "emergencyContact" | "photoUrl"
> & { id?: string; volunteerId?: string };

function writeOwnProfile(profile: OwnProfile) {
  const state = useNssStore.getState();
  const target = (state.volunteers ?? []).find(
    (row) =>
      (profile.id && (row.id === profile.id || row.volunteerId === profile.id)) ||
      (profile.volunteerId && (row.id === profile.volunteerId || row.volunteerId === profile.volunteerId)),
  );
  if (!target) return;
  state.updateVolunteer(target.id, {
    mobile: profile.mobile ?? target.mobile,
    email: profile.email ?? target.email ?? "",
    address: profile.address ?? target.address ?? "",
    bloodGroup: profile.bloodGroup ?? target.bloodGroup ?? "",
    fatherName: profile.fatherName ?? target.fatherName ?? "",
    abcId: profile.abcId ?? target.abcId ?? "",
    myBharatId: profile.myBharatId ?? target.myBharatId ?? "",
    emergencyContact: profile.emergencyContact ?? target.emergencyContact ?? "",
    ...(profile.photoUrl ? { photoUrl: profile.photoUrl } : {}),
  });
}

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
  const { t } = useUi();
  const [readNotes, setReadNotes] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(localStorage.getItem("nsp-read-notices") || "[]") as unknown;
      return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  });
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [cloudCerts, setCloudCerts] = useState<IssuedCertificate[]>([]);
  const meRef = useRef<typeof volunteers[number] | undefined>(undefined);

  useEffect(() => {
    if (!session || isOfficer(session) || !session.mobile) return;
    let stop = false;
    void fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "my-certificates",
        username: session.volunteerId || session.name,
        password: session.mobile,
      }),
    })
      .then((res) => res.json())
      .then((data: { certificates?: IssuedCertificate[] }) => {
        if (!stop && Array.isArray(data.certificates)) setCloudCerts(data.certificates);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || isOfficer(session) || !session.mobile) return;
    let stop = false;
    void fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "my-profile",
        username: session.volunteerId || session.name,
        password: session.mobile,
        docId: session.docId || "",
        volunteerId: session.volunteerId || "",
      }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; docId?: string; volunteer?: OwnProfile }) => {
        if (stop || !data.ok || !data.volunteer) return;
        writeOwnProfile(data.volunteer);
        if (data.docId) useSessionStore.getState().setSession({ ...session, docId: data.docId });
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [session]);

  if (!session) return <Navigate to="/login" search={{ role: "volunteer" }} />;
  if (isOfficer(session)) return <Navigate to="/po" />;

  const meFound = findSessionVolunteer(volunteers, session);
  if (meFound) meRef.current = meFound;
  const me = meFound ?? meRef.current;
  if (!me) {
    return (
      <AppShell eyebrow="NSS APP" current="dashboard">
        <div className="mx-auto max-w-lg px-4 py-10">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">App</p>
              <h1 className="mt-1 font-display text-2xl text-navy">{session.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {volunteers.length === 0 ? "Opening your roll record…" : "Your sign-in is saved on this phone."}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
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
      return e.date >= todayIso();
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
  const official = new Map<string, IssuedCertificate>();
  for (const cert of [...certificates, ...cloudCerts]) {
    const mineId = cert.volunteerId === me.id || cert.volunteerId === me.volunteerId;
    if (!mineId) continue;
    official.set(cert.eventId, cert.sentAt ? cert : official.get(cert.eventId) ?? cert);
  }
  const earnedEvents = events
    .filter((event) => official.has(event.id) || Boolean(attendanceOf(portalState, me.id, event.id)?.present))
    .sort((a, b) => b.date.localeCompare(a.date));
  const mine = earnedEvents.map((event) => ({
    event,
    cert: official.get(event.id) ?? preparedCertificate(me, event),
  }));
  const isBest = bestId === me.id;
  const myBirthday = parseDob(me.dob);
  const birthdayDays = myBirthday ? daysUntilBirthday(myBirthday, todayIso()) : null;

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (next.trim().length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "set-password",
          username: me.volunteerId || me.fullName,
          password: cur,
          next: next.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Could not update the password.");
        return;
      }
      toast.success("Password updated. Sign in again.");
      useNssStore.getState().addLog("Password", `${me.fullName} changed the password.`);
      setSession(null);
      window.location.href = "/login";
    } catch {
      toast.error("Could not reach the college server.");
    }
  }

  return (
    <AppShell eyebrow="NSS STUDENT DASHBOARD" current="dashboard">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-3 pb-4 sm:space-y-6 sm:px-4 md:px-6">
        <TomorrowBanner />
        <div className="overflow-hidden border border-saffron/40 bg-navy p-5 text-paper">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {me.photoUrl ? (
              <img src={me.photoUrl} alt="" className="h-28 w-24 rounded-2xl object-cover ring-4 ring-white/20" />
            ) : (
              <div className="flex h-28 w-24 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl">
                {me.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-semibold">{idCardName(me.fullName)}</h1>
              <p className="text-sm text-paper/70">{me.volunteerId} · {me.unit}</p>
              <p className="mt-2 text-sm text-paper/90">
                {[me.course, me.semester ? `Sem ${me.semester}` : "", me.mobile, me.email].filter(Boolean).join(" · ") || "Add mobile and email from Edit profile"}
              </p>
              {[me.fatherName, me.bloodGroup, me.address, me.abcId, me.myBharatId, me.emergencyContact].some(Boolean) ? (
                <p className="mt-1 text-xs text-paper/70">
                  {[
                    me.fatherName ? `Father ${me.fatherName}` : "",
                    me.bloodGroup ? `Blood ${me.bloodGroup}` : "",
                    me.address,
                    me.abcId ? `ABC ${me.abcId}` : "",
                    me.myBharatId ? `MY Bharat ${me.myBharatId}` : "",
                    me.emergencyContact ? `Emergency ${me.emergencyContact}` : "",
                  ].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <p className="text-xs text-paper/60">{settings.collegeName}</p>
              <p className="mt-2 text-sm">{t("next")}: {upcoming[0] ? `${upcoming[0].name} · ${formatLongDate(upcoming[0].date)}` : "—"}</p>
            </div>
            <div className="relative size-24 shrink-0">
              <svg viewBox="0 0 36 36" className="size-24 -rotate-90">
                <path d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8 a 15.9 15.9 0 0 1 0 -31.8" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
                <path d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8 a 15.9 15.9 0 0 1 0 -31.8" fill="none" stroke="#ff9933" strokeWidth="3" strokeDasharray={`${Math.min(100, Math.round((hours / 240) * 100))} 100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg leading-none">{hours}</span>
                <span className="text-[10px] text-paper/70">/ 240</span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-paper sm:justify-start">
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => void openIdCard(me, settings)}>{t("id")}</button>
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => setPanel(panel === "edit" ? "none" : "edit")}>Edit profile</button>
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => setPanel(panel === "password" ? "none" : "password")}>Change password</button>
          </div>
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
                  <Label>Current password</Label>
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
            <CardTitle className="text-base">MPIN, fingerprint and certificates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                const live = useSessionStore.getState().session;
                void fetch("/api/nss-cloud", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    action: "update-profile",
                    username: live?.volunteerId || me.volunteerId || me.id,
                    password: live?.mobile || me.mobile,
                    volunteerId: me.id,
                    mpin: pin,
                  }),
                })
                  .then(async (res) => {
                    const data = (await res.json()) as { ok?: boolean; error?: string };
                    if (!res.ok || !data.ok) {
                      toast.error(data.error || "MPIN stayed on this phone only.");
                      return;
                    }
                    toast.success("MPIN saved. Use it on the student login.");
                  })
                  .catch(() => toast.error("Could not reach the college server."));
                const el = document.getElementById("mpin-set") as HTMLInputElement | null;
                if (el) el.value = "";
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="mpin-set">4-digit MPIN {me.mpin ? "· saved" : ""}</Label>
                <Input id="mpin-set" inputMode="numeric" maxLength={4} placeholder={me.mpin ? "••••" : "4 digits"} />
              </div>
              <Button type="submit">
                <KeyRound />
                Save MPIN
              </Button>
            </form>
            <Button
              type="button"
              onClick={() => {
                void registerFingerprint(me)
                  .then(async (id) => {
                    updateVolunteer(me.id, { webauthnId: id });
                    const live = useSessionStore.getState().session;
                    const res = await fetch("/api/nss-cloud", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        action: "update-profile",
                        username: live?.volunteerId || me.volunteerId || me.id,
                        password: live?.mobile || me.mobile,
                        volunteerId: me.id,
                        webauthnId: id,
                      }),
                    });
                    const data = (await res.json()) as { ok?: boolean; error?: string };
                    if (!res.ok || !data.ok) {
                      toast.error(data.error || "Fingerprint stayed on this phone only.");
                      return;
                    }
                    toast.success("Fingerprint saved. Sign in with it on this phone.");
                  })
                  .catch((error: unknown) => {
                    toast.error(error instanceof Error ? error.message : "Fingerprint not available.");
                  });
              }}
            >
              <Fingerprint />
              {me.webauthnId ? "Fingerprint on" : "Enable fingerprint"}
            </Button>
            <div className="space-y-2 border-t border-border pt-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Award className="size-4 text-saffron" />
                Certificates
              </p>
              {mine.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet. A certificate appears when your attendance is marked present.</p>
              ) : (
                mine.map(({ cert, event }) => (
                  <div key={cert.id} className="flex flex-wrap items-center justify-between gap-2 border border-border px-3 py-2">
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatLongDate(event.date)} · {cert.certificateId || "Certificate"} · {event.hours} hrs
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => void openPreparedCertificate(() => htmlForCertificate(cert, me, event, settings))}
                    >
                      View / Print
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("recent")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {events.filter((event) => attendanceOf(portalState, me.id, event.id)?.present).sort((a, b) => b.date.localeCompare(a.date)).map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <span>{event.name}</span>
                <span className="text-muted-foreground">{event.hours} h</span>
              </div>
            ))}
            {events.filter((event) => attendanceOf(portalState, me.id, event.id)?.present).length === 0 ? <p className="text-sm text-muted-foreground">—</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("noticesTitle")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notices.map((notice) => {
              const unread = !readNotes.includes(notice.id);
              return (
                <button key={notice.id} type="button" className="flex w-full items-start gap-2 rounded-xl border border-border px-3 py-3 text-left" onClick={() => {
                  const nextIds = readNotes.includes(notice.id) ? readNotes : [...readNotes, notice.id];
                  setReadNotes(nextIds);
                  localStorage.setItem("nsp-read-notices", JSON.stringify(nextIds));
                }}>
                  {unread ? <span className="mt-1 size-2 shrink-0 rounded-full bg-red-600" /> : <span className="mt-1 size-2 shrink-0" />}
                  <span><span className="block font-medium">{notice.title}</span><span className="text-xs text-muted-foreground">{notice.body}</span></span>
                </button>
              );
            })}
            {notices.length === 0 ? <p className="text-sm text-muted-foreground">{t("emptyNotice")}</p> : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Attendance" value={`${attPct}%`} />
          <Stat label="NSS hours" value={String(hours)} />
          <Stat label="Certificates" value={String(mine.length)} />
          <Stat label="Activities present" value={String(present)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHeader><CardTitle>My Attendance & Service Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={events.filter((e) => myAtt.some((a) => a.eventId === e.id)).map((e) => ({ name: e.name, attendance: attendanceOf(portalState, me.id, e.id)?.present ? 100 : 0, hours: attendanceOf(portalState, me.id, e.id)?.present ? e.hours : 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="attendance" name="Attendance %" />
                    <Bar dataKey="hours" name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-navy px-3 py-3 text-paper">
                  <p className="font-display text-3xl tabular-nums">{hours}</p>
                  <p className="text-xs text-paper/70">Hours done</p>
                </div>
                <div className="rounded-xl bg-forest px-3 py-3 text-paper">
                  <p className="font-display text-3xl tabular-nums">{attPct}%</p>
                  <p className="text-xs text-paper/70">Attendance</p>
                </div>
              </div>
              <ProgressRow label="Attendance" value={attPct} suffix={`${present} activities marked present`} />
              <ProgressRow label="Service hours" value={Math.min(100, Math.round((hours / Math.max(1, settings.serviceHourTarget)) * 100))} suffix={`${hours} of ${settings.serviceHourTarget} hours`} />
              <ProgressRow label="NSS 240 hours" value={Math.min(100, Math.round((hours / 240) * 100))} suffix={`${hours} / 240`} />
              <ProgressRow label="Certificates" value={Math.min(100, mine.length * 20)} suffix={`${mine.length} earned`} />
              <div className="flex flex-wrap gap-2">
                {present >= 5 ? <Badge tone="forest">Attendance</Badge> : null}
                {hours >= 40 ? <Badge tone="saffron">Service</Badge> : null}
                {hours >= 120 ? <Badge tone="navy">Milestone</Badge> : null}
                {isBest ? <Badge tone="saffron">Best volunteer</Badge> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Recent Activity Table</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="border-b border-border text-left text-muted-foreground"><tr><th className="py-2">Activity</th><th>Date</th><th>Attendance</th><th>Hours</th></tr></thead><tbody>{events.filter((e)=>myAtt.some((a)=>a.eventId===e.id)).sort((a,b)=>b.date.localeCompare(a.date)).map((e)=>{const r=attendanceOf(portalState,me.id,e.id);return <tr key={e.id} className="border-b border-border"><td className="py-2 font-medium">{e.name}</td><td>{formatLongDate(e.date)}</td><td><Badge tone={r?.present?"forest":"danger"}>{r?.present?"Present":"Absent"}</Badge></td><td>{r?.present?e.hours:0}</td></tr>})}</tbody></table></CardContent></Card>
          <Card><CardHeader><CardTitle>Upcoming Events & RSVP</CardTitle></CardHeader><CardContent className="space-y-3">{upcoming.length?upcoming.map((e)=>{const rsvp=rsvpOf(portalState,me.id,e.id);return <div key={e.id} className="rounded-xl border border-border p-3"><div className="flex flex-wrap justify-between gap-2"><strong>{e.name}</strong><Badge tone="saffron">Upcoming</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatLongDate(e.date)}{e.endDate&&e.endDate!==e.date?` – ${formatLongDate(e.endDate)}`:""} · {e.location}</p>{e.description ? <p className="mt-1 text-sm text-muted-foreground">{e.description}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={rsvp?.status === "will_attend" ? "forest" : "outline"} onClick={()=>setEventRSVP(me.id,e.id,"will_attend")}>હા, હું હાજર રહીશ</Button><Button size="sm" variant={rsvp?.status === "will_not_attend" ? "danger" : "outline"} onClick={()=>setEventRSVP(me.id,e.id,"will_not_attend")}>ના, હું હાજર રહીશ નહીં</Button></div></div>}):<p className="text-sm text-muted-foreground">No upcoming events.</p>}</CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photo, mobile and MPIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const pin = (document.getElementById("quick-mpin") as HTMLInputElement | null)?.value ?? "";
                const mobile = (document.getElementById("quick-mobile") as HTMLInputElement | null)?.value ?? me.mobile;
                if (pin && !/^\d{4}$/.test(pin)) {
                  toast.error("MPIN must be 4 digits.");
                  return;
                }
                const session = useSessionStore.getState().session;
                void fetch("/api/nss-cloud", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    action: "update-profile",
                    username: session?.volunteerId || me.volunteerId || me.id,
                    password: session?.mobile || me.mobile,
                    volunteerId: me.id,
                    mobile,
                    mpin: pin || undefined,
                  }),
                }).then(async (res) => {
                  const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
                  if (!res.ok || data?.ok === false) throw new Error("save");
                  toast.success("Saved.");
                }).catch(() => toast.error("Could not save."));
                updateVolunteer(me.id, { mobile, ...(pin ? { mpin: pin } : {}) });
              }}
            >
              <label className="text-sm">
                Photo
                <input type="file" accept="image/*" className="mt-1 block w-36 text-xs" onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  void (async () => {
                    const [full, card] = await Promise.all([compressPassport(file), compressCardPhoto(file)]);
                    const photoUrl = await blobToDataUrl(full.blob);
                    const thumbUrl = await blobToDataUrl(card.blob);
                    updateVolunteer(me.id, { photoUrl });
                    rememberPhoto([me.volunteerId, me.id, me.fullName.toLowerCase()], photoUrl);
                    const session = useSessionStore.getState().session;
                    const res = await fetch("/api/nss-cloud", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        action: "update-profile",
                        username: session?.volunteerId || me.volunteerId || me.id,
                        password: session?.mobile || me.mobile,
                        volunteerId: me.id,
                        photoUrl,
                        thumbUrl,
                      }),
                    });
                    if (!res.ok) throw new Error("save");
                    toast.success("Photo saved. It will show on the home page.");
                  })().catch(() => toast.error("Could not save the photo."));
                }} />
              </label>
              <label className="text-sm">
                Mobile
                <Input id="quick-mobile" className="mt-1" defaultValue={me.mobile} inputMode="tel" />
              </label>
              <label className="text-sm">
                MPIN
                <Input id="quick-mpin" className="mt-1 w-28" inputMode="numeric" placeholder={me.mpin ? "••••" : "4 digits"} />
              </label>
              <Button type="submit" className="sm:col-span-3 w-fit">Save</Button>
            </form>
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

function profileForm(volunteer?: {
  mobile?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  fatherName?: string;
  abcId?: string;
  myBharatId?: string;
  emergencyContact?: string;
  photoUrl?: string;
}) {
  return {
    mobile: volunteer?.mobile ?? "",
    email: volunteer?.email ?? "",
    address: volunteer?.address ?? "",
    bloodGroup: volunteer?.bloodGroup ?? "",
    fatherName: volunteer?.fatherName ?? "",
    abcId: volunteer?.abcId ?? "",
    myBharatId: volunteer?.myBharatId ?? "",
    emergencyContact: volunteer?.emergencyContact ?? "",
    photoUrl: volunteer?.photoUrl ?? "",
  };
}

function EditProfile({ volunteerId }: { volunteerId: string }) {
  const volunteer = useNssStore((s) =>
    (s.volunteers ?? []).find((v) => v.id === volunteerId || v.volunteerId === volunteerId),
  );
  const [photoDirty, setPhotoDirty] = useState(false);
  const [thumbUrl, setThumbUrl] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => profileForm(volunteer));
  useEffect(() => {
    if (!volunteer || dirty) return;
    setForm(profileForm(volunteer));
  }, [
    dirty,
    volunteer,
    volunteer?.mobile,
    volunteer?.email,
    volunteer?.address,
    volunteer?.bloodGroup,
    volunteer?.fatherName,
    volunteer?.abcId,
    volunteer?.myBharatId,
    volunteer?.emergencyContact,
    volunteer?.photoUrl,
  ]);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const [full, card] = await Promise.all([compressPassport(file), compressCardPhoto(file)]);
      const url = await blobToDataUrl(full.blob);
      setThumbUrl(await blobToDataUrl(card.blob));
      setPhotoDirty(true);
      setDirty(true);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that photograph.");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!volunteer || saving) return;
    const session = useSessionStore.getState().session;
    const password = session?.mobile || volunteer.mobile;
    if (!password) {
      toast.error("Sign in again, then save the profile.");
      return;
    }
    const mobile = form.mobile.replace(/\D/g, "").slice(-10);
    if (mobile && mobile.length < 10) {
      toast.error("Mobile must be 10 digits.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "update-profile",
          username: volunteer.volunteerId || session?.volunteerId || volunteer.fullName.split(/\s+/)[0] || volunteer.id,
          password,
          docId: session?.docId || "",
          volunteerId: volunteer.volunteerId || session?.volunteerId || volunteer.id,
          mobile,
          email: form.email,
          address: form.address,
          bloodGroup: form.bloodGroup,
          fatherName: form.fatherName,
          abcId: form.abcId,
          myBharatId: form.myBharatId,
          emergencyContact: form.emergencyContact,
          ...(photoDirty && form.photoUrl.startsWith("data:image/") ? { photoUrl: form.photoUrl, ...(thumbUrl.startsWith("data:image/") && thumbUrl.length < 8000 ? { thumbUrl } : {}) } : {}),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; docId?: string; volunteer?: OwnProfile };
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Could not save the profile.");
        return;
      }
      const saved = data.volunteer;
      const next = profileForm({
        mobile: saved?.mobile || mobile || form.mobile,
        email: saved?.email ?? form.email,
        address: saved?.address ?? form.address,
        bloodGroup: saved?.bloodGroup ?? form.bloodGroup,
        fatherName: saved?.fatherName ?? form.fatherName,
        abcId: saved?.abcId ?? form.abcId,
        myBharatId: saved?.myBharatId ?? form.myBharatId,
        emergencyContact: saved?.emergencyContact ?? form.emergencyContact,
        photoUrl: saved?.photoUrl || form.photoUrl,
      });
      writeOwnProfile({
        id: volunteer.id,
        volunteerId: volunteer.volunteerId || saved?.volunteerId,
        ...next,
      });
      rememberPhoto(
        [volunteer.volunteerId || "", volunteer.id || "", (volunteer.fullName || "").toLowerCase(), session?.volunteerId || ""],
        next.photoUrl,
      );
      if (session && (next.mobile.replace(/\D/g, "").length >= 10 || data.docId)) {
        useSessionStore.getState().setSession({
          ...session,
          ...(next.mobile.replace(/\D/g, "").length >= 10 ? { mobile: next.mobile.replace(/\D/g, "").slice(-10) } : {}),
          ...(data.docId ? { docId: data.docId } : {}),
        });
      }
      setForm(next);
      setPhotoDirty(false);
      setDirty(false);
      toast.success("Profile saved.");
    } catch {
      toast.error("Could not reach the college server.");
    } finally {
      setSaving(false);
    }
  }

  if (!volunteer) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">Opening your profile…</CardContent>
      </Card>
    );
  }

  function edit(patch: Partial<typeof form>) {
    setDirty(true);
    setForm((current) => ({ ...current, ...patch }));
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
            <Input value={form.mobile} inputMode="tel" onChange={(e) => edit({ mobile: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => edit({ email: e.target.value })} />
          </Field>
          <Field label="Father's name">
            <Input value={form.fatherName} onChange={(e) => edit({ fatherName: e.target.value })} />
          </Field>
          <Field label="Blood group">
            <Input value={form.bloodGroup} onChange={(e) => edit({ bloodGroup: e.target.value })} />
          </Field>
          <Field label="Address" wide>
            <Input value={form.address} onChange={(e) => edit({ address: e.target.value })} />
          </Field>
          <Field label="ABC ID">
            <Input value={form.abcId} onChange={(e) => edit({ abcId: e.target.value })} />
          </Field>
          <Field label="MY Bharat ID">
            <Input value={form.myBharatId} onChange={(e) => edit({ myBharatId: e.target.value })} />
          </Field>
          <Field label="Emergency contact">
            <Input
              value={form.emergencyContact}
              inputMode="tel"
              onChange={(e) => edit({ emergencyContact: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
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

function ProgressRow({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-medium text-navy">{label}</p>
        <p className="font-display text-lg tabular-nums text-forest">{Math.round(width)}%</p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-forest" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{suffix}</p>
    </div>
  );
}

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
