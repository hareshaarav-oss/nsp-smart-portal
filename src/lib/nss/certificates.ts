/**
 * File: certificate.ts
 * Description: NSS Certificate Generator Template
 * S D ARTS AND SHAH B R COMMERCE COLLEGE, MANSA
 */

export interface EventDetails {
  eventName: string;            // Udaharan: "TIRANGA RALLY" athva "NSS ORIENTATION PROGRAMME"
  eventDate: string;            // Event ni tareekh (Format: "DD-MM-YYYY" athva "YYYY-MM-DD")
  academicYear?: string;        // Optional: jo na aapo to eventDate parthi automatic calculate thashe
  idPrefix?: string;            // Default: "NSS"
}

export interface StudentCertificateData {
  studentName?: string;         // Jo blank hoy to blank line aavshe
  certificateId?: string;       // Jo na aapo to auto sequence generate thashe
  serialNumber?: number;        // Auto-increment sequence number (e.g. 1, 2, 158)
}

export interface FullCertificateInput extends EventDetails, StudentCertificateData {}

/**
 * Event date parthi academic year automatic shodhavani function
 * (Udaharan: Date '13-08-2026' hoy to '2026-27' aavshe)
 */
export function getAcademicYearFromDate(dateStr: string): string {
  let year: number;
  let month: number;

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else {
      // DD-MM-YYYY
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
    }
  } else {
    const d = new Date(dateStr);
    year = d.getFullYear();
    month = d.getMonth() + 1;
  }

  // Academic year June (month 6) thi start thay che
  if (month >= 6) {
    const nextYearShort = (year + 1).toString().slice(-2);
    return `${year}-${nextYearShort}`;
  } else {
    const currentYearShort = year.toString().slice(-2);
    return `${year - 1}-${currentYearShort}`;
  }
}

/**
 * Event date ne standard 'DD-MM-YYYY' display format ma convert karvani method
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
    // Already DD-MM-YYYY
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Certificate ID automatic generate karvani function
 * (Format: NSS/2026-27/0001, NSS/2026-27/0158)
 */
export function generateCertificateId(
  serialNo: number,
  academicYear: string,
  prefix: string = 'NSS'
): string {
  const paddedNo = String(serialNo).padStart(4, '0');
  return `${prefix}/${academicYear}/${paddedNo}`;
}

/**
 * Ek Single Certificate mate complete HTML & CSS generate kare che
 */
export function generateCertificateHTML(data: FullCertificateInput): string {
  const eventDateFormatted = formatDisplayDate(data.eventDate);
  const academicYear = data.academicYear || getAcademicYearFromDate(data.eventDate);
  const serialNo = data.serialNumber || 1;
  const certificateId = data.certificateId || generateCertificateId(serialNo, academicYear, data.idPrefix);
  
  // Student name jo blank hoy to handwriting mate khali under-line aavshe
  const nameHTML = data.studentName && data.studentName.trim().length > 0
    ? `<span class="student-name">${data.studentName}</span>`
    : `<span class="student-name-blank">&nbsp;</span>`;

  return `
  <div class="certificate-page">
    <div class="outer-border">
      <div class="inner-border">
        
        <!-- Corner Floral Ornaments -->
        <div class="corner-ornament top-left"></div>
        <div class="corner-ornament top-right"></div>
        <div class="corner-ornament bottom-left"></div>
        <div class="corner-ornament bottom-right"></div>

        <!-- Header Section -->
        <header class="header">
          <div class="logo-box college-logo">
            <!-- College Emblem SVG -->
            <svg viewBox="0 0 100 100" class="logo-svg">
              <circle cx="50" cy="50" r="46" fill="#fdf8e2" stroke="#2d6a4f" stroke-width="3"/>
              <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#b0892e" stroke-width="1.5" stroke-dasharray="3,2"/>
              <path d="M 50 20 C 44 32, 42 42, 50 56 C 58 42, 56 32, 50 20 Z" fill="#d90429"/>
              <circle cx="50" cy="38" r="4" fill="#ffd166"/>
              <path d="M 32 60 Q 50 68 68 60 L 64 64 Q 50 72 36 64 Z" fill="#1b4332"/>
              <path d="M 38 65 Q 50 78 62 65 L 50 74 Z" fill="#b0892e"/>
              <path d="M 24 48 C 22 36, 32 26, 50 25 C 68 26, 78 36, 76 48 C 72 65, 50 78, 50 78 C 50 78, 28 65, 24 48 Z" fill="none" stroke="#2d6a4f" stroke-width="1.2"/>
            </svg>
          </div>

          <div class="college-details">
            <h1 class="college-name">S D ARTS AND SHAH B R COMMERCE COLLEGE, MANSA</h1>
            <p class="management-name">Managed by Mansa Education Society</p>
            <h2 class="nss-title">NATIONAL SERVICE SCHEME (NSS) UNIT</h2>
            <div class="divider-gold">
              <span class="star-ornament">❖</span>
            </div>
            <h3 class="cert-award-title">CERTIFICATE OF PARTICIPATION</h3>
            <div class="divider-small">
              <span class="star-ornament">❧</span>
            </div>
          </div>

          <div class="logo-box nss-logo">
            <!-- Official NSS Konark Wheel Logo SVG -->
            <svg viewBox="0 0 100 100" class="logo-svg">
              <circle cx="50" cy="50" r="47" fill="#0d2c6c" stroke="#b0892e" stroke-width="2"/>
              <circle cx="50" cy="50" r="37" fill="#ffffff"/>
              <circle cx="50" cy="50" r="35" fill="#d90429"/>
              <circle cx="50" cy="50" r="14" fill="#ffffff"/>
              <circle cx="50" cy="50" r="9" fill="#0d2c6c"/>
              <circle cx="50" cy="50" r="4" fill="#ffffff"/>
              <!-- 8 Spokes of Konark Wheel -->
              <g stroke="#ffffff" stroke-width="3" stroke-linecap="round">
                <line x1="50" y1="15" x2="50" y2="85"/>
                <line x1="15" y1="50" x2="85" y2="50"/>
                <line x1="25" y1="25" x2="75" y2="75"/>
                <line x1="25" y1="75" x2="75" y2="25"/>
              </g>
              <circle cx="50" cy="50" r="47" fill="none" stroke="#b0892e" stroke-width="1.5"/>
            </svg>
          </div>
        </header>

        <!-- Presentation Text & Dynamic Student Name -->
        <div class="body-content">
          <p class="present-lead">This is proudly presented to</p>
          
          <div class="recipient-name-container">
            ${nameHTML}
          </div>

          <!-- Dynamic Body Paragraph -->
          <p class="cert-statement">
            for actively participating with exemplary dedication in the 
            <span class="highlight-event">${data.eventName}</span> organised by the 
            <strong>National Service Scheme Unit</strong> of 
            <span class="highlight-college">S D ARTS AND SHAH B R COMMERCE COLLEGE, MANSA</span> 
            during the academic year <strong class="highlight-year">${academicYear}</strong>. 
            We highly appreciate their sincere efforts, active involvement and valuable contribution 
            towards community service and nation-building.
          </p>
        </div>

        <!-- NOT ME BUT YOU Slogan Ribbon Box -->
        <div class="motto-container">
          <div class="motto-box">
            <span class="sparkle">✤</span>
            <span class="motto-text">NOT ME BUT YOU</span>
            <span class="sparkle">✤</span>
          </div>
        </div>

        <!-- Left Art Graphics (NSS Volunteers) -->
        <div class="art-graphic left-graphic">
          <svg viewBox="0 0 160 130" class="art-svg">
            <!-- Marching Volunteers with Indian Tricolour Flag -->
            <path d="M 35 15 L 75 30 L 75 55 L 35 40 Z" fill="#ff9933" opacity="0.85"/>
            <path d="M 35 40 L 75 55 L 75 80 L 35 65 Z" fill="#ffffff" opacity="0.9"/>
            <circle cx="55" cy="60" r="5" fill="#000088"/>
            <path d="M 35 65 L 75 80 L 75 105 L 35 90 Z" fill="#138808" opacity="0.85"/>
            <line x1="35" y1="12" x2="35" y2="128" stroke="#5d4037" stroke-width="3"/>
            <!-- Marching Silhouettes -->
            <circle cx="25" cy="85" r="7" fill="#8892b0" opacity="0.4"/>
            <path d="M 25 93 L 25 115 L 18 128 M 25 115 L 32 128" stroke="#8892b0" stroke-width="2" opacity="0.4"/>
            <circle cx="48" cy="82" r="7" fill="#8892b0" opacity="0.4"/>
            <path d="M 48 90 L 48 112 L 40 125 M 48 112 L 56 125" stroke="#8892b0" stroke-width="2" opacity="0.4"/>
          </svg>
        </div>

        <!-- Right Art Graphics (India Gate Silhouette & Doves) -->
        <div class="art-graphic right-graphic">
          <svg viewBox="0 0 140 120" class="art-svg">
            <path d="M 45 40 L 95 40 L 90 48 L 50 48 Z" fill="#c49a45" opacity="0.35"/>
            <path d="M 50 48 L 50 115 L 62 115 L 62 70 Q 70 60 78 70 L 78 115 L 90 115 L 90 48 Z" fill="#c49a45" opacity="0.35"/>
            <!-- Doves -->
            <path d="M 20 25 Q 30 18 35 25 Q 40 18 50 25 Q 35 30 20 25 Z" fill="#b0bec5" opacity="0.5"/>
            <path d="M 85 18 Q 93 12 97 18 Q 102 12 110 18 Q 98 22 85 18 Z" fill="#b0bec5" opacity="0.5"/>
          </svg>
        </div>

        <!-- Signatures & Golden Medal Center Section -->
        <div class="auth-section">
          <!-- Left Sign: NSS Program Officer -->
          <div class="sign-block left-sign">
            <div class="signature-font">Haresh</div>
            <div class="sign-line"></div>
            <div class="sign-name">Dr. Hareshkumar I. Prajapati</div>
            <div class="sign-role">NSS Program Officer</div>
          </div>

          <!-- Center Golden Medal Badge with Red Ribbons -->
          <div class="medal-badge-box">
            <div class="ribbon-red left-ribbon"></div>
            <div class="ribbon-red right-ribbon"></div>
            <div class="gold-medal-circle">
              <div class="medal-inner-ring">
                <span class="medal-word-bold">NSS</span>
                <span class="medal-sub-word">SERVICE</span>
                <span class="medal-sub-word">DISCIPLINE</span>
                <span class="medal-sub-word">DEDICATION</span>
              </div>
            </div>
          </div>

          <!-- Right Sign: Principal -->
          <div class="sign-block right-sign">
            <div class="signature-font">T.J.Vyas</div>
            <div class="sign-line"></div>
            <div class="sign-name">Dr. Tushar J. Vyas</div>
            <div class="sign-role">Principal</div>
          </div>
        </div>

        <!-- Certificate Meta Info: Dynamic ID & Fixed Event Date -->
        <div class="meta-data-row">
          <div class="meta-item">
            <strong>Certificate ID :</strong> <span class="mono-id">${certificateId}</span>
          </div>
          <div class="meta-item">
            <strong>Date :</strong> <span>${eventDateFormatted}</span>
          </div>
        </div>

        <!-- Bottom Dark Green Bar -->
        <footer class="green-footer-bar">
          <div class="footer-col">
            <span class="footer-icon">👥</span>
            <div>
              <strong>Be a Part of NSS</strong>
              <small>Join NSS and make a difference.</small>
            </div>
          </div>
          <div class="footer-col">
            <span class="footer-icon">🎓</span>
            <div>
              <strong>Learn & Lead</strong>
              <small>Develop skills, leadership and confidence</small>
            </div>
          </div>
          <div class="footer-col">
            <span class="footer-icon">🇮🇳</span>
            <div>
              <strong>Serve the Nation</strong>
              <small>Work for the welfare of the community.</small>
            </div>
          </div>
          <div class="footer-col">
            <span class="footer-icon">🌱</span>
            <div>
              <strong>Create Impact</strong>
              <small>Small efforts, big changes.</small>
            </div>
          </div>
        </footer>

      </div>
    </div>
  </div>
  `;
}

/**
 * Multiple students mate bulk certificates generate karvani method
 */
export function generateBatchCertificates(
  students: string[],
  eventDetails: EventDetails
): string {
  // Jo vidyarthi list khali hoy to ek blank template generate thashe
  const studentList = students.length > 0 ? students : [''];

  const academicYear = eventDetails.academicYear || getAcademicYearFromDate(eventDetails.eventDate);
  const prefix = eventDetails.idPrefix || 'NSS';

  const certificateCardsHTML = studentList.map((studentName, idx) => {
    const serialNo = idx + 1;
    const certId = generateCertificateId(serialNo, academicYear, prefix);
    return generateCertificateHTML({
      ...eventDetails,
      studentName,
      serialNumber: serialNo,
      certificateId: certId,
      academicYear
    });
  }).join('\n<div class="page-break"></div>\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NSS Certificates - ${eventDetails.eventName}</title>
  <!-- Google Fonts for exact match styling -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@600;700;800;900&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
  
  <style>
    /* CSS Reset & Print Page Setup */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      background-color: #e5e7eb;
      font-family: 'Montserrat', sans-serif;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* Standard A4 Landscape Dimensions: 297mm x 210mm */
    .certificate-page {
      width: 297mm;
      height: 210mm;
      margin: 10mm auto;
      padding: 7mm;
      background: #ffffff;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      overflow: hidden;
    }

    @media print {
      body {
        background: transparent;
      }
      .certificate-page {
        margin: 0;
        box-shadow: none;
        width: 297mm;
        height: 210mm;
      }
    }

    /* Ornate Outer & Inner Borders */
    .outer-border {
      width: 100%;
      height: 100%;
      border: 3px solid #b8860b;
      padding: 4px;
      position: relative;
    }
    .inner-border {
      width: 100%;
      height: 100%;
      border: 1.5px solid #14422e;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: radial-gradient(circle at center, #ffffff 60%, #fffdf7 100%);
    }

    /* Corner Floral Filigree Embellishments */
    .corner-ornament {
      position: absolute;
      width: 46px;
      height: 46px;
      background-image: radial-gradient(circle, #b8860b 15%, transparent 16%),
                        linear-gradient(45deg, transparent 48%, #b8860b 50%, transparent 52%);
      pointer-events: none;
      z-index: 2;
    }
    .top-left { top: 4px; left: 4px; border-top: 2px solid #b8860b; border-left: 2px solid #b8860b; }
    .top-right { top: 4px; right: 4px; border-top: 2px solid #b8860b; border-right: 2px solid #b8860b; }
    .bottom-left { bottom: 44px; left: 4px; border-bottom: 2px solid #b8860b; border-left: 2px solid #b8860b; }
    .bottom-right { bottom: 44px; right: 4px; border-bottom: 2px solid #b8860b; border-right: 2px solid #b8860b; }

    /* Header Section */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 28px 4px 28px;
    }
    .logo-box {
      width: 82px;
      height: 82px;
      flex-shrink: 0;
    }
    .logo-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
    }
    .college-details {
      text-align: center;
      flex-grow: 1;
      padding: 0 15px;
    }
    .college-name {
      font-family: 'Cinzel', serif;
      font-weight: 800;
      font-size: 21px;
      letter-spacing: 0.5px;
      color: #0b3d2c;
      margin-bottom: 2px;
    }
    .management-name {
      font-size: 12px;
      color: #4b5563;
      font-weight: 500;
      letter-spacing: 0.3px;
    }
    .nss-title {
      font-family: 'Cinzel', serif;
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      letter-spacing: 1px;
      margin-top: 3px;
    }
    .divider-gold {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 3px auto;
      width: 45%;
      height: 1px;
      background: linear-gradient(to right, transparent, #b8860b, transparent);
    }
    .divider-small {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2px auto;
      width: 25%;
      height: 1px;
      background: linear-gradient(to right, transparent, #b8860b, transparent);
    }
    .star-ornament {
      color: #b8860b;
      font-size: 11px;
      padding: 0 5px;
      background: #ffffff;
    }
    .cert-award-title {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 800;
      color: #0b3d2c;
      letter-spacing: 3px;
    }

    /* Body Text & Student Name */
    .body-content {
      text-align: center;
      padding: 0 50px;
      position: relative;
      z-index: 1;
    }
    .present-lead {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 16.5px;
      color: #374151;
      margin-bottom: 2px;
    }
    .recipient-name-container {
      min-height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2px 0 6px 0;
    }
    .student-name {
      font-family: 'Alex Brush', cursive;
      font-size: 44px;
      color: #a31d1d;
      font-weight: bold;
      letter-spacing: 1px;
      text-shadow: 0 1px 1px rgba(0,0,0,0.06);
    }
    .student-name-blank {
      display: inline-block;
      width: 460px;
      border-bottom: 2px dashed #b8860b;
      height: 38px;
    }
    .cert-statement {
      font-family: 'Montserrat', sans-serif;
      font-style: italic;
      font-size: 13.5px;
      line-height: 1.58;
      color: #2b303a;
      max-width: 890px;
      margin: 0 auto;
    }
    .highlight-event {
      font-weight: 800;
      color: #111827;
      text-transform: uppercase;
      font-style: normal;
    }
    .highlight-college {
      font-weight: 700;
      color: #0b3d2c;
      font-style: normal;
    }
    .highlight-year {
      font-style: normal;
      font-weight: 700;
    }

    /* Motto Ribbon */
    .motto-container {
      display: flex;
      justify-content: center;
      margin: 6px 0 4px 0;
      z-index: 1;
    }
    .motto-box {
      border: 1.5px solid #1c3d72;
      padding: 2.5px 22px;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
    .motto-text {
      font-family: 'Cinzel', serif;
      font-weight: 800;
      font-size: 18px;
      color: #d35400;
      letter-spacing: 2px;
    }
    .sparkle {
      color: #1c3d72;
      font-size: 13px;
    }

    /* Left & Right Decorative Watermark Graphics */
    .art-graphic {
      position: absolute;
      bottom: 60px;
      width: 140px;
      height: 120px;
      pointer-events: none;
      z-index: 0;
      opacity: 0.85;
    }
    .left-graphic { left: 16px; }
    .right-graphic { right: 16px; }
    .art-svg { width: 100%; height: 100%; }

    /* Signatures and Golden Medal Center Section */
    .auth-section {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 0 45px;
      position: relative;
      margin-top: 4px;
      z-index: 2;
    }
    .sign-block {
      text-align: center;
      width: 220px;
    }
    .signature-font {
      font-family: 'Alex Brush', cursive;
      font-size: 32px;
      color: #1e3a8a;
      line-height: 1;
      height: 34px;
    }
    .sign-line {
      border-top: 1.5px solid #4b5563;
      margin: 3px auto 4px auto;
      width: 170px;
    }
    .sign-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #111827;
    }
    .sign-role {
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
    }

    /* Golden Medal Seal & Red Ribbons */
    .medal-badge-box {
      position: relative;
      width: 72px;
      height: 72px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ribbon-red {
      position: absolute;
      bottom: -15px;
      width: 24px;
      height: 38px;
      background: #b91c1c;
      z-index: 0;
    }
    .left-ribbon {
      left: 12px;
      transform: rotate(20deg);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
    }
    .right-ribbon {
      right: 12px;
      transform: rotate(-20deg);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
    }
    .gold-medal-circle {
      width: 66px;
      height: 66px;
      border-radius: 50%;
      background: radial-gradient(circle, #f9df7b 0%, #d4af37 60%, #996515 100%);
      box-shadow: 0 3px 6px rgba(0,0,0,0.25);
      border: 2px dashed #684200;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
    }
    .medal-inner-ring {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 1px solid #7c4a03;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #d4af37;
    }
    .medal-word-bold {
      font-family: 'Cinzel', serif;
      font-size: 11px;
      font-weight: 900;
      color: #3e2723;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    .medal-sub-word {
      font-size: 6px;
      font-weight: 800;
      color: #3e2723;
      letter-spacing: 0.4px;
      line-height: 1.1;
    }

    /* Meta Details Row (Certificate ID & Date) */
    .meta-data-row {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 4px 60px;
      font-size: 11.5px;
      color: #1f2937;
      z-index: 2;
    }
    .mono-id {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
    }

    /* Dark Green Bottom Ribbon */
    .green-footer-bar {
      background-color: #0d3826;
      color: #ffffff;
      height: 40px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      align-items: center;
      padding: 0 16px;
      border-top: 1.5px solid #b8860b;
      z-index: 2;
    }
    .footer-col {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .footer-icon {
      font-size: 14px;
    }
    .footer-col strong {
      display: block;
      font-size: 9.5px;
      letter-spacing: 0.2px;
      color: #fef08a;
    }
    .footer-col small {
      display: block;
      font-size: 7.5px;
      color: #d1fae5;
      line-height: 1.1;
    }
  </style>
</head>
<body>
  ${certificateCardsHTML}

  <script>
    // Browser print window trigger
    window.addEventListener('load', () => {
      // Uncomment below line if you want auto-print dialog on open:
      // window.print();
    });
  </script>
</body>
</html>
  `;
}

/**
 * Direct print/download trigger helper function
 */
export function openPrintCertificateWindow(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

// --------------------------------------------------------------------------
// Example Demo Usage:
// --------------------------------------------------------------------------
/*
const eventInfo: EventDetails = {
  eventName: "TIRANGA RALLY",
  eventDate: "13-08-2026", // Academic year '2026-27' automatic set thashe
};

// 1. Vidyarthio ni list sathe automatic sequential IDs:
const studentList = [
  "Mahi Sharadkumar Patel",
  "ANJALI Amrutbhai Raval",
  "Prajapati Rahul K."
];

const generatedHtml = generateBatchCertificates(studentList, eventInfo);

// 2. Blank certificates mate (handwriting thi lakhva mate):
const blankCertHtml = generateBatchCertificates([], eventInfo);
*/