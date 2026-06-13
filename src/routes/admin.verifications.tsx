import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { FileText } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeAdminData, getAdminVerifications, updateVerification, verifyAdminUser } from "@/lib/admin-data-store";
import type { VerificationRequest } from "@/lib/admin-mock-data";

const EMPTY: VerificationRequest[] = [];

export const Route = createFileRoute("/admin/verifications")({
  head: () => ({ meta: [{ title: "Tasdiqlash markazi — Ishbor Admin" }] }),
  component: AdminVerificationsPage,
});

function AdminVerificationsPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("pending");
  const verificationRequests = useSyncExternalStore(subscribeAdminData, getAdminVerifications, () => EMPTY);
  const filtered = verificationRequests.filter((v) => v.status === tab);
  const [selected, setSelected] = useState<VerificationRequest | undefined>(undefined);
  const active = selected ?? filtered[0];

  return (
    <AdminShell eyebrow="Tasdiqlash markazi" title="Tasdiqlashlar" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mobile-scroll-x h-auto w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="pending">Kutilmoqda</TabsTrigger>
          <TabsTrigger value="approved">Tasdiqlangan</TabsTrigger>
          <TabsTrigger value="rejected">Rad etilgan</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <AdminDataTable
              data={filtered}
              columns={[
                { key: "user", header: "Foydalanuvchi", cell: (v) => (
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={v.userName} hue={v.userHue} size={28} />
                    <span className="text-sm font-medium">{v.userName}</span>
                  </div>
                )},
                { key: "type", header: "Turi", cell: (v) => v.type },
                { key: "submitted", header: "Yuborilgan", cell: (v) => v.submittedAt },
                { key: "docs", header: "Hujjatlar", cell: (v) => v.documents.length },
                { key: "status", header: "Holat", cell: (v) => <StatusBadge status={v.status} /> },
                { key: "actions", header: "", className: "text-right", cell: (v) => tab === "pending" ? (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" onClick={() => confirm({ title: "Tasdiqlashni tasdiqlash", description: `${v.userName}?`, action: `Tasdiqlash tasdiqlandi: ${v.userName}`, target: v.id, category: "admin", successMessage: "Tasdiqlash tasdiqlandi", onConfirm: () => { updateVerification(v.id, { status: "approved" }); verifyAdminUser(v.userId); } })}>Tasdiqlash</Button>
                    <Button size="sm" variant="outline" onClick={() => confirm({ title: "Qo'shimcha ma'lumot so'rash", description: `${v.userName}dan qo'shimcha hujjatlar so'ralsinmi?`, action: `${v.userName}dan qo'shimcha ma'lumot so'raldi`, target: v.id, category: "admin", onConfirm: () => updateVerification(v.id, { history: [...v.history, { action: "Qo'shimcha hujjat so'raldi", by: "Admin", date: "Hozir" }] }) })}>Qo'shimcha ma'lumot</Button>
                    <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Tasdiqlashni rad etish", description: `${v.userName}?`, action: `Tasdiqlash rad etildi: ${v.userName}`, target: v.id, category: "admin", variant: "destructive", confirmLabel: "Rad etish", onConfirm: () => updateVerification(v.id, { status: "rejected" }) })}>Rad etish</Button>
                  </div>
                ) : null },
              ]}
              searchFilter={(v, q) => v.userName.toLowerCase().includes(q)}
              onRowClick={setSelected}
            />

            <Card>
              <CardHeader><CardTitle className="text-base">Shaxsni tasdiqlash hujjatlari</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {active?.documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                    <FileText className="size-4 text-primary" />
                    <div><div className="text-sm font-medium">{d.label}</div><div className="text-xs text-muted-foreground">{d.type}</div></div>
                  </div>
                )) ?? <p className="text-sm text-muted-foreground">Hujjat tanlanmagan</p>}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tarix</div>
                  {active?.history.map((h, i) => (
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
