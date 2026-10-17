import { createFileRoute } from "@tanstack/react-router";
import { loadCollegeCloud, saveStudentToCloud, incrementVisitors, patchStudent, safePhoto } from "@/lib/nss/firestore";

type Row = Record<string, unknown>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function digits(value: unknown) {
  return text(value).replace(/\D/g, "");
}

function looksLikePhoneId(value: string) {
  const raw = text(value);
  if (raw.startsWith("+")) return true;
  return digits(raw).length >= 8;
}

function publicId(row: Row) {
  const rawId = text(row.id);
  const vid = text(row.volunteerId);
  if (/^NSS\d+$/i.test(vid) && looksLikePhoneId(rawId)) return vid;
  const phone = digits(row.mobile);
  const rawDigits = digits(rawId);
  const idIsPhone =
    rawDigits.length >= 8 &&
    Boolean(phone) &&
    (rawDigits === phone || phone.endsWith(rawDigits) || rawDigits.endsWith(phone));
  return idIsPhone ? vid || rawId : rawId || vid;
}

function publicVolunteer(row: Row) {
  return {
    id: publicId(row),
    volunteerId: text(row.volunteerId),
    enrollment: text(row.enrollment),
    fullName: text(row.fullName),
    mobile: "",
    email: "",
    course: text(row.course),
    semester: text(row.semester),
    unit: text(row.unit) === "Unit 2" ? "Unit 2" : "Unit 1",
    nssRole: /leader/i.test(text(row.nssRole)) ? "Leader" : "Volunteer",
    fatherName: "",
    dob: text(row.dob),
    gender: text(row.gender) === "Female" || text(row.gender) === "Male" || text(row.gender) === "Other" ? text(row.gender) : "",
    bloodGroup: "",
    address: "",
    parentMobile: "",
    photoUrl: safePhoto(row.photoUrl),
    status: text(row.status) === "alumni" ? "alumni" : "active",
    createdAt: text(row.createdAt),
  };
}

function officerVolunteer(row: Row) {
  return {
    ...publicVolunteer(row),
    mobile: digits(row.mobile),
    email: text(row.email),
    fatherName: text(row.fatherName),
    address: text(row.address),
    bloodGroup: text(row.bloodGroup),
    parentMobile: text(row.parentMobile),
    emergencyContact: text(row.emergencyContact),
    abcId: text(row.abcId),
    myBharatId: text(row.myBharatId),
  };
}

function selfVolunteer(row: Row) {
  return {
    ...publicVolunteer(row),
    mobile: digits(row.mobile),
    email: text(row.email),
    fatherName: text(row.fatherName),
    address: text(row.address),
    bloodGroup: text(row.bloodGroup),
    parentMobile: text(row.parentMobile),
    emergencyContact: text(row.emergencyContact),
    abcId: text(row.abcId),
    myBharatId: text(row.myBharatId),
  };
}

function publicAttendance(volunteers: Row[], attendance: Row[]) {
  const idMap = new Map<string, string>();
  for (const row of volunteers) {
    const pub = publicId(row);
    if (text(row.id)) idMap.set(text(row.id), pub);
    const phone = digits(row.mobile);
    if (phone) idMap.set(phone, pub);
    if (text(row.volunteerId)) idMap.set(text(row.volunteerId), pub);
  }
  return attendance
    .map((row) => {
      const volunteerId = idMap.get(text(row.volunteerId)) || "";
      return {
        volunteerId,
        eventId: text(row.eventId),
        present: row.present === true,
      };
    })
    .filter((row) => row.volunteerId && row.eventId && !looksLikePhoneId(row.volunteerId));
}

function publicPayload(data: Row, includeGallery: boolean) {
  const volunteers = Array.isArray(data.volunteers) ? (data.volunteers as Row[]) : [];
  const attendance = Array.isArray(data.attendance) ? (data.attendance as Row[]) : [];
  return {
    ok: true,
    volunteers: volunteers.map((row) => publicVolunteer(row)),
    events: data.events ?? [],
    notices: data.notices ?? [],
    attendance: publicAttendance(volunteers, attendance),
    gallery: includeGallery ? data.gallery ?? [] : [],
    visitors: data.visitors ?? 0,
    alumniCount: data.alumniCount ?? 0,
    serviceHours: data.serviceHours ?? 0,
  };
}

function matchVolunteer(volunteers: Row[], username: string, password: string) {
  const key = username.trim().toLowerCase();
  const keyDigits = digits(username);
  const passDigits = digits(password);
  return volunteers.find((row) => {
    const name = text(row.fullName).toLowerCase();
    const first = name.split(/\s+/)[0] ?? "";
    const id = text(row.volunteerId).toLowerCase();
    const phone = digits(row.mobile);
    const userOk =
      first === key ||
      name === key ||
      id === key ||
      (keyDigits.length >= 8 && phone.endsWith(keyDigits));
    const stored = text(row.loginPassword);
    const passOk =
      (stored !== "" && stored === password.trim()) ||
      (passDigits.length >= 10 && phone.endsWith(passDigits));
    return userOk && passOk;
  });
}

export const Route = createFileRoute("/api/nss-cloud")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const includeGallery = new URL(request.url).searchParams.get("gallery") === "1";
          const data = await loadCollegeCloud({ gallery: includeGallery });
          if (!data) return Response.json({ ok: false }, { status: 404 });
          return Response.json(publicPayload(data as unknown as Row, includeGallery));
        } catch (error) {
          const message = error instanceof Error ? error.message : "cloud load failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            username?: string;
            password?: string;
            role?: string;
            mobile?: string;
            next?: string;
            volunteerId?: string;
            photoUrl?: string;
            email?: string;
            address?: string;
            bloodGroup?: string;
            abcId?: string;
            myBharatId?: string;
            emergencyContact?: string;
            fatherName?: string;
          };
          if (body.action === "visit") {
            const visitors = await incrementVisitors();
            return Response.json({ ok: true, visitors });
          }
          if (body.action === "register") {
            const saved = await saveStudentToCloud(body as Record<string, unknown>);
            return Response.json(saved);
          }
          if (body.action === "set-password" || body.action === "update-profile") {
            const data = await loadCollegeCloud({ gallery: false });
            const volunteers = (data?.volunteers ?? []) as unknown as Row[];
            const found = matchVolunteer(volunteers, body.username ?? body.volunteerId ?? "", body.password ?? "");
            if (!found) return Response.json({ ok: false, error: "Username or mobile password did not match." }, { status: 401 });
            if (body.action === "set-password") {
              const next = text(body.next);
              if (next.length < 6) {
                return Response.json({ ok: false, error: "New password must be at least 6 characters." }, { status: 400 });
              }
              await patchStudent(text(found.id), {
                password: next,
                passwordHasBeenChanged: true,
                updatedAt: new Date().toISOString(),
              });
              return Response.json({ ok: true });
            }
            const photo = text(body.photoUrl);
            if (photo && (!photo.startsWith("data:image/") || photo.length >= 120000)) {
              return Response.json({ ok: false, error: "Photograph is too large. Use a smaller JPG or PNG." }, { status: 400 });
            }
            const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
            for (const key of ["email", "address", "bloodGroup", "abcId", "myBharatId", "emergencyContact", "fatherName"] as const) {
              if (typeof body[key] === "string") patch[key] = text(body[key]);
            }
            if (photo) patch.photoUrl = photo;
            await patchStudent(text(found.id), patch);
            return Response.json({ ok: true, volunteer: selfVolunteer({ ...found, ...patch }) });
          }
          if (body.action === "lookup") {
            const data = await loadCollegeCloud({ gallery: false });
            const want = digits(body.mobile);
            const found = (data?.volunteers ?? []).find((row) => digits(row.mobile).endsWith(want) && want.length >= 10);
            if (!found) return Response.json({ ok: false, error: "This mobile is not on the NSS roll." }, { status: 404 });
            const first = text(found.fullName).split(/\s+/)[0] ?? "";
            return Response.json({ ok: true, username: first.toUpperCase() });
          }
          if (body.action === "staff-login") {
            const { staffSession } = await import("@/lib/nss/staff-auth.server");
            const data = await loadCollegeCloud({ gallery: false });
            const session = staffSession(body.role || "po", body.username ?? "", body.password ?? "", "Dr. Hareshkumar I. Prajapati");
            if (!session) {
              return Response.json({ ok: false, error: "Invalid staff username or password." }, { status: 401 });
            }
            const volunteers = ((data?.volunteers ?? []) as unknown as Row[]).map((row) => officerVolunteer(row));
            const attendance = publicAttendance((data?.volunteers ?? []) as unknown as Row[], (data?.attendance ?? []) as unknown as Row[]);
            return Response.json({
              ok: true,
              session,
              volunteers,
              attendance,
              events: data?.events ?? [],
              serviceHours: data?.serviceHours ?? 0,
            });
          }
          if (body.action !== "login") return Response.json({ ok: false, error: "Unsupported action." }, { status: 400 });
          const data = await loadCollegeCloud({ gallery: false });
          const volunteers = (data?.volunteers ?? []) as unknown as Row[];
          const found = matchVolunteer(volunteers, body.username ?? "", body.password ?? "");
          if (!found) return Response.json({ ok: false, error: "Username or mobile password did not match." }, { status: 401 });
          const role = text(found.nssRole) === "Leader" ? "leader" : "volunteer";
          const volunteer = selfVolunteer(found);
          return Response.json({
            ok: true,
            session: {
              role,
              name: text(found.fullName),
              volunteerId: volunteer.id,
              enrollment: text(found.enrollment),
              mobile: digits(found.mobile),
            },
            volunteer,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "request failed";
          const status = /already on the NSS roll/i.test(message) ? 409 : 500;
          return Response.json({ ok: false, error: message }, { status });
        }
      },
    },
  },
});
