import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";
import { AuthGate } from "@/components/auth/auth-gate";

export const Route = createFileRoute("/applications")({
  beforeLoad: requireAuth,
  component: ApplicationsLayout,
});

function ApplicationsLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}