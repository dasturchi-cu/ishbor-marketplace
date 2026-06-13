import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminSearch } from "@/components/admin/search";
import { AdminSearchProvider } from "@/components/admin/search-context";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/admin")({
  beforeLoad: requireAuth,
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminProvider>
      <AdminSearchProvider>
        <Outlet />
        <AdminSearch />
      </AdminSearchProvider>
    </AdminProvider>
  );
}
