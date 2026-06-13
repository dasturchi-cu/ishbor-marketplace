import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { adminServices } from "@/lib/admin-mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Service Management — Ishbor Admin" }] }),
  component: AdminServicesPage,
});

function AdminServicesPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();

  return (
    <AdminShell eyebrow="Service Management" title="Services" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={adminServices}
        columns={[
          { key: "title", header: "Service", cell: (s) => <span className="text-sm font-medium">{s.title}</span> },
          { key: "seller", header: "Seller", cell: (s) => (
            <div className="flex items-center gap-2"><GradientAvatar name={s.seller} hue={s.sellerHue} size={24} /><span className="text-sm">{s.seller}</span></div>
          )},
          { key: "price", header: "Price", cell: (s) => <span className="font-mono">${s.price}</span> },
          { key: "category", header: "Category", cell: (s) => s.category },
          { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.adminStatus} /> },
          { key: "actions", header: "", className: "text-right", cell: (s) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => confirm({ title: "Approve service", description: `Approve "${s.title}"?`, action: `Approved service ${s.title}`, target: s.id, category: "moderation" })}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => toast.info("Edit service — opens editor")}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Suspend service", description: `Suspend "${s.title}"?`, action: `Suspended service ${s.title}`, target: s.id, category: "moderation" })}>Suspend</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Delete service", description: `Delete "${s.title}"?`, action: `Deleted service ${s.title}`, target: s.id, category: "moderation", variant: "destructive", confirmLabel: "Delete" })}>Delete</Button>
            </div>
          )},
        ]}
        searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.seller.toLowerCase().includes(q)}
      />
      {dialog}
    </AdminShell>
  );
}
