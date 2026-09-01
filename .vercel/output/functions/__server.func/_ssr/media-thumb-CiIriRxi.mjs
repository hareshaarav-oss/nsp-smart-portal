import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { k as getMedia } from "./utils-BIiJ-s-U.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media-thumb-CiIriRxi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useMediaUrl(mediaKey, fallback = "") {
	const [url, setUrl] = (0, import_react.useState)(fallback);
	(0, import_react.useEffect)(() => {
		let alive = true;
		let objectUrl = "";
		if (!mediaKey) {
			setUrl(fallback);
			return;
		}
		getMedia(mediaKey).then((blob) => {
			if (!alive) return;
			if (!blob) {
				setUrl(fallback);
				return;
			}
			objectUrl = URL.createObjectURL(blob);
			setUrl(objectUrl);
		});
		return () => {
			alive = false;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [mediaKey, fallback]);
	return url;
}
function MediaThumb({ item, className, controls = false, preferPoster = false }) {
	const url = useMediaUrl(item.mediaKey, item.src);
	const poster = useMediaUrl(item.posterKey, "");
	if (!url && !poster) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className });
	if (item.kind === "video") {
		if (preferPoster && poster) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: poster,
			alt: item.caption,
			className
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src: url,
			poster: poster || void 0,
			className,
			controls,
			playsInline: true,
			muted: !controls
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: url,
		alt: item.caption,
		className
	});
}
//#endregion
export { MediaThumb as t };
