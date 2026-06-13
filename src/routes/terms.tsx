import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Foydalanish shartlari — Ishbor" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="eyebrow mb-2">Legal</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Foydalanish shartlari</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ishbor Marketplace connects clients and freelancers across Central Asia with escrow-protected payments.
          By using Ishbor you agree to our marketplace rules, milestone-based delivery standards, and dispute
          resolution process. Funds are held in escrow until work is approved.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ushbu shartlar bo'yicha savollar uchun murojaat qiling{" "}
          <a href="mailto:legal@ishbor.uz" className="font-medium text-primary hover:underline">
            legal@ishbor.uz
          </a>
          .
        </p>
        <Link to="/" className="mt-8 inline-flex text-sm font-medium text-primary hover:underline">
          ← Bosh sahifaga
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
