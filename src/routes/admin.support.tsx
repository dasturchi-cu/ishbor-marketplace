import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportTickets } from "@/lib/admin-mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support Center — Ishbor Admin" }] }),
  component: AdminSupportPage,
});

const AGENTS = ["Laylo R.", "Elena V.", "Bobur N.", "Aisha K."];

function AdminSupportPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = statusFilter === "all" ? supportTickets : supportTickets.filter((t) => t.status === statusFilter);

  return (
    <AdminShell eyebrow="Support Center" title="Support Tickets" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={filtered}
        columns={[
          { key: "subject", header: "Subject", cell: (t) => <span className="text-sm font-medium">{t.subject}</span> },
          { key: "user", header: "User", cell: (t) => (
            <div className="flex items-center gap-2"><GradientAvatar name={t.user} hue={t.userHue} size={24} /><span className="text-sm">{t.user}</span></div>
          )},
          { key: "priority", header: "Priority", cell: (t) => <StatusBadge status={t.priority} /> },
          { key: "assigned", header: "Agent", cell: (t) => t.assignedTo ?? "Unassigned" },
          { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          { key: "messages", header: "Msgs", cell: (t) => t.messages },
          { key: "actions", header: "", className: "text-right", cell: (t) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Select onValueChange={(v) => confirm({ title: "Assign ticket", description: `Assign to ${v}?`, action: `Assigned ticket ${t.id} to ${v}`, target: t.id, category: "admin" })}>
                <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Assign" /></SelectTrigger>
                <SelectContent>{AGENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => toast.success("Reply sent to user")}>Reply</Button>
              <Button size="sm" onClick={() => confirm({ title: "Close ticket", description: `Close "${t.subject}"?`, action: `Closed ticket ${t.id}`, target: t.id, category: "admin" })}>Close</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Escalate ticket", description: "Escalate to senior support?", action: `Escalated ticket ${t.id}`, target: t.id, category: "admin" })}>Escalate</Button>
            </div>
          )},
        ]}
        searchFilter={(t, q) => t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q)}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {dialog}
    </AdminShell>
  );
}
