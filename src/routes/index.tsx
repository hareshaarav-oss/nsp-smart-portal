import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/nss/shell";
import { PhotoCarousel } from "@/components/nss/photo-carousel";
import { SevaChakra } from "@/components/nss/seva-chakra";
import { SplashScreen } from "@/components/nss/splash";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SETTINGS } from "@/lib/nss/constants";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, todayIso } from "@/lib/nss/format";
import { ensurePublicGallery } from "@/lib/nss/public-gallery";
import { activeVolunteers, alumniVolunteers, liveServiceHours, useNssStore, volunteerHours } from "@/lib/nss/store";
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
  const today = todayIso();
  const volunteerSource = useNssStore((s) => s.volunteers);
  const volunteers = useMemo(() => volunteerSource ?? [], [volunteerSource]);
  const rollCards = useMemo(
    () =>
      volunteers
        .filter((v) => v.status !== "alumni" && v.fullName)
        .slice()
        .sort((a, b) => {
          const photo = Number(Boolean(b.photoUrl)) - Number(Boolean(a.photoUrl));
          if (photo) return photo;
          return a.fullName.localeCompare(b.fullName, "en");
        }),
    [volunteers],
  );
  const attendance = useNssStore((s) => s.attendance);
  const featured = useMemo(() => {
    const state = useNssStore.getState();
    const people = volunteers.filter((v) => v.status !== "alumni" && v.fullName);
    const photos = people.filter((v) => v.photoUrl);
    return (photos.length ? photos : people)
      .slice()
      .sort((a, b) => volunteerHours(state, b.id) - volunteerHours(state, a.id) || a.fullName.localeCompare(b.fullName, "en"));
  }, [volunteers, attendance]);
  const [spot, setSpot] = useState(0);
  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => setSpot((n) => n + 1), 10000);
    return () => window.clearInterval(timer);
  }, [featured.length]);
  const featuredPerson = featured.length ? featured[spot % featured.length] : undefined;
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

  const { t, lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const gallery = useNssStore((s) => s.gallery) ?? [];
  const slides = useMemo(
    () => gallery.filter((item) => item.src.startsWith("data:image/") && !SEED_IDS.has(item.id)).slice(0, 12),
    [gallery],
  );
  useEffect(() => {
    void ensurePublicGallery();
  }, []);
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

          <SevaChakra
            hours={hours}
            volunteers={shownVolunteers}
            target={settings.serviceHourTarget || 120}
            camps={collegeEvents.length}
            gu={lang === "gu"}
          />

          {settings.showHomeGallery !== false && slides.length ? (
            <div className="mt-6">
              <PhotoCarousel items={slides} auto={settings.heroAutoPlay !== false} seconds={settings.heroIntervalSeconds || 5} />
            </div>
          ) : null}

          {settings.showHomeOfficers !== false ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <HomeOfficer role={tr("Programme Officer", "કાર્યક્રમ અધિકારી")} name={settings.poName || DEFAULT_SETTINGS.poName} photo={settings.poPhoto} quote={settings.poQuote?.trim() || DEFAULT_SETTINGS.poQuote} />
              <HomeOfficer role={tr("Principal", "આચાર્ય")} name={settings.principalName || DEFAULT_SETTINGS.principalName} photo={settings.principalPhoto} quote={settings.principalQuote?.trim() || DEFAULT_SETTINGS.principalQuote} />
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {settings.showHomeNotices !== false ? (
              <RunBanner
                label={tr("Notice", "નોટિસ")}
                items={latestNotices.map((notice) => {
                  const body = notice.body.replace(/\s+/g, " ").trim();
                  return body ? `${notice.title} — ${body}` : notice.title;
                })}
                empty={t("emptyNotice")}
              />
            ) : null}

            {settings.showHomeEvents !== false ? (
              <RunBanner
                label={tr("Upcoming", "આગામી")}
                items={upcoming.map((event) => {
                  const when = `${formatLongDate(event.date)}${event.endDate && event.endDate !== event.date ? ` – ${formatLongDate(event.endDate)}` : ""}`;
                  const place = event.location ? ` · ${event.location}` : "";
                  const note = event.description ? ` — ${event.description.replace(/\s+/g, " ").trim()}` : "";
                  return `${event.name} · ${when}${place}${note}`;
                })}
                empty={tr("No upcoming event.", "આગામી કાર્યક્રમ નથી.")}
              />
            ) : null}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <MiniStat label={tr("Volunteers", "સ્વયંસેવકો")} value={shownVolunteers} />
            <MiniStat label={tr("Service hours", "સેવા કલાક")} value={hours} />
            <MiniStat label={tr("Alumni", "ભૂતપૂર્વ")} value={alumniCount} />
            <MiniStat label={tr("Portal visitors", "મુલાકાતીઓ")} value={visitors} />
          </div>

          <OpenTab id="volunteers" title={tr("Volunteers", "સ્વયંસેવકો")}>
            {rollCards.length ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {rollCards.map((v) => (
                  <figure key={v.id} className="press text-center">
                    {v.photoUrl ? (
                      <img src={v.photoUrl} alt="" className="mx-auto h-24 w-20 object-cover ring-1 ring-saffron/40" />
                    ) : (
                      <span className="mx-auto flex h-24 w-20 items-center justify-center bg-navy text-lg font-semibold text-paper">{v.fullName.slice(0, 1)}</span>
                    )}
                    <figcaption className="mt-1 text-[11px] leading-tight text-navy">
                      {v.fullName}
                      <span className="mt-0.5 block font-semibold text-forest">{v.volunteerId}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{tr("No volunteers yet.", "હજી સ્વયંસેવક નથી.")}</p>
            )}
          </OpenTab>

          {completed.length ? (
            <OpenTab id="activities" title={tr("Completed programmes", "પૂર્ણ કાર્યક્રમ")}>
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
                    <Badge tone="forest">{tr("Completed", "પૂર્ણ")}</Badge>
                  </div>
                ))}
              </div>
            </OpenTab>
          ) : null}

          {settings.birthdayEnabled !== false ? (
            <OpenTab id="birthdays" title={tr("NSS Birthday Wishes", "જન્મદિવસની શુભેચ્છા")}>
              {birthdayVolunteers.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {birthdayVolunteers.map((v) => {
                    const days = daysUntilBirthday(v.dob, today);
                    return (
                      <div key={v.id} className="flex items-center gap-3 border border-saffron/30 p-3">
                        {v.photoUrl ? <img src={v.photoUrl} alt="" className="h-12 w-12 object-cover" /> : <div className="h-12 w-12 bg-muted" />}
                        <div>
                          <p className="font-medium text-navy">{v.fullName}</p>
                          <p className="text-xs text-muted-foreground">{days === 0 ? tr("Today", "આજે") : tr(`${days} day${days === 1 ? "" : "s"} to go`, `${days} દિવસ બાકી`)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{tr("No birthday this week.", "આ અઠવાડિયે જન્મદિવસ નથી.")}</p>
              )}
            </OpenTab>
          ) : null}

          <OpenTab id="best" title={tr("Best volunteer", "શ્રેષ્ઠ સ્વયંસેવક")}>
            {featuredPerson ? (
              <div className="flex items-center gap-4">
                {featuredPerson.photoUrl ? (
                  <img src={featuredPerson.photoUrl} alt="" className="h-24 w-20 object-cover ring-1 ring-saffron/40" />
                ) : (
                  <span className="flex h-24 w-20 items-center justify-center bg-navy text-lg font-semibold text-paper">{featuredPerson.fullName.slice(0, 1)}</span>
                )}
                <div>
                  <p className="font-display text-lg text-navy">{featuredPerson.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {featuredPerson.volunteerId} · {featuredPerson.unit} · {Math.max(volunteerHours(useNssStore.getState(), featuredPerson.id), liveBest && (liveBest.id === featuredPerson.id || liveBest.volunteerId === featuredPerson.volunteerId) ? liveBest.hours : 0)} {tr("service hours", "સેવા કલાક")}
                  </p>
                  {featured.length > 1 ? <p className="mt-1 text-xs text-saffron">{tr("Changes every 10 seconds", "દર 10 સેકન્ડે બદલાય")}</p> : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{tr("Not marked yet.", "હજી નોંધાયું નથી.")}</p>
            )}
          </OpenTab>
        </section>
      </AppShell>
    </>
  );
}

function HomeOfficer({ role, name, photo, quote }: { role: string; name: string; photo?: string; quote: string }) {
  return (
    <article className="border border-navy/15 bg-card p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron">{role}</p>
      {photo ? (
        <img src={photo} alt="" className="mx-auto mt-3 h-28 w-24 object-cover ring-1 ring-saffron/40" />
      ) : (
        <span className="mx-auto mt-3 flex h-28 w-24 items-center justify-center bg-navy text-2xl font-semibold text-paper">{name.slice(0, 1)}</span>
      )}
      <h2 className="mt-3 font-display text-xl text-navy">{name}</h2>
      <p className="gu mt-2 text-sm leading-relaxed text-muted-foreground">“{quote}”</p>
    </article>
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
