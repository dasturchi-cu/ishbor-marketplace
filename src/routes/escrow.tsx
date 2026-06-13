import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";
import { AuthGate } from "@/components/auth/auth-gate";

export const Route = createFileRoute("/escrow")({
  beforeLoad: requireAuth,
  component: EscrowLayout,
});

function EscrowLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}