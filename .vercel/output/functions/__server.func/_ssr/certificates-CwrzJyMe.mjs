import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, P as presentVolunteers, _ as certificateOf } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { _ as Printer, f as Send, tt as Award } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as openCertificateDocument, n as htmlForCertificate, r as htmlForCertificates } from "./certificates-BpqtJ9x9.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/certificates-CwrzJyMe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CertificatesPage() {
	const state = useNssStore();
	const events = (0, import_react.useMemo)(() => [...state.events].sort((a, b) => b.date.localeCompare(a.date)), [state.events]);
	const defaultEvent = events.find((e) => e.status === "completed")?.id ?? events[0]?.id ?? "";
	const [eventId, setEventId] = (0, import_react.useState)(defaultEvent);
	const event = events.find((e) => e.id === eventId) ?? events[0];
	const present = event ? presentVolunteers(state, event.id) : [];
	const [picked, setPicked] = (0, import_react.useState)({});
	const selectedIds = present.filter((v) => picked[v.id] !== false).map((v) => v.id);
	function toggle(id) {
		setPicked((prev) => ({
			...prev,
			[id]: prev[id] === false
		}));
	}
	function selectAll(on) {
		const next = {};
		present.forEach((v) => {
			next[v.id] = on;
		});
		setPicked(next);
	}
	function generate() {
		if (!event) return;
		if (selectedIds.length === 0) {
			toast.error("Select at least one present volunteer.");
			return;
		}
		const already = selectedIds.filter((id) => certificateOf(state, id, event.id));
		const added = state.generateCertificates(event.id, selectedIds);
		if (added.length === 0) toast.message("No duplicates. Certificates already generated for the selected names.");
		else if (already.length) toast.success(`Generated ${added.length} new certificate${added.length === 1 ? "" : "s"}. ${already.length} already issued — skipped.`);
		else toast.success(`Generated ${added.length} certificate${added.length === 1 ? "" : "s"}.`);
	}
	function send() {
		if (!event) return;
		const ids = state.certificates.filter((c) => c.eventId === event.id && !c.sentAt && selectedIds.includes(c.volunteerId)).map((c) => c.id);
		if (ids.length === 0) {
			toast.error("Generate first, then send. Only generated certificates go to dashboards.");
			return;
		}
		const n = state.sendCertificates(ids);
		toast.success(`Sent ${n} certificate${n === 1 ? "" : "s"} to volunteer dashboards.`);
	}
	async function printSelected() {
		if (!event) return;
		const rows = present.filter((v) => selectedIds.includes(v.id)).map((v) => {
			const cert = certificateOf(state, v.id, event.id);
			return cert ? {
				cert,
				volunteer: v,
				event
			} : null;
		}).filter((row) => Boolean(row));
		if (rows.length === 0) {
			toast.error("Generate certificates before printing.");
			return;
		}
		openCertificateDocument(await htmlForCertificates(rows, state.settings));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Certificates"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-sm text-muted-foreground",
				children: "Select an event. Volunteers marked present load automatically. Generate, then send — each certificate appears on that registered volunteer's dashboard. The same student cannot receive a second certificate for the same event."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: "Event"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-11 w-full rounded-md border border-border bg-card px-3 text-sm",
							value: event?.id ?? "",
							onChange: (e) => {
								setEventId(e.target.value);
								setPicked({});
							},
							children: events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: e.id,
								children: [
									e.name,
									" — ",
									formatLongDate(e.date),
									" (",
									e.status,
									")"
								]
							}, e.id))
						})]
					}),
					event ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							event.location,
							" · ",
							event.hours,
							" hrs · ",
							present.length,
							" present of ",
							state.volunteers.length,
							" ",
							"volunteers"
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								onClick: generate,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, {}), "Generate certificate"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "forest",
								onClick: send,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {}), "Send to volunteer dashboards"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => void printSelected(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "View / Print"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => selectAll(true),
								children: "Select all"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => selectAll(false),
								children: "Clear"
							})
						]
					})
				]
			}) }),
			present.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "pt-5 text-sm text-muted-foreground",
				children: "No present volunteers for this event. Mark attendance first, then return here."
			}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl border border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[640px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Volunteer ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Name (NSS roll)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Unit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: " "
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: present.map((v) => {
						const cert = event ? certificateOf(state, v.id, event.id) : void 0;
						const on = picked[v.id] !== false;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "size-4 accent-primary",
										checked: on,
										onChange: () => toggle(v.id),
										"aria-label": `Select ${v.fullName}`
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 tabular-nums",
									children: v.volunteerId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-medium",
									children: v.fullName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: v.unit
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: cert?.sentAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "forest",
										children: "Sent to dashboard"
									}) : cert ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "saffron",
										children: "Generated"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "muted",
										children: "Not generated"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: cert && event ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => void htmlForCertificate(cert, v, event, state.settings).then(openCertificateDocument),
										children: "View"
									}) : null
								})
							]
						}, v.id);
					}) })]
				})
			})
		]
	});
}
//#endregion
export { CertificatesPage as component };
