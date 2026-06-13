import type { AuthUser } from "./auth";
import type { Freelancer } from "./mock-data";
import {
  computeTrustScore,
  computeClientTrustScore,
  type TrustScoreResult,
} from "./growth-metrics";

export type TrustProfile = TrustScoreResult & {
  portfolioStrength: number;
};

function isFreelancerProfile(user: AuthUser | Freelancer): user is Freelancer {
  return "skills" in user && Array.isArray((user as Freelancer).skills);
}

export function computeFreelancerTrust(user: AuthUser | Freelancer): TrustProfile {
  if (isFreelancerProfile(user)) {
    const authLike: AuthUser = {
      id: user.id,
      email: "",
      fullName: user.name,
      userType: "freelancer",
      username: user.username,
      avatarHue: user.hue,
      verified: user.identityVerified,
      bio: user.bio,
      location: user.city,
    };
    return computeTrustScore(authLike, user.username);
  }
  return computeTrustScore(user as AuthUser, (user as AuthUser).username);
}

export function computeClientTrust(user: AuthUser): TrustProfile {
  return computeClientTrustScore(user);
}

export function parseVideoUrl(url?: string): { provider: "youtube" | "vimeo" | null; id: string | null; embedUrl: string | null } {
  if (!url) return { provider: null, id: null, embedUrl: null };
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return { provider: "youtube", id: yt[1]!, embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { provider: "vimeo", id: vimeo[1]!, embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { provider: null, id: null, embedUrl: null };
}
