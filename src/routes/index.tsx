import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { PhotoCarousel } from "@/components/nss/photo-carousel";
import { SplashScreen } from "@/components/nss/splash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const gallery = useNssStore((s) => s.gallery) ?? [];
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
  const collegeReady = shownVolunteers >= 20;
  const collegeEvents = collegeReady ? events.filter((event) => !SEED_IDS.has(event.id)) : events;
  const collegeNotices = collegeReady ? notices.filter((notice) => !SEED_IDS.has(notice.id)) : notices;
  const collegeGallery = collegeReady ? gallery.filter((item) => !SEED_IDS.has(item.id)) : gallery;
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
          <header className="border border-saffron/50 bg-card px-5 py-7 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-saffron">Welcome to NSP</p>
            <h1 className="mt-2 font-display text-3xl text-navy md:text-4xl">NSS Smart Portal</h1>
            <span className="mx-auto mt-3 block h-px w-20 bg-saffron" />
            <p className="mt-3 text-sm text-navy/80">{settings.collegeName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-forest">Cloud connected</p>
          </header>

          <div className="mt-4 grid grid-cols-2 border border-saffron/50 sm:grid-cols-4">
            <Button asChild className="h-12 rounded-none bg-navy text-paper hover:bg-navy-deep">
              <Link to="/login" search={{ role: "volunteer" }}>{t("studentLogin")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-none border-saffron/30">
              <Link to="/register">{t("register")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-none border-saffron/30">
              <Link to="/login" search={{ role: "po" }}>{t("adminLogin")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-none border-saffron/30">
              <Link to="/verify" search={{ id: "" }}>{t("verify")}</Link>
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap border border-saffron/50 bg-navy">
            {[
              ["#notice", "Notice"],
              ["#officers", "Officers"],
              ["#gallery", "Gallery"],
              ["#volunteers", "Volunteers"],
              ["#news", "Notices"],
              ["#activities", "Activities"],
              ["#birthdays", "Birthdays"],
              ["#best", "Best"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper hover:bg-saffron hover:text-navy">
                {label}
              </a>
            ))}
          </div>

          <OpenTab id="notice" title="Notice">
            {latestNotices[0] ? (
              <>
                <h2 className="font-display text-3xl text-navy">{latestNotices[0].title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{formatLongDate(latestNotices[0].date)}</p>
                <p className="gu mt-3 text-sm leading-relaxed">{latestNotices[0].body}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("emptyNotice")}</p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-saffron/40 bg-saffron/40 sm:grid-cols-4">
              <MiniStat label="Volunteers" value={shownVolunteers} />
              <MiniStat label="Service hours" value={hours} />
              <MiniStat label="Alumni" value={alumniCount} />
              <MiniStat label="Portal visitors" value={visitors} />
            </div>
          </OpenTab>

          <OpenTab id="officers" title="Officers">
            <div className="grid gap-6 sm:grid-cols-2">
              <HomeOfficer role="Programme Officer" name={settings.poName} quote={settings.poQuote} photo={settings.poPhoto} />
              <HomeOfficer role="Principal" name={settings.principalName} quote={settings.principalQuote} photo={settings.principalPhoto} />
            </div>
          </OpenTab>

          <OpenTab id="gallery" title="Gallery">
            <PhotoCarousel items={collegeGallery} />
          </OpenTab>

          <OpenTab id="volunteers" title="Volunteer photographs">
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

          <OpenTab id="news" title="Latest news & notices">
            {latestNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("emptyNotice")}</p>
            ) : (
              <div className="space-y-3">
                {latestNotices.map((notice) => (
                  <article key={notice.id} className="press border border-saffron/30 bg-bg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-navy">{notice.title}</h3>
                      <Badge tone={notice.audience === "all" ? "muted" : "navy"}>
                        {notice.audience === "all" ? formatLongDate(notice.date) : notice.audience}
                      </Badge>
                    </div>
                    <p className="gu mt-2 text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
                  </article>
                ))}
              </div>
            )}
          </OpenTab>

          <OpenTab id="activities" title="Upcoming activities">
            {upcoming.length === 0 && completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming event.</p>
            ) : null}
            <div className="space-y-2">
              {upcoming.map((event) => (
                <div key={event.id} className="press flex items-start justify-between gap-3 border border-saffron/30 bg-bg px-3 py-2">
                  <div>
                    <p className="font-medium text-navy">{event.name}</p>
                    {event.description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      {formatLongDate(event.date)}{event.endDate && event.endDate !== event.date ? ` – ${formatLongDate(event.endDate)}` : ""} · {event.location}
                    </p>
                  </div>
                  <Badge tone="saffron">Upcoming</Badge>
                </div>
              ))}
              {completed.map((event) => (
                <div key={event.id} className="press flex items-start justify-between gap-3 border border-saffron/30 bg-bg px-3 py-2">
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
    <section id={id} className="mt-6 scroll-mt-28">
      <h2 className="inline-block border border-b-0 border-saffron/60 bg-navy px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">
        {title}
      </h2>
      <div className="border border-saffron/60 bg-card p-4 md:p-5">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="bg-card px-3 py-3 text-center"><p className="font-display text-2xl text-navy">{value}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p></div>;
}

function HomeOfficer({ role, name, quote, photo }: { role: string; name: string; quote: string; photo?: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">{role}</p>
      {photo ? <img src={photo} alt={name} className="mx-auto mt-3 h-28 w-24 rounded-2xl object-cover" /> : <div className="mx-auto mt-3 h-28 w-24 rounded-2xl bg-muted" />}
      <p className="mt-3 text-sm font-semibold text-navy">{name}</p>
      {quote ? <p className="gu mt-2 text-xs leading-relaxed text-muted-foreground">“{quote}”</p> : null}
    </div>
  );
}
