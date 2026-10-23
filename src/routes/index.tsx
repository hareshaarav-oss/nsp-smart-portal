import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Cake, Star } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { PhotoCarousel } from "@/components/nss/photo-carousel";
import { SplashScreen } from "@/components/nss/splash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button asChild className="h-12 bg-navy text-paper hover:bg-navy-deep">
              <Link to="/login" search={{ role: "volunteer" }}>{t("studentLogin")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/register">{t("register")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/login" search={{ role: "po" }}>{t("adminLogin")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/verify" search={{ id: "" }}>{t("verify")}</Link>
            </Button>
          </section>

          <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-saffron">Welcome to NSP</p>
                <h1 className="font-display text-2xl text-navy">NSS Smart Portal</h1>
                <p className="text-sm text-muted-foreground">{settings.collegeName}</p>
              </div>
              <span className="rounded-full bg-forest/10 px-3 py-1.5 text-xs font-semibold text-forest">Cloud connected</span>
            </div>
            <div className="grid lg:grid-cols-[1.3fr_0.85fr_0.85fr]">
              <div className="p-5 md:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-saffron">Notice</p>
                {latestNotices[0] ? (
                  <>
                    <h2 className="mt-2 font-display text-3xl text-navy">{latestNotices[0].title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{formatLongDate(latestNotices[0].date)}</p>
                    <p className="gu mt-3 text-sm leading-relaxed">{latestNotices[0].body}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{t("emptyNotice")}</p>
                )}
                <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
                  <MiniStat label="Volunteers" value={shownVolunteers} />
                  <MiniStat label="Service hours" value={hours} />
                  <MiniStat label="Alumni" value={alumniCount} />
                  <MiniStat label="Portal visitors" value={visitors} />
                </div>
              </div>
              <div className="border-t border-border p-5 lg:border-t-0 lg:border-l">
                <HomeOfficer role="Programme Officer" name={settings.poName} quote={settings.poQuote} photo={settings.poPhoto} />
              </div>
              <div className="border-t border-border p-5 lg:border-t-0 lg:border-l">
                <HomeOfficer role="Principal" name={settings.principalName} quote={settings.principalQuote} photo={settings.principalPhoto} />
              </div>
            </div>
            <div className="border-t border-border p-4"><PhotoCarousel items={collegeGallery} /></div>
          </section>

          {rollPhotos.length ? (
            <section className="mt-6">
              <Card className="shadow-md">
                <CardContent className="p-5">
                  <h2 className="font-display text-xl text-navy">Volunteer photographs</h2>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {rollPhotos.map((v) => (
                      <figure key={v.id} className="text-center">
                        <img src={v.photoUrl} alt="" className="mx-auto h-24 w-20 rounded-md object-cover ring-1 ring-border" />
                        <figcaption className="mt-1 text-[11px] leading-tight text-navy">
                          {v.fullName}
                          <span className="mt-0.5 block font-semibold text-forest">{volunteerHours(portal, v.id)} hrs</span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-xl text-navy">Latest news & notices</h2>
                <div className="mt-3 space-y-3">
                  {latestNotices.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t("emptyNotice")}</p>
                  ) : (
                    latestNotices.map((notice) => (
                      <article key={notice.id} className="rounded-md border border-border bg-bg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-medium text-navy">{notice.title}</h3>
                          <Badge tone={notice.audience === "all" ? "muted" : "navy"}>
                            {notice.audience === "all" ? formatLongDate(notice.date) : notice.audience}
                          </Badge>
                        </div>
                        <p className="gu mt-2 text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
                      </article>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-xl text-navy">Upcoming activities</h2>
                <div className="mt-3 space-y-2">
                  {upcoming.length === 0 && completed.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No upcoming event.</p>
                  ) : null}
                  {upcoming.map((event) => (
                    <div key={event.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2">
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
                    <div key={event.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2">
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
              </CardContent>
            </Card>
          </section>


          {settings.birthdayEnabled !== false && birthdayVolunteers.length ? (
            <section className="mt-6">
              <Card className="border-saffron/40 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2"><Cake className="size-5 text-saffron" /><h2 className="font-display text-xl text-navy">NSS Birthday Wishes</h2></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {birthdayVolunteers.map((v) => { const days = daysUntilBirthday(v.dob, today); return <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border p-3">{v.photoUrl ? <img src={v.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">🎂</div>}<div><p className="font-medium text-navy">{v.fullName}</p><p className="text-xs text-muted-foreground">{days === 0 ? "Today 🎉" : `${days} day${days === 1 ? "" : "s"} to go`}</p></div></div>; })}
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {bestId || liveBest ? (
            <section className="mt-6">
              <Card className="border-saffron/40 shadow-md">
                <CardContent className="flex flex-wrap items-center gap-3 p-5">
                  {bestPhoto && !showLiveBest ? <img src={bestPhoto} alt="" className="h-16 w-14 rounded-md object-cover" /> : <Star className="size-6 text-saffron" />}
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-saffron">Best volunteer</p>
                    <p className="font-display text-lg text-navy">{cardName}</p>
                    <p className="text-sm text-muted-foreground">
                      {cardVid} · {cardUnit} · {cardHours} service hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </section>
      </AppShell>
    </>
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
