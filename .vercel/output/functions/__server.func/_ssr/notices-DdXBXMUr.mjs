import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, R as todayIso, l as activeVolunteers } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { x as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-CRsubrpt.mjs";
import { n as WhatsAppSendPanel, o as noticeBroadcastText, r as audienceLabel } from "./whatsapp-send-CZgw5BdW.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notices-DdXBXMUr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NoticesPage() {
	const state = useNssStore();
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [audience, setAudience] = (0, import_react.useState)("all");
	const [broadcast, setBroadcast] = (0, import_react.useState)(null);
	function publish(openWhatsApp) {
		if (!title.trim() || !body.trim()) return;
		const n = state.addNotice({
			title: title.trim(),
			body: body.trim(),
			date: todayIso(),
			audience
		});
		toast.success("Notice published");
		if (openWhatsApp) {
			setBroadcast({
				text: noticeBroadcastText(n.title, n.body, state.settings.collegeName),
				audience: n.audience
			});
			window.setTimeout(() => document.getElementById("wa-all")?.scrollIntoView({ behavior: "smooth" }), 80);
		}
		setTitle("");
		setBody("");
	}
	function add(e) {
		e.preventDefault();
		publish(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Notices"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "pt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-3",
					onSubmit: add,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: title,
								onChange: (e) => setTitle(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Notice (Gujarati or English)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "gu",
								value: body,
								onChange: (e) => setBody(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Audience" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-10 rounded-md border border-border bg-card px-3 text-sm",
								value: audience,
								onChange: (e) => setAudience(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: "All (girls + boys groups)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "girls",
										children: "Girls group only"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "boys",
										children: "Boys group only"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "leaders",
										children: "Leaders group"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {}), "Publish & WhatsApp"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => publish(false),
								children: "Publish only"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Girls events go only to the girls group, boys to the boys group, all to both, leaders to the leaders group. Individual chats remain available below the group buttons."
						})
					]
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: state.notices.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: n.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: formatLongDate(n.date)
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: n.audience === "all" ? "muted" : "navy",
								children: audienceLabel(n.audience)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "gu mt-2 text-sm leading-relaxed",
							children: n.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: () => {
									setBroadcast({
										text: noticeBroadcastText(n.title, n.body, state.settings.collegeName),
										audience: n.audience
									});
									window.setTimeout(() => document.getElementById("wa-all")?.scrollIntoView({ behavior: "smooth" }), 80);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {}), "WhatsApp"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => state.deleteNotice(n.id),
								children: "Delete"
							})]
						})
					]
				}) }, n.id))
			}),
			broadcast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppSendPanel, {
				title: `Send this notice to ${audienceLabel(broadcast.audience).toLowerCase()} on WhatsApp`,
				recipients: activeVolunteers(state),
				message: broadcast.text,
				audience: broadcast.audience
			}, broadcast.text + broadcast.audience) : null
		]
	});
}
//#endregion
export { NoticesPage as component };
