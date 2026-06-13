import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subscribeOrders, getAllOrders, updateOrderStatus } from "@/lib/orders-store";
import { orders as seedOrders } from "@/lib/mock-data";
import type { Order } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Buyurtma boshqaruvi — Ishbor Admin" }] }),
  component: AdminOrdersPage,
});

const TABS = [
  { value: "active", label: "Faol", filter: (s: string) => ["in_progress", "revision"].includes(s) },
  { value: "review", label: "Ko'rib chiqilmoqda", filter: (s: string) => s === "review" },
  { value: "completed", label: "Yakunlangan", filter: (s: string) => s === "completed" },
  { value: "cancelled", label: "Bekor qilingan", filter: (s: string) => s === "cancelled" },
  { value: "disputed", label: "Nizoli", filter: (s: string) => s === "disputed" },
];

function AdminOrdersPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const [tab, setTab] = useState("active");
  const orders = useSyncExternalStore(subscribeOrders, getAllOrders, () => seedOrders);
  const current = TABS.find((t) => t.value === tab)!;
  const filtered = orders.filter((o) => current.filter(o.status));

  return (
    <AdminShell eyebrow="Buyurtma boshqaruvi" title="Buyurtmalar" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mobile-scroll-x h-auto w-full flex-nowrap overflow-x-auto">{TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              { key: "title", header: "Buyurtma", cell: (o) => <span className="text-sm font-medium">{o.title}</span> },
              { key: "client", header: "Mijoz", cell: (o) => <div className="flex items-center gap-2"><GradientAvatar name={o.client} hue={o.clientHue} size={24} /><span className="text-sm">{o.client}</span></div> },
              { key: "freelancer", header: "Frilanser", cell: (o) => o.freelancer },
              { key: "amount", header: "Summa", cell: (o) => <span className="font-mono">${o.amount.toLocaleString()}</span> },
              { key: "status", header: "Holat", cell: (o) => <StatusBadge status={o.status} /> },
              { key: "actions", header: "", className: "text-right", cell: (o) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => confirm({ title: "Majburiy yakunlash", description: `"${o.title}" majburiy yakunlansinmi?`, action: `Buyurtma majburiy yakunlandi ${o.id}`, target: o.id, category: "admin", onConfirm: () => updateOrderStatus(o.id, "completed") })}>Yakunlash</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Buyurtmani pauza qilish", description: `"${o.title}" pauza qilinsinmi?`, action: `Buyurtma pauza qilindi ${o.id}`, target: o.id, category: "admin", onConfirm: () => updateOrderStatus(o.id, "revision") })}>Pauza</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Buyurtmani bekor qilish", description: `"${o.title}" bekor qilinsinmi?`, action: `Buyurtma bekor qilindi ${o.id}`, target: o.id, category: "admin", variant: "destructive", confirmLabel: "Bekor qilish", onConfirm: () => updateOrderStatus(o.id, "cancelled") })}>Bekor qilish</Button>
                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Buyurtmani yuqoriga ko'tarish", description: `"${o.title}" katta administratorga yuborilsinmi?`, action: `Buyurtma yuqoriga ko'tarildi ${o.id}`, target: o.id, category: "admin", onConfirm: () => updateOrderStatus(o.id, "disputed") })}>Yuqoriga ko'tarish</Button>
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
