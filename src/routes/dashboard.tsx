import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";
import { AuthGate } from "@/components/auth/auth-gate";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}
