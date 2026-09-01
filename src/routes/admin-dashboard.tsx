import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-dashboard")({
  component: () => <Navigate to="/po" />,
});
