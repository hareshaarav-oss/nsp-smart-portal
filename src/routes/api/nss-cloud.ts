import { createFileRoute } from "@tanstack/react-router";
import { loadCollegeCloud } from "@/lib/nss/firestore";

export const Route = createFileRoute("/api/nss-cloud")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const includeGallery = new URL(request.url).searchParams.get("gallery") === "1";
          const data = await loadCollegeCloud({ gallery: includeGallery });
          if (!data) return Response.json({ ok: false }, { status: 404 });
          return Response.json({ ok: true, ...data });
        } catch (error) {
          const message = error instanceof Error ? error.message : "cloud load failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
