export type UserType = "client" | "freelancer";

export const ONBOARDING_STORAGE_KEY = "ishbor-onboarding";

export type OnboardingState = {
  userType: UserType;
  email: string;
  fullName: string;
  title: string;
  city: string;
  bio: string;
  skills: string[];
  categories: string[];
  portfolio: { title: string; category: string }[];
  company: string;
  companySize: string;
  industry: string;
};

export const defaultOnboardingState: OnboardingState = {
  userType: "freelancer",
  email: "",
  fullName: "",
  title: "",
  city: "",
  bio: "",
  skills: [],
  categories: [],
  portfolio: [],
  company: "",
  companySize: "",
  industry: "",
};

export const skillOptions = [
  "Branding", "Figma", "Webflow", "Design Systems", "Next.js", "React", "TypeScript",
  "PostgreSQL", "UI/UX Design", "Mobile Design", "Swift", "SwiftUI", "Python",
  "GTM Strategy", "Market Research", "Copywriting", "SEO", "Motion Design",
  "3D Modeling", "Illustration", "Legal Consulting", "IP Law", "Project Management",
  "Data Analysis", "DevOps", "AWS", "Content Strategy", "Video Editing",
];

export const companySizes = [
  "Just me", "2–10", "11–50", "51–200", "201–500", "500+",
];

export const industries = [
  "Fintech", "E-commerce", "SaaS", "Healthcare", "Education", "Media & Entertainment",
  "Real Estate", "Government", "Non-profit", "Retail", "Logistics", "Other",
];

export function getOnboardingSteps(userType: UserType) {
  if (userType === "client") {
    return [
      { id: "type", label: "Account type", path: "/onboarding" },
      { id: "profile", label: "Profile", path: "/onboarding/profile" },
      { id: "categories", label: "Categories", path: "/onboarding/categories" },
      { id: "company", label: "Company", path: "/onboarding/company" },
    ];
  }
  return [
    { id: "type", label: "Account type", path: "/onboarding" },
    { id: "profile", label: "Profile", path: "/onboarding/profile" },
    { id: "skills", label: "Skills", path: "/onboarding/skills" },
    { id: "categories", label: "Categories", path: "/onboarding/categories" },
    { id: "portfolio", label: "Portfolio", path: "/onboarding/portfolio" },
  ];
}

export function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return defaultOnboardingState;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    return raw ? { ...defaultOnboardingState, ...JSON.parse(raw) } : defaultOnboardingState;
  } catch {
    return defaultOnboardingState;
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>) {
  if (typeof window === "undefined") return;
  const current = loadOnboardingState();
  sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ ...current, ...state }));
}
