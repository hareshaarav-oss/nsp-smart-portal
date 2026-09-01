import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BrainCircuit, Cake, CheckCircle2, Clock3, FileText, Search, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { activeVolunteers, totalServiceHours, useNssStore, volunteerHours } from "@/lib/nss/store";
import { daysUntilBirthday, isBirthdayOn, todayIso } from "@/lib/nss/format";

export const Route = createFileRoute("/po/ai")({ component: SmartCommandPage });

function SmartCommandPage() {
  const state = useNssStore();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const today = todayIso();
  const volunteers = activeVolunteers(state);

  const suggestions = [
    "show top volunteers",
    "attendance below 75",
    "today birthdays",
    "upcoming events",
    "service hours",
    "certificate eligible volunteers",
  ];

  function run(raw = query) {
    const q = raw.trim().toLowerCase();
    if (!q) return;
    if (q.includes("birthday") || q.includes("જન્મદિવસ")) {
      const rows = volunteers.filter((v) => isBirthdayOn(v.dob, today));
      setAnswer(rows.length ? `Today: ${rows.map((v) => v.fullName).join(", ")}.` : "No volunteer birthday today.");
      return;
    }
    if (q.includes("attendance") && (q.includes("75") || q.includes("low") || q.includes("ઓછી"))) {
      const rows = volunteers.filter((v) => { const a = state.attendance.filter((x) => x.volunteerId === v.id); const p = a.filter((x) => x.present).length; return a.length >= 1 && p / a.length < 0.75; });
      setAnswer(rows.length ? `${rows.length} volunteers are below 75% attendance: ${rows.slice(0, 12).map((v) => v.fullName).join(", ")}${rows.length > 12 ? "…" : ""}` : "No volunteer is currently below 75% attendance.");
      return;
    }
    if (q.includes("top") || q.includes("best") || q.includes("active")) {
      const rows = [...volunteers].sort((a, b) => volunteerHours(state, b.id) - volunteerHours(state, a.id)).slice(0, 10);
      setAnswer(rows.length ? `Top volunteers: ${rows.map((v, i) => `${i + 1}. ${v.fullName} (${volunteerHours(state, v.id)} hrs)`).join(" · ")}` : "No volunteer data available.");
      return;
    }
    if (q.includes("event")) {
      const rows = state.events.filter((e) => e.status === "upcoming" || e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
      setAnswer(rows.length ? `Upcoming: ${rows.map((e) => `${e.name} — ${e.date}`).join(" · ")}` : "No upcoming events found.");
      return;
    }
    if (q.includes("hour")) {
      setAnswer(`Total calculated NSS service hours: ${totalServiceHours(state)} hours.`);
      return;
    }
    if (q.includes("certificate") || q.includes("eligible")) {
      const eventIds = new Set(state.events.filter((e) => e.status === "completed").map((e) => e.id));
      const presentIds = new Set(state.attendance.filter((a) => a.present && eventIds.has(a.eventId)).map((a) => a.volunteerId));
      const rows = volunteers.filter((v) => presentIds.has(v.id));
      setAnswer(`${rows.length} active volunteers have participated in at least one completed event and can be reviewed for certificates.`);
      return;
    }
    setAnswer("Try: top volunteers, attendance below 75, today birthdays, upcoming events, service hours, or certificate eligible volunteers.");
  }

  const nextBirthday = useMemo(() => [...volunteers].sort((a, b) => daysUntilBirthday(a.dob, today) - daysUntilBirthday(b.dob, today)).slice(0, 3), [volunteers, today]);

  return <div className="space-y-6">
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-forest/5">
      <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="size-6 text-primary" /> NSS Smart Command Center <Badge tone="forest">Offline-ready</Badge></CardTitle><p className="text-sm text-muted-foreground">Ask in simple English or Gujarati. This assistant analyses the portal data locally; no external AI key is required.</p></CardHeader>
      <CardContent>
        <div className="flex gap-2"><Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Ask: attendance below 75…" /><button type="button" onClick={() => run()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Search className="size-4" />Ask</button></div>
        <div className="mt-3 flex flex-wrap gap-2">{suggestions.map((x) => <button key={x} type="button" onClick={() => { setQuery(x); run(x); }} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted">{x}</button>)}</div>
        {answer ? <div className="mt-4 rounded-xl border border-forest/20 bg-forest/5 p-4 text-sm leading-relaxed"><div className="flex items-start gap-2"><Sparkles className="mt-0.5 size-4 text-saffron" /><p>{answer}</p></div></div> : null}
      </CardContent>
    </Card>

    <div className="grid gap-4 md:grid-cols-3">
      <SmartCard icon={Users} title="Volunteer intelligence" text={`${volunteers.length} active volunteers tracked.`} to="/po/volunteers" />
      <SmartCard icon={CheckCircle2} title="Attendance intelligence" text="Find low attendance and missing marks quickly." to="/po/attendance" />
      <SmartCard icon={FileText} title="Report intelligence" text="Generate and export official reports from current data." to="/po/reports" />
    </div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Cake className="size-5 text-saffron" /> Birthday radar</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-3">{nextBirthday.map((v) => <div key={v.id} className="rounded-xl border border-border p-3"><p className="font-medium">{v.fullName}</p><p className="text-xs text-muted-foreground">{daysUntilBirthday(v.dob, today) === 0 ? "Today 🎉" : `${daysUntilBirthday(v.dob, today)} days`}</p></div>)}</CardContent></Card>
  </div>;
}

function SmartCard({ icon: Icon, title, text, to }: { icon: typeof Users; title: string; text: string; to: "/po/volunteers" | "/po/attendance" | "/po/reports" }) {
  return <Link to={to}><Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md"><CardContent className="pt-5"><Icon className="size-6 text-primary" /><p className="mt-3 font-display font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Open <span>→</span></span></CardContent></Card></Link>;
}
