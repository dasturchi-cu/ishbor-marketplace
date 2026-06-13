import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Button } from "@/components/ui/button";
import { moderationQueue } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({ meta: [{ title: "Content Moderation — Ishbor Admin" }] }),
  component: AdminModerationPage,
});

function AdminModerationPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();

  return (
    <AdminShell eyebrow="Content Moderation" title="Moderation" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={moderationQueue}
        columns={[
          { key: "type", header: "Type", cell: (m) => <StatusBadge status={m.type} /> },
          { key: "title", header: "Content", cell: (m) => <span className="text-sm font-medium">{m.title}</span> },
          { key: "reason", header: "Reason", cell: (m) => <span className="text-xs text-muted-foreground">{m.reason}</span> },
          { key: "reported", header: "Reported by", cell: (m) => m.reportedBy },
          { key: "time", header: "When", cell: (m) => m.reportedAt },
          { key: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
          { key: "actions", header: "", className: "text-right", cell: (m) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => confirm({ title: "Approve content", description: `Approve "${m.title}"?`, action: `Approved content ${m.id}`, target: m.id, category: "moderation" })}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Hide content", description: `Hide "${m.title}" from public view?`, action: `Hidden content ${m.id}`, target: m.id, category: "moderation" })}>Hide</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Remove content", description: `Permanently remove "${m.title}"?`, action: `Removed content ${m.id}`, target: m.id, category: "moderation", variant: "destructive", confirmLabel: "Remove" })}>Remove</Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Warn user", description: "Send warning to content owner?", action: `Warned user for ${m.id}`, target: m.id, category: "moderation" })}>Warn</Button>
            </div>
          )},
        ]}
        searchFilter={(m, q) => m.title.toLowerCase().includes(q)}
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Bulk approve", description: `Approve ${rows.length} items?`, action: `Bulk approved ${rows.length} items`, target: "bulk", category: "moderation" })}>
            Approve ({rows.length})
          </Button>
        )}
      />
      {dialog}
    </AdminShell>
  );
}
