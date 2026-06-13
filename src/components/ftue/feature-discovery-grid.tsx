import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Users,
  Sparkles,
  Images,
  Heart,
  Wallet,
  Crown,
  Megaphone,
  Bell,
  Building2,
} from "lucide-react";
import type { UserType } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

type FeatureLink = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: UserType[];
  agencyOnly?: boolean;
};

const FEATURES: FeatureLink[] = [
  {
    to: "/clients/manage",
    label: "Frilanserlar CRM",
    description: "Yollash va aloqa",
    icon: Users,
    roles: ["client"],
  },
  {
    to: "/freelancers/manage",
    label: "Mijozlar CRM",
    description: "Mijozlar bazasi",
    icon: Users,
    roles: ["freelancer"],
  },
  {
    to: "/analytics/client",
    label: "Analitika",
    description: "Xarajat tahlili",
    icon: BarChart3,
    roles: ["client"],
  },
  {
    to: "/analytics/freelancer",
    label: "Analitika",
    description: "Daromad tahlili",
    icon: BarChart3,
    roles: ["freelancer"],
  },
  {
    to: "/ai",
    label: "AI Markaz",
    description: "Yordamchi vositalar",
    icon: Sparkles,
    roles: ["client", "freelancer"],
  },
  {
    to: "/portfolio",
    label: "Portfel",
    description: "Ish namunalari",
    icon: Images,
    roles: ["freelancer"],
  },
  {
    to: "/saved",
    label: "Saqlangan",
    description: "Sevimli ishlar",
    icon: Heart,
    roles: ["client", "freelancer"],
  },
  {
    to: "/wallet",
    label: "Hamyon",
    description: "To'lov va eskrou",
    icon: Wallet,
    roles: ["client", "freelancer"],
  },
  {
    to: "/subscription",
    label: "Obuna",
    description: "Tarif va kreditlar",
    icon: Crown,
    roles: ["client", "freelancer"],
  },
  {
    to: "/promotions",
    label: "Rivojlantirish",
    description: "Ko'rinish oshirish",
    icon: Megaphone,
    roles: ["client", "freelancer"],
  },
  {
    to: "/notifications",
    label: "Bildirishnomalar",
    description: "Yangiliklar markazi",
    icon: Bell,
    roles: ["client", "freelancer"],
  },
  {
    to: "/dashboard/agency",
    label: "Agentlik paneli",
    description: "Jamoa boshqaruvi",
    icon: Building2,
    roles: ["client", "freelancer"],
    agencyOnly: true,
  },
];

export function FeatureDiscoveryGrid({
  role,
  hasAgency = false,
  compact = false,
}: {
  role: UserType;
  hasAgency?: boolean;
  compact?: boolean;
}) {
  const items = FEATURES.filter((f) => {
    if (!f.roles.includes(role)) return false;
    if (f.agencyOnly && !hasAgency) return false;
    return true;
  }).slice(0, compact ? 6 : 8);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Tez kirish · 1-2 bosish
          </div>
          <h3 className="font-display mt-1 text-base font-semibold">Asosiy funksiyalar</h3>
        </div>
      </div>
      <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-surface/50 p-3 transition-default hover:border-primary/25 hover:bg-primary/5 hover:shadow-sm"
          >
            <item.icon className="size-4 text-primary" />
            <div>
              <div className="text-sm font-semibold leading-tight group-hover:text-primary">{item.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
