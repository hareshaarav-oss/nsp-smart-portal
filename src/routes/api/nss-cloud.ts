import { createFileRoute } from "@tanstack/react-router";
import { loadCollegeCloud, saveStudentToCloud, incrementVisitors } from "@/lib/nss/firestore";

type Row = Record<string, unknown>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function digits(value: unknown) {
  return text(value).replace(/\D/g, "");
}

function publicVolunteer(row: Row) {
  const phone = digits(row.mobile);
  const rawId = text(row.id);
  const idIsPhone = digits(rawId).length >= 10 && (digits(rawId) === phone || digits(rawId).endsWith(phone));
  return {
    id: idIsPhone ? text(row.volunteerId) : rawId,
    volunteerId: text(row.volunteerId),
    fullName: text(row.fullName),
    course: text(row.course),
    semester: text(row.semester),
    unit: text(row.unit),
    nssRole: text(row.nssRole),
    dob: text(row.dob),
    gender: text(row.gender),
    status: text(row.status) || "active",
  };
}

function publicPayload(data: Row, includeGallery: boolean) {
  const volunteers = Array.isArray(data.volunteers) ? data.volunteers.map((row) => publicVolunteer(row as Row)) : [];
  return {
    ok: true,
    volunteers,
    events: data.events ?? [],
    notices: data.notices ?? [],
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
    const passOk = passDigits.length >= 10 && phone.endsWith(passDigits);
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
          const visitors = await incrementVisitors();
          const payload = publicPayload(data as unknown as Row, includeGallery);
          payload.visitors = visitors;
          return Response.json(payload);
        } catch (error) {
          const message = error instanceof Error ? error.message : "cloud load failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { action?: string; username?: string; password?: string };
          if (body.action === "register") {
            const saved = await saveStudentToCloud(body as Record<string, unknown>);
            return Response.json(saved);
          }
          if (body.action !== "login") return Response.json({ ok: false, error: "Unsupported action." }, { status: 400 });
          const data = await loadCollegeCloud();
          const volunteers = (data?.volunteers ?? []) as unknown as Row[];
          const found = matchVolunteer(volunteers, body.username ?? "", body.password ?? "");
          if (!found) return Response.json({ ok: false, error: "Username or mobile password did not match." }, { status: 401 });
          const role = text(found.nssRole) === "Leader" ? "leader" : "volunteer";
          return Response.json({
            ok: true,
            session: {
              role,
              name: text(found.fullName),
              volunteerId: text(found.volunteerId),
            },
            volunteer: publicVolunteer(found),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "login failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
