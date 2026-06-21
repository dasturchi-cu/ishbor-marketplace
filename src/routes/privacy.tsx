import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Maxfiylik siyosati — Ishbor" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="eyebrow mb-2">Huquqiy</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Maxfiylik siyosati</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ishbor hisob ma'lumotlari, loyiha muloqotlari va to'lov metadatasini bozorni ishlatish hamda eskrou
          tranzaksiyalarini himoya qilish uchun to'playdi. Shaxsiy ma'lumotlaringizni sotmaymiz. Shaxsni
          tasdiqlash hujjatlari shifrlanadi va faqat ishonch hamda muvofiqlik maqsadida ishlatiladi.
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">Saqlash:</strong> ma'lumotlar xavfsiz serverlarda saqlanadi.
          </li>
          <li>
            <strong className="text-foreground">Uchinchi tomon:</strong> to'lov provayderlari faqat tranzaksiya
            uchun zarur ma'lumot oladi.
          </li>
          <li>
            <strong className="text-foreground">Huquqlaringiz:</strong> ma'lumotlaringizni ko'rish yoki
            o'chirishni so'rashingiz mumkin.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ma'lumotlarni eksport qilish yoki o'chirishni so'rash uchun email yuboring{" "}
          <a href="mailto:privacy@ishbor.uz" className="font-medium text-primary hover:underline">
            privacy@ishbor.uz
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
