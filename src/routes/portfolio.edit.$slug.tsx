import { createFileRoute, Link, useNavigate, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { actionFeedback } from "@/lib/action-feedback";
import { ChevronLeft } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { AuthGate } from "@/components/auth/auth-gate";
import { FreelancerOnlyGate } from "@/components/portfolio/freelancer-only-gate";
import { getSession } from "@/lib/auth";
import { getActiveRole } from "@/lib/active-role-store";
import { useAuth } from "@/hooks/use-auth";
import {
  getPortfolioBySlug,
  getStoredPortfolios,
  savePortfolioDraft,
  publishPortfolio,
  portfolioToFormInput,
  type PortfolioFormInput,
} from "@/lib/portfolio-store";
import type { PortfolioItem } from "@/lib/portfolio-types";

export const Route = createFileRoute("/portfolio/edit/$slug")({
  beforeLoad: (ctx) => {
    const session = getSession();
    if (!session || getActiveRole() !== "freelancer") {
      return;
    }
    const stored = getStoredPortfolios().find((p) => p.slug === ctx.params.slug);
    if (!stored || stored.ownerUserId !== session.user.id) {
      throw redirect({ to: "/portfolio" });
    }
  },
  loader: ({ params }) => {
    const item = getPortfolioBySlug(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.item?.title ?? "Portfolio"}ni tahrirlash — Ishbor` }],
  }),
  component: TahrirlashPortfolioPage,
});

function TahrirlashPortfolioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { item } = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <AuthGate>
    <FreelancerOnlyGate
      title="Frilanser hisobi talab qilinadi"
      description="Faqat frilanserlar portfolio loyihalarini tahrirlashi mumkin."
      redirectPath={`/portfolio/edit/${slug}`}
    >
      <TahrirlashPortfolioForm user={user!} navigate={navigate} item={item} slug={slug} />
    </FreelancerOnlyGate>
    </AuthGate>
  );
}

function TahrirlashPortfolioForm({
  user,
  navigate,
  item,
  slug,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  navigate: ReturnType<typeof useNavigate>;
  item: PortfolioItem;
  slug: string;
}) {
  const [input, setInput] = useState<PortfolioFormInput>(() => portfolioToFormInput(item));

  const ctx = {
    ownerUserId: user.id,
    freelancerUsername: user.username ?? user.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20),
    freelancerName: user.fullName,
    freelancerHue: user.avatarHue,
  };

  const isValid =
    input.title.trim() &&
    input.category &&
    input.description.trim() &&
    input.duration.trim() &&
    input.teamSize.trim() &&
    input.budgetRange.trim() &&
    input.skills.length > 0;

  const handleSaveDraft = () => {
    if (!input.title.trim()) {
      actionFeedback.error("Loyiha nomi talab qilinadi.");
      return;
    }
    savePortfolioDraft(input, ctx, slug);
    actionFeedback.draftSaved("Portfel qoralamasi", {
      listHint: "Portfel → Qoralama",
      onViewList: () => navigate({ to: "/portfolio", search: { tab: "draft" } }),
    });
  };

  const handlePublish = () => {
    if (!isValid) {
      actionFeedback.error("Barcha majburiy maydonlarni to'ldiring.");
      return;
    }
    publishPortfolio(input, ctx, slug);
    actionFeedback.updated("Portfolio");
    navigate({ to: "/portfolio/$slug", params: { slug } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/portfolio" className="flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="size-3" /> Portfolio
          </Link>
          <span>/</span>
          <span>Tahrirlash</span>
        </nav>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Portfolioni tahrirlash</h1>
        <p className="mt-2 text-sm text-muted-foreground">{item.title}</p>
        <div className="mt-8">
          <PortfolioForm
            input={input}
            onChange={setInput}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isEdit
            isValid={!!isValid}
          />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
