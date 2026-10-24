import { cleanPersonName, latinDigits, padId, parseDob, titleFirstName } from "./format";
import { nssHourRule } from "./hours";
import { attendanceDocId as sealedAttendanceId, openChatPass, openText, passwordRecord, sealText, tokenDocId } from "./seal.server";
import type {
  AttendanceRecord,
  GalleryItem,
  IssuedCertificate,
  Notice,
  NssEvent,
  PortalState,
  Volunteer,
} from "./types";

const FIRESTORE_PROJECT_ID = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
export const FIRESTORE_BASE =
  process.env.NSS_FIRESTORE_BASE_URL?.trim() ||
  `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

const CLOUD_FRESH_MS = 30 * 60 * 1000;
let cloudCache: { at: number; data: CloudPortal; withGallery: boolean } | null = null;
let cloudInflight: Promise<CloudPortal | null> | null = null;
let cloudInflightGallery = false;
let quotaBlockedUntil = 0;
let studentCache: { at: number; volunteers: Volunteer[] } | null = null;
let studentInflight: Promise<Volunteer[] | null> | null = null;

function noteQuota() {
  quotaBlockedUntil = Date.now() + 45 * 1000;
}

export function collegeQuotaBlocked() {
  return Date.now() < quotaBlockedUntil;
}

function invalidateCollegeCache() {
  cloudCache = null;
}

type FsValue = Record<string, unknown>;

function decodeValue(value: FsValue | undefined): unknown {
  if (!value || typeof value !== "object") return undefined;
  if ("stringValue" in value) return String(value.stringValue ?? "");
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return String(value.timestampValue ?? "");
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: FsValue[] })?.values ?? [];
    return values.map((item) => decodeValue(item));
  }
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, FsValue> })?.fields ?? {};
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
  }
  return undefined;
}

function decodeDoc(doc: { name?: string; fields?: Record<string, FsValue> }) {
  const fields = doc.fields ?? {};
  const row: Record<string, unknown> = {
    _id: String(doc.name ?? "").split("/").pop() ?? "",
  };
  for (const [key, value] of Object.entries(fields)) {
    row[key] = decodeValue(value);
  }
  return row;
}

const STUDENT_FIELDS = [
  "fullName",
  "firstName",
  "middleName",
  "surname",
  "mobile",
  "email",
  "course",
  "semester",
  "nssRole",
  "status",
  "fatherName",
  "dob",
  "gender",
  "bloodGroup",
  "address",
  "parentMobile",
  "emergencyContact",
  "abcId",
  "myBharatId",
  "enrollment",
  "volunteerId",
  "unit",
  "photoUrl",
  "thumbUrl",
  "password",
  "mpin",
  "webauthnId",
  "createdAt",
  "updatedAt",
];

const SEAL_KEYS = new Set([
  "mobile",
  "email",
  "address",
  "fatherName",
  "dob",
  "bloodGroup",
  "parentMobile",
  "emergencyContact",
  "abcId",
  "myBharatId",
  "mpin",
]);

function reveal(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (typeof row[key] === "string") row[key] = openText(row[key]);
  }
}

function collectionUrl(name: string, token?: string, opts?: { photos?: boolean }) {
  const params = new URLSearchParams({ pageSize: "300" });
  if (token) params.set("pageToken", token);
  if (name === "students") {
    for (const field of STUDENT_FIELDS) {
      if (opts?.photos === false && field === "photoUrl") continue;
      params.append("mask.fieldPaths", field);
    }
  }
  if (name === "events") {
    for (const field of ["eventName", "title", "date", "startDate", "endDate", "location", "hours", "status", "description", "beneficiaries", "category", "coordinator", "createdAt"]) {
      params.append("mask.fieldPaths", field);
    }
  }
  if (name === "attendance") {
    for (const field of ["eventName", "title", "date", "status", "attendance", "mobile", "studentMobile", "studentName", "name"]) {
      params.append("mask.fieldPaths", field);
    }
  }
  if (name === "gallery") {
    for (const field of ["title", "eventName", "createdAt", "date", "kind", "type", "image", "src"]) {
      params.append("mask.fieldPaths", field);
    }
  }
  return `${FIRESTORE_BASE}/${name}?${params.toString()}`;
}

async function listCollection(name: string, opts?: { photos?: boolean; strict?: boolean; maxDocs?: number }) {
  if (collegeQuotaBlocked()) throw new Error("The college register is busy. Try again in a little while.");
  const docs: Record<string, unknown>[] = [];
  const maxDocs = opts?.maxDocs ?? (name === "attendance" ? 2500 : name === "gallery" ? 60 : 400);
  let url: string | "" = collectionUrl(name, undefined, opts);
  while (url && docs.length < maxDocs) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429 || res.status === 503) {
        noteQuota();
        throw new Error("The college register is busy. Try again in a little while.");
      }
      if (opts?.strict) throw new Error(res.status === 429 ? "The college roll is busy. Try delete once more in a moment." : "Could not read attendance.");
      break;
    }
    const json = (await res.json()) as {
      documents?: { name?: string; fields?: Record<string, FsValue> }[];
      nextPageToken?: string;
    };
    for (const doc of json.documents ?? []) docs.push(decodeDoc(doc));
    url = json.nextPageToken ? collectionUrl(name, json.nextPageToken, opts) : "";
  }
  return docs;
}

async function getDocument(path: string) {
  if (collegeQuotaBlocked()) throw new Error("The college register is busy. Try again in a little while.");
  const res = await fetch(`${FIRESTORE_BASE}/${path}`);
  if (res.status === 429 || res.status === 503) {
    noteQuota();
    throw new Error("The college register is busy. Try again in a little while.");
  }
  if (!res.ok) return null;
  const json = (await res.json()) as { fields?: Record<string, FsValue> };
  return decodeDoc({ name: path, fields: json.fields });
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function digits(value: unknown) {
  return latinDigits(text(value)).replace(/\D/g, "");
}

function mobileKey(value: unknown) {
  const d = digits(value);
  if (d.length >= 10) return d.slice(-10);
  return d;
}

function isoDate(value: unknown) {
  return parseDob(text(value));
}

function isPresent(row: Record<string, unknown>) {
  const raw = row.status ?? row.attendance ?? row.present;
  if (raw === true || raw === 1) return true;
  const s = text(raw).toLowerCase();
  return s === "present" || s === "p" || s === "yes" || s === "true" || s === "haajar";
}

function normalizeCourse(value: unknown) {
  const raw = text(value);
  if (/\u0aac\u0ac0\.?\s*\u0a95\u0acb\u0aae|b\.?\s*com/i.test(raw)) return "B.Com.";
  if (/\u0aac\u0ac0\.?\s*\u0a8f|b\.?\s*a\b/i.test(raw)) return "B.A.";
  if (/\u0aac\u0ac0\.?\s*\u0a8f\u0ab8|b\.?\s*sc/i.test(raw)) return "B.Sc.";
  return raw || "B.Com.";
}

export type CloudPortal = Pick<
  PortalState,
  "volunteers" | "events" | "attendance" | "notices" | "gallery" | "visitors"
> & { alumniCount: number; serviceHours: number };

async function runQuery(structuredQuery: Record<string, unknown>) {
  if (collegeQuotaBlocked()) throw new Error("The college register is busy. Try again in a little while.");
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });
  if (res.status === 429 || res.status === 503) {
    noteQuota();
    throw new Error("The college register is busy. Try again in a little while.");
  }
  if (!res.ok) return null;
  const rows = (await res.json()) as { document?: { name?: string; fields?: Record<string, FsValue> } }[];
  const docs: Record<string, unknown>[] = [];
  for (const row of rows) {
    if (row.document?.fields || row.document?.name) docs.push(decodeDoc(row.document));
  }
  return docs;
}

async function listPublicNotices() {
  try {
    const queried = await runQuery({
      from: [{ collectionId: "notices" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "title" },
          op: "NOT_IN",
          value: {
            arrayValue: {
              values: [{ stringValue: "NSS_CHAT_INTERNAL" }, { stringValue: "NSS_CHAT_AUTH" }],
            },
          },
        },
      },
      limit: 80,
    });
    if (queried) {
      return queried.filter((n) => {
        const kind = text(n.kind);
        const title = text(n.title);
        return !text(n.kind).startsWith("chat") && !text(n.title).startsWith("NSS_CHAT");
      });
    }
  } catch (error) {
    if (collegeQuotaBlocked()) throw error;
  }
  const docs = await listCollection("notices", { maxDocs: 80 });
  return docs.filter((n) => {
    const kind = text(n.kind);
    const title = text(n.title);
    return !text(n.kind).startsWith("chat") && !text(n.title).startsWith("NSS_CHAT");
  });
}

async function loadCollegeCloudFresh(opts: { gallery?: boolean; photos?: boolean; studentsOnly?: boolean; attendance?: boolean } = {}): Promise<CloudPortal | null> {
  await readPurgedIds().catch(() => undefined);
  const studentsOnly = opts.studentsOnly === true;
  const withAttendance = opts.attendance === true && !studentsOnly;
  const [students, eventDocs, noticeDocs, attendanceDocs, galleryDocs, stats, visitorsDoc, liveDoc] =
    await Promise.all([
      listCollection("students", { photos: opts.photos !== false }),
      studentsOnly ? Promise.resolve([]) : listCollection("events"),
      studentsOnly ? Promise.resolve([]) : listPublicNotices(),
      withAttendance ? listCollection("attendance", { maxDocs: 800 }) : Promise.resolve([]),
      studentsOnly || opts.gallery === false ? Promise.resolve([]) : listCollection("gallery", { maxDocs: 24 }),
      studentsOnly ? Promise.resolve(null) : getDocument("portalSettings/publicStats"),
      studentsOnly ? Promise.resolve(null) : getDocument("portalSettings/visitors"),
      studentsOnly ? Promise.resolve(null) : getDocument("portalSettings/live"),
    ]);

  if (!students.length && !eventDocs.length && !noticeDocs.length) return null;

  const keep = students.filter((s) => {
    const status = text(s.status).toLowerCase();
    if (status === "inactive" || status === "deleted") return false;
    const id = text(s._id).toLowerCase();
    const vid = text(s.volunteerId).toLowerCase();
    const name = text(s.fullName).toLowerCase();
    return !purgedIds.has(id) && !purgedIds.has(vid) && !(name.length > 2 && purgedIds.has(name));
  });

  const sorted = [...keep].sort((a, b) =>
    isoDate(a.createdAt).localeCompare(isoDate(b.createdAt)) ||
    text(a.fullName).localeCompare(text(b.fullName), "en", { sensitivity: "base" }),
  );

  const numbers = rollNumbers(sorted);
  for (const row of sorted) reveal(row, [...SEAL_KEYS, "password"]);
  const volunteers: Volunteer[] = sorted.map((s) => {
    const n = numbers.get(s) ?? 1;
    const semester = latinDigits(text(s.semester) || "1");
    const mobileDigits = mobileKey(s.mobile) || mobileKey(s._id);
    const mobile = mobileDigits.length >= 10 ? mobileDigits : latinDigits(text(s.mobile));
    const role = knownRole(s.nssRole);
    const statusRaw = text(s.status).toLowerCase();
    const roleRaw = text(s.nssRole).toLowerCase();
    const isAlumni = statusRaw === "alumni" || roleRaw === "alumni";
    const assembled = [s.firstName, s.middleName, s.surname].map(text).filter(Boolean).join(" ");
    const fullName = titleFirstName(cleanPersonName(text(s.fullName) || assembled));
    const storedUnit = text(s.unit);
    const unit = storedUnit === "Unit 2" ? "Unit 2" : storedUnit === "Unit 1" ? "Unit 1" : n % 2 === 1 ? "Unit 1" : "Unit 2";
    return {
      id: text(s._id) || `vol-${n}`,
      volunteerId: text(s.volunteerId) || `NSS${padId(n)}`,
      enrollment: latinDigits(text(s.enrollment)) || `2026-${semester}-${padId(n)}`,
      fullName,
      mobile,
      email: text(s.email),
      course: normalizeCourse(s.course) as Volunteer["course"],
      semester,
      unit,
      nssRole: role,
      fatherName: text(s.fatherName),
      dob: isoDate(s.dob),
      gender: (text(s.gender) === "Female" ? "Female" : text(s.gender) === "Male" ? "Male" : "") as Volunteer["gender"],
      bloodGroup: text(s.bloodGroup),
      address: text(s.address),
      parentMobile: text(s.parentMobile) || text(s.emergencyContact) || mobile,
      emergencyContact: text(s.emergencyContact),
      abcId: text(s.abcId),
      myBharatId: text(s.myBharatId),
      photoUrl: smallPublicPhoto(s.thumbUrl) || (opts?.photos === false ? "" : safePhoto(s.photoUrl)),
      loginPassword: text(s.password),
      mpin: text(s.mpin) || undefined,
      webauthnId: text(s.webauthnId) || undefined,
      createdAt: isoDate(s.createdAt) || isoDate(s.updatedAt),
      status: isAlumni ? "alumni" : "active",
    };
  });

  const byMobile = new Map<string, Volunteer>();
  const byName = new Map<string, Volunteer>();
  for (const v of volunteers) {
    const d = mobileKey(v.mobile) || mobileKey(v.id);
    if (d) byMobile.set(d, v);
    const nameKey = v.fullName.toLowerCase();
    if (nameKey) byName.set(nameKey, v);
    const compact = nameKey.replace(/[^a-z]/g, "");
    if (compact) byName.set(compact, v);
  }

  const events: NssEvent[] = eventDocs.map((e) => {
    const name = text(e.eventName) || text(e.title) || "NSS Activity";
    const date = isoDate(e.date) || isoDate(e.startDate);
    const endDate = isoDate(e.endDate);
    const statusRaw = text(e.status).toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    let status: NssEvent["status"] =
      statusRaw === "cancelled" ? "cancelled" : statusRaw === "upcoming" || statusRaw === "planning" ? "upcoming" : "completed";
    if (status === "upcoming" && date && date < today) status = "completed";
    const description = text(e.description);
    return {
      id: text(e._id) || `evt-${name}-${date}`,
      name,
      date,
      endDate: endDate && endDate !== date ? endDate : undefined,
      location: text(e.location) || "Mansa",
      hours: nssHourRule({ name, date, endDate, description }).hours,
      status,
      description,
      beneficiaries: Number(e.beneficiaries) > 0 ? Number(e.beneficiaries) : 0,
      category: text(e.category),
      coordinator: text(e.coordinator),
      createdAt: isoDate(e.createdAt) || date,
    };
  });

  function ensureEvent(name: string, date: string) {
    const key = name.trim().toLowerCase();
    let event = events.find((e) => e.name.trim().toLowerCase() === key);
    if (!event) {
      event = {
        id: `evt-${key.replace(/\s+/g, "-")}-${date || "undated"}`,
        name,
        date,
        location: "Mansa",
        hours: nssHourRule({ name, date }).hours,
        status: "completed",
        description: "",
        createdAt: date,
      };
      events.push(event);
    }
    return event;
  }

  const attendance: AttendanceRecord[] = [];
  const seen = new Set<string>();
  for (const row of attendanceDocs) {
    reveal(row, ["studentMobile", "mobile", "studentName", "name"]);
    const name = text(row.eventName) || text(row.title);
    const date = isoDate(row.date);
    if (!name) continue;
    const event = ensureEvent(name, date);
    const volunteer =
      byMobile.get(mobileKey(row.studentMobile) || mobileKey(row.mobile) || mobileKey(row._id)) ||
      byName.get(text(row.studentName || row.name).toLowerCase()) ||
      byName.get(text(row.studentName || row.name).toLowerCase().replace(/[^a-z]/g, ""));
    if (!volunteer) continue;
    const key = `${volunteer.id}::${event.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    attendance.push({ volunteerId: volunteer.id, eventId: event.id, present: isPresent(row) });
  }

  const notices: Notice[] = noticeDocs
    .filter((n) => {
      const kind = text(n.kind);
      const title = text(n.title);
      return !text(n.kind).startsWith("chat") && !text(n.title).startsWith("NSS_CHAT");
    })
    .map((n) => {
    const body = text(n.text) || text(n.body);
    const title = text(n.title) || "Notice";
    const leaders = /^leaders\b/i.test(title);
    return {
      id: text(n._id),
      title,
      body,
      date: isoDate(n.date) || isoDate(n.createdAt),
      audience: leaders ? "leaders" : "all",
      createdAt: isoDate(n.createdAt) || isoDate(n.date),
    };
  });

  const gallery: GalleryItem[] = galleryDocs
    .map((g) => {
      const eventName = text(g.eventName) || text(g.title) || "General";
      const kind = /video/i.test(text(g.kind) || text(g.type)) ? "video" : "photo";
      const src = text(g.image) || text(g.src);
      return {
        id: text(g._id),
        src: src.length < 400000 ? src : "",
        caption: text(g.title) || eventName || "NSS activity",
        date: isoDate(g.createdAt) || isoDate(g.date),
        eventName,
        folder: eventName,
        kind: kind as GalleryItem["kind"],
      };
    })
    .filter((g) => g.src)
    .sort((a, b) => b.date.localeCompare(a.date));

  const alumniCount = students.filter((s) => {
    const status = text(s.status).toLowerCase();
    const role = text(s.nssRole).toLowerCase();
    return status === "alumni" || role === "alumni";
  }).length;

  const computedHours = computeServiceHours(events, attendance);
  const storedHours = Math.max(Number(stats?.serviceHours ?? 0), Number(liveDoc?.serviceHours ?? 0));
  return {
    volunteers,
    events,
    attendance,
    notices,
    gallery,
    visitors: Math.max(Number(visitorsDoc?.count ?? 0), Number(liveDoc?.visitors ?? 0)),
    alumniCount,
    serviceHours: Math.max(storedHours, computedHours),
  };
}

export async function loadCollegeCloud(opts: { gallery?: boolean; photos?: boolean; attendance?: boolean } = {}): Promise<CloudPortal | null> {
  if (collegeQuotaBlocked()) {
    if (cloudCache) return cloudCache.data;
    throw new Error("The college register is busy. Try again in a little while.");
  }
  const wantGallery = opts.gallery !== false;
  const now = Date.now();
  if (cloudCache && now - cloudCache.at < CLOUD_FRESH_MS && (cloudCache.withGallery || !wantGallery)) {
    return cloudCache.data;
  }
  if (cloudInflight && (cloudInflightGallery || !wantGallery)) {
    try {
      return await cloudInflight;
    } catch (error) {
      if (cloudCache) return cloudCache.data;
      throw error;
    }
  }
  cloudInflightGallery = wantGallery;
  cloudInflight = loadCollegeCloudFresh({ gallery: wantGallery, photos: false, attendance: opts.attendance === true })
    .then((data) => {
      if (data && data.volunteers.length > 0) {
        cloudCache = {
          at: Date.now(),
          data,
          withGallery: wantGallery || Boolean(cloudCache?.withGallery && cloudCache.data.gallery.length),
        };
      }
      return data;
    })
    .catch((error) => {
      if (cloudCache) return cloudCache.data;
      throw error;
    })
    .finally(() => {
      cloudInflight = null;
    });
  return cloudInflight;
}

export async function loadStudentRoll(): Promise<Volunteer[] | null> {
  const now = Date.now();
  if (studentCache && now - studentCache.at < CLOUD_FRESH_MS && studentCache.volunteers.length) return studentCache.volunteers;
  if (cloudCache && now - cloudCache.at < CLOUD_FRESH_MS && cloudCache.data.volunteers.length) return cloudCache.data.volunteers;
  if (collegeQuotaBlocked()) return studentCache?.volunteers ?? cloudCache?.data.volunteers ?? null;
  if (studentInflight) return studentInflight;
  studentInflight = loadCollegeCloudFresh({ gallery: false, photos: false, studentsOnly: true })
    .then((data) => {
      const volunteers = data?.volunteers ?? [];
      if (volunteers.length) studentCache = { at: Date.now(), volunteers };
      return volunteers.length ? volunteers : studentCache?.volunteers ?? cloudCache?.data.volunteers ?? null;
    })
    .catch(() => studentCache?.volunteers ?? cloudCache?.data.volunteers ?? null)
    .finally(() => {
      studentInflight = null;
    });
  return studentInflight;
}

const BOARD_TTL_MS = 12 * 60 * 60 * 1000;
const PUBLIC_MEMORY_MS = 45 * 1000;
let publicCache: { at: number; data: CloudPortal; galleryReady?: boolean } | null = null;
let officerCache: { at: number; data: CloudPortal } | null = null;

function publicVolunteerId(v: { id: string; volunteerId?: string }) {
  const phone = digits(v.id);
  if (phone.length >= 8 && v.volunteerId) return v.volunteerId;
  return v.id || v.volunteerId || "";
}

function packGallery(items: CloudPortal["gallery"]) {
  const maxPhoto = 230_000;
  const maxGalleryBytes = 700_000;
  const gallery: CloudPortal["gallery"] = [];
  let galleryBytes = 0;
  for (const item of items) {
    if (!item.src || item.src.length > maxPhoto) continue;
    if (gallery.length >= 8 || galleryBytes + item.src.length > maxGalleryBytes) continue;
    galleryBytes += item.src.length;
    gallery.push(item);
  }
  return gallery;
}

function publicBoardShape(data: CloudPortal): CloudPortal {
  const gallery = packGallery(data.gallery);
  const idMap = new Map(data.volunteers.map((v) => [v.id, publicVolunteerId(v)]));
  return {
    ...data,
    gallery,
    attendance: data.attendance.map((row) => ({
      ...row,
      volunteerId: idMap.get(row.volunteerId) || "",
    })).filter((row) => row.volunteerId && digits(row.volunteerId).length < 8),
    volunteers: data.volunteers.map((v) => ({
      ...v,
      id: publicVolunteerId(v),
      mobile: "",
      email: "",
      loginPassword: "",
      mpin: "",
      webauthnId: "",
      address: "",
      bloodGroup: "",
      parentMobile: "",
      fatherName: "",
      emergencyContact: "",
      abcId: "",
      myBharatId: "",
      photoUrl:
        (v.photoUrl && v.photoUrl.startsWith("data:image/") && v.photoUrl.length < 8000) ||
        (v.photoUrl && v.photoUrl.startsWith("https://") && v.photoUrl.length < 8000)
          ? v.photoUrl
          : "",
    })),
  };
}

export async function markBoardStale() {
  invalidateCollegeCache();
  publicCache = null;
  officerCache = null;
  if (collegeQuotaBlocked()) return;
  try {
    await fetch(`${FIRESTORE_BASE}/portalSettings/publicStats?updateMask.fieldPaths=rollStale`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fields: { rollStale: { booleanValue: true } } }),
    });
  } catch {
    /* the board expires on its own */
  }
}

const purgedIds = new Set<string>();
let purgedAt = 0;

function rememberPurgedIds(ids: string[]) {
  for (const id of ids) {
    const clean = text(id).toLowerCase();
    if (clean.length > 1) purgedIds.add(clean);
  }
  purgedAt = Date.now();
}

export async function readPurgedIds() {
  if (purgedIds.size && Date.now() - purgedAt < 10 * 60 * 1000) return purgedIds;
  try {
    const doc = await getDocument("portalSettings/purged");
    const ids = Array.isArray(doc?.ids) ? doc.ids : [];
    rememberPurgedIds(ids.map((id) => text(id)));
  } catch {
    /* the last purge list stays in memory */
  }
  return purgedIds;
}

function purged(value: string) {
  return purgedIds.has(value.trim().toLowerCase());
}

export function omitPurged<T extends { volunteers: Volunteer[]; attendance: { volunteerId: string }[]; events: { id: string; name: string }[]; notices: { id: string; title: string }[] }>(data: T): T {
  const volunteers = data.volunteers.filter((v) => !purged(v.id) && !purged(v.volunteerId) && !purged(v.fullName) && !purged(v.mobile || ""));
  const keep = new Set(volunteers.flatMap((v) => [v.id, v.volunteerId]));
  return {
    ...data,
    volunteers,
    attendance: data.attendance.filter((row) => keep.has(row.volunteerId)),
    events: data.events.filter((event) => !purged(event.id) && !purged(event.name)),
    notices: data.notices.filter((notice) => !purged(notice.id) && !purged(notice.title)),
  };
}

export async function purgeCloudIds(ids: string[]) {
  const unique = [...new Set(ids.map((id) => text(id)).filter((id) => id.length > 1))].slice(0, 40);
  if (!unique.length) return;
  rememberPurgedIds(unique);
  const project = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
  const document = `projects/${project}/databases/(default)/documents/portalSettings/purged`;
  const values = unique.map((id) => ({ stringValue: id }));
  const commit = await fetch(`${FIRESTORE_BASE}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          transform: {
            document,
            fieldTransforms: [{ fieldPath: "ids", appendMissingElements: { values } }],
          },
        },
      ],
    }),
  });
  if (!commit.ok) {
    await fetch(`${FIRESTORE_BASE}/portalSettings?documentId=purged`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fields: { ids: { arrayValue: { values } } } }),
    });
  }
  await Promise.all(
    unique.flatMap((id) =>
      ["students", "events", "notices", "gallery"].map((collection) =>
        fetch(`${FIRESTORE_BASE}/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" }),
      ),
    ),
  );
  invalidateCollegeCache();
  publicCache = null;
  officerCache = null;
  rosterCache = null;
  void markBoardStale();
}

async function readBoard(): Promise<{ data: CloudPortal; galleryCount: number | null; fresh: boolean } | null> {
  if (collegeQuotaBlocked()) {
    return publicCache ? { data: publicCache.data, galleryCount: publicCache.galleryReady ? publicCache.data.gallery.length : null, fresh: true } : null;
  }
  let doc: Record<string, unknown> | null = null;
  try {
    doc = await getDocument("portalSettings/publicStats");
  } catch {
    return publicCache ? { data: publicCache.data, galleryCount: publicCache.galleryReady ? publicCache.data.gallery.length : null, fresh: true } : null;
  }
  const payload = text(doc?.roll);
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as CloudPortal;
    if (!parsed || !Array.isArray(parsed.volunteers) || parsed.volunteers.length < 1) return null;
    const updatedAt = Date.parse(text(doc?.rollUpdatedAt));
    const fresh = doc?.rollStale !== true && Number.isFinite(updatedAt) && Date.now() - updatedAt <= BOARD_TTL_MS;
    const rawCount = doc?.galleryCount;
    const galleryCount = typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : null;
    return { data: parsed, galleryCount, fresh };
  } catch {
    return null;
  }
}

async function writeBoard(data: CloudPortal) {
  if (data.volunteers.length < 1 || collegeQuotaBlocked()) return;
  let shaped = publicBoardShape(data);
  let payload = JSON.stringify(shaped);
  if (payload.length > 850000) {
    const volunteers = shaped.volunteers.map((row) => ({ ...row }));
    const ranked = volunteers
      .map((row, index) => ({ index, size: row.photoUrl?.length ?? 0 }))
      .filter((row) => row.size > 0)
      .sort((a, b) => b.size - a.size);
    for (const row of ranked) {
      volunteers[row.index] = { ...volunteers[row.index], photoUrl: "" };
      shaped = { ...shaped, volunteers };
      payload = JSON.stringify(shaped);
      if (payload.length <= 850000) break;
    }
  }
  if (payload.length > 900000) return;
  const fields = {
    roll: { stringValue: payload },
    rollStale: { booleanValue: false },
    rollUpdatedAt: { stringValue: new Date().toISOString() },
    volunteers: { integerValue: String(shaped.volunteers.length) },
    galleryCount: { integerValue: String(shaped.gallery.length) },
    activeStudents: { integerValue: String(shaped.volunteers.filter((v) => v.status !== "alumni").length) },
    serviceHours: { integerValue: String(Math.max(0, Math.round(shaped.serviceHours || 0))) },
    cloudTouch: { nullValue: null },
  };
  const mask = ["roll", "rollStale", "rollUpdatedAt", "volunteers", "galleryCount", "activeStudents", "serviceHours", "cloudTouch"]
    .map((field) => `updateMask.fieldPaths=${field}`)
    .join("&");
  const patch = await fetch(`${FIRESTORE_BASE}/portalSettings/publicStats?${mask}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (patch.status === 429 || patch.status === 503) {
    noteQuota();
    return;
  }
  if (!patch.ok) return;
}

let boardRebuildAt = 0;

function rememberBoard(data: CloudPortal, galleryReady: boolean) {
  publicCache = { at: Date.now(), data, galleryReady };
  return data;
}

export async function loadPublicBoard(opts: { gallery?: boolean } = {}): Promise<CloudPortal | null> {
  const now = Date.now();
  const wantGallery = opts.gallery === true;
  if (publicCache && now - publicCache.at < PUBLIC_MEMORY_MS) {
    const ready = !wantGallery || publicCache.galleryReady || publicCache.data.gallery.length > 0;
    if (ready) return omitPurged(publicCache.data);
  }
  const board = await readBoard();
  if (board && (board.fresh || collegeQuotaBlocked())) {
    const clean = omitPurged(board.data);
    const usable = !wantGallery || clean.gallery.length > 0 || board.galleryCount === 0;
    if (!wantGallery || usable) return rememberBoard(clean, usable);
  }
  if (collegeQuotaBlocked()) return board ? rememberBoard(omitPurged(board.data), board.data.gallery.length > 0) : publicCache?.data ? omitPurged(publicCache.data) : null;
  if (board && now < boardRebuildAt) return rememberBoard(omitPurged(board.data), !wantGallery || board.data.gallery.length > 0 || board.galleryCount === 0);
  boardRebuildAt = Date.now() + 45 * 1000;
  try {
    const fresh = await loadCollegeCloudFresh({ gallery: wantGallery, photos: false, attendance: false });
    if (fresh && fresh.volunteers.length >= 1) {
      const packed = omitPurged({
        ...fresh,
        attendance: fresh.attendance.length ? fresh.attendance : board?.data.attendance ?? [],
        serviceHours: Math.max(fresh.serviceHours, board?.data.serviceHours ?? 0),
        gallery: fresh.gallery.length ? fresh.gallery : board?.data.gallery ?? [],
        visitors: Math.max(fresh.visitors, board?.data.visitors ?? 0),
      });
      const clean = publicBoardShape(packed);
      await writeBoard(clean);
      return rememberBoard(clean, clean.gallery.length > 0 || !wantGallery);
    }
  } catch {
    /* keep the last cloud snapshot */
  }
  if (board) return rememberBoard(omitPurged(board.data), board.data.gallery.length > 0);
  return publicCache?.data ? omitPurged(publicCache.data) : null;
}

const OFFICER_ROLL_MS = 20_000;

function briefVolunteer(s: Record<string, unknown>, n: number): Volunteer {
  const semester = latinDigits(text(s.semester) || "1");
  const mobileDigits = mobileKey(s.mobile) || mobileKey(s._id);
  const mobile = mobileDigits.length >= 10 ? mobileDigits : latinDigits(text(s.mobile));
  const statusRaw = text(s.status).toLowerCase();
  const assembled = [s.firstName, s.middleName, s.surname].map(text).filter(Boolean).join(" ");
  const fullName = titleFirstName(cleanPersonName(text(s.fullName) || assembled));
  return {
    id: text(s._id) || `vol-${n}`,
    volunteerId: text(s.volunteerId) || `NSS${padId(n)}`,
    enrollment: latinDigits(text(s.enrollment)) || `2026-${semester}-${padId(n)}`,
    fullName,
    mobile,
    email: text(s.email),
    course: normalizeCourse(s.course) as Volunteer["course"],
    semester,
    unit: text(s.unit) === "Unit 2" ? "Unit 2" : "Unit 1",
    nssRole: knownRole(s.nssRole),
    fatherName: text(s.fatherName),
    dob: isoDate(s.dob),
    gender: (text(s.gender) === "Female" ? "Female" : text(s.gender) === "Male" ? "Male" : "") as Volunteer["gender"],
    bloodGroup: text(s.bloodGroup),
    address: text(s.address),
    parentMobile: text(s.parentMobile) || text(s.emergencyContact) || mobile,
    emergencyContact: text(s.emergencyContact),
    abcId: text(s.abcId),
    myBharatId: text(s.myBharatId),
    photoUrl: smallPublicPhoto(s.thumbUrl),
    createdAt: isoDate(s.createdAt) || isoDate(s.updatedAt),
    status: statusRaw === "alumni" ? "alumni" : "active",
  };
}

export async function loadOfficerRoll(): Promise<CloudPortal | null> {
  if (officerCache && Date.now() - officerCache.at < OFFICER_ROLL_MS) return officerCache.data;
  const board = await loadPublicBoard({ gallery: false });
  if (board && board.volunteers.length >= 1 && !collegeQuotaBlocked()) {
    try {
      const students = await listCollection("students", { photos: false, maxDocs: 400 });
      if (students.length >= 1) {
        for (const row of students) reveal(row, [...SEAL_KEYS]);
        const byVid = new Map(students.map((s) => [text(s.volunteerId).toLowerCase(), s]));
        const byName = new Map(students.map((s) => [text(s.fullName).toLowerCase(), s]));
        const known = new Set<string>();
        const volunteers = board.volunteers.map((v) => {
          for (const key of [v.volunteerId, v.fullName, v.id]) {
            const clean = key.toLowerCase();
            if (clean) known.add(clean);
          }
          const raw = byVid.get(v.volunteerId.toLowerCase()) || byName.get(v.fullName.toLowerCase());
          if (!raw) return v;
          for (const key of [text(raw._id), text(raw.volunteerId), text(raw.fullName)]) {
            const clean = key.toLowerCase();
            if (clean) known.add(clean);
          }
          const mobile = digits(raw.mobile);
          const thumb = smallPublicPhoto(raw.thumbUrl);
          return {
            ...v,
            photoUrl: thumb || v.photoUrl,
            mobile,
            email: text(raw.email),
            fatherName: text(raw.fatherName),
            address: text(raw.address),
            bloodGroup: text(raw.bloodGroup),
            parentMobile: text(raw.parentMobile),
            emergencyContact: text(raw.emergencyContact),
            abcId: text(raw.abcId),
            myBharatId: text(raw.myBharatId),
            loginPassword: text(raw.password),
          };
        });
        const numbers = rollNumbers(students);
        const extras = students
          .filter((s) => {
            const status = text(s.status).toLowerCase();
            if (status === "inactive" || status === "deleted") return false;
            const keys = [text(s._id), text(s.volunteerId), text(s.fullName)].map((item) => item.toLowerCase()).filter(Boolean);
            return keys.length > 0 && keys.every((key) => !known.has(key));
          })
          .map((s) => briefVolunteer(s, numbers.get(s) ?? students.length));
        const merged = { ...board, volunteers: [...volunteers, ...extras] };
        officerCache = { at: Date.now(), data: merged };
        return merged;
      }
    } catch (error) {
      if (!collegeQuotaBlocked() && !(error instanceof Error && /busy|quota|429/i.test(error.message))) throw error;
    }
  }
  if (board && board.volunteers.length >= 1) return board;
  if (collegeQuotaBlocked()) return board;
  try {
    const full = await loadCollegeCloud({ gallery: false, photos: false, attendance: true });
    if (full && full.volunteers.length >= 1) {
      officerCache = { at: Date.now(), data: full };
      await writeBoard(full);
      return full;
    }
    if (full && full.volunteers.length > 0) return full;
  } catch (error) {
    if (!collegeQuotaBlocked() && !(error instanceof Error && /busy|quota|429/i.test(error.message))) throw error;
  }
  return board;
}

function encodeValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined || value === "") return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { integerValue: String(Math.trunc(value)) };
  return { stringValue: String(value) };
}

export function safePhoto(value: unknown) {
  const src = text(value);
  if ((src.startsWith("data:image/") || src.startsWith("https://")) && src.length < 1200000) return src;
  return "";
}

function smallPublicPhoto(value: unknown) {
  const src = text(value);
  if (src.startsWith("data:image/") && src.length > 80 && src.length < 8000) return src;
  if (src.startsWith("https://") && src.length < 8000) return src;
  return "";
}

let brandCache: { at: number; value: { poPhoto: string; principalPhoto: string; poQuote: string; principalQuote: string } } | null = null;

export async function readBrandPhotos() {
  const empty = { poPhoto: "", principalPhoto: "", poQuote: "", principalQuote: "" };
  if (brandCache && Date.now() - brandCache.at < 60_000) return brandCache.value;
  if (collegeQuotaBlocked()) return brandCache?.value ?? empty;
  try {
    const doc = await getDocument("portalSettings/brand");
    const value = {
      poPhoto: safePhoto(doc?.poPhoto),
      principalPhoto: safePhoto(doc?.principalPhoto),
      poQuote: text(doc?.poQuote).slice(0, 500),
      principalQuote: text(doc?.principalQuote).slice(0, 500),
    };
    brandCache = { at: Date.now(), value };
    return value;
  } catch {
    return brandCache?.value ?? empty;
  }
}

export async function saveBrandPhotos(patch: { poPhoto?: string; principalPhoto?: string; poQuote?: string; principalQuote?: string }) {
  const current = await readBrandPhotos();
  const poPhoto = patch.poPhoto !== undefined ? safePhoto(patch.poPhoto) : current.poPhoto;
  const principalPhoto = patch.principalPhoto !== undefined ? safePhoto(patch.principalPhoto) : current.principalPhoto;
  const poQuote = patch.poQuote !== undefined ? text(patch.poQuote).slice(0, 500) : current.poQuote;
  const principalQuote = patch.principalQuote !== undefined ? text(patch.principalQuote).slice(0, 500) : current.principalQuote;
  const fields = {
    poPhoto: encodeValue(poPhoto),
    principalPhoto: encodeValue(principalPhoto),
    poQuote: encodeValue(poQuote),
    principalQuote: encodeValue(principalQuote),
    updatedAt: encodeValue(new Date().toISOString()),
  };
  const patchRes = await fetch(`${FIRESTORE_BASE}/portalSettings/brand`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  brandCache = { at: Date.now(), value: { poPhoto, principalPhoto, poQuote, principalQuote } };
  if (patchRes.ok) return brandCache.value;
  const createRes = await fetch(`${FIRESTORE_BASE}/portalSettings?documentId=brand`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!createRes.ok) throw new Error("Could not save the photographs.");
  return brandCache.value;
}

let slideCache: { at: number; rows: GalleryItem[] } | null = null;

export async function readHomeSlides(): Promise<GalleryItem[]> {
  if (slideCache && Date.now() - slideCache.at < 60_000) return slideCache.rows;
  if (collegeQuotaBlocked()) return slideCache?.rows ?? [];
  try {
    const docs = await listCollection("gallery", { maxDocs: 12 });
    const rows = docs
      .map((item) => {
        const eventName = text(item.eventName) || text(item.title) || "NSS activity";
        const src = text(item.image) || text(item.src);
        return {
          id: text(item._id),
          src: src.startsWith("data:image/") && src.length > 80 && src.length < 220000 ? src : "",
          caption: text(item.title) || eventName,
          date: isoDate(item.createdAt) || isoDate(item.date),
          eventName,
          folder: eventName,
          kind: "photo" as const,
        };
      })
      .filter((item) => item.src)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);
    slideCache = { at: Date.now(), rows };
    return rows;
  } catch {
    return slideCache?.rows ?? [];
  }
}

let rosterCache: { at: number; rows: { docId: string; volunteerId: string; name: string }[] } | null = null;
let rosterInflight: Promise<{ docId: string; volunteerId: string; name: string }[]> | null = null;

export async function listPhotoRoster() {
  if (collegeQuotaBlocked()) {
    if (rosterCache?.rows.length) return rosterCache.rows;
    throw new Error("The college register is busy. Photographs will load again shortly.");
  }
  const now = Date.now();
  if (rosterCache && now - rosterCache.at < CLOUD_FRESH_MS) return rosterCache.rows;
  if (rosterInflight) return rosterInflight;
  rosterInflight = listPhotoRosterFresh()
    .then((rows) => {
      if (rows.length) rosterCache = { at: Date.now(), rows };
      return rows;
    })
    .finally(() => {
      rosterInflight = null;
    });
  return rosterInflight;
}

async function listPhotoRosterFresh() {
  const params = new URLSearchParams({ pageSize: "300" });
  for (const field of ["volunteerId", "fullName", "status", "createdAt"]) params.append("mask.fieldPaths", field);
  const docs: Record<string, unknown>[] = [];
  let url: string | "" = `${FIRESTORE_BASE}/students?${params}`;
  let page = 0;
  while (url && page < 4) {
    page += 1;
    const res = await fetch(url);
    if (res.status === 429) throw new Error("The college roll is busy. Photographs will load again shortly.");
    if (!res.ok) break;
    const json = (await res.json()) as { documents?: { name?: string; fields?: Record<string, FsValue> }[]; nextPageToken?: string };
    for (const doc of json.documents ?? []) docs.push(decodeDoc(doc));
    url = json.nextPageToken ? `${FIRESTORE_BASE}/students?${params}&pageToken=${encodeURIComponent(json.nextPageToken)}` : "";
  }
  const live = docs.filter((row) => {
    const status = text(row.status).toLowerCase();
    if (status === "deleted" || status === "inactive") return false;
    const id = text(row._id).toLowerCase();
    const vid = text(row.volunteerId).toLowerCase();
    const name = text(row.fullName).toLowerCase();
    return !purgedIds.has(id) && !purgedIds.has(vid) && !(name.length > 2 && purgedIds.has(name));
  });
  live.sort(
    (a, b) =>
      isoDate(a.createdAt).localeCompare(isoDate(b.createdAt)) ||
      text(a.fullName).localeCompare(text(b.fullName), "en", { sensitivity: "base" }),
  );
  const numbers = rollNumbers(live);
  return live.map((row) => {
    const n = numbers.get(row) ?? 1;
    return {
      docId: text(row._id),
      volunteerId: text(row.volunteerId) || `NSS${padId(n)}`,
      name: text(row.fullName).toLowerCase(),
    };
  }).filter((row) => row.docId);
}

export async function readPhotoBatch(docIds: string[]) {
  const photos: { id: string; docId: string; photoUrl: string; name: string }[] = [];
  await Promise.all(docIds.slice(0, 8).map(async (docId) => {
    const id = text(docId);
    if (!id) return;
    const params = new URLSearchParams();
    params.append("mask.fieldPaths", "photoUrl");
    params.append("mask.fieldPaths", "photo");
    params.append("mask.fieldPaths", "image");
    params.append("mask.fieldPaths", "volunteerId");
    params.append("mask.fieldPaths", "fullName");
    const res = await fetch(`${FIRESTORE_BASE}/students/${encodeURIComponent(id)}?${params}`);
    if (res.status === 429) throw new Error("The college roll is busy. Photographs will load again shortly.");
    if (!res.ok) return;
    const json = (await res.json()) as { fields?: Record<string, FsValue> };
    const row = decodeDoc({ name: `students/${id}`, fields: json.fields });
    const photoUrl = safePhoto(row.photoUrl) || safePhoto(row.photo) || safePhoto(row.image);
    if (!photoUrl) return;
    photos.push({ id: text(row.volunteerId) || id, docId: id, photoUrl, name: text(row.fullName).toLowerCase() });
  }));
  return photos;
}

export async function listStudentPhotos() {
  const roster = await listPhotoRoster();
  const photos: { id: string; photoUrl: string }[] = [];
  for (let i = 0; i < roster.length; i += 4) {
    const batch = await readPhotoBatch(roster.slice(i, i + 4).map((row) => row.docId));
    for (const photo of batch) {
      photos.push({ id: photo.id || photo.docId, photoUrl: photo.photoUrl });
    }
  }
  return photos;
}

const KNOWN_ROLES = ["Volunteer", "Leader", "Group Leader", "Discipline Head", "Camp Coordinator"] as const;

export function knownRole(value: unknown): (typeof KNOWN_ROLES)[number] {
  const raw = text(value);
  const found = KNOWN_ROLES.find((role) => role.toLowerCase() === raw.toLowerCase());
  if (found) return found;
  return /leader/i.test(raw) ? "Leader" : "Volunteer";
}

function storedNssNumber(value: unknown) {
  const match = /NSS(\d+)/i.exec(text(value));
  return match ? Number(match[1]) : 0;
}

function nextVolunteerNumber(students: Record<string, unknown>[]) {
  const live = students.filter((s) => {
    const status = text(s.status).toLowerCase();
    return status !== "inactive" && status !== "deleted";
  });
  let max = 0;
  for (const row of live) max = Math.max(max, storedNssNumber(row.volunteerId));
  // Older roll rows have no stored NSS id. Their public numbers are 1..count
  // in joined-date order, so the next registration must continue after that.
  return Math.max(max, live.length) + 1;
}

function rollNumbers(sorted: Record<string, unknown>[]) {
  const taken = new Set<number>();
  for (const row of sorted) {
    const n = storedNssNumber(row.volunteerId);
    if (n > 0) taken.add(n);
  }
  let cursor = 1;
  const numbers = new Map<Record<string, unknown>, number>();
  for (const row of sorted) {
    const stored = storedNssNumber(row.volunteerId);
    if (stored > 0) {
      numbers.set(row, stored);
      continue;
    }
    while (taken.has(cursor)) cursor += 1;
    taken.add(cursor);
    numbers.set(row, cursor);
    cursor += 1;
  }
  return numbers;
}

export async function readStudentCerts(docId: string): Promise<IssuedCertificate[]> {
  const id = text(docId);
  if (!id) return [];
  const row = await getDocument(`students/${id}`);
  if (!row) return [];
  const raw = openText(text(row.certPack));
  if (!raw.startsWith("[")) return [];
  try {
    const parsed = JSON.parse(raw) as IssuedCertificate[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && text(item.id) && text(item.eventId)).slice(0, 40);
  } catch {
    return [];
  }
}

export async function saveStudentCerts(docId: string, rows: IssuedCertificate[]) {
  const packed = rows.slice(0, 40).map((item) => ({
    id: text(item.id),
    volunteerId: text(item.volunteerId),
    eventId: text(item.eventId),
    generatedAt: text(item.generatedAt),
    sentAt: text(item.sentAt),
    certificateId: text(item.certificateId),
    printReady: true,
  }));
  await patchStudent(docId, { certPack: sealText(JSON.stringify(packed)) }, { quiet: true });
}

const BOARD_FIELDS = new Set([
  "fullName",
  "firstName",
  "middleName",
  "surname",
  "status",
  "nssRole",
  "unit",
  "volunteerId",
  "course",
  "semester",
  "gender",
  "dob",
  "photoUrl",
  "thumbUrl",
]);

function mergeStudentCache(id: string, values: Record<string, unknown>) {
  const apply = (row: Volunteer): Volunteer => {
    if (row.id !== id && row.volunteerId !== id) return row;
    return {
      ...row,
      ...(typeof values.email === "string" ? { email: text(values.email) } : {}),
      ...(typeof values.mobile === "string" ? { mobile: digits(values.mobile) } : {}),
      ...(typeof values.address === "string" ? { address: text(values.address) } : {}),
      ...(typeof values.bloodGroup === "string" ? { bloodGroup: text(values.bloodGroup) } : {}),
      ...(typeof values.fatherName === "string" ? { fatherName: text(values.fatherName) } : {}),
      ...(typeof values.emergencyContact === "string" ? { emergencyContact: text(values.emergencyContact) } : {}),
      ...(typeof values.abcId === "string" ? { abcId: text(values.abcId) } : {}),
      ...(typeof values.myBharatId === "string" ? { myBharatId: text(values.myBharatId) } : {}),
      ...(typeof values.mpin === "string" ? { mpin: text(values.mpin) || undefined } : {}),
      ...(typeof values.webauthnId === "string" ? { webauthnId: text(values.webauthnId) || undefined } : {}),
      ...(typeof values.photoUrl === "string" ? { photoUrl: safePhoto(values.photoUrl) } : {}),
      ...(typeof values.password === "string" ? { loginPassword: passwordRecord(text(values.password)) } : {}),
      ...(typeof values.nssRole === "string" ? { nssRole: knownRole(values.nssRole) } : {}),
      ...(typeof values.status === "string" ? { status: text(values.status) === "alumni" ? "alumni" : "active" } : {}),
    };
  };
  if (studentCache) studentCache = { ...studentCache, volunteers: studentCache.volunteers.map(apply) };
  if (cloudCache) {
    cloudCache = {
      ...cloudCache,
      data: { ...cloudCache.data, volunteers: cloudCache.data.volunteers.map(apply) },
    };
  }
}

export async function readOneStudent(docId: string): Promise<Volunteer | null> {
  const id = text(docId);
  if (!id || id.startsWith("vol-")) return null;
  const row = await getDocument(`students/${encodeURIComponent(id)}`);
  if (!row) return null;
  if (!text(row.fullName) && !text(row.volunteerId) && !text(row.mobile)) return null;
  reveal(row, [...SEAL_KEYS, "password"]);
  const mobileDigits = mobileKey(row.mobile) || mobileKey(row._id);
  const mobile = mobileDigits.length >= 10 ? mobileDigits : latinDigits(text(row.mobile));
  const statusRaw = text(row.status).toLowerCase();
  return {
    id: text(row._id) || id,
    volunteerId: text(row.volunteerId),
    enrollment: latinDigits(text(row.enrollment)),
    fullName: titleFirstName(cleanPersonName(text(row.fullName))),
    mobile,
    email: text(row.email),
    course: normalizeCourse(row.course) as Volunteer["course"],
    semester: latinDigits(text(row.semester) || "1"),
    unit: text(row.unit) === "Unit 2" ? "Unit 2" : "Unit 1",
    nssRole: knownRole(row.nssRole),
    fatherName: text(row.fatherName),
    dob: isoDate(row.dob),
    gender: (text(row.gender) === "Female" ? "Female" : text(row.gender) === "Male" ? "Male" : "") as Volunteer["gender"],
    bloodGroup: text(row.bloodGroup),
    address: text(row.address),
    parentMobile: text(row.parentMobile) || text(row.emergencyContact) || mobile,
    emergencyContact: text(row.emergencyContact),
    abcId: text(row.abcId),
    myBharatId: text(row.myBharatId),
    photoUrl: safePhoto(row.photoUrl),
    loginPassword: text(row.password),
    mpin: text(row.mpin) || undefined,
    webauthnId: text(row.webauthnId) || undefined,
    createdAt: isoDate(row.createdAt),
    status: statusRaw === "alumni" ? "alumni" : "active",
  };
}

export async function patchStudent(docId: string, values: Record<string, unknown>, opts?: { quiet?: boolean }) {
  const id = text(docId);
  if (!id) throw new Error("Student record was not found.");
  const touchesBoard = Object.keys(values).some((key) => BOARD_FIELDS.has(key));
  if (!opts?.quiet && touchesBoard) {
    invalidateCollegeCache();
    studentCache = null;
    rosterCache = null;
  } else {
    mergeStudentCache(id, values);
  }
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    let stored: unknown = value;
    if (key === "password") stored = passwordRecord(text(value));
    else if (SEAL_KEYS.has(key) && typeof value === "string") stored = sealText(value);
    fields[key] = encodeValue(stored);
  }
  const project = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
  const name = `projects/${project}/databases/(default)/documents/students/${id}`;
  const res = await fetch(`${FIRESTORE_BASE}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          update: { name, fields },
          updateMask: { fieldPaths: Object.keys(fields) },
          currentDocument: { exists: true },
        },
      ],
    }),
  });
  if (res.status === 429 || res.status === 503) {
    noteQuota();
    throw new Error("The college register is busy. Try again in a little while.");
  }
  if (res.status === 404) throw new Error("Student record was not found.");
  if (!res.ok) throw new Error("Could not update the student record.");
  if (!opts?.quiet && touchesBoard) void markBoardStale();
}

export async function saveStudentToCloud(input: Record<string, unknown>) {
  invalidateCollegeCache();
  studentCache = null;
  rosterCache = null;
  const mobile = digits(input.mobile);
  if (mobile.length < 10) throw new Error("Mobile must be 10 digits");
  const existing = await getDocument(`students/${mobile}`);
  if (existing && text(existing.fullName) && text(existing.status).toLowerCase() !== "deleted") {
    throw new Error("This mobile number is already on the NSS roll.");
  }
  const students = await listCollection("students");
  const n = nextVolunteerNumber(students);
  const semester = latinDigits(text(input.semester) || "1");
  const volunteerId = `NSS${padId(n)}`;
  const enrollment = latinDigits(text(input.enrollment)) || `2026-${semester}-${padId(n)}`;
  const unit = text(input.unit) === "Unit 2" ? "Unit 2" : "Unit 1";
  const now = new Date().toISOString();
  const fullName = titleFirstName(cleanPersonName(text(input.fullName)));
  const fields: Record<string, unknown> = {
    fullName: encodeValue(fullName),
    mobile: encodeValue(sealText(mobile)),
    email: encodeValue(sealText(text(input.email))),
    course: encodeValue(input.course),
    semester: encodeValue(semester),
    unit: encodeValue(unit),
    volunteerId: encodeValue(volunteerId),
    enrollment: encodeValue(enrollment),
    nssRole: encodeValue("Volunteer"),
    status: encodeValue("active"),
    fatherName: encodeValue(sealText(text(input.fatherName))),
    dob: encodeValue(sealText(text(input.dob))),
    gender: encodeValue(input.gender),
    bloodGroup: encodeValue(sealText(text(input.bloodGroup))),
    address: encodeValue(sealText(text(input.address))),
    parentMobile: encodeValue(sealText(text(input.parentMobile))),
    emergencyContact: encodeValue(sealText(text(input.emergencyContact))),
    abcId: encodeValue(sealText(text(input.abcId))),
    myBharatId: encodeValue(sealText(text(input.myBharatId))),
    createdAt: encodeValue(now.slice(0, 10)),
    updatedAt: encodeValue(now),
  };
  const photo = safePhoto(input.photoUrl);
  if (photo) fields.photoUrl = encodeValue(photo);
  const thumb = text(input.thumbUrl);
  if (thumb.startsWith("data:image/") && thumb.length > 80 && thumb.length < 8000) fields.thumbUrl = encodeValue(thumb);
  const res = await fetch(`${FIRESTORE_BASE}/students?documentId=${mobile}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 409) throw new Error("This mobile number is already on the NSS roll.");
    throw new Error(body.slice(0, 180) || "Could not save registration to cloud");
  }
  void markBoardStale();
  void publishLatestVolunteer({
    id: volunteerId,
    volunteerId,
    fullName,
    unit,
    createdAt: now.slice(0, 10),
  });
  return {
    ok: true,
    id: mobile,
    volunteer: {
      id: volunteerId,
      volunteerId,
      enrollment,
      fullName,
      mobile: "",
      email: "",
      course: text(input.course) || "B.Com.",
      semester,
      unit,
      nssRole: /leader/i.test(text(input.nssRole)) ? "Leader" : "Volunteer",
      fatherName: "",
      dob: text(input.dob),
      gender: text(input.gender) === "Female" || text(input.gender) === "Male" || text(input.gender) === "Other" ? text(input.gender) : "",
      bloodGroup: "",
      address: "",
      parentMobile: "",
      photoUrl: photo,
      status: "active" as const,
      createdAt: now.slice(0, 10),
    },
  };
}

let lastVisitorCount = 0;
let visitorFreshUntil = 0;

export function knownVisitorCount() {
  return lastVisitorCount;
}

export async function readVisitorCount(): Promise<number> {
  if (lastVisitorCount > 0 && Date.now() < visitorFreshUntil) return lastVisitorCount;
  try {
    const doc = await getDocument("portalSettings/visitors");
    const count = Number(doc?.count ?? 0);
    if (count > 0) {
      lastVisitorCount = count;
      visitorFreshUntil = Date.now() + 60_000;
    }
    return count;
  } catch {
    return lastVisitorCount;
  }
}

export async function incrementVisitors(): Promise<number> {
  try {
    return await incrementVisitorsFresh();
  } catch {
    return 0;
  }
}

async function incrementVisitorsFresh(): Promise<number> {
  const project = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
  const res = await fetch(`${FIRESTORE_BASE}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          transform: {
            document: `projects/${project}/databases/(default)/documents/portalSettings/visitors`,
            fieldTransforms: [{ fieldPath: "count", increment: { integerValue: "1" } }],
          },
        },
      ],
    }),
  });
  if (!res.ok) return lastVisitorCount;
  const json = (await res.json()) as { writeResults?: { transformResults?: { integerValue?: string }[] }[] };
  const value = Number(json.writeResults?.[0]?.transformResults?.[0]?.integerValue ?? 0);
  if (value > 0) {
    lastVisitorCount = value;
    visitorFreshUntil = Date.now() + 60_000;
    void publishVisitors(value);
  }
  return value;
}

export type LivePulse = {
  visitors: number;
  volunteerCount: number;
  hours: number;
  latest?: { id: string; volunteerId: string; fullName: string; unit: string; createdAt: string };
  best?: { id: string; volunteerId: string; fullName: string; unit: string; hours: number };
};

let lastLive: LivePulse | null = null;
let lastLiveAt = 0;

function rememberLive(pulse: LivePulse) {
  lastLive = pulse;
  lastLiveAt = Date.now();
}

async function writeLive(fields: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const key of Object.keys(fields)) params.append("updateMask.fieldPaths", key);
  const patch = await fetch(`${FIRESTORE_BASE}/portalSettings/live?${params}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (patch.ok) return;
  if (patch.status === 429 || patch.status === 503) {
    noteQuota();
    return;
  }
  await fetch(`${FIRESTORE_BASE}/portalSettings?documentId=live`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

export async function readLive(): Promise<LivePulse | null> {
  if (lastLive && Date.now() - lastLiveAt < 45_000) return lastLive;
  try {
    const doc = await getDocument("portalSettings/live");
    if (!doc) return lastLive;
    const latestName = text(doc.latestName);
    const bestName = text(doc.bestName);
    const pulse: LivePulse = {
      visitors: Number(doc.visitors ?? lastVisitorCount ?? 0),
      volunteerCount: Number(doc.volunteerCount ?? 0),
      hours: Number(doc.serviceHours ?? 0),
      latest: latestName
        ? {
            id: text(doc.latestId),
            volunteerId: text(doc.latestVid),
            fullName: latestName,
            unit: text(doc.latestUnit) === "Unit 2" ? "Unit 2" : "Unit 1",
            createdAt: text(doc.latestAt),
          }
        : undefined,
      best: bestName
        ? {
            id: text(doc.bestId),
            volunteerId: text(doc.bestVid),
            fullName: bestName,
            unit: text(doc.bestUnit) === "Unit 2" ? "Unit 2" : "Unit 1",
            hours: Number(doc.bestHours ?? 0),
          }
        : undefined,
    };
    rememberLive(pulse);
    return pulse;
  } catch {
    return lastLive;
  }
}

export async function publishVisitors(count: number) {
  if (count < 1) return;
  if (lastLive) lastLive = { ...lastLive, visitors: Math.max(lastLive.visitors, count) };
  await writeLive({
    visitors: encodeValue(count),
    updatedAt: encodeValue(new Date().toISOString()),
  });
}

export async function publishServiceHours(hours: number) {
  const next = Math.max(0, Math.round(hours));
  if (next < 1) return;
  rememberLive({
    visitors: lastLive?.visitors ?? lastVisitorCount,
    volunteerCount: lastLive?.volunteerCount ?? 0,
    hours: next,
    latest: lastLive?.latest,
    best: lastLive?.best,
  });
  await writeLive({
    serviceHours: encodeValue(next),
    updatedAt: encodeValue(new Date().toISOString()),
  });
}

export async function publishLatestVolunteer(volunteer: {
  id: string;
  volunteerId: string;
  fullName: string;
  unit: string;
  createdAt: string;
}) {
  const project = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
  const document = `projects/${project}/databases/(default)/documents/portalSettings/live`;
  if (!collegeQuotaBlocked()) {
    await fetch(`${FIRESTORE_BASE}:commit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        writes: [
          {
            transform: {
              document,
              fieldTransforms: [{ fieldPath: "volunteerCount", increment: { integerValue: "1" } }],
            },
          },
        ],
      }),
    }).catch(() => undefined);
  }
  await writeLive({
    latestId: encodeValue(volunteer.volunteerId || volunteer.id),
    latestVid: encodeValue(volunteer.volunteerId),
    latestName: encodeValue(volunteer.fullName),
    latestUnit: encodeValue(volunteer.unit),
    latestAt: encodeValue(volunteer.createdAt),
    updatedAt: encodeValue(new Date().toISOString()),
  });
}

export async function publishBestVolunteer(best: {
  id: string;
  volunteerId: string;
  fullName: string;
  unit: string;
  hours: number;
}) {
  await writeLive({
    bestId: encodeValue(best.id),
    bestVid: encodeValue(best.volunteerId),
    bestName: encodeValue(best.fullName),
    bestUnit: encodeValue(best.unit),
    bestHours: encodeValue(Math.max(0, Math.round(best.hours))),
    updatedAt: encodeValue(new Date().toISOString()),
  });
}

export async function clearAttendanceCloud(eventName = "", opts?: { all?: boolean }) {
  invalidateCollegeCache();
  const want = text(eventName).trim().toLowerCase();
  const wipeAll = Boolean(opts?.all) || !want;
  const docs = await listCollection("attendance", { strict: true });
  const targets = docs.filter((row) => {
    if (wipeAll) return true;
    const name = (text(row.eventName) || text(row.title)).trim().toLowerCase();
    return name === want || (want.length > 3 && (name.includes(want) || want.includes(name)));
  });
  let removed = 0;
  for (let i = 0; i < targets.length; i += 25) {
    const batch = targets.slice(i, i + 25);
    const results = await Promise.all(batch.map(async (row) => {
      const id = text(row._id);
      if (!id) return false;
      const res = await fetch(`${FIRESTORE_BASE}/attendance/${encodeURIComponent(id)}`, { method: "DELETE" });
      return res.ok || res.status === 404;
    }));
    removed += results.filter(Boolean).length;
  }
  let hours = 0;
  try {
    const data = await loadCollegeCloud({ gallery: false, photos: false, attendance: true });
    hours = data ? computeServiceHours(data.events, data.attendance) : 0;
    await fetch(`${FIRESTORE_BASE}/portalSettings/publicStats?updateMask.fieldPaths=serviceHours`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fields: { serviceHours: encodeValue(hours) } }),
    });
  } catch {
    hours = 0;
  }
  void markBoardStale();
  return { removed, serviceHours: hours };
}

function attendanceDocId(mobile: string, eventName: string) {
  return sealedAttendanceId(mobile, eventName);
}

function legacyAttendanceDocId(mobile: string, eventName: string) {
  const phone = digits(mobile).slice(-10);
  const slug = text(eventName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  if (phone.length < 10 || !slug) return "";
  return `${phone}-${slug}`;
}

export async function saveAttendanceMark(input: { mobile: string; name: string; eventName: string; present: boolean; date?: string }) {
  invalidateCollegeCache();
  const id = attendanceDocId(input.mobile, input.eventName);
  if (!id) return false;
  const status = input.present ? "Present" : "Absent";
  const phone = digits(input.mobile).slice(-10);
  const fields = {
    eventName: encodeValue(input.eventName),
    title: encodeValue(input.eventName),
    status: encodeValue(status),
    attendance: encodeValue(status),
    studentMobile: encodeValue(sealText(phone)),
    mobile: encodeValue(sealText(phone)),
    studentName: encodeValue(sealText(input.name)),
    name: encodeValue(sealText(input.name)),
    date: encodeValue(input.date || new Date().toISOString().slice(0, 10)),
    updatedAt: encodeValue(new Date().toISOString()),
  };
  const body = JSON.stringify({ fields });
  const patch = await fetch(`${FIRESTORE_BASE}/attendance/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body,
  });
  const legacy = legacyAttendanceDocId(input.mobile, input.eventName);
  if (legacy && legacy !== id) {
    void fetch(`${FIRESTORE_BASE}/attendance/${encodeURIComponent(legacy)}`, { method: "DELETE" });
  }
  if (patch.ok) return true;
  const create = await fetch(`${FIRESTORE_BASE}/attendance?documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return create.ok || create.status === 409;
}

export async function saveAttendanceMarks(rows: { mobile: string; name: string; eventName: string; present: boolean; date?: string }[]) {
  invalidateCollegeCache();
  let saved = 0;
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    const results = await Promise.all(batch.map((row) => saveAttendanceMark(row).catch(() => false)));
    saved += results.filter(Boolean).length;
  }
  if (saved > 0) void markBoardStale();
  return saved;
}

export function computeServiceHours(events: { id: string; hours?: number }[], attendance: { eventId: string; present: boolean }[]) {
  const hoursMap = new Map(events.map((e) => [e.id, Number(e.hours) > 0 ? Number(e.hours) : 4]));
  let total = 0;
  for (const row of attendance) {
    if (row.present) total += hoursMap.get(row.eventId) ?? 4;
  }
  return total;
}

export type ChatPerson = { id: string; name: string; unit: string; role: string; mobile?: string };
export type ChatExtra = {
  kind?: string;
  editedAt?: string;
  expiresAt?: string;
  viewOnce?: boolean;
  opened?: boolean;
  reactions?: Record<string, string>;
  poll?: { q: string; options: string[]; votes: Record<string, string> };
  fileName?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactUnit?: string;
  forwarded?: boolean;
  clientId?: string;
};

export type ChatRow = {
  id: string;
  threadId: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  replyName?: string;
  replyText?: string;
  media?: string;
  mediaType?: "" | "image" | "video" | "audio" | "file";
  extra?: ChatExtra;
};

async function createDocument(collection: string, id: string, values: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) fields[key] = encodeValue(value);
  const res = await fetch(`${FIRESTORE_BASE}/${collection}?documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 180) || "Could not save");
  }
}

export async function issueChatPass(pass: { token: string; senderId: string; senderName: string; role: string; unit: string; docId: string }) {
  await createDocument("notices", tokenDocId(pass.token), {
    kind: "chat-auth",
    title: "NSS_CHAT_AUTH",
    senderId: sealText(pass.senderId),
    senderName: sealText(pass.senderName),
    role: pass.role,
    unit: sealText(pass.unit),
    docId: sealText(pass.docId),
    createdAt: new Date().toISOString(),
  });
}

export async function readChatPass(token: string) {
  const signed = openChatPass(token);
  if (signed) return signed;
  if (!/^[a-f0-9]{32,64}$/.test(token)) return null;
  try {
    const row = (await getDocument(`notices/${tokenDocId(token)}`)) || (await getDocument(`notices/${token}`));
    if (!row || text(row.kind) !== "chat-auth" || !text(row.senderId)) return null;
    return {
      id: openText(text(row.senderId)),
      name: openText(text(row.senderName)) || "NSS",
      role: text(row.role) || "volunteer",
      unit: openText(text(row.unit)),
      docId: openText(text(row.docId)),
    };
  } catch {
    return null;
  }
}

let peopleCache: { at: number; key: string; rows: ChatPerson[] } | null = null;

export async function listChatPeople(opts?: { includeMobile?: boolean }): Promise<ChatPerson[]> {
  const key = opts?.includeMobile ? "private" : "public";
  if (peopleCache && peopleCache.key === key && Date.now() - peopleCache.at < 10 * 60 * 1000) return peopleCache.rows;
  if (collegeQuotaBlocked()) return peopleCache?.rows ?? [];
  const params = new URLSearchParams({ pageSize: "300" });
  const fields = ["fullName", "firstName", "middleName", "surname", "volunteerId", "unit", "nssRole", "status", "createdAt"];
  if (opts?.includeMobile) fields.push("mobile");
  for (const field of fields) params.append("mask.fieldPaths", field);
  const docs: Record<string, unknown>[] = [];
  let url: string | "" = `${FIRESTORE_BASE}/students?${params}`;
  let page = 0;
  while (url && page < 2) {
    page += 1;
    const res = await fetch(url);
    if (res.status === 429 || res.status === 503) {
      noteQuota();
      return peopleCache?.rows ?? [];
    }
    if (!res.ok) break;
    const json = (await res.json()) as { documents?: { name?: string; fields?: Record<string, FsValue> }[]; nextPageToken?: string };
    for (const doc of json.documents ?? []) docs.push(decodeDoc(doc));
    url = json.nextPageToken ? `${FIRESTORE_BASE}/students?${params}&pageToken=${encodeURIComponent(json.nextPageToken)}` : "";
  }
  const keep = docs.filter((s) => {
    const status = text(s.status).toLowerCase();
    return status !== "inactive" && status !== "deleted";
  });
  const sorted = [...keep].sort(
    (a, b) => isoDate(a.createdAt).localeCompare(isoDate(b.createdAt)) || text(a.fullName).localeCompare(text(b.fullName), "en", { sensitivity: "base" }),
  );
  const numbers = rollNumbers(sorted);
  const rows = sorted
    .map((s) => {
      const n = numbers.get(s) ?? 1;
      const assembled = [s.firstName, s.middleName, s.surname].map(text).filter(Boolean).join(" ");
      const unit = text(s.unit) === "Unit 2" ? "Unit 2" : "Unit 1";
      const person: ChatPerson = {
        id: text(s.volunteerId) || `NSS${padId(n)}`,
        name: titleFirstName(cleanPersonName(text(s.fullName) || assembled)),
        unit,
        role: knownRole(s.nssRole),
      };
      if (opts?.includeMobile) {
        const mobile = digits(openText(text(s.mobile))).slice(-10);
        if (mobile.length === 10) person.mobile = mobile;
      }
      return person;
    })
    .filter((person) => person.name);
  if (rows.length) peopleCache = { at: Date.now(), key, rows };
  return rows;
}

let chatCache: { at: number; rows: ChatRow[] } | null = null;
let readCache: { id: string; thread: string; at: string }[] = [];
const goneCache = new Set<string>();
const clearedAt = new Map<string, string>();
const CHAT_LIFE_MS = 24 * 60 * 60 * 1000;

function chatStillLive(createdAt: string) {
  const at = new Date(createdAt).getTime();
  return Number.isFinite(at) && Date.now() - at < CHAT_LIFE_MS;
}

function sameChatBubble(a: { threadId: string; senderId: string; senderName: string; text: string; createdAt: string }, b: { threadId: string; senderId: string; senderName: string; text: string; createdAt: string }) {
  const left = a.text.trim();
  const right = b.text.trim();
  if (!left || left !== right || a.threadId !== b.threadId) return false;
  const gap = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (!Number.isFinite(gap) || gap >= 90_000) return false;
  if (a.senderId === b.senderId) return true;
  const name = a.senderName.trim().toLowerCase();
  return Boolean(name) && name === b.senderName.trim().toLowerCase();
}

function visibleChats(rows: ChatRow[]) {
  const kept: ChatRow[] = [];
  for (const row of rows) {
    if (!row.id || goneCache.has(row.id) || !chatStillLive(row.createdAt)) continue;
    const cut = clearedAt.get(row.threadId);
    if (cut && row.createdAt <= cut) continue;
    if (kept.some((item) => sameChatBubble(item, row))) continue;
    kept.push(row);
  }
  return kept;
}

async function markChatField(field: "reads" | "gone" | "cleared" | "edits", value: string) {
  const project = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
  await fetch(`${FIRESTORE_BASE}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          transform: {
            document: `projects/${project}/databases/(default)/documents/portalSettings/chatlog`,
            fieldTransforms: [{ fieldPath: field, appendMissingElements: { values: [{ stringValue: value }] } }],
          },
        },
      ],
    }),
  });
}

export async function markChatRead(userId: string, threadId: string, at: string) {
  const id = text(userId).slice(0, 40);
  const thread = text(threadId).slice(0, 80);
  if (!id || !thread) return;
  readCache = [...readCache.filter((row) => !(row.id === id && row.thread === thread)), { id, thread, at }].slice(-100);
  await markChatField("reads", JSON.stringify({ id, thread, at }));
}

export function chatReads() {
  const cutoff = Date.now() - CHAT_LIFE_MS;
  return readCache.filter((row) => new Date(row.at).getTime() >= cutoff);
}

export async function markThreadCleared(threadId: string) {
  const thread = text(threadId).slice(0, 80);
  if (!thread) return [];
  const at = new Date().toISOString();
  clearedAt.set(thread, at);
  const ids = (chatCache?.rows ?? []).filter((row) => row.threadId === thread).map((row) => row.id);
  for (const id of ids) goneCache.add(id);
  if (chatCache) chatCache = { at: Date.now(), rows: visibleChats(chatCache.rows) };
  await markChatField("cleared", JSON.stringify({ thread, at }));
  return ids;
}

export async function markChatGone(ids: string[]) {
  const unique = [...new Set(ids.map((id) => text(id)).filter((id) => id.startsWith("chat")))].slice(0, 40);
  for (const id of unique) goneCache.add(id);
  if (chatCache) chatCache = { at: Date.now(), rows: visibleChats(chatCache.rows) };
  await Promise.all(unique.map((id) => markChatField("gone", id).catch(() => undefined)));
}

function rememberChat(row: ChatRow) {
  const rows = [...(chatCache?.rows ?? []).filter((item) => item.id !== row.id), row]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-80);
  chatCache = { at: Date.now(), rows };
}

function tailRows(value: unknown): ChatRow[] {
  const list = Array.isArray(value) ? value : [];
  const rows: ChatRow[] = [];
  for (const item of list) {
    if (typeof item !== "string" || !item.startsWith("{")) continue;
    try {
      const row = JSON.parse(item) as ChatRow;
      if (!row?.id || !row.threadId) continue;
      rows.push({
        id: text(row.id),
        threadId: text(row.threadId),
        text: openText(text(row.text)).slice(0, 1000),
        senderId: text(row.senderId),
        senderName: openText(text(row.senderName)).slice(0, 80),
        createdAt: text(row.createdAt),
        replyName: openText(text(row.replyName)).slice(0, 80),
        replyText: openText(text(row.replyText)).slice(0, 140),
        media: "",
        mediaType: row.mediaType === "video" || row.mediaType === "audio" || row.mediaType === "file" || row.mediaType === "image" ? row.mediaType : "",
        extra: parseChatExtra(typeof row.extra === "string" ? row.extra : ""),
      });
    } catch {
      /* skip a bad line */
    }
  }
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-80);
}

function slimExtra(extra?: ChatExtra): ChatExtra | undefined {
  if (!extra) return undefined;
  const slim: ChatExtra = {};
  if (extra.kind) slim.kind = extra.kind.slice(0, 16);
  if (extra.editedAt) slim.editedAt = extra.editedAt;
  if (extra.expiresAt) slim.expiresAt = extra.expiresAt.slice(0, 40);
  if (extra.viewOnce) slim.viewOnce = true;
  if (extra.opened) slim.opened = true;
  if (extra.forwarded) slim.forwarded = true;
  if (extra.clientId) slim.clientId = extra.clientId.slice(0, 40);
  if (extra.contactName) slim.contactName = extra.contactName.slice(0, 80);
  if (extra.contactUnit) slim.contactUnit = extra.contactUnit.slice(0, 40);
  if (extra.fileName) slim.fileName = extra.fileName.slice(0, 40);
  if (extra.reactions) slim.reactions = Object.fromEntries(Object.entries(extra.reactions).slice(0, 8));
  if (extra.poll) slim.poll = { q: extra.poll.q.slice(0, 140), options: extra.poll.options.slice(0, 4), votes: extra.poll.votes || {} };
  return JSON.stringify(slim).length > 2 ? slim : undefined;
}

function applyChatEdits(rows: ChatRow[], raw: unknown) {
  const list = Array.isArray(raw) ? raw : [];
  const latest = new Map<string, { text: string; extra?: ChatExtra; at: string }>();
  for (const item of list) {
    if (typeof item !== "string" || !item.startsWith("{")) continue;
    try {
      const row = JSON.parse(item) as { id?: string; text?: string; extra?: string; at?: string };
      if (!row.id || !row.at) continue;
      const prev = latest.get(row.id);
      if (prev && prev.at >= row.at) continue;
      latest.set(row.id, {
        text: row.text ? openText(row.text).slice(0, 1000) : "",
        extra: row.extra ? parseChatExtra(row.extra) : undefined,
        at: row.at,
      });
    } catch {
      /* skip a bad edit */
    }
  }
  if (!latest.size) return rows;
  return rows.map((row) => {
    const edit = latest.get(row.id);
    if (!edit) return row;
    return {
      ...row,
      text: edit.text || row.text,
      extra: edit.extra ? { ...row.extra, ...edit.extra } : row.extra,
    };
  });
}

async function publishChatTail(row: ChatRow) {
  const packed = slimExtra(row.extra);
  const slim = JSON.stringify({
    id: row.id,
    threadId: row.threadId,
    text: sealText(row.text.slice(0, 1000)),
    senderId: row.senderId,
    senderName: sealText(row.senderName.slice(0, 80)),
    createdAt: row.createdAt,
    replyName: row.replyName ? sealText(row.replyName.slice(0, 80)) : "",
    replyText: row.replyText ? sealText(row.replyText.slice(0, 140)) : "",
    mediaType: row.mediaType || "",
    extra: packed ? sealText(JSON.stringify(packed).slice(0, 700)) : "",
  });
  const project = process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc";
  const res = await fetch(`${FIRESTORE_BASE}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          transform: {
            document: `projects/${project}/databases/(default)/documents/portalSettings/chatlog`,
            fieldTransforms: [{ fieldPath: "recent", appendMissingElements: { values: [{ stringValue: slim }] } }],
          },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("Could not save the message.");
}

export async function reviseChatMessage(id: string, next: { text?: string; extra?: ChatExtra }) {
  const safe = text(id);
  if (!/^chat[a-z0-9]{4,40}$/i.test(safe)) throw new Error("That message was not found.");
  const current = (chatCache?.rows ?? []).find((row) => row.id === safe);
  const textBody = next.text !== undefined ? next.text.slice(0, 1000).trim() : current?.text || "";
  const extra = next.extra ?? current?.extra;
  if (chatCache) {
    chatCache = {
      at: Date.now(),
      rows: chatCache.rows.map((row) => (row.id === safe ? { ...row, text: textBody || row.text, extra } : row)),
    };
  }
  const packed = slimExtra(extra);
  const line = JSON.stringify({
    id: safe,
    text: textBody ? sealText(textBody) : "",
    extra: packed ? sealText(JSON.stringify(packed).slice(0, 700)) : "",
    at: new Date().toISOString(),
  });
  await markChatField("edits", line.slice(0, 1800));
  void patchNotice(safe, {
    ...(textBody ? { text: sealText(textBody) } : {}),
    ...(packed ? { extra: sealText(JSON.stringify(packed).slice(0, 900)) } : {}),
  }).catch(() => undefined);
}

export async function chatBlocked(leftId: string, rightId: string) {
  const left = text(leftId);
  const right = text(rightId);
  if (!left || !right || left === right) return false;
  const [mine, theirs] = await Promise.all([
    readSide(sideDocId("blk", left)).catch(() => null),
    readSide(sideDocId("blk", right)).catch(() => null),
  ]);
  const has = (doc: Record<string, unknown> | null, id: string) => text(doc?.ids).split(",").filter(Boolean).includes(id);
  return has(mine, right) || has(theirs, left);
}

export async function listRecentChatMessages(limit = 60): Promise<ChatRow[]> {
  if (chatCache && Date.now() - chatCache.at < 12_000 && chatCache.rows.length) return visibleChats(chatCache.rows).slice(-limit);
  if (!collegeQuotaBlocked()) {
    try {
      const doc = await getDocument("portalSettings/chatlog");
      const gone = Array.isArray(doc?.gone) ? doc.gone : [];
      for (const id of gone) if (typeof id === "string" && id.startsWith("chat")) goneCache.add(id);
      const reads = Array.isArray(doc?.reads) ? doc.reads : [];
      for (const item of reads) {
        if (typeof item !== "string" || !item.startsWith("{")) continue;
        try {
          const row = JSON.parse(item) as { id?: string; thread?: string; at?: string };
          if (!row.id || !row.thread || !row.at) continue;
          readCache = [...readCache.filter((kept) => !(kept.id === row.id && kept.thread === row.thread)), { id: row.id, thread: row.thread, at: row.at }].slice(-100);
        } catch {
          /* skip a bad receipt */
        }
      }
      const fromTail = applyChatEdits(tailRows(doc?.recent), doc?.edits);
      const cleared = Array.isArray(doc?.cleared) ? doc.cleared : [];
      for (const item of cleared) {
        if (typeof item !== "string" || !item.startsWith("{")) continue;
        try {
          const row = JSON.parse(item) as { thread?: string; at?: string };
          if (!row.thread || !row.at) continue;
          const prev = clearedAt.get(row.thread);
          if (!prev || row.at > prev) clearedAt.set(row.thread, row.at);
        } catch {
          /* skip a bad clear mark */
        }
      }
      if (fromTail.length || cleared.length) {
        const seen = new Set(fromTail.map((row) => row.id));
        const merged = [...fromTail, ...(chatCache?.rows ?? []).filter((row) => !seen.has(row.id))]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .slice(-80);
        chatCache = { at: Date.now(), rows: merged };
        return visibleChats(merged).slice(-limit);
      }
    } catch {
      return chatCache?.rows ? visibleChats(chatCache.rows).slice(-limit) : [];
    }
  }
  return visibleChats(chatCache?.rows ?? []).slice(-limit);
}

export function parseChatExtra(raw: string): ChatExtra {
  const opened = openText(raw);
  if (!opened.startsWith("{")) return {};
  try {
    const value = JSON.parse(opened) as ChatExtra;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function packExtra(extra?: ChatExtra) {
  if (!extra) return "";
  const json = JSON.stringify(extra).slice(0, 1800);
  return json.length > 2 ? sealText(json) : "";
}

export function sideDocId(prefix: "pre" | "blk", userId: string) {
  return `${prefix}${userId.replace(/[^A-Za-z0-9]/g, "").slice(0, 24)}`;
}

export async function patchNotice(id: string, values: Record<string, unknown>) {
  const safe = text(id);
  if (!/^[A-Za-z0-9]{4,48}$/.test(safe)) throw new Error("That chat item was not found.");
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) fields[key] = encodeValue(value);
  const res = await fetch(`${FIRESTORE_BASE}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: `projects/${process.env.NSS_FIRESTORE_PROJECT_ID?.trim() || "studio-8504026975-1fdbc"}/databases/(default)/documents/notices/${safe}`,
            fields,
          },
          updateMask: { fieldPaths: Object.keys(fields) },
          currentDocument: { exists: true },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("Could not update the chat.");
}

export async function readSide(id: string) {
  if (!/^[A-Za-z0-9]{4,48}$/.test(id)) return null;
  try {
    return await getDocument(`notices/${id}`);
  } catch {
    return null;
  }
}

export async function upsertNotice(id: string, values: Record<string, unknown>) {
  const row = await getDocument(`notices/${id}`);
  if (!row) await createDocument("notices", id, values);
  else await patchNotice(id, values);
}

export async function readOneChat(id: string): Promise<ChatRow | null> {
  if (!/^chat[a-z0-9]{4,40}$/i.test(id)) return null;
  const row = await getDocument(`notices/${id}`);
  if (!row || text(row.kind) !== "chat") return null;
  const mediaType: "" | "image" | "video" | "audio" | "file" = text(row.mediaType) === "video" ? "video" : text(row.mediaType) === "audio" ? "audio" : text(row.mediaType) === "file" ? "file" : text(row.mediaType) === "image" ? "image" : "";
  return {
    id,
    threadId: text(row.threadId),
    text: openText(text(row.text)).slice(0, 1000),
    senderId: text(row.senderId),
    senderName: text(row.senderName).slice(0, 80),
    createdAt: text(row.createdAt),
    replyName: openText(text(row.replyName)).slice(0, 80),
    replyText: openText(text(row.replyText)).slice(0, 140),
    media: "",
    mediaType,
    extra: parseChatExtra(text(row.extra)),
  };
}

export async function readChatMedia(ids: string[]) {
  const unique = [...new Set(ids.map((id) => text(id)).filter((id) => /^chat[a-z0-9]{4,40}$/i.test(id)))].slice(0, 6);
  const docs = await Promise.all(unique.map((id) => getDocument(`notices/${id}`).catch(() => null)));
  const out: { id: string; threadId: string; media: string; mediaType: "image" | "video" | "audio" | "file" }[] = [];
  for (const row of docs) {
    if (!row || text(row.kind) !== "chat") continue;
    const mediaType = text(row.mediaType) === "video" ? "video" : text(row.mediaType) === "audio" ? "audio" : text(row.mediaType) === "file" ? "file" : text(row.mediaType) === "image" ? "image" : "";
    if (!mediaType) continue;
    const partCount = Number(text(row.parts)) || 0;
    let media = openText(text(row.media));
    if (!media && partCount > 0 && partCount <= 8) {
      const chunks = await Promise.all(
        Array.from({ length: partCount }, (_, index) => getDocument(`notices/${text(row._id)}p${index}`).catch(() => null)),
      );
      media = chunks.map((part) => openText(text(part?.media))).join("");
    }
    const prefix = mediaType === "video" ? "data:video/" : mediaType === "audio" ? "data:audio/" : mediaType === "file" ? "data:" : "data:image/";
    if (!media.startsWith(prefix) || media.length >= 3400000) continue;
    out.push({ id: text(row._id), threadId: text(row.threadId), media, mediaType });
  }
  return out;
}

export async function saveChatMessage(input: { threadId: string; text: string; senderId: string; senderName: string; replyName?: string; replyText?: string; media?: string; mediaType?: "" | "image" | "video" | "audio" | "file"; extra?: ChatExtra }) {
  const textBody = input.text.slice(0, 1000).trim();
  const draft = {
    threadId: input.threadId,
    senderId: input.senderId,
    senderName: input.senderName,
    text: textBody,
    createdAt: new Date().toISOString(),
  };
  const recent = visibleChats(chatCache?.rows ?? []);
  const clientId = input.extra?.clientId?.slice(0, 40) || "";
  const sameClient = clientId
    ? recent.find((row) => row.senderId === input.senderId && row.extra?.clientId === clientId)
    : undefined;
  if (sameClient) return sameClient;
  const twin = recent.find((row) => sameChatBubble(row, draft));
  if (twin && !input.media) return twin;
  if (!twin && !collegeQuotaBlocked()) {
    try {
      const doc = await getDocument("portalSettings/chatlog");
      const storedRows = visibleChats(applyChatEdits(tailRows(doc?.recent), doc?.edits));
      const storedClient = clientId
        ? storedRows.find((row) => row.senderId === input.senderId && row.extra?.clientId === clientId)
        : undefined;
      if (storedClient) return storedClient;
      const stored = storedRows.find((row) => sameChatBubble(row, draft));
      if (stored && !input.media) return stored;
    } catch {
      /* a busy register still accepts a new message */
    }
  }
  const createdAt = new Date().toISOString();
  const id = `chat${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const replyName = text(input.replyName).slice(0, 80);
  const replyText = text(input.replyText).slice(0, 140);
  const mediaType = input.mediaType === "video" || input.mediaType === "audio" || input.mediaType === "file" || input.mediaType === "image" ? input.mediaType : "";
  const incoming = mediaType && input.media && input.media.length < 3400000 ? input.media : "";
  const extra = input.extra;
  let media = incoming.length <= 480000 ? incoming : "";
  let parts = "";
  if (incoming && !media) {
    const size = 400000;
    const count = Math.ceil(incoming.length / size);
    if (count > 8) throw new Error("That file is too large.");
    parts = String(count);
    for (let index = 0; index < count; index += 1) {
      await createDocument("notices", `${id}p${index}`, {
        kind: "chat-part",
        title: "NSS_CHAT_INTERNAL",
        media: sealText(incoming.slice(index * size, (index + 1) * size)),
      });
    }
  }
  const saved: ChatRow = {
    id,
    threadId: input.threadId,
    text: textBody,
    senderId: input.senderId,
    senderName: input.senderName.slice(0, 80),
    createdAt,
    replyName,
    replyText,
    media,
    mediaType: media ? mediaType : "",
    extra,
  };
  rememberChat(saved);
  if (incoming) {
    void createDocument("notices", id, {
      kind: "chat",
      title: "NSS_CHAT_INTERNAL",
      threadId: input.threadId,
      text: sealText(textBody),
      senderId: input.senderId,
      senderName: input.senderName.slice(0, 80),
      replyName: replyName ? sealText(replyName) : "",
      replyText: replyText ? sealText(replyText) : "",
      media: media ? sealText(media) : "",
      mediaType: mediaType,
      parts,
      extra: packExtra(extra),
      createdAt,
    }).catch(() => undefined);
  }
  await publishChatTail(saved);
  return saved;
}

async function deleteNoticeDoc(id: string) {
  if (!/^chat[a-z0-9]{4,40}$/i.test(id)) return;
  await fetch(`${FIRESTORE_BASE}/notices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listChatStatuses() {
  const docs =
    (await runQuery({
      from: [{ collectionId: "notices" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "kind" },
          op: "EQUAL",
          value: { stringValue: "chat-status" },
        },
      },
      limit: 20,
    })) ?? [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return docs
    .map((row) => ({
      id: text(row._id),
      text: openText(text(row.text)).slice(0, 140),
      senderId: text(row.senderId),
      senderName: text(row.senderName).slice(0, 80),
      createdAt: text(row.createdAt),
    }))
    .filter((row) => row.text && new Date(row.createdAt).getTime() > cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteChatMessages(ids: string[]) {
  const unique = [...new Set(ids.map((id) => text(id)).filter(Boolean))].slice(0, 80);
  await Promise.all(unique.map((id) => deleteNoticeDoc(id)));
  await markChatGone(unique);
}

export async function chatIdsInThread(threadId: string) {
  const wanted = text(threadId);
  if (!wanted) return [];
  const docs =
    (await runQuery({
      from: [{ collectionId: "notices" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "kind" },
          op: "EQUAL",
          value: { stringValue: "chat" },
        },
      },
      limit: 300,
    })) ?? [];
  return docs
    .filter((row) => text(row.kind) === "chat" && text(row.threadId) === wanted)
    .map((row) => text(row._id))
    .filter((id) => id.startsWith("chat"));
}
