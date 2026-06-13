export type AgencyRole = "owner" | "manager" | "recruiter" | "freelancer";

export type AgencyVerificationLevel = "none" | "verified" | "premium" | "enterprise";

export type AgencyMemberStatus = "active" | "pending" | "removed";

export type AgencyMember = {
  userId: string;
  username?: string;
  email: string;
  fullName: string;
  avatarHue: number;
  role: AgencyRole;
  status: AgencyMemberStatus;
  joinedAt: string;
  invitedAt?: string;
};

export type Agency = {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  cover?: string;
  description: string;
  foundedYear: number;
  teamSize: number;
  specializations: string[];
  languages: string[];
  location: string;
  website?: string;
  ownerUserId: string;
  members: AgencyMember[];
  verificationLevel: AgencyVerificationLevel;
  verificationRequestedAt?: string;
  verificationApprovedAt?: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type AgencyCaseStudy = {
  id: string;
  agencySlug: string;
  title: string;
  client: string;
  category: string;
  description: string;
  challenge: string;
  solution: string;
  result: string;
  metrics: { label: string; value: string }[];
  teamMembers: string[];
  coverHue: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type AgencyFormInput = {
  name: string;
  description: string;
  foundedYear: number;
  teamSize: number;
  specializations: string[];
  languages: string[];
  location: string;
  website?: string;
  logo?: string;
  cover?: string;
};

export type AgencySearchParams = {
  q?: string;
  sort?: AgencySortOption;
  filter?: string;
  country?: string;
  minTeam?: string;
};

export type AgencySortOption =
  | "ranking"
  | "rating"
  | "trust"
  | "success"
  | "team_size"
  | "newest";

export const agencyRoleLabels: Record<AgencyRole, string> = {
  owner: "Egasi",
  manager: "Menejer",
  recruiter: "Rekruter",
  freelancer: "Frilanser",
};

export const agencyVerificationLabels: Record<AgencyVerificationLevel, string> = {
  none: "Tasdiqlanmagan",
  verified: "Tasdiqlangan",
  premium: "Premium",
  enterprise: "Korporativ",
};
