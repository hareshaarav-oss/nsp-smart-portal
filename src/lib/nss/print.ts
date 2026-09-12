import { COLLEGE_LOGO, NSS_LOGO } from "./constants";
import { blobToDataUrl } from "./media";

const cache: { college?: string; nss?: string } = {};

export async function toDataUrl(src: string | undefined | null): Promise<string> {
  const value = String(src ?? "").trim();
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  try {
    const url =
      value.startsWith("/") && typeof window !== "undefined"
        ? new URL(value, window.location.origin).toString()
        : value;
    const res = await fetch(url);
    if (!res.ok) return value;
    return await blobToDataUrl(await res.blob());
  } catch {
    return value;
  }
}

export async function logoDataUrls() {
  if (cache.college && cache.nss) return { college: cache.college, nss: cache.nss };
  try {
    const [college, nss] = await Promise.all([toDataUrl(COLLEGE_LOGO), toDataUrl(NSS_LOGO)]);
    cache.college = college || COLLEGE_LOGO;
    cache.nss = nss || NSS_LOGO;
  } catch {
    cache.college = COLLEGE_LOGO;
    cache.nss = NSS_LOGO;
  }
  return { college: cache.college, nss: cache.nss };
}

function downloadHtml(html: string, filename = "nss-document.html") {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function writeWindow(win: Window, html: string) {
  win.document.open();
  win.document.write(html);
  win.document.close();
  try {
    win.focus();
  } catch {
    /* ignore */
  }
}

/** Open a print window. Pass HTML directly, or a prepare() that runs AFTER the window is opened so pop-up blockers do not fire. */
export function openHtmlDocument(html: string) {
  const win = window.open("about:blank", "_blank");
  if (win) {
    writeWindow(win, html);
    return true;
  }
  downloadHtml(html);
  return false;
}

export async function openHtmlDocumentWhenReady(prepare: () => Promise<string>) {
  const win = window.open("about:blank", "_blank");
  if (win) {
    try {
      writeWindow(
        win,
        `<!doctype html><html><head><meta charset="utf-8" /><title>NSP</title></head><body style="margin:0;font-family:Georgia,serif;background:#13294b;color:#f7f3ea;display:grid;min-height:100vh;place-items:center"><p>Preparing NSS document…</p></body></html>`,
      );
    } catch {
      /* ignore */
    }
    try {
      writeWindow(win, await prepare());
      return true;
    } catch (error) {
      try {
        win.close();
      } catch {
        /* ignore */
      }
      throw error;
    }
  }
  downloadHtml(await prepare());
  return false;
}
