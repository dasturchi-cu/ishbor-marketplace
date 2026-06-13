// Mock data for Ishbor marketplace. Replace with real APIs later.

export type SkillEntry = {
  name: string;
  level: number;
  endorsements: number;
  category: string;
};

export type Language = { language: string; level: string };

export type VerificationItem = {
  label: string;
  done: boolean;
  verifiedAt?: string;
};

export type Freelancer = {
  id: string;
  username: string;
  name: string;
  title: string;
  city: string;
  rate: number;
  rating: number;
  reviews: number;
  level: "Top Rated" | "Expert" | "Rising" | "Verified";
  skills: string[];
  skillMatrix?: SkillEntry[];
  bio: string;
  available: boolean;
  hue: number;
  earned: number;
  jobs: number;
  memberSince?: string;
  successScore: number;
  completionRate: number;
  onTimeDelivery: number;
  responseTime: string;
  repeatClients: number;
  identityVerified: boolean;
  businessVerified: boolean;
  videoIntro?: { duration: string };
  languages?: Language[];
  verification?: VerificationItem[];
  portfolio: { title: string; category: string; hue: number; year: number }[];
  caseStudies: { title: string; client: string; clientHue: number; result: string; hue: number }[];
};

export type ServicePackage = {
  tier: "Essential" | "Premium" | "Enterprise";
  price: number;
  delivery: string;
  revisions: number | string;
  features: string[];
  description: string;
  popular?: boolean;
};

export type ServiceGalleryImage = {
  hue: number;
  caption: string;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  seller: string;
  sellerHue: number;
  sellerUsername: string;
  sellerLevel: "Top Rated" | "Expert" | "Rising" | "Verified";
  sellerSuccessScore: number;
  sellerCompletionRate: number;
  sellerOnTime: number;
  sellerResponseTime: string;
  sellerIdentityVerified: boolean;
  sellerRepeatClients: number;
  sellerTotalEarned: number;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  delivery: string;
  hue: number;
  inProgress: number;
  queuePosition: number;
  gallery?: ServiceGalleryImage[];
  description?: string;
  descriptionExtended?: string;
  included?: string[];
  packages?: ServicePackage[];
  faqs?: ServiceFaq[];
};

export type ProjectStatus = "draft" | "published" | "paused" | "closed";

export type ProjectAttachment = { name: string; size: string };

export type Project = {
  id: string;
  slug: string;
  title: string;
  client: string;
  clientHue: number;
  clientSpent: number;
  clientHires: number;
  clientVerified: boolean;
  clientMemberSince: string;
  budget: number;
  budgetType: "fixed" | "hourly";
  category: string;
  postedAgo: string;
  proposals: number;
  description: string;
  skills: string[];
  duration: string;
  verified: boolean;
  escrowProtected: boolean;
  scope: string[];
  experienceLevel: "Entry" | "Intermediate" | "Expert";
  status?: ProjectStatus;
  ownerUserId?: string;
  clientSlug?: string;
  attachments?: ProjectAttachment[];
  createdAt?: string;
  featured?: boolean;
  featuredUntil?: string;
};

export type Order = {
  id: string;
  title: string;
  client: string;
  clientHue: number;
  clientSlug?: string;
  freelancer: string;
  freelancerHue: number;
  freelancerUsername?: string;
  status: "in_progress" | "review" | "revision" | "completed" | "disputed" | "cancelled";
  progress: number;
  dueDate: string;
  amount: number;
  escrowFunded: boolean;
  milestones: { label: string; done: boolean; amount: number }[];
  completedAt?: string;
  ownerUserId?: string;
};

export type Application = {
  id: string;
  projectTitle: string;
  projectSlug?: string;
  client: string;
  clientHue: number;
  clientSlug?: string;
  budget: number;
  category: string;
  submittedAgo: string;
  status: "pending" | "shortlisted" | "rejected" | "accepted";
  coverNote: string;
  proposalAmount?: number;
  deliveryTime?: string;
  freelancerUsername?: string;
  freelancerName?: string;
  freelancerHue?: number;
  orderId?: string;
  archived?: boolean;
};

export type ClientCompany = {
  slug: string;
  name: string;
  hue: number;
  industry: string;
  location: string;
  teamSize: string;
  memberSince: string;
  verified: boolean;
  spent: number;
  hires: number;
  bio: string;
  website?: string;
  team: { name: string; role: string; hue: number }[];
};

export type EscrowWorkflow = {
  id: string;
  orderId: string;
  project: string;
  client: string;
  clientHue: number;
  freelancer: string;
  freelancerHue: number;
  amount: number;
  status: "proposal" | "accepted" | "funded" | "in_progress" | "delivered" | "review" | "released" | "completed" | "disputed";
  milestones: { label: string; amount: number; status: "pending" | "funded" | "released" | "disputed" }[];
  timeline: { step: string; date: string; done: boolean }[];
};

export type PaymentMethod = {
  id: string;
  type: "humo" | "uzcard" | "visa";
  label: string;
  last4: string;
  default: boolean;
};

export type Review = {
  id: string;
  from: string;
  fromHue: number;
  project: string;
  rating: number;
  body: string;
  date: string;
  freelancerUsername?: string;
  serviceSlug?: string;
};

export type EscrowRecord = {
  id: string;
  project: string;
  client: string;
  clientHue: number;
  amount: number;
  status: "funded" | "released" | "pending" | "disputed";
  milestone: string;
  date: string;
};

export type HiringLead = {
  id: string;
  name: string;
  username: string;
  hue: number;
  title: string;
  stage: "reviewing" | "shortlisted" | "interview" | "offer";
  project: string;
  rate: number;
  rating: number;
};

export const freelancers: Freelancer[] = [
  { id: "f1", username: "nargiza", name: "Nargiza Akhmedova", title: "Katta brend strategi va UI dizayner", city: "Tashkent", rate: 45, rating: 5.0, reviews: 184, level: "Top Rated", skills: ["Branding", "Figma", "Webflow", "Design Systems"], bio: "Markaziy Osiyo bo'ylab fintech va premium brendlar uchun bo'zordan zalga ishlaydigan identifikatsiyalar yarataman. 8 yil, 120+ loyiha.", available: true, hue: 250, earned: 184000, jobs: 124, successScore: 98, completionRate: 100, onTimeDelivery: 99, responseTime: "< 30m", repeatClients: 72, identityVerified: true, businessVerified: true, portfolio: [{ title: "Asaka Neo-bank Rebrand", category: "Brending", hue: 250, year: 2025 }, { title: "Tezda Rider App", category: "Mobil dizayn", hue: 210, year: 2025 }, { title: "Hunar Bazaar Identity", category: "Brend tizimi", hue: 290, year: 2024 }, { title: "Soliq Pro Dashboard", category: "Mahsulot dizayni", hue: 230, year: 2024 }, { title: "Aralink Investor Deck", category: "Taqdimot", hue: 160, year: 2024 }, { title: "Uzcard App Refresh", category: "Mobil dizayn", hue: 215, year: 2023 }], caseStudies: [{ title: "Asaka Neo-bank: Merosdan yetakchilikka", client: "Asaka Capital", clientHue: 215, result: "3x foydalanuvchi faolligi, 40% kam qo'llab-quvvatlash murojaati", hue: 250 }, { title: "Hunar Bazaar: Sayohat qiladigan brend", client: "Hunar Bazaar", clientHue: 290, result: "2.8x konversiya o'sishi, 3 ta yangi bozor", hue: 290 }] },
  { id: "f2", username: "azamat", name: "Azamat Usmanov", title: "Full Stack muhandis (Next.js / Rust)", city: "Samarkand", rate: 65, rating: 4.97, reviews: 92, level: "Expert", skills: ["Next.js", "Rust", "PostgreSQL", "System Architecture"], bio: "Mintaqaviy banklar uchun tarqatilgan to'lov tizimlari quraman. Ex-Uzcard. Uzoq muddatli retainerlar uchun ochiqman.", available: true, hue: 215, earned: 310000, jobs: 64, successScore: 96, completionRate: 98, onTimeDelivery: 97, responseTime: "< 1h", repeatClients: 58, identityVerified: true, businessVerified: false, portfolio: [{ title: "Uzcard Payment Gateway", category: "Fintech", hue: 215, year: 2025 }, { title: "Ishbor Marketplace", category: "E-commerce", hue: 250, year: 2025 }, { title: "Alif Banking API", category: "Fintech", hue: 200, year: 2024 }, { title: "Kaspi Micro-services", category: "To'lovlar", hue: 180, year: 2024 }, { title: "Soliq Tax Engine", category: "GovTech", hue: 230, year: 2023 }, { title: "Tezda Dispatch System", category: "Logistika", hue: 210, year: 2023 }], caseStudies: [{ title: "Uzcard: Katta hajmda real vaqt", client: "Uzcard", clientHue: 215, result: "99,97% uptime, 12ms p95 kechikish", hue: 215 }] },
  { id: "f3", username: "dilnoza", name: "Dilnoza Kim", title: "3D rassom va motion dizayner", city: "Almaty", rate: 38, rating: 4.92, reviews: 41, level: "Rising", skills: ["Blender", "Cinema 4D", "WebGL", "After Effects"], bio: "Protsedural geometriya va ko'chmanchi bezak uyg'unlashadi. So'nggi ish: Orol dengizi hujjatli film ochilishi.", available: true, hue: 270, earned: 62000, jobs: 28, successScore: 88, completionRate: 96, onTimeDelivery: 94, responseTime: "< 2h", repeatClients: 34, identityVerified: true, businessVerified: false, portfolio: [{ title: "Aral Sea Documentary Opener", category: "Motion", hue: 270, year: 2025 }, { title: "Kazakh Pavilion Expo", category: "3D viz", hue: 160, year: 2025 }, { title: "Nomad Jewelry Collection", category: "Mahsulot render", hue: 290, year: 2024 }, { title: "Silk Road Animatic", category: "Animatsiya", hue: 230, year: 2024 }, { title: "Almaty City Flyover", category: "3D viz", hue: 215, year: 2023 }, { title: "Heritage Tile Generator", category: "Generativ", hue: 280, year: 2023 }], caseStudies: [] },
  { id: "f4", username: "temur", name: "Temur Ismoilov", title: "Usta illustrator va naqsh dizayneri", city: "Bukhara", rate: 35, rating: 5.0, reviews: 67, level: "Top Rated", skills: ["Procreate", "Illustrator", "Pattern Design"], bio: "Oilamda olti avlod suzani tikuvchilar bor. Endi moda uylari va CPG brendlari uchun ishlayman.", available: false, hue: 230, earned: 88000, jobs: 51, successScore: 97, completionRate: 100, onTimeDelivery: 98, responseTime: "< 1h", repeatClients: 65, identityVerified: true, businessVerified: true, portfolio: [{ title: "Chopard Suzani Collection", category: "Naqsh", hue: 230, year: 2025 }, { title: "UNESCO Heritage Prints", category: "Illustratsiya", hue: 280, year: 2025 }, { title: "Silk Road CPG Labels", category: "Qadoqlash", hue: 290, year: 2024 }, { title: "Bukhara Tile Atlas", category: "Naqsh", hue: 200, year: 2024 }, { title: "LVMH Ornament Series", category: "Naqsh", hue: 250, year: 2023 }, { title: "National Museum Murals", category: "Illustratsiya", hue: 160, year: 2023 }], caseStudies: [{ title: "Chopard: Meros va haute couture", client: "Chopard", clientHue: 230, result: "To'plam 48 soatda sotilib tugadi, Vogue CA'da e'lon qilindi", hue: 230 }] },
  { id: "f5", username: "madina", name: "Madina Azimova", title: "O'sish va strategiya maslahatchisi", city: "Tashkent", rate: 80, rating: 4.95, reviews: 53, level: "Expert", skills: ["GTM Strategy", "Market Research", "Notion", "SQL"], bio: "Uch mintaqaviy unicorn'da o'sishni boshqarganman. Slayd emas, strategiya yarataman.", available: true, hue: 290, earned: 245000, jobs: 38, successScore: 95, completionRate: 97, onTimeDelivery: 96, responseTime: "< 45m", repeatClients: 52, identityVerified: true, businessVerified: true, portfolio: [{ title: "Alif Growth Engine", category: "Strategiya", hue: 290, year: 2025 }, { title: "Payme Retention Audit", category: "O'sish", hue: 215, year: 2025 }, { title: "Tezda City Launch", category: "GTM", hue: 210, year: 2024 }, { title: "Aralink Fundraise Deck", category: "Strategiya", hue: 160, year: 2024 }, { title: "Uzum Market Playbook", category: "O'sish", hue: 250, year: 2023 }, { title: "Soliq Enterprise GTM", category: "Strategiya", hue: 230, year: 2023 }], caseStudies: [{ title: "Alif: 14 oyda 0 dan 2M foydalanuvchi", client: "Alif Bank", clientHue: 290, result: "2M foydalanuvchi, 340% MAU o'sishi, $12M Series B", hue: 290 }] },
  { id: "f6", username: "farrukh", name: "Farrukh Saidov", title: "iOS muhandisi • Swift & SwiftUI", city: "Tashkent", rate: 55, rating: 4.98, reviews: 71, level: "Top Rated", skills: ["Swift", "SwiftUI", "Core Data", "ARKit"], bio: "App Store'ga 14 ta ilova yuborganman. Fintech va on-demand yo'nalishlarida ixtisoslashganman.", available: true, hue: 210, earned: 198000, jobs: 47, successScore: 97, completionRate: 100, onTimeDelivery: 99, responseTime: "< 20m", repeatClients: 68, identityVerified: true, businessVerified: false, portfolio: [{ title: "Tezda Rider iOS App", category: "Mobil", hue: 210, year: 2025 }, { title: "Asaka Mobile Banking", category: "Fintech", hue: 215, year: 2025 }, { title: "Payme Wallet", category: "Fintech", hue: 250, year: 2024 }, { title: "Kaspi Gold iOS", category: "Fintech", hue: 180, year: 2024 }, { title: "Uzum Market", category: "E-commerce", hue: 290, year: 2023 }, { title: "MyTaxi Tashkent", category: "On-demand", hue: 200, year: 2023 }], caseStudies: [{ title: "Tezda: 3 oyda 0 dan 100K yuklab olish", client: "Tezda", clientHue: 250, result: "4.8 App Store reytingi, 0.3% crash darajasi", hue: 210 }] },
  { id: "f7", username: "kamila", name: "Kamila Yusupova", title: "Huquqiy maslahatchi • IP va shartnomalar", city: "Tashkent", rate: 95, rating: 5.0, reviews: 32, level: "Expert", skills: ["IP Law", "Cross-border", "M&A"], bio: "MDH bozorlariga kirayotgan SaaS va ijodiy bizneslar uchun transchegaraviy maslahat.", available: true, hue: 200, earned: 412000, jobs: 22, successScore: 99, completionRate: 100, onTimeDelivery: 100, responseTime: "< 1h", repeatClients: 82, identityVerified: true, businessVerified: true, portfolio: [{ title: "Alif IP Portfolio Setup", category: "Huquq", hue: 200, year: 2025 }, { title: "Uzum Cross-border SPA", category: "M&A", hue: 215, year: 2025 }, { title: "Ishbor Terms of Trade", category: "Huquq", hue: 250, year: 2024 }, { title: "Chopard IP Licensing", category: "IP huquqi", hue: 230, year: 2024 }, { title: "UNESCO Heritage IP", category: "IP huquqi", hue: 280, year: 2023 }, { title: "Kaspi Compliance Audit", category: "Huquq", hue: 180, year: 2023 }], caseStudies: [{ title: "Alif: 9 bozor uchun IP portfeli", client: "Alif Bank", clientHue: 200, result: "9 yurisdiksiyada himoyalangan, 0 buzilish holati", hue: 200 }] },
  { id: "f8", username: "rustam", name: "Rustam Khalilov", title: "Arxitektor va interyer dizayneri", city: "Samarkand", rate: 50, rating: 4.94, reviews: 28, level: "Verified", skills: ["AutoCAD", "Rhino", "V-Ray", "Sustainable Design"], bio: "Madrasalarni tiklash va zamonaviy turar-joy uyg'unlashadi. Riga'da o'qigan.", available: true, hue: 160, earned: 124000, jobs: 19, successScore: 91, completionRate: 95, onTimeDelivery: 93, responseTime: "< 3h", repeatClients: 42, identityVerified: true, businessVerified: false, portfolio: [{ title: "Registan Madrasa Restoration", category: "Meros", hue: 160, year: 2025 }, { title: "Tashkent Loft Residences", category: "Interyer", hue: 250, year: 2025 }, { title: "Bukhara Boutique Hotel", category: "Interyer", hue: 230, year: 2024 }, { title: "Almaty Co-working Space", category: "Tijorat", hue: 215, year: 2024 }, { title: "Samarkand Villa", category: "Turar-joy", hue: 290, year: 2023 }, { title: "UNESCO Site Documentation", category: "Meros", hue: 280, year: 2023 }], caseStudies: [] },
];

export const services: Service[] = [
  { id: "s1", slug: "mobile-app-design-fintech", title: "Noldan premium fintech mobil ilova dizayn qilaman", seller: "Nargiza A.", sellerHue: 250, sellerUsername: "nargiza", sellerLevel: "Top Rated", sellerSuccessScore: 98, sellerCompletionRate: 100, sellerOnTime: 99, sellerResponseTime: "< 30m", sellerIdentityVerified: true, sellerRepeatClients: 72, sellerTotalEarned: 184000, category: "Mobil dizayn", price: 480, rating: 5.0, reviews: 89, delivery: "7 kun", hue: 250, inProgress: 2, queuePosition: 3 },
  { id: "s2", slug: "nextjs-marketplace-build", title: "Stripe bilan ishlab chiqishga tayyor Next.js marketplace quraman", seller: "Azamat U.", sellerHue: 215, sellerUsername: "azamat", sellerLevel: "Expert", sellerSuccessScore: 96, sellerCompletionRate: 98, sellerOnTime: 97, sellerResponseTime: "< 1h", sellerIdentityVerified: true, sellerRepeatClients: 58, sellerTotalEarned: 310000, category: "Veb dasturlash", price: 1800, rating: 4.98, reviews: 41, delivery: "21 kun", hue: 215, inProgress: 1, queuePosition: 1 },
  { id: "s3", slug: "brand-identity-system", title: "To'liq brend identifikatsiya tizimi va qo'llanmalar yarataman", seller: "Nargiza A.", sellerHue: 250, sellerUsername: "nargiza", sellerLevel: "Top Rated", sellerSuccessScore: 98, sellerCompletionRate: 100, sellerOnTime: 99, sellerResponseTime: "< 30m", sellerIdentityVerified: true, sellerRepeatClients: 72, sellerTotalEarned: 184000, category: "Brending", price: 1200, rating: 5.0, reviews: 67, delivery: "14 kun", hue: 230, inProgress: 2, queuePosition: 3 },
  { id: "s4", slug: "ornamental-pattern-suite", title: "Markaziy Osiyo uslubida maxsus bezak naqshlari yarataman", seller: "Temur I.", sellerHue: 230, sellerUsername: "temur", sellerLevel: "Top Rated", sellerSuccessScore: 97, sellerCompletionRate: 100, sellerOnTime: 98, sellerResponseTime: "< 1h", sellerIdentityVerified: true, sellerRepeatClients: 65, sellerTotalEarned: 88000, category: "Illustratsiya", price: 280, rating: 5.0, reviews: 38, delivery: "5 kun", hue: 280, inProgress: 0, queuePosition: 1 },
  { id: "s5", slug: "ios-app-development", title: "Swift / SwiftUI'da native iOS ilova quraman", seller: "Farrukh S.", sellerHue: 210, sellerUsername: "farrukh", sellerLevel: "Top Rated", sellerSuccessScore: 97, sellerCompletionRate: 100, sellerOnTime: 99, sellerResponseTime: "< 20m", sellerIdentityVerified: true, sellerRepeatClients: 68, sellerTotalEarned: 198000, category: "Mobil dasturlash", price: 2400, rating: 4.96, reviews: 29, delivery: "30 kun", hue: 210, inProgress: 1, queuePosition: 2 },
  { id: "s6", slug: "growth-strategy-audit", title: "360° o'sish auditi va 90 kunlik strategiya tuzaman", seller: "Madina A.", sellerHue: 290, sellerUsername: "madina", sellerLevel: "Expert", sellerSuccessScore: 95, sellerCompletionRate: 97, sellerOnTime: 96, sellerResponseTime: "< 45m", sellerIdentityVerified: true, sellerRepeatClients: 52, sellerTotalEarned: 245000, category: "Strategiya", price: 850, rating: 5.0, reviews: 22, delivery: "10 kun", hue: 260, inProgress: 0, queuePosition: 1 },
  { id: "s7", slug: "3d-product-renders", title: "Fotorealistik 3D mahsulot renderlari va animatsiya yarataman", seller: "Dilnoza K.", sellerHue: 270, sellerUsername: "dilnoza", sellerLevel: "Rising", sellerSuccessScore: 88, sellerCompletionRate: 96, sellerOnTime: 94, sellerResponseTime: "< 2h", sellerIdentityVerified: true, sellerRepeatClients: 34, sellerTotalEarned: 62000, category: "3D va Motion", price: 360, rating: 4.92, reviews: 18, delivery: "7 kun", hue: 270, inProgress: 1, queuePosition: 1 },
  { id: "s8", slug: "ip-contract-review", title: "Transchegaraviy SaaS shartnomalarini ko'rib chiqaman va tuzaman", seller: "Kamila Y.", sellerHue: 200, sellerUsername: "kamila", sellerLevel: "Expert", sellerSuccessScore: 99, sellerCompletionRate: 100, sellerOnTime: 100, sellerResponseTime: "< 1h", sellerIdentityVerified: true, sellerRepeatClients: 82, sellerTotalEarned: 412000, category: "Huquq", price: 520, rating: 5.0, reviews: 14, delivery: "3 kun", hue: 200, inProgress: 0, queuePosition: 1 },
];

export const projects: Project[] = [
  { id: "p1", slug: "fintech-app-redesign", title: "Fintech App Redesign for National Bank", client: "Asaka Capital", clientHue: 215, clientSpent: 184200, clientHires: 12, clientVerified: true, clientMemberSince: "2022", budget: 12000, budgetType: "fixed", category: "Mahsulot dizayni", postedAgo: "4 soat oldin", proposals: 12, description: "Chakana banking platformamizning mobil transformatsiyasini boshqaradigan tajribali UI dizayner kerak.", skills: ["Figma", "Design Systems", "Fintech", "Accessibility"], duration: "6 hafta", verified: true, escrowProtected: true, scope: ["Mobil ilova UI qayta dizayni", "Dizayn tizimi yaratish", "Animatsiyali prototip", "Muhandislik topshirish"], experienceLevel: "Expert" },
  { id: "p2", slug: "arabic-cyrillic-localization", title: "E-commerce uchun arab va kirill lokalizatsiyasi", client: "Hunar Bazaar", clientHue: 290, clientSpent: 42800, clientHires: 6, clientVerified: true, clientMemberSince: "2023", budget: 3500, budgetType: "fixed", category: "Lokalizatsiya", postedAgo: "8 soat oldin", proposals: 8, description: "Premium mintaqaviy lifestyle brendi uchun RTL maketlar va maxsus shrift og'irliklari.", skills: ["i18n", "RTL", "Typography", "Next.js"], duration: "3 hafta", verified: true, escrowProtected: true, scope: ["RTL maket joriy etish", "Arab tipografiyasi juftlash", "Kontent tarjima QA", "Brauzerlararo test"], experienceLevel: "Intermediate" },
  { id: "p3", slug: "series-a-pitch-deck", title: "Series A Pitch Deck — Climate Tech", client: "Aralink Labs", clientHue: 160, clientSpent: 8500, clientHires: 3, clientVerified: true, clientMemberSince: "2024", budget: 4500, budgetType: "fixed", category: "Strategiya va dizayn", postedAgo: "1 kun oldin", proposals: 21, description: "$8M Series A uchun 18 slaydli taqdimot. Iqlim texnologiyasi / Orol havzasini tiklash.", skills: ["Pitch Decks", "Storytelling", "Keynote", "Climate"], duration: "10 kun", verified: true, escrowProtected: true, scope: ["18 slaydli investor taqdimoti", "Ma'lumotlarni vizualizatsiya dizayni", "Moliyaviy model xulosa sahifasi", "2 ta tuzatish bosqichi"], experienceLevel: "Expert" },
  { id: "p4", slug: "ios-engineer-on-demand", title: "Long-term iOS Engineer — On-demand startup", client: "Tezda", clientHue: 250, clientSpent: 88000, clientHires: 4, clientVerified: true, clientMemberSince: "2022", budget: 55, budgetType: "hourly", category: "Mobil dasturlash", postedAgo: "1 kun oldin", proposals: 6, description: "Haftasiga 20-30 soat, kamida 6 oy. Katta iOS muhandisi. SwiftUI, Combine, MapKit.", skills: ["Swift", "SwiftUI", "MapKit", "Combine"], duration: "6+ oy", verified: true, escrowProtected: true, scope: ["Haftasiga 20-30 soat to'liq bandlik", "SwiftUI'da funksiya ishlab chiqish", "MapKit integratsiyasi", "App Store yuborish qo'llab-quvvatlash"], experienceLevel: "Expert" },
  { id: "p5", slug: "madrasa-restoration-3d", title: "Madrasa Restoration — 3D Documentation", client: "UNESCO CA Bureau", clientHue: 280, clientSpent: 32000, clientHires: 2, clientVerified: true, clientMemberSince: "2021", budget: 8000, budgetType: "fixed", category: "Arxitektura", postedAgo: "2 kun oldin", proposals: 4, description: "Buxorodagi 16-asr madrasasi uchun fotogrammetriya, 3D modellashtirish va tiklash chizmalari.", skills: ["Photogrammetry", "Rhino", "Heritage", "AutoCAD"], duration: "8 hafta", verified: true, escrowProtected: true, scope: ["Joyda fotogrammetriya skanerlash", "Rhino'da 3D model tiklash", "AutoCAD'da tiklash chizmalari", "O'lchovlar bilan yakuniy hisobot"], experienceLevel: "Expert" },
  { id: "p6", slug: "b2b-saas-webflow", title: "B2B SaaS marketing sayti (Webflow)", client: "Soliq Pro", clientHue: 210, clientSpent: 6500, clientHires: 1, clientVerified: false, clientMemberSince: "2025", budget: 6500, budgetType: "fixed", category: "Veb dizayn", postedAgo: "3 kun oldin", proposals: 18, description: "Soliq avtomatlashtirish SaaS uchun premium marketing sayti. Webflow, 8 sahifa va blog.", skills: ["Webflow", "Copywriting", "Animation", "SEO"], duration: "5 hafta", verified: false, escrowProtected: true, scope: ["8 sahifali marketing sayti", "Webflow'da blog sozlash", "Maxsus animatsiyalar", "SEO optimizatsiya"], experienceLevel: "Intermediate" },
];

export const categories = [
  { slug: "design", name: "Dizayn va brend", count: 1240, glyph: "✦" },
  { slug: "development", name: "Dasturlash", count: 2820, glyph: "◇" },
  { slug: "marketing", name: "Marketing va o'sish", count: 940, glyph: "✶" },
  { slug: "writing", name: "Yozuv va tarjima", count: 1180, glyph: "✧" },
  { slug: "video", name: "Video va animatsiya", count: 620, glyph: "❋" },
  { slug: "architecture", name: "Arxitektura va 3D", count: 410, glyph: "◈" },
  { slug: "consulting", name: "Strategiya va huquq", count: 380, glyph: "✺" },
  { slug: "craft", name: "Hunarmandchilik va meros", count: 290, glyph: "✻" },
];

export const messages = [
  { id: "m1", name: "Nargiza Akhmedova", hue: 250, snippet: "Dashboard uchun uchta yo'nalish qo'ylab ishlab chiqdim…", time: "2 daq", unread: 2, online: true },
  { id: "m2", name: "Asaka Capital", hue: 215, snippet: "Shartnoma imzolandi. Birinchi bosqich eskrouga kiritildi.", time: "1 soat", unread: 0, online: false },
  { id: "m3", name: "Azamat Usmanov", hue: 210, snippet: "Migratsiyalar yuborildi. Qachon bo'lsa ko'rib chiqing.", time: "3 soat", unread: 1, online: true },
  { id: "m4", name: "Madina Azimova", hue: 290, snippet: "O'sish strategiyasi bo'yicha payshanba kuni qisqa qo'ng'iroq qilamizmi?", time: "1 kun", unread: 0, online: false },
  { id: "m5", name: "Hunar Bazaar", hue: 290, snippet: "Taklifni yoqtirdik. Hozir brif yuboryapmiz.", time: "2 kun", unread: 0, online: false },
];

export const notifications = [
  { id: "n1", kind: "payment" as const, title: "Bosqich moliyalashtirildi", body: "Asaka Capital Fintech App Redesign uchun eskrouga $4,000 kiritdi.", time: "12 daq", read: false, priority: "high" as const },
  { id: "n2", kind: "proposal" as const, title: "Yangi taklif keldi", body: "Azamat Usmanov iOS loyihangizga taklif yubordi.", time: "1 soat", read: false, priority: "high" as const },
  { id: "n3", kind: "review" as const, title: "5 yulduzli sharh", body: "Tezda iOS loyihangizga 5 yulduzli sharh qoldirdi. Ajoyib ish!", time: "3 soat", read: false, priority: "normal" as const },
  { id: "n4", kind: "escrow" as const, title: "Bosqich tasdiqlandi", body: "Brand Identity loyihasi uchun bosqichingiz tasdiqlandi va mablag' chiqarildi.", time: "5 soat", read: true, priority: "normal" as const },
  { id: "n5", kind: "message" as const, title: "Nargizadan xabar", body: "Dashboard uchun uchta yo'nalish tayyorladim. Ko'rib chiqishni xohlaysizmi?", time: "1 kun", read: true, priority: "normal" as const },
  { id: "n6", kind: "system" as const, title: "Shaxs tasdiqlandi", body: "Pasportingiz tasdiqlandi. Pro e'lonlar va yuqori eskrou limitlariga ega bo'ldingiz.", time: "1 kun", read: true, priority: "normal" as const },
  { id: "n7", kind: "proposal" as const, title: "Taklif tanlandi", body: "Soliq Pro Webflow Marketing Site loyihasi uchun taklifingizni tanladi.", time: "2 kun", read: true, priority: "normal" as const },
  { id: "n8", kind: "payment" as const, title: "Yechib olish yakunlandi", body: "4421 bilan tugagan Humo kartangizga $2,200 yechib olish amalga oshirildi.", time: "3 kun", read: true, priority: "low" as const },
];

export const transactions = [
  { id: "t1", kind: "in" as const, label: "Bosqich to'lovi", project: "Fintech App Redesign", amount: 4000, date: "10 iyn", status: "Yakunlangan" },
  { id: "t2", kind: "out" as const, label: "Yechib olish — Humo karta", project: "•••• 4421", amount: -2200, date: "8 iyn", status: "Yakunlangan" },
  { id: "t3", kind: "in" as const, label: "Xizmat buyurtmasi", project: "Brand Identity System", amount: 1200, date: "6 iyn", status: "Yakunlangan" },
  { id: "t4", kind: "fee" as const, label: "Platforma to'lovi", project: "Brand Identity System", amount: -96, date: "6 iyn", status: "Yakunlangan" },
  { id: "t5", kind: "in" as const, label: "Bosqich to'lovi", project: "Lokalizatsiya sprinti", amount: 1750, date: "2 iyn", status: "Yakunlangan" },
  { id: "t6", kind: "out" as const, label: "Yechib olish — Uzcard", project: "•••• 8829", amount: -3000, date: "29 may", status: "Kutilmoqda" },
  { id: "t7", kind: "in" as const, label: "Buyurtma to'lovi", project: "iOS App Development", amount: 2400, date: "25 may", status: "Yakunlangan" },
  { id: "t8", kind: "fee" as const, label: "Platforma to'lovi", project: "iOS App Development", amount: -192, date: "25 may", status: "Yakunlangan" },
];

export const clients: ClientCompany[] = [
  {
    slug: "asaka-capital",
    name: "Asaka Capital",
    hue: 215,
    industry: "Fintech",
    location: "Tashkent, Uzbekistan",
    teamSize: "51–200",
    memberSince: "2022",
    verified: true,
    spent: 184200,
    hires: 12,
    bio: "Milliy chakana bank — O'zbekiston bo'ylab 2M+ mijozlar uchun mobil tajribani o'zgartirmoqda.",
    website: "asaka.uz",
    team: [
      { name: "Sardor Mirkomilov", role: "Mahsulot bo'limi rahbari", hue: 215 },
      { name: "Aisha Karimova", role: "Dizayn rahbari", hue: 320 },
      { name: "Daniyar Bekov", role: "Muhandislik menejeri", hue: 22 },
    ],
  },
  {
    slug: "hunar-bazaar",
    name: "Hunar Bazaar",
    hue: 290,
    industry: "Elektron tijorat",
    location: "Tashkent, Uzbekistan",
    teamSize: "11–50",
    memberSince: "2023",
    verified: true,
    spent: 42800,
    hires: 6,
    bio: "Arab va kirill tillarida lokalizatsiyaga muhtoj mintaqaviy premium lifestyle brendi.",
    team: [
      { name: "Laylo Rahimova", role: "Brend direktori", hue: 290 },
      { name: "Jasur Tursunov", role: "Operatsiyalar", hue: 250 },
    ],
  },
  {
    slug: "tezda",
    name: "Tezda",
    hue: 250,
    industry: "Talab bo'yicha",
    location: "Tashkent, Uzbekistan",
    teamSize: "11–50",
    memberSince: "2022",
    verified: true,
    spent: 88000,
    hires: 4,
    bio: "Markaziy Osiyo bo'ylab iOS va logistika yo'nalishida kengayayotgan on-demand yetkazib berish startapi.",
    team: [
      { name: "Bobur Nazarov", role: "CTO", hue: 250 },
      { name: "Nilufar Saidova", role: "Mahsulot", hue: 210 },
    ],
  },
  {
    slug: "aralink-labs",
    name: "Aralink Labs",
    hue: 160,
    industry: "Iqlim texnologiyasi",
    location: "Nukus, Uzbekistan",
    teamSize: "2–10",
    memberSince: "2024",
    verified: true,
    spent: 8500,
    hires: 3,
    bio: "Orol havzasini tiklashga qaratilgan iqlim texnologiyasi. Series A jarayonida.",
    team: [{ name: "Elena Voronova", role: "CEO", hue: 160 }],
  },
  {
    slug: "soliq-pro",
    name: "Soliq Pro",
    hue: 210,
    industry: "SaaS",
    location: "Tashkent, Uzbekistan",
    teamSize: "2–10",
    memberSince: "2025",
    verified: false,
    spent: 6500,
    hires: 1,
    bio: "O'zbekistondagi KMB uchun soliq avtomatlashtirish SaaS.",
    team: [{ name: "Rustam Aliyev", role: "Asoschisi", hue: 210 }],
  },
];

export const paymentMethods: PaymentMethod[] = [
  { id: "pm1", type: "humo", label: "Humo", last4: "4421", default: true },
  { id: "pm2", type: "uzcard", label: "Uzcard", last4: "8829", default: false },
  { id: "pm3", type: "visa", label: "Visa", last4: "1044", default: false },
];

export const orders: Order[] = [
  {
    id: "o1", title: "Fintech App Redesign — Phase 1", client: "Asaka Capital", clientHue: 215, clientSlug: "asaka-capital",
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, freelancerUsername: "nargiza", status: "in_progress", progress: 60,
    dueDate: "Jun 24", amount: 12000, escrowFunded: true,
    milestones: [
      { label: "Tadqiqot va wireframe'lar", done: true, amount: 2000 },
      { label: "Yuqori sifatli ekranlar", done: true, amount: 4000 },
      { label: "Prototip va topshirish", done: false, amount: 6000 },
    ],
  },
  {
    id: "o2", title: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, clientSlug: "hunar-bazaar",
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, freelancerUsername: "nargiza", status: "review", progress: 90,
    dueDate: "Jun 15", amount: 1200, escrowFunded: true,
    milestones: [
      { label: "Logo va belgi", done: true, amount: 400 },
      { label: "Rang va shrift tizimi", done: true, amount: 400 },
      { label: "Brend qo'llanmasi PDF", done: false, amount: 400 },
    ],
  },
  {
    id: "o3", title: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, clientSlug: "tezda",
    freelancer: "Farrukh Saidov", freelancerHue: 210, freelancerUsername: "farrukh", status: "in_progress", progress: 35,
    dueDate: "Aug 01", amount: 8800, escrowFunded: true,
    milestones: [
      { label: "Arxitektura va sprint 1", done: true, amount: 2200 },
      { label: "Asosiy funksiyalar ishlab chiqish", done: false, amount: 4400 },
      { label: "Test va App Store", done: false, amount: 2200 },
    ],
  },
  {
    id: "o4", title: "Growth Strategy Audit", client: "Aralink Labs", clientHue: 160, clientSlug: "aralink-labs",
    freelancer: "Madina Azimova", freelancerHue: 290, freelancerUsername: "madina", status: "completed", progress: 100,
    dueDate: "Jun 05", amount: 850, escrowFunded: false,
    milestones: [
      { label: "Audit va natijalar", done: true, amount: 425 },
      { label: "90 kunlik strategiya", done: true, amount: 425 },
    ],
  },
  {
    id: "o5", title: "Webflow Marketing Site", client: "Soliq Pro", clientHue: 210, clientSlug: "soliq-pro",
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, freelancerUsername: "nargiza", status: "cancelled", progress: 10,
    dueDate: "May 20", amount: 6500, escrowFunded: false,
    milestones: [
      { label: "Tanishuv", done: true, amount: 500 },
      { label: "Qurish", done: false, amount: 6000 },
    ],
  },
];

export const applications: Application[] = [
  { id: "a1", projectTitle: "B2B SaaS Marketing Site (Webflow)", projectSlug: "b2b-saas-webflow", client: "Soliq Pro", clientHue: 210, clientSlug: "soliq-pro", budget: 6500, proposalAmount: 6200, category: "Veb dizayn", submittedAgo: "2 kun oldin", status: "shortlisted", coverNote: "Alif va Payme kabi SaaS kompaniyalar uchun 12 ta Webflow marketing sayti qurganman." },
  { id: "a2", projectTitle: "Series A Pitch Deck — Climate Tech", projectSlug: "series-a-pitch-deck", client: "Aralink Labs", clientHue: 160, clientSlug: "aralink-labs", budget: 4500, proposalAmount: 4200, category: "Strategiya va dizayn", submittedAgo: "3 kun oldin", status: "pending", coverNote: "Iqlim va ijtimoiy ta'sirga yo'naltirilgan startaplar uchun investor hikoyalarini yaratishga ixtisoslashganman." },
  { id: "a3", projectTitle: "Arabic & Cyrillic Localization", projectSlug: "arabic-cyrillic-localization", client: "Hunar Bazaar", clientHue: 290, clientSlug: "hunar-bazaar", budget: 3500, proposalAmount: 3400, category: "Lokalizatsiya", submittedAgo: "5 kun oldin", status: "pending", coverNote: "Ona tilida o'zbekcha gapiraman, Markaziy Osiyo bozorlarida chuqur i18n tajribasiga egaman." },
  { id: "a4", projectTitle: "Madrasa Restoration 3D Documentation", projectSlug: "madrasa-restoration-3d", client: "UNESCO CA Bureau", clientHue: 280, budget: 8000, proposalAmount: 7800, category: "Arxitektura", submittedAgo: "1 hafta oldin", status: "rejected", coverNote: "O'zbekistondagi uchta UNESCO meros obyekti uchun fotogrammetriya hujjatlarini tayyorlaganman." },
  { id: "a5", projectTitle: "Fintech App Redesign for National Bank", projectSlug: "fintech-app-redesign", client: "Asaka Capital", clientHue: 215, clientSlug: "asaka-capital", budget: 12000, proposalAmount: 11500, category: "Mahsulot dizayni", submittedAgo: "2 hafta oldin", status: "accepted", coverNote: "Ikki mintaqaviy neobank uchun mobil transformatsiyani boshqarganman, to'liq dizayn tizimi bilan topshirdim." },
];

export const escrowWorkflows: EscrowWorkflow[] = [
  {
    id: "ew1",
    orderId: "o1",
    project: "Fintech App Redesign — Phase 1",
    client: "Asaka Capital",
    clientHue: 215,
    freelancer: "Nargiza Akhmedova",
    freelancerHue: 250,
    amount: 12000,
    status: "in_progress",
    milestones: [
      { label: "Tadqiqot va wireframe'lar", amount: 2000, status: "released" },
      { label: "Yuqori sifatli ekranlar", amount: 4000, status: "released" },
      { label: "Prototip va topshirish", amount: 6000, status: "funded" },
    ],
    timeline: [
      { step: "Taklif yuborildi", date: "May 28", done: true },
      { step: "Taklif qabul qilindi", date: "May 29", done: true },
      { step: "Eskrou to'ldirildi", date: "May 30", done: true },
      { step: "Ish boshlandi", date: "Jun 01", done: true },
      { step: "Bosqich topshirildi", date: "Jun 10", done: true },
      { step: "Mijoz ko'rib chiqishi", date: "Jun 12", done: false },
      { step: "Mablag' chiqarildi", date: "—", done: false },
      { step: "Yakunlandi", date: "—", done: false },
    ],
  },
  {
    id: "ew2",
    orderId: "o2",
    project: "Brand Identity System",
    client: "Hunar Bazaar",
    clientHue: 290,
    freelancer: "Nargiza Akhmedova",
    freelancerHue: 250,
    amount: 1200,
    status: "review",
    milestones: [
      { label: "Logo va belgi", amount: 400, status: "released" },
      { label: "Rang va shrift tizimi", amount: 400, status: "released" },
      { label: "Brend qo'llanmasi PDF", amount: 400, status: "funded" },
    ],
    timeline: [
      { step: "Taklif yuborildi", date: "May 20", done: true },
      { step: "Taklif qabul qilindi", date: "May 21", done: true },
      { step: "Eskrou to'ldirildi", date: "May 22", done: true },
      { step: "Ish boshlandi", date: "May 23", done: true },
      { step: "Bosqich topshirildi", date: "Jun 11", done: true },
      { step: "Mijoz ko'rib chiqishi", date: "Jun 12", done: true },
      { step: "Mablag' chiqarildi", date: "—", done: false },
      { step: "Yakunlandi", date: "—", done: false },
    ],
  },
  {
    id: "ew3",
    orderId: "o3",
    project: "iOS App — On-demand delivery",
    client: "Tezda",
    clientHue: 250,
    freelancer: "Farrukh Saidov",
    freelancerHue: 210,
    amount: 8800,
    status: "in_progress",
    milestones: [
      { label: "Arxitektura va sprint 1", amount: 2200, status: "released" },
      { label: "Asosiy funksiyalar ishlab chiqish", amount: 4400, status: "funded" },
      { label: "Test va App Store", amount: 2200, status: "pending" },
    ],
    timeline: [
      { step: "Taklif yuborildi", date: "Apr 15", done: true },
      { step: "Taklif qabul qilindi", date: "Apr 18", done: true },
      { step: "Eskrou to'ldirildi", date: "Apr 20", done: true },
      { step: "Ish boshlandi", date: "Apr 22", done: true },
      { step: "Bosqich topshirildi", date: "Jun 08", done: false },
      { step: "Mijoz ko'rib chiqishi", date: "—", done: false },
      { step: "Mablag' chiqarildi", date: "—", done: false },
      { step: "Yakunlandi", date: "—", done: false },
    ],
  },
  {
    id: "ew4",
    orderId: "o5",
    project: "Webflow Marketing Site",
    client: "Soliq Pro",
    clientHue: 210,
    freelancer: "Nargiza Akhmedova",
    freelancerHue: 250,
    amount: 6500,
    status: "disputed",
    milestones: [
      { label: "Tanishuv", amount: 500, status: "released" },
      { label: "Qurish", amount: 6000, status: "disputed" },
    ],
    timeline: [
      { step: "Taklif yuborildi", date: "Apr 01", done: true },
      { step: "Taklif qabul qilindi", date: "Apr 03", done: true },
      { step: "Eskrou to'ldirildi", date: "Apr 05", done: true },
      { step: "Ish boshlandi", date: "Apr 06", done: true },
      { step: "Bosqich topshirildi", date: "May 10", done: true },
      { step: "Mijoz ko'rib chiqishi", date: "May 12", done: true },
      { step: "Nizo ochildi", date: "May 15", done: true },
      { step: "Yakunlandi", date: "—", done: false },
    ],
  },
];

export const reviews: Review[] = [
  { id: "r1", from: "Asaka Capital", fromHue: 215, project: "Fintech App Redesign", rating: 5, body: "Nargiza ajoyib ish qildi. Dizaynlar ham chiroyli, ham ishlab chiqishga tayyor. Albatta yana yollaymiz.", date: "Jun 10", freelancerUsername: "nargiza", serviceSlug: "mobile-app-design-fintech" },
  { id: "r2", from: "Tezda", fromHue: 250, project: "iOS App Development", rating: 5, body: "Farrukh haqiqiy professional. Vaqtida topshirdi, faol muloqot qildi va kod sifati a'lo darajada.", date: "Jun 05", freelancerUsername: "farrukh", serviceSlug: "ios-app-development" },
  { id: "r3", from: "Hunar Bazaar", fromHue: 290, project: "Brand Identity System", rating: 4, body: "Umumiy ish yaxshi. Tuzatishlarda biroz kechikish bo'ldi, lekin yakuniy natija bunga arzidi.", date: "May 28", freelancerUsername: "nargiza", serviceSlug: "brand-identity-system" },
  { id: "r4", from: "Aralink Labs", fromHue: 160, project: "Growth Audit", rating: 5, body: "Madina tuzgan strategiya allaqachon 3 haftada o'lchanadigan natijalar berdi.", date: "May 20", freelancerUsername: "madina", serviceSlug: "growth-strategy-audit" },
  { id: "r5", from: "Sardor M.", fromHue: 200, project: "Mobile App Design", rating: 5, body: "Bu chorakdagi eng yaxshi investitsiyamiz. Rejadan oldin topshirdi va dizayn tizimini yillar davomida ishlatamiz.", date: "2 hafta oldin", freelancerUsername: "nargiza", serviceSlug: "mobile-app-design-fintech" },
  { id: "r6", from: "Aisha K.", fromHue: 320, project: "Brand Identity", rating: 5, body: "Tipografiyaga nazar ajoyib. Kirill juftligi butun loyiha uchun yetarli edi.", date: "1 oy oldin", freelancerUsername: "nargiza", serviceSlug: "brand-identity-system" },
  { id: "r7", from: "Daniyar B.", fromHue: 22, project: "Next.js Marketplace", rating: 5, body: "Muloqot boshqa darajada. Podryadchi emas, katta mahsulot hamkori bilan ishlagandek tuyuldi.", date: "1 oy oldin", freelancerUsername: "azamat", serviceSlug: "nextjs-marketplace-build" },
  { id: "r8", from: "UNESCO CA Bureau", fromHue: 280, project: "Pattern Suite", rating: 5, body: "Temurning bezak ishlar muzey darajasida. Har bir naqsh merosimiz hikoyasini aytadi.", date: "3 hafta oldin", freelancerUsername: "temur", serviceSlug: "ornamental-pattern-suite" },
];

export const escrowRecords: EscrowRecord[] = [
  { id: "e1", project: "Fintech App Redesign", client: "Asaka Capital", clientHue: 215, amount: 6000, status: "funded", milestone: "Prototip va topshirish", date: "Jun 10" },
  { id: "e2", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, amount: 4400, status: "funded", milestone: "Asosiy funksiyalar ishlab chiqish", date: "Jun 08" },
  { id: "e3", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, amount: 400, status: "pending", milestone: "Brend qo'llanmasi PDF", date: "Jun 12" },
  { id: "e4", project: "Growth Strategy Audit", client: "Aralink Labs", clientHue: 160, amount: 850, status: "released", milestone: "To'liq topshirish", date: "Jun 05" },
];

export const escrowItems = [
  { id: "ei1", project: "Fintech App Redesign", client: "Asaka Capital", clientHue: 215, amount: 6000, status: "funded" as const, milestone: "Prototip va topshirish", dueDate: "Jun 24" },
  { id: "ei2", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, amount: 4400, status: "funded" as const, milestone: "Asosiy funksiyalar ishlab chiqish", dueDate: "Aug 01" },
  { id: "ei3", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, amount: 400, status: "pending_release" as const, milestone: "Brend qo'llanmasi PDF", dueDate: "Jun 15" },
];

export const hiringPipeline: HiringLead[] = [
  { id: "h1", name: "Nargiza Akhmedova", username: "nargiza", hue: 250, title: "Katta brend dizayneri", stage: "shortlisted", project: "Fintech App Redesign", rate: 45, rating: 5.0 },
  { id: "h2", name: "Azamat Usmanov", username: "azamat", hue: 215, title: "Full Stack muhandis", stage: "interview", project: "Fintech App Redesign", rate: 65, rating: 4.97 },
  { id: "h3", name: "Farrukh Saidov", username: "farrukh", hue: 210, title: "iOS muhandisi", stage: "offer", project: "iOS App", rate: 55, rating: 4.98 },
  { id: "h4", name: "Dilnoza Kim", username: "dilnoza", hue: 270, title: "3D rassom", stage: "reviewing", project: "Series A Deck", rate: 38, rating: 4.92 },
  { id: "h5", name: "Madina Azimova", username: "madina", hue: 290, title: "O'sish bo'yicha maslahatchi", stage: "reviewing", project: "Growth Audit", rate: 80, rating: 4.95 },
];

const skillCategories: Record<string, string> = {
  Branding: "Dizayn", Figma: "Dizayn", Webflow: "Dizayn", "Design Systems": "Dizayn",
  "Next.js": "Dasturlash", Rust: "Dasturlash", PostgreSQL: "Dasturlash", "System Architecture": "Dasturlash",
  Blender: "Ijodiy", "Cinema 4D": "Ijodiy", WebGL: "Ijodiy", "After Effects": "Ijodiy",
  Procreate: "Ijodiy", Illustrator: "Ijodiy", "Pattern Design": "Ijodiy",
  "GTM Strategy": "Strategiya", "Market Research": "Strategiya", Notion: "Strategiya", SQL: "Strategiya",
  Swift: "Dasturlash", SwiftUI: "Dasturlash", "Core Data": "Dasturlash", ARKit: "Dasturlash",
  "IP Law": "Huquq", "Cross-border": "Huquq", "M&A": "Huquq",
  AutoCAD: "Arxitektura", Rhino: "Arxitektura", "V-Ray": "Arxitektura", "Sustainable Design": "Arxitektura",
};

function buildSkillMatrix(skills: string[], jobs: number): SkillEntry[] {
  return skills.map((name, i) => ({
    name,
    level: Math.min(5, 3 + (i === 0 ? 2 : i === 1 ? 1 : 0)),
    endorsements: Math.max(3, Math.round(jobs * (0.4 - i * 0.05))),
    category: skillCategories[name] ?? "Umumiy",
  }));
}

function buildVerification(f: Freelancer): VerificationItem[] {
  return [
    { label: "Pasport", done: f.identityVerified, verifiedAt: f.identityVerified ? "Jan 2023" : undefined },
    { label: "Yuridik shaxs", done: f.businessVerified, verifiedAt: f.businessVerified ? "Mar 2024" : undefined },
    { label: "Telefon raqami", done: true, verifiedAt: "Jan 2023" },
    { label: "Email manzil", done: true, verifiedAt: "Jan 2023" },
    { label: "To'lov usuli", done: true, verifiedAt: "Feb 2023" },
  ];
}

const defaultLanguages: Language[] = [
  { language: "O'zbek", level: "Ona tili" },
  { language: "Rus", level: "Erkin" },
  { language: "Ingliz", level: "Ish professional" },
];

export type EnrichedFreelancer = Freelancer & {
  skillMatrix: SkillEntry[];
  memberSince: string;
  languages: Language[];
  verification: VerificationItem[];
};

export function enrichFreelancer(f: Freelancer): EnrichedFreelancer {
  return {
    ...f,
    skillMatrix: f.skillMatrix ?? buildSkillMatrix(f.skills, f.jobs),
    memberSince: f.memberSince ?? "2022",
    languages: f.languages ?? defaultLanguages,
    verification: f.verification ?? buildVerification(f),
    videoIntro: f.videoIntro ?? (f.jobs >= 40 ? { duration: "2:14" } : undefined),
  };
}

function parseDeliveryDays(delivery: string): number {
  const match = delivery.match(/(\d+)/);
  return match ? Number(match[1]) : 7;
}

function buildPackages(service: Service): ServicePackage[] {
  const base = service.price;
  const days = parseDeliveryDays(service.delivery);
  return [
    {
      tier: "Essential",
      price: base,
      delivery: `${days} kun`,
      revisions: 2,
      description: `${service.category.toLowerCase()} bo'yicha asosiy natijalar — tor doirada.`,
      features: [`Asosiy ${service.category.toLowerCase()} hajmi`, "Manba fayllar kiritilgan", "1 ta tuzatish bosqichi", "Standart muddat"],
    },
    {
      tier: "Premium",
      price: Math.round(base * 2.04),
      delivery: `${days + 5} kun`,
      revisions: 4,
      description: `Kengaytirilgan tuzatishlar va topshirish bilan to'liq ${service.category.toLowerCase()} paketi.`,
      features: [`To'liq ${service.category.toLowerCase()} hajmi`, "Ustuvor qo'llab-quvvatlash", "4 ta tuzatish bosqichi", "Topshirish sessiyasi", "Dizayn tokenlari / hujjatlar"],
      popular: true,
    },
    {
      tier: "Enterprise",
      price: Math.round(base * 5),
      delivery: `${days + 14} kun`,
      revisions: "Cheksiz",
      description: `Maxsus qo'llab-quvvatlash va kengaytirilgan kafolat bilan korporativ darajadagi hamkorlik.`,
      features: ["Kategoriya doirasida cheksiz hajm", "Maxsus Slack kanali", "Cheksiz tuzatishlar", "Topshirgandan keyin 30 kun qo'llab-quvvatlash", "Jamoa onboarding sessiyasi"],
    },
  ];
}

function buildGallery(service: Service): ServiceGalleryImage[] {
  return [
    { hue: service.hue, caption: "Asosiy natija ko'rinishi" },
    { hue: (service.hue + 25) % 360, caption: "Batafsil ko'rinish — komponentlar kutubxonasi" },
    { hue: (service.hue + 50) % 360, caption: "Mobil moslashuvchi maketlar" },
    { hue: (service.hue + 75) % 360, caption: "Dizayn tizimi tokenlari" },
    { hue: (service.hue + 100) % 360, caption: "Topshirish hujjatlari" },
  ];
}

function buildFaqs(service: Service): ServiceFaq[] {
  return [
    { question: "Boshlash uchun nimalar kerak?", answer: "Maqsadlaringizni tavsiflovchi qisqa brif, brend materiallari (agar bo'lsa) va maqsadli auditoriya. Buyurtma tasdiqlangandan keyin 24 soat ichida kickoff so'rovnomasi yuboraman." },
    { question: "Tuzatishlar qanday ishlaydi?", answer: "Har bir paketda belgilangan tuzatish bosqichlari bor. Tuzatishlar kelishilgan doira ichidagi yaxshilashlarni qamrab oladi — to'liq qayta dizayn emas. Kerak bo'lsa qo'shimcha bosqichlar sotib olinadi." },
    { question: "To'lovim himoyalanganmi?", answer: "Ha. Barcha to'lovlar Ishbor eskrouida saqlanadi va faqat yetkazilgan ishni tasdiqlaganingizda chiqariladi. Sotuvchi vaqtida yetkazmasa to'liq qaytarish." },
    { question: "Platformadan tashqarida muloqot qila olamizmi?", answer: "Eskrou himoyasi va nizo hal qilish uchun barcha loyiha muloqoti Ishbor'da qolishi kerak. Video qo'ng'iroqlar platforma orqali rejalashtiriladi." },
    { question: `Bu ${service.category.toLowerCase()} xizmati nimasi bilan farq qiladi?`, answer: `${service.seller}ning Ishbor'dagi ${service.sellerSuccessScore}/100 muvaffaqiyat balli, ${service.sellerCompletionRate}% yakunlash va ${service.sellerRepeatClients}% qayta mijoz ko'rsatkichi bor — $${(service.sellerTotalEarned / 1000).toFixed(0)}k tasdiqlangan daromad bilan.` },
  ];
}

const serviceDescriptions: Record<string, { description: string; extended: string; included: string[] }> = {
  "mobile-app-design-fintech": {
    description: "Regulyatsiyalangan moliyaviy mahsulot uchun ishlab chiqishga tayyor dizayn tizimini olasiz. Har bir natija harakat spetsifikatsiyalari, qulaylik annotatsiyalari va muhandislik jamoasi uchun topshirish sessiyasi bilan keladi.",
    extended: "Ikki mintaqaviy neobank uchun chakana banking ilovalarini ishlab chiqqanman va milliy pochta uchun raqamli to'lovlar joriy etishda maslahat berdim. 2 haftalik sprintlar, haftalik Loom yangilanishlari va maxsus Slack kanali bilan ishlayman. Lokalizatsiyaga tayyor — kirill, lotin va arab yozuvlari to'g'ri kerning va og'irlik juftliklari bilan.",
    included: ["Brendga mos mobil UI", "Figma'da komponentlar kutubxonasi", "Dizayn tokenlari (CSS / JSON)", "Harakat spetsifikatsiyalari", "Qulaylik auditi (AA)", "Muhandislik topshirish sessiyasi"],
  },
  "nextjs-marketplace-build": {
    description: "Autentifikatsiya, to'lovlar va admin vositalari bilan ishlab chiqishga tayyor Next.js marketplace — birinchi kundan miqyoslash uchun qurilgan.",
    extended: "Uzcard'da 99,97% uptime bilan to'lov tizimlarini ishlab chiqqan muhandis. Stack: Next.js 15, PostgreSQL, Stripe Connect va yuqori o'tkazuvchanlik operatsiyalar uchun Rust mikroservislar.",
    included: ["Next.js 15 app router sozlash", "Stripe Connect integratsiyasi", "PostgreSQL sxema + migratsiyalar", "Admin panel", "CI/CD pipeline", "30 kunlik xato tuzatish kafolati"],
  },
  "brand-identity-system": {
    description: "Logo, tipografiya, rang va qo'llanmalar — bozorlar bo'ylab kengayishga mo'ljallangan to'liq brend identifikatsiya tizimi.",
    extended: "Bo'zordan zalga: Toshkent ko'cha reklamalarida ham, London investor taqdimotlarida ham ishlaydigan identifikatsiyalar. Stakeholder workshop va raqobat auditi kiritilgan.",
    included: ["Logo va wordmark to'plami", "Rang va tipografiya tizimi", "Brend qo'llanmasi PDF", "Ijtimoiy tarmoq shablonlari", "Kanselyariya maketlari", "Figma manba fayllari"],
  },
};

export type EnrichedService = Service & {
  gallery: ServiceGalleryImage[];
  description: string;
  descriptionExtended: string;
  included: string[];
  packages: ServicePackage[];
  faqs: ServiceFaq[];
};

export function enrichService(s: Service): EnrichedService {
  const custom = serviceDescriptions[s.slug];
  return {
    ...s,
    gallery: s.gallery ?? buildGallery(s),
    description: s.description ?? custom?.description ?? `${s.seller} — Ishbor'dagi ${s.sellerLevel} sotuvchi, ${s.reviews} tasdiqlangan sharh bilan professional ${s.category.toLowerCase()} xizmati.`,
    descriptionExtended: s.descriptionExtended ?? custom?.extended ?? `Har bir loyihaga ${s.sellerSuccessScore}/100 muvaffaqiyat balli va ${s.sellerCompletionRate}% vaqtida topshirish kafolatini olib kiraman. Muloqot platformada, eskrou himoyalangan bosqichlar bilan.`,
    included: s.included ?? custom?.included ?? [`${s.category} natijalari`, "Manba fayllar", "Paket bo'yicha tuzatish bosqichlari", "Platforma xabarlari qo'llab-quvvatlash", "Eskrou himoyalangan to'lov"],
    packages: s.packages ?? buildPackages(s),
    faqs: s.faqs ?? buildFaqs(s),
  };
}

export function getFreelancerReviews(username: string): Review[] {
  return reviews.filter((r) => r.freelancerUsername === username);
}

export function getServiceReviews(slug: string): Review[] {
  const direct = reviews.filter((r) => r.serviceSlug === slug);
  if (direct.length > 0) return direct;
  const service = services.find((s) => s.slug === slug);
  if (!service) return [];
  return reviews.filter((r) => r.freelancerUsername === service.sellerUsername).slice(0, 3);
}

export function getSimilarServices(slug: string, limit = 4): Service[] {
  const current = services.find((s) => s.slug === slug);
  if (!current) return services.slice(0, limit);
  const sameCategory = services.filter((s) => s.slug !== slug && s.category === current.category);
  const rest = services.filter((s) => s.slug !== slug && s.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

export function getClient(slug: string): ClientCompany | undefined {
  return clients.find((c) => c.slug === slug);
}

export function getClientProjects(slug: string): Project[] {
  const client = getClient(slug);
  if (!client) return [];
  return projects.filter((p) => p.client === client.name);
}

export function getClientReviews(slug: string): Review[] {
  const client = getClient(slug);
  if (!client) return [];
  return reviews.filter((r) => r.from === client.name);
}

export function getOrder(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}

export function getApplication(id: string): Application | undefined {
  return applications.find((a) => a.id === id);
}

export function getEscrowWorkflow(id: string): EscrowWorkflow | undefined {
  return escrowWorkflows.find((e) => e.id === id);
}

export function getEscrowByOrderId(orderId: string): EscrowWorkflow | undefined {
  return escrowWorkflows.find((e) => e.orderId === orderId);
}

export function getFreelancerServices(username: string): Service[] {
  return services.filter((s) => s.sellerUsername === username);
}

export function getClientByName(name: string): ClientCompany | undefined {
  return clients.find((c) => c.name === name);
}
