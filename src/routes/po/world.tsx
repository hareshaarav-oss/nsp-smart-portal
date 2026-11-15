import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { academicYear, formatLongDate, isBirthdayOn, kolkataToday } from "@/lib/nss/format";
import { downloadAttendanceExcel, downloadHoursExcel, downloadVolunteerExcel } from "@/lib/nss/reports";
import { activeVolunteers, flushOfflineAttendance, offlineAttendanceCount, totalServiceHours, useNssStore, volunteerHours } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/po/world")({ component: WorldDesk });

function WorldDesk() {
  const state = useNssStore();
  const { lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const today = kolkataToday();
  const year = academicYear(today);
  const people = activeVolunteers(state);
  const todayEvents = state.events.filter((event) => (event.date || "").slice(0, 10) === today);
  const diaryEvents = todayEvents.length ? todayEvents : [...state.events].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 1);
  const [eventId, setEventId] = useState(diaryEvents[0]?.id || "");
  const event = state.events.find((item) => item.id === eventId) || diaryEvents[0];
  const presentIds = new Set(state.attendance.filter((row) => row.eventId === event?.id && row.present).map((row) => row.volunteerId));
  const absent = people.filter((person) => event && !presentIds.has(person.id) && !presentIds.has(person.volunteerId));
  const photos = state.gallery.filter((item) => event && (item.eventId === event.id || item.eventName === event.name || (item.date || "").slice(0, 10) === (event.date || "").slice(0, 10))).slice(0, 6);
  const birthdays = people.filter((person) => person.dob && isBirthdayOn(person.dob, today));
  const hours = totalServiceHours(state);
  const target = Math.max(1, state.settings.serviceHourTarget || 240);
  const queued = offlineAttendanceCount();
  const ranking = useMemo(
    () => people.map((person) => ({ person, hours: volunteerHours(state, person.id) })).sort((a, b) => b.hours - a.hours).slice(0, 8),
    [people, state],
  );

  function shareDigest() {
    const notice = [...state.notices].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
    const lines = [
      state.settings.collegeShort || state.settings.collegeName,
      `${tr("NSS update", "NSS સમાચાર")} · ${formatLongDate(today)}`,
      event ? `${tr("Programme", "કાર્યક્રમ")}: ${event.name} · ${formatLongDate(event.date)} · ${event.location || ""}` : "",
      notice ? `${tr("Notice", "નોટિસ")}: ${notice.title}` : "",
      birthdays.length ? `${tr("Birthday", "જન્મદિવસ")}: ${birthdays.map((person) => person.fullName).join(", ")}` : "",
      `${tr("Service hours", "સેવા કલાક")}: ${hours}`,
      "https://nsp-smart-portal.vercel.app/polls",
    ].filter(Boolean);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  }

  function printYear() {
    const rows = ranking.map((row, index) => `<tr><td>${index + 1}</td><td>${row.person.fullName}</td><td>${row.person.unit}</td><td>${row.hours}</td></tr>`).join("");
    const html = `<!doctype html><html><head><title>${year}</title><style>body{font-family:Georgia,serif;color:#13294b;padding:32px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;text-align:left;padding:8px}</style></head><body><p>NSS · ${year}</p><h1>${state.settings.collegeName}</h1><p>${tr("Volunteers", "સ્વયંસેવકો")} ${people.length} · ${tr("Hours", "કલાક")} ${hours} · ${tr("Programmes", "કાર્યક્રમ")} ${state.events.length}</p><table><tr><th>#</th><th>${tr("Name", "નામ")}</th><th>${tr("Unit", "એકમ")}</th><th>${tr("Hours", "કલાક")}</th></tr>${rows}</table></body></html>`;
    const frame = window.open("", "_blank");
    if (!frame) return;
    frame.document.write(html);
    frame.document.close();
    frame.focus();
    frame.print();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">{year}</p>
        <h2 className="font-display text-3xl text-navy">{tr("Camp diary", "કેમ્પ ડાયરી")}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link to="/po/attendance">{tr("Attendance QR", "હાજરી QR")}</Link></Button>
        <Button variant="outline" onClick={shareDigest}>{tr("WhatsApp update", "વોટ્સએપ સારાંશ")}</Button>
        <Button variant="outline" onClick={() => downloadAttendanceExcel(state, { mode: "yearly" })}>{tr("University Excel", "યુનિવર્સિટી એક્સેલ")}</Button>
        <Button variant="outline" onClick={() => downloadHoursExcel(state)}>{tr("Hours Excel", "કલાક એક્સેલ")}</Button>
        <Button variant="outline" onClick={() => downloadVolunteerExcel(state)}>{tr("Roll Excel", "યાદી એક્સેલ")}</Button>
        <Button variant="outline" onClick={printYear}>{tr("Annual PDF", "વાર્ષિક PDF")}</Button>
        <Button variant="outline" onClick={() => flushOfflineAttendance()}>{tr("Send offline marks", "ઑફલાઇન હાજરી મોકલો")} ({queued})</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label={tr("Volunteers", "સ્વયંસેવકો")} value={people.length} />
        <Stat label={tr("Hours", "કલાક")} value={hours} />
        <Stat label={tr("Target", "લક્ષ્ય")} value={target} />
        <Stat label={tr("Waiting to sync", "મોકલવાની બાકી")} value={queued} />
      </div>
      <label className="block text-sm text-navy">
        {tr("Programme", "કાર્યક્રમ")}
        <select className="mt-1 h-11 w-full border border-navy/15 bg-card px-3" value={event?.id || ""} onChange={(e) => setEventId(e.target.value)}>
          {state.events.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatLongDate(item.date)}</option>)}
        </select>
      </label>
      {event ? (
        <section className="border border-navy/10 bg-card p-4 shadow-sm">
          <h3 className="font-display text-2xl text-navy">{event.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(event.date)} · {event.location} · {event.hours || 0} {tr("hours", "કલાક")}</p>
          {event.description ? <p className="mt-2 text-sm">{event.description}</p> : null}
          <p className="mt-3 text-sm font-semibold">{tr("Present", "હાજર")} {presentIds.size} · {tr("Absent", "ગેરહાજર")} {absent.length}</p>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {photos.map((photo) => photo.src ? <img key={photo.id} src={photo.src} alt="" className="aspect-square w-full object-cover" /> : null)}
          </div>
        </section>
      ) : null}
      <section className="border border-navy/10 bg-card shadow-sm">
        <h3 className="border-b border-navy/10 px-4 py-3 font-display text-xl text-navy">{tr("Absent list", "ગેરહાજર યાદી")}</h3>
        {absent.length ? (
          <ul className="divide-y divide-navy/10">
            {absent.map((person) => <li key={person.id} className="flex justify-between px-4 py-2 text-sm"><span>{person.fullName}</span><span className="text-muted-foreground">{person.volunteerId} · {person.unit}</span></li>)}
          </ul>
        ) : <p className="px-4 py-4 text-sm text-muted-foreground">{tr("No one is absent for this programme.", "આ કાર્યક્રમમાં કોઈ ગેરહાજર નથી.")}</p>}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="border border-navy/10 bg-card px-3 py-3 text-center shadow-sm"><p className="font-display text-2xl tabular-nums text-navy">{value}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p></div>;
}
