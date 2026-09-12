import { academicYear, certDisplayName, formatLongDate, parseDob } from "./format";
import { openHtmlDocument, openHtmlDocumentWhenReady, toDataUrl } from "./print";
import { qrSvg } from "./qr";
import type { AttendanceRecord, IssuedCertificate, NssEvent, PortalSettings, Volunteer } from "./types";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;")
    .replaceAll("'", "&#39;");
}

function eventCodeOf(event: NssEvent) {
  return event.id.replace(/^evt-/, "").slice(0, 8).toUpperCase();
}

export function certificateYear(event: NssEvent) {
  const iso = parseDob(event.date) || String(event.date || "");
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "2026";
}

export function parseCertificateSeq(serial?: string | null) {
  const m = String(serial ?? "")
    .trim()
    .match(/^NSS\/(\d{4})\/(\d{1,6})$/i);
  if (!m) return null;
  const n = Number(m[2]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatCertificateSerial(year: string | number, seq: number) {
  return `NSS/${year}/${String(seq).padStart(3, "0")}`;
}

/** Next running number. Continues across events — 1–50 then 51. */
export function nextCertificateSeq(certs: IssuedCertificate[]) {
  let max = 0;
  for (const cert of certs) {
    const n = parseCertificateSeq(cert.certificateId);
    if (n != null && n > max) max = n;
  }
  if (max > 0) return max + 1;
  return (certs?.length ?? 0) + 1;
}

export function assignSequentialIds(certs: IssuedCertificate[], events: NssEvent[]) {
  if (!certs.length) return certs;
  const byEvent = new Map(events.map((event) => [event.id, event]));
  const rows = certs.map((cert, index) => ({
    cert,
    index,
    n: parseCertificateSeq(cert.certificateId),
  }));
  let next = 1;
  for (const row of rows) {
    if (row.n != null) next = Math.max(next, row.n + 1);
  }
  const missing = rows
    .filter((row) => row.n == null)
    .sort((a, b) => a.cert.generatedAt.localeCompare(b.cert.generatedAt) || a.index - b.index);
  if (!missing.length) return certs;
  const out = certs.slice();
  for (const row of missing) {
    const event = byEvent.get(row.cert.eventId);
    const year = event ? certificateYear(event) : String(row.cert.generatedAt || "2026").slice(0, 4);
    out[row.index] = { ...row.cert, certificateId: formatCertificateSerial(year || "2026", next) };
    next += 1;
  }
  return out;
}

export function serialOf(cert: IssuedCertificate, event: NssEvent) {
  return cert.certificateId || formatCertificateSerial(certificateYear(event), 1);
}

export function legacyCertificateSerials(volunteer: Volunteer, event: NssEvent) {
  const year = academicYear(event.date);
  const eventCode = eventCodeOf(event);
  const id = volunteer.volunteerId;
  return [
    `NSS/${year}/${id}/${eventCode}`,
    `NSS/${year.replace("-", "")}/${id}/${eventCode}`,
    `NSS/${certificateYear(event)}/${id}`,
  ];
}

/** @deprecated Prefer stored sequential IDs. Kept so old QR codes still verify. */
export function certificateSerial(volunteer: Volunteer, event: NssEvent) {
  return legacyCertificateSerials(volunteer, event)[0];
}

function certDateIso(event: NssEvent, fallback?: string) {
  return parseDob(event.date) || parseDob(fallback || "") || String(event.date || fallback || "").slice(0, 10);
}

const CERT_CSS = `
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #e8eef6; }
body { font-family: "Cormorant Garamond", Georgia, serif; color: #171717; -webkit-text-size-adjust: 100%; }
.wrap { width: 100%; padding: 10px 8px 24px; }
#print-root { width: 100%; }
.sheet {
  position: relative;
  width: min(100%, 297mm);
  max-width: 297mm;
  aspect-ratio: 3 / 2;
  margin: 0 auto 18px;
  overflow: hidden;
  page-break-after: always;
  background: #fff;
  container-type: inline-size;
}
.sheet:last-of-type { page-break-after: auto; margin-bottom: 0; }
.sheet img.bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: fill; z-index: 0; display: block;
}
.text-layer { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.name {
  position: absolute; left: 8%; top: 35.3%; width: 84%; height: 8.4%;
  margin: 0; display: flex; align-items: center; justify-content: center;
  text-align: center;
  font-family: "Dancing Script", cursive;
  font-style: normal; font-weight: 700; color: #b11619;
  font-size: 52px; font-size: var(--name-size, 5.35cqw);
  line-height: 1.02; letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: visible;
  font-variant: normal; text-transform: none; font-synthesis: none;
}
.copy {
  position: absolute; left: 11%; top: 46.6%; width: 78%; height: 18.8%;
  margin: 0; text-align: center; font-style: italic;
  font-size: 20px; font-size: 1.95cqw;
  line-height: 1.38; color: #1a1a1a; font-weight: 500;
  overflow: visible;
}
.copy strong { font-style: italic; font-weight: 700; color: #1a1a1a; }
.cert-id, .date {
  position: absolute; top: 86.35%;
  font-family: "Noto Sans", sans-serif;
  font-size: 13px; font-size: 1.18cqw; font-weight: 600; color: #1a1a1a;
  line-height: 1.2; letter-spacing: 0.02em;
  white-space: nowrap;
}
.cert-id { left: 7%; width: 38%; text-align: center; }
.date { left: 55%; width: 38%; text-align: center; }
.qr {
  position: absolute; left: 50%; top: 75.4%; transform: translateX(-50%);
  width: 5.4%; background: #fff; padding: 3px; border-radius: 3px; z-index: 4;
}
.qr svg { width: 100%; height: auto; display: block; }
.no-print { text-align: center; margin: 12px 0 0; }
.no-print button { min-height: 42px; padding: 8px 16px; border-radius: 10px; border: 0; font-weight: 700; cursor: pointer; margin: 0 6px; }
.print { background: #15803d; color: #fff; }
.close { background: #e2e8f0; }
@media screen {
  .sheet { box-shadow: 0 10px 35px rgba(0,0,0,.16); }
}
@media print {
  html, body { background: #fff !important; }
  .wrap { padding: 0; overflow: visible; }
  .sheet {
    width: 297mm !important;
    max-width: 297mm !important;
    box-shadow: none !important;
    margin: 0 auto;
  }
  .no-print { display: none !important; }
}
`;

function nameFontSize(name: string) {
  const n = name.length;
  if (n > 42) return "2.7cqw";
  if (n > 36) return "3.3cqw";
  if (n > 28) return "4.0cqw";
  if (n > 22) return "4.6cqw";
  if (n > 16) return "5.0cqw";
  return "5.35cqw";
}

function verifyHref(serial: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://nsp-smart-portal.vercel.app";
  return `${origin}/verify?id=${encodeURIComponent(serial)}`;
}

type SheetAssets = {
  template: string;
};

function certificateSheet(opts: {
  volunteer: Volunteer;
  event: NssEvent;
  settings: PortalSettings;
  issuedOn: string;
  serial: string;
  assets: SheetAssets;
  qr?: string;
}) {
  const college = escapeHtml(opts.settings.collegeName);
  const name = escapeHtml(certDisplayName(opts.volunteer.fullName));
  const eventName = escapeHtml(opts.event.name);
  const serial = escapeHtml(opts.serial);
  const issued = escapeHtml(formatLongDate(opts.issuedOn));
  const year = escapeHtml(academicYear(opts.event.date));
  const qrBlock = opts.qr ? `<div class="qr" title="Scan to verify">${opts.qr}</div>` : "";

  return `<div class="sheet">
    <img class="bg" src="${opts.assets.template}" alt="" />
    <div class="text-layer">
      <p class="name" style="--name-size:${nameFontSize(name)}">${name}</p>
      <p class="copy">
        for actively participating with exemplary dedication in the <strong>${eventName}</strong>
        organised by the National Service Scheme Unit of <strong>${college.toUpperCase()}</strong>
        during the academic year <strong>${year}</strong>. We highly appreciate their sincere efforts,
        active involvement and valuable contribution towards community service and nation-building.
      </p>
      <div class="cert-id">Certificate ID : ${serial}</div>
      <div class="date">Date : ${issued}</div>
      ${qrBlock}
    </div>
  </div>`;
}

function wrapCertificateDocument(title: string, sheets: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Dancing+Script:wght@600;700&family=Noto+Sans:wght@400;600;700&display=swap" />
  <style>${CERT_CSS}</style>
</head>
<body>
  <div class="wrap">
    <div id="print-root">${sheets}</div>
    <p class="no-print">
      <button class="print" onclick="window.print()">Print / Save PDF</button>
      <button class="close" onclick="window.close()">Close</button>
    </p>
  </div>
</body>
</html>`;
}

async function loadSheetAssets(settings: PortalSettings): Promise<SheetAssets> {
  void settings;
  const bundled = "/images/certificate-template.jpg?v=20260912f";
  const template = await toDataUrl(bundled);
  return { template: template || bundled };
}

async function qrFor(serial: string, settings: PortalSettings) {
  if (settings.certificateQrEnabled === false) return "";
  try {
    return await qrSvg(verifyHref(serial), 96);
  } catch {
    return "";
  }
}

export function preparedCertificate(
  volunteer: Volunteer,
  event: NssEvent,
  existing?: IssuedCertificate,
): IssuedCertificate {
  return (
    existing ?? {
      id: `crt-${event.id}-${volunteer.id}`,
      volunteerId: volunteer.id,
      eventId: event.id,
      generatedAt: event.date || new Date().toISOString(),
      sentAt: null,
      printReady: true,
    }
  );
}

export async function htmlForCertificate(
  cert: IssuedCertificate,
  volunteer: Volunteer,
  event: NssEvent,
  settings: PortalSettings,
) {
  const serial = serialOf(cert, event);
  const [assets, qr] = await Promise.all([loadSheetAssets(settings), qrFor(serial, settings)]);
  return wrapCertificateDocument(
    `NSS Certificate — ${volunteer.fullName}`,
    certificateSheet({
      volunteer,
      event,
      settings,
      issuedOn: certDateIso(event, cert.sentAt || cert.generatedAt),
      serial,
      assets,
      qr,
    }),
  );
}

export async function htmlForCertificates(
  rows: Array<{ cert: IssuedCertificate; volunteer: Volunteer; event: NssEvent }>,
  settings: PortalSettings,
) {
  const assets = await loadSheetAssets(settings);
  const sheets = (
    await Promise.all(
      rows.map(async (row) => {
        const serial = serialOf(row.cert, row.event);
        return certificateSheet({
          volunteer: row.volunteer,
          event: row.event,
          settings,
          issuedOn: certDateIso(row.event, row.cert.sentAt || row.cert.generatedAt),
          serial,
          assets,
          qr: await qrFor(serial, settings),
        });
      }),
    )
  ).join("");
  return wrapCertificateDocument("NSS Certificates", sheets);
}

export function openCertificateDocument(html: string) {
  return openHtmlDocument(html);
}

export function openPreparedCertificate(prepare: () => Promise<string>) {
  return openHtmlDocumentWhenReady(prepare);
}

export type CertificateLookup = {
  volunteer: Volunteer;
  event: NssEvent;
  serial: string;
  cert?: IssuedCertificate;
};

export function resolveCertificate(
  state: {
    volunteers: Volunteer[];
    events: NssEvent[];
    certificates?: IssuedCertificate[];
    attendance?: AttendanceRecord[];
  },
  query: string,
): CertificateLookup | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const volunteers = state.volunteers ?? [];
  const events = state.events ?? [];
  const certificates = state.certificates ?? [];
  const attendance = state.attendance ?? [];

  for (const cert of certificates) {
    const volunteer = volunteers.find((v) => v.id === cert.volunteerId);
    const event = events.find((e) => e.id === cert.eventId);
    if (!volunteer || !event) continue;
    const serial = serialOf(cert, event);
    const aliases = legacyCertificateSerials(volunteer, event);
    if (
      cert.id.toLowerCase() === q ||
      serial.toLowerCase() === q ||
      aliases.some((alias) => alias.toLowerCase() === q)
    ) {
      return { volunteer, event, serial, cert };
    }
  }

  for (const volunteer of volunteers) {
    for (const event of events) {
      const aliases = legacyCertificateSerials(volunteer, event);
      if (!aliases.some((alias) => alias.toLowerCase() === q)) continue;
      const issued = certificates.find((c) => c.volunteerId === volunteer.id && c.eventId === event.id);
      const present = attendance.some(
        (row) => row.volunteerId === volunteer.id && row.eventId === event.id && row.present,
      );
      if (!issued && !present) continue;
      return { volunteer, event, serial: issued ? serialOf(issued, event) : aliases[0], cert: issued };
    }
  }

  return null;
}
