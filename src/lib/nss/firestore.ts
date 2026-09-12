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
  "createdAt",
  "updatedAt",
];

function collectionUrl(name: string, token?: string) {
  const params = new URLSearchParams({ pageSize: "300" });
  if (token) params.set("pageToken", token);
  if (name === "students") {
    for (const field of STUDENT_FIELDS) params.append("mask.fieldPaths", field);
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

async function listCollection(name: string) {
  const docs: Record<string, unknown>[] = [];
  let url: string | "" = collectionUrl(name);
  while (url) {
    const res = await fetch(url);
    if (!res.ok) break;
    const json = (await res.json()) as {
      documents?: { name?: string; fields?: Record<string, FsValue> }[];
      nextPageToken?: string;
    };
    for (const doc of json.documents ?? []) docs.push(decodeDoc(doc));
    url = json.nextPageToken ? collectionUrl(name, json.nextPageToken) : "";
  }
  return docs;
}

async function getDocument(path: string) {
  const res = await fetch(`${FIRESTORE_BASE}/${path}`);
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
  if (/બી\.?\s*કોમ|b\.?\s*com/i.test(raw)) return "B.Com.";
  if (/બી\.?\s*એ|b\.?\s*a\b/i.test(raw)) return "B.A.";
  if (/બી\.?\s*એસ|b\.?\s*sc/i.test(raw)) return "B.Sc.";
  return raw || "B.Com.";
}

export type CloudPortal = Pick<
  PortalState,
  "volunteers" | "events" | "attendance" | "notices" | "gallery" | "visitors"
> & { alumniCount: number; serviceHours: number };

export async function loadCollegeCloud(opts: { gallery?: boolean } = {}): Promise<CloudPortal | null> {
  const [students, eventDocs, noticeDocs, attendanceDocs, galleryDocs, stats, visitorsDoc] =
    await Promise.all([
      listCollection("students"),
      listCollection("events"),
      listCollection("notices"),
      listCollection("attendance"),
      opts.gallery === false ? Promise.resolve([]) : listCollection("gallery"),
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

  const volunteers: Volunteer[] = sorted.map((s, index) => {
    const n = index + 1;
    const semester = latinDigits(text(s.semester) || "1");
    const mobileDigits = mobileKey(s.mobile) || mobileKey(s._id);
    const mobile = mobileDigits.length >= 10 ? mobileDigits : latinDigits(text(s.mobile));
    const role = /leader/i.test(text(s.nssRole)) ? "Leader" : "Volunteer";
    const statusRaw = text(s.status).toLowerCase();
    const roleRaw = text(s.nssRole).toLowerCase();
    const isAlumni = statusRaw === "alumni" || roleRaw === "alumni";
    const assembled = [s.firstName, s.middleName, s.surname].map(text).filter(Boolean).join(" ");
    const fullName = titleFirstName(cleanPersonName(text(s.fullName) || assembled));
    return {
      id: text(s._id) || `vol-${n}`,
      volunteerId: `NSS${padId(n)}`,
      enrollment: latinDigits(text(s.enrollment)) || `2026-${semester}-${padId(n)}`,
      fullName,
      mobile,
      email: text(s.email),
      course: normalizeCourse(s.course) as Volunteer["course"],
      semester,
      unit: index % 2 === 0 ? "Unit 1" : "Unit 2",
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
    return {
      id: text(e._id) || `evt-${name}-${date}`,
      name,
      date,
      location: text(e.location) || "Mansa",
      hours: Number(e.hours) > 0 ? Number(e.hours) : 4,
      status: statusRaw === "upcoming" || statusRaw === "planning" ? "upcoming" : "completed",
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

  const notices: Notice[] = noticeDocs.map((n) => {
    const body = text(n.text) || text(n.body);
    const title = text(n.title) || "Notice";
    const leaders = /leader/i.test(`${title} ${body}`);
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

  return {
    volunteers,
    events,
    attendance,
    notices,
    gallery,
    visitors: Number(visitorsDoc?.count ?? 0),
    alumniCount,
    serviceHours: Number(stats?.serviceHours ?? 0),
  };
}
