import { useNssStore } from "@/lib/nss/store";

export function SiteFooter() {
  const settings = useNssStore((s) => s.settings);

  return (
    <footer className="no-print mt-auto border-t border-border bg-navy px-4 py-6 text-center text-paper">
      <p className="font-display text-base">{settings.collegeShort || settings.collegeName}</p>
      <p className="mt-1 text-xs tracking-[0.14em] text-paper/70">NSS SMART PORTAL</p>
      <p className="mt-3 text-[11px] text-paper/50">Dr. Hareshkumar I. Prajapati</p>
    </footer>
  );
}
