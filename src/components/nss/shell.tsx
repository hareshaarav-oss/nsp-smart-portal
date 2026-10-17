import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { PageNav } from "./page-nav";
import { STORAGE_VISITOR_MARK } from "@/lib/nss/constants";
import { formatLongDate, todayIso } from "@/lib/nss/format";
import { dashboardPath, useSessionStore } from "@/lib/nss/session";
import { useNssStore } from "@/lib/nss/store";

export function AppShell({
  children,
  current = "page",
}: {
  children: ReactNode;
  eyebrow?: string;
  current?: "home" | "dashboard" | "page";
  showDashboard?: boolean;
  compactHeader?: boolean;
}) {
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const dash = dashboardPath(session);

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
    <div className="min-h-dvh bg-[#f3efe6] text-[#161311]">
      <header className="sticky top-0 z-40 bg-[#c4121a] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-display text-[1.7rem] font-bold leading-none tracking-tight">NSP</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/80">{formatLongDate(todayIso())}</p>
          </div>
          {session ? (
            <button
              type="button"
              className="shrink-0 text-xs font-semibold"
              onClick={() => {
                setSession(null);
                window.location.href = "/";
              }}
            >
              {session.name.split(" ")[0]} · Out
            </button>
          ) : (
            <Link to="/login" className="shrink-0 text-xs font-semibold">
              Sign in
            </Link>
          )}
        </div>
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-3 pb-2 text-xs font-semibold">
          <Link to="/" className="rounded-full bg-white px-3 py-1 text-[#c4121a]">Home</Link>
          <Link to="/" hash="roll" className="rounded-full bg-white/15 px-3 py-1">Roll</Link>
          <Link to="/" hash="notices" className="rounded-full bg-white/15 px-3 py-1">Notices</Link>
          {session ? (
            <Link to="/chat" className="rounded-full bg-white/15 px-3 py-1">Chat</Link>
          ) : (
            <Link to="/login" className="rounded-full bg-white/15 px-3 py-1">Chat</Link>
          )}
          {session ? (
            <Link to={dash} className="rounded-full bg-white/15 px-3 py-1">My desk</Link>
          ) : (
            <Link to="/login" className="rounded-full bg-white/15 px-3 py-1">My desk</Link>
          )}
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-3xl flex-1 pb-20">{children}</main>
      <PageNav current={current} />
    </div>
  );
}