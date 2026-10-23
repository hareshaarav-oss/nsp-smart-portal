import { useEffect, useState, type ReactNode } from "react";
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
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_VISITOR_MARK)) return;
      sessionStorage.setItem(STORAGE_VISITOR_MARK, "1");
      void fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "visit" }),
      })
        .then((res) => res.json())
        .then((data: { visitors?: number }) => {
          if (typeof data.visitors === "number" && data.visitors > 0) {
            useNssStore.setState({ visitors: data.visitors });
          }
        })
        .catch(() => undefined);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="touch-ui flex min-h-dvh flex-col bg-bg text-foreground">
      {offline ? <div className="bg-[#111b21] px-4 py-1.5 text-center text-xs font-semibold text-white">Offline</div> : null}
      <BrandHeader eyebrow={eyebrow} compact={compactHeader} />
      <TricolourStrip />
      <PageNav showDashboard={showDashboard} current={current} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
