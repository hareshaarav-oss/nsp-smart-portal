import{C as e,T as t,k as n}from"./utils-Bqh-9L_H.js";import{n as r,t as i}from"./print-BjAG3JKE.js";function a(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function o(t,n){return`NSS/${e(n.date).replace(`-`,``)}/${t.volunteerId}/${n.id.replace(/^evt-/,``).slice(0,8).toUpperCase()}`}var s=`
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: "Cormorant Garamond", Georgia, serif; color: #171717; }
.wrap { width: 100%; padding: 0; }
#print-root { width: 100%; }
.sheet {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  max-width: 297mm;
  margin: 0 auto;
  overflow: hidden;
  page-break-after: always;
  background: #fff var(--certificate-template, url('/images/certificate-template.jpg')) center center / 100% 100% no-repeat;
}
.sheet:last-of-type { page-break-after: auto; }
.layer { position: absolute; inset: 0; }
.text-layer { z-index: 3; }
.mask { position: absolute; background: rgba(255,255,255,.985); border-radius: 3px; }
.mask-name { left: 18%; top: 34.5%; width: 64%; height: 12.2%; }
.mask-copy { left: 14%; top: 46.0%; width: 72%; height: 21.5%; }
.mask-po { left: 5.5%; top: 70.0%; width: 25%; height: 14.8%; }
.mask-principal { right: 5.5%; top: 70.0%; width: 25%; height: 14.8%; }
.mask-id { left: 21%; bottom: 8.1%; width: 24%; height: 5.2%; }
.mask-date { right: 21%; bottom: 8.1%; width: 24%; height: 5.2%; }
.name {
  position: absolute; left: 20%; top: 36.1%; width: 60%;
  margin: 0; text-align: center; font-family: "Dancing Script", cursive;
  font-size: clamp(34px, 4.4vw, 67px); line-height: 1.08; font-weight: 700;
  color: #b11619; white-space: nowrap;
}
.name-line {
  position: absolute; left: 20.6%; top: 45.1%; width: 58.8%; height: 1px; background: #b58a2d;
}
.copy {
  position: absolute; left: 16%; top: 46.8%; width: 68%;
  margin: 0; text-align: center; font-style: italic; font-size: clamp(13px, 1.62vw, 24px);
  line-height: 1.48; color: #111; font-weight: 500;
}
.copy strong { font-style: italic; font-weight: 800; color: #0c572f; }
.po-sign, .principal-sign {
  position: absolute; top: 71.1%; width: 22%; text-align: center;
  font-family: "Noto Sans", sans-serif;
}
.po-sign { left: 7.2%; }
.principal-sign { right: 7.2%; }
.signature {
  font-family: "Dancing Script", cursive; font-size: clamp(22px, 2.4vw, 38px);
  color: #1746a2; line-height: 1; margin-bottom: 10px;
}
.who { font-size: clamp(10px, 1.05vw, 16px); font-weight: 700; color: #173a87; }
.role { margin-top: 4px; font-size: clamp(9px, .95vw, 14px); color: #111; }
.cert-id {
  position: absolute; left: 24.1%; bottom: 10.3%; width: 18%;
  text-align: center; font-family: "Noto Sans", sans-serif; font-size: clamp(9px, .9vw, 14px); color: #111;
}
.date {
  position: absolute; right: 24.5%; bottom: 10.3%; width: 18%;
  text-align: center; font-family: "Noto Sans", sans-serif; font-size: clamp(9px, .9vw, 14px); color: #111;
}
.no-print { text-align: center; margin: 12px 0; }
.no-print button { min-height: 42px; padding: 8px 16px; border-radius: 10px; border: 0; font-weight: 700; cursor: pointer; margin: 0 6px; }
.print { background: #15803d; color: #fff; }
.close { background: #e2e8f0; }
@media screen {
  .sheet { box-shadow: 0 10px 35px rgba(0,0,0,.16); }
}
@media print {
  html, body { background: #fff !important; }
  .sheet { box-shadow: none !important; }
  .no-print { display: none !important; }
}
@media (max-width: 900px) {
  .sheet { min-width: 0; }
}
`;function c(e,t){let n=e.replace(/^dr\.\s*/i,``).trim();return n&&n.split(/\s+/)[0]||t}function l(e){let t=e.replace(/^dr\.\s*/i,``).trim().split(/\s+/).filter(Boolean);return t.length?t.length===1?t[0]:`${t[0][0]}.${t[t.length-1]}`:`T.J.Vyas`}function u(r){let i=a(r.settings.collegeName),s=a(t(r.volunteer.fullName)),u=a(r.event.name.toUpperCase()),d=a(r.settings.poName),f=a(r.settings.principalName),p=a(o(r.volunteer,r.event)),m=a(n(r.issuedOn.slice(0,10))),h=a(e(r.event.date)),g=a(c(r.settings.poName,`Haresh`)),_=a(l(r.settings.principalName)),v=r.settings.certificateTemplateUrl?`url('${r.settings.certificateTemplateUrl.replaceAll(`'`,`%27`)}')`:`url('/images/certificate-template.jpg')`,y=r.settings.poSignature?`<img src="${r.settings.poSignature}" alt="Programme Officer signature" style="max-height:42px;max-width:140px;object-fit:contain;display:block;margin:0 auto 8px;" />`:`<div class="signature">${g}</div>`,b=r.settings.principalSignature?`<img src="${r.settings.principalSignature}" alt="Principal signature" style="max-height:42px;max-width:140px;object-fit:contain;display:block;margin:0 auto 8px;" />`:`<div class="signature">${_}</div>`;return`<div class="sheet" style="--certificate-template:${v}">
    <div class="mask mask-name"></div>
    <div class="mask mask-copy"></div>
    <div class="mask mask-po"></div>
    <div class="mask mask-principal"></div>
    <div class="mask mask-id"></div>
    <div class="mask mask-date"></div>
    <div class="text-layer">
      <p class="name">${s}</p>
      <span class="name-line"></span>
      <p class="copy">
        for actively participating with exemplary dedication in the <strong>${u}</strong> organised by the<br/>
        National Service Scheme Unit of <strong>${i.toUpperCase()}</strong><br/>
        during the academic year <strong>${h}</strong>. We highly appreciate their sincere efforts, active involvement<br/>
        and valuable contribution towards community service and nation-building.
      </p>
      <div class="po-sign">
        ${y}
        <div class="who">${d}</div>
        <div class="role">NSS Program Officer</div>
      </div>
      <div class="principal-sign">
        ${b}
        <div class="who">${f}</div>
        <div class="role">Principal</div>
      </div>
      <div class="cert-id">Certificate ID : ${p}</div>
      <div class="date">Date : ${m}</div>
    </div>
  </div>`}function d(e,t){return`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${a(e)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Dancing+Script:wght@600;700&family=Noto+Sans:wght@400;600;700&display=swap" />
  <style>${s}</style>
</head>
<body>
  <div class="wrap">
    <div id="print-root">${t}</div>
    <p class="no-print">
      <button class="print" onclick="window.print()">Print / Save PDF</button>
      <button class="close" onclick="window.close()">Close</button>
    </p>
  </div>
</body>
</html>`}async function f(e,t,n,r){let a=await i();return d(`NSS Certificate — ${t.fullName}`,u({volunteer:t,event:n,settings:r,issuedOn:e.sentAt??e.generatedAt,logos:a}))}async function p(e,t){let n=await i();return d(`NSS Certificates`,e.map(e=>u({volunteer:e.volunteer,event:e.event,settings:t,issuedOn:e.cert.sentAt??e.cert.generatedAt,logos:n})).join(``))}function m(e){r(e)}export{m as i,f as n,p as r,o as t};