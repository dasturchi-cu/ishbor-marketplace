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

export type OnboardingPortfolioItem = {
  title: string;
  category: string;
  coverImage?: string;
};

export type OnboardingState = {
  userType: UserType;
  email: string;
  fullName: string;
  skills: string[];
  categories: string[];
  portfolio: OnboardingPortfolioItem[];
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
  "Brendlash", "Figma", "Webflow", "Dizayn tizimlari", "Next.js", "React", "TypeScript",
  "PostgreSQL", "UI/UX dizayn", "Mobil dizayn", "Swift", "SwiftUI", "Python",
  "GTM strategiyasi", "Bozor tadqiqotlari", "Kopirayting", "SEO", "Motion dizayn",
  "3D modellashtirish", "Illustratsiya", "Yuridik maslahat", "Intellektual mulk huquqi", "Loyiha boshqaruvi",
  "Ma'lumotlar tahlili", "DevOps", "AWS", "Kontent strategiyasi", "Video montaj",
];

export const languageOptions = [
  "O'zbek", "Rus", "Ingliz", "Qozoq", "Qirg'iz", "Tojik", "Turkman", "Arab", "Xitoy",
];

export const languageLevels = ["Ona tili", "Erkin", "Professional", "Suhbat darajasi", "Boshlang'ich"];

export const teamSizes = [
  "Faqat men", "2–10", "11–50", "51–200", "201–500", "500+",
];

export const industries = [
  "Fintex", "Elektron savdo", "SaaS", "Sog'liqni saqlash", "Ta'lim", "Media va ko'ngilochar",
  "Ko'chmas mulk", "Davlat", "Notijorat", "Chakana savdo", "Logistika", "Boshqa",
];

export const hoursPerWeekOptions = ["10–20 soat", "20–30 soat", "30–40 soat", "40+ soat"];

export const responseTimeOptions = ["< 30 daqiqa", "< 1 soat", "< 2 soat", "< 24 soat"];

export const timezoneOptions = [
  "Asia/Tashkent (UTC+5)",
  "Asia/Almaty (UTC+6)",
  "Asia/Bishkek (UTC+6)",
  "Europe/Moscow (UTC+3)",
  "Europe/London (UTC+0)",
  "America/New_York (UTC-5)",
];

export const hiringGoalOptions = [
  { id: "one-off", label: "Bir martalik loyihalar", description: "Aniq natijalar bilan qisqa muddatli ishlar" },
  { id: "contractors", label: "Uzoq muddatli pudratchilar", description: "Doimiy frilans hamkorliklari va retainerlar" },
  { id: "full-time", label: "To'liq stavka yollash", description: "Ishbor Talent orqali doimiy lavozimlar" },
  { id: "agency", label: "Agentlik hamkorliklari", description: "Katta loyihalar uchun tekshirilgan jamoalar" },
  { id: "design", label: "Dizayn va ijod", description: "Brend, UI/UX, motion va kontent" },
  { id: "engineering", label: "Dasturlash va texnologiya", description: "Veb, mobil va infratuzilma" },
  { id: "strategy", label: "Strategiya va maslahat", description: "GTM, huquq, o'sish va operatsiyalar" },
];

export type OnboardingStep = { id: string; label: string; path: string };

export function getOnboardingSteps(userType: UserType): OnboardingStep[] {
  if (userType === "client") {
    return [
      { id: "company", label: "Kompaniya", path: "/onboarding/company" },
      { id: "industry", label: "Soha", path: "/onboarding/industry" },
      { id: "team-size", label: "Jamoa hajmi", path: "/onboarding/team-size" },
      { id: "hiring-goals", label: "Yollash maqsadlari", path: "/onboarding/hiring-goals" },
    ];
  }
  return [
    { id: "skills", label: "Ko'nikmalar", path: "/onboarding/skills" },
    { id: "categories", label: "Kategoriyalar", path: "/onboarding/categories" },
    { id: "portfolio", label: "Portfolio", path: "/onboarding/portfolio" },
    { id: "languages", label: "Tillar", path: "/onboarding/languages" },
    { id: "availability", label: "Mavjudlik", path: "/onboarding/availability" },
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
