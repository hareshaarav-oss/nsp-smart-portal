import { annualEntries, datedEntries, daysBetween, type SamayNote } from "./samay";

export type DashakDay = {
  iso: string;
  en: string;
  gu: string;
  tone: SamayNote["tone"];
  kind: "annual" | "dated";
  days: number;
};

/** Same civil month and day, `years` ahead. Lunar dates are not guessed. */
export function addYears(iso: string, years: number) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y + years, m - 1, d));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** Fixed NSS and national days from `fromIso` through the same date ten years later, plus dated notes that already exist. */
export function decadeDays(fromIso: string, years = 10): DashakDay[] {
  const end = addYears(fromIso, years);
  const startYear = Number(fromIso.slice(0, 4));
  const endYear = Number(end.slice(0, 4));
  const out: DashakDay[] = [];
  if (!startYear || !endYear) return out;
  for (let year = startYear; year <= endYear; year += 1) {
    for (const row of annualEntries()) {
      const iso = `${year}-${row.monthDay}`;
      if (iso < fromIso || iso > end) continue;
      out.push({
        iso,
        en: row.note.en,
        gu: row.note.gu,
        tone: row.note.tone,
        kind: "annual",
        days: daysBetween(fromIso, iso),
      });
    }
  }
  for (const row of datedEntries()) {
    if (row.iso < fromIso || row.iso > end) continue;
    out.push({
      iso: row.iso,
      en: row.note.en,
      gu: row.note.gu,
      tone: row.note.tone,
      kind: "dated",
      days: daysBetween(fromIso, row.iso),
    });
  }
  out.sort((a, b) => a.iso.localeCompare(b.iso) || a.en.localeCompare(b.en, "en"));
  return out;
}

export function yearsIn(days: DashakDay[]) {
  const years: number[] = [];
  for (const day of days) {
    const year = Number(day.iso.slice(0, 4));
    if (!years.includes(year)) years.push(year);
  }
  return years;
}
