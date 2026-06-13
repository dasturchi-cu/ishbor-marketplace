import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: () => <Outlet />,
});
