import {
  academicYear,
  certDisplayName,
  formatLongDate,
} from "./format";

import { openHtmlDocument } from "./print";

import type {
  IssuedCertificate,
  NssEvent,
  PortalSettings,
  Volunteer,
} from "./types";

/**
 * Escape HTML special characters.
 */
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Certificate ID.
 *
 * Primary source is the ID already assigned by the store:
 * NSS/2026-27/0001
 *
 * The event-based fallback is kept only for older certificates
 * that were created before certificateId was added.
 */
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

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  background: #fff;
}

body {
  font-family: "Cormorant Garamond", Georgia, serif;
  color: #171717;
}

.wrap,
#print-root {
  width: 100%;
}

.sheet {
  position: relative;
  width: 100%;
  max-width: 297mm;
  aspect-ratio: 1536 / 1024;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  page-break-after: always;
}

.sheet:last-child {
  page-break-after: auto;
}

/*
 * The supplied JPG is the fixed certificate artwork.
 * It is rendered as an actual IMG rather than a CSS background,
 * so it also works correctly inside the Blob URL used by print.ts.
 */
.certificate-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: fill;
  z-index: 0;
}

/*
 * Masks cover ONLY old/sample dynamic text printed in the JPG.
 * Fixed artwork, borders, logos, flag, heading and other artwork
 * remain untouched.
 */
.mask {
  position: absolute;
  background: #fff;
  z-index: 2;
  border-radius: 2px;
}

.mask-name {
  left: 19%;
  top: 33.5%;
  width: 62%;
  height: 12.5%;
}

.mask-copy {
  left: 13%;
  top: 46%;
  width: 74%;
  height: 22.5%;
}

.mask-po {
  left: 4.5%;
  top: 68%;
  width: 29%;
  height: 18%;
}

.mask-principal {
  right: 4.5%;
  top: 68%;
  width: 29%;
  height: 18%;
}

.mask-id {
  left: 18%;
  bottom: 6.2%;
  width: 28%;
  height: 8%;
}

.mask-date {
  right: 18%;
  bottom: 6.2%;
  width: 28%;
  height: 8%;
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
  top: 35.0%;
  width: 60%;
  margin: 0;
  text-align: center;
  font-family: "Dancing Script", cursive;
  font-size: clamp(34px, 4.35vw, 68px);
  line-height: 1.05;
  font-weight: 700;
  color: #b11619;
  white-space: nowrap;
}

.name-line {
  position: absolute;
  left: 20.6%;
  top: 45.1%;
  width: 58.8%;
  height: 1px;
  background: #b58a2d;
}

.copy {
  position: absolute;
  left: 14%;
  top: 47%;
  width: 72%;
  margin: 0;
  text-align: center;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-size: clamp(13px, 1.58vw, 24px);
  line-height: 1.48;
  color: #111;
  font-weight: 500;
}

.copy strong {
  font-style: italic;
  font-weight: 800;
  color: #0c572f;
}

.po-sign,
.principal-sign {
  position: absolute;
  top: 71%;
  width: 22%;
  text-align: center;
  font-family: "Noto Sans", sans-serif;
}

.po-sign {
  left: 7.2%;
}

.principal-sign {
  right: 7.2%;
}

.signature {
  font-family: "Dancing Script", cursive;
  font-size: clamp(22px, 2.4vw, 38px);
  color: #1746a2;
  line-height: 1;
  margin-bottom: 10px;
}

.who {
  font-family: "Noto Sans", sans-serif;
  font-size: clamp(10px, 1.05vw, 16px);
  font-weight: 700;
  color: #173a87;
}

.role {
  margin-top: 4px;
  font-family: "Noto Sans", sans-serif;
  font-size: clamp(9px, 0.95vw, 14px);
  color: #111;
}

.cert-id {
  position: absolute;
  left: 24%;
  bottom: 10.3%;
  width: 18%;
  text-align: center;
  font-family: "Noto Sans", sans-serif;
  font-size: clamp(9px, 0.9vw, 14px);
  color: #111;
  white-space: nowrap;
}

.date {
  position: absolute;
  right: 24%;
  bottom: 10.3%;
  width: 18%;
  text-align: center;
  font-family: "Noto Sans", sans-serif;
  font-size: clamp(9px, 0.9vw, 14px);
  color: #111;
  white-space: nowrap;
}

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

.print {
  background: #15803d;
  color: #fff;
}

.close {
  background: #e2e8f0;
  color: #111;
}

@media screen {
  .sheet {
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.16);
  }
}

@media print {
  html,
  body {
    background: #fff !important;
  }

  .sheet {
    box-shadow: none !important;
    width: 297mm;
    height: 198mm;
    max-width: none;
    aspect-ratio: auto;
    margin: 0;
    page-break-after: always;
  }

  .certificate-bg {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .no-print {
    display: none !important;
  }
}

@media (max-width: 900px) {
  .sheet {
    min-width: 0;
  }

  .name {
    font-size: clamp(28px, 5vw, 54px);
  }
}
`;

/**
 * Convert the fixed template image to a data URL.
 *
 * This is the important fix: the printable HTML is opened from a
 * Blob URL, so the certificate artwork is embedded directly into
 * the HTML instead of depending on /images/... resolving inside
 * the new document.
 */
async function imageToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) {
    return url;
  }

  const response = await fetch(url, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(
      `Certificate template could not be loaded (${response.status}).`,
    );
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

/**
 * Programme Officer signature fallback.
 */
function signatureShortName(
  fullName: string,
  fallback: string,
) {
  const clean = fullName
    .replace(/^dr\.\s*/i, "")
    .trim();

  if (!clean) {
    return fallback;
  }

  const first = clean.split(/\s+/)[0];
  return first || fallback;
}

/**
 * Principal signature fallback.
 */
function principalSignature(fullName: string) {
  const parts = fullName
    .replace(/^dr\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "T.J.Vyas";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0][0]}.${parts[1]}`;
  }

  return `${parts[0][0]}.${parts[parts.length - 2][0]}.${parts[parts.length - 1]}`;
}

/**
 * Create one certificate sheet.
 *
 * NOTE:
 * The public API remains compatible with certificates.tsx:
 * certificateNumber is optional.
 */
async function certificateSheet(opts: {
  cert: IssuedCertificate;
  volunteer: Volunteer;
  event: NssEvent;
  settings: PortalSettings;
  certificateNumber?: number;
}) {
  const configuredTemplate =
    opts.settings.certificateTemplateUrl?.trim();

  const templateUrl =
    configuredTemplate ||
    new URL(
      "/images/certificate-template.jpg",
      window.location.origin,
    ).href;

  let templateDataUrl: string;

  try {
    templateDataUrl = await imageToDataUrl(templateUrl);
  } catch {
    /*
     * If a custom configured template cannot be fetched, fall back
     * to the fixed master template.
     */
    const fallbackUrl = new URL(
      "/images/certificate-template.jpg",
      window.location.origin,
    ).href;

    templateDataUrl = await imageToDataUrl(fallbackUrl);
  }

  const college = escapeHtml(opts.settings.collegeName);

  const name = escapeHtml(
    certDisplayName(opts.volunteer.fullName),
  );

  const eventName = escapeHtml(
    opts.event.name.toUpperCase(),
  );

  const year = escapeHtml(
    academicYear(opts.event.date),
  );

  /*
   * Certificate date is ALWAYS the event/program date.
   * Never generatedAt or sentAt.
   */
  const eventDate = escapeHtml(
    formatLongDate(opts.event.date.slice(0, 10)),
  );

  /*
   * Use the permanent certificateId assigned by store.ts.
   * Older records without certificateId use the optional fallback.
   */
  const serial = escapeHtml(
    certificateSerial(
      opts.cert,
      opts.event,
      opts.certificateNumber ?? 1,
    ),
  );

  const po = escapeHtml(opts.settings.poName);
  const principal = escapeHtml(opts.settings.principalName);

  const poSignature = escapeHtml(
    signatureShortName(
      opts.settings.poName,
      "Haresh",
    ),
  );

  const principalSignatureText = escapeHtml(
    principalSignature(opts.settings.principalName),
  );

  const templateImage = `
    <img
      class="certificate-bg"
      src="${escapeHtml(templateDataUrl)}"
      alt=""
      aria-hidden="true"
    />
  `;

  const poSignatureImage =
    opts.settings.poSignature
      ? `
        <img
          src="${escapeHtml(opts.settings.poSignature)}"
          alt="Programme Officer signature"
          style="
            max-height:42px;
            max-width:140px;
            object-fit:contain;
            display:block;
            margin:0 auto 8px;
          "
        />
      `
      : `
        <div class="signature">${poSignature}</div>
      `;

  const principalSignatureImage =
    opts.settings.principalSignature
      ? `
        <img
          src="${escapeHtml(opts.settings.principalSignature)}"
          alt="Principal signature"
          style="
            max-height:42px;
            max-width:140px;
            object-fit:contain;
            display:block;
            margin:0 auto 8px;
          "
        />
      `
      : `
        <div class="signature">${principalSignatureText}</div>
      `;

  return `
    <div class="sheet">

      ${templateImage}

      <div class="mask mask-name"></div>
      <div class="mask mask-copy"></div>
      <div class="mask mask-po"></div>
      <div class="mask mask-principal"></div>
      <div class="mask mask-id"></div>
      <div class="mask mask-date"></div>

      <div class="text-layer">

        <p class="name">${name}</p>

        <span class="name-line"></span>

        <p class="copy">
          for actively participating with exemplary dedication
          in the
          <strong>${eventName}</strong>
          organised by the<br />

          National Service Scheme Unit of
          <strong>${college.toUpperCase()}</strong>
          <br />

          during the academic year
          <strong>${year}</strong>.
          We highly appreciate their sincere efforts,
          active involvement<br />

          and valuable contribution towards community
          service and nation-building.
        </p>

        <div class="po-sign">
          ${poSignatureImage}

          <div class="who">${po}</div>

          <div class="role">
            NSS Program Officer
          </div>
        </div>

        <div class="principal-sign">
          ${principalSignatureImage}

          <div class="who">${principal}</div>

          <div class="role">
            Principal
          </div>
        </div>

        <div class="cert-id">
          Certificate ID : ${serial}
        </div>

        <div class="date">
          Date : ${eventDate}
        </div>

      </div>
    </div>
  `;
}

/**
 * Wrap certificates in printable HTML document.
 */
function wrapCertificateDocument(
  title: string,
  sheets: string,
) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>${escapeHtml(title)}</title>

  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
  />

  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
  />

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

    <p class="no-print">
      <button
        class="print"
        onclick="window.print()"
      >
        Print / Save PDF
      </button>

      <button
        class="close"
        onclick="window.close()"
      >
        Close
      </button>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Single certificate.
 *
 * Kept at 4 required arguments so the existing certificates.tsx
 * does not need to be changed.
 */
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

/**
 * Multiple certificates.
 *
 * Kept at 2 required arguments so the existing certificates.tsx
 * does not need to be changed.
 */
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

  return wrapCertificateDocument(
    "NSS Certificates",
    sheets,
  );
}

/**
 * Open printable certificate document.
 */
export function openCertificateDocument(
  html: string,
) {
  openHtmlDocument(html);
}