import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Award,
  BrainCircuit,
  ChartNoAxesCombined,
  DatabaseBackup,
  Bell,
  Cake,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Images,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUi } from "@/lib/nss/ui-prefs";

const GROUPS = [
  {
    en: "Desk",
    gu: "ડેસ્ક",
    items: [
      { to: "/po", label: "Dashboard", icon: LayoutDashboard },
      { to: "/chat", label: "Chat", icon: MessageCircle },
    ],
  },
  {
    en: "Roll",
    gu: "યાદી",
    items: [
      { to: "/po/volunteers", label: "Volunteers", icon: Users },
      { to: "/po/alumni", label: "Alumni", icon: GraduationCap },
      { to: "/po/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/po/birthdays", label: "Birthdays", icon: Cake },
    ],
  },
  {
    en: "Work",
    gu: "કાર્ય",
    items: [
      { to: "/po/events", label: "Events", icon: CalendarDays },
      { to: "/po/notices", label: "Notices", icon: Bell },
      { to: "/po/gallery", label: "Gallery", icon: Images },
      { to: "/po/press", label: "Press", icon: Newspaper },
    ],
  },
  {
    en: "Papers",
    gu: "કાગળ",
    items: [
      { to: "/po/certificates", label: "Certificates", icon: Award },
      { to: "/po/reports", label: "Reports", icon: FileSpreadsheet },
      { to: "/po/impact", label: "NSS Impact", icon: ChartNoAxesCombined },
      { to: "/po/logs", label: "Logs", icon: ClipboardList },
    ],
  },
  {
    en: "System",
    gu: "સિસ્ટમ",
    items: [
      { to: "/po/ai", label: "Smart Command", icon: BrainCircuit },
      { to: "/po/backup", label: "Backup", icon: DatabaseBackup },
      { to: "/po/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

export function PoNav({ current }: { current: string }) {
  const { t, lang } = useUi();
  const openName = GROUPS.find((group) => group.items.some((item) => item.to === current))?.en ?? "Desk";
  const [open, setOpen] = useState(openName);
  useEffect(() => {
    setOpen(openName);
  }, [openName]);
  const group = GROUPS.find((item) => item.en === open) ?? GROUPS[0];
  const label: Record<string, string> = {
    Dashboard: "dashboard",
    Chat: "chat",
    Volunteers: "volunteers",
    Alumni: "alumni",
    Attendance: "attendance",
    Events: "events",
    Press: "press",
    Certificates: "certificates",
    Notices: "notices",
    Reports: "reports",
    Birthdays: "birthdays",
    Gallery: "gallery",
    Logs: "logs",
    "Smart Command": "smart",
    "NSS Impact": "impact",
    Backup: "backup",
    Settings: "settings",
  };
  return (
    <nav className="mt-6">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-saffron/70 [scrollbar-width:none]">
        {GROUPS.map((item) => {
          const on = item.en === group.en;
          return (
            <button
              key={item.en}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setOpen(item.en)}
              className={cn(
                "-mb-px h-11 shrink-0 border px-4 text-[11px] font-semibold uppercase tracking-[0.16em]",
                on ? "border-saffron/70 border-b-surface bg-surface text-navy" : "border-transparent text-muted-foreground hover:text-navy",
              )}
            >
              {lang === "gu" ? item.gu : item.en}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 border border-t-0 border-saffron/70 bg-surface px-3 py-3">
        {group.items.map((item) => {
          const active = current === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex h-10 items-center gap-2 border px-3 text-sm",
                active ? "border-navy bg-navy text-saffron" : "border-saffron/40 text-navy hover:border-navy",
              )}
            >
              <Icon className="size-3.5" />
              {t(label[item.label] || item.label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
