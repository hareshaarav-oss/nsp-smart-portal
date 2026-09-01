import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, F as putMedia, P as presentVolunteers, R as todayIso, c as academicYear, k as getMedia } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { F as Eye, I as Download, N as FileText, i as Trash2 } from "../_libs/lucide-react.mjs";
import { t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
import { n as openHtmlDocument, t as logoDataUrls } from "./print-CifCDGub.mjs";
import { p as eventPhotoDataUrls } from "./reports-0LItQuD8.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-CRsubrpt.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
import { t as MediaThumb } from "./media-thumb-CiIriRxi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/press-Ctj5Sg6-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function escapeHtml(s) {
	return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
function defaultGujaratiPress(event, settings, presentCount) {
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
function defaultNaacEnglish(event, settings, present) {
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
async function openGujaratiPress(opts) {
	const logos = await logoDataUrls();
	const photos = (opts.photos ?? await eventPhotoDataUrls(opts.state, opts.event.id)).slice(0, 12);
	const present = presentVolunteers(opts.state, opts.event.id);
	const list = present.map((v, i) => `<li>${escapeHtml(v.fullName)} <span class="id">${escapeHtml(v.volunteerId)}</span></li>`).join("");
	const paras = opts.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
	const photoBlock = (src, i) => `<figure><img src="${src}" alt="" /><figcaption>${escapeHtml([
		"કાર્યક્રમની તસવીર",
		"સેવાકીય પ્રવૃત્તિની તસવીર",
		"NSS સ્વયંસેવકોની તસવીર"
	][i % 3])}</figcaption></figure>`;
	photos.map(photoBlock).join("");
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
async function openNaacReport(opts) {
	const logos = await logoDataUrls();
	const photos = opts.photos ?? await eventPhotoDataUrls(opts.state, opts.event.id);
	const present = presentVolunteers(opts.state, opts.event.id);
	const list = present.map((v, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(v.volunteerId)}</td><td>${escapeHtml(v.fullName)}</td><td>${escapeHtml(v.course)} Sem ${escapeHtml(v.semester)}</td><td>Present</td></tr>`).join("");
	const photoHtml = photos.map((src) => `<img src="${src}" alt="" />`).join("");
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
function PressPage() {
	const state = useNssStore();
	const events = (0, import_react.useMemo)(() => [...state.events].sort((a, b) => b.date.localeCompare(a.date)), [state.events]);
	const [eventId, setEventId] = (0, import_react.useState)(events[0]?.id ?? "");
	const event = events.find((e) => e.id === eventId) ?? events[0];
	const present = event ? presentVolunteers(state, event.id) : [];
	const photos = (0, import_react.useMemo)(() => {
		if (!event) return [];
		return (state.gallery ?? []).filter((g) => g.eventId === event.id || g.eventName && g.eventName === event.name || g.caption && event.name && g.caption.toLowerCase().includes(event.name.toLowerCase()));
	}, [state.gallery, event]);
	const [gu, setGu] = (0, import_react.useState)("");
	const [en, setEn] = (0, import_react.useState)("");
	const pressReports = state.pressReports ?? [];
	(0, import_react.useEffect)(() => {
		if (!event) return;
		setGu(defaultGujaratiPress(event, state.settings, present.length));
		setEn(defaultNaacEnglish(event, state.settings, present));
	}, [
		event?.id,
		present.length,
		state.settings
	]);
	async function uploadExternal(file) {
		if (!file) return;
		if (![
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/msword"
		].includes(file.type) && !/\.(pdf|docx?|PDF|DOCX?)$/.test(file.name)) {
			toast.error("Upload PDF, DOCX or DOC press report only.");
			return;
		}
		if (file.size > 31457280) {
			toast.error("Press report must be 30 MB or smaller.");
			return;
		}
		const mediaKey = `press-${Date.now()}-${file.name.replace(/[^a-z0-9]+/gi, "-")}`;
		await putMedia(mediaKey, file);
		state.addPressReport({
			id: `press-${Date.now()}`,
			name: event ? event.name : "External Press Report",
			date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
			eventId: event?.id,
			fileName: file.name,
			mimeType: file.type || "application/octet-stream",
			mediaKey
		});
		toast.success("External press report uploaded.");
	}
	async function downloadExternal(id) {
		const item = pressReports.find((r) => r.id === id);
		if (!item) return;
		const blob = await getMedia(item.mediaKey);
		if (!blob) {
			toast.error("File is not available on this device.");
			return;
		}
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = item.fileName;
		a.click();
		window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
	}
	async function viewGujarati() {
		if (!event) return;
		const urls = await eventPhotoDataUrls(state, event.id);
		await openGujaratiPress({
			state: useNssStore.getState(),
			event,
			body: gu,
			photos: urls
		});
	}
	async function viewNaac() {
		if (!event) return;
		const urls = await eventPhotoDataUrls(state, event.id);
		await openNaacReport({
			state: useNssStore.getState(),
			event,
			body: en,
			photos: urls
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title: "Press report",
				compact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Press report"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-sm text-muted-foreground",
				children: "Select an event. Photographs from the Gallery folder for that event load automatically. Write or paste the Gujarati note. Present volunteers appear at the bottom. Then View the report — nothing downloads until you print from the preview. The same file also makes the English NAAC report."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-forest/30",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "External Press Report Upload"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Upload a PDF, DOC or DOCX prepared outside the portal. It is automatically added to this Press Desk and remains available here for download."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "file",
							accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
							onChange: (e) => {
								uploadExternal(e.target.files?.[0]);
								e.currentTarget.value = "";
							}
						}),
						pressReports.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: pressReports.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex min-w-0 items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-lg bg-primary/10 p-2 text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "block truncate",
											children: r.fileName
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-xs text-muted-foreground",
											children: [
												r.name,
												" · ",
												formatLongDate(r.date)
											]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex shrink-0 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => void downloadExternal(r.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Download"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => state.removePressReport(r.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), "Remove"]
									})]
								})]
							}, r.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No external press reports uploaded yet."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-base",
				children: "1. Choose event"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: "h-11 w-full max-w-lg rounded-md border border-border bg-card px-3 text-sm",
					value: event?.id ?? "",
					onChange: (e) => setEventId(e.target.value),
					children: events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: e.id,
						children: [
							e.name,
							" — ",
							formatLongDate(e.date)
						]
					}, e.id))
				}), event ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						event.location,
						" · ",
						photos.length,
						" photograph(s) · ",
						present.length,
						" present (hours stay 0 until you mark Present)"
					]
				}) : null]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-base",
				children: "2. Photographs (from Gallery)"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: photos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No photos for this event yet. Open Gallery, choose this event name, and add photographs. They appear here automatically."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: photos.slice(0, 12).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-hidden rounded-md border border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaThumb, {
						item,
						className: "h-28 w-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate px-2 py-1 text-[11px] text-muted-foreground",
						children: item.caption
					})]
				}, item.id))
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-base",
				children: "3. Gujarati write-up — type or paste"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				className: "gu min-h-56",
				value: gu,
				onChange: (e) => setGu(e.target.value)
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-base",
				children: "4. Attendance list (auto)"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: present.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Mark Present on the Attendance page. Names then print at the foot of the press note, like the Rakshabandhan file."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "columns-2 text-sm",
				children: present.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "mb-1",
					children: [
						v.fullName,
						" · ",
						v.volunteerId
					]
				}, v.id))
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => void viewGujarati(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {}), "View Gujarati press report"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => void viewNaac(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {}), "View English NAAC report"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => {
							if (!event) return;
							setGu(defaultGujaratiPress(event, state.settings, present.length));
							setEn(defaultNaacEnglish(event, state.settings, present));
							toast.success("Draft restored from event details.");
						},
						children: "Restore draft"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "English NAAC draft (editable)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "min-h-48 font-mono text-xs",
					value: en,
					onChange: (e) => setEn(e.target.value)
				})]
			})
		]
	});
}
//#endregion
export { PressPage as component };
