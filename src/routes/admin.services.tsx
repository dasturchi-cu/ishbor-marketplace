import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { subscribeAdminData, getAdminServices, updateAdminService } from "@/lib/admin-data-store";
import type { AdminService } from "@/lib/admin-mock-data";

const EMPTY: AdminService[] = [];

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Xizmat boshqaruvi — Ishbor Admin" }] }),
  component: AdminServicesPage,
});

function AdminServicesPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const services = useSyncExternalStore(subscribeAdminData, getAdminServices, () => EMPTY);

  return (
    <AdminShell eyebrow="Xizmat boshqaruvi" title="Xizmatlar" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={services}
        columns={[
          { key: "title", header: "Xizmat", cell: (s) => <span className="text-sm font-medium">{s.title}</span> },
          { key: "seller", header: "Sotuvchi", cell: (s) => (
            <div className="flex items-center gap-2"><GradientAvatar name={s.seller} hue={s.sellerHue} size={24} /><span className="text-sm">{s.seller}</span></div>
          )},
          { key: "price", header: "Narx", cell: (s) => <span className="font-mono">${s.price}</span> },
          { key: "category", header: "Kategoriya", cell: (s) => s.category },
          { key: "status", header: "Holat", cell: (s) => <StatusBadge status={s.adminStatus} /> },
          { key: "actions", header: "", className: "text-right", cell: (s) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => confirm({ title: "Xizmatni tasdiqlash", description: `"${s.title}"?`, action: `Xizmat tasdiqlandi: ${s.title}`, target: s.id, category: "moderation", onConfirm: () => updateAdminService(s.slug, { adminStatus: "approved" }) })}>Tasdiqlash</Button>
              <Button size="sm" variant="outline" asChild><Link to="/services/$slug" params={{ slug: s.slug }}>Tahrirlash</Link></Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Xizmatni to'xtatish", description: `"${s.title}"?`, action: `Xizmat to'xtatildi: ${s.title}`, target: s.id, category: "moderation", onConfirm: () => updateAdminService(s.slug, { adminStatus: "suspended" }) })}>To'xtatish</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Xizmatni o'chirish", description: `"${s.title}"?`, action: `Xizmat o'chirildi: ${s.title}`, target: s.id, category: "moderation", variant: "destructive", confirmLabel: "O'chirish", onConfirm: () => updateAdminService(s.slug, { adminStatus: "rejected" }) })}>O'chirish</Button>
            </div>
          )},
        ]}
        searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.seller.toLowerCase().includes(q)}
      />
      {dialog}
    </AdminShell>
  );
}
