import { m as blobToDataUrl, n as COLLEGE_LOGO, r as NSS_LOGO } from "./utils-BIiJ-s-U.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print-CifCDGub.js
var cache = {};
async function logoDataUrls() {
	if (cache.college && cache.nss) return {
		college: cache.college,
		nss: cache.nss
	};
	try {
		const [a, b] = await Promise.all([fetch(COLLEGE_LOGO).then((r) => r.blob()), fetch(NSS_LOGO).then((r) => r.blob())]);
		cache.college = await blobToDataUrl(a);
		cache.nss = await blobToDataUrl(b);
	} catch {
		cache.college = COLLEGE_LOGO;
		cache.nss = NSS_LOGO;
	}
	return {
		college: cache.college,
		nss: cache.nss
	};
}
function openHtmlDocument(html) {
	const blob = new Blob([html], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	if (!window.open(url, "_blank", "noopener,noreferrer")) {
		const a = document.createElement("a");
		a.href = url;
		a.download = "nss-document.html";
		a.click();
	}
	window.setTimeout(() => URL.revokeObjectURL(url), 9e4);
}
//#endregion
export { openHtmlDocument as n, logoDataUrls as t };
