import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/logs-Ccj-rBeo.js
var import_jsx_runtime = require_jsx_runtime();
function LogsPage() {
	const logs = useNssStore((s) => s.logs) ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title: "Activity logs",
				compact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Activity logs"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Programme Officer actions — promotions, deletions, edits, alumni moves, registrations."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "overflow-x-auto p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"When",
							"Actor",
							"Action",
							"Details"
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: h
						}, h)) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 4,
						className: "px-3 py-8 text-center text-muted-foreground",
						children: "No activity yet."
					}) }) : logs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2 text-xs",
								children: [formatLongDate(log.at.slice(0, 10)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-muted-foreground",
									children: log.at.slice(11, 19)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: log.actor
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 font-medium",
								children: log.action
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-muted-foreground",
								children: log.details
							})
						]
					}, log.id)) })]
				})
			}) })
		]
	});
}
//#endregion
export { LogsPage as component };
