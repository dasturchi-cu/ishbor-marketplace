export type SearchSuggestion = {
  label: string;
  query: string;
  type?: "services" | "freelancers" | "projects" | "all";
};

export const POPULAR_SEARCHES: SearchSuggestion[] = [
  { label: "Figma dizayn", query: "Figma", type: "services" },
  { label: "Next.js", query: "Next.js", type: "freelancers" },
  { label: "Mobil ilova", query: "mobil", type: "projects" },
  { label: "Brending", query: "brend", type: "services" },
  { label: "Fintech", query: "fintech", type: "projects" },
  { label: "UI/UX", query: "dizayn", type: "freelancers" },
];

export const SEARCH_TIPS = [
  "Ko'nikma nomi bilan qidiring — masalan, React, Swift, Figma",
  "Shahar yoki mintaqa qo'shing — masalan, Tashkent",
  "Kategoriya bo'yicha filtrlash tezroq natija beradi",
];
