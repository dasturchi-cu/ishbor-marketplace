import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Lock, BadgeCheck, Images, Star } from "lucide-react";
import { InlineBanner } from "@/components/site/feedback";

type TrustTopic = "escrow" | "verification" | "portfolio" | "reviews";

const TRUST_CONTENT: Record<
  TrustTopic,
  { icon: LucideIcon; title: string; body: string; href: string; cta: string }
> = {
  escrow: {
    icon: Lock,
    title: "Eskrou nima uchun muhim?",
    body: "Mablag'lar faqat ish tasdiqlangandan keyin chiqariladi. Bu sizni va frilanserni himoya qiladi.",
    href: "/escrow",
    cta: "Eskrou haqida",
  },
  verification: {
    icon: BadgeCheck,
    title: "Tasdiqlash nima beradi?",
    body: "Shaxs va kompaniya tekshiruvi ishonchni oshiradi va yuqori darajadagi loyihalarga kirish imkonini beradi.",
    href: "/settings",
    cta: "Tasdiqlash markazi",
  },
  portfolio: {
    icon: Images,
    title: "Portfel nima uchun kerak?",
    body: "Haqiqiy natijalar ko'rsatilgan portfel mijozlarning 3 barobar ko'proq murojaat qilishiga olib keladi.",
    href: "/portfolio/create",
    cta: "Portfel yaratish",
  },
  reviews: {
    icon: Star,
    title: "Sharhlar nima beradi?",
    body: "Yakunlangan ishlar bo'yicha sharhlar keyingi buyurtmalarda ishonchni oshiradi va reytingingizni ko'taradi.",
    href: "/settings",
    cta: "Profilni ko'rish",
  },
};

export function TrustTip({ topic, className }: { topic: TrustTopic; className?: string }) {
  const content = TRUST_CONTENT[topic];
  return (
    <InlineBanner variant="info" icon={content.icon} className={className}>
      <span className="font-semibold">{content.title}</span>{" "}
      {content.body}{" "}
      <Link to={content.href} className="font-medium text-primary hover:underline">
        {content.cta} →
      </Link>
    </InlineBanner>
  );
}
