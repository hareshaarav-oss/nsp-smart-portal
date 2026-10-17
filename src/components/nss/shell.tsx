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
    <div className="min-h-dvh bg-bg text-foreground lg:pl-60">
      <PageNav showDashboard={showDashboard} current={current} />
      <div className="flex min-h-dvh flex-col">
        <div className="lg:hidden">
          <BrandHeader eyebrow={eyebrow} compact />
          <TricolourStrip />
        </div>
        <div className="no-print hidden items-center justify-between border-b border-border bg-surface px-8 py-3 lg:flex">
          <p className={compactHeader ? "text-xs font-semibold text-navy" : "text-sm font-semibold text-navy"}>{eyebrow ?? "NSS Smart Portal"}</p>
        </div>
        <main className="mx-auto min-w-0 w-full max-w-3xl flex-1 pb-20 md:max-w-5xl md:pb-0 lg:max-w-6xl">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
