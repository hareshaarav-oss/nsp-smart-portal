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
      <div className="mx-auto w-full max-w-6xl px-3 py-4 pb-6 sm:px-4 md:px-6 md:py-5">
        <p className="font-display text-xl text-navy">{session.name}</p>
        <PoNav current={pathname === "/po/" ? "/po" : pathname} />
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
