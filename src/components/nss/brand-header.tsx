import { COLLEGE_LOGO, NSS_LOGO } from "@/lib/nss/constants";
import { useNssStore } from "@/lib/nss/store";
import { cn } from "@/lib/utils";

export function BrandHeader({
  eyebrow,
  compact = false,
}: {
  eyebrow?: string;
  compact?: boolean;
}) {
  const settings = useNssStore((s) => s.settings);
  const collegeLogo = settings.collegeLogo || COLLEGE_LOGO;
  const nssLogo = settings.nssLogo || NSS_LOGO;
  return (
    <header className="no-print bg-surface">
      <div className="h-px bg-saffron" />
      <div className={cn("mx-auto max-w-6xl px-4 md:px-6", compact ? "py-3" : "py-4 md:py-5")}>
        <div className="flex items-center gap-4 md:gap-8">
          <img
            src={collegeLogo}
            alt="College emblem"
            className={cn(
              "object-contain",
              compact ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-20 md:w-20",
            )}
          />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-saffron">NSS Smart Portal</p>
            <p
              className={cn(
                "mt-1 text-balance font-display font-semibold leading-tight text-navy",
                compact ? "text-base md:text-lg" : "text-lg md:text-2xl",
              )}
            >
              {settings.collegeShort || settings.collegeName}
            </p>
            <span className="mx-auto mt-2 block h-px w-24 bg-saffron" />
            <p
              className={cn(
                "mt-2 uppercase tracking-[0.22em] text-navy/70",
                compact ? "text-[10px]" : "text-[11px] md:text-xs",
              )}
            >
              {eyebrow ?? "National Service Scheme"}
            </p>
          </div>
          <img
            src={nssLogo}
            alt="NSS emblem"
            className={cn(
              "object-contain",
              compact ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-20 md:w-20",
            )}
          />
        </div>
      </div>
    </header>
  );
}
