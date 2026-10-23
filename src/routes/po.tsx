import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/nss/shell";
import { PoNav } from "@/components/nss/po-nav";
import { isOfficer, useSessionStore } from "@/lib/nss/session";

export const Route = createFileRoute("/po")({
  component: PoLayout,
});

function PoLayout() {
  const session = useSessionStore((s) => s.session);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!session) return <Navigate to="/login" search={{ role: "po" }} />;
  if (!isOfficer(session)) return <Navigate to="/volunteer" />;

  return (
    <AppShell current="dashboard" compactHeader>
      <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">Programme Officer</p>
        <h1 className="font-display text-2xl text-navy">{session.name}</h1>
        <PoNav current={pathname === "/po/" ? "/po" : pathname} />
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
