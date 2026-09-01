import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/student-register")({
  component: () => <Navigate to="/register" />,
});
