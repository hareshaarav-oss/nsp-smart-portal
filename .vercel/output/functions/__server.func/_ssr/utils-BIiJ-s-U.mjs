import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-BIiJ-s-U.js
var COLLEGE_LOGO = "/images/college-logo.png";
var NSS_LOGO = "/images/nss-logo.png";
var SLOGAN_EN = "Not Me, But You";
var SLOGAN_GU = "હું નહિ પણ તમે";
var OLD_SLOGAN_GU = "નહીં હું, પણ અમે";
var WA_GIRLS = "https://chat.whatsapp.com/CwY4ERY2l24CzdnhWOC6RI";
var WA_BOYS = "https://chat.whatsapp.com/JqRZ51TGuZGCbXY62jm4zS";
var WA_LEADERS = "https://chat.whatsapp.com/CTZ6ATMbQB17PhVERCgZ4D";
var BIRTHDAY_TEMPLATE = `🎉 *NSS PARIVAR વતી જન્મદિવસની હાર્દિક શુભેચ્છાઓ!* 🎉

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
var DEFAULT_SETTINGS = {
	collegeName: "S.D. Arts and Shah B.R. Commerce College, Mansa",
	collegeShort: "S.D. Arts & Shah B.R. Commerce College",
	portalName: "NSS SMART PORTAL",
	poName: "Dr. Hareshkumar I. Prajapati",
	principalName: "Dr. Tushar J. Vyas",
	principalQuote: "Welcome to the NSS Smart Portal. Our NSS unit has always been at the forefront of community service and youth empowerment.",
	poQuote: "યુવા શક્તિ - રાષ્ટ્ર શક્તિ! 'હું નહિ પણ તમે' ના પવિત્ર ધ્યેય સાથે ચાલો આપણે સૌ સાથે મળીને સકારાત્મક બદલાવ લાવીએ.",
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
	themeMode: "system"
};
var STORAGE_DATA = "nsp-portal-data-v1";
var STORAGE_SESSION = "nsp-portal-session-v1";
var STORAGE_VISITOR_MARK = "nsp-visitor-session";
var MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
function parseDob(raw) {
	const value = String(raw ?? "").trim();
	if (!value) return "";
	if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
	const dmy = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
	if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
	const dmyShort = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2})$/);
	if (dmyShort) return `${Number(dmyShort[3]) > 30 ? `19${dmyShort[3]}` : `20${dmyShort[3]}`}-${dmyShort[2].padStart(2, "0")}-${dmyShort[1].padStart(2, "0")}`;
	const parsed = new Date(value);
	if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
	return "";
}
function byFullName(a, b) {
	return a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" });
}
function cleanPersonName(fullName) {
	return String(fullName ?? "").replace(/\+?91[\s-]*/g, " ").replace(/\d{6,}/g, " ").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
}
/** First name in CAPITAL letters — MAHI Sharadkumar Patel */
function titleFirstName(fullName) {
	const parts = cleanPersonName(fullName).split(/\s+/).filter(Boolean);
	if (!parts.length) return "";
	parts[0] = parts[0].toLocaleUpperCase("en-IN");
	return parts.join(" ");
}
function firstNameOf(fullName) {
	return (cleanPersonName(fullName).split(/\s+/).filter(Boolean)[0] || "").toLocaleUpperCase("en-IN");
}
function certDisplayName(fullName) {
	const parts = cleanPersonName(fullName).split(/\s+/).filter(Boolean);
	if (!parts.length) return "";
	const rest = parts.slice(1).map((part) => {
		if (/^[A-Z]\.?$/i.test(part)) return part.toUpperCase();
		return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
	});
	return [parts[0].toLocaleUpperCase("en-IN"), ...rest].join(" ");
}
function idCardName(fullName) {
	return cleanPersonName(fullName).toLocaleUpperCase("en-IN");
}
function formatLongDate(iso) {
	const value = parseDob(iso) || iso;
	if (!value) return "—";
	const [y, m, d] = value.split("-").map(Number);
	if (!y || !m || !d) return iso;
	return `${d} ${MONTHS[m - 1]} ${y}`;
}
function formatShortDate(iso) {
	const value = parseDob(iso) || iso;
	if (!value) return "—";
	const [y, m, d] = value.split("-");
	if (!y || !m || !d) return iso;
	return `${d}/${m}/${y}`;
}
function todayIso() {
	const n = /* @__PURE__ */ new Date();
	return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function monthDay(iso) {
	const parts = (parseDob(iso) || iso).split("-");
	return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : "";
}
function isBirthdayOn(isoDob, onIso) {
	const a = monthDay(isoDob);
	const b = monthDay(onIso);
	return Boolean(a && b && a === b);
}
function nextBirthdayDate(isoDob, fromIso = todayIso()) {
	const dob = parseDob(isoDob);
	const [, mm, dd] = dob.split("-");
	const [fy, fm, fd] = fromIso.split("-").map(Number);
	if (!mm || !dd || !fy) return dob || isoDob;
	return `${`${String(fm).padStart(2, "0")}${String(fd).padStart(2, "0")}` > `${mm}${dd}` ? fy + 1 : fy}-${mm}-${dd}`;
}
function daysUntilBirthday(isoDob, fromIso = todayIso()) {
	const next = nextBirthdayDate(isoDob, fromIso);
	const a = /* @__PURE__ */ new Date(`${fromIso}T00:00:00`);
	const b = /* @__PURE__ */ new Date(`${next}T00:00:00`);
	if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 999;
	return Math.round((b.getTime() - a.getTime()) / 864e5);
}
function padId(n) {
	return String(n).padStart(3, "0");
}
function academicYear(iso = todayIso()) {
	const [y, m] = iso.split("-").map(Number);
	const start = (m ?? 1) >= 6 ? y : y - 1;
	const startYear = Math.max(start, 2026);
	return `${startYear}-${String(startYear + 1).slice(-2)}`;
}
function digitsOnly(value) {
	return value.replace(/\D/g, "");
}
function waPhone(mobile) {
	const d = digitsOnly(mobile);
	if (d.length === 10) return `91${d}`;
	if (d.length === 12 && d.startsWith("91")) return d;
	if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
	return d;
}
var NAMES = [{
	fullName: "Mahi Sharadkumar Patel",
	gender: "Female",
	course: "B.Com.",
	role: "Leader",
	dob: "2006-08-26",
	sem: "3"
}, {
	fullName: "Aarav Hiteshbhai Shah",
	gender: "Male",
	course: "B.A.",
	role: "Leader",
	dob: "2005-11-14",
	sem: "5"
}];
function seedVolunteers() {
	return NAMES.map((n, i) => {
		const num = String(i + 1).padStart(3, "0");
		return {
			id: `vol-${num}`,
			volunteerId: `NSS${num}`,
			enrollment: `2026-${n.sem}-${num}`,
			fullName: titleFirstName(n.fullName),
			mobile: `98765${String(1e4 + i + 1).slice(-5)}`,
			email: `${n.fullName.split(" ")[0]?.toLowerCase() ?? "nss"}.${num}@sdmansa.edu.in`,
			course: n.course,
			semester: n.sem,
			unit: i % 2 === 0 ? "Unit 1" : "Unit 2",
			nssRole: n.role,
			fatherName: n.fullName.split(" ").slice(1).join(" "),
			dob: n.dob,
			gender: n.gender,
			bloodGroup: "O+",
			address: "Mansa, Gandhinagar, Gujarat",
			parentMobile: `98250${String(2e4 + i + 1).slice(-5)}`,
			createdAt: "2026-06-15"
		};
	});
}
function seedEvents() {
	return [{
		id: "evt-camp",
		name: "NSS Camp",
		date: "2026-09-05",
		location: "Adopted village, Mansa",
		hours: 40,
		status: "upcoming",
		description: "Seven-day special camping programme.",
		createdAt: "2026-08-18"
	}];
}
function seedNotices() {
	return [{
		id: "ntc-reg",
		title: "NSS registration reminder",
		body: "NSS માં જે VOLUNTEERS છે તેમને રજીસ્ટ્રેશન કરવું ફરજિયાત છે.",
		date: "2026-08-11",
		audience: "all",
		createdAt: "2026-08-11"
	}];
}
function createSeedState() {
	return {
		volunteers: seedVolunteers(),
		events: seedEvents(),
		attendance: [],
		eventRsvps: [],
		notices: seedNotices(),
		gallery: [],
		certificates: [],
		pressReports: [],
		logs: [],
		settings: DEFAULT_SETTINGS,
		visitors: 1361,
		recycleBin: []
	};
}
var DB_NAME = "nsp-media-v1";
var STORE = "files";
var HD_EDGE = 1920;
var PORTRAIT_EDGE = 720;
var PHOTO_QUALITY = .88;
var VIDEO_MAX_BYTES = 83886080;
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function putMedia(key, blob) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(blob, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
async function getMedia(key) {
	try {
		const db = await openDb();
		const blob = await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => reject(req.error);
		});
		db.close();
		return blob;
	} catch {
		return null;
	}
}
async function deleteMedia(key) {
	try {
		const db = await openDb();
		await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.objectStore(STORE).delete(key);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
		db.close();
	} catch {}
}
function canvasToJpeg(canvas, quality) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => blob ? resolve(blob) : reject(/* @__PURE__ */ new Error("compress failed")), "image/jpeg", quality);
	});
}
async function compressImageFile(file, maxEdge = HD_EDGE, quality = PHOTO_QUALITY) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas unavailable");
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	return {
		blob: await canvasToJpeg(canvas, quality),
		width,
		height
	};
}
async function compressPortrait(file) {
	return compressImageFile(file, PORTRAIT_EDGE, .86);
}
async function compressPassport(file) {
	return compressImageFile(file, 240, .82);
}
async function videoPoster(file) {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const video = document.createElement("video");
		video.preload = "metadata";
		video.muted = true;
		video.playsInline = true;
		const cleanup = () => {
			URL.revokeObjectURL(url);
			video.remove();
		};
		video.onloadeddata = () => {
			try {
				video.currentTime = Math.min(.4, (video.duration || 1) / 4);
			} catch {
				resolve(null);
				cleanup();
			}
		};
		video.onseeked = () => {
			try {
				const canvas = document.createElement("canvas");
				const w = video.videoWidth || 1280;
				const h = video.videoHeight || 720;
				const scale = Math.min(1, 1280 / Math.max(w, h));
				canvas.width = Math.round(w * scale);
				canvas.height = Math.round(h * scale);
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve(null);
					cleanup();
					return;
				}
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				canvas.toBlob((blob) => {
					resolve(blob);
					cleanup();
				}, "image/jpeg", .82);
			} catch {
				resolve(null);
				cleanup();
			}
		};
		video.onerror = () => {
			resolve(null);
			cleanup();
		};
		video.src = url;
	});
}
function assertVideoSize(file) {
	if (file.size > VIDEO_MAX_BYTES) throw new Error("Video is over 80 MB. Please compress it first, then upload.");
}
function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}
function folderName(eventName) {
	return eventName.trim() || "General";
}
function migrateSlogan(text) {
	if (typeof text !== "string") return typeof text === "undefined" ? "" : String(text ?? "");
	return text.replaceAll(OLD_SLOGAN_GU, SLOGAN_GU).replaceAll("નહીં હું, પણ અમે", SLOGAN_GU).replaceAll("નહિ હું, પણ અમે", SLOGAN_GU).replaceAll("નહીં હું પણ અમે", SLOGAN_GU).replaceAll("નહિ હું પણ અમે", SLOGAN_GU).replaceAll("હું નહીં, પણ તમે", SLOGAN_GU).replaceAll("હું નહીં પણ તમે", SLOGAN_GU);
}
function isRecord(v) {
	return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}
function asArray(value, fallback) {
	return Array.isArray(value) ? value : fallback;
}
function uniqueBy(items, key) {
	const seen = /* @__PURE__ */ new Set();
	return items.filter((item) => {
		const value = key(item);
		if (!value || seen.has(value)) return false;
		seen.add(value);
		return true;
	});
}
function dedupeVolunteers(items) {
	return uniqueBy(items, (v) => {
		const mobile = digits(v.mobile).slice(-10);
		if (mobile.length === 10) return `mobile:${mobile}`;
		if (v.enrollment) return `enrollment:${v.enrollment}`;
		return `id:${v.id}`;
	});
}
function dedupeEvents(items) {
	return uniqueBy(items, (e) => e.id || `${e.name}|${e.date}|${e.location}`);
}
function dedupeAttendance(items) {
	return uniqueBy(items, (a) => `${a.volunteerId}|${a.eventId}`);
}
function dedupeNotices(items) {
	return uniqueBy(items, (n) => n.id || `${n.title}|${n.date}|${n.createdAt}`);
}
function dedupeGallery(items) {
	return uniqueBy(items, (g) => g.mediaKey || g.id || `${g.eventId}|${g.date}|${g.caption}`);
}
function dedupeCertificates(items) {
	return uniqueBy(items, (c) => `${c.volunteerId}|${c.eventId}`);
}
function dedupePressReports(items) {
	return uniqueBy(items, (r) => r.mediaKey || r.id || `${r.fileName}|${r.date}|${r.eventId ?? ""}`);
}
function looksLikeSeed(vols) {
	if (!vols.length) return true;
	if (vols.length > 30) return false;
	return vols.every((v) => String(v.id).startsWith("vol-"));
}
function digits(value) {
	return String(value ?? "").replace(/\D/g, "");
}
function unwrapPersisted(raw) {
	const parsed = JSON.parse(raw);
	if (isRecord(parsed) && "state" in parsed) return raw;
	return JSON.stringify({
		state: parsed,
		version: 0
	});
}
function readLegacyPortalJson() {
	if (typeof window === "undefined") return null;
	try {
		const primary = localStorage.getItem(STORAGE_DATA);
		if (primary) return unwrapPersisted(primary);
		for (let i = 0; i < localStorage.length; i += 1) {
			const key = localStorage.key(i);
			if (!key || key === "nsp-portal-session-v1") continue;
			const value = localStorage.getItem(key);
			if (!value || !value.includes("volunteers")) continue;
			try {
				const wrapped = unwrapPersisted(value);
				const parsed = JSON.parse(wrapped);
				if (Array.isArray(parsed.state?.volunteers)) {
					localStorage.setItem(STORAGE_DATA, wrapped);
					return wrapped;
				}
			} catch {}
		}
	} catch {}
	return null;
}
var portalStorage = createJSONStorage(() => ({
	getItem: (name) => {
		if (typeof window === "undefined") return null;
		try {
			const raw = localStorage.getItem(name);
			if (raw) return unwrapPersisted(raw);
			return readLegacyPortalJson();
		} catch {
			return null;
		}
	},
	setItem: (name, value) => {
		if (typeof window === "undefined") return;
		localStorage.setItem(name, value);
	},
	removeItem: (name) => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(name);
	}
}));
function mergePortalState(persisted, current) {
	const p = isRecord(persisted) ? persisted : {};
	const incomingSettings = isRecord(p.settings) ? p.settings : {};
	const settings = {
		...current.settings,
		...incomingSettings
	};
	settings.sloganGu = migrateSlogan(settings.sloganGu || "હું નહિ પણ તમે") || "હું નહિ પણ તમે";
	if (settings.sloganGu === "નહીં હું, પણ અમે") settings.sloganGu = SLOGAN_GU;
	settings.sloganEn = settings.sloganEn || current.settings.sloganEn;
	settings.poQuote = migrateSlogan(settings.poQuote || current.settings.poQuote);
	settings.waGirls = settings.waGirls || current.settings.waGirls;
	settings.waBoys = settings.waBoys || current.settings.waBoys;
	settings.waLeaders = settings.waLeaders || current.settings.waLeaders;
	const persistedVols = asArray(p.volunteers, []);
	const seed = looksLikeSeed(persistedVols);
	const eventRsvps = uniqueBy(asArray(p.eventRsvps, current.eventRsvps ?? []), (r) => `${r.volunteerId}|${r.eventId}`);
	const gallery = dedupeGallery(asArray(p.gallery, current.gallery).filter((g) => g.mediaKey || g.src && !g.src.startsWith("/images/gallery-")));
	return {
		...current,
		volunteers: seed ? current.volunteers : dedupeVolunteers(persistedVols.map((v) => ({
			...v,
			fullName: titleFirstName(v.fullName)
		}))),
		events: dedupeEvents(asArray(p.events, current.events)),
		attendance: seed ? [] : dedupeAttendance(asArray(p.attendance, [])),
		eventRsvps: seed ? [] : eventRsvps,
		notices: dedupeNotices(asArray(p.notices, current.notices)),
		gallery,
		certificates: seed ? [] : dedupeCertificates(asArray(p.certificates, [])),
		pressReports: seed ? [] : dedupePressReports(asArray(p.pressReports, [])),
		logs: asArray(p.logs, current.logs ?? []),
		settings,
		visitors: typeof p.visitors === "number" ? p.visitors : current.visitors,
		recycleBin: asArray(p.recycleBin, current.recycleBin ?? [])
	};
}
var useNssStore = create()(persist((set, get) => ({
	...createSeedState(),
	hydrate: () => {
		useNssStore.persist.rehydrate();
	},
	resetDemo: () => set({
		...createSeedState(),
		eventRsvps: [],
		recycleBin: []
	}),
	applyCloud: (cloud) => {
		const current = get();
		const next = {};
		if (Array.isArray(cloud.volunteers) && cloud.volunteers.length >= 20) {
			const localById = new Map(current.volunteers.map((v) => [v.id, v]));
			const localByMobile = new Map(current.volunteers.map((v) => [digits(v.mobile).slice(-10), v]));
			next.volunteers = dedupeVolunteers(cloud.volunteers.map((row) => {
				const prev = localById.get(row.id) || localByMobile.get(digits(row.mobile).slice(-10));
				return {
					...row,
					fullName: titleFirstName(row.fullName || prev?.fullName || ""),
					dob: parseDob(row.dob) || parseDob(prev?.dob) || row.dob,
					status: prev?.status === "alumni" ? "alumni" : row.status ?? "active",
					alumniYear: prev?.alumniYear ?? row.alumniYear,
					alumniNotes: prev?.alumniNotes ?? row.alumniNotes,
					photoUrl: prev?.photoUrl || row.photoUrl && row.photoUrl.length < 12e4 ? row.photoUrl : "",
					emergencyContact: row.emergencyContact || prev?.emergencyContact,
					loginPassword: prev?.loginPassword || row.loginPassword,
					mpin: prev?.mpin,
					webauthnId: prev?.webauthnId
				};
			}).sort(byFullName));
			if (looksLikeSeed(current.volunteers)) {
				next.attendance = [];
				next.certificates = [];
			} else {
				const newByOld = /* @__PURE__ */ new Map();
				for (const old of current.volunteers) {
					const neu = next.volunteers?.find((v) => v.id === old.id) || next.volunteers?.find((v) => digits(v.mobile).slice(-10) === digits(old.mobile).slice(-10));
					if (neu) newByOld.set(old.id, neu.id);
				}
				next.attendance = dedupeAttendance(current.attendance.map((row) => ({
					...row,
					volunteerId: newByOld.get(row.volunteerId) || ""
				})).filter((row) => row.volunteerId));
			}
		}
		if (Array.isArray(cloud.events) && cloud.events.length) {
			const localExtra = current.events.filter((e) => e.id.startsWith("evt-") && !cloud.events?.some((c) => c.id === e.id || c.name === e.name));
			next.events = dedupeEvents([...cloud.events, ...localExtra]);
		}
		if (Array.isArray(cloud.notices) && cloud.notices.length) next.notices = dedupeNotices(cloud.notices);
		if (Array.isArray(cloud.gallery) && cloud.gallery.length) {
			const localKeep = (current.gallery ?? []).filter((g) => g.mediaKey);
			const localIds = new Set(localKeep.map((g) => g.id));
			next.gallery = dedupeGallery([...localKeep, ...cloud.gallery.filter((g) => !localIds.has(g.id) && !g.mediaKey && g.src)]);
		} else if ((current.gallery ?? []).some((g) => g.src?.startsWith("/images/gallery-"))) next.gallery = (current.gallery ?? []).filter((g) => g.mediaKey || g.src && !g.src.startsWith("/images/gallery-"));
		if (typeof cloud.visitors === "number" && cloud.visitors > 0) next.visitors = cloud.visitors;
		const computedAlumni = (next.volunteers ?? current.volunteers).filter((v) => v.status === "alumni").length;
		next.settings = {
			...current.settings,
			alumniCount: computedAlumni || Number(cloud.alumniCount) || current.settings.alumniCount
		};
		if (Object.keys(next).length) set(next);
	},
	bumpVisitor: () => set({ visitors: get().visitors + 1 }),
	addVolunteer: (input) => {
		const volunteers = get().volunteers;
		const next = volunteers.length + 1;
		const volunteerId = `NSS${padId(next)}`;
		const enrollment = `2026-${input.semester}-${padId(next)}`;
		const volunteer = {
			...input,
			fullName: titleFirstName(input.fullName),
			id: `vol-${Date.now()}`,
			volunteerId,
			enrollment,
			createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
			status: input.status ?? "active"
		};
		set({ volunteers: dedupeVolunteers([...volunteers, volunteer]).sort(byFullName) });
		return volunteer;
	},
	updateVolunteer: (id, patch) => set({ volunteers: get().volunteers.map((v) => v.id === id ? {
		...v,
		...patch,
		fullName: titleFirstName(patch.fullName ?? v.fullName)
	} : v) }),
	deleteVolunteer: (id) => {
		const current = get();
		const item = current.volunteers.find((v) => v.id === id);
		if (!item) return;
		set({
			volunteers: current.volunteers.filter((v) => v.id !== id),
			attendance: current.attendance.filter((a) => a.volunteerId !== id),
			eventRsvps: (current.eventRsvps ?? []).filter((r) => r.volunteerId !== id),
			certificates: current.certificates.filter((c) => c.volunteerId !== id),
			recycleBin: [{
				id: `del-${Date.now()}`,
				kind: "volunteer",
				label: item.fullName,
				deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: item
			}, ...current.recycleBin ?? []].slice(0, 200)
		});
		get().addLog("Moved to recycle bin", `Volunteer ${item.fullName} was moved to Recycle Bin.`);
	},
	addEvent: (input) => {
		const event = {
			...input,
			id: `evt-${Date.now()}`,
			createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
		};
		set({ events: dedupeEvents([...get().events, event]) });
		return event;
	},
	updateEvent: (id, patch) => set({ events: get().events.map((e) => e.id === id ? {
		...e,
		...patch
	} : e) }),
	deleteEvent: (id) => {
		const current = get();
		const item = current.events.find((e) => e.id === id);
		if (!item) return;
		set({
			events: current.events.filter((e) => e.id !== id),
			attendance: current.attendance.filter((a) => a.eventId !== id),
			eventRsvps: (current.eventRsvps ?? []).filter((r) => r.eventId !== id),
			certificates: current.certificates.filter((c) => c.eventId !== id),
			recycleBin: [{
				id: `del-${Date.now()}`,
				kind: "event",
				label: item.name,
				deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: item
			}, ...current.recycleBin ?? []].slice(0, 200)
		});
		get().addLog("Moved to recycle bin", `Event ${item.name} was moved to Recycle Bin.`);
	},
	generateEventQr: (eventId) => {
		const event = get().events.find((e) => e.id === eventId);
		if (!event) return null;
		const token = event.qrToken || `evtqr-${eventId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		set({ events: get().events.map((e) => e.id === eventId ? {
			...e,
			qrEnabled: true,
			qrToken: token,
			qrGeneratedAt: (/* @__PURE__ */ new Date()).toISOString()
		} : e) });
		return token;
	},
	regenerateEventQr: (eventId) => {
		if (!get().events.find((e) => e.id === eventId)) return null;
		const token = `evtqr-${eventId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		set({ events: get().events.map((e) => e.id === eventId ? {
			...e,
			qrEnabled: true,
			qrToken: token,
			qrGeneratedAt: (/* @__PURE__ */ new Date()).toISOString()
		} : e) });
		return token;
	},
	setAttendance: (volunteerId, eventId, present, meta) => {
		const rest = get().attendance.filter((a) => !(a.volunteerId === volunteerId && a.eventId === eventId));
		const row = {
			volunteerId,
			eventId,
			present,
			markedAt: (/* @__PURE__ */ new Date()).toISOString(),
			source: meta?.source ?? "manual",
			...meta
		};
		set({ attendance: [...rest, row] });
	},
	setEventRSVP: (volunteerId, eventId, status, note) => {
		const rest = (get().eventRsvps ?? []).filter((r) => !(r.volunteerId === volunteerId && r.eventId === eventId));
		const row = {
			volunteerId,
			eventId,
			status,
			...note ? { note } : {},
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		set({ eventRsvps: [...rest, row] });
	},
	markAllAttendance: (eventId, present) => {
		const state = get();
		const keep = state.attendance.filter((a) => {
			if (a.eventId !== eventId) return true;
			return state.volunteers.find((v) => v.id === a.volunteerId)?.status === "alumni";
		});
		const rows = activeVolunteers(state).map((v) => ({
			volunteerId: v.id,
			eventId,
			present,
			markedAt: (/* @__PURE__ */ new Date()).toISOString(),
			source: "manual"
		}));
		set({ attendance: [...keep, ...rows] });
	},
	addNotice: (input) => {
		const notice = {
			...input,
			id: `ntc-${Date.now()}`,
			createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
		};
		set({ notices: [notice, ...get().notices] });
		return notice;
	},
	updateNotice: (id, patch) => set({ notices: get().notices.map((n) => n.id === id ? {
		...n,
		...patch
	} : n) }),
	deleteNotice: (id) => {
		const current = get();
		const item = current.notices.find((n) => n.id === id);
		if (!item) return;
		set({
			notices: current.notices.filter((n) => n.id !== id),
			recycleBin: [{
				id: `del-${Date.now()}`,
				kind: "notice",
				label: item.title,
				deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: item
			}, ...current.recycleBin ?? []].slice(0, 200)
		});
		get().addLog("Moved to recycle bin", `Notice ${item.title} was moved to Recycle Bin.`);
	},
	updateSettings: (patch) => set({ settings: {
		...get().settings,
		...patch
	} }),
	addGalleryItems: (items) => {
		if (!items.length) return;
		set({ gallery: dedupeGallery([...items, ...get().gallery ?? []]) });
	},
	addPressReport: (item) => set({ pressReports: dedupePressReports([item, ...get().pressReports ?? []]) }),
	removePressReport: (id) => {
		const current = get();
		const item = (current.pressReports ?? []).find((r) => r.id === id);
		if (!item) return;
		set({
			pressReports: (current.pressReports ?? []).filter((r) => r.id !== id),
			recycleBin: [{
				id: `del-${Date.now()}`,
				kind: "press",
				label: item.name,
				deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: item
			}, ...current.recycleBin ?? []].slice(0, 200)
		});
		get().addLog("Moved to recycle bin", `Press report ${item.name} was moved to Recycle Bin.`);
	},
	removeGalleryItem: (id) => {
		const current = get();
		const item = (current.gallery ?? []).find((g) => g.id === id);
		if (!item) return;
		set({
			gallery: (current.gallery ?? []).filter((g) => g.id !== id),
			recycleBin: [{
				id: `del-${Date.now()}`,
				kind: "gallery",
				label: item.caption || "Gallery media",
				deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: item
			}, ...current.recycleBin ?? []].slice(0, 200)
		});
		get().addLog("Moved to recycle bin", `Gallery media was moved to Recycle Bin.`);
	},
	moveToAlumni: (id, notes) => {
		const volunteers = get().volunteers.map((v) => v.id === id ? {
			...v,
			status: "alumni",
			alumniYear: v.alumniYear || academicYear(),
			alumniNotes: notes ?? v.alumniNotes ?? ""
		} : v);
		set({
			volunteers,
			settings: {
				...get().settings,
				alumniCount: volunteers.filter((v) => v.status === "alumni").length
			}
		});
		get().addLog("Sent to alumni", `Moved volunteer to alumni file.`);
	},
	restoreAlumni: (id) => {
		const volunteers = get().volunteers.map((v) => v.id === id ? {
			...v,
			status: "active"
		} : v);
		set({
			volunteers,
			settings: {
				...get().settings,
				alumniCount: volunteers.filter((v) => v.status === "alumni").length
			}
		});
		get().addLog("Restored volunteer", `Restored an alumni record to the active roll.`);
	},
	addLog: (action, details) => {
		set({ logs: [{
			id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			at: (/* @__PURE__ */ new Date()).toISOString(),
			actor: get().settings.poName,
			action,
			details
		}, ...get().logs ?? []].slice(0, 250) });
	},
	promoteVolunteers: (ids) => {
		const want = new Set(ids);
		let count = 0;
		set({ volunteers: get().volunteers.map((v) => {
			if (!want.has(v.id) || v.status === "alumni") return v;
			const sem = Math.min(6, Number(v.semester || "1") + 1);
			count += 1;
			return {
				...v,
				semester: String(sem)
			};
		}) });
		if (count) get().addLog("Batch Promotion", `Promoted ${count} volunteer(s) to the next semester.`);
		return count;
	},
	deleteVolunteers: (ids) => {
		const want = new Set(ids);
		const current = get();
		const removed = current.volunteers.filter((v) => want.has(v.id));
		if (!removed.length) return 0;
		set({
			volunteers: current.volunteers.filter((v) => !want.has(v.id)),
			attendance: current.attendance.filter((a) => !want.has(a.volunteerId)),
			eventRsvps: (current.eventRsvps ?? []).filter((r) => !want.has(r.volunteerId)),
			certificates: current.certificates.filter((c) => !want.has(c.volunteerId)),
			recycleBin: [...removed.map((item, i) => ({
				id: `del-${Date.now()}-${i}`,
				kind: "volunteer",
				label: item.fullName,
				deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
				data: item
			})), ...current.recycleBin ?? []].slice(0, 200)
		});
		get().addLog("Batch Deletion", `Moved ${removed.length} volunteer(s) to Recycle Bin.`);
		return removed.length;
	},
	importBackup: (data) => {
		const current = get();
		set({
			volunteers: Array.isArray(data.volunteers) ? data.volunteers : current.volunteers,
			events: Array.isArray(data.events) ? data.events : current.events,
			attendance: Array.isArray(data.attendance) ? data.attendance : current.attendance,
			eventRsvps: Array.isArray(data.eventRsvps) ? data.eventRsvps : current.eventRsvps ?? [],
			notices: Array.isArray(data.notices) ? data.notices : current.notices,
			gallery: Array.isArray(data.gallery) ? data.gallery : current.gallery,
			certificates: Array.isArray(data.certificates) ? data.certificates : current.certificates,
			pressReports: Array.isArray(data.pressReports) ? data.pressReports : current.pressReports,
			logs: Array.isArray(data.logs) ? data.logs : current.logs,
			settings: data.settings ? {
				...current.settings,
				...data.settings
			} : current.settings,
			visitors: typeof data.visitors === "number" ? data.visitors : current.visitors,
			recycleBin: Array.isArray(data.recycleBin) ? data.recycleBin : current.recycleBin
		});
		get().addLog("Backup Restore", "Restored portal data from an NSP backup file.");
	},
	restoreDeleted: (id) => {
		const current = get();
		const item = (current.recycleBin ?? []).find((row) => row.id === id);
		if (!item) return;
		if (item.kind === "volunteer") set({ volunteers: dedupeVolunteers([...current.volunteers, item.data]) });
		if (item.kind === "event") set({ events: dedupeEvents([...current.events, item.data]) });
		if (item.kind === "notice") set({ notices: dedupeNotices([...current.notices, item.data]) });
		if (item.kind === "gallery") set({ gallery: dedupeGallery([...current.gallery, item.data]) });
		if (item.kind === "press") set({ pressReports: dedupePressReports([...current.pressReports ?? [], item.data]) });
		set({ recycleBin: current.recycleBin.filter((row) => row.id !== id) });
		get().addLog("Recycle restore", `Restored ${item.label} from Recycle Bin.`);
	},
	permanentlyDelete: (id) => {
		const item = (get().recycleBin ?? []).find((row) => row.id === id);
		if (item?.kind === "gallery" && "mediaKey" in item.data && item.data.mediaKey) deleteMedia(item.data.mediaKey);
		if (item?.kind === "press" && "mediaKey" in item.data && item.data.mediaKey) deleteMedia(item.data.mediaKey);
		set({ recycleBin: (get().recycleBin ?? []).filter((row) => row.id !== id) });
	},
	emptyRecycleBin: () => set({ recycleBin: [] }),
	awardBadge: (volunteerId, badge) => {
		const clean = badge.trim();
		if (!clean) return;
		set({ volunteers: get().volunteers.map((v) => v.id === volunteerId ? {
			...v,
			badges: Array.from(/* @__PURE__ */ new Set([...v.badges ?? [], clean]))
		} : v) });
		get().addLog("Badge awarded", `${badge} awarded to a volunteer.`);
	},
	removeBadge: (volunteerId, badge) => set({ volunteers: get().volunteers.map((v) => v.id === volunteerId ? {
		...v,
		badges: (v.badges ?? []).filter((b) => b !== badge)
	} : v) }),
	generateCertificates: (eventId, volunteerIds) => {
		const existing = get().certificates ?? [];
		const have = new Set(existing.filter((c) => c.eventId === eventId).map((c) => c.volunteerId));
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const added = volunteerIds.filter((id) => !have.has(id)).map((volunteerId) => ({
			id: `crt-${eventId}-${volunteerId}`,
			volunteerId,
			eventId,
			generatedAt: now,
			sentAt: null
		}));
		if (added.length) set({ certificates: [...existing, ...added] });
		return added;
	},
	sendCertificates: (ids) => {
		const want = new Set(ids);
		const now = (/* @__PURE__ */ new Date()).toISOString();
		let sent = 0;
		set({ certificates: (get().certificates ?? []).map((c) => {
			if (!want.has(c.id) || c.sentAt) return c;
			sent += 1;
			return {
				...c,
				sentAt: now
			};
		}) });
		return sent;
	}
}), {
	name: STORAGE_DATA,
	skipHydration: true,
	storage: portalStorage,
	partialize: (s) => ({
		volunteers: s.volunteers,
		events: s.events,
		attendance: s.attendance,
		eventRsvps: s.eventRsvps ?? [],
		notices: s.notices,
		gallery: (s.gallery ?? []).map((g) => ({
			...g,
			src: g.src?.startsWith("data:") ? "" : g.src
		})),
		certificates: s.certificates ?? [],
		pressReports: s.pressReports ?? [],
		logs: (s.logs ?? []).slice(0, 250),
		settings: s.settings,
		visitors: s.visitors,
		recycleBin: s.recycleBin ?? []
	}),
	merge: (persisted, current) => {
		try {
			return mergePortalState(persisted, current);
		} catch {
			return current;
		}
	}
}));
function rsvpOf(state, volunteerId, eventId) {
	return (state.eventRsvps ?? []).find((r) => r.volunteerId === volunteerId && r.eventId === eventId);
}
function volunteerHours(state, volunteerId) {
	const map = new Map((state.events ?? []).map((e) => [e.id, e]));
	return (state.attendance ?? []).reduce((sum, row) => {
		if (row.volunteerId !== volunteerId || !row.present) return sum;
		return sum + (map.get(row.eventId)?.hours ?? 0);
	}, 0);
}
function totalServiceHours(state) {
	const map = new Map((state.events ?? []).map((e) => [e.id, e]));
	return (state.attendance ?? []).reduce((sum, row) => {
		if (!row.present) return sum;
		return sum + (map.get(row.eventId)?.hours ?? 0);
	}, 0);
}
function attendanceOf(state, volunteerId, eventId) {
	return (state.attendance ?? []).find((a) => a.volunteerId === volunteerId && a.eventId === eventId);
}
function presentVolunteers(state, eventId) {
	const ids = new Set((state.attendance ?? []).filter((a) => a.eventId === eventId && a.present).map((a) => a.volunteerId));
	return [...state.volunteers ?? []].filter((v) => ids.has(v.id)).sort((a, b) => a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" }));
}
function certificateOf(state, volunteerId, eventId) {
	return (state.certificates ?? []).find((c) => c.volunteerId === volunteerId && c.eventId === eventId);
}
function activeVolunteers(state) {
	return [...state.volunteers ?? []].filter((v) => v.status !== "alumni").sort(byFullName);
}
function alumniVolunteers(state) {
	return [...state.volunteers ?? []].filter((v) => v.status === "alumni").sort(byFullName);
}
function bestVolunteer(state) {
	const list = activeVolunteers(state);
	if (!list.length) return;
	return [...list].sort((a, b) => {
		const ha = volunteerHours(state, a.id);
		const hb = volunteerHours(state, b.id);
		if (hb !== ha) return hb - ha;
		const aa = state.attendance.filter((x) => x.volunteerId === a.id && x.present).length;
		return state.attendance.filter((x) => x.volunteerId === b.id && x.present).length - aa;
	})[0];
}
function volunteerRecord(state, volunteerId) {
	const volunteer = state.volunteers.find((v) => v.id === volunteerId);
	const hours = volunteerHours(state, volunteerId);
	const marked = state.attendance.filter((a) => a.volunteerId === volunteerId);
	const present = marked.filter((a) => a.present).length;
	const certs = (state.certificates ?? []).filter((c) => c.volunteerId === volunteerId);
	return {
		volunteer,
		hours,
		present,
		marked: marked.length,
		pct: marked.length ? Math.round(present / marked.length * 100) : 0,
		certs,
		isBest: bestVolunteer(state)?.id === volunteerId
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
export { idCardName as A, useNssStore as B, daysUntilBirthday as C, formatLongDate as D, folderName as E, putMedia as F, volunteerHours as H, rsvpOf as I, titleFirstName as L, padId as M, parseDob as N, formatShortDate as O, presentVolunteers as P, todayIso as R, compressPortrait as S, firstNameOf as T, volunteerRecord as U, videoPoster as V, waPhone as W, certificateOf as _, SLOGAN_GU as a, compressImageFile as b, academicYear as c, assertVideoSize as d, attendanceOf as f, certDisplayName as g, byFullName as h, SLOGAN_EN as i, isBirthdayOn as j, getMedia as k, activeVolunteers as l, blobToDataUrl as m, COLLEGE_LOGO as n, STORAGE_SESSION as o, bestVolunteer as p, NSS_LOGO as r, STORAGE_VISITOR_MARK as s, BIRTHDAY_TEMPLATE as t, alumniVolunteers as u, cleanPersonName as v, digitsOnly as w, compressPassport as x, cn as y, totalServiceHours as z };
