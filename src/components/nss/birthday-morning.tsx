import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BIRTHDAY_TEMPLATE } from "@/lib/nss/constants";
import { birthdayCardFile, cachedBirthdayCard, shareReadyCards } from "@/lib/nss/birthday-card";
import { birthdayVideoFile } from "@/lib/nss/birthday-video";
import { isBirthdayOn, kolkataToday } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";
import { birthdayWish, groupsForGender } from "@/lib/nss/whatsapp";
import type { Volunteer } from "@/lib/nss/types";

function sentKey(today: string) {
  return `nsp-bday-sent:${today}`;
}

function readSent(today: string) {
  try {
    return new Set((localStorage.getItem(sentKey(today)) || "").split(",").filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

function markSent(today: string, id: string) {
  const next = readSent(today);
  next.add(id);
  localStorage.setItem(sentKey(today), [...next].join(","));
}

export function BirthdayMorning() {
  const volunteers = useNssStore((s) => s.volunteers);
  const settings = useNssStore((s) => s.settings);
  const { lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const today = kolkataToday();
  const people = useMemo(
    () => volunteers.filter((v) => v.status !== "alumni" && v.dob && isBirthdayOn(v.dob, today)),
    [volunteers, today],
  );
  const [preview, setPreview] = useState("");
  const [ready, setReady] = useState(false);
  const [making, setMaking] = useState(false);
  const [sent, setSent] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSent(readSent(today));
  }, [today]);

  useEffect(() => {
    if (settings.birthdayEnabled === false || !people.length) return;
    let stop = false;
    const college = settings.collegeName;
    void (async () => {
      for (const volunteer of people) {
        if (stop) return;
        await birthdayCardFile(volunteer, college);
      }
      if (stop) return;
      const file = cachedBirthdayCard(people[0], college);
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setReady(true);
    })();
    return () => {
      stop = true;
    };
  }, [people, settings.birthdayEnabled, settings.collegeName, today]);

  if (settings.birthdayEnabled === false || !people.length) return null;

  const girls = people.filter((v) => v.gender === "Female");
  const boys = people.filter((v) => v.gender === "Male");
  const open = people.filter((v) => v.gender !== "Female" && v.gender !== "Male");
  const packs = [
    girls.length ? { id: "girls", label: tr("Girls group", "છોકરીઓનો ગ્રુપ"), people: girls, gender: "Female" } : null,
    boys.length ? { id: "boys", label: tr("Boys group", "છોકરાઓનો ગ્રુપ"), people: boys, gender: "Male" } : null,
    open.length ? { id: "open", label: tr("Pick the group", "ગ્રુપ પસંદ કરો"), people: open, gender: "" } : null,
  ].filter((row): row is { id: string; label: string; people: Volunteer[]; gender: string } => Boolean(row));

  function sendVideos(pack: { id: string; people: Volunteer[]; gender: string }) {
    setMaking(true);
    const template = settings.birthdayTemplate || BIRTHDAY_TEMPLATE;
    const text = birthdayWish(pack.people.map((v) => v.fullName).join(", "), template);
    const group = pack.gender ? groupsForGender(settings, pack.gender)[0] : undefined;
    void (async () => {
      try {
        const files = [];
        for (const volunteer of pack.people.slice(0, 4)) {
          files.push(await birthdayVideoFile(volunteer, settings.collegeName));
        }
        const mode = await shareReadyCards(files, text, group?.url);
        if (mode === "cancelled") return;
        markSent(today, `video:${pack.id}`);
        setSent(readSent(today));
        toast.success(
          mode === "shared"
            ? tr("Music video is in the share sheet. Choose the group and press Send.", "સંગીત વીડિયો શેરમાં તૈયાર છે. ગ્રુપ પસંદ કરીને Send દબાવો.")
            : tr("Video saved and the group opened. Attach it, then send.", "વીડિયો સચવાયો અને ગ્રુપ ખુલ્યો. જોડીને મોકલો."),
        );
      } catch {
        toast.error(tr("Could not make the birthday video.", "જન્મદિવસનો વીડિયો બની શક્યો નહીં."));
      } finally {
        setMaking(false);
      }
    })();
  }

  function sendPack(pack: { id: string; people: Volunteer[]; gender: string }) {
    const files = pack.people.map((v) => cachedBirthdayCard(v, settings.collegeName)).filter((file): file is File => Boolean(file));
    if (!files.length || files.length !== pack.people.length) {
      toast.message(tr("The card is still being drawn. Tap again in a moment.", "કાર્ડ હજી બની રહ્યું છે. થોડી વારે ફરી દબાવો."));
      return;
    }
    const template = settings.birthdayTemplate || BIRTHDAY_TEMPLATE;
    const text = birthdayWish(pack.people.map((v) => v.fullName).join(", "), template);
    const group = pack.gender ? groupsForGender(settings, pack.gender)[0] : undefined;
    void shareReadyCards(files, text, group?.url).then((mode) => {
      if (mode === "cancelled") return;
      markSent(today, pack.id);
      setSent(readSent(today));
      toast.success(
        mode === "shared"
          ? tr("Card is ready in the share sheet. Choose this WhatsApp group and send.", "કાર્ડ શેરમાં તૈયાર છે. આ ગ્રુપ પસંદ કરીને મોકલો.")
          : tr("Message copied and the group opened. Attach the saved card, then send.", "સંદેશ નકલ થયો અને ગ્રુપ ખુલ્યો. સાચવેલો કાર્ડ જોડીને મોકલો."),
      );
    });
  }

  return (
    <section className="mb-6 overflow-hidden border border-saffron/40 bg-[#fff6ea]">
      <div className="grid gap-4 p-4 md:grid-cols-[160px_1fr] md:items-center">
        {preview ? (
          <img src={preview} alt="" className="mx-auto h-52 w-auto border border-saffron/30 object-cover" />
        ) : (
          <div className="mx-auto h-52 w-36 animate-pulse bg-saffron/15" />
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron">{tr("Today’s birthday", "આજનો જન્મદિવસ")}</p>
          <h2 className="mt-1 font-display text-2xl text-navy">{people.map((v) => v.fullName).join(", ")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {tr(
              "The photo card, with cake and balloons, is prepared every morning. One tap opens the matching WhatsApp group. WhatsApp still needs you to press Send.",
              "ફોટો કાર્ડ, કેક અને ફુગ્ગા સાથે, દર સવારે તૈયાર થાય છે. એક વાર દબાવો એટલે યોગ્ય વોટ્સએપ ગ્રુપ ખુલે. મોકલવા માટે WhatsAppમાં Send દબાવવું પડે.",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                className="h-10 bg-navy px-4 text-sm font-medium text-paper disabled:opacity-50"
                disabled={!ready || making}
                onClick={() => sendPack(pack)}
              >
                {sent.has(pack.id)
                  ? `${tr("Send again to", "ફરી મોકલો")} ${pack.label}`
                  : `${tr("Send to", "મોકલો")} ${pack.label}`}
                {pack.people.length > 1 ? ` (${pack.people.length})` : ""}
              </button>
            ))}
            {packs.map((pack) => (
              <button
                key={`video-${pack.id}`}
                type="button"
                className="h-10 border border-navy bg-paper px-4 text-sm font-medium text-navy disabled:opacity-50"
                disabled={making}
                onClick={() => sendVideos(pack)}
              >
                {making
                  ? tr("Making the video…", "વીડિયો બની રહ્યો છે…")
                  : `${tr("Music video", "સંગીત વીડિયો")} · ${pack.label}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
