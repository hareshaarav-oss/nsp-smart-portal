import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, R as todayIso, c as academicYear, z as totalServiceHours } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { F as Eye, I as Download, _ as Printer } from "../_libs/lucide-react.mjs";
import { n as ReportPreview, t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
import { _ as printAttendanceReport, a as downloadActivityExcel, b as volunteerReportRows, c as downloadEventExcel, d as downloadYearlyEventExcel, g as printAlumniReport, h as hoursReportRows, l as downloadHoursExcel, m as eventReportRows, n as alumniReportRows, o as downloadAlumniExcel, r as buildAttendanceMatrix, s as downloadAttendanceExcel, t as activityReportRows, u as downloadVolunteerExcel, v as printOfficialReport, y as printVolunteerReport } from "./reports-0LItQuD8.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-DTSSRFv6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReportsPage() {
	const state = useNssStore();
	const [openPreview, setOpenPreview] = (0, import_react.useState)("attendance");
	const [month, setMonth] = (0, import_react.useState)(todayIso().slice(0, 7));
	const yearlyAtt = buildAttendanceMatrix(state, { mode: "yearly" });
	const monthlyAtt = buildAttendanceMatrix(state, {
		mode: "monthly",
		month
	});
	const previews = {
		volunteer: volunteerReportRows(state),
		attendance: yearlyAtt,
		monthly: monthlyAtt,
		event: eventReportRows(state),
		yearly: eventReportRows(state, true),
		hours: hoursReportRows(state),
		activity: activityReportRows(state),
		alumni: alumniReportRows(state)
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title: "Official reports",
				compact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Reports"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-sm text-muted-foreground",
				children: "Every downloaded report carries the college name, NSS SMART PORTAL, title and date. Print / PDF embeds the College logo and NSS logo so the page is never blank. Excel uses the same letterhead rows."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-forest/30",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Event-wise press report"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Dedicated Press desk: choose the event, photos load from Gallery, write or paste Gujarati, attendance prints at the foot, then View. English NAAC report is generated from the same file."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/po/press",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {}), "Open Press report desk"]
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-navy/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Attendance — yearly & monthly (event-wise columns)"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [
								"One Excel: Sr. No., Volunteer ID, Name, Unit, then a column for every event (Event name + date) with Present / Absent. Full yearly covers academic year ",
								academicYear(),
								". Monthly uses the month you pick."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => downloadAttendanceExcel(state, { mode: "yearly" }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Full yearly Excel"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => void printAttendanceReport(state, { mode: "yearly" }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print yearly"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "space-y-1 text-xs text-muted-foreground",
									children: ["Month", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "month",
										className: "flex h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground",
										value: month,
										onChange: (e) => setMonth(e.target.value)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => downloadAttendanceExcel(state, {
										mode: "monthly",
										month
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Monthly Excel"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => void printAttendanceReport(state, {
										mode: "monthly",
										month
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print monthly"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => setOpenPreview("attendance"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {}), "Preview yearly"]
								})
							]
						}),
						openPreview === "attendance" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportPreview, {
							title: `Attendance Report — Full yearly (${academicYear()})`,
							headers: yearlyAtt.headers,
							rows: yearlyAtt.rows
						}) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
						id: "volunteer",
						open: openPreview,
						onPreview: setOpenPreview,
						title: "Volunteer Report",
						body: "Active roll, A–Z by name, with ID, mobile, unit, course and hours.",
						onExcel: () => downloadVolunteerExcel(state),
						onPrint: () => void printVolunteerReport(state),
						preview: previews.volunteer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
						id: "event",
						open: openPreview,
						onPreview: setOpenPreview,
						title: "Event Report",
						body: "Every activity with date, place, hours and turnout.",
						onExcel: () => downloadEventExcel(state),
						onPrint: () => void printOfficialReport({
							title: "Event Report",
							headers: previews.event.headers,
							rows: previews.event.rows
						}),
						preview: previews.event
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
						id: "yearly",
						open: openPreview,
						onPreview: setOpenPreview,
						title: `Yearly Activity Report (${academicYear()})`,
						body: "Auto-compiled from this academic year. Also generated when you complete an activity.",
						onExcel: () => downloadYearlyEventExcel(state),
						onPrint: () => void printOfficialReport({
							title: `Yearly Activity Report — ${academicYear()}`,
							headers: previews.yearly.headers,
							rows: previews.yearly.rows
						}),
						preview: previews.yearly
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
						id: "hours",
						open: openPreview,
						onPreview: setOpenPreview,
						title: "Service Hours Report",
						body: `Cumulative hours. Unit total: ${totalServiceHours(state)} hours.`,
						onExcel: () => downloadHoursExcel(state),
						onPrint: () => void printOfficialReport({
							title: "Service Hours Report",
							headers: previews.hours.headers,
							rows: previews.hours.rows
						}),
						preview: previews.hours
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
						id: "activity",
						open: openPreview,
						onPreview: setOpenPreview,
						title: "Activity Report",
						body: "Narrative list of NSS programmes for files and press notes.",
						onExcel: () => downloadActivityExcel(state),
						onPrint: () => void printOfficialReport({
							title: "Activity Report",
							headers: previews.activity.headers,
							rows: previews.activity.rows
						}),
						preview: previews.activity
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportCard, {
						id: "alumni",
						open: openPreview,
						onPreview: setOpenPreview,
						title: "Alumni Register",
						body: "Editable alumni file. Move volunteers from the Volunteers tab, then download Excel.",
						onExcel: () => downloadAlumniExcel(state),
						onPrint: () => void printAlumniReport(state),
						preview: previews.alumni
					})
				]
			})
		]
	});
}
function ReportCard({ id, title, body, onExcel, onPrint, preview, open, onPreview }) {
	const shown = open === id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: title
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: onExcel,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Excel"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: onPrint,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print / PDF with logos"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => onPreview(shown ? null : id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {}), shown ? "Hide preview" : "Preview"]
					})
				]
			}),
			shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportPreview, {
				title: preview.title ?? title,
				headers: preview.headers,
				rows: preview.rows,
				intro: preview.intro
			}) : null
		]
	})] });
}
//#endregion
export { ReportsPage as component };
