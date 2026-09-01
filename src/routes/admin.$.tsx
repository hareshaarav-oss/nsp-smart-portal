import { createFileRoute, redirect } from "@tanstack/react-router";

const MAP: Record<string, "/po" | "/po/reports" | "/po/attendance" | "/po/events" | "/po/notices" | "/po/gallery" | "/po/certificates" | "/po/settings" | "/po/volunteers" | "/po/birthdays"> = {
  reports: "/po/reports",
  attendance: "/po/attendance",
  events: "/po/events",
  notices: "/po/notices",
  gallery: "/po/gallery",
  certificates: "/po/certificates",
  settings: "/po/settings",
  students: "/po/volunteers",
  yearly: "/po/reports",
  press: "/po/notices",
  alumni: "/po/volunteers",
  birthdays: "/po/birthdays",
};

export const Route = createFileRoute("/admin/$")({
  beforeLoad: ({ params }) => {
    const key = (params._splat ?? "").split("/")[0] ?? "";
    throw redirect({ to: MAP[key] ?? "/po" });
  },
});
