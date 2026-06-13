export type PortfolioStatus = "draft" | "published" | "archived";
export type PortfolioAdminStatus = "pending" | "approved" | "rejected" | "hidden" | "featured";

export type CaseStudy = {
  clientProblem: string;
  research: string;
  strategy: string;
  designProcess: string;
  developmentProcess: string;
  finalResult: string;
  lessonsLearned: string;
};

export type PortfolioMetric = {
  label: string;
  value: string;
};

export type PortfolioLinks = {
  github?: string;
  gitlab?: string;
  behance?: string;
  dribbble?: string;
  liveDemo?: string;
  figma?: string;
};

export type PortfolioItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  objectives: string;
  challenges: string;
  solutions: string;
  skills: string[];
  technologies: string[];
  clientName?: string;
  duration: string;
  teamSize: string;
  budgetRange: string;
  completionDate: string;
  coverImage: string;
  galleryImages: string[];
  videoUrl?: string;
  links: PortfolioLinks;
  caseStudy: CaseStudy;
  metrics: PortfolioMetric[];
  outcomes: string;
  hue: number;
  ownerUserId: string;
  freelancerUsername: string;
  freelancerName: string;
  freelancerHue: number;
  status: PortfolioStatus;
  adminStatus: PortfolioAdminStatus;
  featured: boolean;
  featuredUntil?: string;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioFormInput = {
  title: string;
  category: string;
  description: string;
  objectives: string;
  challenges: string;
  solutions: string;
  skills: string[];
  technologies: string[];
  clientName?: string;
  duration: string;
  teamSize: string;
  budgetRange: string;
  completionDate: string;
  coverImage: string;
  galleryImages: string[];
  videoUrl?: string;
  links: PortfolioLinks;
  caseStudy: CaseStudy;
  metrics: PortfolioMetric[];
  outcomes: string;
  hue: number;
  featured?: boolean;
};

export type CreatePortfolioContext = {
  ownerUserId: string;
  freelancerUsername: string;
  freelancerName: string;
  freelancerHue: number;
};

export type PortfolioSearchParams = {
  category?: string;
  skills?: string[];
  technologies?: string[];
  freelancer?: string;
  keywords?: string;
};
