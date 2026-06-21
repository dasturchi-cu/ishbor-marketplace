import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  CreditCard,
  HelpCircle,
  Mail,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Yordam markazi — Ishbor" },
      { name: "description", content: "Ishbor bo'yicha tez-tez so'raladigan savollar, eskrou, to'lov va hisob yordami." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "Eskrou qanday ishlaydi?",
    a: "Mijoz to'lovni eskrouga o'tkazadi. Frilanser ishni topshirgach, mijoz tasdiqlaydi — shundan keyin mablag' frilanser hamyoniga o'tadi. Nizo bo'lsa, Ishbor arbitraj qiladi.",
  },
  {
    q: "Platform komissiyasi qancha?",
    a: "Muvaffaqiyatli checkout'dan 5% platform komissiyasi olinadi. Barcha narxlar checkout sahifasida oldindan ko'rsatiladi.",
  },
  {
    q: "Qanday to'lash mumkin?",
    a: "Humo, Uzcard va xalqaro kartalar qo'llab-quvvatlanadi. Hamyon orqali depozit qiling yoki to'g'ridan-to'g'ri checkout'da to'lang.",
  },
  {
    q: "Frilanser sifatida qanday ish topaman?",
    a: "Profil va portfel yarating, loyihalarga taklif yuboring yoki xizmat paketlari e'lon qiling. Mos loyihalar dashboard'da tavsiya qilinadi.",
  },
  {
    q: "Hisobni qanday tasdiqlash mumkin?",
    a: "Sozlamalar → Tasdiqlash bo'limida shaxs yoki biznes hujjatlarini yuklang. Admin jamoasi 24–48 soat ichida ko'rib chiqadi.",
  },
];

const quickLinks = [
  { to: "/pricing", label: "Tariflar", icon: CreditCard },
  { to: "/projects/preview", label: "Loyiha rejasini tuzish", icon: BookOpen },
  { to: "/freelancers", label: "Mutaxassis topish", icon: Users },
  { to: "/login", label: "Eskrou markazi", icon: ShieldCheck, search: { redirect: "/escrow" } },
] as const;

function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="eyebrow mb-2">Yordam</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Yordam markazi</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ishbor bo'yicha tez-tez so'raladigan savollar va keyingi qadamlar. Javob topa olmasangiz, biz bilan bog'laning.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={"search" in item ? item.search : undefined}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/25 hover:shadow-sm"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-default group-hover:text-primary" />
            </Link>
          ))}
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Tez-tez so'raladigan savollar</h2>
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card open:border-primary/20 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <HelpCircle className="size-4 shrink-0 text-primary" />
                {item.q}
              </summary>
              <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-primary/15 bg-primary/[0.04] p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="size-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Yordam kerakmi?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Savolingizni yuboring — odatda 24 soat ichida javob beramiz.
              </p>
              <a
                href="mailto:support@ishbor.uz"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-95"
              >
                <Mail className="size-4" />
                support@ishbor.uz
              </a>
            </div>
          </div>
        </section>

        <Link to="/" className="mt-8 inline-flex text-sm font-medium text-primary hover:underline">
          ← Bosh sahifaga
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
