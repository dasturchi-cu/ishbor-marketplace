import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminFreezeEscrow, adminReleaseEscrow, adminRefundEscrow, getAdminEscrowList } from "@/lib/admin-data-store";
import { subscribeEscrow } from "@/lib/escrow-store";
import { escrowWorkflows } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/escrow/")({
  head: () => ({ meta: [{ title: "Eskrou boshqaruv markazi — Ishbor Admin" }] }),
  component: AdminEscrowPage,
});

function AdminEscrowPage() {
  const navigate = useNavigate();
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("active");
  const escrowList = useSyncExternalStore(subscribeEscrow, getAdminEscrowList, () => escrowWorkflows);

  const filtered = escrowList.filter((e) => {
    if (tab === "active") return ["in_progress", "funded", "review"].includes(e.status);
    if (tab === "released") return ["released", "completed"].includes(e.status);
    if (tab === "pending") return e.milestones.some((m) => m.status === "funded");
    if (tab === "disputed") return e.status === "disputed";
    return true;
  });

  return (
    <AdminShell eyebrow="Eskrou boshqaruv markazi" title="Eskrou" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Faol eskrou</TabsTrigger>
          <TabsTrigger value="released">Chiqarilgan mablag'lar</TabsTrigger>
          <TabsTrigger value="pending">Chiqarish kutilmoqda</TabsTrigger>
          <TabsTrigger value="disputed">Nizoli</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "project", header: "Loyiha", cell: (e) => <span className="text-sm font-medium">{e.project}</span> },
              { key: "parties", header: "Tomonlar", cell: (e) => (
                <div className="flex items-center gap-2 text-xs">
                  <GradientAvatar name={e.client} hue={e.clientHue} size={20} />
                  <span>→</span>
                  <GradientAvatar name={e.freelancer} hue={e.freelancerHue} size={20} />
                </div>
              )},
              { key: "amount", header: "Summa", cell: (e) => <span className="font-mono">${e.amount.toLocaleString()}</span> },
              { key: "status", header: "Holat", cell: (e) => <StatusBadge status={e.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (e) => (
                <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <Button size="sm" variant="ghost" asChild><Link to="/admin/escrow/$id" params={{ id: e.id }}>Ko'rish</Link></Button>
                  <Button size="sm" onClick={() => confirm({ title: "Mablag' chiqarish", description: `"${e.project}" uchun eskrou mablag'i chiqarilsinmi?`, action: `Eskrou mablag'i chiqarildi ${e.id}`, target: e.id, category: "escrow", onConfirm: () => { const m = e.milestones.find((m) => m.status === "funded"); if (m) adminReleaseEscrow(e.id, m.label); } })}>Chiqarish</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Eskrouni muzlatish", description: `"${e.project}" uchun eskrou muzlatilsinmi?`, action: `Eskrou muzlatildi ${e.id}`, target: e.id, category: "escrow", onConfirm: () => adminFreezeEscrow(e.id) })}>Muzlatish</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Mijozga qaytarish", description: `"${e.project}" uchun mijozga qaytarilsinmi?`, action: `Mijozga qaytarildi ${e.id}`, target: e.id, category: "escrow", onConfirm: () => adminRefundEscrow(e.id) })}>Mijozga qaytarish</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Tekshiruv ochish", description: `"${e.project}" uchun tekshiruv ochilsinmi?`, action: `Tekshiruv ochildi ${e.id}`, target: e.id, category: "escrow", onConfirm: () => adminFreezeEscrow(e.id) })}>Tekshirish</Button>
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
