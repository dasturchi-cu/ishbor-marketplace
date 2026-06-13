import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paymentRecords } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments & Wallet — Ishbor Admin" }] }),
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("all");

  const filtered = tab === "all" ? paymentRecords : paymentRecords.filter((p) => {
    if (tab === "deposits") return p.type === "deposit";
    if (tab === "withdrawals") return p.type === "withdrawal";
    if (tab === "escrow") return p.type === "escrow_transfer";
    if (tab === "failed") return p.type === "failed";
    return true;
  });

  return (
    <AdminShell eyebrow="Payments & Wallet" title="Payments" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Transfers</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "type", header: "Type", cell: (p) => <StatusBadge status={p.type} /> },
              { key: "user", header: "User", cell: (p) => p.user },
              { key: "amount", header: "Amount", cell: (p) => <span className="font-mono">${p.amount.toLocaleString()}</span> },
              { key: "method", header: "Method", cell: (p) => <span className="text-xs">{p.method}</span> },
              { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
              { key: "date", header: "Date", cell: (p) => p.date },
              { key: "actions", header: "", className: "text-right", cell: (p) => p.type === "withdrawal" && p.status === "pending" ? (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Approve withdrawal", description: `Approve $${p.amount} withdrawal?`, action: `Approved withdrawal ${p.id}`, target: p.id, category: "payment", successMessage: "Withdrawal approved" })}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Reject withdrawal", description: `Reject $${p.amount} withdrawal?`, action: `Rejected withdrawal ${p.id}`, target: p.id, category: "payment", variant: "destructive", confirmLabel: "Reject" })}>Reject</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Hold transaction", description: "Place hold on this transaction?", action: `Held transaction ${p.id}`, target: p.id, category: "payment" })}>Hold</Button>
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
