import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminUsers, type AdminUser } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Ishbor Admin" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const filtered = adminUsers.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (verifiedFilter === "verified" && !u.verified) return false;
    if (verifiedFilter === "unverified" && u.verified) return false;
    return true;
  });

  const columns = [
    {
      key: "user",
      header: "User",
      cell: (u: AdminUser) => (
        <div className="flex items-center gap-3">
          <GradientAvatar name={u.name} hue={u.hue} size={32} />
          <div>
            <div className="text-sm font-semibold">{u.name}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", cell: (u: AdminUser) => <StatusBadge status={u.role} /> },
    { key: "status", header: "Status", cell: (u: AdminUser) => <StatusBadge status={u.status} /> },
    { key: "verified", header: "Verified", cell: (u: AdminUser) => (u.verified ? "Yes" : "No") },
    { key: "gmv", header: "GMV", cell: (u: AdminUser) => <span className="font-mono">${u.gmv.toLocaleString()}</span> },
    { key: "trust", header: "Trust", cell: (u: AdminUser) => <span className="font-mono">{u.trustScore}</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (u: AdminUser) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" asChild><Link to="/admin/users/$id" params={{ id: u.id }}>View</Link></Button>
          <Button variant="ghost" size="sm" onClick={() => confirm({ title: "Suspend user", description: `Suspend ${u.name}?`, action: `Suspended user ${u.name}`, target: u.id, category: "user", confirmLabel: "Suspend", onConfirm: () => {} })}>Suspend</Button>
          <Button variant="ghost" size="sm" onClick={() => confirm({ title: "Verify user", description: `Verify ${u.name}?`, action: `Verified user ${u.name}`, target: u.id, category: "user", successMessage: "User verified", onConfirm: () => {} })}>Verify</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell eyebrow="User Management" title="Users" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search users…"
        searchFilter={(u, q) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)}
        onRowClick={(u) => navigate({ to: "/admin/users/$id", params: { id: u.id } })}
        filters={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Verification" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Bulk suspend", description: `Suspend ${rows.length} users?`, action: `Bulk suspended ${rows.length} users`, target: "bulk", category: "user", variant: "destructive", confirmLabel: "Suspend all" })}>
            <MoreHorizontal className="size-3.5" /> Suspend ({rows.length})
          </Button>
        )}
      />
      {dialog}
    </AdminShell>
  );
}
