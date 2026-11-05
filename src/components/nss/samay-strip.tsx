import { useEffect, useState } from "react";
import { formatLongDate } from "@/lib/nss/format";
import { daysBetween, greetingFor, kolkataClock, nextNote, nextProgramme, noteOn, programmesOn, type SamayEvent } from "@/lib/nss/samay";
import { useNssStore } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

const SEED_IDS = new Set([
  "evt-plantation",
  "evt-camp",
  "evt-blood",
  "evt-swachhata",
  "evt-republic",
  "ntc-leaders",
  "ntc-reg",
  "gal-plantation",
  "gal-plantation-2",
  "gal-swachhata",
]);

function wish(note: { en: string; gu: string }, gu: boolean) {
  if (!gu) return note.en;
  if (note.gu === "બેસતું વર્ષ") return "સાલ મુબારક · નૂતન વર્ષાભિનંદન";
  return `${note.gu}ની શુભકામના`;
}

function soonLine(name: string, days: number, gu: boolean) {
  if (gu) return days === 1 ? `${name} આવતીકાલે` : `${name} ${days} દિવસમાં`;
  return days === 1 ? `${name} tomorrow` : `${name} in ${days} days`;
}

export function SamayStrip() {
  const { lang } = useUi();
  const gu = lang === "gu";
  const events = useNssStore((s) => s.events) ?? [];
  const collegeReady = useNssStore((s) => (s.volunteers ?? []).some((v) => v.fullName));
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = kolkataClock(now ?? new Date());
  const greet = greetingFor(clock.hour);
  const todayNote = noteOn(clock.iso);
  const coming = todayNote ? null : nextNote(clock.iso);
  const liveEvents: SamayEvent[] = collegeReady ? events.filter((event) => !SEED_IDS.has(event.id)) : [];
  const todayEvents = programmesOn(liveEvents, clock.iso);
  const next = nextProgramme(liveEvents, clock.iso);
  const tone =
    todayNote?.tone === "festival" || coming?.note.tone === "festival"
      ? "border-saffron/70"
      : todayNote?.tone === "nation"
        ? "border-[#138808]"
        : "border-navy/15";

  return (
    <section className={`overflow-hidden rounded-2xl border bg-paper ${tone}`}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-saffron" suppressHydrationWarning>{gu ? greet.gu : greet.en}</p>
          <p className="font-display text-3xl tabular-nums text-navy" suppressHydrationWarning>{clock.clock}</p>
          <p className="text-sm text-ink/80" suppressHydrationWarning>
            {gu ? clock.weekdayGu : clock.weekdayEn} · {formatLongDate(clock.iso)} · IST
          </p>
        </div>
        {todayNote ? (
          <p className="max-w-xs text-right font-display text-lg leading-snug text-forest">{wish(todayNote, gu)}</p>
        ) : coming ? (
          <p className="max-w-xs text-right text-sm font-medium text-navy">{soonLine(gu ? coming.note.gu : coming.note.en, coming.days, gu)}</p>
        ) : null}
      </div>
      <div className="grid border-t border-navy/10 sm:grid-cols-2">
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-saffron">{gu ? "આજે" : "Today"}</p>
          {todayEvents.length ? (
            <ul className="mt-1 space-y-1">
              {todayEvents.slice(0, 3).map((event) => (
                <li key={event.id} className="text-sm text-navy">
                  <span className="font-medium">{event.name}</span>
                  <span className="text-ink/70">
                    {event.startTime ? ` · ${event.startTime}` : ""}
                    {event.location ? ` · ${event.location}` : ""}
                    {event.hours ? ` · ${event.hours} ${gu ? "કલાક" : "hours"}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink/70">{gu ? "આજે કોઈ કાર્યક્રમ નથી." : "No programme today."}</p>
          )}
        </div>
        <div className="border-t border-navy/10 px-4 py-3 sm:border-t-0 sm:border-l">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-saffron">{gu ? "પછીનો કાર્યક્રમ" : "Next programme"}</p>
          {next ? (
            <p className="mt-1 text-sm text-navy">
              <span className="font-medium">{next.name}</span>
              <span className="text-ink/70">
                {` · ${formatLongDate(String(next.date || "").slice(0, 10))}`}
                {daysBetween(clock.iso, next.date.slice(0, 10)) === 1
                  ? gu
                    ? " · આવતીકાલે"
                    : " · tomorrow"
                  : ` · ${daysBetween(clock.iso, next.date.slice(0, 10))} ${gu ? "દિવસ" : "days"}`}
                {next.location ? ` · ${next.location}` : ""}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink/70">{gu ? "આગળનો કાર્યક્રમ નક્કી નથી." : "No programme is fixed yet."}</p>
          )}
        </div>
      </div>
    </section>
  );
}
