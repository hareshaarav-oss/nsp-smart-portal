import { useMemo, useState } from "react";
import { formatLongDate } from "@/lib/nss/format";
import { addYears, decadeDays, yearsIn } from "@/lib/nss/dashak";
import { kolkataClock } from "@/lib/nss/samay";
import { liveServiceHours, useNssStore } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

const SEED_IDS = new Set([
  "evt-plantation",
  "evt-camp",
  "evt-blood",
  "evt-swachhata",
  "evt-republic",
]);

export function DashakBoard() {
  const { lang } = useUi();
  const gu = lang === "gu";
  const events = useNssStore((s) => s.events) ?? [];
  const collegeReady = useNssStore((s) => (s.volunteers ?? []).some((v) => v.fullName));
  const hours = useNssStore((s) => liveServiceHours(s));
  const clock = kolkataClock();
  const days = useMemo(() => decadeDays(clock.iso), [clock.iso]);
  const years = useMemo(() => yearsIn(days), [days]);
  const [picked, setPicked] = useState<number | null>(null);
  const year = years.includes(picked ?? -1) ? picked! : years[0];
  const horizon = addYears(clock.iso, 10);
  const shown = days.filter((day) => Number(day.iso.slice(0, 4)) === year);
  const next = days.filter((day) => day.days > 0).slice(0, 4);
  const today = days.filter((day) => day.days === 0);
  const programmes = (collegeReady ? events : [])
    .filter((event) => {
      if (SEED_IDS.has(event.id)) return false;
      const status = (event.status || "").toLowerCase();
      if (status === "cancelled") return false;
      const start = (event.date || "").slice(0, 10);
      return start >= clock.iso && start <= horizon && Number(start.slice(0, 4)) === year;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "en"));

  return (
    <section id="dashak" className="mt-8 scroll-mt-28 overflow-hidden border border-navy/15 bg-card" suppressHydrationWarning>
      <div className="border-b border-navy/10 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">{gu ? "દશક" : "Decade"}</p>
        <h2 className="font-display text-2xl text-navy md:text-3xl">{gu ? "આગામી દસ વર્ષ" : "The next ten years"}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/80">
          {gu
            ? `આજથી ${formatLongDate(horizon)} સુધીની નિશ્ચિત તારીખો. રાષ્ટ્રીય અને એનએસએસ દિવસ દર વર્ષે એ જ તારીખે આવે છે. દીવાળી જેવા ચાંદ્ર તહેવારની પછીની તારીખ અહીં અંદાજી નથી.`
            : `Fixed dates from today through ${formatLongDate(horizon)}. National and NSS days repeat on the same civil date. Later lunar festivals, such as Diwali, are not guessed.`}
        </p>
        <p className="mt-2 text-sm text-forest">
          {gu
            ? `${hours} સેવા કલાક પહેલેથી નોંધાયા છે. નવા કલાક ફક્ત હાજરી નોંધાય ત્યારે ઉમેરાશે.`
            : `${hours} service hours are already recorded. New hours are added only when attendance is marked.`}
        </p>
      </div>
      {today.length ? (
        <ul className="border-b border-saffron/30 bg-[#fff6ea] px-4 py-3">
          {today.map((day) => (
            <li key={`today-${day.iso}-${day.en}`} className="text-sm font-medium text-navy">
              {gu ? "આજે" : "Today"} · {gu ? day.gu : day.en}
            </li>
          ))}
        </ul>
      ) : null}
      {next.length ? (
        <div className="grid gap-px border-b border-navy/10 bg-navy/10 sm:grid-cols-2 lg:grid-cols-4">
          {next.map((day) => (
            <div key={`${day.iso}-${day.en}`} className="bg-card px-4 py-3">
              <p className="text-[11px] font-semibold text-saffron">{formatLongDate(day.iso)}</p>
              <p className="mt-1 text-sm font-medium text-navy">{gu ? day.gu : day.en}</p>
              <p className="text-xs text-ink/70">{day.days === 1 ? (gu ? "આવતીકાલે" : "Tomorrow") : gu ? `${day.days} દિવસ` : `${day.days} days`}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {years.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === year}
            onClick={() => setPicked(item)}
            className={item === year ? "shrink-0 border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-paper" : "shrink-0 border border-navy/20 px-3 py-1.5 text-sm text-navy"}
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-navy/10 px-4">
        {shown.map((day) => (
          <li key={`${day.iso}-${day.en}`} className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="min-w-0 text-sm text-navy">
              {gu ? day.gu : day.en}
              {day.kind === "dated" ? <span className="ml-2 text-xs text-saffron">{gu ? "ફક્ત આ વર્ષ" : "This year only"}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-ink/70">{formatLongDate(day.iso)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-navy/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-saffron">{gu ? "કોલેજે નોંધેલ કાર્યક્રમ" : "Programmes already saved"}</p>
        {programmes.length ? (
          <ul className="mt-2 space-y-1">
            {programmes.map((event) => (
              <li key={event.id} className="text-sm text-navy">
                <span className="font-medium">{event.name}</span>
                <span className="text-ink/70">{` · ${formatLongDate(event.date.slice(0, 10))}${event.location ? ` · ${event.location}` : ""}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink/70">
            {gu ? "આ વર્ષનો આગામી કાર્યક્રમ હજી નોંધાયો નથી." : "No upcoming programme is saved for this year yet."}
          </p>
        )}
      </div>
    </section>
  );
}
