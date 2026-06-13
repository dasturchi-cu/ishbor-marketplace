import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/guards";
import { AuthGate } from "@/components/auth/auth-gate";

export const Route = createFileRoute("/portfolio")({
  beforeLoad: requireAuth,
  component: PortfolioLayout,
});

function PortfolioLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}