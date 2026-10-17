import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Cake, Star } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { PhotoCarousel } from "@/components/nss/photo-carousel";
import { shouldShowSplash, SplashScreen } from "@/components/nss/splash";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const hours = useNssStore((s) => Math.max(totalServiceHours(s), s.settings.reportedServiceHours ?? 0));
  const volunteerCount = useNssStore((s) => {
    const live = activeVolunteers(s);
    const seeded = live.length > 0 && live.length <= 30 && live.every((v) => v.id.startsWith("vol-"));
    if (!seeded && live.length >= 20) return live.length;
    return Math.max(seeded ? 0 : live.length, s.settings.publishedVolunteerCount ?? 66);
  });
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
  const attendance = useNssStore((s) => s.attendance) ?? [];
  const [rollQuery, setRollQuery] = useState("");
  const roll = useMemo(() => {
    const state = useNssStore.getState();
    const seeded =
      volunteers.length > 0 &&
      volunteers.length <= 30 &&
      volunteers.every((v) => v.id.startsWith("vol-"));
    const q = rollQuery.trim().toLowerCase();
    return (seeded ? [] : volunteers)
      .filter((v) => v.status !== "alumni" && v.fullName)
      .filter((v) => {
        if (!q) return true;
        return `${v.fullName} ${v.volunteerId} ${v.enrollment} ${v.course} ${v.semester} ${v.unit}`
          .toLowerCase()
          .includes(q);
      })
      .map((v) => ({ ...v, hours: volunteerHours(state, v.id) }))
      .sort(
        (a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "") ||
          a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" }),
      );
  }, [volunteers, attendance, events, rollQuery]);
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
    () =>
      [...notices]
        .filter((notice) => !notice.audience || notice.audience === "all")
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [notices],
  );

  return (
    <>
      {splashing ? <SplashScreen onDone={dismiss} /> : null}
      <AppShell current="home" compactHeader>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Link to="/register" className="rounded-xl bg-forest px-3 py-3 text-center text-sm font-semibold text-paper">Registration</Link>
            <Link to="/login" search={{ role: "volunteer" }} className="rounded-xl border border-border bg-card px-3 py-3 text-center text-sm font-semibold text-navy">Student</Link>
            <Link to="/chat" className="rounded-xl border border-border bg-card px-3 py-3 text-center text-sm font-semibold text-navy">Chat</Link>
            <Link to="/login" search={{ role: "po" }} className="rounded-xl bg-navy px-3 py-3 text-center text-sm font-semibold text-paper">Admin</Link>
            <Link to="/verify" search={{ id: "" }} className="col-span-2 rounded-xl border border-border bg-card px-3 py-3 text-center text-sm font-semibold text-navy sm:col-span-1">Verify</Link>
          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr_180px] md:items-center md:p-5">
              <HomeOfficer role="Programme Officer" name={settings.poName} quote={settings.poQuote} photo={settings.poPhoto} />
              <div className="order-first md:order-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">S.D. Arts & Shah B.R. Commerce College</p>
                <p className="mt-1 text-sm font-semibold text-forest">{settings.sloganGu}</p>
                <h1 className="font-display text-3xl font-semibold text-navy">NSS Smart Portal</h1>
                <div className="mt-4"><PhotoCarousel items={gallery} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat label="Volunteers" value={volunteerCount} />
                  <MiniStat label="Visitors" value={visitors} />
                  <MiniStat label="Alumni" value={alumniCount} />
                  <MiniStat label="Hours" value={hours} />
                </div>
              </div>
              <HomeOfficer role="Principal" name={settings.principalName} quote={settings.principalQuote} photo={settings.principalPhoto} />
            </div>
          </section>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg text-navy">Roll</h2>
                  <span className="text-sm tabular-nums text-muted-foreground">{roll.length}</span>
                </div>
                <Input value={rollQuery} onChange={(e) => setRollQuery(e.target.value)} placeholder="Search" className="mt-3" />
                <div className="mt-3 max-h-[32rem] space-y-1.5 overflow-y-auto">
                  {roll.length === 0 ? (
                    <p className="rounded-lg bg-muted/70 px-3 py-3 text-sm text-muted-foreground">
                      કોલેજ NSS યાદી રજિસ્ટર પર સુરક્ષિત છે ({volunteerCount} volunteers). થોડી વારમાં અહીં નામ દેખાશે.
                    </p>
                  ) : null}
                  {roll.map((v) => (
                    <div key={v.volunteerId || v.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/70">
                      {v.photoUrl ? (
                        <img src={v.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-paper">{initials(v.fullName) || "NSS"}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy">{v.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{v.volunteerId} · {v.course} {v.semester} · {v.unit}</p>
                      </div>
                      <p className="font-display text-lg tabular-nums text-forest">{v.hours}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-display text-lg text-navy">Notices</h2>
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                    {latestNotices.map((notice) => (
                      <article key={notice.id} className="rounded-lg border border-border px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-medium text-navy">{notice.title}</h3>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{formatLongDate(notice.date)}</span>
                        </div>
                        {notice.body ? <p className="gu mt-1 text-sm leading-relaxed text-muted-foreground">{notice.body}</p> : null}
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2"><Cake className="size-4 text-saffron" /><h2 className="font-display text-lg text-navy">Birthdays</h2></div>
                  <div className="mt-3 space-y-2">
                    {birthdayVolunteers.map((v) => {
                      const days = daysUntilBirthday(v.dob, today);
                      return (
                        <div key={v.id} className="flex items-center gap-3">
                          {v.photoUrl ? <img src={v.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-paper">{initials(v.fullName)}</div>}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-navy">{v.fullName}</p>
                            <p className="text-xs text-muted-foreground">{days === 0 ? "Today" : `${days}d`}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              {bestId ? (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Star className="size-5 text-saffron" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-saffron">Best volunteer</p>
                      <p className="truncate font-medium text-navy">{bestName}</p>
                      <p className="text-xs text-muted-foreground">{bestVid} · {bestHours} hours</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <Card className="mt-4">
            <CardContent className="p-4">
              <h2 className="font-display text-lg text-navy">Activities</h2>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {upcoming.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-navy">{event.name}</p>
                      <Badge tone="saffron">Upcoming</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatLongDate(event.date)} · {event.location}</p>
                  </div>
                ))}
                {completed.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-navy">{event.name}</p>
                      <Badge tone="forest">Done</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatLongDate(event.date)} · {event.location}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </AppShell>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-navy">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function HomeOfficer({ role, name, quote, photo }: { role: string; name: string; quote: string; photo?: string }) {
  return (
    <div className="rounded-xl bg-bg p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-forest">{role}</p>
      {photo ? <img src={photo} alt={name} className="mx-auto mt-2 h-24 w-20 rounded-lg object-cover" /> : <div className="mx-auto mt-2 flex h-24 w-20 items-center justify-center rounded-lg bg-navy text-sm font-semibold text-paper">{initials(name) || "NSS"}</div>}
      <p className="mt-2 text-sm font-semibold text-navy">{name}</p>
      {quote ? <p className="gu mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">“{quote}”</p> : null}
    </div>
  );
}

