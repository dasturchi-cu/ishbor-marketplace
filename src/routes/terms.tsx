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
        <div className="eyebrow mb-2">Huquqiy</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Foydalanish shartlari</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ishbor Markaziy Osiyo bo'ylab mijozlar va frilanserlarni eskrou himoyasi bilan bog'laydigan bozor
          platformasidir. Ishbor'dan foydalanish orqali siz bozor qoidalarimiz, bosqichma-bosqich topshirish
          standartlari va nizo hal qilish tartibiga rozilik bildirasiz. Mablag'lar ish tasdiqlanguncha eskrouda
          saqlanadi.
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">Eskrou:</strong> to'lovlar ish tasdiqlanguncha platformada
            ushlab turiladi.
          </li>
          <li>
            <strong className="text-foreground">Komissiya:</strong> muvaffaqiyatli tranzaksiyadan 5% platform
            to'lovi olinadi.
          </li>
          <li>
            <strong className="text-foreground">Nizo:</strong> tomonlar kelisha olmasa, Ishbor arbitraj jamoasi
            24–72 soat ichida ko'rib chiqadi.
          </li>
        </ul>
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
