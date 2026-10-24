import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { SplashScreen } from "@/components/nss/splash";
import { Badge } from "@/components/ui/badge";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, todayIso } from "@/lib/nss/format";
import { activeVolunteers, alumniVolunteers, bestVolunteer, liveServiceHours, useNssStore, volunteerHours } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/")({ component: Home });

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

function Home() {
  const [splashing, setSplashing] = useState(true);
  const dismiss = useCallback(() => setSplashing(false), []);
  const events = useNssStore((s) => s.events) ?? [];
  const notices = useNssStore((s) => s.notices) ?? [];
  const visitors = useNssStore((s) => s.visitors);
  const settings = useNssStore((s) => s.settings);
  const hours = useNssStore((s) => liveServiceHours(s));
  const volunteerCount = useNssStore((s) => activeVolunteers(s).length);
  const liveVolunteerCount = useNssStore((s) => s.liveVolunteerCount ?? 0);
  const shownVolunteers = Math.max(volunteerCount, liveVolunteerCount);
  const alumniCount = useNssStore((s) => Math.max(alumniVolunteers(s).length, s.settings.alumniCount));
  const liveBest = useNssStore((s) => s.liveBest);
  const bestId = useNssStore((s) => bestVolunteer(s)?.id ?? "");
  const bestName = useNssStore((s) => bestVolunteer(s)?.fullName ?? "");
  const bestUnit = useNssStore((s) => bestVolunteer(s)?.unit ?? "");
  const bestVid = useNssStore((s) => bestVolunteer(s)?.volunteerId ?? "");
  const bestPhoto = useNssStore((s) => bestVolunteer(s)?.photoUrl ?? "");
  const bestHours = useNssStore((s) => {
    const v = bestVolunteer(s);
    return v ? volunteerHours(s, v.id) : 0;
  });
  const showLiveBest = Boolean(liveBest && liveBest.hours > bestHours);
  const cardName = showLiveBest && liveBest ? liveBest.fullName : bestName;
  const cardUnit = showLiveBest && liveBest ? liveBest.unit : bestUnit;
  const cardVid = showLiveBest && liveBest ? liveBest.volunteerId : bestVid;
  const cardHours = showLiveBest && liveBest ? liveBest.hours : bestHours;
  const today = todayIso();
  const volunteerSource = useNssStore((s) => s.volunteers);
  const volunteers = useMemo(() => volunteerSource ?? [], [volunteerSource]);
  const portal = useNssStore();
  const rollPhotos = useMemo(
    () => volunteers.filter((v) => v.status !== "alumni" && v.photoUrl),
    [volunteers],
  );
  const birthdayVolunteers = useMemo(
    () =>
      volunteers
        .filter(
          (v) =>
            v.status !== "alumni" &&
            Boolean(v.dob) &&
            (isBirthdayOn(v.dob, today) ||
              daysUntilBirthday(v.dob, today) <= 7),
        )
        .sort(
          (a, b) =>
            daysUntilBirthday(a.dob, today) -
            daysUntilBirthday(b.dob, today),
        )
        .slice(0, 6),
    [volunteers, today],
  );

  const { t } = useUi();
  const collegeReady = shownVolunteers > 0;
  const collegeEvents = collegeReady ? events.filter((event) => !SEED_IDS.has(event.id)) : events;
  const collegeNotices = collegeReady ? notices.filter((notice) => !SEED_IDS.has(notice.id)) : notices;
  const upcoming = useMemo(
    () =>
      collegeEvents
        .filter((event) => {
          const status = event.status.toLowerCase();
          if (status === "completed" || status === "cancelled") return false;
          return event.date >= today;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [collegeEvents, today],
  );
  const completed = useMemo(
    () =>
      collegeEvents
        .filter((event) => !upcoming.some((row) => row.id === event.id))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6),
    [collegeEvents, upcoming],
  );
  const latestNotices = useMemo(
    () =>
      [...collegeNotices]
        .filter((notice) => !notice.audience || notice.audience === "all")
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [collegeNotices],
  );

  return (
    <>
      {splashing ? <SplashScreen onDone={dismiss} /> : null}
      <AppShell current="home" compactHeader>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 md:px-6">
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 border-y border-navy/15 py-4 text-sm text-navy">
            <Link to="/login" search={{ role: "volunteer" }} className="underline-offset-4 hover:underline">{t("studentLogin")}</Link>
            <Link to="/register" className="underline-offset-4 hover:underline">{t("register")}</Link>
            <Link to="/login" search={{ role: "po" }} className="underline-offset-4 hover:underline">{t("adminLogin")}</Link>
            <Link to="/verify" search={{ id: "" }} className="underline-offset-4 hover:underline">{t("verify")}</Link>
          </nav>

          <div className="mt-6 space-y-3">
            {settings.showHomeNotices !== false ? (
              <RunBanner
                label="Notice"
                items={latestNotices.map((notice) => {
                  const body = notice.body.replace(/\s+/g, " ").trim();
                  return body ? `${notice.title} — ${body}` : notice.title;
                })}
                empty={t("emptyNotice")}
              />
            ) : null}

            {settings.showHomeEvents !== false ? (
              <RunBanner
                label="Upcoming"
                items={upcoming.map((event) => {
                  const when = `${formatLongDate(event.date)}${event.endDate && event.endDate !== event.date ? ` – ${formatLongDate(event.endDate)}` : ""}`;
                  const place = event.location ? ` · ${event.location}` : "";
                  const note = event.description ? ` — ${event.description.replace(/\s+/g, " ").trim()}` : "";
                  return `${event.name} · ${when}${place}${note}`;
                })}
                empty="No upcoming event."
              />
            ) : null}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <MiniStat label="Volunteers" value={shownVolunteers} />
            <MiniStat label="Service hours" value={hours} />
            <MiniStat label="Alumni" value={alumniCount} />
            <MiniStat label="Portal visitors" value={visitors} />
          </div>

          <OpenTab id="volunteers" title="Volunteers">
            {rollPhotos.length ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {rollPhotos.map((v) => (
                  <figure key={v.id} className="press text-center">
                    <img src={v.photoUrl} alt="" className="mx-auto h-24 w-20 object-cover ring-1 ring-saffron/40" />
                    <figcaption className="mt-1 text-[11px] leading-tight text-navy">
                      {v.fullName}
                      <span className="mt-0.5 block font-semibold text-forest">{volunteerHours(portal, v.id)} hrs</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photographs yet.</p>
            )}
          </OpenTab>

          {completed.length ? (
            <OpenTab id="activities" title="Completed programmes">
              <div className="divide-y divide-saffron/20">
                {completed.map((event) => (
                  <div key={event.id} className="press flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-navy">{event.name}</p>
                      {event.description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        {formatLongDate(event.date)}{event.endDate && event.endDate !== event.date ? ` – ${formatLongDate(event.endDate)}` : ""} · {event.location}
                      </p>
                    </div>
                    <Badge tone="forest">Completed</Badge>
                  </div>
                ))}
              </div>
            </OpenTab>
          ) : null}

          {settings.birthdayEnabled !== false ? (
            <OpenTab id="birthdays" title="NSS Birthday Wishes">
              {birthdayVolunteers.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {birthdayVolunteers.map((v) => {
                    const days = daysUntilBirthday(v.dob, today);
                    return (
                      <div key={v.id} className="flex items-center gap-3 border border-saffron/30 p-3">
                        {v.photoUrl ? <img src={v.photoUrl} alt="" className="h-12 w-12 object-cover" /> : <div className="h-12 w-12 bg-muted" />}
                        <div>
                          <p className="font-medium text-navy">{v.fullName}</p>
                          <p className="text-xs text-muted-foreground">{days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} to go`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No birthday this week.</p>
              )}
            </OpenTab>
          ) : null}

          <OpenTab id="best" title="Best volunteer">
            {bestId || liveBest ? (
              <div className="flex flex-wrap items-center gap-3">
                {bestPhoto && !showLiveBest ? <img src={bestPhoto} alt="" className="h-16 w-14 object-cover" /> : <Star className="size-6 text-saffron" />}
                <div>
                  <p className="font-display text-lg text-navy">{cardName}</p>
                  <p className="text-sm text-muted-foreground">{cardVid} · {cardUnit} · {cardHours} service hours</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not marked yet.</p>
            )}
          </OpenTab>
        </section>
      </AppShell>
    </>
  );
}

function OpenTab({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-28">
      <h2 className="font-display text-2xl text-navy md:text-3xl">{title}</h2>
      <span className="mt-3 block h-px w-12 bg-saffron" />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="bg-card px-3 py-3 text-center"><p className="font-display text-2xl text-navy">{value}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p></div>;
}

function RunBanner({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  if (items.length === 0) {
    return (
      <div className="flex items-stretch overflow-hidden border-y border-navy/15">
        <p className="flex shrink-0 items-center bg-navy px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e6d3a3]">{label}</p>
        <p className="px-4 py-2.5 text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }
  const unit = items.join("      ·      ").trim();
  const copies = unit.length >= 160 ? 1 : Math.ceil(160 / Math.max(unit.length, 1));
  const line = Array.from({ length: copies }, () => unit).join("      ·      ");
  const seconds = Math.max(22, Math.round(line.length / 4.2));
  return (
    <div className="run-banner flex items-stretch overflow-hidden border-y border-navy/15" role="region" aria-label={label}>
      <p className="flex shrink-0 items-center bg-navy px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e6d3a3]">{label}</p>
      <div className="min-w-0 flex-1 overflow-hidden py-2.5">
        <div className="run-banner-track" style={{ animationDuration: `${seconds}s` }}>
          <span className="gu px-8 text-sm text-navy">{line}</span>
          <span className="gu px-8 text-sm text-navy" aria-hidden="true">{line}</span>
        </div>
      </div>
    </div>
  );
}
