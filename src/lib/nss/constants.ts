import type { PortalSettings } from "./types";

export const COLLEGE_LOGO = "/images/college-logo.png";
export const NSS_LOGO = "/images/nss-logo.png";

export const APP_NAME = "NSP";
export const APP_TITLE = "NSS Smart Portal";
export const SLOGAN_EN = "Not Me, But You";
export const SLOGAN_GU = "હું નહિ પણ તમે";
export const OLD_SLOGAN_GU = "નહીં હું, પણ અમે";

export const WA_GIRLS = "https://chat.whatsapp.com/CwY4ERY2l24CzdnhWOC6RI";
export const WA_BOYS = "https://chat.whatsapp.com/JqRZ51TGuZGCbXY62jm4zS";
export const WA_LEADERS = "https://chat.whatsapp.com/CTZ6ATMbQB17PhVERCgZ4D";

export const BIRTHDAY_TEMPLATE = `🎉 *NSS PARIVAR વતી જન્મદિવસની હાર્દિક શુભેચ્છાઓ!* 🎉

પ્રિય *{{NAME}}*,

આજે તમારા જન્મદિવસ નિમિત્તે સમગ્ર *NSS પરિવાર* તમને હાર્દિક વધાઈ પાઠવે છે! 🎂🎈

તમારું જીવન આનંદ, સ્વાસ્થ્ય અને સફળતાથી ભરપૂર રહે.
સેવા અને રાષ્ટ્રનિર્માણના માર્ગે તમે હંમેશા આગળ વધો.

*"હું નહિ પણ તમે"*

🌸 શુભેચ્છાઓ સહ,
*NSS Unit*
S D ARTS AND SHAH B R COMMERCE COLLEGE, MANSA
Dr. Hareshkumar I. Prajapati
(NSS Programme Officer)`;

export const DEFAULT_SETTINGS: PortalSettings = {
  collegeName: "S.D. Arts and Shah B.R. Commerce College, Mansa",
  collegeShort: "S.D. Arts & Shah B.R. Commerce College",
  portalName: "NSS SMART PORTAL",
  poName: "Dr. Hareshkumar I. Prajapati",
  principalName: "Dr. Tushar J. Vyas",
  principalQuote:
    "Welcome to the NSS Smart Portal. Our NSS unit has always been at the forefront of community service and youth empowerment.",
  poQuote:
    "યુવા શક્તિ - રાષ્ટ્ર શક્તિ! 'હું નહિ પણ તમે' ના પવિત્ર ધ્યેય સાથે ચાલો આપણે સૌ સાથે મળીને સકારાત્મક બદલાવ લાવીએ.",
  sloganEn: SLOGAN_EN,
  sloganGu: SLOGAN_GU,
  poUsername: "po",
  poPassword: "haresh123",
  adminUsername: "admin",
  adminPassword: "haresh123",
  poWhatsapp: "9824339518",
  alumniCount: 0,
  academicYear: "2026-27",
  serviceHourTarget: 120,
  waGirls: WA_GIRLS,
  waBoys: WA_BOYS,
  waLeaders: WA_LEADERS,
  address: "Mansa, Gujarat, India",
  website: "",
  contactEmail: "",
  birthdayEnabled: true,
  birthdayTemplate: BIRTHDAY_TEMPLATE,
  birthdayShowOnDashboard: true,
  birthdayAutoWishLabel: "Birthday wishes",
  showHomeOfficers: true,
  showHomeGallery: true,
  showHomeStats: true,
  showHomeNotices: true,
  showHomeEvents: true,
  heroAutoPlay: true,
  heroIntervalSeconds: 5,
  certificateQrEnabled: true,
  certificateFooterText: "Be a Part of NSS • Learn & Lead • Serve the Nation • Create Impact",
  certificateTemplateUrl: "",
  poSignature: "",
  principalSignature: "",
  themeMode: "system",
};

export const STORAGE_DATA = "nsp-portal-data-v1";
export const STORAGE_SESSION = "nsp-portal-session-v1";
export const STORAGE_VISITOR_MARK = "nsp-visitor-session";
