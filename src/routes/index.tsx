import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/nss/shell";
import { shouldShowSplash, SplashScreen } from "@/components/nss/splash";
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
  const visitors = useNssStore((s) => s.visitors);
  const hours = useNssStore((s) => (s.attendance.length ? totalServiceHours(s) : Math.max(totalServiceHours(s), s.settings.reportedServiceHours ?? 0)));
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
  const attendance = useNssStore((s) => s.attendance) ?? [];
  const [rollQuery, setRollQuery] = useState("");
  const roll = useMemo(() => {
    const state = useNssStore.getState();
    const q = rollQuery.trim().toLowerCase();
    return volunteers
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
        <div className="px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4121a]">Welcome to Avyansh Tech</p>
          <h1 className="font-display text-3xl font-bold leading-tight text-[#161311]">NSS Smart Portal</h1>
          <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-lg bg-white shadow-sm">
            <MiniStat label="Roll" value={volunteerCount} />
            <MiniStat label="Hours" value={hours} />
            <MiniStat label="Alumni" value={alumniCount} />
            <MiniStat label="Visits" value={visitors} />
          </div>

          {latestNotices[0] ? (
            <article className="mt-3 overflow-hidden rounded-lg bg-white shadow-sm">
              <p className="bg-[#c4121a] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Lead notice</p>
              <div className="p-3">
                <h2 className="font-display text-2xl font-bold leading-tight">{latestNotices[0].title}</h2>
                <p className="mt-1 text-xs text-[#7a6d62]">{formatLongDate(latestNotices[0].date)}</p>
                {latestNotices[0].body ? <p className="gu mt-2 text-sm leading-relaxed">{latestNotices[0].body}</p> : null}
              </div>
            </article>
          ) : null}

          <section id="notices" className="mt-4">
            <h2 className="border-b-2 border-[#c4121a] pb-1 font-display text-xl font-bold">Notices</h2>
            <div className="mt-2 divide-y divide-[#eadfce] overflow-hidden rounded-lg bg-white shadow-sm">
              {latestNotices.slice(1).map((notice) => (
                <article key={notice.id} className="px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#c4121a]">{formatLongDate(notice.date)}</p>
                  <h3 className="mt-0.5 text-lg font-bold leading-snug">{notice.title}</h3>
                  {notice.body ? <p className="gu mt-1 line-clamp-3 text-sm leading-relaxed text-[#3d342c]">{notice.body}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="mt-4">
            <h2 className="border-b-2 border-[#c4121a] pb-1 font-display text-xl font-bold">Activities</h2>
            <div className="mt-2 space-y-2">
              {upcoming.map((event) => (
                <article key={event.id} className="rounded-lg bg-white px-3 py-3 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#c4121a]">Upcoming</p>
                  <h3 className="text-lg font-bold leading-snug">{event.name}</h3>
                  <p className="mt-1 text-xs text-[#7a6d62]">{formatLongDate(event.date)} · {event.location}</p>
                </article>
              ))}
              {completed.map((event) => (
                <article key={event.id} className="rounded-lg bg-white px-3 py-3 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#1f7a3a]">Done</p>
                  <h3 className="text-lg font-bold leading-snug">{event.name}</h3>
                  <p className="mt-1 text-xs text-[#7a6d62]">{formatLongDate(event.date)} · {event.location}</p>
                </article>
              ))}
            </div>
          </section>

          {birthdayVolunteers.length ? (
            <section className="mt-4">
              <h2 className="border-b-2 border-[#c4121a] pb-1 font-display text-xl font-bold">Birthdays</h2>
              <div className="mt-2 divide-y divide-[#eadfce] overflow-hidden rounded-lg bg-white shadow-sm">
                {birthdayVolunteers.map((v) => {
                  const days = daysUntilBirthday(v.dob, today);
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-3 py-2.5">
                      {v.photoUrl ? <img src={v.photoUrl} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="flex h-12 w-12 items-center justify-center bg-[#c4121a] text-xs font-bold text-white">{initials(v.fullName)}</div>}
                      <div className="min-w-0">
                        <p className="truncate font-bold">{v.fullName}</p>
                        <p className="text-xs text-[#7a6d62]">{days === 0 ? "Today" : `${days} days`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section id="roll" className="mt-4">
            <div className="flex items-end justify-between border-b-2 border-[#c4121a] pb-1">
              <h2 className="font-display text-xl font-bold">NSS Roll</h2>
              <span className="text-sm tabular-nums text-[#7a6d62]">{roll.length}</span>
            </div>
            <Input value={rollQuery} onChange={(e) => setRollQuery(e.target.value)} placeholder="Search name" className="mt-2 bg-white" />
            <div className="mt-2 divide-y divide-[#eadfce] overflow-hidden rounded-lg bg-white shadow-sm">
              {roll.map((v) => (
                <div key={v.volunteerId || v.id} className="flex items-center gap-3 px-3 py-2.5">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt="" className="h-14 w-12 rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-12 items-center justify-center bg-[#1a2744] text-[11px] font-bold text-white">{initials(v.fullName) || "NSS"}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold leading-tight">{v.fullName}</p>
                    <p className="truncate text-xs text-[#7a6d62]">{v.volunteerId} · {v.course} {v.semester}</p>
                  </div>
                  <p className="font-display text-xl font-bold tabular-nums text-[#c4121a]">{v.hours}</p>
                </div>
              ))}
            </div>
          </section>

          {bestId ? (
            <p className="mt-4 text-sm"><span className="font-bold text-[#c4121a]">Best volunteer · </span>{bestName} · {bestVid} · {bestHours} hours{bestUnit ? ` · ${bestUnit}` : ""}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2 pb-2 text-sm font-bold">
            <Link to="/register" className="rounded-lg bg-[#c4121a] px-3 py-3 text-center text-white">Register</Link>
            <Link to="/login" className="rounded-lg bg-[#1a2744] px-3 py-3 text-center text-white">Sign in</Link>
          </div>
        </div>
      </AppShell>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-1 py-2.5 text-center">
      <p className="font-display text-xl font-bold tabular-nums text-[#c4121a]">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7a6d62]">{label}</p>
    </div>
  );
}

