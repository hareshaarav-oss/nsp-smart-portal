import { academicYear, formatLongDate, todayIso } from "./format";
import { logoDataUrls, openHtmlDocument } from "./print";
import { eventPhotoDataUrls } from "./reports";
import { presentVolunteers } from "./store";
import type { NssEvent, PortalSettings, PortalState, Volunteer } from "./types";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

export function defaultGujaratiPress(event: NssEvent, settings: PortalSettings, presentCount: number) {
  const name = event.name.trim();
  const desc = event.description?.trim();
  return `એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા ખાતે તા. ${formatLongDate(event.date)}ના રોજ કોલેજના આદરણીય પ્રિન્સિપાલ ${settings.principalName}ના માર્ગદર્શન હેઠળ તથા NSS પ્રોગ્રામ ઑફિસર ${settings.poName}ના નેતૃત્વમાં “${name}”ની ઉજવણી/આયોજન કરવામાં આવ્યું.

કાર્યક્રમનો મુખ્ય ઉદ્દેશ વિદ્યાર્થીઓમાં સેવાભાવ, સામાજિક જવાબદારી, સન્માન, એકતા અને રાષ્ટ્રનિર્માણની ભાવના વિકસાવવાનો હતો. NSS સ્વયંસેવકોએ ઉત્સાહપૂર્વક ભાગ લઈ સમાજના વિવિધ વર્ગો સાથે જોડાઈ સેવાનો સુંદર સંદેશ આપ્યો.

${desc || `“${name}” દરમિયાન NSS સ્વયંસેવકોએ સક્રિય રીતે ભાગ લીધો હતો. કાર્યક્રમ દરમિયાન સેવા, સંવેદના અને ભાઈચારાની ભાવનાને પ્રાધાન્ય આપવામાં આવ્યું હતું.`}

આ સમગ્ર કાર્યક્રમમાં NSSના કુલ ${presentCount} સ્વયંસેવકોએ ઉત્સાહપૂર્વક ભાગ લીધો હતો. તેમની સક્રિય ભાગીદારીથી કાર્યક્રમ સફળતાપૂર્વક સંપન્ન થયો હતો.

પ્રિન્સિપાલશ્રીએ NSS સ્વયંસેવકોને આવા સેવાકીય અને સામાજિક કાર્યોમાં સતત જોડાઈ રહેવા પ્રેરણા આપી હતી. NSS પ્રોગ્રામ ઑફિસરે વિદ્યાર્થીઓને સેવાભાવ, સામાજિક જવાબદારી અને માનવતાની ભાવના સાથે સમાજ સાથે જોડાઈ કાર્ય કરવા અનુરોધ કર્યો હતો.

આ કાર્યક્રમ દ્વારા સેવા, સન્માન, એકતા અને સામાજિક સંવેદનાનો સુંદર સંદેશ સમાજ સુધી પહોંચ્યો.

— NSS એકમ, એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા —`;
}

export function defaultNaacEnglish(event: NssEvent, settings: PortalSettings, present: Volunteer[]) {
  const names = present.map((v, i) => `${i + 1}. ${v.fullName} (${v.volunteerId})`).join("\n");
  return `NAAC / IQAC ACTIVITY REPORT
${settings.collegeName}
National Service Scheme (NSS)

1. Title of the activity: ${event.name}
2. Date: ${formatLongDate(event.date)}
3. Venue: ${event.location}
4. Organising unit: NSS Unit, ${settings.collegeShort}
5. Programme Officer: ${settings.poName}
6. Principal: ${settings.principalName}
7. Academic year: ${academicYear(event.date)}
8. Number of student participants: ${present.length}
9. Service hours credited per volunteer: ${event.hours}

10. Objectives
• To engage NSS volunteers in community service and nation-building.
• To develop a sense of social responsibility, discipline and leadership.
• To document the activity for NAAC / IQAC files.

11. Brief report
The NSS unit organised “${event.name}” at ${event.location} on ${formatLongDate(event.date)} under the guidance of the Principal and the leadership of the Programme Officer. ${event.description || "Volunteers participated with dedication and carried the message of service into the community."}

12. Outcomes
• ${present.length} volunteers were present and received ${event.hours} service hours each.
• Photographs of the activity are attached.
• The activity strengthens Criterion III / VII evidence for NAAC.

13. Attendance annexure
${names || "(Mark attendance first — the list appears automatically.)"}

Prepared on ${formatLongDate(todayIso())}
NSS Smart Portal`;
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

export async function openGujaratiPress(opts: {
  state: PortalState;
  event: NssEvent;
  body: string;
  photos?: string[];
}) {
  const logos = await logoDataUrls();
  const photos = (opts.photos ?? (await eventPhotoDataUrls(opts.state, opts.event.id))).slice(0, 12);
  const present = presentVolunteers(opts.state, opts.event.id);
  const list = present
    .map((v, i) => `<li>${escapeHtml(v.fullName)} <span class="id">${escapeHtml(v.volunteerId)}</span></li>`)
    .join("");
  const paras = opts.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const photoBlock = (src: string, i: number) => `<figure><img src="${src}" alt="" /><figcaption>${escapeHtml(["કાર્યક્રમની તસવીર", "સેવાકીય પ્રવૃત્તિની તસવીર", "NSS સ્વયંસેવકોની તસવીર"][i % 3])}</figcaption></figure>`;
  const photoHtml = photos.map(photoBlock).join("");
  const bodyHtml = paras.map((p, i) => {
    const block = `<p>${escapeHtml(p).replaceAll("\n", "<br/>")}</p>`;
    if (i === 1 && photos[0]) return `${block}<div class="feature-photo">${photoBlock(photos[0], 0)}</div>`;
    if (i === 3 && photos.length > 1) return `${block}<div class="photo-row">${photos.slice(1, 3).map(photoBlock).join("")}</div>`;
    return block;
  }).join("");
  const remainingPhotos = photos.slice(3).map(photoBlock).join("");
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Press note — ${escapeHtml(opts.event.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Serif:wght@600;700&display=swap" />
<style>
@page{size:A4;margin:11mm 12mm}*{box-sizing:border-box}html,body{margin:0;background:#eee7d8}body{font-family:"Noto Sans Gujarati","Noto Sans",sans-serif;color:#211d18}.wrap{padding:12px}#print-root{background:#fff;max-width:210mm;margin:0 auto;padding:15px 18px 22px;box-shadow:0 2px 16px #0001}.head{display:flex;align-items:center;gap:12px;border-bottom:1px solid #b9892e;padding-bottom:9px}.head img{width:65px;height:65px;object-fit:contain}.mid{flex:1;text-align:center}.mid h1{margin:0;font-family:"Noto Serif",serif;font-size:18px;color:#173b29}.mid h2{margin:4px 0 0;font-size:13px;color:#173b29}.mid p{margin:4px 0 0;font-size:11px}.tri{height:4px;display:flex;margin:7px 0 13px}.tri span{flex:1}.title{text-align:center;font-family:"Noto Serif",serif;font-size:21px;color:#9d1b16;margin:0 0 4px}.date{text-align:right;font-weight:700;font-size:12px;margin:0 0 12px}.body p{font-size:13.5px;line-height:1.72;text-align:justify;margin:0 0 9px}.feature-photo figure{margin:10px auto 12px;max-width:88%}.feature-photo img{width:100%;height:225px;object-fit:cover}.photo-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 12px}.photo-row figure,.more-photos figure{margin:0}.photo-row img{width:100%;height:145px;object-fit:cover}.more-photos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.more-photos img{width:100%;height:145px;object-fit:cover}.more-photos figure:nth-child(3){grid-column:1/-1}.more-photos figure:nth-child(3) img{height:190px}.caption,figcaption{font-size:10.5px;text-align:center;color:#555;margin-top:3px;font-style:italic}.annexure{margin-top:16px;border-top:1px solid #b9892e;padding-top:9px}.annexure h3{font-size:14px;color:#173b29;margin:0 0 7px}.annexure ol{columns:2;padding-left:22px;margin:0}.annexure li{font-size:11.5px;margin:0 0 3px;break-inside:avoid}.id{color:#777;font-size:9.5px}footer{text-align:center;border-top:1px solid #ddd;margin-top:14px;padding-top:8px;font-size:11px;color:#555}.no-print{text-align:center;margin-top:14px}.no-print button{min-height:42px;padding:8px 18px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.print{background:#176b3a;color:#fff}@media print{html,body{background:#fff!important}body *{visibility:hidden!important}#print-root,#print-root *{visibility:visible!important}#print-root{position:absolute;left:0;top:0;width:100%;padding:0;box-shadow:none}.no-print{display:none!important}}
</style></head><body><div class="wrap"><article id="print-root">
<div class="head"><img src="${logos.college}" alt="" /><div class="mid"><h1>એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા</h1><h2>રાષ્ટ્રીય સેવા યોજના (NSS)</h2><p>પ્રોગ્રામ ઑફિસર: ${escapeHtml(opts.state.settings.poName)}</p></div><img src="${logos.nss}" alt="" /></div>
<div class="tri"><span style="background:#ff9933"></span><span style="background:#fff;outline:1px solid #ddd"></span><span style="background:#138808"></span></div>
<h2 class="title">${escapeHtml(opts.event.name)}</h2><p class="date">માણસા, ${escapeHtml(formatLongDate(opts.event.date))}</p>
<div class="body">${bodyHtml}</div>
${remainingPhotos ? `<div class="more-photos">${remainingPhotos}</div>` : ""}
<div class="annexure"><h3>કાર્યક્રમમાં ભાગ લેનાર NSS સ્વયંસેવકો · કુલ ${present.length}</h3>${list ? `<ol>${list}</ol>` : `<p>હાજરી નોંધાઈ નથી.</p>`}</div>
<footer>— NSS એકમ, એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા —</footer>
</article><p class="no-print"><button class="print" onclick="window.print()">Print / Save PDF</button></p></div></body></html>`;
  openHtmlDocument(html);
}

export async function openNaacReport(opts: {
  state: PortalState;
  event: NssEvent;
  body: string;
  photos?: string[];
}) {
  const logos = await logoDataUrls();
  const photos = opts.photos ?? (await eventPhotoDataUrls(opts.state, opts.event.id));
  const present = presentVolunteers(opts.state, opts.event.id);
  const list = present
    .map((v, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(v.volunteerId)}</td><td>${escapeHtml(v.fullName)}</td><td>${escapeHtml(v.course)} Sem ${escapeHtml(v.semester)}</td><td>Present</td></tr>`)
    .join("");
  const photoHtml = photos
    .map((src) => `<img src="${src}" alt="" />`)
    .join("");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NAAC report — ${escapeHtml(opts.event.name)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #eef2f6; }
    body { font-family: "Times New Roman", Georgia, serif; color: #111; }
    .wrap { padding: 12px; }
    #print-root { background: #fff; padding: 16px 18px 24px; max-width: 210mm; margin: 0 auto; }
    .head { display: flex; align-items: center; gap: 14px; }
    .head img { width: 64px; height: 64px; object-fit: contain; }
    .mid { flex: 1; text-align: center; }
    .mid h1 { margin: 0; font-size: 16px; letter-spacing: 0.02em; }
    .mid h2 { margin: 4px 0 0; font-size: 12px; letter-spacing: 0.16em; color: #1b5e3b; }
    .mid h3 { margin: 8px 0 0; font-size: 14px; }
    pre { white-space: pre-wrap; font-family: "Times New Roman", Georgia, serif; font-size: 13px; line-height: 1.55; }
    .photos { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .photos img { width: 160px; height: 110px; object-fit: cover; border: 1px solid #ccc; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; }
    th { background: #13294b; color: #fff; }
    .no-print { text-align: center; margin-top: 16px; }
    .no-print button { min-height: 42px; padding: 8px 16px; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .print { background: #15803d; color: #fff; }
    @media print {
      html, body { background: #fff !important; }
      body * { visibility: hidden !important; }
      #print-root, #print-root * { visibility: visible !important; }
      #print-root { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <article id="print-root">
      <div class="head">
        <img src="${logos.college}" alt="" />
        <div class="mid">
          <h1>${escapeHtml(opts.state.settings.collegeName)}</h1>
          <h2>NATIONAL SERVICE SCHEME · NAAC / IQAC FILE</h2>
          <h3>${escapeHtml(opts.event.name)}</h3>
        </div>
        <img src="${logos.nss}" alt="" />
      </div>
      <pre>${escapeHtml(opts.body)}</pre>
      ${photoHtml ? `<p><strong>Photographs</strong></p><div class="photos">${photoHtml}</div>` : ""}
      <p><strong>Attendance annexure (${present.length} present)</strong></p>
      <table>
        <thead><tr><th>Sr.</th><th>ID</th><th>Name</th><th>Class</th><th>Status</th></tr></thead>
        <tbody>${list || `<tr><td colspan="5">Mark attendance first. Hours stay 0 until Present is recorded.</td></tr>`}</tbody>
      </table>
    </article>
    <p class="no-print"><button class="print" onclick="window.print()">Print / Save PDF</button></p>
  </div>
</body>
</html>`;
  openHtmlDocument(html);
}
