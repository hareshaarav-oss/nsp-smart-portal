import { loadCollegeCloud, loadStudentRoll, readOneStudent, loadPublicBoard, loadOfficerRoll, collegeQuotaBlocked, saveStudentToCloud, incrementVisitors, readVisitorCount, knownVisitorCount, patchStudent, safePhoto, knownRole, readChatPass, listRecentChatMessages, saveChatMessage, listChatPeople, clearAttendanceCloud, readBrandPhotos, saveBrandPhotos, listPhotoRoster, readPhotoBatch, saveAttendanceMarks, readLive, publishBestVolunteer, publishServiceHours, purgeCloudIds, deleteChatMessages, readChatMedia, readOneChat, patchNotice, upsertNotice, sideDocId, listChatStatuses, readSide, readStudentCerts, saveStudentCerts, markChatRead, chatReads, markThreadCleared, reviseChatMessage, chatBlocked, readHomeSlides, type ChatExtra } from "@/lib/nss/firestore";
import { passwordOk, sealText, signChatPass } from "@/lib/nss/seal.server";
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

async function studentRows() {
  const volunteers = await loadStudentRoll();
  return (volunteers ?? []) as unknown as Row[];
}

function phoneId(value: unknown) {
  const d = digits(value);
  return d.length >= 10 ? d.slice(-10) : "";
}

async function locateOwnStudent(body: { docId?: string; volunteerId?: string; username?: string; password?: string; mobile?: string }) {
  const password = text(body.password);
  const ids = [text(body.docId), phoneId(body.password), phoneId(body.mobile), text(body.volunteerId), text(body.username)].filter(
    (id, index, list) => id.length > 2 && list.indexOf(id) === index,
  );
  let busy = false;
  for (const id of ids) {
    try {
      const row = await readOneStudent(id);
      if (!row) continue;
      if (passwordOk(text(row.loginPassword), password, digits(row.mobile))) return { row: row as unknown as Row };
    } catch (error) {
      if (busyError(error) || collegeQuotaBlocked()) {
        busy = true;
        break;
      }
      throw error;
    }
  }
  if (!busy && !collegeQuotaBlocked()) {
    const matched = matchVolunteer(await studentRows(), body.username ?? body.volunteerId ?? "", password);
    if (matched.row) return { row: matched.row };
    if (matched.error) return { error: matched.error };
  }
  const blindId = phoneId(body.docId) || phoneId(body.password) || phoneId(body.mobile);
  if (busy && blindId) return { blindId };
  return { error: busy ? "The college register is busy. Try again in a little while." : "Username not found." };
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

function cardPhoto(value: unknown) {
  const src = text(value);
  if (src.startsWith("data:image/") && src.length > 80 && src.length < 8000) return src;
  if (src.startsWith("https://") && src.length < 8000) return src;
  return "";
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
    webauthnId: text(row.webauthnId),
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

function usernameHits(volunteers: Row[], username: string) {
  const key = username.trim().toLowerCase();
  const keyDigits = digits(username);
  return volunteers.filter((row) => {
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
}

function matchVolunteer(volunteers: Row[], username: string, password: string) {
  const hits = usernameHits(volunteers, username);
  if (!hits.length) {
    return { error: "Username not found." };
  }
  const matched = hits.filter((row) => passwordOk(text(row.loginPassword), password, digits(row.mobile)));
  if (matched[0]) return { row: matched[0] };
  return { error: "Wrong password." };
}

function matchMpin(volunteers: Row[], username: string, mpin: string) {
  const pin = text(mpin);
  if (!/^\d{4}$/.test(pin)) return { error: "MPIN must be 4 digits." };
  const hits = usernameHits(volunteers, username);
  if (!hits.length) return { error: "Username not found." };
  const matched = hits.filter((row) => text(row.mpin) === pin);
  if (matched[0]) return { row: matched[0] };
  return { error: "MPIN does not match. Set a 4-digit MPIN from the student dashboard." };
}

function wireCert(raw: unknown) {
  const row = raw && typeof raw === "object" ? (raw as Row) : null;
  if (!row) return null;
  const id = text(row.id);
  const eventId = text(row.eventId);
  const volunteerId = text(row.volunteerId);
  if (!id || !eventId || !volunteerId) return null;
  return {
    id,
    volunteerId,
    eventId,
    generatedAt: text(row.generatedAt),
    sentAt: text(row.sentAt) || new Date().toISOString(),
    certificateId: text(row.certificateId),
    printReady: true,
  };
}

async function studentLoginResponse(found: Row) {
  const role = text(found.nssRole) === "Leader" || knownRole(found.nssRole) !== "Volunteer" ? "leader" : "volunteer";
  const volunteer = selfVolunteer(found);
  let chatToken = "";
  try {
    chatToken = signChatPass({
      id: volunteer.id,
      name: text(found.fullName) || "NSS",
      role,
      unit: text(found.unit),
      docId: text(found.id),
    });
  } catch {
    chatToken = "";
  }
  let certificates: unknown[] = [];
  try {
    certificates = await readStudentCerts(text(found.id));
  } catch {
    certificates = [];
  }
  return {
    ok: true as const,
    session: {
      role,
      name: text(found.fullName),
      volunteerId: volunteer.id,
      enrollment: text(found.enrollment),
      mobile: digits(found.mobile),
      docId: text(found.id),
      chatToken,
    },
    volunteer,
    certificates,
  };
}

function canonicalThread(threadId: string) {
  const id = text(threadId);
  if (!id.startsWith("dm:")) return id;
  const parts = id.slice(3).split(":");
  if (parts.length !== 2) return id;
  return `dm:${[parts[0], parts[1]].sort().join(":")}`;
}

function validThread(threadId: string) {
  if (threadId === "college" || threadId === "unit-1" || threadId === "unit-2" || threadId === "leaders" || threadId === "channel") return true;
  if (/^event:[A-Za-z0-9_-]{4,48}$/.test(threadId)) return true;
  return /^dm:[A-Za-z0-9-]{1,24}:[A-Za-z0-9-]{1,24}$/.test(threadId);
}

function isUnit2(unit: string) {
  return /unit\s*2/i.test(unit);
}

function canSeeThread(user: { id: string; role: string; unit: string }, threadId: string) {
  const officer = user.role === "po" || user.role === "admin";
  if (threadId === "channel" || threadId === "college") return true;
  if (threadId === "leaders") return officer || user.role === "leader";
  if (threadId === "unit-1") return officer || !isUnit2(user.unit);
  if (threadId === "unit-2") return officer || isUnit2(user.unit);
  if (/^event:[A-Za-z0-9_-]{4,48}$/.test(threadId)) return true;
  if (!threadId.startsWith("dm:")) return false;
  const ids = threadId.slice(3).split(":");
  if (officer) return ids.includes("po") || ids.includes("admin") || ids.includes(user.id);
  return ids.includes(user.id) && ids.includes("po");
}

const chatSendTimes = new Map<string, number[]>();

function chatSendLimited(userId: string) {
  const now = Date.now();
  const recent = (chatSendTimes.get(userId) || []).filter((at) => now - at < 60_000);
  if (recent.length >= 20) {
    chatSendTimes.set(userId, recent);
    return true;
  }
  recent.push(now);
  chatSendTimes.set(userId, recent);
  return false;
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
          const data = await loadPublicBoard({ gallery: false });
          if (!data || data.volunteers.length < 1) {
            return Response.json(degradedBody(), {
              headers: { "cache-control": "public, max-age=20, s-maxage=20" },
            });
          }
          const brand = collegeQuotaBlocked() ? { poPhoto: "", principalPhoto: "", poQuote: "", principalQuote: "" } : await readBrandPhotos();
          const slides = includeGallery ? await readHomeSlides().catch(() => []) : [];
          return Response.json(
            { ...publicPayload(data as unknown as Row, false), gallery: includeGallery ? slides : undefined, brand, degraded: false },
            { headers: { "cache-control": "public, max-age=20, s-maxage=30" } },
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
            docId?: string;
            next?: string;
            volunteerId?: string;
            photoUrl?: string;
            thumbUrl?: string;
            email?: string;
            address?: string;
            bloodGroup?: string;
            abcId?: string;
            myBharatId?: string;
            emergencyContact?: string;
            fatherName?: string;
            mpin?: string;
            webauthnId?: string;
            credentialId?: string;
            certificates?: unknown[];
            chatToken?: string;
            threadId?: string;
            text?: string;
            title?: string;
            messageId?: string;
            messageIds?: string[];
            replyName?: string;
            replyText?: string;
            media?: string;
            mediaType?: string;
            kind?: string;
            emoji?: string;
            option?: number;
            peerId?: string;
            typing?: boolean;
            blockId?: string;
            reportId?: string;
            reason?: string;
            hideSeen?: boolean;
            clientId?: string;
            viewOnce?: boolean;
            expiresAt?: string;
            fileName?: string;
            lat?: number;
            lng?: number;
            contactName?: string;
            contactUnit?: string;
            pollQ?: string;
            pollOptions?: string[];
            call?: string;
            sdp?: string;
            forwarded?: boolean;
            nssRole?: string;
            status?: string;
            eventName?: string;
            poPhoto?: string;
            principalPhoto?: string;
            poQuote?: string;
            principalQuote?: string;
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
            const id = text(body.volunteerId);
            const name = text(body.name).slice(0, 80) || "NSS";
            if (!id || id.length > 40) return Response.json({ ok: false, error: "Sign in again." }, { status: 401 });
            const chatToken = signChatPass({
              id,
              name,
              role,
              unit: text(body.unit).slice(0, 20),
              docId: text(body.docId).slice(0, 40),
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
              poQuote: typeof body.poQuote === "string" ? body.poQuote : undefined,
              principalQuote: typeof body.principalQuote === "string" ? body.principalQuote : undefined,
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
          if (body.action === "chat-sync" || body.action === "chat-send" || body.action === "chat-delete" || body.action === "chat-clear" || body.action === "chat-media" || body.action === "chat-edit" || body.action === "chat-react" || body.action === "chat-vote" || body.action === "chat-once" || body.action === "chat-presence" || body.action === "chat-block" || body.action === "chat-report" || body.action === "chat-status" || body.action === "set-role" || body.action === "set-status" || body.action === "announce") {
            const user = await readChatPass(text(body.chatToken));
            if (!user) return Response.json({ ok: false, error: "Sign in again to use NSS Chat." }, { status: 401 });
            if (body.action === "set-role" || body.action === "set-status") {
              if (user.role !== "po" && user.role !== "admin") {
                return Response.json({ ok: false, error: "Only the Programme Officer can change the roll." }, { status: 403 });
              }
              const volunteers = await studentRows();
              const want = text(body.volunteerId).toLowerCase();
              const target = volunteers.find(
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
            if (body.action === "chat-media") {
              const ids = Array.isArray(body.ids) ? body.ids.map((id) => text(id)).slice(0, 6) : [];
              const rows = await readChatMedia(ids);
              const media = rows
                .filter((row) => canSeeThread(user, canonicalThread(row.threadId)))
                .map((row) => ({ id: row.id, media: row.media, mediaType: row.mediaType }));
              return Response.json({ ok: true, media });
            }
            if (body.action === "chat-edit" || body.action === "chat-react" || body.action === "chat-vote" || body.action === "chat-once") {
              const messageId = text(body.messageId);
              const recent = await listRecentChatMessages(120).catch(() => []);
              const row = recent.find((item) => item.id === messageId) || (await readOneChat(messageId));
              if (!row || !canSeeThread(user, canonicalThread(row.threadId))) {
                return Response.json({ ok: false, error: "That message is not in your chat." }, { status: 404 });
              }
              const extra: ChatExtra = { ...(row.extra ?? {}) };
              if (body.action === "chat-edit") {
                if (row.senderId !== user.id) return Response.json({ ok: false, error: "You can edit only your own message." }, { status: 403 });
                if (Date.now() - new Date(row.createdAt).getTime() > 15 * 60 * 1000) {
                  return Response.json({ ok: false, error: "You can edit a message for 15 minutes." }, { status: 403 });
                }
                const message = String(body.text ?? "").split("\u0000").join("").trim().slice(0, 1000);
                if (!message) return Response.json({ ok: false, error: "Type a message first." }, { status: 400 });
                extra.editedAt = new Date().toISOString();
                await reviseChatMessage(row.id, { text: message, extra });
                return Response.json({ ok: true, id: row.id, text: message, extra });
              }
              if (body.action === "chat-react") {
                const emoji = text(body.emoji).slice(0, 8);
                const reactions = { ...(extra.reactions ?? {}) };
                if (!emoji || reactions[user.id] === emoji) delete reactions[user.id];
                else reactions[user.id] = emoji;
                extra.reactions = reactions;
                await reviseChatMessage(row.id, { extra });
                return Response.json({ ok: true, id: row.id, extra });
              }
              if (body.action === "chat-vote") {
                const poll = extra.poll;
                if (!poll) return Response.json({ ok: false, error: "That is not a poll." }, { status: 400 });
                const option = Number(body.option);
                if (!Number.isInteger(option) || option < 0 || option >= poll.options.length) {
                  return Response.json({ ok: false, error: "Choose an option." }, { status: 400 });
                }
                poll.votes = { ...(poll.votes ?? {}), [user.id]: String(option) };
                extra.poll = poll;
                await reviseChatMessage(row.id, { extra });
                return Response.json({ ok: true, id: row.id, extra });
              }
              extra.opened = true;
              await reviseChatMessage(row.id, { extra });
              void patchNotice(row.id, { media: "", mediaType: "", extra: sealText(JSON.stringify(extra).slice(0, 1800)) }).catch(() => undefined);
              return Response.json({ ok: true, id: row.id, extra });
            }
            if (body.action === "chat-presence" || body.action === "chat-block" || body.action === "chat-report" || body.action === "chat-status") {
              if (body.action === "chat-presence") {
                const seenThread = canonicalThread(text(body.threadId));
                if (seenThread && canSeeThread(user, seenThread)) void markChatRead(user.id, seenThread, new Date().toISOString()).catch(() => undefined);
              }
              if (body.action === "chat-block") {
                const other = text(body.blockId).replace(/[^A-Za-z0-9-]/g, "").slice(0, 24);
                if (!other || other === user.id) return Response.json({ ok: false, error: "That person cannot be blocked." }, { status: 400 });
                const id = sideDocId("blk", user.id);
                const current = text((await readSide(id))?.ids);
                const set = new Set(current.split(",").filter(Boolean));
                if (set.has(other)) set.delete(other);
                else set.add(other);
                const ids = [...set].slice(0, 80).join(",");
                await upsertNotice(id, { kind: "chat-block", title: "NSS_CHAT_INTERNAL", ids, senderId: user.id });
                return Response.json({ ok: true, blocked: ids.split(",").filter(Boolean) });
              }
              if (body.action === "chat-report") {
                const other = text(body.reportId).replace(/[^A-Za-z0-9-]/g, "").slice(0, 24);
                const reason = text(body.reason).slice(0, 180);
                if (!other || other === user.id) return Response.json({ ok: false, error: "Choose a person to report." }, { status: 400 });
                const id = `rpt${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
                await upsertNotice(id, {
                  kind: "chat-report",
                  title: "NSS_CHAT_INTERNAL",
                  senderId: user.id,
                  targetId: other,
                  text: sealText(reason || "Reported from chat"),
                  createdAt: new Date().toISOString(),
                });
                return Response.json({ ok: true });
              }
              if (body.action === "chat-status") {
                const message = String(body.text ?? "").split("\u0000").join("").trim().slice(0, 140);
                if (!message) return Response.json({ ok: false, error: "Type a status first." }, { status: 400 });
                const id = `stat${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
                await upsertNotice(id, {
                  kind: "chat-status",
                  title: "NSS_CHAT_INTERNAL",
                  text: sealText(message),
                  senderId: user.id,
                  senderName: user.name.slice(0, 80),
                  createdAt: new Date().toISOString(),
                });
                return Response.json({ ok: true });
              }
              const now = new Date().toISOString();
              const keep = await readSide(sideDocId("pre", user.id));
              const hasCall = Object.prototype.hasOwnProperty.call(body, "call");
              const seenThread = canonicalThread(text(body.threadId));
              const reading = Boolean(seenThread) && canSeeThread(user, seenThread);
              await upsertNotice(sideDocId("pre", user.id), {
                kind: "chat-presence",
                title: "NSS_CHAT_INTERNAL",
                senderId: user.id,
                lastSeen: now,
                typingThread: body.typing && reading ? seenThread : "",
                typingAt: body.typing && reading ? now : "",
                readThread: reading ? seenThread : text(keep?.readThread),
                readAt: reading ? now : text(keep?.readAt),
                hideSeen: body.hideSeen ? "1" : "",
                call: hasCall ? text(body.call).slice(0, 16) : text(keep?.call),
                callThread: hasCall ? (body.call ? canonicalThread(text(body.threadId)) : "") : text(keep?.callThread),
                callAt: hasCall ? (body.call ? now : "") : text(keep?.callAt),
                sdp: hasCall ? text(body.sdp).slice(0, 20000) : text(keep?.sdp),
              });
              const peerId = text(body.peerId).replace(/[^A-Za-z0-9-]/g, "").slice(0, 24);
              const peer = peerId ? await readSide(sideDocId("pre", peerId)) : null;
              const statuses = await listChatStatuses().catch(() => []);
              const seenAt = peer ? text(peer.lastSeen) : "";
              const seenMs = seenAt ? new Date(seenAt).getTime() : 0;
              const hideSeen = text(peer?.hideSeen) === "1";
              return Response.json({
                ok: true,
                statuses,
                peer: peer
                  ? {
                      lastSeen: hideSeen ? "" : seenAt,
                      online: Boolean(seenMs) && Date.now() - seenMs < 40000,
                      typingThread: text(peer.typingThread),
                      typingAt: text(peer.typingAt),
                      readThread: text(peer.readThread),
                      readAt: text(peer.readAt),
                    }
                  : null,
              });
            }
            if (body.action === "chat-delete" || body.action === "chat-clear") {
              const recent = await listRecentChatMessages(300);
              if (body.action === "chat-delete") {
                const ids = (Array.isArray(body.messageIds) ? body.messageIds : [body.messageId]).map((id) => text(id)).filter((id) => /^chat[a-z0-9]{4,40}$/i.test(id)).slice(0, 40);
                const officer = user.role === "po" || user.role === "admin";
                const removed: string[] = [];
                for (const messageId of ids) {
                  let row = recent.find((item) => item.id === messageId) || null;
                  if (!row && !collegeQuotaBlocked()) {
                    try {
                      row = await readOneChat(messageId);
                    } catch {
                      row = null;
                    }
                  }
                  if (!row || !canSeeThread(user, canonicalThread(row.threadId))) continue;
                  if (!officer && row.senderId !== user.id) continue;
                  removed.push(messageId);
                }
                if (!removed.length) return Response.json({ ok: false, error: "You can delete only your own message for everyone." }, { status: 403 });
                await deleteChatMessages(removed);
                return Response.json({ ok: true, removed });
              }
              const threadId = canonicalThread(text(body.threadId));
              if (!validThread(threadId) || !canSeeThread(user, threadId)) {
                return Response.json({ ok: false, error: "You cannot clear that chat." }, { status: 403 });
              }
              const removed = await markThreadCleared(threadId);
              return Response.json({ ok: true, removed });
            }
            if (body.action === "announce") {
              if (user.role !== "po" && user.role !== "admin") return Response.json({ ok: false, error: "Officers only." }, { status: 403 });
              const title = text(body.title).slice(0, 80) || "NSS notice";
              const note = text(body.text).slice(0, 500);
              if (!note) return Response.json({ ok: false, error: "Type a message first." }, { status: 400 });
              const id = `note${Date.now().toString(36)}`;
              await upsertNotice(id, {
                kind: "notice",
                title,
                text: note,
                body: note,
                date: new Date().toISOString().slice(0, 10),
                createdAt: new Date().toISOString(),
                audience: "all",
              });
              const people = (await studentRows())
                .filter((row) => text(row.status) !== "alumni")
                .slice(0, 40);
              for (let index = 0; index < people.length; index += 8) {
                await Promise.all(
                  people.slice(index, index + 8).map((row) => {
                    const who = text(row.volunteerId || row.id);
                    if (!who) return Promise.resolve();
                    return saveChatMessage({
                      threadId: canonicalThread(`dm:${who}:po`),
                      text: `${title}\n${note}`.slice(0, 500),
                      senderId: "po",
                      senderName: "Programme Officer",
                    }).catch(() => undefined);
                  }),
                );
              }
              return Response.json({ ok: true, id });
            }
            if (body.action === "chat-send") {
              const threadId = canonicalThread(text(body.threadId));
              const officer = user.role === "po" || user.role === "admin";
              const message = String(body.text ?? "").split("\u0000").join("").trim().slice(0, 1000);
              const mediaType = body.mediaType === "video" ? "video" : body.mediaType === "audio" ? "audio" : body.mediaType === "file" ? "file" : body.mediaType === "image" ? "image" : "";
              const rawMedia = typeof body.media === "string" ? body.media.trim() : "";
              const mediaOk =
                (mediaType === "image" && rawMedia.startsWith("data:image/") && rawMedia.length < 700000) ||
                (mediaType === "video" && rawMedia.startsWith("data:video/") && rawMedia.length < 3200000) ||
                (mediaType === "audio" && (rawMedia.startsWith("data:audio/") || rawMedia.startsWith("data:video/webm")) && rawMedia.length < 1800000) ||
                (mediaType === "file" && rawMedia.startsWith("data:") && rawMedia.length < 900000);
              if (rawMedia && !mediaOk) return Response.json({ ok: false, error: "That file is too large." }, { status: 400 });
              if (!validThread(threadId) || !canSeeThread(user, threadId) || (threadId === "channel" && !officer)) {
                return Response.json({ ok: false, error: "You cannot send to that chat." }, { status: 403 });
              }
              if (threadId.startsWith("dm:")) {
                const other = threadId.slice(3).split(":").find((part) => part && part !== user.id) || "";
                if (other && (await chatBlocked(user.id, other))) {
                  return Response.json({ ok: false, error: "This chat is blocked." }, { status: 403 });
                }
              }
              if (chatSendLimited(user.id)) return Response.json({ ok: false, error: "Slow down a moment." }, { status: 429 });
              const pollOptions = Array.isArray(body.pollOptions) ? body.pollOptions.map((item) => text(item).slice(0, 40)).filter(Boolean).slice(0, 4) : [];
              const kind = text(body.kind).slice(0, 16);
              if (!message && !mediaOk && kind !== "poll") return Response.json({ ok: false, error: "Type a message first." }, { status: 400 });
              const expiresAt = text(body.expiresAt);
              const extra: ChatExtra = {
                kind: kind || (mediaType === "audio" ? "audio" : mediaType === "file" ? "file" : ""),
                expiresAt: /^\d{4}-\d{2}-\d{2}T/.test(expiresAt) ? expiresAt : "",
                viewOnce: Boolean(body.viewOnce) && (mediaType === "image" || mediaType === "video"),
                fileName: text(body.fileName).slice(0, 80),
                lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : undefined,
                lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : undefined,
                contactName: text(body.contactName).slice(0, 80),
                contactUnit: text(body.contactUnit).slice(0, 40),
                forwarded: Boolean(body.forwarded),
                clientId: text(body.clientId).slice(0, 40),
                poll: kind === "poll" && pollOptions.length >= 2 ? { q: message.slice(0, 140), options: pollOptions, votes: {} } : undefined,
              };
              const saved = await saveChatMessage({
                threadId,
                text: message,
                senderId: user.id,
                senderName: user.name,
                replyName: text(body.replyName).slice(0, 80),
                replyText: text(body.replyText).slice(0, 140),
                media: mediaOk ? rawMedia : "",
                mediaType: mediaOk ? mediaType : "",
                extra,
              });
              return Response.json({ ok: true, message: saved });
            }
            const messages = (await listRecentChatMessages().catch(() => [])).filter((row) => canSeeThread(user, canonicalThread(row.threadId)) && Date.now() - new Date(row.createdAt).getTime() < 24 * 60 * 60 * 1000);
            const officer = user.role === "po" || user.role === "admin";
            const people = officer ? await listChatPeople({ includeMobile: false }).catch(() => []) : [];
            return Response.json({
              ok: true,
              me: { id: user.id, name: user.name, role: user.role, unit: user.unit },
              people,
              messages,
              reads: chatReads(),
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
            if (!data || data.volunteers.length < 1) {
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
              const photo = cardPhoto(row.photoUrl);
              return photo ? { ...shaped, photoUrl: photo } : { ...shaped, photoUrl: undefined };
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
            const volunteers = await studentRows();
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
            const located = await locateOwnStudent(body);
            if (body.action === "set-password") {
              if (!located.row) return Response.json({ ok: false, error: located.error || "Sign in again." }, { status: located.blindId ? 503 : 401 });
              const found = located.row;
              const next = text(body.next);
              if (next.length < 6) {
                return Response.json({ ok: false, error: "New password must be at least 6 characters." }, { status: 400 });
              }
              await patchStudent(text(found.id), {
                password: next,
                passwordHasBeenChanged: true,
                updatedAt: new Date().toISOString(),
              });
              return Response.json({ ok: true, docId: text(found.id) });
            }
            if (!located.row && !located.blindId) {
              return Response.json({ ok: false, error: located.error || "Could not save the profile." }, { status: /busy/i.test(located.error || "") ? 503 : 401 });
            }
            const found = located.row;
            const photo = text(body.photoUrl);
            if (photo.startsWith("data:image/") && photo.length >= 1200000) {
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
              const current = digits(found?.mobile).slice(-10);
              if (next !== current) patch.mobile = next;
            }
            if (typeof body.mpin === "string" && text(body.mpin)) {
              const pin = text(body.mpin);
              if (!/^\d{4}$/.test(pin)) {
                return Response.json({ ok: false, error: "MPIN must be 4 digits." }, { status: 400 });
              }
              patch.mpin = pin;
            }
            if (typeof body.webauthnId === "string" && text(body.webauthnId)) {
              const finger = text(body.webauthnId);
              if (finger.length < 8 || finger.length > 256) {
                return Response.json({ ok: false, error: "Fingerprint could not be saved." }, { status: 400 });
              }
              patch.webauthnId = finger;
            }
            if (photo.startsWith("data:image/")) patch.photoUrl = photo;
            const thumb = text(body.thumbUrl);
            if (thumb.startsWith("data:image/") && thumb.length < 8000) patch.thumbUrl = thumb;
            const docId = text(found?.id) || located.blindId || "";
            try {
              await patchStudent(docId, patch);
            } catch (error) {
              const message = error instanceof Error ? error.message : "";
              if (/not found/i.test(message) && located.blindId && text(found?.id) && text(found?.id) !== located.blindId) {
                await patchStudent(located.blindId, patch);
              } else {
                throw error;
              }
            }
            const savedId = text(found?.id) || located.blindId || "";
            return Response.json({
              ok: true,
              docId: savedId,
              volunteer: found ? selfVolunteer({ ...found, ...patch, id: savedId }) : { ...patch, id: savedId, mobile: patch.mobile || located.blindId },
            });
          }
          if (body.action === "lookup") {
            const volunteers = await studentRows();
            const want = digits(body.mobile);
            const found = volunteers.find((row) => digits(row.mobile).endsWith(want) && want.length >= 10);
            if (!found) return Response.json({ ok: false, error: "This mobile is not on the NSS roll." }, { status: 404 });
            const first = text(found.fullName).split(/\s+/)[0] ?? "";
            return Response.json({ ok: true, username: first.toUpperCase() });
          }
          if (body.action === "mpin-login" || body.action === "finger-login" || body.action === "my-certificates" || body.action === "my-profile") {
            if (body.action === "my-profile" || body.action === "my-certificates") {
              const located = await locateOwnStudent(body);
              if (!located.row) {
                return Response.json({ ok: false, error: located.error || "Sign in again." }, { status: located.blindId ? 503 : 401 });
              }
              if (body.action === "my-certificates") {
                const certificates = await readStudentCerts(text(located.row.id)).catch(() => []);
                return Response.json({ ok: true, certificates, docId: text(located.row.id) });
              }
              return Response.json({ ok: true, docId: text(located.row.id), volunteer: selfVolunteer(located.row) });
            }
            const volunteers = await studentRows();
            if (volunteers.length === 0) {
              return Response.json({ ok: false, error: "The college roll is busy. Wait a moment and sign in again." }, { status: 503 });
            }
            if (body.action === "finger-login") {
              const finger = text(body.credentialId);
              const found = volunteers.find((row) => finger && text(row.webauthnId) === finger);
              if (!found) {
                return Response.json({ ok: false, error: "This fingerprint is not saved. Turn it on from the student dashboard on this phone." }, { status: 401 });
              }
              return Response.json(await studentLoginResponse(found));
            }
            const matched = body.action === "mpin-login"
              ? matchMpin(volunteers, body.username ?? "", body.password ?? "")
              : matchVolunteer(volunteers, body.username ?? body.volunteerId ?? "", body.password ?? "");
            if (!matched.row) return Response.json({ ok: false, error: matched.error }, { status: 401 });
            return Response.json(await studentLoginResponse(matched.row));
          }
          if (body.action === "push-certificates") {
            const officer = await signedOfficer(body.chatToken);
            if (!officer) return Response.json({ ok: false, error: "Open the officer desk and sign in again." }, { status: 401 });
            const volunteers = await studentRows();
            const incoming = (Array.isArray(body.certificates) ? body.certificates : []).slice(0, 200);
            const grouped = new Map<string, NonNullable<ReturnType<typeof wireCert>>[]>();
            for (const raw of incoming) {
              const cert = wireCert(raw);
              if (!cert) continue;
              const key = cert.volunteerId.toLowerCase();
              const found = volunteers.find(
                (row) => text(row.id).toLowerCase() === key || text(row.volunteerId).toLowerCase() === key,
              );
              if (!found) continue;
              const docId = text(found.id);
              const list = grouped.get(docId) ?? [];
              list.push({ ...cert, volunteerId: text(found.volunteerId) || docId });
              grouped.set(docId, list);
            }
            for (const [docId, rows] of grouped) {
              const existing = await readStudentCerts(docId).catch(() => []);
              const byId = new Map(existing.map((item) => [item.id, item]));
              for (const row of rows) byId.set(row.id, row);
              await saveStudentCerts(docId, [...byId.values()].slice(0, 40));
            }
            return Response.json({ ok: true, saved: grouped.size });
          }
          if (body.action === "staff-login") {
            const { staffSession } = await import("@/lib/nss/staff-auth.server");
            let data: Awaited<ReturnType<typeof loadOfficerRoll>> = null;
            try {
              data = await loadOfficerRoll();
            } catch {
              data = null;
            }
            const session = staffSession(body.role || "po", body.username ?? "", body.password ?? "", "Dr. Hareshkumar I. Prajapati");
            if (!session) {
              return Response.json({ ok: false, error: "Invalid staff username or password." }, { status: 401 });
            }
            let chatToken = "";
            try {
              chatToken = signChatPass({ id: session.role, name: session.name, role: session.role, unit: "", docId: "" });
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
          const volunteers = await studentRows();
          if (volunteers.length === 0) {
            return Response.json({ ok: false, error: "The college roll is busy. Wait a moment and sign in again." }, { status: 503 });
          }
          const matched = matchVolunteer(volunteers, body.username ?? "", body.password ?? "");
          if (!matched.row) return Response.json({ ok: false, error: matched.error }, { status: 401 });
          const found = matched.row;
          return Response.json(await studentLoginResponse(found));
        } catch (error) {
          const message = error instanceof Error ? error.message : "request failed";
          const status = /already on the NSS roll/i.test(message) ? 409 : /busy|quota|429/i.test(message) ? 503 : 500;
          return Response.json({ ok: false, error: message }, { status });
        }
      },
    },
  },
});
