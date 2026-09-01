import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { dashboardPath, isOfficer, useSessionStore } from "@/lib/nss/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageNav({
  showDashboard = true,
  current = "page",
}: {
  showDashboard?: boolean;
  current?: "home" | "dashboard" | "page";
}) {
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const dash = dashboardPath(session);
  const officer = isOfficer(session);

  return (
    <nav className="bg-navy text-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 md:px-6">
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <Link
            to="/"
            className={cn(
              "rounded-sm px-3 py-2 hover:bg-white/10",
              current === "home" ? "bg-white/10" : "",
            )}
          >
            Home
          </Link>
          <Link to="/gallery" className="rounded-sm px-3 py-2 hover:bg-white/10">
            Gallery
          </Link>
          <Link to="/contact" className="rounded-sm px-3 py-2 hover:bg-white/10">
            Contact
          </Link>
          {showDashboard ? (
            <Link
              to={session ? dash : "/login"}
              className={cn(
                "rounded-sm px-3 py-2 hover:bg-white/10",
                current === "dashboard" ? "bg-white/10" : "",
              )}
            >
              {officer ? "Desk" : "Back to dashboard"}
            </Link>
          ) : null}
          {officer ? (
            <>
              <Link to="/po/attendance" className="rounded-sm px-3 py-2 hover:bg-white/10">
                Attendance
              </Link>
              <Link to="/po/reports" className="rounded-sm px-3 py-2 hover:bg-white/10">
                Reports
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-white/20 bg-transparent text-paper hover:bg-white/10"
            asChild
          >
            <Link to="/install">
              <Download />
              Install NSP
            </Link>
          </Button>
          {session ? (
            <>
              <span className="hidden text-xs text-paper/70 sm:inline">{session.name}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-9 border-white/20 bg-transparent text-paper hover:bg-white/10"
                onClick={() => {
                  setSession(null);
                  window.location.href = "/";
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-white/20 bg-transparent text-paper hover:bg-white/10"
              asChild
            >
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
