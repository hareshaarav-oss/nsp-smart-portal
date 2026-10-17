import { useNssStore } from "@/lib/nss/store";

export function SiteFooter() {
  const settings = useNssStore((s) => s.settings);

  return (
    <footer className="no-print mt-auto border-t border-navy bg-navy-deep px-4 py-6 text-center text-paper">
      <p className="font-display text-base tracking-wide">NSS Smart Portal</p>
      <p className="mt-1 text-sm text-paper/75">{settings.collegeName}</p>
      <p className="mt-1 text-xs text-paper/55">National Service Scheme · {settings.sloganEn}</p>
      <p className="mt-3 text-[11px] tracking-wide text-paper/45">Dr. Hareshkumar I. Prajapati · Assistant Professor</p>
    </footer>
  );
}
