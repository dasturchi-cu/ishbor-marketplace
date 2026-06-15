import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import { VerifiedIdentityBadge } from "@/components/site/trust";
import { ReputationBadge } from "@/components/reputation/reputation-badge";
import type { AuthUser } from "@/lib/auth";
import type { ReputationTier } from "@/lib/reputation-store";
import { PortfolioCover } from "@/components/portfolio/portfolio-preview-card";
import { useActiveRole } from "@/hooks/use-active-role";
import type { UserType } from "@/lib/auth-constants";

export function ProfilePreviewPanel({
  user,
  headline,
  tier,
  previewRole,
}: {
  user: AuthUser;
  headline: string;
  completionPercent?: number;
  tier?: ReputationTier;
  previewRole?: UserType;
}) {
  const { activeRole } = useActiveRole();
  const role = previewRole ?? activeRole;
  const username = user.username ?? user.fullName.toLowerCase().replace(/\s+/g, "-").slice(0, 20);
  const profilePath =
    role === "freelancer" && user.username
      ? `/freelancers/${user.username}`
      : user.companySlug
        ? `/clients/${user.companySlug}`
        : "/profile";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <PortfolioCover hue={user.avatarHue} aspect="aspect-[5/2]" className="rounded-none" />
      <div className="relative px-4 pb-4 pt-0">
        <div className="-mt-7">
          <GradientAvatar
            name={user.fullName}
            hue={user.avatarHue}
            size={56}
            rounded="rounded-xl"
            className="border-[3px] border-card shadow-md"
          />
        </div>
        <h3 className="font-display mt-3 truncate text-base font-semibold">{user.fullName}</h3>
        {headline ? (
          <p className="mt-0.5 truncate text-xs font-medium text-primary">{headline}</p>
        ) : (
          <p className="mt-0.5 text-xs italic text-muted-foreground">Sarlavha qo'shilmagan</p>
        )}
        <p className="truncate text-xs text-muted-foreground">@{username}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {user.verified && <VerifiedIdentityBadge />}
          {tier && <ReputationBadge tier={tier} />}
        </div>
        {user.bio && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{user.bio}</p>
        )}
        <Link
          to={profilePath}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-xs font-semibold text-primary transition-default hover:border-primary/25 hover:bg-primary/5"
        >
          Ommaviy profil <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
