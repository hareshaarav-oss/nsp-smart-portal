import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/nss/shell";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/nss/format";
import { findSessionVolunteer, useSessionStore } from "@/lib/nss/session";
import { activeVolunteers, useNssStore, volunteerHours } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/passport")({ component: PassportPage });

function PassportPage() {
  const state = useNssStore();
  const session = useSessionStore((s) => s.session);
  const { lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const people = activeVolunteers(state);
  const mine = findSessionVolunteer(people, session);
  const [pick, setPick] = useState(mine?.id || people[0]?.id || "");
  const person = people.find((item) => item.id === pick) || mine;
  const hours = person ? volunteerHours(state, person.id) : 0;
  const target = 240;
  const width = Math.min(100, Math.round((hours / target) * 100));
  const certs = useMemo(
    () => (person ? state.certificates.filter((item) => item.volunteerId === person.id || item.volunteerId === person.volunteerId) : []),
    [person, state.certificates],
  );

  function shareCard() {
    if (!person) return;
    const text = [
      person.fullName,
      `${person.volunteerId} · ${person.unit}`,
      `${tr("Service hours", "સેવા કલાક")}: ${hours} / ${target}`,
      certs[0]?.certificateId ? `${tr("Certificate", "પ્રમાણપત્ર")}: ${certs[0].certificateId}` : "",
      "https://nsp-smart-portal.vercel.app/verify",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">NSS</p>
        <h1 className="font-display text-3xl text-navy">{tr("Student passport", "વિદ્યાર્થી પાસપોર્ટ")}</h1>
        <label className="mt-4 block text-sm">
          {tr("Volunteer", "સ્વયંસેવક")}
          <select className="mt-1 h-11 w-full border border-navy/15 bg-card px-3" value={person?.id || ""} onChange={(event) => setPick(event.target.value)}>
            {people.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
          </select>
        </label>
        {person ? (
          <article className="mt-4 border border-navy/10 bg-card p-5 shadow-sm">
            <div className="flex gap-4">
              <span className="flex h-28 w-24 items-center justify-center overflow-hidden bg-navy text-2xl font-semibold text-paper">
                {person.photoUrl ? <img src={person.photoUrl} alt="" className="h-full w-full object-cover" /> : person.fullName.slice(0, 1)}
              </span>
              <div>
                <h2 className="font-display text-2xl text-navy">{person.fullName}</h2>
                <p className="text-sm text-muted-foreground">{person.volunteerId} · {person.unit}</p>
                <p className="mt-2 text-sm">{person.course || ""}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold">{hours} / {target} {tr("hours", "કલાક")}</p>
            <div className="mt-2 h-3 bg-muted"><div className="h-full bg-forest" style={{ width: `${width}%` }} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{tr("Remaining", "બાકી")} {Math.max(0, target - hours)}</p>
            <div className="mt-4 space-y-2">
              {certs.length ? certs.map((cert) => {
                const programme = state.events.find((event) => event.id === cert.eventId);
                return <p key={cert.id} className="text-sm">{cert.certificateId || tr("Certificate", "પ્રમાણપત્ર")} · {programme?.name || ""} · {formatLongDate(programme?.date || "")}</p>;
              }) : <p className="text-sm text-muted-foreground">{hours >= target ? tr("Hours are complete. Ask the officer for the certificate.", "કલાક પૂરા થયા. અધિકારી પાસેથી પ્રમાણપત્ર લો.") : tr("Certificate appears when the hours are complete.", "કલાક પૂરા થાય ત્યારે પ્રમાણપત્ર અહીં દેખાશે.")}</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={shareCard}>{tr("Share on WhatsApp", "વોટ્સએપ પર મોકલો")}</Button>
              <Button variant="outline" asChild><Link to="/verify" search={{ id: certs[0]?.certificateId || "" }}>{tr("Check certificate", "પ્રમાણપત્ર ચકાસો")}</Link></Button>
            </div>
          </article>
        ) : <p className="mt-6 text-sm text-muted-foreground">{tr("No volunteer record yet.", "હજી સ્વયંસેવક નોંધ નથી.")}</p>}
      </div>
    </AppShell>
  );
}
