import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Button } from "@/components/ui/button";
import { subscribeAdminData, getAdminModeration, updateModerationItem } from "@/lib/admin-data-store";
import type { ModerationItem } from "@/lib/admin-mock-data";

const EMPTY: ModerationItem[] = [];

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({ meta: [{ title: "Kontent moderatsiyasi — Ishbor Admin" }] }),
  component: AdminModerationPage,
});

function AdminModerationPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const moderationQueue = useSyncExternalStore(subscribeAdminData, getAdminModeration, () => EMPTY);

  return (
    <AdminShell eyebrow="Kontent moderatsiyasi" title="Moderatsiya" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={moderationQueue}
        columns={[
          { key: "type", header: "Turi", cell: (m) => <StatusBadge status={m.type} /> },
          { key: "title", header: "Kontent", cell: (m) => <span className="text-sm font-medium">{m.title}</span> },
          { key: "reason", header: "Sabab", cell: (m) => <span className="text-xs text-muted-foreground">{m.reason}</span> },
          { key: "reported", header: "Shikoyat qilgan", cell: (m) => m.reportedBy },
          { key: "time", header: "Qachon", cell: (m) => m.reportedAt },
          { key: "status", header: "Holat", cell: (m) => <StatusBadge status={m.status} /> },
          { key: "actions", header: "", className: "text-right", cell: (m) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => confirm({ title: "Kontentni tasdiqlash", description: `"${m.title}"?`, action: `Kontent tasdiqlandi ${m.id}`, target: m.id, category: "moderation", onConfirm: () => updateModerationItem(m.id, { status: "approved" }) })}>Tasdiqlash</Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Kontentni yashirish", description: `"${m.title}" ommaviy ko'rinishdan yashirilsinmi?`, action: `Kontent yashirildi ${m.id}`, target: m.id, category: "moderation", onConfirm: () => updateModerationItem(m.id, { status: "hidden" }) })}>Yashirish</Button>
              <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Kontentni o'chirish", description: `"${m.title}" butunlay o'chirilsinmi?`, action: `Kontent o'chirildi ${m.id}`, target: m.id, category: "moderation", variant: "destructive", confirmLabel: "O'chirish", onConfirm: () => updateModerationItem(m.id, { status: "removed" }) })}>O'chirish</Button>
              <Button size="sm" variant="outline" onClick={() => confirm({ title: "Foydalanuvchini ogohlantirish", description: "Kontent egasiga ogohlantirish yuborilsinmi?", action: `Foydalanuvchi ogohlantirildi ${m.id}`, target: m.id, category: "moderation", onConfirm: () => updateModerationItem(m.id, { status: "approved" }) })}>Ogohlantirish</Button>
            </div>
          )},
        ]}
        searchFilter={(m, q) => m.title.toLowerCase().includes(q)}
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Ommaviy tasdiqlash", description: `${rows.length} ta element?`, action: `Ommaviy tasdiqlandi ${rows.length} ta`, target: "bulk", category: "moderation", onConfirm: () => rows.forEach((m) => updateModerationItem(m.id, { status: "approved" })) })}>
            Tasdiqlash ({rows.length})
          </Button>
        )}
      />
      {dialog}
    </AdminShell>
  );
}
