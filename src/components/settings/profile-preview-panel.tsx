import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import { VerifiedIdentityBadge } from "@/components/site/trust";
import { ReputationBadge } from "@/components/reputation/reputation-badge";
import type { AuthUser } from "@/lib/auth";
import type { ReputationTier } from "@/lib/reputation-store";
import { PortfolioCover } from "@/components/portfolio/portfolio-preview-card";

export function ProfilePreviewPanel({
  user,
  headline,
  completionPercent,
  tier,
}: {
  user: AuthUser;
  headline: string;
  completionPercent: number;
  tier?: ReputationTier;
}) {
  const username = user.username ?? user.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20);
  const profilePath =
    user.userType === "freelancer" && user.username
      ? `/freelancers/${user.username}`
      : user.companySlug
        ? `/clients/${user.companySlug}`
        : "/profile";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <PortfolioCover hue={user.avatarHue} aspect="aspect-[3/1]" className="rounded-none" />
      <div className="relative px-4 pb-4">
        <div className="-mt-8">
          <GradientAvatar name={user.fullName} hue={user.avatarHue} size={64} rounded="rounded-xl" className="border-4 border-card" />
        </div>
        <h3 className="font-display mt-3 text-base font-semibold">{user.fullName}</h3>
        {headline && <p className="text-xs text-primary">{headline}</p>}
        <p className="text-xs text-muted-foreground">@{username}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {user.verified && <VerifiedIdentityBadge />}
          {tier && <ReputationBadge tier={tier} />}
        </div>
        {user.bio && (
          <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{user.bio}</p>
        )}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Profil to'ldirilishi</span>
            <span className="font-semibold text-foreground">{completionPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
        <Link
          to={profilePath}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ommaviy profil <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
