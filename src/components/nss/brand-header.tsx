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
    <header className="no-print border-b border-border bg-surface">
      <div className={cn("mx-auto max-w-6xl px-4 md:px-6", compact ? "py-3" : "py-3 md:py-4")}>
        <div className="flex items-center gap-3 md:gap-5">
          <img
            src={collegeLogo}
            alt="College emblem"
            className={cn(
              "object-contain mix-blend-multiply",
              compact ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-[5.5rem] md:w-[5.5rem]",
            )}
          />
          <div className="min-w-0 flex-1 text-center">
            <p
              className={cn(
                "text-balance font-display font-semibold leading-tight text-navy",
                compact ? "text-sm md:text-base" : "text-base md:text-xl",
              )}
            >
              {settings.collegeShort || settings.collegeName}
            </p>
            <p
              className={cn(
                "mt-0.5 uppercase tracking-[0.18em] text-forest",
                compact ? "text-[10px] md:text-xs" : "text-xs md:text-sm",
              )}
            >
              {eyebrow ?? "Mansa · National Service Scheme"}
            </p>
          </div>
          <img
            src={nssLogo}
            alt="NSS emblem"
            className={cn(
              "object-contain mix-blend-multiply",
              compact ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-[5.5rem] md:w-[5.5rem]",
            )}
          />
        </div>
      </div>
    </header>
  );
}
