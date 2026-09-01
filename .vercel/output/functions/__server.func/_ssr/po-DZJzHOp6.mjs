import { C as require_jsx_runtime, b as Navigate, f as useRouterState, h as Outlet, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as cn } from "./utils-BIiJ-s-U.mjs";
import { $ as BrainCircuit, A as GraduationCap, D as Images, H as ClipboardList, L as DatabaseBackup, P as FileSpreadsheet, Q as Cake, T as LayoutDashboard, U as ClipboardCheck, Y as ChartNoAxesCombined, Z as CalendarDays, b as Newspaper, d as Settings, et as Bell, t as Users, tt as Award } from "../_libs/lucide-react.mjs";
import { h as useSessionStore, s as isOfficer } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/po-DZJzHOp6.js
var import_jsx_runtime = require_jsx_runtime();
var ITEMS = [
	{
		to: "/po",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/po/volunteers",
		label: "Volunteers",
		icon: Users
	},
	{
		to: "/po/alumni",
		label: "Alumni",
		icon: GraduationCap
	},
	{
		to: "/po/attendance",
		label: "Attendance",
		icon: ClipboardCheck
	},
	{
		to: "/po/events",
		label: "Events",
		icon: CalendarDays
	},
	{
		to: "/po/press",
		label: "Press",
		icon: Newspaper
	},
	{
		to: "/po/certificates",
		label: "Certificates",
		icon: Award
	},
	{
		to: "/po/notices",
		label: "Notices",
		icon: Bell
	},
	{
		to: "/po/reports",
		label: "Reports",
		icon: FileSpreadsheet
	},
	{
		to: "/po/birthdays",
		label: "Birthdays",
		icon: Cake
	},
	{
		to: "/po/gallery",
		label: "Gallery",
		icon: Images
	},
	{
		to: "/po/logs",
		label: "Logs",
		icon: ClipboardList
	},
	{
		to: "/po/ai",
		label: "Smart Command",
		icon: BrainCircuit
	},
	{
		to: "/po/impact",
		label: "NSS Impact",
		icon: ChartNoAxesCombined
	},
	{
		to: "/po/backup",
		label: "Backup",
		icon: DatabaseBackup
	},
	{
		to: "/po/settings",
		label: "Settings",
		icon: Settings
	}
];
function PoNav({ current }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex gap-1 overflow-x-auto pb-1 sm:flex-wrap",
		children: ITEMS.map((item) => {
			const active = current === item.to;
			const Icon = item.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				className: cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium", active ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border hover:bg-muted"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
			}, item.to);
		})
	});
}
function PoLayout() {
	const session = useSessionStore((s) => s.session);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/login",
		search: { role: "po" }
	});
	if (!isOfficer(session)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/volunteer" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		current: "dashboard",
		compactHeader: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-4 pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.16em] text-muted-foreground",
						children: "PROGRAMME OFFICER"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: session.name
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoNav, { current: pathname === "/po/" ? "/po" : pathname }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				})
			]
		})
	});
}
//#endregion
export { PoLayout as component };
