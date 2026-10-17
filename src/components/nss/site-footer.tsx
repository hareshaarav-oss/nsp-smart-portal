import { useNssStore } from "@/lib/nss/store";

export function SiteFooter() {
  const settings = useNssStore((s) => s.settings);

  return (
    <footer className="no-print mt-auto hidden border-t border-border bg-surface px-4 py-5 text-center md:block">
      <p className="font-display text-sm text-navy">NSS Smart Portal</p>
      <p className="mt-1 text-xs text-muted-foreground">{settings.collegeName}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Dr. Hareshkumar I. Prajapati · Avyansh Tech</p>
    </footer>
  );
}
