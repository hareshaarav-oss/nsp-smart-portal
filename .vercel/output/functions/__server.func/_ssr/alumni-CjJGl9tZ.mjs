import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, u as alumniVolunteers } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
import { o as downloadAlumniExcel } from "./reports-0LItQuD8.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/alumni-CjJGl9tZ.js
var import_jsx_runtime = require_jsx_runtime();
function AlumniPage() {
	const state = useNssStore();
	const rows = alumniVolunteers(state);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title: "NSS Alumni file",
				compact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Alumni"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Editable alumni register. Move a volunteer here from the Volunteers tab. Excel download is an editable file."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => downloadAlumniExcel(state),
					disabled: !rows.length,
					children: "Download editable Excel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "overflow-x-auto p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[860px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"#",
							"ID",
							"Name",
							"Mobile",
							"Course",
							"Year",
							"Notes",
							""
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: h
						}, h)) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: v.volunteerId
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: v.fullName,
									onChange: (e) => state.updateVolunteer(v.id, { fullName: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: v.mobile,
									onChange: (e) => state.updateVolunteer(v.id, { mobile: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: `${v.course}`,
									onChange: (e) => state.updateVolunteer(v.id, { course: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: v.alumniYear ?? "",
									onChange: (e) => state.updateVolunteer(v.id, { alumniYear: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: v.alumniNotes ?? "",
									onChange: (e) => state.updateVolunteer(v.id, { alumniNotes: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										state.restoreAlumni(v.id);
										toast.success(`${v.fullName} restored to volunteers`);
									},
									children: "Restore"
								})
							})
						]
					}, v.id)), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 8,
						className: "px-3 py-8 text-center text-sm text-muted-foreground",
						children: "No alumni yet. Open Volunteers and use “Send to alumni”."
					}) }) : null] })]
				})
			}) })
		]
	});
}
//#endregion
export { AlumniPage as component };
