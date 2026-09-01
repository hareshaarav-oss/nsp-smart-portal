import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Award, CalendarDays, ClipboardCheck, FileSpreadsheet, Images, Newspaper, Settings, Users, Clock, GraduationCap, Bell, Activity, Search, Trash2 } from "lucide-react";
import { BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, todayIso, byFullName } from "@/lib/nss/format";
import { attendanceOf, totalServiceHours, useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/po/")({ component: PoHome });

function PoHome() {
  const state = useNssStore();
  const [search, setSearch] = useState("");
  const today = todayIso();
  const volunteers = useMemo(() => state.volunteers.filter((v) => v.status !== "alumni").sort(byFullName), [state.volunteers]);
  const alumni = state.volunteers.filter((v) => v.status === "alumni").length;
  const hours = totalServiceHours(state);
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
  const rsvpPending = state.events.reduce((sum, e) => { const assigned = e.participantIds?.length ? e.participantIds : volunteers.map((v) => v.id); const responded = new Set((state.eventRsvps ?? []).filter((r) => r.eventId === e.id).map((r) => r.volunteerId)); return sum + assigned.filter((id) => !responded.has(id)).length; }, 0);
  const alerts = [
    { label: "Low attendance records", value: volunteers.filter(v=>{ const r=state.attendance.filter(a=>a.volunteerId===v.id); return r.length>=3 && r.filter(a=>a.present).length/r.length<.75; }).length },
    { label: "Upcoming events", value: upcoming.length },
    { label: "Certificates issued", value: state.certificates.length },
    { label: "RSVP pending", value: rsvpPending },
    { label: "Birthdays today", value: todayBirthdays },
    { label: "Birthdays next 7 days", value: upcomingBirthdays },
  ];
  return <div className="space-y-6">
    <div className="rounded-3xl bg-gradient-to-r from-navy via-primary to-forest p-6 text-paper shadow-xl md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.22em] text-paper/70">NSS COMMAND CENTER</p><h2 className="mt-2 font-display text-3xl font-bold">Admin Dashboard</h2><p className="mt-1 text-sm text-paper/75">Live overview of volunteers, attendance, events, service hours and reports.</p></div><Badge tone="saffron">Live portal data</Badge></div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6"><HeroStat icon={Users} value={volunteers.length} label="Volunteers"/><HeroStat icon={GraduationCap} value={alumni} label="Alumni"/><HeroStat icon={ClipboardCheck} value={`${attendancePct}%`} label="Attendance"/><HeroStat icon={Clock} value={hours} label="Service Hours"/><HeroStat icon={CalendarDays} value={state.events.length} label="Events"/><HeroStat icon={Users} value={state.visitors} label="Visitors"/></div>
    </div>
    <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><Search className="size-5 text-primary"/><h3 className="font-display text-lg font-semibold">Smart Search</h3></div><div className="mt-3 flex gap-2"><input value={search} onChange={(e)=>setSearch(e.target.value)} className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm" placeholder="Search student, Volunteer ID, event, certificate, report…" /></div>{search.trim() ? <div className="mt-3 grid gap-2 md:grid-cols-2">{state.volunteers.filter(v=>`${v.fullName} ${v.volunteerId} ${v.mobile}`.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(v=><div key={v.id} className="rounded-lg border border-border p-3 text-sm"><strong>{v.fullName}</strong><p className="text-xs text-muted-foreground">{v.volunteerId} · {v.mobile}</p></div>)}{state.events.filter(e=>`${e.name} ${e.location}`.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(e=><div key={e.id} className="rounded-lg border border-border p-3 text-sm"><strong>{e.name}</strong><p className="text-xs text-muted-foreground">{formatLongDate(e.date)} · {e.location}</p></div>)}{state.certificates.filter(c=>c.id.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(c=><div key={c.id} className="rounded-lg border border-border p-3 text-sm"><strong>Certificate</strong><p className="text-xs text-muted-foreground">{c.id}</p></div>)}{(state.pressReports??[]).filter(r=>`${r.name} ${r.fileName}`.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(r=><div key={r.id} className="rounded-lg border border-border p-3 text-sm"><strong>Press Report</strong><p className="text-xs text-muted-foreground">{r.name} · {r.fileName}</p></div>)}</div> : null}</CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]"><Card><CardContent className="pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Monthly NSS Activity</h3><Activity className="size-5 text-primary"/></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="events" name="Events"/><Bar dataKey="hours" name="Service hours"/></BarChart></ResponsiveContainer></div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Unit Distribution</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={unitData} dataKey="volunteers" nameKey="name" outerRadius={90} label/><Tooltip/></PieChart></ResponsiveContainer></div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Service Hours Trend</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Line type="monotone" dataKey="hours" name="Service hours" strokeWidth={3}/></LineChart></ResponsiveContainer></div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Notification & Alert Center</h3><div className="mt-3 space-y-3">{alerts.map(a=><div key={a.label} className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm">{a.label}</span><strong className="font-display text-xl">{a.value}</strong></div>)}<div className="rounded-xl bg-muted p-3 text-sm"><Bell className="mr-2 inline size-4"/>{state.notices.length} active notices · {state.gallery.length} gallery files</div></div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="pt-5"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Upcoming Events</h3><Link to="/po/events" className="text-sm text-primary">Manage</Link></div><div className="mt-3 space-y-2">{upcoming.length?upcoming.map(e=><div key={e.id} className="rounded-xl border border-border p-3"><div className="flex items-center justify-between gap-2"><strong>{e.name}</strong><Badge tone="saffron">Upcoming</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatLongDate(e.date)}{e.endDate&&e.endDate!==e.date?` – ${formatLongDate(e.endDate)}`:""} · {e.location}</p></div>):<p className="text-sm text-muted-foreground">No upcoming events.</p>}</div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Quick Actions</h3><div className="mt-3 grid grid-cols-2 gap-2"><Quick to="/po/volunteers" icon={Users} label="Volunteers"/><Quick to="/po/events" icon={CalendarDays} label="Create Event"/><Quick to="/po/attendance" icon={ClipboardCheck} label="Attendance"/><Quick to="/po/certificates" icon={Award} label="Certificates"/><Quick to="/po/gallery" icon={Images} label="Gallery"/><Quick to="/po/press" icon={Newspaper} label="Press Desk"/><Quick to="/po/reports" icon={FileSpreadsheet} label="Reports"/><Quick to="/po/settings" icon={Settings} label="Settings"/><Quick to="/po/backup" icon={Trash2} label="Backup & Recycle"/></div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Recent Notices</h3><div className="mt-3 space-y-2">{state.notices.slice(0,5).map(n=><div key={n.id} className="rounded-lg border border-border p-3"><strong>{n.title}</strong><p className="mt-1 text-xs text-muted-foreground">{formatLongDate(n.date)}</p></div>)}</div></CardContent></Card><Card><CardContent className="pt-5"><h3 className="font-display text-lg font-semibold">Portal Summary</h3><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><Summary label="Completed events" value={completed}/><Summary label="Present marks" value={presentRows}/><Summary label="Certificates" value={state.certificates.length}/><Summary label="External press reports" value={(state.pressReports??[]).length}/></div></CardContent></Card></div>
  </div>;
}
function HeroStat({icon:Icon,value,label}:{icon:any;value:string|number;label:string}){return <div className="rounded-2xl bg-white/10 p-3 backdrop-blur"><Icon className="size-4 text-saffron"/><p className="mt-2 font-display text-2xl font-bold">{value}</p><p className="text-[11px] text-paper/70">{label}</p></div>}
function Summary({label,value}:{label:string;value:number}){return <div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>}
function Quick({to,icon:Icon,label}:{to:any;icon:any;label:string}){return <Link to={to} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium hover:bg-muted"><Icon className="size-4 text-saffron"/>{label}</Link>}
