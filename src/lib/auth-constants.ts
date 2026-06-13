export type UserType = "client" | "freelancer";

export const ONBOARDING_STORAGE_KEY = "ishbor-onboarding";

export type LanguageEntry = {
  language: string;
  level: string;
};

export type AvailabilitySettings = {
  available: boolean;
  hoursPerWeek: string;
  timezone: string;
  responseTime: string;
};

export type OnboardingState = {
  userType: UserType;
  email: string;
  fullName: string;
  skills: string[];
  categories: string[];
  portfolio: { title: string; category: string }[];
  languages: LanguageEntry[];
  availability: AvailabilitySettings;
  company: string;
  industry: string;
  teamSize: string;
  hiringGoals: string[];
};

export const defaultOnboardingState: OnboardingState = {
  userType: "freelancer",
  email: "",
  fullName: "",
  skills: [],
  categories: [],
  portfolio: [],
  languages: [],
  availability: {
    available: true,
    hoursPerWeek: "",
    timezone: "Asia/Tashkent (UTC+5)",
    responseTime: "",
  },
  company: "",
  industry: "",
  teamSize: "",
  hiringGoals: [],
};

export const skillOptions = [
  "Branding", "Figma", "Webflow", "Design Systems", "Next.js", "React", "TypeScript",
  "PostgreSQL", "UI/UX Design", "Mobile Design", "Swift", "SwiftUI", "Python",
  "GTM Strategy", "Market Research", "Copywriting", "SEO", "Motion Design",
  "3D Modeling", "Illustration", "Legal Consulting", "IP Law", "Project Management",
  "Data Analysis", "DevOps", "AWS", "Content Strategy", "Video Editing",
];

export const languageOptions = [
  "Uzbek", "Russian", "English", "Kazakh", "Kyrgyz", "Tajik", "Turkmen", "Arabic", "Chinese",
];

export const languageLevels = ["Native", "Fluent", "Professional", "Conversational", "Basic"];

export const teamSizes = [
  "Just me", "2–10", "11–50", "51–200", "201–500", "500+",
];

export const industries = [
  "Fintech", "E-commerce", "SaaS", "Healthcare", "Education", "Media & Entertainment",
  "Real Estate", "Government", "Non-profit", "Retail", "Logistics", "Other",
];

export const hoursPerWeekOptions = ["10–20 hrs", "20–30 hrs", "30–40 hrs", "40+ hrs"];

export const responseTimeOptions = ["< 30 min", "< 1 hour", "< 2 hours", "< 24 hours"];

export const timezoneOptions = [
  "Asia/Tashkent (UTC+5)",
  "Asia/Almaty (UTC+6)",
  "Asia/Bishkek (UTC+6)",
  "Europe/Moscow (UTC+3)",
  "Europe/London (UTC+0)",
  "America/New_York (UTC-5)",
];

export const hiringGoalOptions = [
  { id: "one-off", label: "One-off projects", description: "Short engagements with clear deliverables" },
  { id: "contractors", label: "Long-term contractors", description: "Retainers and ongoing freelance relationships" },
  { id: "full-time", label: "Full-time hires", description: "Permanent roles through Ishbor Talent" },
  { id: "agency", label: "Agency partnerships", description: "Vetted teams for larger initiatives" },
  { id: "design", label: "Design & creative", description: "Brand, UI/UX, motion, and content" },
  { id: "engineering", label: "Engineering & dev", description: "Web, mobile, and infrastructure" },
  { id: "strategy", label: "Strategy & consulting", description: "GTM, legal, growth, and operations" },
];

export type OnboardingStep = { id: string; label: string; path: string };

export function getOnboardingSteps(userType: UserType): OnboardingStep[] {
  if (userType === "client") {
    return [
      { id: "company", label: "Company", path: "/onboarding/company" },
      { id: "industry", label: "Industry", path: "/onboarding/industry" },
      { id: "team-size", label: "Team size", path: "/onboarding/team-size" },
      { id: "hiring-goals", label: "Hiring goals", path: "/onboarding/hiring-goals" },
    ];
  }
  return [
    { id: "skills", label: "Skills", path: "/onboarding/skills" },
    { id: "categories", label: "Categories", path: "/onboarding/categories" },
    { id: "portfolio", label: "Portfolio", path: "/onboarding/portfolio" },
    { id: "languages", label: "Languages", path: "/onboarding/languages" },
    { id: "availability", label: "Availability", path: "/onboarding/availability" },
  ];
}

export function getFirstOnboardingPath(userType: UserType): string {
  return getOnboardingSteps(userType)[0]!.path;
}

export function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return defaultOnboardingState;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return defaultOnboardingState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultOnboardingState,
      ...parsed,
      availability: { ...defaultOnboardingState.availability, ...parsed.availability },
    };
  } catch {
    return defaultOnboardingState;
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>) {
  if (typeof window === "undefined") return;
  const current = loadOnboardingState();
  sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ ...current, ...state }));
}
