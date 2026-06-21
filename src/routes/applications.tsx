import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";
import { AuthGate } from "@/components/auth/auth-gate";

import { PRIVATE_ROUTE_META } from "@/lib/seo";

export const Route = createFileRoute("/applications")({
  beforeLoad: requireAuth,
  head: () => PRIVATE_ROUTE_META,
  component: ApplicationsLayout,
});

function ApplicationsLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}