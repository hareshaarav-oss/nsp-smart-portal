import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate } from "./utils-BIiJ-s-U.mjs";
import { t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
import { t as MediaThumb } from "./media-thumb-CiIriRxi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gallery-DdTf9O-d.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GalleryPage() {
	const gallery = useNssStore((s) => s.gallery) ?? [];
	const folders = (0, import_react.useMemo)(() => {
		return [...new Set(gallery.map((g) => g.folder || g.eventName || "General"))].sort();
	}, [gallery]);
	const [folder, setFolder] = (0, import_react.useState)("all");
	const shown = gallery.filter((g) => folder === "all" || (g.folder || g.eventName || "General") === folder);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl px-4 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title: "Activity photographs",
				compact: true,
				className: "mb-6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: "Activity photographs"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Event-wise folders. Photos saved from the PO desk also appear on Home."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: folder === "all" ? "default" : "outline",
					onClick: () => setFolder("all"),
					children: "All"
				}), folders.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: folder === name ? "default" : "outline",
					onClick: () => setFolder(name),
					children: name
				}, name))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: shown.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "overflow-hidden rounded-xl border border-border bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaThumb, {
						item,
						className: "aspect-4/3 w-full bg-navy object-contain",
						controls: item.kind === "video"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
						className: "px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: item.caption
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								item.folder || item.eventName,
								" · ",
								formatLongDate(item.date),
								item.kind === "video" ? " · Video" : ""
							]
						})]
					})]
				}, item.id))
			})
		]
	}) });
}
//#endregion
export { GalleryPage as component };
