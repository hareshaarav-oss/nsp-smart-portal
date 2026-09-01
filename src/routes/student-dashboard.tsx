import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/student-dashboard")({
  component: () => <Navigate to="/volunteer" />,
});
