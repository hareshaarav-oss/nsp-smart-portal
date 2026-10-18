export type NssHourKind = "camp" | "one-day" | "half-day" | "orientation";

export type NssHourRule = {
  hours: number;
  kind: NssHourKind;
  label: string;
  note: string;
};

function spanDays(date?: string, endDate?: string) {
  if (!date || !endDate || endDate <= date) return 1;
  const start = Date.parse(date);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Service hours fixed by the NSS manual: 120 regular hours a year, plus one 7-day special camp. */
export function nssHourRule(input: { name?: string; description?: string; date?: string; endDate?: string }): NssHourRule {
  const text = `${input.name ?? ""} ${input.description ?? ""}`.toLowerCase();
  const days = spanDays(input.date, input.endDate);
  const oneDayCamp = /one[\s-]?day camp|એક દિવસ/.test(text);
  const specialCamp = /special camp|nss camp|residential|શિબિર|વિશેષ શિબિર|seven[\s-]?day|7[\s-]?day/.test(text) || (!oneDayCamp && /\bcamp\b/.test(text)) || days >= 7;
  if (specialCamp && !oneDayCamp) {
    return {
      hours: 56,
      kind: "camp",
      label: "Special Camp",
      note: "NSS rule: a special camp is 7 days. Each day counts 8 service hours, so the camp is 56 hours.",
    };
  }
  if (/orientation|enrol|enroll|inauguration|પરિચય/.test(text)) {
    return {
      hours: 2,
      kind: "orientation",
      label: "Orientation",
      note: "One orientation session is 2 hours. The full orientation block for the year is 20 hours.",
    };
  }
  if (/parade|republic|independence|lecture|seminar|webinar|flag hoisting|પરેડ/.test(text)) {
    return {
      hours: 4,
      kind: "half-day",
      label: "Half-day activity",
      note: "A national-day parade, lecture or short awareness programme is 4 hours.",
    };
  }
  return {
    hours: 6,
    kind: "one-day",
    label: "One-day regular activity",
    note: "Plantation, blood donation, cleanliness, a rally or a village visit is a one-day regular activity of 6 hours.",
  };
}
