import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { StatusBadge } from "@/components/admin/data-table";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  getUserOrders, getUserApplications, getUserReviews, getUserEscrow, loginHistory,
} from "@/lib/admin-mock-data";
import {
  getAdminUsers,
  verifyAdminUser,
  activateAdminUser,
  suspendAdminUser,
  banAdminUser,
} from "@/lib/admin-data-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({ meta: [{ title: "Foydalanuvchi tafsilotlari — Ishbor Admin" }] }),
  loader: ({ params }) => {
    const user = getAdminUsers().find((u) => u.id === params.id) ?? null;
    return { user };
  },
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { user } = Route.useLoaderData();
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();

  if (!user) {
    return (
      <EntityNotFound
        title="Foydalanuvchi topilmadi"
        description="Bu foydalanuvchi admin bazasida mavjud emas."
        backTo="/admin/users"
        backLabel="Foydalanuvchilarga qaytish"
        compact
      />
    );
  }

  const userOrders = getUserOrders(user.id);
  const userApps = getUserApplications(user.id);
  const userReviews = getUserReviews(user.id);
  const userEscrow = getUserEscrow(user.id);

  return (
    <AdminShell
      eyebrow="Foydalanuvchi boshqaruvi"
      title={user.name}
      onSearchOpen={onSearchOpen}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => confirm({ title: "Foydalanuvchini tasdiqlash", description: `${user.name}?`, action: `Foydalanuvchi tasdiqlandi: ${user.name}`, target: user.id, category: "user", successMessage: "Foydalanuvchi tasdiqlandi", onConfirm: () => verifyAdminUser(user.id) })}>Tasdiqlash</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Foydalanuvchini faollashtirish", description: `${user.name}?`, action: `Foydalanuvchi faollashtirildi: ${user.name}`, target: user.id, category: "user", onConfirm: () => activateAdminUser(user.id) })}>Faollashtirish</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Foydalanuvchini to'xtatish", description: `${user.name}?`, action: `Foydalanuvchi to'xtatildi: ${user.name}`, target: user.id, category: "user", confirmLabel: "To'xtatish", onConfirm: () => suspendAdminUser(user.id) })}>To'xtatish</Button>
          <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Foydalanuvchini bloklash", description: `${user.name}?`, action: `Foydalanuvchi bloklandi: ${user.name}`, target: user.id, category: "user", variant: "destructive", confirmLabel: "Bloklash", onConfirm: () => banAdminUser(user.id) })}>Bloklash</Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-start">
        <GradientAvatar name={user.name} hue={user.hue} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-bold">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={user.role} />
            <StatusBadge status={user.status} />
            {user.verified && <StatusBadge status="approved" />}
          </div>
        </div>
        <div className="grid w-full grid-cols-3 gap-4 text-center sm:ml-auto sm:w-auto">
          <div><div className="font-mono text-xs text-muted-foreground">GMV</div><div className="font-display font-bold">${user.gmv.toLocaleString()}</div></div>
          <div><div className="font-mono text-xs text-muted-foreground">Ishonch</div><div className="font-display font-bold">{user.trustScore}</div></div>
          <div><div className="font-mono text-xs text-muted-foreground">Hamyon</div><div className="font-display font-bold">${user.walletBalance.toLocaleString()}</div></div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="orders">Buyurtmalar ({userOrders.length})</TabsTrigger>
          <TabsTrigger value="applications">Arizalar</TabsTrigger>
          <TabsTrigger value="wallet">Hamyon</TabsTrigger>
          <TabsTrigger value="escrow">Eskrou</TabsTrigger>
          <TabsTrigger value="reviews">Sharhlar</TabsTrigger>
          <TabsTrigger value="verification">Tasdiqlash</TabsTrigger>
          <TabsTrigger value="login">Kirish tarixi</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
            {[["Rol", user.role], ["Qo'shilgan", user.joined], ["Oxirgi faollik", user.lastActive], ["Buyurtmalar", String(user.orders)], ["Kompaniya", user.company ?? "—"]].map(([k, v]) => (
              <div key={k}><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div><div className="text-sm font-medium">{v}</div></div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card><CardContent className="divide-y divide-border pt-2">
            {userOrders.length ? userOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div><div className="text-sm font-medium">{o.title}</div><div className="text-xs text-muted-foreground">${o.amount.toLocaleString()}</div></div>
                <StatusBadge status={o.status} />
              </div>
            )) : <p className="py-6 text-center text-sm text-muted-foreground">Buyurtmalar yo'q</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card><CardContent className="divide-y divide-border pt-2">
            {userApps.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div><div className="text-sm font-medium">{a.projectTitle}</div><div className="text-xs text-muted-foreground">{a.client}</div></div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card><CardContent className="pt-5">
            <div className="font-display text-3xl font-bold">${user.walletBalance.toLocaleString()}</div>
            <p className="mt-1 text-sm text-muted-foreground">Mavjud balans</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="escrow">
          <Card><CardContent className="divide-y divide-border pt-2">
            {userEscrow.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div><div className="text-sm font-medium">{e.project}</div><div className="text-xs text-muted-foreground">${e.amount.toLocaleString()}</div></div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card><CardContent className="divide-y divide-border pt-2">
            {userReviews.map((r) => (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{r.from}</span><span className="font-mono text-xs">★ {r.rating}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card><CardContent className="pt-5">
            <StatusBadge status={user.verified ? "approved" : "pending"} />
            <p className="mt-2 text-sm text-muted-foreground">{user.verified ? "Shaxs tasdiqlangan" : "Tasdiqlash kutilmoqda"}</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="login">
          <Card><CardContent className="divide-y divide-border pt-2">
            {loginHistory.map((l, i) => (
              <div key={i} className="py-3 text-sm">
                <div className="font-medium">{l.date}</div>
                <div className="text-xs text-muted-foreground">{l.device} · {l.ip} · {l.location}</div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
