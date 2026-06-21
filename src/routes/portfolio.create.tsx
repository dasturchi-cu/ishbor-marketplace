import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { actionFeedback } from "@/lib/action-feedback";
import { ChevronLeft } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { AuthGate } from "@/components/auth/auth-gate";
import { FreelancerOnlyGate } from "@/components/portfolio/freelancer-only-gate";
import { useAuth } from "@/hooks/use-auth";
import {
  createEmptyFormInput,
  savePortfolioDraft,
  publishPortfolio,
  type PortfolioFormInput,
} from "@/lib/portfolio-store";

export const Route = createFileRoute("/portfolio/create")({
  head: () => ({
    meta: [
      { title: "Portfolio yaratish — Ishbor" },
      { name: "description", content: "Keys stadiya va metrikalar bilan portfolio loyihasi qo'shing." },
    ],
  }),
  component: YaratishPortfolioPage,
});

function YaratishPortfolioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthGate>
    <FreelancerOnlyGate
      title="Frilanser hisobi talab qilinadi"
      description="Faqat frilanserlar portfolio loyihalarini yaratishi va boshqarishi mumkin."
      redirectPath="/portfolio/create"
    >
      <YaratishPortfolioForm user={user!} navigate={navigate} />
    </FreelancerOnlyGate>
    </AuthGate>
  );
}

function YaratishPortfolioForm({
  user,
  navigate,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [input, setInput] = useState<PortfolioFormInput>(() =>
    createEmptyFormInput(user.avatarHue ?? 250),
  );

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
      actionFeedback.error("Qoralama saqlash uchun loyiha nomi talab qilinadi.");
      return;
    }
    const item = savePortfolioDraft(input, ctx);
    actionFeedback.draftSaved("Portfel qoralamasi", {
      listHint: "Portfel → Qoralama",
      onViewList: () => navigate({ to: "/portfolio", search: { tab: "draft" } }),
    });
    navigate({ to: "/portfolio/edit/$slug", params: { slug: item.slug } });
  };

  const handlePublish = () => {
    if (!isValid) {
      actionFeedback.error("Joylashdan oldin barcha majburiy maydonlarni to'ldiring.");
      return;
    }
    const item = publishPortfolio(input, ctx);
    actionFeedback.published("Portfolio", "Ommaviy ro'yxat uchun admin tasdig'i kutilmoqda.");
    navigate({ to: "/portfolio/$slug", params: { slug: item.slug } });
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
          <span>Yaratish</span>
        </nav>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Portfolio yaratish</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keys stadiyalar, metrikalar va loyiha havolalari bilan eng yaxshi ishingizni namoyish eting.
        </p>
        <div className="mt-8">
          <PortfolioForm
            input={input}
            onChange={setInput}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isValid={!!isValid}
          />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
