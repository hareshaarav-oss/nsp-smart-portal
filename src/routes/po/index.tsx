import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Award, CalendarDays, ClipboardCheck, FileSpreadsheet, Images, Newspaper, Settings, Users, Clock, GraduationCap, Bell, Activity, Search, Trash2 } from "lucide-react";
import { BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, todayIso, byFullName } from "@/lib/nss/format";
import { liveServiceHours, useNssStore } from "@/lib/nss/store";
import { TomorrowBanner } from "@/components/nss/tomorrow";
import { ensurePublicGallery } from "@/lib/nss/public-gallery";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/po/")({ component: PoHome });

function PoHome() {
  const state = useNssStore();
  const { lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const [search, setSearch] = useState("");
  useEffect(() => {
    void ensurePublicGallery();
  }, []);
  const today = todayIso();
  const volunteers = useMemo(() => state.volunteers.filter((v) => v.status !== "alumni").sort(byFullName), [state.volunteers]);
  const alumni = state.volunteers.filter((v) => v.status === "alumni").length;
  const hours = liveServiceHours(state);
  const upcoming = [...state.events].filter((e) => e.status === "upcoming" || e.date >= today).filter((e) => e.status !== "cancelled").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const completed = state.events.filter((e) => e.status === "completed").length;
  const presentRows = state.attendance.filter((a) => a.present).length;
  const totalRows = state.attendance.length;
  const attendancePct = totalRows ? Math.round((presentRows / totalRows) * 100) : 0;
  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; events: number; hours: number }>();
    state.events.forEach((e) => {
      const key = e.date.slice(0,7); const row = map.get(key) || { month: key, events: 0, hours: 0 };
      row.events += 1; row.hours += state.attendance.filter((a)=>a.eventId===e.id && a.present).length * (e.hours || 0); map.set(key,row);
    });
    return [...map.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-8);
  }, [state.events, state.attendance]);
  const unitData = ["Unit 1","Unit 2"].map((unit)=>({ name: unit, volunteers: volunteers.filter(v=>v.unit===unit).length }));
  const todayBirthdays = volunteers.filter((v) => v.dob && isBirthdayOn(v.dob, today)).length;
  const upcomingBirthdays = volunteers.filter((v) => v.dob && daysUntilBirthday(v.dob, today) > 0 && daysUntilBirthday(v.dob, today) <= 7).length;
  const rsvpReplies = (state.eventRsvps ?? []).length;
  const lowAttendance = volunteers.filter((v) => {
    const rows = state.attendance.filter((a) => a.volunteerId === v.id || a.volunteerId === v.volunteerId);
    return rows.length >= 3 && rows.filter((a) => a.present).length / rows.length < 0.75;
  }).length;
  const alerts = [
    { label: tr("Low attendance", "ઓછી હાજરી"), value: lowAttendance },
    { label: tr("Upcoming events", "આવનાર કાર્યક્રમ"), value: upcoming.length },
    { label: tr("Certificates issued", "આપેલ પ્રમાણપત્ર"), value: state.certificates.length },
    { label: tr("Event replies", "કાર્યક્રમના જવાબ"), value: rsvpReplies },
    { label: tr("Birthdays today", "આજના જન્મદિવસ"), value: todayBirthdays },
    { label: tr("Birthdays next 7 days", "આગામી ૭ દિવસના જન્મદિવસ"), value: upcomingBirthdays },
  ];
  const newest = useMemo(
    () => volunteers.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || a.fullName.localeCompare(b.fullName, "en")).slice(0, 12),
    [volunteers],
  );
  return <div className="space-y-6">
    <TomorrowBanner />
    <div className="rounded-2xl bg-navy p-5 text-paper md:p-6">
      <h2 className="font-display text-2xl font-semibold">{tr("Desk", "ડેસ્ક")}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-6"><HeroStat icon={Users} value={volunteers.length} label={tr("Volunteers", "સ્વયંસેવકો")}/><HeroStat icon={GraduationCap} value={alumni} label={tr("Alumni", "ભૂતપૂર્વ")}/><HeroStat icon={ClipboardCheck} value={`${attendancePct}%`} label={tr("Attendance", "હાજરી")}/><HeroStat icon={Clock} value={hours} label={tr("Hours", "કલાક")}/><HeroStat icon={CalendarDays} value={state.events.length} label={tr("Events", "કાર્યક્રમ")}/><HeroStat icon={Users} value={state.visitors} label={tr("Visitors", "મુલાકાતીઓ")}/></div>
    </div>
    <Card><CardContent className="pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-display text-lg font-semibold">New volunteers</h3><Link to="/po/volunteers" className="text-sm text-primary">Open roll</Link></div>{newest.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{newest.map((v) => <div key={v.id} className="flex items-center gap-2 rounded-xl border border-border p-2"><span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy text-sm font-semibold text-paper">{v.photoUrl ? <img src={v.photoUrl} alt="" className="size-12 object-cover" /> : v.fullName.slice(0, 1)}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-navy">{v.fullName}</span><span className="block truncate text-[11px] text-muted-foreground">{v.volunteerId}{v.createdAt ? ` · ${formatLongDate(v.createdAt)}` : ""}</span></span></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No volunteer on the roll yet.</p>}</CardContent></Card>
    <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><Search className="size-5 text-primary"/><h3 className="font-display text-lg font-semibold">Smart Search</h3></div><div className="mt-3 flex gap-2"><input value={search} onChange={(e)=>setSearch(e.target.value)} className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm" placeholder="Search student, Volunteer ID, event, certificate, report…" /></div>{search.trim() ? <div className="mt-3 grid gap-2 md:grid-cols-2">{state.volunteers.filter(v=>`${v.fullName} ${v.volunteerId} ${v.mobile}`.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(v=><div key={v.id} className="rounded-lg border border-border p-3 text-sm"><strong>{v.fullName}</strong><p className="text-xs text-muted-foreground">{v.volunteerId} · {v.mobile}</p></div>)}{state.events.filter(e=>`${e.name} ${e.location}`.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(e=><div key={e.id} className="rounded-lg border border-border p-3 text-sm"><strong>{e.name}</strong><p className="text-xs text-muted-foreground">{formatLongDate(e.date)} · {e.location}</p></div>)}{state.certificates.filter(c=>c.id.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(c=><div key={c.id} className="rounded-lg border border-border p-3 text-sm"><strong>Certificate</strong><p className="text-xs text-muted-foreground">{c.id}</p></div>)}{(state.pressReports??[]).filter(r=>`${r.name} ${r.fileName}`.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(r=><div key={r.id} className="rounded-lg border border-border p-3 text-sm"><strong>Press Report</strong><p className="text-xs text-muted-foreground">{r.name} · {r.fileName}</p></div>)}</div> : null}</CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]"><Card><CardContent className="pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Monthly NSS Activity</h3><Activity className="size-5 text-primary"/></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="events" name="Events"/><Bar dataKey="hours" name="Service hours"/></BarChart></ResponsiveContainer></div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Unit Distribution</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={unitData} dataKey="volunteers" nameKey="name" outerRadius={90} label/><Tooltip/></PieChart></ResponsiveContainer></div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Service Hours Trend</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Line type="monotone" dataKey="hours" name="Service hours" strokeWidth={3}/></LineChart></ResponsiveContainer></div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Notification & Alert Center</h3><div className="mt-3 space-y-3">{alerts.map(a=><div key={a.label} className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm">{a.label}</span><strong className="font-display text-xl">{a.value}</strong></div>)}<div className="rounded-xl bg-muted p-3 text-sm"><Bell className="mr-2 inline size-4"/>{state.notices.length} active notices · {state.gallery.length} gallery files</div></div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="pt-5"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Upcoming Events</h3><Link to="/po/events" className="text-sm text-primary">Manage</Link></div><div className="mt-3 space-y-2">{upcoming.length?upcoming.map(e=><div key={e.id} className="rounded-xl border border-border p-3"><div className="flex items-center justify-between gap-2"><strong>{e.name}</strong><Badge tone="saffron">Upcoming</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatLongDate(e.date)}{e.endDate&&e.endDate!==e.date?` – ${formatLongDate(e.endDate)}`:""} · {e.location}</p></div>):<p className="text-sm text-muted-foreground">No upcoming events.</p>}</div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Quick Actions</h3><div className="mt-3 grid grid-cols-2 gap-2"><Quick to="/po/volunteers" icon={Users} label="Volunteers"/><Quick to="/po/events" icon={CalendarDays} label="Create Event"/><Quick to="/po/attendance" icon={ClipboardCheck} label="Attendance"/><Quick to="/po/certificates" icon={Award} label="Certificates"/><Quick to="/po/gallery" icon={Images} label="Gallery"/><Quick to="/po/press" icon={Newspaper} label="Press Desk"/><Quick to="/po/reports" icon={FileSpreadsheet} label="Reports"/><Quick to="/po/settings" icon={Settings} label="Settings"/><Quick to="/po/backup" icon={Trash2} label="Backup & Recycle"/></div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Recent Notices</h3><div className="mt-3 space-y-2">{state.notices.slice(0,5).map(n=><div key={n.id} className="rounded-lg border border-border p-3"><strong>{n.title}</strong><p className="mt-1 text-xs text-muted-foreground">{formatLongDate(n.date)}</p></div>)}</div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">{tr("Portal Summary", "પોર્ટલ સાર")}</h3><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><Summary label={tr("Completed events", "પૂર્ણ કાર્યક્રમ")} value={completed}/><Summary label={tr("Present marks", "હાજર નોંધ")} value={presentRows}/><Summary label={tr("Certificates", "પ્રમાણપત્ર")} value={state.certificates.length}/><Summary label={tr("Press reports", "પ્રેસ અહેવાલ")} value={(state.pressReports??[]).length}/></div></CardContent></Card></div>
  </div>;
}
function HeroStat({icon:Icon,value,label}:{icon:any;value:string|number;label:string}){return <div className="rounded-2xl bg-white/10 p-3 backdrop-blur"><Icon className="size-4 text-saffron"/><p className="mt-2 font-display text-2xl font-bold">{value}</p><p className="text-[11px] text-paper/70">{label}</p></div>}
function Summary({label,value}:{label:string;value:number}){return <div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>}
function Quick({to,icon:Icon,label}:{to:any;icon:any;label:string}){return <Link to={to} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium hover:bg-muted"><Icon className="size-4 text-saffron"/>{label}</Link>}
