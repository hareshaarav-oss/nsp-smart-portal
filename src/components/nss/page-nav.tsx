import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
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
  const unread = useChatUnread();

  function goBack() {
    if (window.history.length > 1) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/" });
  }

  return (
    <nav className="bg-navy text-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-1.5 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {current !== "home" ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
              {t("back")}
            </button>
          ) : null}
          <Link
            to="/"
            className={cn(
              "shrink-0 rounded-full px-3 py-2 hover:bg-white/10",
              current === "home" ? "bg-white/15" : "",
            )}
          >
            {t("home")}
          </Link>
          <Link to="/gallery" className="shrink-0 rounded-full px-3 py-2 hover:bg-white/10">
            {t("gallery")}
          </Link>
          <Link to="/contact" className="shrink-0 rounded-full px-3 py-2 hover:bg-white/10">
            {t("contact")}
          </Link>
          {showDashboard && session ? (
            <Link
              to={session ? dash : "/login"}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 hover:bg-white/10",
                current === "dashboard" ? "bg-white/15" : "",
              )}
            >
              {officer ? t("desk") : t("dashboard")}
            </Link>
          ) : null}
          {session ? (
            <Link to="/chat" className="relative shrink-0 rounded-full px-3 py-2 hover:bg-white/10">
              {t("chat")}
              {unread > 0 ? <span className="ml-1 rounded-full bg-[#25d366] px-1.5 text-[10px] font-semibold text-[#111b21]">{unread > 9 ? "9+" : unread}</span> : null}
            </Link>
          ) : null}
          {officer ? (
            <>
              <Link to="/po/attendance" className="shrink-0 rounded-full px-3 py-2 hover:bg-white/10">
                {t("attendance")}
              </Link>
              <Link to="/po/reports" className="shrink-0 rounded-full px-3 py-2 hover:bg-white/10">
                {t("reports")}
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-white/20 bg-transparent px-2 text-paper hover:bg-white/10"
            asChild
          >
            <Link to="/install" aria-label={t("install")}>
              <Download />
              <span className="hidden md:inline">{t("install")}</span>
            </Link>
          </Button>
          <button type="button" className="h-9 rounded-full px-2.5 text-xs font-semibold hover:bg-white/10" onClick={() => setLang(lang === "gu" ? "en" : "gu")}>{lang === "gu" ? "EN" : "ગુ"}</button>
          <button type="button" className="h-9 rounded-full px-2.5 text-xs font-semibold hover:bg-white/10" onClick={toggleDark}>{dark ? "Light" : "Dark"}</button>
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
                {t("signout")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-white/20 bg-transparent text-paper hover:bg-white/10"
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
