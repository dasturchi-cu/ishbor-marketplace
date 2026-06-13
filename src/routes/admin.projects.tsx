import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { adminProjects } from "@/lib/admin-mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Project Management — Ishbor Admin" }] }),
  component: AdminProjectsPage,
});

function AdminProjectsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();

  return (
    <AdminShell eyebrow="Project Management" title="Projects" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={adminProjects}
        columns={[
          { key: "title", header: "Project", cell: (p) => <span className="text-sm font-medium">{p.title}</span> },
          { key: "client", header: "Client", cell: (p) => (
            <div className="flex items-center gap-2"><GradientAvatar name={p.client} hue={p.clientHue} size={24} /><span className="text-sm">{p.client}</span></div>
          )},
          { key: "budget", header: "Budget", cell: (p) => <span className="font-mono">${p.budget.toLocaleString()}</span> },
          { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.adminStatus} /> },
          { key: "actions", header: "", className: "text-right", cell: (p) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => confirm({ title: "Approve project", description: `Approve "${p.title}"?`, action: `Approved project ${p.title}`, target: p.id, category: "moderation" })}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => toast.info("Edit project — opens editor")}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Suspend project", description: `Suspend "${p.title}"?`, action: `Suspended project ${p.title}`, target: p.id, category: "moderation" })}>Suspend</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Delete project", description: `Delete "${p.title}"?`, action: `Deleted project ${p.title}`, target: p.id, category: "moderation", variant: "destructive", confirmLabel: "Delete" })}>Delete</Button>
            </div>
          )},
        ]}
        searchFilter={(p, q) => p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)}
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Bulk approve", description: `Approve ${rows.length} projects?`, action: `Bulk approved ${rows.length} projects`, target: "bulk", category: "moderation" })}>
            Approve ({rows.length})
          </Button>
        )}
      />
      {dialog}
    </AdminShell>
  );
}
