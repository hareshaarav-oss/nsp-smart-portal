const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseDob(raw: string | undefined | null) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const dmy = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const dmyShort = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2})$/);
  if (dmyShort) {
    const year = Number(dmyShort[3]) > 30 ? `19${dmyShort[3]}` : `20${dmyShort[3]}`;
    return `${year}-${dmyShort[2].padStart(2, "0")}-${dmyShort[1].padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

export function byFullName(a: { fullName: string }, b: { fullName: string }) {
  return a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" });
}

export function cleanPersonName(fullName: string) {
  return String(fullName ?? "")
    .replace(/\+?91[\s-]*/g, " ")
    .replace(/\d{6,}/g, " ")
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** First name in CAPITAL letters — MAHI Sharadkumar Patel */
export function titleFirstName(fullName: string) {
  const parts = cleanPersonName(fullName)
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  parts[0] = parts[0].toLocaleUpperCase("en-IN");
  return parts.join(" ");
}

export function firstNameOf(fullName: string) {
  const first = cleanPersonName(fullName).split(/\s+/).filter(Boolean)[0] || "";
  return first.toLocaleUpperCase("en-IN");
}

export function certDisplayName(fullName: string) {
  const parts = cleanPersonName(fullName).split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const rest = parts.slice(1).map((part) => {
    if (/^[A-Z]\.?$/i.test(part)) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  });
  return [parts[0].toLocaleUpperCase("en-IN"), ...rest].join(" ");
}

export function idCardName(fullName: string) {
  return cleanPersonName(fullName).toLocaleUpperCase("en-IN");
}

export function formatLongDate(iso: string) {
  const value = parseDob(iso) || iso;
  if (!value) return "—";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatShortDate(iso: string) {
  const value = parseDob(iso) || iso;
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function todayIso() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthDay(iso: string) {
  const value = parseDob(iso) || iso;
  const parts = value.split("-");
  return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : "";
}

export function isBirthdayOn(isoDob: string, onIso: string) {
  const a = monthDay(isoDob);
  const b = monthDay(onIso);
  return Boolean(a && b && a === b);
}

export function nextBirthdayDate(isoDob: string, fromIso = todayIso()) {
  const dob = parseDob(isoDob);
  const [, mm, dd] = dob.split("-");
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  if (!mm || !dd || !fy) return dob || isoDob;
  const stamp = `${String(fm).padStart(2, "0")}${String(fd).padStart(2, "0")}`;
  const target = `${mm}${dd}`;
  const year = stamp > target ? fy + 1 : fy;
  return `${year}-${mm}-${dd}`;
}

export function daysUntilBirthday(isoDob: string, fromIso = todayIso()) {
  const next = nextBirthdayDate(isoDob, fromIso);
  const a = new Date(`${fromIso}T00:00:00`);
  const b = new Date(`${next}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 999;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function padId(n: number) {
  return String(n).padStart(3, "0");
}

const GUJARATI_DIGITS = "૦૧૨૩૪૫૬૭૮૯";

export function latinDigits(value: string) {
  return String(value ?? "").replace(/[૦-૯]/g, (ch) => {
    const i = GUJARATI_DIGITS.indexOf(ch);
    return i >= 0 ? String(i) : ch;
  });
}

export function academicYear(iso = todayIso()) {
  const [y, m] = iso.split("-").map(Number);
  const start = (m ?? 1) >= 6 ? y : y - 1;
  const startYear = Math.max(start, 2026);
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function waPhone(mobile: string) {
  const d = digitsOnly(mobile);
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}
