import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verificationRequests } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/verifications")({
  head: () => ({ meta: [{ title: "Verification Center — Ishbor Admin" }] }),
  component: AdminVerificationsPage,
});

function AdminVerificationsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState(verificationRequests[0]);

  const filtered = verificationRequests.filter((v) => v.status === tab);

  return (
    <AdminShell eyebrow="Verification Center" title="Verifications" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <AdminDataTable
              data={filtered}
              columns={[
                { key: "user", header: "User", cell: (v) => (
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={v.userName} hue={v.userHue} size={28} />
                    <span className="text-sm font-medium">{v.userName}</span>
                  </div>
                )},
                { key: "type", header: "Type", cell: (v) => v.type },
                { key: "submitted", header: "Submitted", cell: (v) => v.submittedAt },
                { key: "docs", header: "Documents", cell: (v) => v.documents.length },
                { key: "status", header: "Status", cell: (v) => <StatusBadge status={v.status} /> },
                { key: "actions", header: "", className: "text-right", cell: (v) => tab === "pending" ? (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" onClick={() => confirm({ title: "Approve verification", description: `Approve ${v.userName}?`, action: `Approved verification for ${v.userName}`, target: v.id, category: "admin", successMessage: "Verification approved" })}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => confirm({ title: "Request more info", description: `Request additional documents from ${v.userName}?`, action: `Requested more info from ${v.userName}`, target: v.id, category: "admin" })}>More info</Button>
                    <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Reject verification", description: `Reject ${v.userName}?`, action: `Rejected verification for ${v.userName}`, target: v.id, category: "admin", variant: "destructive", confirmLabel: "Reject" })}>Reject</Button>
                  </div>
                ) : null },
              ]}
              searchFilter={(v, q) => v.userName.toLowerCase().includes(q)}
              onRowClick={setSelected}
            />

            <Card>
              <CardHeader><CardTitle className="text-base">Identity Documents</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {selected?.documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                    <FileText className="size-4 text-primary" />
                    <div><div className="text-sm font-medium">{d.label}</div><div className="text-xs text-muted-foreground">{d.type}</div></div>
                  </div>
                ))}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">History</div>
                  {selected?.history.map((h, i) => (
                    <div key={i} className="mt-2 text-xs"><span className="font-medium">{h.action}</span> — {h.by} · {h.date}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
