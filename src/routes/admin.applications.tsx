import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { applications } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Application Management — Ishbor Admin" }] }),
  component: AdminApplicationsPage,
});

function AdminApplicationsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("pending");
  const filtered = applications.filter((a) => a.status === tab);

  return (
    <AdminShell eyebrow="Application Management" title="Applications" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "project", header: "Project", cell: (a) => <span className="text-sm font-medium">{a.projectTitle}</span> },
              { key: "client", header: "Client", cell: (a) => <div className="flex items-center gap-2"><GradientAvatar name={a.client} hue={a.clientHue} size={24} /><span className="text-sm">{a.client}</span></div> },
              { key: "budget", header: "Budget", cell: (a) => <span className="font-mono">${a.budget.toLocaleString()}</span> },
              { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (a) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Moderate application", description: `Review application for "${a.projectTitle}"?`, action: `Moderated application ${a.id}`, target: a.id, category: "moderation" })}>Moderate</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Remove spam", description: "Mark as spam and remove?", action: `Removed spam application ${a.id}`, target: a.id, category: "moderation", variant: "destructive", confirmLabel: "Remove" })}>Remove spam</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Suspend user", description: "Suspend applicant account?", action: `Suspended user from application ${a.id}`, target: a.id, category: "user", confirmLabel: "Suspend" })}>Suspend user</Button>
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
