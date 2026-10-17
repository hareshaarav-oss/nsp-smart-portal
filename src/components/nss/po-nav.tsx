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
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/po", label: "Dashboard", icon: LayoutDashboard },
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
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 sm:flex-wrap">
      {ITEMS.map((item) => {
        const active = current === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground ring-1 ring-border hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
