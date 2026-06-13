import { createFileRoute } from "@tanstack/react-router";

import { useState, useSyncExternalStore } from "react";

import { AdminShell } from "@/components/admin/shell";

import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";

import { useAdminActionDialog } from "@/components/admin/actions";

import { useAdminSearchOpen } from "@/components/admin/search";

import { GradientAvatar } from "@/components/site/avatar";

import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { subscribeAdminData, getAdminDisputes, updateDispute, adminReleaseEscrowByOrder, adminRefundEscrowByOrder } from "@/lib/admin-data-store";

import type { Dispute } from "@/lib/admin-mock-data";



const EMPTY: Dispute[] = [];



export const Route = createFileRoute("/admin/disputes")({

  head: () => ({ meta: [{ title: "Nizo markazi — Ishbor Admin" }] }),

  component: AdminDisputesPage,

});



function AdminDisputesPage() {

  const { onSearchOpen } = useAdminSearchOpen();

  const { dialog, confirm } = useAdminActionDialog();

  const [tab, setTab] = useState("open");

  const disputes = useSyncExternalStore(subscribeAdminData, getAdminDisputes, () => EMPTY);

  const filtered = disputes.filter((d) => d.status === tab);



  return (

    <AdminShell eyebrow="Nizo markazi" title="Nizolar" onSearchOpen={onSearchOpen}>

      <Tabs value={tab} onValueChange={setTab}>

        <TabsList className="mobile-scroll-x h-auto w-full flex-nowrap overflow-x-auto">

          <TabsTrigger value="open">Ochiq</TabsTrigger>

          <TabsTrigger value="pending">Kutilmoqda</TabsTrigger>

          <TabsTrigger value="closed">Yopilgan</TabsTrigger>

        </TabsList>

        <TabsContent value={tab}>

          <AdminDataTable

            data={filtered}

            columns={[

              { key: "project", header: "Loyiha", cell: (d) => <span className="text-sm font-medium">{d.project}</span> },

              { key: "parties", header: "Tomonlar", cell: (d) => (

                <div className="flex items-center gap-2 text-xs">

                  <GradientAvatar name={d.client} hue={d.clientHue} size={20} />

                  <span>va</span>

                  <GradientAvatar name={d.freelancer} hue={d.freelancerHue} size={20} />

                </div>

              )},

              { key: "amount", header: "Summa", cell: (d) => <span className="font-mono">${d.amount.toLocaleString()}</span> },

              { key: "reason", header: "Sabab", cell: (d) => <span className="text-xs text-muted-foreground">{d.reason}</span> },

              { key: "status", header: "Holat", cell: (d) => <StatusBadge status={d.status} /> },

              { key: "actions", header: "", className: "text-right", cell: (d) => (

                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>

                  <Button size="sm" onClick={() => confirm({ title: "Nizoni hal qilish", description: `"${d.project}" nizosi hal qilinsinmi?`, action: `Nizo hal qilindi ${d.id}`, target: d.id, category: "escrow", successMessage: "Nizo hal qilindi", onConfirm: () => updateDispute(d.id, { status: "closed" }) })}>Hal qilish</Button>

                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Mijozga qaytarish", description: `"${d.project}" uchun mijozga qaytarilsinmi?`, action: `Nizoda mijozga qaytarildi ${d.id}`, target: d.id, category: "escrow", onConfirm: () => { adminRefundEscrowByOrder(d.orderId); updateDispute(d.id, { status: "closed" }); } })}>Mijozga qaytarish</Button>

                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Frilanserga to'lash", description: `"${d.project}" uchun frilanserga to'lansinmi?`, action: `Nizoda frilanserga to'landi ${d.id}`, target: d.id, category: "escrow", onConfirm: () => { adminReleaseEscrowByOrder(d.orderId); updateDispute(d.id, { status: "closed" }); } })}>To'lash</Button>

                  <Button size="sm" variant="outline" onClick={() => confirm({ title: "Bo'lib to'lash", description: "Tomonlar o'rtasida 50/50 bo'lib to'lansinmi?", action: `Nizo bo'yicha bo'lib to'landi ${d.id}`, target: d.id, category: "escrow", onConfirm: () => updateDispute(d.id, { status: "closed", assignedTo: "Split 50/50" }) })}>Bo'lib to'lash</Button>

                  <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Nizoni yuqoriga ko'tarish", description: "Huquqiy jamoaga yuborilsinmi?", action: `Nizo yuqoriga ko'tarildi ${d.id}`, target: d.id, category: "escrow", onConfirm: () => updateDispute(d.id, { status: "pending", assignedTo: "Legal" }) })}>Yuqoriga ko'tarish</Button>

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

