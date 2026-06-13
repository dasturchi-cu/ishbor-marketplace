import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, Lock, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { useAdminActionDialog } from "@/components/admin/actions";
import { StatusBadge } from "@/components/admin/data-table";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEscrowWorkflow } from "@/lib/mock-data";
import { getAuditLog } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/escrow/$id")({
  head: () => ({ meta: [{ title: "Escrow Detail — Ishbor Admin" }] }),
  loader: ({ params }) => {
    const escrow = getEscrowWorkflow(params.id);
    if (!escrow) throw notFound();
    return { escrow };
  },
  component: AdminEscrowDetailPage,
});

const CHAT = [
  { from: "Asaka Capital", hue: 215, msg: "Milestone looks good. Ready for review.", time: "Jun 12" },
  { from: "Nargiza Akhmedova", hue: 250, msg: "Submitted prototype files. Awaiting approval.", time: "Jun 11" },
  { from: "System", hue: 250, msg: "Escrow funded — $6,000", time: "May 30" },
];

function AdminEscrowDetailPage() {
  const { escrow } = Route.useLoaderData();
  const { dialog, confirm } = useAdminActionDialog();
  const audit = getAuditLog().filter((a) => a.target === escrow.id || a.category === "escrow").slice(0, 8);

  return (
    <AdminShell
      eyebrow="Escrow Command Center"
      title={escrow.project}
      onSearchOpen={() => {}}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => confirm({ title: "Release funds", description: `Release $${escrow.amount.toLocaleString()}?`, action: `Released escrow ${escrow.id}`, target: escrow.id, category: "escrow" })}>Release Funds</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Freeze escrow", description: "Freeze all escrow funds?", action: `Froze escrow ${escrow.id}`, target: escrow.id, category: "escrow" })}>Freeze</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Refund client", description: "Refund full amount to client?", action: `Refunded client for ${escrow.id}`, target: escrow.id, category: "escrow" })}>Refund Client</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Pay freelancer", description: "Release funds to freelancer?", action: `Paid freelancer for ${escrow.id}`, target: escrow.id, category: "escrow" })}>Pay Freelancer</Button>
          <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Open investigation", description: "Open formal investigation?", action: `Opened investigation ${escrow.id}`, target: escrow.id, category: "escrow" })}>Investigate</Button>
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
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="chat">Chat History</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquare className="size-3.5" /> Platform messaging only</div>
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
