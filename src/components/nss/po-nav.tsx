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
    <nav className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-3">
      {GROUPS.map((group) => (
        <div key={group.en} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <p className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {lang === "gu" ? group.gu : group.en}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.items.map((item) => {
              const active = current === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
                    active ? "bg-navy text-paper" : "bg-muted text-foreground hover:bg-muted/70",
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
