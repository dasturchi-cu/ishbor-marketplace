import { createFileRoute, notFound } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { useAdminActionDialog } from "@/components/admin/actions";
import { StatusBadge } from "@/components/admin/data-table";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAdminUser, getUserOrders, getUserApplications, getUserReviews, getUserEscrow, loginHistory,
} from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({ meta: [{ title: "User Detail — Ishbor Admin" }] }),
  loader: ({ params }) => {
    const user = getAdminUser(params.id);
    if (!user) throw notFound();
    return { user };
  },
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { user } = Route.useLoaderData();
  const { dialog, confirm } = useAdminActionDialog();
  const userOrders = getUserOrders(user.id);
  const userApps = getUserApplications(user.id);
  const userReviews = getUserReviews(user.id);
  const userEscrow = getUserEscrow(user.id);

  return (
    <AdminShell
      eyebrow="User Management"
      title={user.name}
      onSearchOpen={() => {}}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => confirm({ title: "Verify user", description: `Verify ${user.name}?`, action: `Verified ${user.name}`, target: user.id, category: "user", successMessage: "User verified" })}>Verify</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Activate user", description: `Activate ${user.name}?`, action: `Activated ${user.name}`, target: user.id, category: "user" })}>Activate</Button>
          <Button size="sm" variant="outline" onClick={() => confirm({ title: "Suspend user", description: `Suspend ${user.name}?`, action: `Suspended ${user.name}`, target: user.id, category: "user", confirmLabel: "Suspend" })}>Suspend</Button>
          <Button size="sm" variant="destructive" onClick={() => confirm({ title: "Ban user", description: `Permanently ban ${user.name}?`, action: `Banned ${user.name}`, target: user.id, category: "user", variant: "destructive", confirmLabel: "Ban" })}>Ban</Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <GradientAvatar name={user.name} hue={user.hue} size={56} />
        <div>
          <div className="font-display text-xl font-bold">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={user.role} />
            <StatusBadge status={user.status} />
            {user.verified && <StatusBadge status="approved" />}
          </div>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-4 text-center">
          <div><div className="font-mono text-xs text-muted-foreground">GMV</div><div className="font-display font-bold">${user.gmv.toLocaleString()}</div></div>
          <div><div className="font-mono text-xs text-muted-foreground">Trust</div><div className="font-display font-bold">{user.trustScore}</div></div>
          <div><div className="font-mono text-xs text-muted-foreground">Wallet</div><div className="font-display font-bold">${user.walletBalance.toLocaleString()}</div></div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders ({userOrders.length})</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="login">Login History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
            {[["Role", user.role], ["Joined", user.joined], ["Last active", user.lastActive], ["Orders", String(user.orders)], ["Company", user.company ?? "—"]].map(([k, v]) => (
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
            )) : <p className="py-6 text-center text-sm text-muted-foreground">No orders</p>}
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
            <p className="mt-1 text-sm text-muted-foreground">Available balance</p>
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
            <p className="mt-2 text-sm text-muted-foreground">{user.verified ? "Identity verified" : "Pending verification"}</p>
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
