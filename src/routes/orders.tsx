import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";
import { AuthGate } from "@/components/auth/auth-gate";

export const Route = createFileRoute("/orders")({
  beforeLoad: requireAuth,
  component: OrdersLayout,
});

function OrdersLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}