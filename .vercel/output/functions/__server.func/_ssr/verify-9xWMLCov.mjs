import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, c as academicYear } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { G as CircleCheck, W as CircleX, l as ShieldCheck, p as Search } from "../_libs/lucide-react.mjs";
import { t as certificateSerial } from "./certificates-BpqtJ9x9.mjs";
import { g as Button, n as Route$19 } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verify-9xWMLCov.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VerifyPage() {
	const { id: initialId } = Route$19.useSearch();
	const [id, setId] = (0, import_react.useState)(initialId);
	const state = useNssStore();
	const result = (0, import_react.useMemo)(() => {
		const query = id.trim().toLowerCase();
		if (!query) return null;
		const cert = (state.certificates ?? []).find((c) => {
			const volunteer = state.volunteers.find((v) => v.id === c.volunteerId);
			const event = state.events.find((e) => e.id === c.eventId);
			return Boolean(volunteer && event && (c.id.toLowerCase() === query || certificateSerial(volunteer, event).toLowerCase() === query));
		});
		if (!cert) return { found: false };
		return {
			found: true,
			cert,
			volunteer: state.volunteers.find((v) => v.id === cert.volunteerId),
			event: state.events.find((e) => e.id === cert.eventId)
		};
	}, [
		id,
		state.certificates,
		state.events,
		state.volunteers
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "PUBLIC CERTIFICATE VERIFICATION",
		current: "home",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl space-y-6 px-4 pb-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "bg-navy text-paper",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {}), " Certificate Verification"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-paper/75",
						children: "Enter the Certificate ID printed on the certificate."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-3 pt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-11 flex-1 rounded-md border border-border bg-card px-3 text-sm",
							value: id,
							onChange: (e) => setId(e.target.value),
							placeholder: "NSS/202627/NSS001/..."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => setId((v) => v.trim()),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {}), " Verify"]
						})]
					})
				})]
			}), result?.found ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-forest/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-4 pt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-forest",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Certificate Verified" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "forest",
									children: "VALID"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "Student",
									value: result.volunteer.fullName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "Event",
									value: result.event.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "Date",
									value: formatLongDate(result.event.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "Certificate ID",
									value: certificateSerial(result.volunteer, result.event)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "College",
									value: state.settings.collegeName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "Academic Year",
									value: academicYear(result.event.date)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Only certificate verification details are shown. Private student information is not exposed."
						})
					]
				})
			}) : result?.found === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-danger/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex items-center gap-2 pt-6 text-danger",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Certificate not found or invalid." })]
				})
			}) : null]
		})
	});
}
function Info({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-medium",
			children: value
		})]
	});
}
//#endregion
export { VerifyPage as component };
