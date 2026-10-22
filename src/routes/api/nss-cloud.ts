import { loadCollegeCloud, loadPublicBoard, loadOfficerRoll, collegeQuotaBlocked, saveStudentToCloud, incrementVisitors, readVisitorCount, knownVisitorCount, patchStudent, safePhoto, knownRole, issueChatPass, readChatPass, listRecentChatMessages, saveChatMessage, listChatPeople, clearAttendanceCloud, readBrandPhotos, saveBrandPhotos, listPhotoRoster, readPhotoBatch, saveAttendanceMarks, readLive, publishBestVolunteer, publishServiceHours, purgeCloudIds, deleteChatMessages, chatIdsInThread } from "@/lib/nss/firestore";
import { passwordOk } from "@/lib/nss/seal.server";
import { createFileRoute } from "@tanstack/react-router";

type Row = Record<string, unknown>;

function appBuild() {
  return process.env.VERCEL_GIT_COMMIT_SHA || "";
}

function cacheHeaders(seconds: number) {
  return {
    "cache-control": `public, max-age=30, s-maxage=${seconds}`,
    "cdn-cache-control": `public, s-maxage=${seconds}`,
  };
}

function degradedBody() {
  const visitors = knownVisitorCount();
  return {
    ok: true as const,
    degraded: true,
    volunteers: [] as unknown[],
    ...(visitors > 0 ? { visitors } : {}),
    build: appBuild(),
  };
}

function busyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /busy|quota|429/i.test(message);
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
    mpin: text(row.mpin),
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
  const hits = volunteers.filter((row) => {
    const tokens = text(row.fullName)
      .toLowerCase()
      .split(/[^a-z0-9\u0a80-\u0aff]+/i)
      .filter((part) => part.length > 1);
    const id = text(row.volunteerId).toLowerCase();
    const enrollment = text(row.enrollment).toLowerCase();
    const phone = digits(row.mobile);
    const name = text(row.fullName).toLowerCase();
    const compact = name.replace(/[^a-z0-9\u0a80-\u0aff]+/gi, "");
    const compactKey = key.replace(/[^a-z0-9\u0a80-\u0aff]+/gi, "");
    return (
      tokens.includes(key) ||
      name === key ||
      (compactKey.length > 2 && compact === compactKey) ||
      id === key ||
      enrollment === key ||
      (keyDigits.length >= 8 && phone.endsWith(keyDigits))
    );
  });
  if (!hits.length) {
    return { error: "Username not found." };
  }
  const matched = hits.filter((row) => passwordOk(text(row.loginPassword), password, digits(row.mobile)));
  if (matched[0]) return { row: matched[0] };
  return { error: "Wrong password." };
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
  if (threadId === "college" || threadId === "leaders" || threadId === "unit-1" || threadId === "unit-2") return officer;
  if (!threadId.startsWith("dm:")) return false;
  const ids = threadId.slice(3).split(":");
  if (officer) return ids.includes("po") || ids.includes("admin");
  return ids.includes(user.id) && ids.includes("po");
}

function officerRole(user: { role?: string } | null | undefined) {
  return user?.role === "po" || user?.role === "admin";
}

async function signedOfficer(chatToken: unknown) {
  const token = text(chatToken);
  if (!token) return null;
  try {
    const user = await readChatPass(token);
    return officerRole(user) ? user : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/nss-cloud")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const includeGallery = new URL(request.url).searchParams.get("gallery") === "1";
        try {
          const data = await loadPublicBoard({ gallery: includeGallery });
          if (!data || data.volunteers.length < 20) {
            return Response.json(degradedBody(), { headers: cacheHeaders(120) });
          }
          const brand = collegeQuotaBlocked() ? { poPhoto: "", principalPhoto: "" } : await readBrandPhotos();
          return Response.json(
            { ...publicPayload(data as unknown as Row, includeGallery), brand, degraded: false },
            { headers: cacheHeaders(includeGallery ? 120 : 60) },
          );
        } catch (error) {
          if (busyError(error) || collegeQuotaBlocked()) {
            return Response.json(degradedBody(), { headers: cacheHeaders(120) });
          }
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
            name?: string;
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
            mpin?: string;
            chatToken?: string;
            threadId?: string;
            text?: string;
            messageId?: string;
            replyName?: string;
            replyText?: string;
            media?: string;
            mediaType?: string;
            nssRole?: string;
            status?: string;
            eventName?: string;
            poPhoto?: string;
            principalPhoto?: string;
            deskRole?: string;
            all?: boolean;
            unit?: string;
            hours?: number;
            rows?: { mobile?: string; name?: string; eventName?: string; present?: boolean; date?: string }[];
            ids?: string[];
          };
          if (body.action === "student-photo") {
            const roster = await listPhotoRoster();
            const wantId = text(body.volunteerId).toLowerCase();
            const wantName = text(body.name).toLowerCase();
            const found = roster.find(
              (row) =>
                row.docId.toLowerCase() === wantId ||
                row.volunteerId.toLowerCase() === wantId ||
                (wantName.length > 2 && row.name === wantName),
            );
            if (!found) return Response.json({ ok: false, photoUrl: "" });
            const photos = await readPhotoBatch([found.docId]);
            const photoUrl = photos[0]?.photoUrl || "";
            return Response.json({ ok: Boolean(photoUrl), photoUrl });
          }
          if (body.action === "photo-sync") {
            const ids = Array.isArray(body.ids) ? body.ids.map((id) => text(id)).filter(Boolean).slice(0, 8) : [];
            if (ids.length) {
              const photos = await readPhotoBatch(ids);
              return Response.json({ ok: true, photos, build: appBuild() });
            }
            const roster = await listPhotoRoster();
            const brand = await readBrandPhotos().catch(() => ({ poPhoto: "", principalPhoto: "" }));
            const preview = await readPhotoBatch(roster.slice(0, 8).map((row) => row.docId)).catch(() => []);
            return Response.json({ ok: true, roster, photos: preview, brand, build: appBuild() });
          }
          if (body.action === "resume-session") {
            const role = text(body.role);
            if (role === "po" || role === "admin") {
              return Response.json({ ok: false, error: "Sign in again with the Programme Officer password." }, { status: 401 });
            }
            if (role !== "volunteer" && role !== "leader") {
              return Response.json({ ok: false, error: "Open the desk from your saved login." }, { status: 400 });
            }
            const data = await loadCollegeCloud({ gallery: false, photos: false });
            const want = text(body.volunteerId).toLowerCase();
            const found = (data?.volunteers ?? []).find(
              (row) => text(row.volunteerId).toLowerCase() === want || text(row.id).toLowerCase() === want,
            );
            if (!found) return Response.json({ ok: false, error: "Sign in again." }, { status: 401 });
            const actualRole = text(found.nssRole) === "Leader" || knownRole(found.nssRole) !== "Volunteer" ? "leader" : "volunteer";
            const chatToken = newChatToken();
            await issueChatPass({
              token: chatToken,
              senderId: publicId(found as unknown as Row),
              senderName: text(found.fullName) || "NSS",
              role: actualRole,
              unit: text(found.unit),
              docId: text(found.id),
            });
            return Response.json({ ok: true, chatToken });
          }
          if (body.action === "clear-attendance") {
            const officer = await signedOfficer(body.chatToken);
            if (!officer) return Response.json({ ok: false, error: "Open the Programme Officer desk first." }, { status: 403 });
            const result = await clearAttendanceCloud(text(body.eventName), { all: body.all === true || !text(body.eventName) });
            return Response.json({ ok: true, ...result });
          }
          if (body.action === "save-attendance") {
            const officer = await signedOfficer(body.chatToken);
            if (!officer) return Response.json({ ok: false, error: "Open the Programme Officer desk first." }, { status: 403 });
            const rows = Array.isArray(body.rows) ? body.rows : [];
            const saved = await saveAttendanceMarks(
              rows.slice(0, 300).map((row) => ({
                mobile: text(row.mobile),
                name: text(row.name),
                eventName: text(row.eventName),
                present: row.present !== false,
                date: text(row.date),
              })),
            );
            return Response.json({ ok: true, saved });
          }
          if (body.action === "save-brand") {
            const user = await readChatPass(text(body.chatToken));
            if (!user || (user.role !== "po" && user.role !== "admin")) {
              return Response.json({ ok: false, error: "Sign in again to save photographs." }, { status: 401 });
            }
            const saved = await saveBrandPhotos({
              poPhoto: typeof body.poPhoto === "string" ? body.poPhoto : undefined,
              principalPhoto: typeof body.principalPhoto === "string" ? body.principalPhoto : undefined,
            });
            return Response.json({ ok: true, brand: saved });
          }
          if (body.action === "purge") {
            const officer = await signedOfficer(body.chatToken);
            if (!officer) return Response.json({ ok: false, error: "Only the Programme Officer can delete a record." }, { status: 403 });
            const ids = (body.ids ?? []).map((id) => text(id)).filter((id) => id.length > 1).slice(0, 40);
            if (!ids.length) return Response.json({ ok: false, error: "Nothing to delete." }, { status: 400 });
            await purgeCloudIds(ids);
            return Response.json({ ok: true });
          }
          if (body.action === "visit") {
            const visitors = await incrementVisitors();
            return Response.json({ ok: visitors > 0, visitors });
          }
          if (body.action === "visitors") {
            const visitors = await readVisitorCount();
            return Response.json({ ok: visitors > 0, visitors });
          }
          if (body.action === "live") {
            const live = await readLive();
            return Response.json({ ok: Boolean(live), live });
          }
          if (body.action === "live-hours") {
            const officer = await signedOfficer(body.chatToken);
            if (!officer) return Response.json({ ok: false }, { status: 403 });
            const hours = Number(body.hours ?? 0);
            if (hours > 0) await publishServiceHours(hours);
            return Response.json({ ok: true, hours });
          }
          if (body.action === "live-best") {
            const officer = await signedOfficer(body.chatToken);
            if (!officer) return Response.json({ ok: false }, { status: 403 });
            const name = text(body.name);
            if (!name) return Response.json({ ok: false }, { status: 400 });
            await publishBestVolunteer({
              id: text(body.volunteerId),
              volunteerId: text(body.volunteerId),
              fullName: name,
              unit: text(body.unit) === "Unit 2" ? "Unit 2" : "Unit 1",
              hours: Number(body.hours ?? 0),
            });
            return Response.json({ ok: true });
          }
          if (body.action === "register") {
            const saved = await saveStudentToCloud({ ...body, nssRole: "Volunteer" });
            return Response.json(saved);
          }
          if (body.action === "chat-sync" || body.action === "chat-send" || body.action === "chat-delete" || body.action === "chat-clear" || body.action === "set-role" || body.action === "set-status") {
            const user = await readChatPass(text(body.chatToken));
            if (!user) return Response.json({ ok: false, error: "Sign in again to use NSS Chat." }, { status: 401 });
            if (body.action === "set-role" || body.action === "set-status") {
              if (user.role !== "po" && user.role !== "admin") {
                return Response.json({ ok: false, error: "Only the Programme Officer can change the roll." }, { status: 403 });
              }
              const data = await loadCollegeCloud({ gallery: false, photos: false });
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
            if (body.action === "chat-delete" || body.action === "chat-clear") {
              const recent = await listRecentChatMessages(300);
              if (body.action === "chat-delete") {
                const messageId = text(body.messageId);
                const row = recent.find((item) => item.id === messageId);
                if (!row || !canSeeThread(user, canonicalThread(row.threadId))) {
                  return Response.json({ ok: false, error: "That message is not in your chat." }, { status: 404 });
                }
                const officer = user.role === "po" || user.role === "admin";
                if (!officer && row.senderId !== user.id) {
                  return Response.json({ ok: false, error: "You can delete only your own message." }, { status: 403 });
                }
                await deleteChatMessages([messageId]);
                return Response.json({ ok: true, removed: [messageId] });
              }
              const threadId = canonicalThread(text(body.threadId));
              if (!validThread(threadId) || !canSeeThread(user, threadId)) {
                return Response.json({ ok: false, error: "You cannot clear that chat." }, { status: 403 });
              }
              const ids = await chatIdsInThread(threadId);
              await deleteChatMessages(ids);
              return Response.json({ ok: true, removed: ids });
            }
            if (body.action === "chat-send") {
              const threadId = canonicalThread(text(body.threadId));
              const message = String(body.text ?? "").split("\u0000").join("").trim().slice(0, 1000);
              const mediaType = body.mediaType === "video" ? "video" : body.mediaType === "image" ? "image" : "";
              const rawMedia = typeof body.media === "string" ? body.media.trim() : "";
              const mediaOk =
                (mediaType === "image" && rawMedia.startsWith("data:image/") && rawMedia.length < 700000) ||
                (mediaType === "video" && rawMedia.startsWith("data:video/") && rawMedia.length < 700000);
              if (rawMedia && !mediaOk) return Response.json({ ok: false, error: "That photo or video is too large." }, { status: 400 });
              if (!validThread(threadId) || !canSeeThread(user, threadId)) {
                return Response.json({ ok: false, error: "You cannot send to that chat." }, { status: 403 });
              }
              if (!message && !mediaOk) return Response.json({ ok: false, error: "Type a message first." }, { status: 400 });
              const saved = await saveChatMessage({
                threadId,
                text: message,
                senderId: user.id,
                senderName: user.name,
                replyName: text(body.replyName).slice(0, 80),
                replyText: text(body.replyText).slice(0, 140),
                media: mediaOk ? rawMedia : "",
                mediaType: mediaOk ? mediaType : "",
              });
              return Response.json({ ok: true, message: saved });
            }
            const messages = (await listRecentChatMessages()).filter((row) => canSeeThread(user, canonicalThread(row.threadId)));
            const officer = user.role === "po" || user.role === "admin";
            const people = officer ? await listChatPeople({ includeMobile: false }) : [];
            return Response.json({
              ok: true,
              me: { id: user.id, name: user.name, role: user.role, unit: user.unit },
              people,
              messages,
            });
          }
          if (body.action === "roll-sync") {
            let user: Awaited<ReturnType<typeof readChatPass>> | null = null;
            try {
              user = text(body.chatToken) ? await readChatPass(text(body.chatToken)) : null;
            } catch {
              user = null;
            }
            let data: Awaited<ReturnType<typeof loadCollegeCloud>> = null;
            try {
              const officer = user?.role === "po" || user?.role === "admin";
              data = officer ? await loadOfficerRoll() : await loadPublicBoard({ gallery: false });
            } catch (error) {
              if (!busyError(error)) throw error;
            }
            if (!data || data.volunteers.length < 20) {
              return Response.json({
                ok: true,
                degraded: true,
                volunteers: [],
                ...(data && data.serviceHours > 0 ? { serviceHours: data.serviceHours } : {}),
                ...(data && data.visitors > 0 ? { visitors: data.visitors } : {}),
                build: appBuild(),
              });
            }
            const officer = user?.role === "po" || user?.role === "admin";
            const rows = (data.volunteers ?? []) as unknown as Row[];
            const volunteers = rows.map((row) => {
              const shaped = officer ? officerVolunteer(row) : publicVolunteer(row);
              return { ...shaped, photoUrl: undefined };
            });
            const attendance = publicAttendance(rows, (data.attendance ?? []) as unknown as Row[]);
            const brand = await readBrandPhotos();
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
              brand,
            });
          }
          if (body.action === "reset-password") {
            const data = await loadCollegeCloud({ gallery: false, photos: false });
            const volunteers = (data?.volunteers ?? []) as unknown as Row[];
            const want = digits(body.mobile);
            const name = text(body.username).toLowerCase();
            const found = volunteers.find(
              (row) =>
                want.length >= 10 &&
                digits(row.mobile).endsWith(want) &&
                text(row.fullName).toLowerCase().split(/\s+/)[0] === name,
            );
            if (!found) return Response.json({ ok: false, error: "No matching student." }, { status: 404 });
            await patchStudent(text(found.id), {
              password: digits(found.mobile),
              passwordHasBeenChanged: false,
              updatedAt: new Date().toISOString(),
            });
            return Response.json({ ok: true });
          }
          if (body.action === "set-password" || body.action === "update-profile") {
            const data = await loadCollegeCloud({ gallery: false, photos: false });
            const volunteers = (data?.volunteers ?? []) as unknown as Row[];
            const matched = matchVolunteer(volunteers, body.username ?? body.volunteerId ?? "", body.password ?? "");
            if (!matched.row) return Response.json({ ok: false, error: matched.error }, { status: 401 });
            const found = matched.row;
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
            if (photo && (!photo.startsWith("data:image/") || photo.length >= 1200000)) {
              return Response.json({ ok: false, error: "Photograph is too large. Use a smaller JPG or PNG." }, { status: 400 });
            }
            const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
            for (const key of ["email", "address", "bloodGroup", "abcId", "myBharatId", "emergencyContact", "fatherName"] as const) {
              if (typeof body[key] === "string") patch[key] = text(body[key]);
            }
            if (typeof body.mobile === "string" && digits(body.mobile)) {
              const next = digits(body.mobile).slice(-10);
              if (next.length < 10) {
                return Response.json({ ok: false, error: "Mobile must be 10 digits." }, { status: 400 });
              }
              const clash = volunteers.find(
                (row) => digits(row.mobile).slice(-10) === next && text(row.id) !== text(found.id),
              );
              if (clash) {
                return Response.json({ ok: false, error: "This mobile number is already on the NSS roll." }, { status: 409 });
              }
              patch.mobile = next;
            }
            if (typeof body.mpin === "string" && text(body.mpin)) {
              const pin = text(body.mpin);
              if (!/^\d{4}$/.test(pin)) {
                return Response.json({ ok: false, error: "MPIN must be 4 digits." }, { status: 400 });
              }
              patch.mpin = pin;
            }
            if (photo) patch.photoUrl = photo;
            await patchStudent(text(found.id), patch);
            return Response.json({ ok: true, volunteer: selfVolunteer({ ...found, ...patch }) });
          }
          if (body.action === "lookup") {
            const data = await loadCollegeCloud({ gallery: false, photos: false });
            const want = digits(body.mobile);
            const found = (data?.volunteers ?? []).find((row) => digits(row.mobile).endsWith(want) && want.length >= 10);
            if (!found) return Response.json({ ok: false, error: "This mobile is not on the NSS roll." }, { status: 404 });
            const first = text(found.fullName).split(/\s+/)[0] ?? "";
            return Response.json({ ok: true, username: first.toUpperCase() });
          }
          if (body.action === "staff-login") {
            const { staffSession } = await import("@/lib/nss/staff-auth.server");
            let data: Awaited<ReturnType<typeof loadCollegeCloud>> = null;
            try {
              data = await loadCollegeCloud({ gallery: false, photos: false });
            } catch {
              data = null;
            }
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
          const data = await loadCollegeCloud({ gallery: false, photos: false });
          const volunteers = (data?.volunteers ?? []) as unknown as Row[];
          if (!data || volunteers.length === 0) {
            return Response.json({ ok: false, error: "The college roll is busy. Wait a moment and sign in again." }, { status: 503 });
          }
          const matched = matchVolunteer(volunteers, body.username ?? "", body.password ?? "");
          if (!matched.row) return Response.json({ ok: false, error: matched.error }, { status: 401 });
          const found = matched.row;
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
          const status = /already on the NSS roll/i.test(message) ? 409 : /busy|quota|429/i.test(message) ? 503 : 500;
          return Response.json({ ok: false, error: message }, { status });
        }
      },
    },
  },
});
