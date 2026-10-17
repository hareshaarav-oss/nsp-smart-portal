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
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_VISITOR_MARK)) return;
      void fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "visit" }),
      })
        .then((res) => res.json())
        .then((data: { ok?: boolean; visitors?: number }) => {
          if (data.ok && typeof data.visitors === "number" && data.visitors > 0) {
            sessionStorage.setItem(STORAGE_VISITOR_MARK, "1");
            useNssStore.setState({ visitors: data.visitors });
          }
        })
        .catch(() => undefined);
    } catch {
      /* ignore */
    }
  }, []);

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
