import { i as __toESM } from "../_runtime.mjs";
import { t as require_lib } from "../_libs/qrcode.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/qr-r2hriz89.js
var import_lib = /* @__PURE__ */ __toESM(require_lib());
async function qrSvg(text, size = 96) {
	return import_lib.toString(text, {
		type: "svg",
		margin: 1,
		width: size,
		errorCorrectionLevel: "M",
		color: {
			dark: "#13294b",
			light: "#ffffff"
		}
	});
}
//#endregion
export { qrSvg as t };
