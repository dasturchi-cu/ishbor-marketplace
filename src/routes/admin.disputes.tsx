import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { disputes } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/disputes")({
  head: () => ({ meta: [{ title: "Dispute Center — Ishbor Admin" }] }),
  component: AdminDisputesPage,
});

function AdminDisputesPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("open");
  const filtered = disputes.filter((d) => d.status === tab);

  return (
    <AdminShell eyebrow="Dispute Center" title="Disputes" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "project", header: "Project", cell: (d) => <span className="text-sm font-medium">{d.project}</span> },
              { key: "parties", header: "Parties", cell: (d) => (
                <div className="flex items-center gap-2 text-xs">
                  <GradientAvatar name={d.client} hue={d.clientHue} size={20} />
                  <span>vs</span>
                  <GradientAvatar name={d.freelancer} hue={d.freelancerHue} size={20} />
                </div>
              )},
              { key: "amount", header: "Amount", cell: (d) => <span className="font-mono">${d.amount.toLocaleString()}</span> },
              { key: "reason", header: "Reason", cell: (d) => <span className="text-xs text-muted-foreground">{d.reason}</span> },
              { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (d) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Resolve dispute", description: `Resolve dispute for "${d.project}"?`, action: `Resolved dispute ${d.id}`, target: d.id, category: "escrow", successMessage: "Dispute resolved" })}>Resolve</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Refund client", description: `Refund client for "${d.project}"?`, action: `Refunded client in dispute ${d.id}`, target: d.id, category: "escrow" })}>Refund</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Pay freelancer", description: `Pay freelancer for "${d.project}"?`, action: `Paid freelancer in dispute ${d.id}`, target: d.id, category: "escrow" })}>Pay</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Split payment", description: "Split payment 50/50 between parties?", action: `Split payment for dispute ${d.id}`, target: d.id, category: "escrow" })}>Split</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Escalate dispute", description: "Escalate to legal team?", action: `Escalated dispute ${d.id}`, target: d.id, category: "escrow" })}>Escalate</Button>
                </div>
              )},
            ]}
            searchFilter={(d, q) => d.project.toLowerCase().includes(q)}
          />
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
