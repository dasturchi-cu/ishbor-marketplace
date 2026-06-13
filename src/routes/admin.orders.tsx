import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orders } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Order Management — Ishbor Admin" }] }),
  component: AdminOrdersPage,
});

const TABS = [
  { value: "active", label: "Active", filter: (s: string) => ["in_progress", "revision"].includes(s) },
  { value: "review", label: "Review", filter: (s: string) => s === "review" },
  { value: "completed", label: "Completed", filter: (s: string) => s === "completed" },
  { value: "cancelled", label: "Cancelled", filter: (s: string) => s === "cancelled" },
  { value: "disputed", label: "Disputed", filter: (s: string) => s === "disputed" },
];

function AdminOrdersPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("active");
  const current = TABS.find((t) => t.value === tab)!;
  const filtered = orders.filter((o) => current.filter(o.status));

  return (
    <AdminShell eyebrow="Order Management" title="Orders" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>{TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "title", header: "Order", cell: (o) => <span className="text-sm font-medium">{o.title}</span> },
              { key: "client", header: "Client", cell: (o) => <div className="flex items-center gap-2"><GradientAvatar name={o.client} hue={o.clientHue} size={24} /><span className="text-sm">{o.client}</span></div> },
              { key: "freelancer", header: "Freelancer", cell: (o) => o.freelancer },
              { key: "amount", header: "Amount", cell: (o) => <span className="font-mono">${o.amount.toLocaleString()}</span> },
              { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (o) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Force complete", description: `Force complete "${o.title}"?`, action: `Force completed order ${o.id}`, target: o.id, category: "admin" })}>Complete</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Pause order", description: `Pause "${o.title}"?`, action: `Paused order ${o.id}`, target: o.id, category: "admin" })}>Pause</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Cancel order", description: `Cancel "${o.title}"?`, action: `Cancelled order ${o.id}`, target: o.id, category: "admin", variant: "destructive", confirmLabel: "Cancel" })}>Cancel</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Escalate order", description: `Escalate "${o.title}" to senior admin?`, action: `Escalated order ${o.id}`, target: o.id, category: "admin" })}>Escalate</Button>
                </div>
              )},
            ]}
            searchFilter={(o, q) => o.title.toLowerCase().includes(q)}
          />
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
