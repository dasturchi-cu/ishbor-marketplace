import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { MoreHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminUser } from "@/lib/admin-mock-data";
import { subscribeAdminData, getAdminUsers, suspendAdminUser, verifyAdminUser } from "@/lib/admin-data-store";

const EMPTY: AdminUser[] = [];

export const Route = createFileRoute("/admin/users/")({
  head: () => ({ meta: [{ title: "Foydalanuvchi boshqaruvi — Ishbor Admin" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const users = useSyncExternalStore(subscribeAdminData, getAdminUsers, () => EMPTY);
  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (verifiedFilter === "verified" && !u.verified) return false;
    if (verifiedFilter === "unverified" && u.verified) return false;
    return true;
  });

  const columns = [
    {
      key: "user",
      header: "Foydalanuvchi",
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
    { key: "role", header: "Rol", cell: (u: AdminUser) => <StatusBadge status={u.role} /> },
    { key: "status", header: "Holat", cell: (u: AdminUser) => <StatusBadge status={u.status} /> },
    { key: "verified", header: "Tasdiqlangan", cell: (u: AdminUser) => (u.verified ? "Ha" : "Yo'q") },
    { key: "gmv", header: "GMV", cell: (u: AdminUser) => <span className="font-mono">${u.gmv.toLocaleString()}</span> },
    { key: "trust", header: "Ishonch", cell: (u: AdminUser) => <span className="font-mono">{u.trustScore}</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (u: AdminUser) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" asChild><Link to="/admin/users/$id" params={{ id: u.id }}>Ko'rish</Link></Button>
          <Button variant="ghost" size="sm" onClick={() => confirm({ title: "Foydalanuvchini to'xtatish", description: `${u.name}?`, action: `Foydalanuvchi to'xtatildi: ${u.name}`, target: u.id, category: "user", confirmLabel: "To'xtatish", onConfirm: () => suspendAdminUser(u.id) })}>To'xtatish</Button>
          <Button variant="ghost" size="sm" onClick={() => confirm({ title: "Foydalanuvchini tasdiqlash", description: `${u.name}?`, action: `Foydalanuvchi tasdiqlandi: ${u.name}`, target: u.id, category: "user", successMessage: "Foydalanuvchi tasdiqlandi", onConfirm: () => verifyAdminUser(u.id) })}>Tasdiqlash</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell eyebrow="Foydalanuvchi boshqaruvi" title="Foydalanuvchilar" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Foydalanuvchilarni qidirish…"
        searchFilter={(u, q) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)}
        onRowClick={(u) => navigate({ to: "/admin/users/$id", params: { id: u.id } })}
        filters={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha rollar</SelectItem>
                <SelectItem value="freelancer">Frilanser</SelectItem>
                <SelectItem value="client">Mijoz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="suspended">To'xtatilgan</SelectItem>
                <SelectItem value="banned">Bloklangan</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tasdiqlash" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="verified">Tasdiqlangan</SelectItem>
                <SelectItem value="unverified">Tasdiqlanmagan</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Ommaviy to'xtatish", description: `${rows.length} ta foydalanuvchi?`, action: `Ommaviy to'xtatildi ${rows.length} ta`, target: "bulk", category: "user", variant: "destructive", confirmLabel: "Hammasini to'xtatish", onConfirm: () => rows.forEach((u) => suspendAdminUser(u.id)) })}>
            <MoreHorizontal className="size-3.5" /> To'xtatish ({rows.length})
          </Button>
        )}
      />
      {dialog}
    </AdminShell>
  );
}
