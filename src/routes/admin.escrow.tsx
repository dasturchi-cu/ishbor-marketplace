import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { escrowWorkflows } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/escrow")({
  head: () => ({ meta: [{ title: "Escrow Command Center — Ishbor Admin" }] }),
  component: AdminEscrowPage,
});

function AdminEscrowPage() {
  const navigate = useNavigate();
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("active");

  const filtered = escrowWorkflows.filter((e) => {
    if (tab === "active") return ["in_progress", "funded", "review"].includes(e.status);
    if (tab === "released") return ["released", "completed"].includes(e.status);
    if (tab === "pending") return e.milestones.some((m) => m.status === "funded");
    if (tab === "disputed") return e.status === "disputed";
    return true;
  });

  return (
    <AdminShell eyebrow="Escrow Command Center" title="Escrow" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active Escrow</TabsTrigger>
          <TabsTrigger value="released">Released Funds</TabsTrigger>
          <TabsTrigger value="pending">Pending Release</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "project", header: "Project", cell: (e) => <span className="text-sm font-medium">{e.project}</span> },
              { key: "parties", header: "Parties", cell: (e) => (
                <div className="flex items-center gap-2 text-xs">
                  <GradientAvatar name={e.client} hue={e.clientHue} size={20} />
                  <span>→</span>
                  <GradientAvatar name={e.freelancer} hue={e.freelancerHue} size={20} />
                </div>
              )},
              { key: "amount", header: "Amount", cell: (e) => <span className="font-mono">${e.amount.toLocaleString()}</span> },
              { key: "status", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (e) => (
                <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <Button size="sm" variant="ghost" asChild><Link to="/admin/escrow/$id" params={{ id: e.id }}>View</Link></Button>
                  <Button size="sm" onClick={() => confirm({ title: "Release funds", description: `Release escrow for "${e.project}"?`, action: `Released escrow ${e.id}`, target: e.id, category: "escrow" })}>Release</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Freeze escrow", description: `Freeze escrow for "${e.project}"?`, action: `Froze escrow ${e.id}`, target: e.id, category: "escrow" })}>Freeze</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Refund client", description: `Refund client for "${e.project}"?`, action: `Refunded client for escrow ${e.id}`, target: e.id, category: "escrow" })}>Refund</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Open investigation", description: `Open investigation for "${e.project}"?`, action: `Opened investigation for escrow ${e.id}`, target: e.id, category: "escrow" })}>Investigate</Button>
                </div>
              )},
            ]}
            searchFilter={(e, q) => e.project.toLowerCase().includes(q)}
            onRowClick={(e) => navigate({ to: "/admin/escrow/$id", params: { id: e.id } })}
          />
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
