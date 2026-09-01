import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Award, Clock, HeartHandshake, MapPinned, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activeVolunteers, totalServiceHours, useNssStore, volunteerHours } from "@/lib/nss/store";

export const Route = createFileRoute("/po/impact")({ component: ImpactPage });

function ImpactPage() {
  const state = useNssStore();
  const volunteers = activeVolunteers(state);
  const hours = totalServiceHours(state);
  const attendanceMarked = state.attendance.filter((a) => a.present).length;
  const villages = new Set(state.events.map((e) => e.location.trim()).filter(Boolean)).size;
  const beneficiaries = state.events.reduce((sum, e) => sum + (e.beneficiaries ?? 0), 0);
  const target = Math.max(1, state.settings.serviceHourTarget || 120);
  const progress = Math.min(100, Math.round((hours / target) * 100));
  const top = useMemo(() => [...volunteers].sort((a, b) => volunteerHours(state, b.id) - volunteerHours(state, a.id)).slice(0, 8), [volunteers, state]);

  return <div className="space-y-6">
    <div><h2 className="font-display text-2xl font-bold">NSS Impact Analytics</h2><p className="text-sm text-muted-foreground">Turn attendance and activity records into a clear yearly impact picture.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6"><Metric icon={Users} label="Active volunteers" value={volunteers.length} /><Metric icon={HeartHandshake} label="Events" value={state.events.length} /><Metric icon={Clock} label="Service hours" value={hours} /><Metric icon={Award} label="Certificates" value={state.certificates.length} /><Metric icon={MapPinned} label="Activity locations" value={villages} /><Metric icon={Users} label="Beneficiaries" value={beneficiaries} /></div>
    <Card><CardHeader><CardTitle>Service-hour target</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="font-display text-4xl font-bold">{progress}%</p><p className="text-sm text-muted-foreground">{hours} of {target} hours</p></div><p className="text-sm font-semibold text-forest">{attendanceMarked} present marks</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Top service contributors</CardTitle></CardHeader><CardContent className="space-y-3">{top.map((v, i) => <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-3"><div><span className="mr-2 text-xs text-muted-foreground">#{i + 1}</span><span className="font-medium">{v.fullName}</span></div><span className="font-semibold">{volunteerHours(state, v.id)} hrs</span></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Impact summary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>📌 <strong>{state.events.length}</strong> activities recorded in the portal.</p><p>⏱️ <strong>{hours}</strong> service hours calculated from attendance.</p><p>👥 <strong>{attendanceMarked}</strong> present attendance records.</p><p>🏘️ <strong>{villages}</strong> distinct activity locations.</p><p>🤝 <strong>{beneficiaries}</strong> beneficiaries recorded on events.</p><p>🏅 <strong>{state.certificates.length}</strong> certificates issued in this device/cloud dataset.</p><p className="text-xs text-muted-foreground">Beneficiary counts can be added per event in the event data for a more complete impact report.</p></CardContent></Card></div>
  </div>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) { return <Card><CardContent className="pt-5"><Icon className="size-5 text-primary" /><p className="mt-2 font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>; }
