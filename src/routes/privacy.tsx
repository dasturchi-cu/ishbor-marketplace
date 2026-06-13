import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Ishbor" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="eyebrow mb-2">Legal</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ishbor collects account information, project communications, and payment metadata to operate the
          marketplace and protect escrow transactions. We do not sell personal data. Identity verification
          documents are encrypted and used only for trust and compliance purposes.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          You can request data export or deletion by emailing{" "}
          <a href="mailto:privacy@ishbor.uz" className="font-medium text-primary hover:underline">
            privacy@ishbor.uz
          </a>
          .
        </p>
        <Link to="/" className="mt-8 inline-flex text-sm font-medium text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
