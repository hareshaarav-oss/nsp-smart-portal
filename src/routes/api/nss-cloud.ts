import { createFileRoute } from "@tanstack/react-router";
import { loadCollegeCloud, saveStudentToCloud, incrementVisitors, patchStudent, safePhoto, knownRole, issueChatPass, readChatPass, listRecentChatMessages, saveChatMessage, listChatPeople, clearAttendanceCloud } from "@/lib/nss/firestore";

type Row = Record<string, unknown>;

function appBuild() {
  return process.env.VERCEL_GIT_COMMIT_SHA || "";
}

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
    nssRole: knownRole(row.nssRole),
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
    build: appBuild(),
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

function newChatToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalThread(threadId: string) {
  const id = text(threadId);
  if (!id.startsWith("dm:")) return id;
  const parts = id.slice(3).split(":");
  if (parts.length !== 2) return id;
  return `dm:${[parts[0], parts[1]].sort().join(":")}`;
}

function validThread(threadId: string) {
  if (threadId === "college" || threadId === "unit-1" || threadId === "unit-2" || threadId === "leaders") return true;
  return /^dm:[A-Za-z0-9-]{1,24}:[A-Za-z0-9-]{1,24}$/.test(threadId);
}

function canSeeThread(user: { id: string; role: string; unit: string }, threadId: string) {
  const officer = user.role === "po" || user.role === "admin";
  if (threadId === "college") return true;
  if (threadId === "leaders") return officer || user.role === "leader";
  if (threadId === "unit-1") return officer || user.unit === "Unit 1";
  if (threadId === "unit-2") return officer || user.unit === "Unit 2";
  if (!threadId.startsWith("dm:")) return false;
  const ids = threadId.slice(3).split(":");
  if (officer) return ids.includes("po") || ids.includes("admin");
  return ids.includes(user.id);
}

export const Route = createFileRoute("/api/nss-cloud")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const includeGallery = new URL(request.url).searchParams.get("gallery") === "1";
          const data = await loadCollegeCloud({ gallery: includeGallery });
          if (!data) return Response.json({ ok: false }, { status: 404, headers: { "cache-control": "no-store" } });
          return Response.json(publicPayload(data as unknown as Row, includeGallery), {
            headers: { "cache-control": "no-store" },
          });
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
            chatToken?: string;
            threadId?: string;
            text?: string;
            nssRole?: string;
            status?: string;
            eventName?: string;
          };
          if (body.action === "clear-attendance") {
            const user = await readChatPass(text(body.chatToken));
            if (!user || (user.role !== "po" && user.role !== "admin")) {
              return Response.json({ ok: false, error: "Sign in again as Programme Officer to delete attendance." }, { status: 401 });
            }
            const eventName = text(body.eventName);
            if (!eventName) return Response.json({ ok: false, error: "Choose an event first." }, { status: 400 });
            const result = await clearAttendanceCloud(eventName);
            return Response.json({ ok: true, ...result });
          }
          if (body.action === "visit") {
            const visitors = await incrementVisitors();
            return Response.json({ ok: true, visitors });
          }
          if (body.action === "register") {
            const saved = await saveStudentToCloud({ ...body, nssRole: "Volunteer" });
            return Response.json(saved);
          }
          if (body.action === "chat-sync" || body.action === "chat-send" || body.action === "set-role" || body.action === "set-status") {
            const user = await readChatPass(text(body.chatToken));
            if (!user) return Response.json({ ok: false, error: "Sign in again to use NSS Chat." }, { status: 401 });
            if (body.action === "set-role" || body.action === "set-status") {
              if (user.role !== "po" && user.role !== "admin") {
                return Response.json({ ok: false, error: "Only the Programme Officer can change the roll." }, { status: 403 });
              }
              const data = await loadCollegeCloud({ gallery: false });
              const want = text(body.volunteerId).toLowerCase();
              const target = (data?.volunteers ?? []).find(
                (row) => text(row.volunteerId).toLowerCase() === want || text(row.id).toLowerCase() === want,
              );
              if (!target) return Response.json({ ok: false, error: "Volunteer was not found on the roll." }, { status: 404 });
              if (body.action === "set-role") {
                await patchStudent(text(target.id), { nssRole: knownRole(body.nssRole), updatedAt: new Date().toISOString() });
              } else {
                const status = text(body.status).toLowerCase();
                const next = status === "deleted" ? "deleted" : status === "alumni" ? "alumni" : "active";
                await patchStudent(text(target.id), { status: next, updatedAt: new Date().toISOString() });
              }
              return Response.json({ ok: true });
            }
            if (body.action === "chat-send") {
              const threadId = canonicalThread(text(body.threadId));
              const message = String(body.text ?? "").replace(/\u0000/g, "").trim().slice(0, 1000);
              if (!validThread(threadId) || !canSeeThread(user, threadId)) {
                return Response.json({ ok: false, error: "You cannot send to that chat." }, { status: 403 });
              }
              if (!message) return Response.json({ ok: false, error: "Type a message first." }, { status: 400 });
              const saved = await saveChatMessage({ threadId, text: message, senderId: user.id, senderName: user.name });
              return Response.json({ ok: true, message: saved });
            }
            const messages = (await listRecentChatMessages()).filter((row) => canSeeThread(user, canonicalThread(row.threadId)));
            const officer = user.role === "po" || user.role === "admin";
            const people = await listChatPeople({ includeMobile: officer });
            return Response.json({
              ok: true,
              me: { id: user.id, name: user.name, role: user.role, unit: user.unit },
              people,
              messages,
            });
          }
          if (body.action === "roll-sync") {
            const user = text(body.chatToken) ? await readChatPass(text(body.chatToken)) : null;
            const data = await loadCollegeCloud({ gallery: false, photos: false });
            if (!data) return Response.json({ ok: false }, { status: 404 });
            const officer = user?.role === "po" || user?.role === "admin";
            const rows = (data.volunteers ?? []) as unknown as Row[];
            const volunteers = rows.map((row) => ({ ...(officer ? officerVolunteer(row) : publicVolunteer(row)), photoUrl: "" }));
            const attendance = publicAttendance(rows, (data.attendance ?? []) as unknown as Row[]);
            return Response.json({
              ok: true,
              private: officer,
              volunteers,
              events: data.events,
              attendance,
              notices: data.notices,
              serviceHours: data.serviceHours,
              visitors: data.visitors,
              build: appBuild(),
            });
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
            let chatToken = "";
            try {
              chatToken = newChatToken();
              await issueChatPass({ token: chatToken, senderId: session.role, senderName: session.name, role: session.role, unit: "", docId: "" });
            } catch {
              chatToken = "";
            }
            const volunteers = ((data?.volunteers ?? []) as unknown as Row[]).map((row) => officerVolunteer(row));
            const attendance = publicAttendance((data?.volunteers ?? []) as unknown as Row[], (data?.attendance ?? []) as unknown as Row[]);
            return Response.json({
              ok: true,
              session: { ...session, chatToken },
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
          const role = text(found.nssRole) === "Leader" || knownRole(found.nssRole) !== "Volunteer" ? "leader" : "volunteer";
          const volunteer = selfVolunteer(found);
          let chatToken = "";
          try {
            chatToken = newChatToken();
            await issueChatPass({
              token: chatToken,
              senderId: volunteer.id,
              senderName: text(found.fullName),
              role,
              unit: text(found.unit),
              docId: text(found.id),
            });
          } catch {
            chatToken = "";
          }
          return Response.json({
            ok: true,
            session: {
              role,
              name: text(found.fullName),
              volunteerId: volunteer.id,
              enrollment: text(found.enrollment),
              mobile: digits(found.mobile),
              chatToken,
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
