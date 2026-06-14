import { Link } from "@tanstack/react-router";
import { Banknote, Percent, Sparkles, ArrowUpRight } from "lucide-react";

const feeItems = [
  {
    icon: Percent,
    title: "Platform komissiyasi",
    value: "5%",
    body: "Har bir muvaffaqiyatli checkout'dan. Frilanser to'liq summani oladi — komissiya alohida.",
  },
  {
    icon: Banknote,
    title: "Frilanser obunasi",
    value: "99 000 so'm/oy",
    body: "Pro rejasi — cheksiz takliflar, ajratilgan profil va kengaytirilgan analitika.",
  },
  {
    icon: Sparkles,
    title: "Ajratilgan ro'yxat",
    value: "100 000 so'm",
    body: "7 kun davomida yuqori ko'rinish. Elite rejada 20% chegirma.",
  },
];

export function FeeTransparencySection() {
  return (
    <section className="section-y border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <div className="eyebrow mb-2">Shaffof narxlar</div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Yashirin to'lovlar yo'q</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Barcha komissiyalar oldindan ko'rinadi. Ishbor faqat muvaffaqiyatli tranzaksiyadan daromad oladi.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {feeItems.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <div className="font-display mt-4 text-2xl font-bold text-primary">{item.value}</div>
              <h3 className="mt-1 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Barcha tariflar <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
