import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Cake, Star, Users } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { PhotoCarousel } from "@/components/nss/photo-carousel";
import { shouldShowSplash, SplashScreen } from "@/components/nss/splash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, todayIso } from "@/lib/nss/format";
import { activeVolunteers, alumniVolunteers, bestVolunteer, totalServiceHours, useNssStore, volunteerHours } from "@/lib/nss/store";

export const Route = createFileRoute("/")({ component: Home });

function initials(name: string) {
  return name
    .split(" ")
    .filter((part) => part.length > 1 && !part.endsWith("."))
    .slice(-2)
    .map((part) => part[0])
    .join("");
}

function Home() {
  const [splashing, setSplashing] = useState(shouldShowSplash);
  const dismiss = useCallback(() => setSplashing(false), []);
  const events = useNssStore((s) => s.events) ?? [];
  const notices = useNssStore((s) => s.notices) ?? [];
  const gallery = useNssStore((s) => s.gallery) ?? [];
  const visitors = useNssStore((s) => s.visitors);
  const settings = useNssStore((s) => s.settings);
  const hours = useNssStore((s) => totalServiceHours(s));
  const volunteerCount = useNssStore((s) => activeVolunteers(s).length);
  const alumniCount = useNssStore((s) => Math.max(alumniVolunteers(s).length, s.settings.alumniCount));
  const bestId = useNssStore((s) => bestVolunteer(s)?.id ?? "");
  const bestName = useNssStore((s) => bestVolunteer(s)?.fullName ?? "");
  const bestUnit = useNssStore((s) => bestVolunteer(s)?.unit ?? "");
  const bestVid = useNssStore((s) => bestVolunteer(s)?.volunteerId ?? "");
  const bestHours = useNssStore((s) => {
    const v = bestVolunteer(s);
    return v ? volunteerHours(s, v.id) : 0;
  });
  const today = todayIso();
  const volunteers = useNssStore((s) => s.volunteers) ?? [];
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

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => {
          const status = event.status.toLowerCase();
          if (status === "completed" || status === "cancelled") return false;
          return event.date >= today;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, today],
  );
  const completed = useMemo(
    () =>
      events
        .filter((event) => !upcoming.some((row) => row.id === event.id))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6),
    [events, upcoming],
  );
  const latestNotices = useMemo(
    () => [...notices].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [notices],
  );

  return (
    <>
      {splashing ? <SplashScreen onDone={dismiss} /> : null}
      <AppShell current="home" compactHeader>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
          <section className="flex flex-wrap justify-center gap-2">
            <Button asChild className="h-11 bg-forest text-primary-foreground hover:bg-forest/90">
              <Link to="/register">Student registration</Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link to="/login" search={{ role: "volunteer" }}>
                Student login
              </Link>
            </Button>
            <Button asChild className="h-11 bg-navy text-paper hover:bg-navy-deep">
              <Link to="/login" search={{ role: "po" }}>
                Admin login
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link to="/verify" search={{ id: "" }}>Certificate verification</Link>
            </Button>
          </section>

          <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-card to-muted shadow-md">
            <div className="grid gap-5 p-4 md:grid-cols-[190px_1fr_190px] md:p-6 md:items-center">
              <HomeOfficer role="Programme Officer" name={settings.poName} quote={settings.poQuote} photo={settings.poPhoto} />
              <div className="order-first md:order-none">
                <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">Welcome to NSP</p><h1 className="font-display text-2xl font-bold text-navy md:text-3xl">NSS Smart Portal</h1></div><span className="rounded-full bg-forest/10 px-3 py-1.5 text-xs font-semibold text-forest">☁ Cloud Connected</span></div>
                <PhotoCarousel items={gallery} />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Volunteers" value={volunteerCount} /><MiniStat label="Portal visitors" value={visitors} /><MiniStat label="Alumni" value={alumniCount} /><MiniStat label="Service hours" value={hours} /></div>
              </div>
              <HomeOfficer role="Principal" name={settings.principalName} quote={settings.principalQuote} photo={settings.principalPhoto} />
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="border-t-4 border-t-danger shadow-md">
              <CardContent className="p-5">
                <h2 className="font-display text-xl text-navy">Latest news & notices</h2>
                <div className="feed-scroll mt-3 space-y-3">
                  {latestNotices.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No notices yet.</p>
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
            <Card className="border-t-4 border-t-forest shadow-md">
              <CardContent className="p-5">
                <h2 className="font-display text-xl text-navy">Upcoming activities</h2>
                <div className="feed-scroll mt-3 space-y-2">
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

          {bestId ? (
            <section className="mt-6">
              <Card className="border-saffron/40 shadow-md">
                <CardContent className="flex flex-wrap items-center gap-3 p-5">
                  <Star className="size-6 text-saffron" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-saffron">Best volunteer</p>
                    <p className="font-display text-lg text-navy">{bestName}</p>
                    <p className="text-sm text-muted-foreground">
                      {bestVid} · {bestUnit} · {bestHours} service hours
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
  return <div className="rounded-xl border border-border bg-card p-3 text-center"><p className="font-display text-xl font-bold text-navy">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}

function HomeOfficer({ role, name, quote, photo }: { role: string; name: string; quote: string; photo?: string }) {
  return <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-forest">{role}</p>{photo ? <img src={photo} alt={name} className="mx-auto mt-3 h-28 w-24 rounded-2xl object-cover" /> : <div className="mx-auto mt-3 flex h-28 w-24 items-center justify-center rounded-2xl bg-navy text-3xl text-paper">👤</div>}<p className="mt-3 text-sm font-semibold text-navy">{name}</p><p className="gu mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">“{quote}”</p></div>;
}

function OfficerCard({
  role,
  name,
  quote,
  photo,
  fallback,
  gujarati,
}: {
  role: string;
  name: string;
  quote: string;
  photo?: string;
  fallback: string;
  gujarati?: boolean;
}) {
  return (
    <Card className="shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="mx-auto h-36 w-28 shrink-0 overflow-hidden rounded-md border-4 border-navy/15 bg-navy sm:mx-0">
          {photo ? (
            <img src={photo} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-paper">{fallback}</div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-forest">{role}</p>
          <p className="font-display text-lg text-navy">{name}</p>
          <p className={`${gujarati ? "gu " : ""}mt-2 text-sm leading-relaxed text-muted-foreground`}>“{quote}”</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4 text-center md:p-5">
        <Icon className="mx-auto size-4 text-forest" />
        <p className="mt-2 font-display text-3xl tabular-nums text-navy">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
