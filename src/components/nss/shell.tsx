import { useEffect, type ReactNode } from "react";
import { BrandHeader } from "./brand-header";
import { PageNav } from "./page-nav";
import { SiteFooter } from "./site-footer";
import { TricolourStrip } from "./tricolour";
import { STORAGE_VISITOR_MARK } from "@/lib/nss/constants";
import { useNssStore } from "@/lib/nss/store";

export function AppShell({
  children,
  eyebrow,
  current = "page",
  showDashboard = true,
  compactHeader = false,
}: {
  children: ReactNode;
  eyebrow?: string;
  current?: "home" | "dashboard" | "page";
  showDashboard?: boolean;
  compactHeader?: boolean;
}) {
  const bumpVisitor = useNssStore((s) => s.bumpVisitor);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(STORAGE_VISITOR_MARK)) {
        sessionStorage.setItem(STORAGE_VISITOR_MARK, "1");
        bumpVisitor();
      }
    } catch {
      /* ignore */
    }
  }, [bumpVisitor]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-foreground">
      <BrandHeader eyebrow={eyebrow} compact={compactHeader} />
      <TricolourStrip />
      <PageNav showDashboard={showDashboard} current={current} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
