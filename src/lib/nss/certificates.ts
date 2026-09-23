import {
  academicYear,
  certDisplayName,
  formatLongDate,
  parseDob,
} from "./format";

import { openHtmlDocument, openHtmlDocumentWhenReady } from "./print";

import type {
  AttendanceRecord,
  IssuedCertificate,
  NssEvent,
  PortalSettings,
  Volunteer,
} from "./types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCertificateDate(value: string) {
  const raw = String(value || "").slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return formatLongDate(raw);
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const day = Number(match[3]);
  const month = months[Number(match[2]) - 1] ?? match[2];
  return `${day} ${month} ${match[1]}`;
}

export function certificateSerial(
  cert: IssuedCertificate,
  event: NssEvent,
  certificateNumber = 1,
) {
  if (cert.certificateId?.trim()) {
    return cert.certificateId.trim();
  }

  const year = academicYear(event.date);
  return `NSS/${year}/${String(certificateNumber).padStart(4, "0")}`;
}

const CERT_CSS = `
@page {
  size: A4 landscape;
  margin: 0;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  background: #fff;
}
body {
  font-family: "Cormorant Garamond", Georgia, serif;
  color: #171717;
}
.wrap, #print-root { width: 100%; }
.sheet {
  position: relative;
  width: 100%;
  max-width: 297mm;
  aspect-ratio: 1492 / 1054;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  page-break-after: always;
}
.sheet:last-child { page-break-after: auto; }
.certificate-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: fill;
  z-index: 0;
}
.text-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.name {
  position: absolute;
  left: 20%;
  top: 46.3%;
  width: 60%;
  height: 4.0%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: "Dancing Script", cursive;
  text-transform: uppercase;
  font-size: 20pt;
  line-height: 1;
  font-weight: 700;
  color: #173b87;
  white-space: nowrap;
  overflow: hidden;
  background: #f6f1e6;
}
.event-name {
  position: absolute;
  left: 30%;
  top: 55.2%;
  width: 40%;
  height: 3.4%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 16pt;
  line-height: 1.1;
  font-style: normal;
  font-weight: 800;
  color: #b11619;
  white-space: normal;
  overflow: hidden;
  background: #f6f1e6;
}
.year {
  position: absolute;
  left: 51.5%;
  top: 65.2%;
  width: 19%;
  height: 3.4%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 16pt;
  line-height: 1;
  font-weight: 700;
  color: #173a87;
  white-space: nowrap;
  background: #f6f1e6;
}
.cert-id, .date {
  position: absolute;
  top: 77.4%;
  height: 3.1%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: "Noto Sans", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1;
  font-weight: 600;
  color: #173a87;
  white-space: nowrap;
  overflow: hidden;
  background: #f6f1e6;
}
.cert-id { left: 33.8%; width: 18%; }
.date { left: 66.2%; width: 16%; }
.no-print {
  text-align: center;
  margin: 12px 0;
}
.no-print button {
  min-height: 42px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 0;
  font-weight: 700;
  cursor: pointer;
  margin: 0 6px;
}
.print { background: #15803d; color: #fff; }
.close { background: #e2e8f0; color: #111; }
@media screen {
  .sheet { box-shadow: 0 10px 35px rgba(0,0,0,.16); }
}
@media print {
  html, body { background: #fff !important; }
  .sheet {
    box-shadow: none !important;
    width: 297mm;
    height: 210mm;
    max-width: none;
    aspect-ratio: auto;
    margin: 0;
    page-break-after: always;
  }
  .certificate-bg {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .no-print { display: none !important; }
}
@media (max-width: 900px) {
  .sheet { min-width: 0; }
  .name { font-size: 20pt; }
}
`;
async function imageToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) {
    return url;
  }

  const response = await fetch(url, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Certificate template could not be loaded (${response.status}).`);
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not convert certificate template to data URL."));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Could not read certificate template."));
    };

    reader.readAsDataURL(blob);
  });
}

function signatureShortName(fullName: string, fallback: string) {
  const clean = fullName.replace(/^dr\.\s*/i, "").trim();
  if (!clean) return fallback;
  return clean.split(/\s+/)[0] || fallback;
}

function principalSignature(fullName: string) {
  const parts = fullName
    .replace(/^dr\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "T.J.Vyas";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0][0]}.${parts[1]}`;
  return `${parts[0][0]}.${parts[parts.length - 2][0]}.${parts[parts.length - 1]}`;
}

async function certificateSheet(opts: {
  cert: IssuedCertificate;
  volunteer: Volunteer;
  event: NssEvent;
  settings: PortalSettings;
  certificateNumber?: number;
}) {
  let templateDataUrl: string;
  try {
    templateDataUrl = await imageToDataUrl("/images/certificate-template.png");
  } catch {
    templateDataUrl = await imageToDataUrl("/images/certificate-template.jpg");
  }

  const name = escapeHtml(
    certDisplayName(opts.volunteer.fullName).toUpperCase(),
  );
  const eventName = escapeHtml(
    opts.event.name.toUpperCase(),
  );
  const year = escapeHtml(
    academicYear(opts.event.date),
  );
  const eventDate = escapeHtml(
    formatCertificateDate(opts.event.date),
  );
  const serial = escapeHtml(
    certificateSerial(
      opts.cert,
      opts.event,
      opts.certificateNumber ?? 1,
    ),
  );

  return `
    <div class="sheet">
      <img
        class="certificate-bg"
        src="${escapeHtml(templateDataUrl)}"
        alt=""
        aria-hidden="true"
      />
      <div class="text-layer">
        <p class="name">${name}</p>
        <p class="event-name">${eventName}</p>
        <p class="year">${year}</p>
        <p class="cert-id">${serial}</p>
        <p class="date">${eventDate}</p>
      </div>
    </div>
  `;
}

function wrapCertificateDocument(title: string, sheets: string) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Dancing+Script:wght@600;700&family=Noto+Sans:wght@400;600;700&display=swap"
  />
  <style>
    ${CERT_CSS}
  </style>
</head>
<body>
  <div class="wrap">
    <div id="print-root">
      ${sheets}
    </div>

    <script>
      function fitText(el, startPt, minPt) {
        if (!el) return;
        let size = startPt;
        el.style.fontSize = size + "pt";
        while (size > minPt && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
          size -= 1;
          el.style.fontSize = size + "pt";
        }
      }
      window.addEventListener("load", function () {
        document.querySelectorAll(".name").forEach(function (el) { fitText(el, 20, 12); });
        document.querySelectorAll(".event-name").forEach(function (el) { fitText(el, 16, 9); });
      });
    </script>
    <p class="no-print">
      <button class="print" onclick="window.print()">Print / Save PDF</button>
      <button class="close" onclick="window.close()">Close</button>
    </p>
  </div>
</body>
</html>
  `;
}

export async function htmlForCertificate(
  cert: IssuedCertificate,
  volunteer: Volunteer,
  event: NssEvent,
  settings: PortalSettings,
) {
  return wrapCertificateDocument(
    `NSS Certificate — ${volunteer.fullName}`,
    await certificateSheet({
      cert,
      volunteer,
      event,
      settings,
    }),
  );
}

export async function htmlForCertificates(
  rows: Array<{
    cert: IssuedCertificate;
    volunteer: Volunteer;
    event: NssEvent;
  }>,
  settings: PortalSettings,
) {
  const sheets = (
    await Promise.all(
      rows.map((row) =>
        certificateSheet({
          cert: row.cert,
          volunteer: row.volunteer,
          event: row.event,
          settings,
        }),
      ),
    )
  ).join("");

  return wrapCertificateDocument("NSS Certificates", sheets);
}

export function openCertificateDocument(html: string) {
  return openHtmlDocument(html);
}

export function certificateYear(event: NssEvent) {
  const iso = parseDob(event.date) || String(event.date || "");
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "2026";
}

export function parseCertificateSeq(serial?: string | null) {
  const match = String(serial ?? "")
    .trim()
    .match(/^NSS\/(\d{4}(?:-\d{2})?)\/(\d{1,6})$/i);
  if (!match) return null;
  const n = Number(match[2]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatCertificateSerial(year: string | number, seq: number) {
  return `NSS/${year}/${String(seq).padStart(4, "0")}`;
}

export function nextCertificateSeq(certs: IssuedCertificate[]) {
  let max = 0;
  for (const cert of certs) {
    const n = parseCertificateSeq(cert.certificateId);
    if (n != null && n > max) max = n;
  }
  if (max > 0) return max + 1;
  return (certs?.length ?? 0) + 1;
}

export function assignSequentialIds(
  certs: IssuedCertificate[],
  events: NssEvent[],
) {
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
    .sort(
      (a, b) =>
        a.cert.generatedAt.localeCompare(b.cert.generatedAt) || a.index - b.index,
    );

  if (!missing.length) return certs;

  const out = certs.slice();
  for (const row of missing) {
    const event = byEvent.get(row.cert.eventId);
    const year = event
      ? academicYear(event.date)
      : String(row.cert.generatedAt || "2026-27").slice(0, 7);
    out[row.index] = {
      ...row.cert,
      certificateId: formatCertificateSerial(year || "2026-27", next),
    };
    next += 1;
  }
  return out;
}

export function serialOf(cert: IssuedCertificate, event: NssEvent) {
  return cert.certificateId || certificateSerial(cert, event, 1);
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

  for (const cert of certificates) {
    const volunteer = volunteers.find((item) => item.id === cert.volunteerId);
    const event = events.find((item) => item.id === cert.eventId);
    if (!volunteer || !event) continue;
    const serial = serialOf(cert, event);
    if (cert.id.toLowerCase() === q || serial.toLowerCase() === q) {
      return { volunteer, event, serial, cert };
    }
  }

  return null;
}