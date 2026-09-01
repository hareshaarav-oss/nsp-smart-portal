import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as cn } from "./utils-BIiJ-s-U.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-BMh2Hxac.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "navy", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
			navy: "bg-primary text-primary-foreground",
			forest: "bg-forest text-forest-foreground",
			saffron: "bg-saffron text-saffron-foreground",
			muted: "bg-muted text-muted-foreground",
			danger: "bg-danger/12 text-danger"
		}[tone], className),
		...props
	});
}
//#endregion
export { Badge as t };
