import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PRIVATE_ROUTE_META } from "@/lib/seo";

export const Route = createFileRoute("/onboarding")({
  head: () => PRIVATE_ROUTE_META,
  component: () => <Outlet />,
});
