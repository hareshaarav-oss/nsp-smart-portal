import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, W as waPhone } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { v as Phone, x as MessageCircle } from "../_libs/lucide-react.mjs";
import { t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contact-Y5v5OfBa.js
var import_jsx_runtime = require_jsx_runtime();
function ContactPage() {
	const settings = useNssStore((s) => s.settings);
	const phone = waPhone(settings.poWhatsapp);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-6 px-4 pb-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
			title: "Contact NSS Unit",
			compact: true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "space-y-4 pt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: settings.collegeName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Mansa, Gandhinagar, Gujarat"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-forest",
						children: "Programme Officer"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: settings.poName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: ["Mobile / WhatsApp: ", settings.poWhatsapp]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-forest",
					children: "Principal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: settings.principalName
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `https://wa.me/${phone}`,
							target: "_blank",
							rel: "noreferrer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {}), "WhatsApp the Programme Officer"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `tel:${settings.poWhatsapp}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {}), "Call"]
						})
					})]
				})
			]
		}) })]
	}) });
}
//#endregion
export { ContactPage as component };
