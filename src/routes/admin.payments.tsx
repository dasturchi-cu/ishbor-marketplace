import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subscribeAdminData, getAdminPayments, updatePayment } from "@/lib/admin-data-store";
import type { PaymentRecord } from "@/lib/admin-mock-data";

const EMPTY: PaymentRecord[] = [];

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "To'lovlar va hamyon — Ishbor Admin" }] }),
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("all");
  const paymentRecords = useSyncExternalStore(subscribeAdminData, getAdminPayments, () => EMPTY);

  const filtered = tab === "all" ? paymentRecords : paymentRecords.filter((p) => {
    if (tab === "deposits") return p.type === "deposit";
    if (tab === "withdrawals") return p.type === "withdrawal";
    if (tab === "escrow") return p.type === "escrow_transfer";
    if (tab === "failed") return p.type === "failed";
    return true;
  });

  return (
    <AdminShell eyebrow="To'lovlar va hamyon" title="To'lovlar" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Barchasi</TabsTrigger>
          <TabsTrigger value="deposits">To'ldirishlar</TabsTrigger>
          <TabsTrigger value="withdrawals">Yechib olishlar</TabsTrigger>
          <TabsTrigger value="escrow">Eskrou o'tkazmalari</TabsTrigger>
          <TabsTrigger value="failed">Muvaffaqiyatsiz</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "type", header: "Turi", cell: (p) => <StatusBadge status={p.type} /> },
              { key: "user", header: "Foydalanuvchi", cell: (p) => p.user },
              { key: "amount", header: "Summa", cell: (p) => <span className="font-mono">${p.amount.toLocaleString()}</span> },
              { key: "method", header: "Usul", cell: (p) => <span className="text-xs">{p.method}</span> },
              { key: "status", header: "Holat", cell: (p) => <StatusBadge status={p.status} /> },
              { key: "date", header: "Sana", cell: (p) => p.date },
              { key: "actions", header: "", className: "text-right", cell: (p) => p.type === "withdrawal" && p.status === "pending" ? (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Yechib olishni tasdiqlash", description: `$${p.amount} yechib olish?`, action: `Yechib olish tasdiqlandi ${p.id}`, target: p.id, category: "payment", successMessage: "Yechib olish tasdiqlandi", onConfirm: () => updatePayment(p.id, { status: "completed" }) })}>Tasdiqlash</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Yechib olishni rad etish", description: `$${p.amount} yechib olish?`, action: `Yechib olish rad etildi ${p.id}`, target: p.id, category: "payment", variant: "destructive", confirmLabel: "Rad etish", onConfirm: () => updatePayment(p.id, { status: "failed" }) })}>Rad etish</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Tranzaksiyani ushlab turish", description: "Bu tranzaksiya ushlab turilsinmi?", action: `Tranzaksiya ushlab turildi ${p.id}`, target: p.id, category: "payment", onConfirm: () => updatePayment(p.id, { status: "held" }) })}>Ushlab turish</Button>
                </div>
              ) : null },
            ]}
            searchFilter={(p, q) => p.user.toLowerCase().includes(q) || p.method.toLowerCase().includes(q)}
          />
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
