import { useNssStore } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

function tomorrowKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
  const next = new Date(Date.UTC(parts[0] || 2026, (parts[1] || 1) - 1, (parts[2] || 1) + 1));
  return next.toISOString().slice(0, 10);
}

export function TomorrowBanner() {
  const events = useNssStore((s) => s.events) ?? [];
  const { t } = useUi();
  const day = tomorrowKey();
  const soon = events.filter((event) => (event.date || "").slice(0, 10) === day);
  if (!soon.length) return null;
  return (
    <div className="mb-4 rounded-xl border border-saffron/40 bg-saffron/10 px-4 py-3 text-sm">
      <p className="font-semibold">{t("tomorrow")}</p>
      {soon.map((event) => (
        <p key={event.id}>{event.name}{event.location ? ` · ${event.location}` : ""}{event.hours ? ` · ${event.hours} hours` : ""}</p>
      ))}
    </div>
  );
}
