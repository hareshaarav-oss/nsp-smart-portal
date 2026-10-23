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

const ITEMS = [
  { to: "/po", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/po/volunteers", label: "Volunteers", icon: Users },
  { to: "/po/alumni", label: "Alumni", icon: GraduationCap },
  { to: "/po/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/po/events", label: "Events", icon: CalendarDays },
  { to: "/po/press", label: "Press", icon: Newspaper },
  { to: "/po/certificates", label: "Certificates", icon: Award },
  { to: "/po/notices", label: "Notices", icon: Bell },
  { to: "/po/reports", label: "Reports", icon: FileSpreadsheet },
  { to: "/po/birthdays", label: "Birthdays", icon: Cake },
  { to: "/po/gallery", label: "Gallery", icon: Images },
  { to: "/po/logs", label: "Logs", icon: ClipboardList },
  { to: "/po/ai", label: "Smart Command", icon: BrainCircuit },
  { to: "/po/impact", label: "NSS Impact", icon: ChartNoAxesCombined },
  { to: "/po/backup", label: "Backup", icon: DatabaseBackup },
  { to: "/po/settings", label: "Settings", icon: Settings },
] as const;

export function PoNav({ current }: { current: string }) {
  const { t } = useUi();
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
    <nav className="mt-3 flex gap-1 overflow-x-auto border-b border-border pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ITEMS.map((item) => {
        const active = current === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium",
              active
                ? "border-saffron text-navy"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {t(label[item.label] || item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
