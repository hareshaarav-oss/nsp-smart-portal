import { Link } from "@tanstack/react-router";
import { Images, LayoutGrid, MessageCircle, Newspaper } from "lucide-react";
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

  function markApp() {
    try {
      localStorage.setItem("nsp-view", "app");
    } catch {
      /* ignore */
    }
  }

  function homeLink() {
    return (
      <Link to="/" className={item(current === "home")} onClick={markApp}>
        Home
      </Link>
    );
  }
  function appLink() {
    if (session) {
      return (
        <Link to={dash} className={item(current === "dashboard")} onClick={markApp}>
          App
        </Link>
      );
    }
    if (!showDashboard) return null;
    return (
      <Link to="/login" search={{ role: "volunteer" }} className={item(false)} onClick={markApp}>
        App
      </Link>
    );
  }

  return (
    <>
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-navy text-paper lg:flex">
        <div className="border-b border-white/10 px-4 py-5">
          <p className="font-display text-lg leading-tight">NSS Smart Portal</p>
          <p className="mt-1 text-xs text-paper/70">Mansa</p>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm">
          {homeLink()}
          {appLink()}
          <Link to="/gallery" className={item(false)}>Gallery</Link>
          <Link to="/contact" className={item(false)}>Contact</Link>
          {session ? <Link to="/chat" className={item(false)}>Chat</Link> : null}
          {officer ? <Link to="/po/attendance" className={item(false)}>Attendance</Link> : null}
          {officer ? <Link to="/po/reports" className={item(false)}>Reports</Link> : null}
        </div>
        <div className="border-t border-white/10 p-3">
          {session ? <p className="truncate px-2 pb-2 text-xs text-paper/70">{session.name}</p> : null}
          <SessionButton signedIn={Boolean(session)} onSignOut={() => { markApp(); setSession(null); window.location.href = "/"; }} />
        </div>
      </aside>

      <nav className="no-print sticky top-0 z-40 hidden border-b border-white/10 bg-navy text-paper md:block lg:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
          {homeLink()}
          {appLink()}
          <Link to="/gallery" className={item(false)}>Gallery</Link>
          <Link to="/contact" className={item(false)}>Contact</Link>
          {session ? <Link to="/chat" className={item(false)}>Chat</Link> : null}
          <span className="ml-auto">
            <SessionButton signedIn={Boolean(session)} onSignOut={() => { markApp(); setSession(null); window.location.href = "/"; }} />
          </span>
        </div>
      </nav>

      <div className="no-print fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-border bg-surface pb-[max(0.35rem,env(safe-area-inset-bottom))] text-[11px] font-medium text-navy shadow-[0_-8px_24px_rgb(19_41_75/0.08)] md:hidden">
        <Link to="/" onClick={markApp} className={cn("flex flex-col items-center gap-1 px-2 py-2", current === "home" && "text-forest")}>
          <Newspaper className="size-5" />
          Home
        </Link>
        {session ? (
          <Link to={dash} onClick={markApp} className={cn("flex flex-col items-center gap-1 px-2 py-2", current === "dashboard" && "text-forest")}>
            <LayoutGrid className="size-5" />
            App
          </Link>
        ) : (
          <Link to="/login" search={{ role: "volunteer" }} onClick={markApp} className="flex flex-col items-center gap-1 px-2 py-2">
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
          <Link to="/login" search={{ role: "volunteer" }} onClick={markApp} className="flex flex-col items-center gap-1 px-2 py-2">
            <MessageCircle className="size-5" />
            Chat
          </Link>
        )}
        <Link to="/gallery" className="flex flex-col items-center gap-1 px-2 py-2">
          <Images className="size-5" />
          Gallery
        </Link>
      </div>
    </>
  );
}

function item(active: boolean) {
  return cn("rounded-lg px-3 py-2 hover:bg-white/10", active && "bg-white/15");
}

function SessionButton({ signedIn, onSignOut }: { signedIn: boolean; onSignOut: () => void }) {
  if (!signedIn) {
    return (
      <Button size="sm" variant="outline" className="h-9 border-white/20 bg-transparent text-paper hover:bg-white/10" asChild>
        <Link to="/login">Sign in</Link>
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" className="h-9 border-white/20 bg-transparent text-paper hover:bg-white/10" onClick={onSignOut}>
      Sign out
    </Button>
  );
}
