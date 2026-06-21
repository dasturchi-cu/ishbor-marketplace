import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { subscribeAdminData, getAdminProjects, updateAdminProject } from "@/lib/admin-data-store";
import type { AdminProject } from "@/lib/admin-mock-data";

const EMPTY: AdminProject[] = [];

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Loyiha boshqaruvi — Ishbor Admin" }] }),
  component: AdminProjectsPage,
});

function AdminProjectsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const projects = useSyncExternalStore(subscribeAdminData, getAdminProjects, () => EMPTY);

  return (
    <AdminShell eyebrow="Loyiha boshqaruvi" title="Loyihalar" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={projects}
        columns={[
          { key: "title", header: "Loyiha", cell: (p) => <span className="text-sm font-medium">{p.title}</span> },
          { key: "client", header: "Mijoz", cell: (p) => (
            <div className="flex items-center gap-2"><GradientAvatar name={p.client} hue={p.clientHue} size={24} /><span className="text-sm">{p.client}</span></div>
          )},
          { key: "budget", header: "Byudjet", cell: (p) => <span className="font-mono">${p.budget.toLocaleString()}</span> },
          { key: "status", header: "Holat", cell: (p) => <StatusBadge status={p.adminStatus} /> },
          { key: "actions", header: "", className: "text-right", cell: (p) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => confirm({ title: "Loyihani tasdiqlash", description: `"${p.title}"?`, action: `Loyiha tasdiqlandi: ${p.title}`, target: p.id, category: "moderation", onConfirm: () => updateAdminProject(p.slug, { adminStatus: "approved" }) })}>Tasdiqlash</Button>
              <Button size="sm" variant="outline" asChild><Link to="/projects/$slug" params={{ slug: p.slug }}>Ko'rish</Link></Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Loyihani to'xtatish", description: `"${p.title}"?`, action: `Loyiha to'xtatildi: ${p.title}`, target: p.id, category: "moderation", onConfirm: () => updateAdminProject(p.slug, { adminStatus: "suspended" }) })}>To'xtatish</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Loyihani o'chirish", description: `"${p.title}"?`, action: `Loyiha o'chirildi: ${p.title}`, target: p.id, category: "moderation", variant: "destructive", confirmLabel: "O'chirish", onConfirm: () => updateAdminProject(p.slug, { adminStatus: "rejected" }) })}>O'chirish</Button>
            </div>
          )},
        ]}
        searchFilter={(p, q) => p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)}
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Ommaviy tasdiqlash", description: `${rows.length} ta loyiha?`, action: `Ommaviy tasdiqlandi ${rows.length} ta loyiha`, target: "bulk", category: "moderation", onConfirm: () => rows.forEach((p) => updateAdminProject(p.slug, { adminStatus: "approved" })) })}>
            Tasdiqlash ({rows.length})
          </Button>
        )}
      />
      {dialog}
    </AdminShell>
  );
}
