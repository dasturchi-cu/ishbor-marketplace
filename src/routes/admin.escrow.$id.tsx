import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { CheckCircle2, CircleAlert, Lock, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { useAdminActionDialog } from "@/components/admin/actions";
import { StatusBadge } from "@/components/admin/data-table";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEscrowWorkflow } from "@/lib/mock-data";
import { adminFreezeEscrow, adminReleaseEscrow, adminRefundEscrow } from "@/lib/admin-data-store";
import { getEscrowWorkflowById, subscribeEscrow } from "@/lib/escrow-store";
import { getAuditLog } from "@/lib/admin-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

export const Route = createFileRoute("/admin/escrow/$id")({
  head: () => ({ meta: [{ title: "Eskrou tafsilotlari — Ishbor Admin" }] }),
  loader: ({ params }) => {
    const escrow = getEscrowWorkflowById(params.id) ?? getEscrowWorkflow(params.id) ?? null;
    return { escrow };
  },
  component: AdminEscrowDetailPage,
});

const CHAT = [
  { from: "Asaka Capital", hue: 215, msg: "Bosqich yaxshi ko'rinadi. Ko'rib chiqishga tayyor.", time: "12-iyun" },
  { from: "Nargiza Akhmedova", hue: 250, msg: "Prototip fayllari yuborildi. Tasdiqlash kutilmoqda.", time: "11-iyun" },
  { from: "Tizim", hue: 250, msg: "Eskrou to'ldirildi — $6,000", time: "30-may" },
];

function AdminEscrowDetailPage() {
  const { id } = Route.useParams();
  const { escrow: loaderEscrow } = Route.useLoaderData();
  const escrow = useSyncExternalStore(
    subscribeEscrow,
    () => getEscrowWorkflowById(id) ?? loaderEscrow,
    () => loaderEscrow,
  );
  const { dialog, confirm } = useAdminActionDialog();

  if (!escrow) {
    return (
      <EntityNotFound
        title="Eskrou topilmadi"
        description="Bu eskrou admin bazasida mavjud emas."
        backTo="/admin/escrow"
        backLabel="Eskrou ro'yxatiga qaytish"
        compact
      />
    );
  }

  const audit = getAuditLog().filter((a) => a.target === escrow.id || a.category === "escrow").slice(0, 8);
  const fundedMilestone = escrow.milestones.find((m) => m.status === "funded");

  return (
    <AdminShell
      eyebrow="Eskrou boshqaruv markazi"
      title={escrow.project}
      onSearchOpen={() => {}}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => confirm({ title: "Mablag' chiqarish", description: `$${escrow.amount.toLocaleString()} chiqarilsinmi?`, action: `Eskrou mablag'i chiqarildi ${escrow.id}`, target: escrow.id, category: "escrow", onConfirm: () => { if (fundedMilestone) adminReleaseEscrow(escrow.id, fundedMilestone.label); } })}>Mablag' chiqarish</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Eskrouni muzlatish", description: "Barcha eskrou mablag'lari muzlatilsinmi?", action: `Eskrou muzlatildi ${escrow.id}`, target: escrow.id, category: "escrow", onConfirm: () => adminFreezeEscrow(escrow.id) })}>Muzlatish</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Mijozga qaytarish", description: "To'liq summa mijozga qaytarilsinmi?", action: `Mijozga qaytarildi ${escrow.id}`, target: escrow.id, category: "escrow", onConfirm: () => adminRefundEscrow(escrow.id) })}>Mijozga qaytarish</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Frilanserga to'lash", description: "Mablag' frilanserga chiqarilsinmi?", action: `Frilanserga to'landi ${escrow.id}`, target: escrow.id, category: "escrow", onConfirm: () => { if (fundedMilestone) adminReleaseEscrow(escrow.id, fundedMilestone.label); } })}>Frilanserga to'lash</Button>
          <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Tekshiruv ochish", description: "Rasmiy tekshiruv ochilsinmi?", action: `Tekshiruv ochildi ${escrow.id}`, target: escrow.id, category: "escrow", onConfirm: () => adminFreezeEscrow(escrow.id) })}>Tekshirish</Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <Lock className="size-5 text-primary" />
        <div>
          <div className="font-display text-2xl font-bold">${escrow.amount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{escrow.client} → {escrow.freelancer}</div>
        </div>
        <StatusBadge status={escrow.status} />
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Vaqt chizig'i</TabsTrigger>
          <TabsTrigger value="milestones">Bosqichlar</TabsTrigger>
          <TabsTrigger value="chat">Chat tarixi</TabsTrigger>
          <TabsTrigger value="audit">Audit izi</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card><CardContent className="pt-5">
            <div className="space-y-4">
              {escrow.timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  {t.done ? <CheckCircle2 className="size-4 text-success" /> : <div className="size-4 rounded-full border-2 border-border" />}
                  <div className="flex-1 text-sm">{t.step}</div>
                  <div className="font-mono text-xs text-muted-foreground">{t.date}</div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card><CardContent className="divide-y divide-border pt-2">
            {escrow.milestones.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  {m.status === "released" ? <CheckCircle2 className="size-4 text-success" /> : m.status === "disputed" ? <CircleAlert className="size-4 text-destructive" /> : <Lock className="size-4 text-primary" />}
                  <span className="text-sm">{m.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">${m.amount.toLocaleString()}</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card><CardContent className="space-y-3 pt-5">
            {CHAT.map((c, i) => (
              <div key={i} className="flex gap-3">
                <GradientAvatar name={c.from} hue={c.hue} size={28} />
                <div className="flex-1 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                  <div className="text-xs font-medium">{c.from}</div>
                  <div className="text-sm">{c.msg}</div>
                  <div className="font-mono mt-1 text-[10px] text-muted-foreground">{c.time}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquare className="size-3.5" /> Faqat platforma xabarlari</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card><CardContent className="divide-y divide-border pt-2">
            {audit.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div><span className="font-medium">{a.who}</span> — {a.what}</div>
                <span className="font-mono text-xs text-muted-foreground">{a.when}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
