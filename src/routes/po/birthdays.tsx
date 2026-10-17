import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cake, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppGroupButtons, WhatsAppSendPanel } from "@/components/nss/whatsapp-send";
import { BIRTHDAY_TEMPLATE } from "@/lib/nss/constants";
import { sendBirthdayWish } from "@/lib/nss/birthday-card";
import { daysUntilBirthday, formatLongDate, isBirthdayOn, parseDob, todayIso } from "@/lib/nss/format";
import { birthdayWish } from "@/lib/nss/whatsapp";
import { useNssStore } from "@/lib/nss/store";
import type { PortalSettings, Volunteer } from "@/lib/nss/types";

export const Route = createFileRoute("/po/birthdays")({ component: BirthdaysPage });

function BirthdaysPage() {
  const volunteers = useNssStore((s) => s.volunteers);
  const settings = useNssStore((s) => s.settings);
  const updateSettings = useNssStore((s) => s.updateSettings);
  const [template, setTemplate] = useState(settings.birthdayTemplate || BIRTHDAY_TEMPLATE);
  const [tab, setTab] = useState<"today" | "week" | "month" | "all">("today");
  const today = todayIso();

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
  const [sending, setSending] = useState(false);

  async function wishAllToday() {
    const people = groups.today;
    if (!people.length || sending) return;
    setSending(true);
    try {
      for (const volunteer of people) {
        await sendBirthdayWish(volunteer, settings, template);
      }
      toast.success("Birthday card opened in WhatsApp. Choose the group and send.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Could not open the birthday card.");
    } finally {
      setSending(false);
    }
  }
  const list = birthdayDisabled ? [] : groups[tab];
  const girlsToday = groups.today.filter((v) => v.gender === "Female");
  const boysToday = groups.today.filter((v) => v.gender === "Male");
  const girlsMsg =
    girlsToday.length > 0
      ? birthdayWish(girlsToday.map((v) => v.fullName).join(", "), template)
      : "";
  const boysMsg =
    boysToday.length > 0
      ? birthdayWish(boysToday.map((v) => v.fullName).join(", "), template)
      : "";

  return (
    <div className="space-y-6">
      {birthdayDisabled ? <Card><CardContent className="pt-5"><p className="font-medium">Birthday feature is disabled.</p><p className="mt-1 text-sm text-muted-foreground">Enable it from Settings → Birthday.</p></CardContent></Card> : null}
      <div>
        <h2 className="font-display text-xl font-semibold">Birthdays</h2>
        <p className="text-sm text-muted-foreground">
          Names and dates so the NSS family can send a wish the same morning. Girls wishes go to the girls
          group, boys to the boys group.
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

      {groups.today.length > 0 ? (
        <Card className="border-saffron/40">
          <CardContent className="space-y-3 pt-5">
            <p className="font-medium">Today’s photo wishes</p>
            <p className="text-sm text-muted-foreground">
              Each card uses the student’s uploaded photo. WhatsApp opens with the image and the wish. Pick the girls or boys group and send.
            </p>
            <Button className="bg-[#128C7E] text-white hover:bg-[#0f766e]" disabled={sending} onClick={() => void wishAllToday()}>
              <ImagePlus />
              {sending ? "Opening WhatsApp…" : "Send photo wishes"}
            </Button>
            {girlsToday.length ? (
              <WhatsAppGroupButtons text={girlsMsg} audience="girls" />
            ) : null}
            {boysToday.length ? (
              <WhatsAppGroupButtons text={boysMsg} audience="boys" />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
        <p className="text-xs text-muted-foreground">{"{{NAME}} is replaced with the volunteer’s name."}</p>
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

  async function wish() {
    setBusy(true);
    try {
      const mode = await sendBirthdayWish(v, settings, template);
      toast.success(mode === "shared" ? "WhatsApp opened with the photo card." : "Card saved and the WhatsApp group opened. Attach the image, then send.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Could not make the birthday card.");
    } finally {
      setBusy(false);
    }
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
              <Button size="sm" className="bg-[#128C7E] text-white hover:bg-[#0f766e]" disabled={busy} onClick={() => void wish()}>
                <ImagePlus />
                {busy ? "Preparing…" : "Photo wish"}
              </Button>
              {isToday ? <WhatsAppGroupButtons text={text} gender={v.gender} /> : null}
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
