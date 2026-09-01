import { useNssStore } from "@/lib/nss/store";

export function SiteFooter() {
  const settings = useNssStore((s) => s.settings);

  return (
    <footer className="no-print mt-auto border-t border-border bg-navy-deep px-4 py-8 text-center text-paper">
      <p className="font-display text-lg">Welcome to Avyansh Tech</p>
      <p className="mt-1 text-sm text-paper/80">{settings.collegeName}</p>
      <p className="mt-1 text-sm text-paper/70">
        National Service Scheme · “{settings.sloganEn}” / {settings.sloganGu}
      </p>
      <p className="mt-4 text-xs text-paper/50">Created by Dr. Hareshkumar I. Prajapati · Assistant Professor</p>
    </footer>
  );
}
