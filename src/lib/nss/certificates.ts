import { academicYear, certDisplayName, formatLongDate } from "./format";
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

export function certificateSerial(volunteer: Volunteer, event: NssEvent) {
  const year = academicYear(event.date).replace("-", "");
  const eventCode = event.id.replace(/^evt-/, "").slice(0, 8).toUpperCase();
  return `NSS/${year}/${volunteer.volunteerId}/${eventCode}`;
}

const CERT_CSS = `
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #e8eef6; }
body { font-family: "Cormorant Garamond", Georgia, serif; color: #171717; }
.wrap { width: 100%; padding: 16px 12px 28px; }
#print-root { width: 100%; }
.sheet {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  max-width: 297mm;
  margin: 0 auto 18px;
  overflow: hidden;
  page-break-after: always;
  background: #fff;
}
.sheet:last-of-type { page-break-after: auto; margin-bottom: 0; }
.sheet img.bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: fill; z-index: 0; display: block;
}
.mask { position: absolute; background: rgba(255,255,255,.988); border-radius: 3px; z-index: 2; }
.mask-name { left: 18%; top: 34.5%; width: 64%; height: 12.2%; }
.mask-copy { left: 14%; top: 46.0%; width: 72%; height: 21.5%; }
.mask-po { left: 5.5%; top: 70.0%; width: 25%; height: 14.8%; }
.mask-principal { right: 5.5%; top: 70.0%; width: 25%; height: 14.8%; }
.mask-id { left: 21%; bottom: 8.1%; width: 24%; height: 5.2%; }
.mask-date { right: 21%; bottom: 8.1%; width: 24%; height: 5.2%; }
.text-layer { position: absolute; inset: 0; z-index: 3; }
.name {
  position: absolute; left: 12%; top: 35.6%; width: 76%;
  margin: 0; text-align: center; font-family: "Dancing Script", cursive;
  line-height: 1.08; font-weight: 700; color: #b11619;
  white-space: nowrap; overflow: hidden;
}
.name-line {
  position: absolute; left: 20.6%; top: 45.1%; width: 58.8%; height: 1px; background: #b58a2d;
}
.copy {
  position: absolute; left: 15%; top: 46.6%; width: 70%;
  margin: 0; text-align: center; font-style: italic; font-size: clamp(12px, 1.55vw, 23px);
  line-height: 1.48; color: #111; font-weight: 500;
}
.copy strong { font-style: italic; font-weight: 800; color: #0c572f; }
.po-sign, .principal-sign {
  position: absolute; top: 70.6%; width: 22%; text-align: center;
  font-family: "Noto Sans", sans-serif;
}
.po-sign { left: 7.2%; }
.principal-sign { right: 7.2%; }
.signature {
  font-family: "Dancing Script", cursive; font-size: clamp(22px, 2.4vw, 38px);
  color: #1746a2; line-height: 1; margin-bottom: 8px;
}
.who { font-size: clamp(10px, 1.05vw, 16px); font-weight: 700; color: #173a87; }
.role { margin-top: 3px; font-size: clamp(9px, .95vw, 14px); color: #111; }
.cert-id {
  position: absolute; left: 22%; bottom: 9.4%; width: 22%;
  text-align: center; font-family: "Noto Sans", sans-serif; font-size: clamp(8px, .88vw, 13px); color: #111;
}
.date {
  position: absolute; right: 22%; bottom: 9.4%; width: 22%;
  text-align: center; font-family: "Noto Sans", sans-serif; font-size: clamp(8px, .88vw, 13px); color: #111;
}
.qr {
  position: absolute; left: 50%; bottom: 7.6%; transform: translateX(-50%);
  width: 8.2%; background: #fff; padding: 2px; border-radius: 4px; z-index: 4;
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
  .wrap { padding: 0; }
  .sheet { box-shadow: none !important; max-width: none; width: 297mm; height: 210mm; aspect-ratio: auto; margin: 0; }
  .no-print { display: none !important; }
}
`;

function signatureShortName(fullName: string, fallback: string) {
  const clean = fullName.replace(/^dr\.\s*/i, "").trim();
  if (!clean) return fallback;
  const first = clean.split(/\s+/)[0];
  return first || fallback;
}

function principalSignature(fullName: string) {
  const parts = fullName.replace(/^dr\.\s*/i, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "T.J.Vyas";
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}.${parts[parts.length - 1]}`;
}

function nameFontSize(name: string) {
  const n = name.length;
  if (n > 34) return "clamp(20px, 2.6vw, 40px)";
  if (n > 28) return "clamp(24px, 3.2vw, 50px)";
  if (n > 22) return "clamp(28px, 3.8vw, 58px)";
  return "clamp(34px, 4.4vw, 67px)";
}

function verifyHref(serial: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://nsp-smart-portal.vercel.app";
  return `${origin}/verify?id=${encodeURIComponent(serial)}`;
}

type SheetAssets = {
  template: string;
  poSignature: string;
  principalSignature: string;
};

function certificateSheet(opts: {
  volunteer: Volunteer;
  event: NssEvent;
  settings: PortalSettings;
  issuedOn: string;
  assets: SheetAssets;
  qr?: string;
}) {
  const college = escapeHtml(opts.settings.collegeName);
  const name = escapeHtml(certDisplayName(opts.volunteer.fullName));
  const eventName = escapeHtml(opts.event.name.toUpperCase());
  const po = escapeHtml(opts.settings.poName);
  const principal = escapeHtml(opts.settings.principalName);
  const serial = escapeHtml(certificateSerial(opts.volunteer, opts.event));
  const issued = escapeHtml(formatLongDate(opts.issuedOn.slice(0, 10)));
  const year = escapeHtml(academicYear(opts.event.date));
  const poSignature = escapeHtml(signatureShortName(opts.settings.poName, "Haresh"));
  const principalSignatureText = escapeHtml(principalSignature(opts.settings.principalName));
  const poSignatureImage = opts.assets.poSignature
    ? `<img src="${opts.assets.poSignature}" alt="Programme Officer signature" style="max-height:42px;max-width:140px;object-fit:contain;display:block;margin:0 auto 8px;" />`
    : `<div class="signature">${poSignature}</div>`;
  const principalSignatureImage = opts.assets.principalSignature
    ? `<img src="${opts.assets.principalSignature}" alt="Principal signature" style="max-height:42px;max-width:140px;object-fit:contain;display:block;margin:0 auto 8px;" />`
    : `<div class="signature">${principalSignatureText}</div>`;
  const qrBlock = opts.qr ? `<div class="qr" title="Scan to verify">${opts.qr}</div>` : "";

  return `<div class="sheet">
    <img class="bg" src="${opts.assets.template}" alt="" />
    <div class="mask mask-name"></div>
    <div class="mask mask-copy"></div>
    <div class="mask mask-po"></div>
    <div class="mask mask-principal"></div>
    <div class="mask mask-id"></div>
    <div class="mask mask-date"></div>
    <div class="text-layer">
      <p class="name" style="font-size:${nameFontSize(name)}">${name}</p>
      <span class="name-line"></span>
      <p class="copy">
        for actively participating with exemplary dedication in the <strong>${eventName}</strong> organised by the<br/>
        National Service Scheme Unit of <strong>${college.toUpperCase()}</strong><br/>
        during the academic year <strong>${year}</strong>. We highly appreciate their sincere efforts, active involvement<br/>
        and valuable contribution towards community service and nation-building.
      </p>
      <div class="po-sign">
        ${poSignatureImage}
        <div class="who">${po}</div>
        <div class="role">NSS Program Officer</div>
      </div>
      <div class="principal-sign">
        ${principalSignatureImage}
        <div class="who">${principal}</div>
        <div class="role">Principal</div>
      </div>
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
  const templateSrc = settings.certificateTemplateUrl || "/images/certificate-template.jpg";
  const [template, poSignature, principalSignature] = await Promise.all([
    toDataUrl(templateSrc),
    toDataUrl(settings.poSignature),
    toDataUrl(settings.principalSignature),
  ]);
  return {
    template: template || "/images/certificate-template.jpg",
    poSignature,
    principalSignature,
  };
}

async function qrFor(volunteer: Volunteer, event: NssEvent, settings: PortalSettings) {
  if (settings.certificateQrEnabled === false) return "";
  try {
    return await qrSvg(verifyHref(certificateSerial(volunteer, event)), 96);
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
      certificateId: certificateSerial(volunteer, event),
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
  const [assets, qr] = await Promise.all([loadSheetAssets(settings), qrFor(volunteer, event, settings)]);
  return wrapCertificateDocument(
    `NSS Certificate — ${volunteer.fullName}`,
    certificateSheet({
      volunteer,
      event,
      settings,
      issuedOn: event.date || cert.sentAt || cert.generatedAt,
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
      rows.map(async (row) =>
        certificateSheet({
          volunteer: row.volunteer,
          event: row.event,
          settings,
          issuedOn: row.event.date || row.cert.sentAt || row.cert.generatedAt,
          assets,
          qr: await qrFor(row.volunteer, row.event, settings),
        }),
      ),
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
    const serial = cert.certificateId || certificateSerial(volunteer, event);
    if (cert.id.toLowerCase() === q || serial.toLowerCase() === q) {
      return { volunteer, event, serial, cert };
    }
  }

  for (const volunteer of volunteers) {
    for (const event of events) {
      const serial = certificateSerial(volunteer, event);
      if (serial.toLowerCase() !== q) continue;
      const issued = certificates.find((c) => c.volunteerId === volunteer.id && c.eventId === event.id);
      const present = attendance.some(
        (row) => row.volunteerId === volunteer.id && row.eventId === event.id && row.present,
      );
      if (!issued && !present) continue;
      return { volunteer, event, serial, cert: issued };
    }
  }

  return null;
}
