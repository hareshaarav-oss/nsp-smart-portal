import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, R as todayIso, c as academicYear, y as cn } from "./utils-BIiJ-s-U.mjs";
import { t as TricolourStrip } from "./tricolour-DHYPuBOE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/official-letterhead-0CBv-cY2.js
var import_jsx_runtime = require_jsx_runtime();
function OfficialLetterhead({ title, compact = false, className }) {
	const college = useNssStore((s) => s.settings.collegeShort) || "S.D. Arts & Shah B.R. Commerce College";
	const collegeLogo = useNssStore((s) => s.settings.collegeLogo) || "/images/college-logo.png";
	const nssLogo = useNssStore((s) => s.settings.nssLogo) || "/images/nss-logo.png";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-xl border border-border bg-white px-4 py-4 text-navy shadow-sm", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 md:gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: collegeLogo,
					alt: "College logo",
					className: cn("object-contain mix-blend-multiply", compact ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("font-display font-semibold leading-tight", compact ? "text-sm md:text-base" : "text-base md:text-xl"),
							children: college
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[10px] uppercase tracking-[0.18em] text-forest md:text-xs",
							children: "Mansa · National Service Scheme"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs font-semibold tracking-[0.16em] text-navy",
							children: "NSS SMART PORTAL"
						}),
						title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-display text-sm font-semibold md:text-base",
							children: title
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: [
								"Date: ",
								formatLongDate(todayIso()),
								" · Academic Year ",
								academicYear()
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: nssLogo,
					alt: "NSS logo",
					className: cn("object-contain mix-blend-multiply", compact ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20")
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TricolourStrip, { className: "mt-3" })]
	});
}
function ReportPreview({ title, headers, rows, intro, maxRows = 8 }) {
	const shown = rows.slice(0, maxRows);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-xl border border-border bg-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title,
				compact: true,
				className: "rounded-none border-0 shadow-none"
			}),
			intro?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2 border-t border-border px-4 py-3 text-sm leading-relaxed text-navy",
				children: intro.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, i))
			}) : null,
			headers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto border-t border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[640px] text-left text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-navy text-paper",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: headers.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-2 py-2 font-medium",
							children: h
						}, h)) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: shown.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-t border-border",
						children: r.map((c, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-1.5",
							children: c
						}, j))
					}, i)) })]
				})
			}) : null,
			rows.length > maxRows ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-4 py-2 text-[11px] text-muted-foreground",
				children: [
					"Showing ",
					maxRows,
					" of ",
					rows.length,
					" rows. Full list on Excel / Print PDF."
				]
			}) : null
		]
	});
}
//#endregion
export { ReportPreview as n, OfficialLetterhead as t };
