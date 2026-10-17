import { cleanPersonName, latinDigits, padId, parseDob, titleFirstName } from "./format";
import type {
  AttendanceRecord,
  GalleryItem,
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

function noteQuota() {
  quotaBlockedUntil = Date.now() + 10 * 60 * 1000;
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
  "password",
  "createdAt",
  "updatedAt",
];

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
    for (const field of ["eventName", "title", "date", "startDate", "location", "hours", "status", "description", "beneficiaries", "category", "coordinator", "createdAt"]) {
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
        return kind !== "chat" && kind !== "chat-auth" && title !== "NSS_CHAT_INTERNAL" && title !== "NSS_CHAT_AUTH";
      });
    }
  } catch (error) {
    if (collegeQuotaBlocked()) throw error;
  }
  const docs = await listCollection("notices", { maxDocs: 80 });
  return docs.filter((n) => {
    const kind = text(n.kind);
    const title = text(n.title);
    return kind !== "chat" && kind !== "chat-auth" && title !== "NSS_CHAT_INTERNAL" && title !== "NSS_CHAT_AUTH";
  });
}

async function loadCollegeCloudFresh(opts: { gallery?: boolean; photos?: boolean } = {}): Promise<CloudPortal | null> {
  const [students, eventDocs, noticeDocs, attendanceDocs, galleryDocs, stats, visitorsDoc] =
    await Promise.all([
      listCollection("students", { photos: opts.photos !== false }),
      listCollection("events"),
      listPublicNotices(),
      listCollection("attendance", { maxDocs: 2500 }),
      opts.gallery === false ? Promise.resolve([]) : listCollection("gallery", { maxDocs: 60 }),
      getDocument("portalSettings/publicStats"),
      getDocument("portalSettings/visitors"),
    ]);

  if (!students.length && !eventDocs.length && !noticeDocs.length) return null;

  const keep = students.filter((s) => {
    const status = text(s.status).toLowerCase();
    return status !== "inactive" && status !== "deleted";
  });

  const sorted = [...keep].sort((a, b) =>
    isoDate(a.createdAt).localeCompare(isoDate(b.createdAt)) ||
    text(a.fullName).localeCompare(text(b.fullName), "en", { sensitivity: "base" }),
  );

  const numbers = rollNumbers(sorted);
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
      photoUrl: safePhoto(s.photoUrl),
      loginPassword: text(s.password),
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
    const statusRaw = text(e.status).toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    let status: NssEvent["status"] =
      statusRaw === "cancelled" ? "cancelled" : statusRaw === "upcoming" || statusRaw === "planning" ? "upcoming" : "completed";
    if (status === "upcoming" && date && date < today) status = "completed";
    return {
      id: text(e._id) || `evt-${name}-${date}`,
      name,
      date,
      location: text(e.location) || "Mansa",
      hours: Number(e.hours) > 0 ? Number(e.hours) : 4,
      status,
      description: text(e.description),
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
        hours: 4,
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
      return kind !== "chat" && kind !== "chat-auth" && title !== "NSS_CHAT_INTERNAL" && title !== "NSS_CHAT_AUTH";
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
  const storedHours = Number(stats?.serviceHours ?? 0);
  return {
    volunteers,
    events,
    attendance,
    notices,
    gallery,
    visitors: Number(visitorsDoc?.count ?? 0),
    alumniCount,
    serviceHours: Math.max(storedHours, computedHours),
  };
}

export async function loadCollegeCloud(opts: { gallery?: boolean; photos?: boolean } = {}): Promise<CloudPortal | null> {
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
  cloudInflight = loadCollegeCloudFresh({ gallery: wantGallery, photos: false })
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

const BOARD_TTL_MS = 12 * 60 * 60 * 1000;
const PUBLIC_MEMORY_MS = 10 * 60 * 1000;
let publicCache: { at: number; data: CloudPortal } | null = null;
let officerCache: { at: number; data: CloudPortal } | null = null;

function publicVolunteerId(v: { id: string; volunteerId?: string }) {
  const phone = digits(v.id);
  if (phone.length >= 8 && v.volunteerId) return v.volunteerId;
  return v.id || v.volunteerId || "";
}

function publicBoardShape(data: CloudPortal): CloudPortal {
  const gallery: CloudPortal["gallery"] = [];
  let galleryBytes = 0;
  for (const item of data.gallery) {
    if (!item.src || item.src.length > 120000) continue;
    galleryBytes += item.src.length;
    if (galleryBytes > 700000) break;
    gallery.push(item);
  }
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
      address: "",
      bloodGroup: "",
      parentMobile: "",
      fatherName: "",
      emergencyContact: "",
      abcId: "",
      myBharatId: "",
      photoUrl: v.photoUrl && v.photoUrl.startsWith("https://") && v.photoUrl.length < 8000 ? v.photoUrl : "",
    })),
  };
}

export async function markBoardStale() {
  invalidateCollegeCache();
  publicCache = null;
  officerCache = null;
  if (collegeQuotaBlocked()) return;
  try {
    await fetch(`${FIRESTORE_BASE}/portalSettings/board?updateMask.fieldPaths=stale`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fields: { stale: { booleanValue: true } } }),
    });
  } catch {
    /* the board expires on its own */
  }
}

async function readBoard(): Promise<CloudPortal | null> {
  if (collegeQuotaBlocked()) return publicCache?.data ?? null;
  let doc: Record<string, unknown> | null = null;
  try {
    doc = await getDocument("portalSettings/board");
  } catch {
    return publicCache?.data ?? null;
  }
  if (!doc || doc.stale === true) return null;
  const updatedAt = Date.parse(text(doc.updatedAt));
  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > BOARD_TTL_MS) return null;
  try {
    const parsed = JSON.parse(text(doc.payload)) as CloudPortal;
    if (!parsed || !Array.isArray(parsed.volunteers) || parsed.volunteers.length < 20) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeBoard(data: CloudPortal) {
  if (data.volunteers.length < 20 || collegeQuotaBlocked()) return;
  const payload = JSON.stringify(publicBoardShape(data));
  if (payload.length > 900000) return;
  const fields = {
    payload: { stringValue: payload },
    stale: { booleanValue: false },
    updatedAt: { stringValue: new Date().toISOString() },
    volunteers: { integerValue: String(data.volunteers.length) },
  };
  const patch = await fetch(
    `${FIRESTORE_BASE}/portalSettings/board?updateMask.fieldPaths=payload&updateMask.fieldPaths=stale&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=volunteers`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (patch.status === 429 || patch.status === 503) {
    noteQuota();
    return;
  }
  if (patch.ok) return;
  await fetch(`${FIRESTORE_BASE}/portalSettings?documentId=board`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

export async function loadPublicBoard(opts: { gallery?: boolean } = {}): Promise<CloudPortal | null> {
  const now = Date.now();
  if (publicCache && now - publicCache.at < PUBLIC_MEMORY_MS) return publicCache.data;
  if (!collegeQuotaBlocked()) {
    const board = await readBoard();
    if (board) {
      publicCache = { at: Date.now(), data: board };
      return board;
    }
  }
  if (collegeQuotaBlocked()) return publicCache?.data ?? null;
  const fresh = await loadCollegeCloud({ gallery: opts.gallery !== false, photos: false });
  if (fresh && fresh.volunteers.length >= 20) {
    publicCache = { at: Date.now(), data: fresh };
    void writeBoard(fresh).catch(() => undefined);
  }
  return fresh && fresh.volunteers.length > 0 ? fresh : publicCache?.data ?? null;
}

export async function loadOfficerRoll(): Promise<CloudPortal | null> {
  if (officerCache && Date.now() - officerCache.at < CLOUD_FRESH_MS) return officerCache.data;
  const board = await loadPublicBoard({ gallery: false });
  if (board && board.volunteers.length >= 20 && !collegeQuotaBlocked()) {
    try {
      const students = await listCollection("students", { photos: false, maxDocs: 400 });
      if (students.length >= 20) {
        const byVid = new Map(students.map((s) => [text(s.volunteerId).toLowerCase(), s]));
        const byName = new Map(students.map((s) => [text(s.fullName).toLowerCase(), s]));
        const volunteers = board.volunteers.map((v) => {
          const raw = byVid.get(v.volunteerId.toLowerCase()) || byName.get(v.fullName.toLowerCase());
          if (!raw) return v;
          const mobile = digits(raw.mobile);
          return {
            ...v,
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
        const merged = { ...board, volunteers };
        officerCache = { at: Date.now(), data: merged };
        return merged;
      }
    } catch (error) {
      if (!collegeQuotaBlocked() && !(error instanceof Error && /busy|quota|429/i.test(error.message))) throw error;
    }
  }
  if (board && board.volunteers.length >= 20) return board;
  if (collegeQuotaBlocked()) return board;
  try {
    const full = await loadCollegeCloud({ gallery: false, photos: false });
    if (full && full.volunteers.length >= 20) {
      officerCache = { at: Date.now(), data: full };
      void writeBoard(full).catch(() => undefined);
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

let brandCache: { at: number; value: { poPhoto: string; principalPhoto: string } } | null = null;

export async function readBrandPhotos() {
  if (brandCache && Date.now() - brandCache.at < CLOUD_FRESH_MS) return brandCache.value;
  if (collegeQuotaBlocked()) return brandCache?.value ?? { poPhoto: "", principalPhoto: "" };
  try {
    const doc = await getDocument("portalSettings/brand");
    const value = {
      poPhoto: safePhoto(doc?.poPhoto),
      principalPhoto: safePhoto(doc?.principalPhoto),
    };
    brandCache = { at: Date.now(), value };
    return value;
  } catch {
    return brandCache?.value ?? { poPhoto: "", principalPhoto: "" };
  }
}

export async function saveBrandPhotos(patch: { poPhoto?: string; principalPhoto?: string }) {
  const current = await readBrandPhotos();
  const poPhoto = patch.poPhoto !== undefined ? safePhoto(patch.poPhoto) : current.poPhoto;
  const principalPhoto = patch.principalPhoto !== undefined ? safePhoto(patch.principalPhoto) : current.principalPhoto;
  const fields = {
    poPhoto: encodeValue(poPhoto),
    principalPhoto: encodeValue(principalPhoto),
    updatedAt: encodeValue(new Date().toISOString()),
  };
  const patchRes = await fetch(`${FIRESTORE_BASE}/portalSettings/brand`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (patchRes.ok) return { poPhoto, principalPhoto };
  const createRes = await fetch(`${FIRESTORE_BASE}/portalSettings?documentId=brand`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!createRes.ok) throw new Error("Could not save the photographs.");
  return { poPhoto, principalPhoto };
}

let rosterCache: { at: number; rows: { docId: string; volunteerId: string; name: string }[] } | null = null;
let rosterInflight: Promise<{ docId: string; volunteerId: string; name: string }[]> | null = null;

export async function listPhotoRoster() {
  if (collegeQuotaBlocked()) return rosterCache?.rows ?? [];
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
  const live = docs.filter((row) => text(row.status).toLowerCase() !== "deleted");
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
  await Promise.all(docIds.slice(0, 4).map(async (docId) => {
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

export async function patchStudent(docId: string, values: Record<string, unknown>) {
  invalidateCollegeCache();
  rosterCache = null;
  const id = text(docId);
  if (!id) throw new Error("Student record was not found.");
  const fields: Record<string, unknown> = {};
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    fields[key] = encodeValue(value);
    params.append("updateMask.fieldPaths", key);
  }
  const res = await fetch(`${FIRESTORE_BASE}/students/${encodeURIComponent(id)}?${params}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 180) || "Could not update the student record");
  }
  void markBoardStale();
}

export async function saveStudentToCloud(input: Record<string, unknown>) {
  invalidateCollegeCache();
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
    mobile: encodeValue(mobile),
    email: encodeValue(input.email),
    course: encodeValue(input.course),
    semester: encodeValue(semester),
    unit: encodeValue(unit),
    volunteerId: encodeValue(volunteerId),
    enrollment: encodeValue(enrollment),
    nssRole: encodeValue("Volunteer"),
    status: encodeValue("active"),
    fatherName: encodeValue(input.fatherName),
    dob: encodeValue(input.dob),
    gender: encodeValue(input.gender),
    bloodGroup: encodeValue(input.bloodGroup),
    address: encodeValue(input.address),
    parentMobile: encodeValue(input.parentMobile),
    emergencyContact: encodeValue(input.emergencyContact),
    abcId: encodeValue(input.abcId),
    myBharatId: encodeValue(input.myBharatId),
    createdAt: encodeValue(now.slice(0, 10)),
    updatedAt: encodeValue(now),
  };
  const photo = safePhoto(input.photoUrl);
  if (photo) fields.photoUrl = encodeValue(photo);
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

export async function readVisitorCount(): Promise<number> {
  try {
    const doc = await getDocument("portalSettings/visitors");
    return Number(doc?.count ?? 0);
  } catch {
    return 0;
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
  const existing = await getDocument("portalSettings/visitors");
  const current = Number(existing?.count ?? 0);
  if (!existing || current < 1) {
    await fetch(`${FIRESTORE_BASE}/portalSettings?documentId=visitors`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fields: {
          count: encodeValue(1361),
          updatedAt: encodeValue(new Date().toISOString()),
        },
      }),
    });
  }
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
  if (!res.ok) return current > 0 ? current : 0;
  const json = (await res.json()) as { writeResults?: { transformResults?: { integerValue?: string }[] }[] };
  const value = Number(json.writeResults?.[0]?.transformResults?.[0]?.integerValue ?? 0);
  return value || (current > 0 ? current + 1 : 1362);
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
    const data = await loadCollegeCloud({ gallery: false, photos: false });
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
    studentMobile: encodeValue(phone),
    mobile: encodeValue(phone),
    studentName: encodeValue(input.name),
    name: encodeValue(input.name),
    date: encodeValue(input.date || new Date().toISOString().slice(0, 10)),
    updatedAt: encodeValue(new Date().toISOString()),
  };
  const body = JSON.stringify({ fields });
  const patch = await fetch(`${FIRESTORE_BASE}/attendance/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body,
  });
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
export type ChatRow = { id: string; threadId: string; text: string; senderId: string; senderName: string; createdAt: string };

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
  await createDocument("notices", pass.token, {
    kind: "chat-auth",
    title: "NSS_CHAT_AUTH",
    senderId: pass.senderId,
    senderName: pass.senderName,
    role: pass.role,
    unit: pass.unit,
    docId: pass.docId,
    createdAt: new Date().toISOString(),
  });
}

export async function readChatPass(token: string) {
  if (!/^[a-f0-9]{32,64}$/.test(token)) return null;
  const row = await getDocument(`notices/${token}`);
  if (!row || text(row.kind) !== "chat-auth" || !text(row.senderId)) return null;
  return {
    id: text(row.senderId),
    name: text(row.senderName) || "NSS",
    role: text(row.role) || "volunteer",
    unit: text(row.unit),
    docId: text(row.docId),
  };
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
        const mobile = digits(s.mobile).slice(-10);
        if (mobile.length === 10) person.mobile = mobile;
      }
      return person;
    })
    .filter((person) => person.name);
  if (rows.length) peopleCache = { at: Date.now(), key, rows };
  return rows;
}

let chatCache: { at: number; rows: ChatRow[] } | null = null;

export async function listRecentChatMessages(limit = 80): Promise<ChatRow[]> {
  if (chatCache && Date.now() - chatCache.at < 3 * 60 * 1000) return chatCache.rows.slice(-limit);
  if (collegeQuotaBlocked()) return chatCache?.rows.slice(-limit) ?? [];
  const mapRows = (docs: Record<string, unknown>[]) =>
    docs
      .filter((row) => text(row.kind) === "chat" && text(row.threadId) && text(row.text))
      .map((row) => ({
        id: text(row._id),
        threadId: text(row.threadId),
        text: text(row.text).slice(0, 1000),
        senderId: text(row.senderId),
        senderName: text(row.senderName).slice(0, 80),
        createdAt: text(row.createdAt),
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit);
  try {
    const ordered = await runQuery({
      from: [{ collectionId: "notices" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "kind" },
          op: "EQUAL",
          value: { stringValue: "chat" },
        },
      },
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit,
    });
    const docs = ordered ?? (await runQuery({
      from: [{ collectionId: "notices" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "kind" },
          op: "EQUAL",
          value: { stringValue: "chat" },
        },
      },
      limit,
    })) ?? [];
    const rows = mapRows(docs);
    if (rows.length) chatCache = { at: Date.now(), rows };
    return rows.length ? rows : chatCache?.rows.slice(-limit) ?? [];
  } catch {
    return chatCache?.rows.slice(-limit) ?? [];
  }
}

export async function saveChatMessage(input: { threadId: string; text: string; senderId: string; senderName: string }) {
  const createdAt = new Date().toISOString();
  const id = `chat${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await createDocument("notices", id, {
    kind: "chat",
    title: "NSS_CHAT_INTERNAL",
    threadId: input.threadId,
    text: input.text.slice(0, 1000),
    senderId: input.senderId,
    senderName: input.senderName.slice(0, 80),
    createdAt,
  });
  chatCache = null;
  return { id, ...input, text: input.text.slice(0, 1000), createdAt };
}
