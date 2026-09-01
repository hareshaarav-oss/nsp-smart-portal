import { A as idCardName, c as academicYear } from "./utils-BIiJ-s-U.mjs";
import { n as openHtmlDocument, t as logoDataUrls } from "./print-CifCDGub.mjs";
import { t as qrSvg } from "./qr-r2hriz89.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/id-card-BhQsWlP5.js
function escapeHtml(s) {
	return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
var AVATAR = `<svg viewBox="0 0 80 96" xmlns="http://www.w3.org/2000/svg" class="photo">
  <rect width="80" height="96" rx="12" fill="#dbeafe"/>
  <circle cx="40" cy="32" r="16" fill="#93c5fd"/>
  <path d="M14 92c2-22 14-32 26-32s24 10 26 32" fill="#3b82f6"/>
  <rect x="28" y="52" width="24" height="18" rx="2" fill="#1e3a8a"/>
  <rect x="36" y="52" width="8" height="14" fill="#ef4444"/>
</svg>`;
async function htmlForIdCard(volunteer, settings) {
	const year = academicYear();
	const logos = await logoDataUrls();
	const payload = `NSS ID ${volunteer.enrollment} | ${volunteer.fullName} | ${settings.collegeShort} | ${year}`;
	const qr = await qrSvg(payload, 108);
	const photo = volunteer.photoUrl ? `<img src="${volunteer.photoUrl}" alt="" class="photo" />` : AVATAR;
	const name = escapeHtml(idCardName(volunteer.fullName));
	const role = escapeHtml((volunteer.nssRole || "Volunteer").toUpperCase());
	const course = escapeHtml(`${volunteer.course} (Sem ${volunteer.semester})`);
	const address = escapeHtml(volunteer.address || "Mansa, Gujarat");
	const poSign = settings.poSignature ? `<img src="${settings.poSignature}" alt="Programme Officer signature" style="width:92px;height:34px;object-fit:contain;display:block;margin:0 auto 2px;" />` : `<div class="ink">Haresh</div>`;
	const principalSign = settings.principalSignature ? `<img src="${settings.principalSignature}" alt="Principal signature" style="width:92px;height:34px;object-fit:contain;display:block;margin:0 auto 2px;" />` : `<div class="ink right">T.J.Vyas</div>`;
	return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NSS ID Card — ${name}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Playfair+Display:wght@700;800&family=Poppins:wght@400;500;600;700;800&display=swap" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #e8eef6; }
    body { font-family: Poppins, "Noto Sans", sans-serif; color: #0f172a; }
    .wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 18px 12px 28px; }
    #print-root {
      width: 390px; background: #fff; border-radius: 28px; overflow: hidden;
      box-shadow: 0 18px 50px rgba(15,23,42,0.18); border: 1px solid #e2e8f0;
    }
    .head { padding: 16px 16px 8px; display: flex; align-items: center; gap: 8px; }
    .head img { width: 54px; height: 54px; object-fit: contain; }
    .head .mid { flex: 1; text-align: center; }
    .head h1 { margin: 0; font-family: "Playfair Display", Georgia, serif; font-size: 12.5px; line-height: 1.25; letter-spacing: 0.02em; color: #0b1f3a; }
    .head p { margin: 4px 0 0; font-size: 9px; letter-spacing: 0.12em; color: #1d4ed8; font-weight: 700; }
    .rule { height: 3px; background: linear-gradient(90deg,#15803d,#fff,#15803d); margin: 0 18px 8px; }
    .avatar-wrap { display: flex; justify-content: center; margin: 6px 0 8px; }
    .photo {
      width: 108px; height: 124px; object-fit: cover; border-radius: 18px;
      border: 4px solid #fff; box-shadow: 0 8px 20px rgba(15,23,42,0.15); background: #dbeafe;
    }
    h2.name { margin: 6px 18px 2px; text-align: center; font-size: 18px; font-weight: 800; letter-spacing: 0.03em; line-height: 1.25; }
    .role { text-align: center; font-size: 11px; letter-spacing: 0.14em; color: #64748b; font-weight: 600; margin-bottom: 12px; }
    .box { margin: 0 18px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 14px; }
    .box .lbl { font-size: 9px; letter-spacing: 0.14em; color: #64748b; font-weight: 700; }
    .box .val { font-size: 14px; font-weight: 700; margin: 2px 0 10px; }
    .box .val:last-child { margin-bottom: 0; }
    .qr-row { display: flex; align-items: flex-end; justify-content: space-between; padding: 4px 22px 14px; }
    .sign { width: 96px; text-align: center; }
    .sign .ink { font-family: "Dancing Script", cursive; font-size: 22px; color: #1d4ed8; line-height: 1; }
    .sign .ink.right { color: #0f766e; }
    .sign .cap { margin-top: 4px; font-size: 10px; font-weight: 600; border-top: 1px solid #cbd5e1; padding-top: 4px; }
    .qr { width: 108px; height: 108px; }
    .qr svg { width: 108px; height: 108px; display: block; }
    .bar { background: #0b1f3a; color: #fff; text-align: center; font-size: 11px; letter-spacing: 0.22em; font-weight: 700; padding: 11px 8px; }
    .no-print { margin-top: 14px; display: flex; gap: 8px; }
    .no-print button { min-height: 42px; padding: 8px 16px; border-radius: 10px; border: 0; font-weight: 700; cursor: pointer; }
    .print { background: #15803d; color: #fff; }
    .close { background: #e2e8f0; }
    @media print {
      @page { size: auto; margin: 8mm; }
      html, body { background: #fff !important; }
      body * { visibility: hidden !important; }
      #print-root, #print-root * { visibility: visible !important; }
      #print-root { position: absolute; left: 50%; top: 0; transform: translateX(-50%); box-shadow: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <article id="print-root">
      <div class="head">
        <img src="${logos.college}" alt="College logo" />
        <div class="mid">
          <h1>S D ARTS AND SHAH B R<br/>COMMERCE COLLEGE, MANSA</h1>
          <p>NATIONAL SERVICE SCHEME (NSS)</p>
        </div>
        <img src="${logos.nss}" alt="NSS logo" />
      </div>
      <div class="rule"></div>
      <div class="avatar-wrap">${photo}</div>
      <h2 class="name">${name}</h2>
      <div class="role">NSS ${role} · ${escapeHtml(year)}</div>
      <div class="box">
        <div class="lbl">COURSE / SEMESTER</div>
        <div class="val">${course}</div>
        <div class="lbl">CONTACT NUMBER</div>
        <div class="val">${escapeHtml(volunteer.mobile)}</div>
        <div class="lbl">RESIDENTIAL ADDRESS</div>
        <div class="val">${address}</div>
      </div>
      <div class="qr-row">
        <div class="sign">
          ${poSign}
          <div class="cap">Prog. Officer</div>
        </div>
        <div class="qr">${qr}</div>
        <div class="sign">
          ${principalSign}
          <div class="cap">Principal</div>
        </div>
      </div>
      <div class="bar">SMART IDENTITY CARD</div>
    </article>
    <div class="no-print">
      <button class="print" onclick="window.print()">Print full I-card</button>
      <button class="close" onclick="window.close()">Close</button>
    </div>
  </div>
</body>
</html>`;
}
async function openIdCard(volunteer, settings) {
	const html = await htmlForIdCard(volunteer, settings);
	openHtmlDocument(html);
}
//#endregion
export { openIdCard as t };
