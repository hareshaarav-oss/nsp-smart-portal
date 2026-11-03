import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Cake, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppSendPanel } from "@/components/nss/whatsapp-send";
import { BIRTHDAY_TEMPLATE } from "@/lib/nss/constants";
import { birthdayCardFile, cachedBirthdayCard, shareReadyCards } from "@/lib/nss/birthday-card";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, kolkataToday, parseDob } from "@/lib/nss/format";
import { useSessionStore } from "@/lib/nss/session";
import { birthdayWish, groupsForGender } from "@/lib/nss/whatsapp";
import { useNssStore } from "@/lib/nss/store";
import type { PortalSettings, Volunteer } from "@/lib/nss/types";

export const Route = createFileRoute("/po/birthdays")({ component: BirthdaysPage });

function BirthdaysPage() {
  const volunteers = useNssStore((s) => s.volunteers);
  const settings = useNssStore((s) => s.settings);
  const updateSettings = useNssStore((s) => s.updateSettings);
  const [template, setTemplate] = useState(settings.birthdayTemplate || BIRTHDAY_TEMPLATE);
  const [tab, setTab] = useState<"today" | "week" | "month" | "all">("today");
  const today = kolkataToday();

  const groups = useMemo(() => {
    const withDob = volunteers.filter((v) => parseDob(v.dob) && v.status !== "alumni");
    const todayList = withDob.filter((v) => isBirthdayOn(v.dob, today));
    const week = withDob
      .filter((v) => {
        const d = daysUntilBirthday(v.dob, today);
        return d >= 0 && d <= 7;
      })
      .sort((a, b) => daysUntilBirthday(a.dob, today) - daysUntilBirthday(b.dob, today));
    const month = withDob
      .filter((v) => parseDob(v.dob).slice(5, 7) === today.slice(5, 7))
      .sort((a, b) => parseDob(a.dob).slice(8).localeCompare(parseDob(b.dob).slice(8)));
    const all = [...withDob].sort((a, b) => daysUntilBirthday(a.dob, today) - daysUntilBirthday(b.dob, today));
    return { today: todayList, week, month, all };
  }, [volunteers, today]);

  const birthdayDisabled = settings.birthdayEnabled === false;
  const list = birthdayDisabled ? [] : groups[tab];

  return (
    <div className="space-y-6">
      {birthdayDisabled ? <Card><CardContent className="pt-5"><p className="font-medium">Birthday feature is disabled.</p></CardContent></Card> : null}
      <div>
        <h2 className="font-display text-xl font-semibold">Birthdays</h2>
        <p className="text-sm text-muted-foreground">
          Today’s photo card is ready at the top of this desk. Girls go to the girls group, boys to the boys group.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", `Today (${groups.today.length})`],
            ["week", `This week (${groups.week.length})`],
            ["month", `This month (${groups.month.length})`],
            ["all", `All (${groups.all.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                : "h-10 rounded-md bg-card px-3 text-sm ring-1 ring-border"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {list.length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">No birthdays in this list.</CardContent>
          </Card>
        ) : (
          list.map((v) => <BirthdayRow key={v.id} volunteer={v} today={today} template={template} settings={settings} />)
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Wish template</p>
        <Textarea className="gu min-h-48" value={template} onChange={(e) => { setTemplate(e.target.value); updateSettings({ birthdayTemplate: e.target.value }); }} />
      </div>

      <WhatsAppSendPanel
        title="Send birthday wishes on WhatsApp"
        recipients={list}
        message={template}
        personalize={(v, text) => birthdayWish(v.fullName, text)}
        showGroups={false}
      />
    </div>
  );
}

function BirthdayRow({
  volunteer: v,
  today,
  template,
  settings,
}: {
  volunteer: Volunteer;
  today: string;
  template: string;
  settings: PortalSettings;
}) {
  const days = daysUntilBirthday(v.dob, today);
  const isToday = days === 0;
  const text = birthdayWish(v.fullName, template);
  const [busy, setBusy] = useState(false);
  const group = v.gender === "Female" || v.gender === "Male" ? groupsForGender(settings, v.gender)[0] : undefined;

  useEffect(() => {
    if (!isToday) return;
    void birthdayCardFile(v, settings.collegeName);
  }, [isToday, v, settings.collegeName]);

  function wish() {
    const file = cachedBirthdayCard(v, settings.collegeName);
    if (!file) {
      setBusy(true);
      void birthdayCardFile(v, settings.collegeName)
        .then(() => toast.message("Card is ready. Tap Photo wish again."))
        .catch(() => toast.error("Could not make the birthday card."))
        .finally(() => setBusy(false));
      return;
    }
    void shareReadyCards([file], text, group?.url).then((mode) => {
      if (mode === "cancelled") return;
      toast.success(mode === "shared" ? "WhatsApp share opened with the photo card." : "Card saved and the WhatsApp group opened. Attach the image, then send.");
    });
  }

  return (
    <Card className={isToday ? "border-saffron/50" : undefined}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex items-start gap-3">
          {v.photoUrl ? (
            <img src={v.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <Cake className={isToday ? "size-5 text-saffron" : "size-5 text-muted-foreground"} />
          )}
          <div>
            <p className="font-display text-lg font-semibold">{v.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {v.volunteerId} · {v.unit} · {v.mobile} · {v.gender || "—"}
              {v.photoUrl ? " · photo ready" : " · no photo yet"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={wish}>
                <ImagePlus />
                {busy ? "Preparing…" : "Photo wish"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const role = useSessionStore.getState().session?.role === "admin" ? "admin" : "po";
                sessionStorage.setItem("nsp-wish", JSON.stringify({ thread: `dm:${role}:${v.volunteerId || v.id}`, text }));
                window.location.href = "/chat";
              }}>Wish in chat</Button>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatLongDate(v.dob)}</p>
          {isToday ? <Badge tone="saffron">Today</Badge> : <p className="text-xs text-muted-foreground">{days} days</p>}
        </div>
      </CardContent>
    </Card>
  );
}
