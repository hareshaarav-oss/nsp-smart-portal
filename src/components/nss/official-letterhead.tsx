import { COLLEGE_LOGO, NSS_LOGO } from "@/lib/nss/constants";
import { academicYear, formatLongDate, todayIso } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";
import { TricolourStrip } from "@/components/nss/tricolour";
import { cn } from "@/lib/utils";

export function OfficialLetterhead({
  title,
  compact = false,
  className,
}: {
  title?: string;
  compact?: boolean;
  className?: string;
}) {
  const college = useNssStore((s) => s.settings.collegeShort) || "S.D. Arts & Shah B.R. Commerce College";
  const collegeLogo = useNssStore((s) => s.settings.collegeLogo) || COLLEGE_LOGO;
  const nssLogo = useNssStore((s) => s.settings.nssLogo) || NSS_LOGO;
  return (
    <div className={cn("border border-saffron/50 bg-surface px-4 py-5 text-navy", className)}>
      <div className="flex items-center gap-4 md:gap-6">
        <img
          src={collegeLogo}
          alt="College logo"
          className={cn("object-contain", compact ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20")}
        />
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-saffron">NSS Smart Portal</p>
          <p className={cn("mt-1 font-display font-semibold leading-tight", compact ? "text-sm md:text-base" : "text-base md:text-xl")}>
            {college}
          </p>
          <span className="mx-auto mt-2 block h-px w-16 bg-saffron" />
          {title ? <p className="mt-2 font-display text-base md:text-lg">{title}</p> : null}
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {formatLongDate(todayIso())} · {academicYear()}
          </p>
        </div>
        <img
          src={nssLogo}
          alt="NSS logo"
          className={cn("object-contain", compact ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20")}
        />
      </div>
      <TricolourStrip className="mt-4" />
    </div>
  );
}

export function ReportPreview({
  title,
  headers,
  rows,
  intro,
  maxRows = 8,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  intro?: string[];
  maxRows?: number;
}) {
  const shown = rows.slice(0, maxRows);
  return (
    <div className="overflow-hidden border border-saffron/40 bg-surface">
      <OfficialLetterhead title={title} compact className="rounded-none border-0 shadow-none" />
      {intro?.length ? (
        <div className="space-y-2 border-t border-border px-4 py-3 text-sm leading-relaxed text-navy">
          {intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
      {headers.length ? (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-navy text-paper">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((c, j) => (
                    <td key={j} className="px-2 py-1.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {rows.length > maxRows ? (
        <p className="px-4 py-2 text-[11px] text-muted-foreground">
          Showing {maxRows} of {rows.length} rows. Full list on Excel / Print PDF.
        </p>
      ) : null}
    </div>
  );
}
