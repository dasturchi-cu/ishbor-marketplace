import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { ApplicationStatusBadge } from "@/components/site/trust";
import { ConversionFlowBanner, FREELANCER_HIRE_FLOW } from "@/components/site/conversion-flow";
import { requireAuth } from "@/lib/guards";
import { getApplicationById } from "@/lib/applications-store";
import { EntityNotFound } from "@/components/site/entity-not-found";

export const Route = createFileRoute("/applications/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => {
    const app = getApplicationById(params.id);
    if (!app) throw notFound();
    return { app };
  },
  notFoundComponent: () => (
    <EntityNotFound
      title="Ariza topilmadi"
      description="Bu ariza mavjud emas yoki o'chirilgan."
      backTo="/applications"
      backLabel="Arizalarga qaytish"
      compact
    />
  ),
  component: ApplicationDetailPage,
});

const timelineSteps = [
  { key: "project", label: "Loyiha joylandi" },
  { key: "proposal", label: "Taklif yuborildi" },
  { key: "application", label: "Mijoz ko'rib chiqmoqda" },
  { key: "accepted", label: "Taklif qabul qilindi" },
  { key: "order", label: "Buyurtma va eskrou faol" },
];

function ApplicationDetailPage() {
  const { app } = Route.useLoaderData();

  const stepIndex =
    app.status === "pending" ? 2 :
    app.status === "shortlisted" ? 2 :
    app.status === "accepted" ? 3 :
    app.status === "rejected" ? 2 : 1;

  const currentFlowStep =
    app.status === "accepted" ? "accepted" :
    app.status === "pending" || app.status === "shortlisted" ? "application" : "proposal";

  return (
    <WorkspaceShell eyebrow="Ariza" title={app.projectTitle}>
      <ConversionFlowBanner
        title="Frilanserni yollash yo'li"
        steps={FREELANCER_HIRE_FLOW}
        currentStep={currentFlowStep}
        nextHint={
          app.status === "accepted"
            ? "Taklifingiz qabul qilindi. Mijoz eskrouni moliyalashtiradi va faol buyurtma yaratiladi."
            : app.status === "rejected"
              ? "Bu taklif tanlanmadi. Qayta yuborish uchun boshqa loyihalarni ko'ring."
              : "Mijoz ko'rib chiqishini kuting. Holat o'zgarganda xabar beramiz."
        }
        className="mb-6"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <ApplicationStatusBadge status={app.status} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{app.coverNote}</p>
            {app.deliveryTime && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Yetkazish muddati:</span>{" "}
                <span className="text-muted-foreground">{app.deliveryTime}</span>
              </p>
            )}
            {app.projectSlug && (
              <Link to="/projects/$slug" params={{ slug: app.projectSlug }} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Loyiha e'lonini ko'rish
              </Link>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Holat vaqt chizig'i</h2>
            <div className="mt-4 space-y-3">
              {timelineSteps.map((step, i) => (
                <div key={step.key} className="flex items-center gap-3">
                  <span className={`size-2.5 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  <span className={`text-sm ${i <= stepIndex ? "font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                  {i === 1 && <span className="ml-auto text-xs text-muted-foreground">{app.submittedAgo}</span>}
                  {i === timelineSteps.length - 1 && app.status === "accepted" && (
                    <Link
                      to={app.orderId ? "/orders/$id" : "/orders"}
                      params={app.orderId ? { id: app.orderId } : undefined}
                      className="ml-auto text-xs font-medium text-primary hover:underline"
                    >
                      Buyurtmani ko'rish
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Taklif summasi</div>
            <div className="font-display mt-1 text-2xl font-bold">${(app.proposalAmount ?? app.budget).toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">Byudjet: ${app.budget.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Mijoz</div>
            <div className="flex items-center gap-3">
              <GradientAvatar name={app.client} hue={app.clientHue} size={40} />
              {app.clientSlug ? (
                <Link to="/clients/$company" params={{ company: app.clientSlug }} className="text-sm font-medium text-primary hover:underline">
                  {app.client}
                </Link>
              ) : (
                <span className="text-sm font-medium">{app.client}</span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Keyingi qadam:</span>{" "}
            {app.status === "accepted"
              ? app.orderId
                ? "Buyurtma yaratildi. Mijoz eskrouni moliyalashtirguncha kuting."
                : "Eskrou moliyalashtirilishi va bosqichlar yetkazilishi uchun Buyurtmalarni kuzating."
              : "Mavjud bo'ling — mijozlar ko'pincha 48 soat ichida javob beradi."}
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
