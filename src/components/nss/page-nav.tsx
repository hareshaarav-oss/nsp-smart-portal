import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { dashboardPath, isOfficer, useSessionStore } from "@/lib/nss/session";
import { useUi } from "@/lib/nss/ui-prefs";
import { useChatUnread } from "@/components/nss/chat-alert";
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
  const router = useRouter();
  const dash = dashboardPath(session);
  const officer = isOfficer(session);
  const { lang, dark, setLang, toggleDark, t } = useUi();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unread = useChatUnread();
  const on = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  const item = "shrink-0 rounded-none px-3 py-2 hover:bg-white/10 active:bg-saffron active:text-navy";

  function goBack() {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    void router.navigate({ to: session ? dash : "/" });
  }

  return (
    <nav className="border-y border-saffron/40 bg-navy text-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-1.5 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {current !== "home" ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-10 shrink-0 items-center gap-1 px-3 hover:bg-white/10 active:bg-saffron active:text-navy"
            >
              <ArrowLeft className="size-4" />
              {t("back")}
            </button>
          ) : null}
          <Link
            to="/"
            className={cn(item, on("/") && "is-on")}
          >
            {t("home")}
          </Link>
          <Link to="/gallery" className={cn(item, on("/gallery") && "is-on")}>
            {t("gallery")}
          </Link>
          <Link to="/contact" className={cn(item, on("/contact") && "is-on")}>
            {t("contact")}
          </Link>
          {showDashboard && session ? (
            <Link
              to={session ? dash : "/login"}
              className={cn(item, on(dash) && "is-on")}
            >
              {officer ? t("desk") : t("dashboard")}
            </Link>
          ) : null}
          {session ? (
            <Link to="/chat" className={cn(item, "relative", on("/chat") && "is-on")}>
              {t("chat")}
              {unread > 0 ? <span className="ml-1 rounded-full bg-saffron px-1.5 text-[10px] font-semibold text-navy">{unread > 9 ? "9+" : unread}</span> : null}
            </Link>
          ) : null}
          {officer ? (
            <>
              <Link to="/po/attendance" className={cn(item, on("/po/attendance") && "is-on")}>
                {t("attendance")}
              </Link>
              <Link to="/po/reports" className={cn(item, on("/po/reports") && "is-on")}>
                {t("reports")}
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="min-h-11 px-2 text-paper hover:text-paper"
            asChild
          >
            <Link to="/install" aria-label={t("install")}>
              {t("install")}
            </Link>
          </Button>
          <button type="button" className="px-2 text-xs" onClick={() => setLang(lang === "gu" ? "en" : "gu")}>{lang === "gu" ? "EN" : "ગુ"}</button>
          <button type="button" className="px-2 text-xs" onClick={toggleDark}>{dark ? "Light" : "Dark"}</button>
          {session ? (
            <>
              <span className="hidden text-xs text-paper/70 sm:inline">{session.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="min-h-11 px-2 text-paper hover:text-paper"
                onClick={() => {
                  setSession(null);
                  window.location.href = "/";
                }}
              >
                {t("signout")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11 px-2 text-paper hover:text-paper"
              asChild
            >
              <Link to="/login">{t("signin")}</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
