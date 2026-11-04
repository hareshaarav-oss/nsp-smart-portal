export type SamayEvent = {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  location?: string;
  hours?: number;
  status?: string;
  startTime?: string;
};

export type SamayNote = {
  en: string;
  gu: string;
  tone: "festival" | "nation" | "nss";
};

const WEEK_GU: Record<string, string> = {
  Sunday: "રવિવાર",
  Monday: "સોમવાર",
  Tuesday: "મંગળવાર",
  Wednesday: "બુધવાર",
  Thursday: "ગુરુવાર",
  Friday: "શુક્રવાર",
  Saturday: "શનિવાર",
};

/** Civil dates the unit already keeps. Month-day repeats every year. */
const ANNUAL: Record<string, SamayNote> = {
  "01-12": { en: "National Youth Day", gu: "રાષ્ટ્રીય યુવા દિવસ", tone: "nation" },
  "01-26": { en: "Republic Day", gu: "પ્રજાસત્તાક દિવસ", tone: "nation" },
  "04-14": { en: "Ambedkar Jayanti", gu: "આંબેડકર જયંતી", tone: "nation" },
  "06-05": { en: "World Environment Day", gu: "વિશ્વ પર્યાવરણ દિવસ", tone: "nss" },
  "06-21": { en: "International Yoga Day", gu: "આંતરરાષ્ટ્રીય યોગ દિવસ", tone: "nss" },
  "08-15": { en: "Independence Day", gu: "સ્વતંત્રતા દિવસ", tone: "nation" },
  "09-05": { en: "Teachers' Day", gu: "શિક્ષક દિવસ", tone: "nss" },
  "09-24": { en: "NSS Day", gu: "એનએસએસ દિવસ", tone: "nss" },
  "10-02": { en: "Gandhi Jayanti", gu: "ગાંધી જયંતી", tone: "nation" },
};

/**
 * Gujarat 2026 Diwali days.
 * Bestu Varas is 10 November because Kartik Sud 1 is the tithi at sunrise that morning
 * (pratipada begins the previous afternoon). Labh Pancham follows five mornings later.
 */
const DATED: Record<string, SamayNote> = {
  "2026-11-05": { en: "Vagh Baras", gu: "વઘ બારસ", tone: "festival" },
  "2026-11-06": { en: "Dhanteras", gu: "ધનતેરસ", tone: "festival" },
  "2026-11-07": { en: "Kali Chaudas", gu: "કાળી ચૌદશ", tone: "festival" },
  "2026-11-08": { en: "Diwali", gu: "દીવાળી", tone: "festival" },
  "2026-11-10": { en: "Bestu Varas", gu: "બેસતું વર્ષ", tone: "festival" },
  "2026-11-11": { en: "Bhai Bij", gu: "ભાઈ બીજ", tone: "festival" },
  "2026-11-14": { en: "Labh Pancham", gu: "લાભ પાંચમ", tone: "festival" },
};

export function kolkataClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "long",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number(read("hour"));
  const minute = read("minute");
  return {
    iso: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number.isFinite(hour) ? hour : 0,
    minute,
    weekdayEn: read("weekday"),
    weekdayGu: WEEK_GU[read("weekday")] || read("weekday"),
    clock: `${read("hour")}:${minute}`,
  };
}

export function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return { en: "Good morning", gu: "સુપ્રભાત" };
  if (hour >= 12 && hour < 16) return { en: "Good afternoon", gu: "શુભ બપોર" };
  if (hour >= 16 && hour < 20) return { en: "Good evening", gu: "શુભ સાંજ" };
  return { en: "Good night", gu: "શુભ રાત્રિ" };
}

export function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 999;
  return Math.round((to - from) / 86400000);
}

export function noteOn(iso: string): SamayNote | null {
  return DATED[iso] || ANNUAL[iso.slice(5)] || null;
}

export function nextNote(iso: string, within = 7): { note: SamayNote; iso: string; days: number } | null {
  const year = Number(iso.slice(0, 4));
  if (!year) return null;
  const candidates: { note: SamayNote; iso: string }[] = [];
  for (const [day, note] of Object.entries(DATED)) candidates.push({ note, iso: day });
  for (const [monthDay, note] of Object.entries(ANNUAL)) {
    const thisYear = `${year}-${monthDay}`;
    candidates.push({ note, iso: thisYear >= iso ? thisYear : `${year + 1}-${monthDay}` });
  }
  let best: { note: SamayNote; iso: string; days: number } | null = null;
  for (const item of candidates) {
    const days = daysBetween(iso, item.iso);
    if (days < 1 || days > within) continue;
    if (!best || days < best.days) best = { ...item, days };
  }
  return best;
}

function eventStart(event: SamayEvent) {
  return (event.date || "").slice(0, 10);
}

function eventEnd(event: SamayEvent) {
  return (event.endDate || event.date || "").slice(0, 10);
}

export function programmesOn(events: SamayEvent[], iso: string) {
  return events
    .filter((event) => {
      if ((event.status || "").toLowerCase() === "cancelled") return false;
      const start = eventStart(event);
      const end = eventEnd(event);
      return Boolean(start) && start <= iso && iso <= end;
    })
    .sort((a, b) => eventStart(a).localeCompare(eventStart(b)) || a.name.localeCompare(b.name, "en"));
}

export function nextProgramme(events: SamayEvent[], iso: string) {
  return events
    .filter((event) => (event.status || "").toLowerCase() !== "cancelled" && eventStart(event) > iso)
    .sort((a, b) => eventStart(a).localeCompare(eventStart(b)) || a.name.localeCompare(b.name, "en"))[0];
}
