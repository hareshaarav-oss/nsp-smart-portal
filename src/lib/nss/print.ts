import { COLLEGE_LOGO, NSS_LOGO } from "./constants";
import { blobToDataUrl } from "./media";

const cache: { college?: string; nss?: string } = {};

export async function logoDataUrls() {
  if (cache.college && cache.nss) return { college: cache.college, nss: cache.nss };
  try {
    const [a, b] = await Promise.all([
      fetch(COLLEGE_LOGO).then((r) => r.blob()),
      fetch(NSS_LOGO).then((r) => r.blob()),
    ]);
    cache.college = await blobToDataUrl(a);
    cache.nss = await blobToDataUrl(b);
  } catch {
    cache.college = COLLEGE_LOGO;
    cache.nss = NSS_LOGO;
  }
  return { college: cache.college, nss: cache.nss };
}

export function openHtmlDocument(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "nss-document.html";
    a.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 90_000);
}
