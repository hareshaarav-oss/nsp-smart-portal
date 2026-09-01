import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as NSS_LOGO } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { c as Smartphone, u as Share } from "../_libs/lucide-react.mjs";
import { i as InstallNspButton } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/install-Cgq4wwcD.js
var import_jsx_runtime = require_jsx_runtime();
function InstallPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "INSTALL NSP",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-lg space-y-6 px-4 pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: NSS_LOGO,
							alt: "NSS emblem",
							className: "mx-auto size-24 rounded-3xl bg-primary object-contain p-3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 font-display text-3xl font-semibold",
							children: "NSS Smart Portal"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm tracking-[0.2em] text-muted-foreground",
							children: "NSP"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted-foreground",
							children: "S.D. Arts & Shah B.R. Commerce College, Mansa"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-4 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm leading-relaxed text-muted-foreground",
						children: [
							"Add this portal to your home screen. The icon is the NSS emblem and the name is",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-foreground",
								children: "NSP"
							}),
							" — NSS Smart Portal."
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallNspButton, {})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2 font-display font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-4 text-saffron" }), "iPhone / iPad"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-decimal space-y-2 pl-5 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"Tap the ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, { className: "inline size-3.5" }),
								" Share button in Safari."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Choose Add to Home Screen." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"Keep the name ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-foreground",
									children: "NSP"
								}),
								" and the NSS logo, then Add."
							] })
						]
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2 font-display font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-4 text-saffron" }), "Android"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-decimal space-y-2 pl-5 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Open this page in Chrome." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap Install (or the button above) — or Chrome menu → Install app." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Confirm. Home screen shows the NSS logo and the name NSP." })
						]
					})]
				}) })
			]
		})
	});
}
//#endregion
export { InstallPage as component };
