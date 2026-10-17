import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, MessageCircle, Users } from "lucide-react";
import { dashboardPath, useSessionStore } from "@/lib/nss/session";
import { cn } from "@/lib/utils";

export function PageNav({
  current = "page",
}: {
  showDashboard?: boolean;
  current?: "home" | "dashboard" | "page";
}) {
  const session = useSessionStore((s) => s.session);
  const dash = dashboardPath(session);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e4d8c8] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] text-[11px] font-semibold text-[#161311]">
      <div className="mx-auto grid max-w-3xl grid-cols-4">
        <Link to="/" className={cn("flex flex-col items-center gap-1 py-2", current === "home" ? "text-[#c4121a]" : "")}>
          <Home className="size-5" />
          Home
        </Link>
        <Link to="/" hash="roll" className="flex flex-col items-center gap-1 py-2">
          <Users className="size-5" />
          Roll
        </Link>
        {session ? (
          <Link to="/chat" className="flex flex-col items-center gap-1 py-2">
            <MessageCircle className="size-5" />
            Chat
          </Link>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-1 py-2">
            <MessageCircle className="size-5" />
            Chat
          </Link>
        )}
        {session ? (
          <Link to={dash} className={cn("flex flex-col items-center gap-1 py-2", current === "dashboard" ? "text-[#c4121a]" : "")}>
            <LayoutGrid className="size-5" />
            Desk
          </Link>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-1 py-2">
            <LayoutGrid className="size-5" />
            Desk
          </Link>
        )}
      </div>
    </nav>
  );
}
