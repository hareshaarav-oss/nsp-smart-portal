import { Link } from "@tanstack/react-router";
import { Download, Images, LayoutGrid, MessageCircle, Newspaper } from "lucide-react";
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
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-navy text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 md:px-6">
        <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-1 text-sm md:flex">
          <Link
            to="/"
            onClick={() => {
              try {
                localStorage.setItem("nsp-view", "portal");
              } catch {
                /* ignore */
              }
            }}
            className={cn(
              "rounded-sm px-3 py-2 hover:bg-white/10",
              current === "home" ? "bg-white/10" : "",
            )}
          >
            Portal
          </Link>
          {showDashboard ? (
            session ? (
            <Link
              to={dash}
              onClick={() => {
                try {
                  localStorage.setItem("nsp-view", "app");
                } catch {
                  /* ignore */
                }
              }}
              className={cn(
                "rounded-sm px-3 py-2 hover:bg-white/10",
                current === "dashboard" ? "bg-white/10" : "",
              )}
            >
              App
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ role: "volunteer" }}
              onClick={() => {
                try {
                  localStorage.setItem("nsp-view", "app");
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-sm px-3 py-2 hover:bg-white/10"
            >
              App
            </Link>
            )
          ) : null}
          <Link to="/gallery" className="rounded-sm px-3 py-2 hover:bg-white/10">
            Gallery
          </Link>
          <Link to="/contact" className="rounded-sm px-3 py-2 hover:bg-white/10">
            Contact
          </Link>
          {session ? (
            <Link to="/chat" className="inline-flex items-center gap-1 rounded-sm px-3 py-2 hover:bg-white/10">
              <MessageCircle className="size-4" />
              Chat
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
              <span className="hidden lg:inline">Install NSP</span>
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
                  try {
                    localStorage.setItem("nsp-view", "portal");
                  } catch {
                    /* ignore */
                  }
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
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-border bg-surface pb-[max(0.35rem,env(safe-area-inset-bottom))] text-[11px] font-medium text-navy shadow-[0_-8px_24px_rgb(19_41_75/0.08)] md:hidden">
        <Link to="/" onClick={() => { try { localStorage.setItem("nsp-view", "portal"); } catch { /* ignore */ } }} className={cn("flex flex-col items-center gap-1 px-2 py-2", current === "home" ? "text-forest" : "")}>
          <Newspaper className="size-5" />
          Portal
        </Link>
        {session ? (
          <Link to={dash} onClick={() => { try { localStorage.setItem("nsp-view", "app"); } catch { /* ignore */ } }} className={cn("flex flex-col items-center gap-1 px-2 py-2", current === "dashboard" ? "text-forest" : "")}>
            <LayoutGrid className="size-5" />
            App
          </Link>
        ) : (
          <Link to="/login" search={{ role: "volunteer" }} className="flex flex-col items-center gap-1 px-2 py-2">
            <LayoutGrid className="size-5" />
            App
          </Link>
        )}
        {session ? (
          <Link to="/chat" className="flex flex-col items-center gap-1 px-2 py-2">
            <MessageCircle className="size-5" />
            Chat
          </Link>
        ) : (
          <Link to="/login" search={{ role: "volunteer" }} className="flex flex-col items-center gap-1 px-2 py-2">
            <MessageCircle className="size-5" />
            Chat
          </Link>
        )}
        <Link to="/gallery" className="flex flex-col items-center gap-1 px-2 py-2">
          <Images className="size-5" />
          Gallery
        </Link>
      </div>
    </nav>
  );
}
