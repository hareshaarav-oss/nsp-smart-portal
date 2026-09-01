import{a as e,n as t,t as n}from"./jsx-runtime-B-hcVAMW.js";import{t as r}from"./download-BPSvxxS2.js";import{t as i}from"./eye-CUxzG0Lj.js";import{t as a}from"./file-text-BFaHgaSG.js";import{t as o}from"./trash-2-DjLXFzbw.js";import{C as s,P as c,b as l,c as u,d,k as f,x as p}from"./utils-Bqh-9L_H.js";import{t as m}from"./button-BmJ9Eft_.js";import{i as h,n as g,r as _,t as v}from"./card-so7PnOpF.js";import{r as y}from"./index-BZ-EgtDf.js";import{t as b}from"./official-letterhead-7AV94C2a.js";import{t as x}from"./media-thumb-Bye3z1BY.js";import{t as S}from"./input-BPde0urc.js";import{t as C}from"./label-Bs-jdcbU.js";import{p as w}from"./reports-Dn4mXsZQ.js";import{n as T,t as E}from"./print-BjAG3JKE.js";import{t as D}from"./textarea-BTYKTAZg.js";var O=e(t());function k(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function A(e,t,n){let r=e.name.trim(),i=e.description?.trim();return`એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા ખાતે તા. ${f(e.date)}ના રોજ કોલેજના આદરણીય પ્રિન્સિપાલ ${t.principalName}ના માર્ગદર્શન હેઠળ તથા NSS પ્રોગ્રામ ઑફિસર ${t.poName}ના નેતૃત્વમાં “${r}”ની ઉજવણી/આયોજન કરવામાં આવ્યું.

કાર્યક્રમનો મુખ્ય ઉદ્દેશ વિદ્યાર્થીઓમાં સેવાભાવ, સામાજિક જવાબદારી, સન્માન, એકતા અને રાષ્ટ્રનિર્માણની ભાવના વિકસાવવાનો હતો. NSS સ્વયંસેવકોએ ઉત્સાહપૂર્વક ભાગ લઈ સમાજના વિવિધ વર્ગો સાથે જોડાઈ સેવાનો સુંદર સંદેશ આપ્યો.

${i||`“${r}” દરમિયાન NSS સ્વયંસેવકોએ સક્રિય રીતે ભાગ લીધો હતો. કાર્યક્રમ દરમિયાન સેવા, સંવેદના અને ભાઈચારાની ભાવનાને પ્રાધાન્ય આપવામાં આવ્યું હતું.`}

આ સમગ્ર કાર્યક્રમમાં NSSના કુલ ${n} સ્વયંસેવકોએ ઉત્સાહપૂર્વક ભાગ લીધો હતો. તેમની સક્રિય ભાગીદારીથી કાર્યક્રમ સફળતાપૂર્વક સંપન્ન થયો હતો.

પ્રિન્સિપાલશ્રીએ NSS સ્વયંસેવકોને આવા સેવાકીય અને સામાજિક કાર્યોમાં સતત જોડાઈ રહેવા પ્રેરણા આપી હતી. NSS પ્રોગ્રામ ઑફિસરે વિદ્યાર્થીઓને સેવાભાવ, સામાજિક જવાબદારી અને માનવતાની ભાવના સાથે સમાજ સાથે જોડાઈ કાર્ય કરવા અનુરોધ કર્યો હતો.

આ કાર્યક્રમ દ્વારા સેવા, સન્માન, એકતા અને સામાજિક સંવેદનાનો સુંદર સંદેશ સમાજ સુધી પહોંચ્યો.

— NSS એકમ, એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા —`}function j(e,t,n){let r=n.map((e,t)=>`${t+1}. ${e.fullName} (${e.volunteerId})`).join(`
`);return`NAAC / IQAC ACTIVITY REPORT
${t.collegeName}
National Service Scheme (NSS)

1. Title of the activity: ${e.name}
2. Date: ${f(e.date)}
3. Venue: ${e.location}
4. Organising unit: NSS Unit, ${t.collegeShort}
5. Programme Officer: ${t.poName}
6. Principal: ${t.principalName}
7. Academic year: ${s(e.date)}
8. Number of student participants: ${n.length}
9. Service hours credited per volunteer: ${e.hours}

10. Objectives
• To engage NSS volunteers in community service and nation-building.
• To develop a sense of social responsibility, discipline and leadership.
• To document the activity for NAAC / IQAC files.

11. Brief report
The NSS unit organised “${e.name}” at ${e.location} on ${f(e.date)} under the guidance of the Principal and the leadership of the Programme Officer. ${e.description||`Volunteers participated with dedication and carried the message of service into the community.`}

12. Outcomes
• ${n.length} volunteers were present and received ${e.hours} service hours each.
• Photographs of the activity are attached.
• The activity strengthens Criterion III / VII evidence for NAAC.

13. Attendance annexure
${r||`(Mark attendance first — the list appears automatically.)`}

Prepared on ${f(c())}
NSS Smart Portal`}async function M(e){let t=await E(),n=(e.photos??await w(e.state,e.event.id)).slice(0,12),r=u(e.state,e.event.id),i=r.map((e,t)=>`<li>${k(e.fullName)} <span class="id">${k(e.volunteerId)}</span></li>`).join(``),a=e.body.split(/\n{2,}/).map(e=>e.trim()).filter(Boolean),o=(e,t)=>`<figure><img src="${e}" alt="" /><figcaption>${k([`કાર્યક્રમની તસવીર`,`સેવાકીય પ્રવૃત્તિની તસવીર`,`NSS સ્વયંસેવકોની તસવીર`][t%3])}</figcaption></figure>`;n.map(o).join(``);let s=a.map((e,t)=>{let r=`<p>${k(e).replaceAll(`
`,`<br/>`)}</p>`;return t===1&&n[0]?`${r}<div class="feature-photo">${o(n[0],0)}</div>`:t===3&&n.length>1?`${r}<div class="photo-row">${n.slice(1,3).map(o).join(``)}</div>`:r}).join(``),c=n.slice(3).map(o).join(``),l=`<!doctype html>
<html><head><meta charset="utf-8" /><title>Press note — ${k(e.event.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Serif:wght@600;700&display=swap" />
<style>
@page{size:A4;margin:11mm 12mm}*{box-sizing:border-box}html,body{margin:0;background:#eee7d8}body{font-family:"Noto Sans Gujarati","Noto Sans",sans-serif;color:#211d18}.wrap{padding:12px}#print-root{background:#fff;max-width:210mm;margin:0 auto;padding:15px 18px 22px;box-shadow:0 2px 16px #0001}.head{display:flex;align-items:center;gap:12px;border-bottom:1px solid #b9892e;padding-bottom:9px}.head img{width:65px;height:65px;object-fit:contain}.mid{flex:1;text-align:center}.mid h1{margin:0;font-family:"Noto Serif",serif;font-size:18px;color:#173b29}.mid h2{margin:4px 0 0;font-size:13px;color:#173b29}.mid p{margin:4px 0 0;font-size:11px}.tri{height:4px;display:flex;margin:7px 0 13px}.tri span{flex:1}.title{text-align:center;font-family:"Noto Serif",serif;font-size:21px;color:#9d1b16;margin:0 0 4px}.date{text-align:right;font-weight:700;font-size:12px;margin:0 0 12px}.body p{font-size:13.5px;line-height:1.72;text-align:justify;margin:0 0 9px}.feature-photo figure{margin:10px auto 12px;max-width:88%}.feature-photo img{width:100%;height:225px;object-fit:cover}.photo-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 12px}.photo-row figure,.more-photos figure{margin:0}.photo-row img{width:100%;height:145px;object-fit:cover}.more-photos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.more-photos img{width:100%;height:145px;object-fit:cover}.more-photos figure:nth-child(3){grid-column:1/-1}.more-photos figure:nth-child(3) img{height:190px}.caption,figcaption{font-size:10.5px;text-align:center;color:#555;margin-top:3px;font-style:italic}.annexure{margin-top:16px;border-top:1px solid #b9892e;padding-top:9px}.annexure h3{font-size:14px;color:#173b29;margin:0 0 7px}.annexure ol{columns:2;padding-left:22px;margin:0}.annexure li{font-size:11.5px;margin:0 0 3px;break-inside:avoid}.id{color:#777;font-size:9.5px}footer{text-align:center;border-top:1px solid #ddd;margin-top:14px;padding-top:8px;font-size:11px;color:#555}.no-print{text-align:center;margin-top:14px}.no-print button{min-height:42px;padding:8px 18px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.print{background:#176b3a;color:#fff}@media print{html,body{background:#fff!important}body *{visibility:hidden!important}#print-root,#print-root *{visibility:visible!important}#print-root{position:absolute;left:0;top:0;width:100%;padding:0;box-shadow:none}.no-print{display:none!important}}
</style></head><body><div class="wrap"><article id="print-root">
<div class="head"><img src="${t.college}" alt="" /><div class="mid"><h1>એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા</h1><h2>રાષ્ટ્રીય સેવા યોજના (NSS)</h2><p>પ્રોગ્રામ ઑફિસર: ${k(e.state.settings.poName)}</p></div><img src="${t.nss}" alt="" /></div>
<div class="tri"><span style="background:#ff9933"></span><span style="background:#fff;outline:1px solid #ddd"></span><span style="background:#138808"></span></div>
<h2 class="title">${k(e.event.name)}</h2><p class="date">માણસા, ${k(f(e.event.date))}</p>
<div class="body">${s}</div>
${c?`<div class="more-photos">${c}</div>`:``}
<div class="annexure"><h3>કાર્યક્રમમાં ભાગ લેનાર NSS સ્વયંસેવકો · કુલ ${r.length}</h3>${i?`<ol>${i}</ol>`:`<p>હાજરી નોંધાઈ નથી.</p>`}</div>
<footer>— NSS એકમ, એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા —</footer>
</article><p class="no-print"><button class="print" onclick="window.print()">Print / Save PDF</button></p></div></body></html>`;T(l)}async function N(e){let t=await E(),n=e.photos??await w(e.state,e.event.id),r=u(e.state,e.event.id),i=r.map((e,t)=>`<tr><td>${t+1}</td><td>${k(e.volunteerId)}</td><td>${k(e.fullName)}</td><td>${k(e.course)} Sem ${k(e.semester)}</td><td>Present</td></tr>`).join(``),a=n.map(e=>`<img src="${e}" alt="" />`).join(``),o=`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NAAC report — ${k(e.event.name)}</title>
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
        <img src="${t.college}" alt="" />
        <div class="mid">
          <h1>${k(e.state.settings.collegeName)}</h1>
          <h2>NATIONAL SERVICE SCHEME · NAAC / IQAC FILE</h2>
          <h3>${k(e.event.name)}</h3>
        </div>
        <img src="${t.nss}" alt="" />
      </div>
      <pre>${k(e.body)}</pre>
      ${a?`<p><strong>Photographs</strong></p><div class="photos">${a}</div>`:``}
      <p><strong>Attendance annexure (${r.length} present)</strong></p>
      <table>
        <thead><tr><th>Sr.</th><th>ID</th><th>Name</th><th>Class</th><th>Status</th></tr></thead>
        <tbody>${i||`<tr><td colspan="5">Mark attendance first. Hours stay 0 until Present is recorded.</td></tr>`}</tbody>
      </table>
    </article>
    <p class="no-print"><button class="print" onclick="window.print()">Print / Save PDF</button></p>
  </div>
</body>
</html>`;T(o)}var P=n();function F(){let e=d(),t=(0,O.useMemo)(()=>[...e.events].sort((e,t)=>t.date.localeCompare(e.date)),[e.events]),[n,s]=(0,O.useState)(t[0]?.id??``),c=t.find(e=>e.id===n)??t[0],T=c?u(e,c.id):[],E=(0,O.useMemo)(()=>c?(e.gallery??[]).filter(e=>e.eventId===c.id||e.eventName&&e.eventName===c.name||e.caption&&c.name&&e.caption.toLowerCase().includes(c.name.toLowerCase())):[],[e.gallery,c]),[k,F]=(0,O.useState)(``),[I,L]=(0,O.useState)(``),R=e.pressReports??[];(0,O.useEffect)(()=>{c&&(F(A(c,e.settings,T.length)),L(j(c,e.settings,T)))},[c?.id,T.length,e.settings]);async function z(t){if(!t)return;if(![`application/pdf`,`application/vnd.openxmlformats-officedocument.wordprocessingml.document`,`application/msword`].includes(t.type)&&!/\.(pdf|docx?|PDF|DOCX?)$/.test(t.name)){y.error(`Upload PDF, DOCX or DOC press report only.`);return}if(t.size>31457280){y.error(`Press report must be 30 MB or smaller.`);return}let n=`press-${Date.now()}-${t.name.replace(/[^a-z0-9]+/gi,`-`)}`;await p(n,t),e.addPressReport({id:`press-${Date.now()}`,name:c?c.name:`External Press Report`,date:new Date().toISOString().slice(0,10),eventId:c?.id,fileName:t.name,mimeType:t.type||`application/octet-stream`,mediaKey:n}),y.success(`External press report uploaded.`)}async function B(e){let t=R.find(t=>t.id===e);if(!t)return;let n=await l(t.mediaKey);if(!n){y.error(`File is not available on this device.`);return}let r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t.fileName,i.click(),window.setTimeout(()=>URL.revokeObjectURL(r),1e3)}async function V(){if(!c)return;let t=await w(e,c.id);await M({state:d.getState(),event:c,body:k,photos:t})}async function H(){if(!c)return;let t=await w(e,c.id);await N({state:d.getState(),event:c,body:I,photos:t})}return(0,P.jsxs)(`div`,{className:`space-y-6`,children:[(0,P.jsx)(b,{title:`Press report`,compact:!0}),(0,P.jsxs)(`div`,{children:[(0,P.jsx)(`h2`,{className:`font-display text-xl font-semibold`,children:`Press report`}),(0,P.jsx)(`p`,{className:`mt-1 max-w-2xl text-sm text-muted-foreground`,children:`Select an event. Photographs from the Gallery folder for that event load automatically. Write or paste the Gujarati note. Present volunteers appear at the bottom. Then View the report — nothing downloads until you print from the preview. The same file also makes the English NAAC report.`})]}),(0,P.jsxs)(v,{className:`border-forest/30`,children:[(0,P.jsx)(_,{children:(0,P.jsx)(h,{className:`text-base`,children:`External Press Report Upload`})}),(0,P.jsxs)(g,{className:`space-y-3`,children:[(0,P.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`Upload a PDF, DOC or DOCX prepared outside the portal. It is automatically added to this Press Desk and remains available here for download.`}),(0,P.jsx)(S,{type:`file`,accept:`.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`,onChange:e=>{z(e.target.files?.[0]),e.currentTarget.value=``}}),R.length?(0,P.jsx)(`div`,{className:`space-y-2`,children:R.map(t=>(0,P.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm`,children:[(0,P.jsxs)(`span`,{className:`flex min-w-0 items-center gap-3`,children:[(0,P.jsx)(`span`,{className:`rounded-lg bg-primary/10 p-2 text-primary`,children:(0,P.jsx)(a,{})}),(0,P.jsxs)(`span`,{className:`min-w-0`,children:[(0,P.jsx)(`strong`,{className:`block truncate`,children:t.fileName}),(0,P.jsxs)(`span`,{className:`block text-xs text-muted-foreground`,children:[t.name,` · `,f(t.date)]})]})]}),(0,P.jsxs)(`span`,{className:`flex shrink-0 gap-2`,children:[(0,P.jsxs)(m,{size:`sm`,variant:`outline`,onClick:()=>void B(t.id),children:[(0,P.jsx)(r,{}),`Download`]}),(0,P.jsxs)(m,{size:`sm`,variant:`ghost`,onClick:()=>e.removePressReport(t.id),children:[(0,P.jsx)(o,{}),`Remove`]})]})]},t.id))}):(0,P.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`No external press reports uploaded yet.`})]})]}),(0,P.jsxs)(v,{children:[(0,P.jsx)(_,{children:(0,P.jsx)(h,{className:`text-base`,children:`1. Choose event`})}),(0,P.jsxs)(g,{className:`space-y-3`,children:[(0,P.jsx)(`select`,{className:`h-11 w-full max-w-lg rounded-md border border-border bg-card px-3 text-sm`,value:c?.id??``,onChange:e=>s(e.target.value),children:t.map(e=>(0,P.jsxs)(`option`,{value:e.id,children:[e.name,` — `,f(e.date)]},e.id))}),c?(0,P.jsxs)(`p`,{className:`text-sm text-muted-foreground`,children:[c.location,` · `,E.length,` photograph(s) · `,T.length,` present (hours stay 0 until you mark Present)`]}):null]})]}),(0,P.jsxs)(v,{children:[(0,P.jsx)(_,{children:(0,P.jsx)(h,{className:`text-base`,children:`2. Photographs (from Gallery)`})}),(0,P.jsx)(g,{children:E.length===0?(0,P.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`No photos for this event yet. Open Gallery, choose this event name, and add photographs. They appear here automatically.`}):(0,P.jsx)(`div`,{className:`grid grid-cols-2 gap-2 sm:grid-cols-4`,children:E.slice(0,12).map(e=>(0,P.jsxs)(`div`,{className:`overflow-hidden rounded-md border border-border`,children:[(0,P.jsx)(x,{item:e,className:`h-28 w-full object-cover`}),(0,P.jsx)(`p`,{className:`truncate px-2 py-1 text-[11px] text-muted-foreground`,children:e.caption})]},e.id))})})]}),(0,P.jsxs)(v,{children:[(0,P.jsx)(_,{children:(0,P.jsx)(h,{className:`text-base`,children:`3. Gujarati write-up — type or paste`})}),(0,P.jsx)(g,{children:(0,P.jsx)(D,{className:`gu min-h-56`,value:k,onChange:e=>F(e.target.value)})})]}),(0,P.jsxs)(v,{children:[(0,P.jsx)(_,{children:(0,P.jsx)(h,{className:`text-base`,children:`4. Attendance list (auto)`})}),(0,P.jsx)(g,{children:T.length===0?(0,P.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`Mark Present on the Attendance page. Names then print at the foot of the press note, like the Rakshabandhan file.`}):(0,P.jsx)(`ol`,{className:`columns-2 text-sm`,children:T.map(e=>(0,P.jsxs)(`li`,{className:`mb-1`,children:[e.fullName,` · `,e.volunteerId]},e.id))})})]}),(0,P.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,P.jsxs)(m,{onClick:()=>void V(),children:[(0,P.jsx)(i,{}),`View Gujarati press report`]}),(0,P.jsxs)(m,{variant:`outline`,onClick:()=>void H(),children:[(0,P.jsx)(i,{}),`View English NAAC report`]}),(0,P.jsx)(m,{variant:`ghost`,onClick:()=>{c&&(F(A(c,e.settings,T.length)),L(j(c,e.settings,T)),y.success(`Draft restored from event details.`))},children:`Restore draft`})]}),(0,P.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,P.jsx)(C,{children:`English NAAC draft (editable)`}),(0,P.jsx)(D,{className:`min-h-48 font-mono text-xs`,value:I,onChange:e=>L(e.target.value)})]})]})}export{F as component};