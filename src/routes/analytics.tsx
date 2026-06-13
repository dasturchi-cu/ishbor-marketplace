import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getActiveRole } from "@/lib/active-role-store";
import { AuthGate } from "@/components/auth/auth-gate";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/analytics")({
  beforeLoad: ({ location }) => {
    requireAuth({ location });
    const path = location.pathname.replace(/\/$/, "");
    if (path !== "/analytics") return;
    const role = getActiveRole();
    throw redirect({
      to: role === "freelancer" ? "/analytics/freelancer" : "/analytics/client",
    });
  },
  component: AnalyticsLayout,
});

function AnalyticsLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}
