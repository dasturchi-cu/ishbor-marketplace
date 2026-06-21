import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminSearch } from "@/components/admin/search";
import { AdminSearchProvider } from "@/components/admin/search-context";
import { AdminOnlyGate } from "@/components/admin/admin-only-gate";
import { requireAdmin } from "@/lib/guards";
import { PRIVATE_ROUTE_META } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  beforeLoad: requireAdmin,
  head: () => PRIVATE_ROUTE_META,
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminOnlyGate>
      <AdminProvider>
        <AdminSearchProvider>
          <Outlet />
          <AdminSearch />
        </AdminSearchProvider>
      </AdminProvider>
    </AdminOnlyGate>
  );
}
