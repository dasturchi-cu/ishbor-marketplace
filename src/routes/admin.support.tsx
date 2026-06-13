import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscribeAdminData, getAdminSupport, updateSupportTicket } from "@/lib/admin-data-store";
import type { SupportTicket } from "@/lib/admin-mock-data";

const EMPTY: SupportTicket[] = [];

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Qo'llab-quvvatlash markazi — Ishbor Admin" }] }),
  component: AdminSupportPage,
});

const AGENTS = ["Laylo R.", "Elena V.", "Bobur N.", "Aisha K."];

function AdminSupportPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [statusFilter, setStatusFilter] = useState("all");
  const supportTickets = useSyncExternalStore(subscribeAdminData, getAdminSupport, () => EMPTY);
  const filtered = statusFilter === "all" ? supportTickets : supportTickets.filter((t) => t.status === statusFilter);

  return (
    <AdminShell eyebrow="Qo'llab-quvvatlash markazi" title="Qo'llab-quvvatlash chiptalari" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={filtered}
        columns={[
          { key: "subject", header: "Mavzu", cell: (t) => <span className="text-sm font-medium">{t.subject}</span> },
          { key: "user", header: "Foydalanuvchi", cell: (t) => (
            <div className="flex items-center gap-2"><GradientAvatar name={t.user} hue={t.userHue} size={24} /><span className="text-sm">{t.user}</span></div>
          )},
          { key: "priority", header: "Ustuvorlik", cell: (t) => <StatusBadge status={t.priority} /> },
          { key: "assigned", header: "Agent", cell: (t) => t.assignedTo ?? "Tayinlanmagan" },
          { key: "status", header: "Holat", cell: (t) => <StatusBadge status={t.status} /> },
          { key: "messages", header: "Xabarlar", cell: (t) => t.messages },
          { key: "actions", header: "", className: "text-right", cell: (t) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Select onValueChange={(v) => confirm({ title: "Chipta tayinlash", description: `${v}ga tayinlansinmi?`, action: `Chipta tayinlandi ${t.id} — ${v}`, target: t.id, category: "admin", onConfirm: () => updateSupportTicket(t.id, { assignedTo: v, status: "in_progress" }) })}>
                <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Tayinlash" /></SelectTrigger>
                <SelectContent>{AGENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Chiptaga javob berish", description: `${t.user}?`, action: `Chiptaga javob berildi ${t.id}`, target: t.id, category: "admin", successMessage: "Javob yuborildi", onConfirm: () => updateSupportTicket(t.id, { messages: t.messages + 1, lastReply: "Hozirgina" }) })}>Javob berish</Button>
              <Button size="sm" onClick={() => confirm({ title: "Chiptani yopish", description: `"${t.subject}"?`, action: `Chipta yopildi ${t.id}`, target: t.id, category: "admin", onConfirm: () => updateSupportTicket(t.id, { status: "closed" }) })}>Yopish</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Chiptani yuqoriga ko'tarish", description: "Katta qo'llab-quvvatlashga ko'tarilsinmi?", action: `Chipta yuqoriga ko'tarildi ${t.id}`, target: t.id, category: "admin", onConfirm: () => updateSupportTicket(t.id, { priority: "urgent", status: "in_progress" }) })}>Yuqoriga ko'tarish</Button>
            </div>
          )},
        ]}
        searchFilter={(t, q) => t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q)}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Holat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="open">Ochiq</SelectItem>
              <SelectItem value="in_progress">Jarayonda</SelectItem>
              <SelectItem value="resolved">Hal qilingan</SelectItem>
              <SelectItem value="closed">Yopilgan</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {dialog}
    </AdminShell>
  );
}
