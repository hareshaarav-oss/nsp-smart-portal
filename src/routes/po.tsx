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
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-2">
          <p className="text-xs tracking-[0.16em] text-muted-foreground">PROGRAMME OFFICER</p>
          <h1 className="font-display text-2xl font-semibold">{session.name}</h1>
        </div>
        <PoNav current={pathname === "/po/" ? "/po" : pathname} />
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
