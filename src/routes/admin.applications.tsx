import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subscribeAdminData, getAdminApplications, updateApplication } from "@/lib/admin-data-store";
import type { Application } from "@/lib/mock-data";

const EMPTY: Application[] = [];

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Ariza boshqaruvi — Ishbor Admin" }] }),
  component: AdminApplicationsPage,
});

function AdminApplicationsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("pending");
  const applications = useSyncExternalStore(subscribeAdminData, getAdminApplications, () => EMPTY);
  const filtered = applications.filter((a) => a.status === tab);

  return (
    <AdminShell eyebrow="Ariza boshqaruvi" title="Arizalar" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Kutilmoqda</TabsTrigger>
          <TabsTrigger value="shortlisted">Tanlanganlar</TabsTrigger>
          <TabsTrigger value="accepted">Qabul qilingan</TabsTrigger>
          <TabsTrigger value="rejected">Rad etilgan</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "project", header: "Loyiha", cell: (a) => <span className="text-sm font-medium">{a.projectTitle}</span> },
              { key: "client", header: "Mijoz", cell: (a) => <div className="flex items-center gap-2"><GradientAvatar name={a.client} hue={a.clientHue} size={24} /><span className="text-sm">{a.client}</span></div> },
              { key: "budget", header: "Byudjet", cell: (a) => <span className="font-mono">${a.budget.toLocaleString()}</span> },
              { key: "status", header: "Holat", cell: (a) => <StatusBadge status={a.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (a) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Arizani tasdiqlash", description: `"${a.projectTitle}" uchun ariza tasdiqlansinmi?`, action: `Ariza tasdiqlandi ${a.id}`, target: a.id, category: "moderation", onConfirm: () => updateApplication(a.id, { status: tab === "shortlisted" ? "accepted" : "shortlisted" }) })}>Tasdiqlash</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Arizani rad etish", description: `"${a.projectTitle}" uchun ariza rad etilsinmi?`, action: `Ariza rad etildi ${a.id}`, target: a.id, category: "moderation", variant: "destructive", confirmLabel: "Rad etish", onConfirm: () => updateApplication(a.id, { status: "rejected" }) })}>Rad etish</Button>
                </div>
              )},
            ]}
            searchFilter={(a, q) => a.projectTitle.toLowerCase().includes(q)}
          />
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
