import { Link } from "@tanstack/react-router";
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
    <nav className="mt-5 overflow-hidden border border-saffron/50 bg-surface">
      {GROUPS.map((group) => (
        <div key={group.en} className="grid grid-cols-1 border-b border-saffron/30 last:border-b-0 sm:grid-cols-[7.5rem_1fr]">
          <p className="flex items-center bg-navy px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">
            {lang === "gu" ? group.gu : group.en}
          </p>
          <div className="flex flex-wrap items-center gap-x-1 px-2 py-1">
            {group.items.map((item) => {
              const active = current === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 px-3 text-sm",
                    active ? "font-semibold text-saffron underline decoration-saffron underline-offset-8" : "text-navy hover:text-saffron",
                  )}
                >
                  <Icon className="size-3.5" />
                  {t(label[item.label] || item.label)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
