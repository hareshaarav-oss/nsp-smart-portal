import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, H as volunteerHours, l as activeVolunteers, z as totalServiceHours } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { S as MapPinned, V as Clock, k as HeartHandshake, t as Users, tt as Award } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/impact-CwRYFAMi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ImpactPage() {
	const state = useNssStore();
	const volunteers = activeVolunteers(state);
	const hours = totalServiceHours(state);
	const attendanceMarked = state.attendance.filter((a) => a.present).length;
	const villages = new Set(state.events.map((e) => e.location.trim()).filter(Boolean)).size;
	const beneficiaries = state.events.reduce((sum, e) => sum + (e.beneficiaries ?? 0), 0);
	const target = Math.max(1, state.settings.serviceHourTarget || 120);
	const progress = Math.min(100, Math.round(hours / target * 100));
	const top = (0, import_react.useMemo)(() => [...volunteers].sort((a, b) => volunteerHours(state, b.id) - volunteerHours(state, a.id)).slice(0, 8), [volunteers, state]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-bold",
				children: "NSS Impact Analytics"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Turn attendance and activity records into a clear yearly impact picture."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 lg:grid-cols-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: Users,
						label: "Active volunteers",
						value: volunteers.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: HeartHandshake,
						label: "Events",
						value: state.events.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: Clock,
						label: "Service hours",
						value: hours
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: Award,
						label: "Certificates",
						value: state.certificates.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: MapPinned,
						label: "Activity locations",
						value: villages
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: Users,
						label: "Beneficiaries",
						value: beneficiaries
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Service-hour target" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-4xl font-bold",
					children: [progress, "%"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						hours,
						" of ",
						target,
						" hours"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-semibold text-forest",
					children: [attendanceMarked, " present marks"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-3 overflow-hidden rounded-full bg-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full rounded-full bg-primary transition-all",
					style: { width: `${progress}%` }
				})
			})] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Top service contributors" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-3",
					children: top.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-lg border border-border p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mr-2 text-xs text-muted-foreground",
							children: ["#", i + 1]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: v.fullName
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-semibold",
							children: [volunteerHours(state, v.id), " hrs"]
						})]
					}, v.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Impact summary" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"📌 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: state.events.length }),
							" activities recorded in the portal."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"⏱️ ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: hours }),
							" service hours calculated from attendance."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"👥 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: attendanceMarked }),
							" present attendance records."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"🏘️ ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: villages }),
							" distinct activity locations."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"🤝 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: beneficiaries }),
							" beneficiaries recorded on events."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"🏅 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: state.certificates.length }),
							" certificates issued in this device/cloud dataset."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Beneficiary counts can be added per event in the event data for a more complete impact report."
						})
					]
				})] })]
			})
		]
	});
}
function Metric({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-bold",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: label
			})
		]
	}) });
}
//#endregion
export { ImpactPage as component };
