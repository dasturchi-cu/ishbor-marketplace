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
  { id: "f1", username: "nargiza", name: "Nargiza Akhmedova", title: "Senior Brand Strategist & UI Designer", city: "Tashkent", rate: 45, rating: 5.0, reviews: 184, level: "Top Rated", skills: ["Branding", "Figma", "Webflow", "Design Systems"], bio: "I help fintech and luxury brands across Central Asia build identities that translate from bazaar to boardroom. 8 years, 120+ projects.", available: true, hue: 250, earned: 184000, jobs: 124, successScore: 98, completionRate: 100, onTimeDelivery: 99, responseTime: "< 30m", repeatClients: 72, identityVerified: true, businessVerified: true, portfolio: [{ title: "Asaka Neo-bank Rebrand", category: "Branding", hue: 250, year: 2025 }, { title: "Tezda Rider App", category: "Mobile Design", hue: 210, year: 2025 }, { title: "Hunar Bazaar Identity", category: "Brand System", hue: 290, year: 2024 }, { title: "Soliq Pro Dashboard", category: "Product Design", hue: 230, year: 2024 }, { title: "Aralink Investor Deck", category: "Presentation", hue: 160, year: 2024 }, { title: "Uzcard App Refresh", category: "Mobile Design", hue: 215, year: 2023 }], caseStudies: [{ title: "Asaka Neo-bank: From legacy to leader", client: "Asaka Capital", clientHue: 215, result: "3x user activation, 40% fewer support tickets", hue: 250 }, { title: "Hunar Bazaar: A brand that travels", client: "Hunar Bazaar", clientHue: 290, result: "2.8x conversion lift, 3 new market entries", hue: 290 }] },
  { id: "f2", username: "azamat", name: "Azamat Usmanov", title: "Full Stack Engineer (Next.js / Rust)", city: "Samarkand", rate: 65, rating: 4.97, reviews: 92, level: "Expert", skills: ["Next.js", "Rust", "PostgreSQL", "System Architecture"], bio: "Building distributed payment systems for regional banks. Ex-Uzcard. Open to long-term retainers.", available: true, hue: 215, earned: 310000, jobs: 64, successScore: 96, completionRate: 98, onTimeDelivery: 97, responseTime: "< 1h", repeatClients: 58, identityVerified: true, businessVerified: false, portfolio: [{ title: "Uzcard Payment Gateway", category: "Fintech", hue: 215, year: 2025 }, { title: "Ishbor Marketplace", category: "E-commerce", hue: 250, year: 2025 }, { title: "Alif Banking API", category: "Fintech", hue: 200, year: 2024 }, { title: "Kaspi Micro-services", category: "Payments", hue: 180, year: 2024 }, { title: "Soliq Tax Engine", category: "GovTech", hue: 230, year: 2023 }, { title: "Tezda Dispatch System", category: "Logistics", hue: 210, year: 2023 }], caseStudies: [{ title: "Uzcard: Real-time at scale", client: "Uzcard", clientHue: 215, result: "99.97% uptime, 12ms p95 latency", hue: 215 }] },
  { id: "f3", username: "dilnoza", name: "Dilnoza Kim", title: "3D Artist & Motion Designer", city: "Almaty", rate: 38, rating: 4.92, reviews: 41, level: "Rising", skills: ["Blender", "Cinema 4D", "WebGL", "After Effects"], bio: "Procedural geometry meets nomadic ornament. Latest work: Aral Sea documentary opener.", available: true, hue: 270, earned: 62000, jobs: 28, successScore: 88, completionRate: 96, onTimeDelivery: 94, responseTime: "< 2h", repeatClients: 34, identityVerified: true, businessVerified: false, portfolio: [{ title: "Aral Sea Documentary Opener", category: "Motion", hue: 270, year: 2025 }, { title: "Kazakh Pavilion Expo", category: "3D Viz", hue: 160, year: 2025 }, { title: "Nomad Jewelry Collection", category: "Product Render", hue: 290, year: 2024 }, { title: "Silk Road Animatic", category: "Animation", hue: 230, year: 2024 }, { title: "Almaty City Flyover", category: "3D Viz", hue: 215, year: 2023 }, { title: "Heritage Tile Generator", category: "Generative", hue: 280, year: 2023 }], caseStudies: [] },
  { id: "f4", username: "temur", name: "Temur Ismoilov", title: "Master Illustrator & Pattern Designer", city: "Bukhara", rate: 35, rating: 5.0, reviews: 67, level: "Top Rated", skills: ["Procreate", "Illustrator", "Pattern Design"], bio: "Six generations of suzani makers in my family. Now I design for fashion houses and CPG brands.", available: false, hue: 230, earned: 88000, jobs: 51, successScore: 97, completionRate: 100, onTimeDelivery: 98, responseTime: "< 1h", repeatClients: 65, identityVerified: true, businessVerified: true, portfolio: [{ title: "Chopard Suzani Collection", category: "Pattern", hue: 230, year: 2025 }, { title: "UNESCO Heritage Prints", category: "Illustration", hue: 280, year: 2025 }, { title: "Silk Road CPG Labels", category: "Packaging", hue: 290, year: 2024 }, { title: "Bukhara Tile Atlas", category: "Pattern", hue: 200, year: 2024 }, { title: "LVMH Ornament Series", category: "Pattern", hue: 250, year: 2023 }, { title: "National Museum Murals", category: "Illustration", hue: 160, year: 2023 }], caseStudies: [{ title: "Chopard: Heritage meets haute couture", client: "Chopard", clientHue: 230, result: "Collection sold out in 48h, featured in Vogue CA", hue: 230 }] },
  { id: "f5", username: "madina", name: "Madina Azimova", title: "Growth & Strategy Consultant", city: "Tashkent", rate: 80, rating: 4.95, reviews: 53, level: "Expert", skills: ["GTM Strategy", "Market Research", "Notion", "SQL"], bio: "Led growth at three regional unicorns. I build playbooks, not slide decks.", available: true, hue: 290, earned: 245000, jobs: 38, successScore: 95, completionRate: 97, onTimeDelivery: 96, responseTime: "< 45m", repeatClients: 52, identityVerified: true, businessVerified: true, portfolio: [{ title: "Alif Growth Engine", category: "Strategy", hue: 290, year: 2025 }, { title: "Payme Retention Audit", category: "Growth", hue: 215, year: 2025 }, { title: "Tezda City Launch", category: "GTM", hue: 210, year: 2024 }, { title: "Aralink Fundraise Deck", category: "Strategy", hue: 160, year: 2024 }, { title: "Uzum Market Playbook", category: "Growth", hue: 250, year: 2023 }, { title: "Soliq Enterprise GTM", category: "Strategy", hue: 230, year: 2023 }], caseStudies: [{ title: "Alif: From 0 to 2M users in 14 months", client: "Alif Bank", clientHue: 290, result: "2M users, 340% MAU growth, $12M Series B", hue: 290 }] },
  { id: "f6", username: "farrukh", name: "Farrukh Saidov", title: "iOS Engineer • Swift & SwiftUI", city: "Tashkent", rate: 55, rating: 4.98, reviews: 71, level: "Top Rated", skills: ["Swift", "SwiftUI", "Core Data", "ARKit"], bio: "Shipped 14 apps to the App Store. Specializing in fintech and on-demand.", available: true, hue: 210, earned: 198000, jobs: 47, successScore: 97, completionRate: 100, onTimeDelivery: 99, responseTime: "< 20m", repeatClients: 68, identityVerified: true, businessVerified: false, portfolio: [{ title: "Tezda Rider iOS App", category: "Mobile", hue: 210, year: 2025 }, { title: "Asaka Mobile Banking", category: "Fintech", hue: 215, year: 2025 }, { title: "Payme Wallet", category: "Fintech", hue: 250, year: 2024 }, { title: "Kaspi Gold iOS", category: "Fintech", hue: 180, year: 2024 }, { title: "Uzum Market", category: "E-commerce", hue: 290, year: 2023 }, { title: "MyTaxi Tashkent", category: "On-demand", hue: 200, year: 2023 }], caseStudies: [{ title: "Tezda: 0 to 100K downloads in 3 months", client: "Tezda", clientHue: 250, result: "4.8 App Store rating, 0.3% crash rate", hue: 210 }] },
  { id: "f7", username: "kamila", name: "Kamila Yusupova", title: "Legal Consultant • IP & Contracts", city: "Tashkent", rate: 95, rating: 5.0, reviews: 32, level: "Expert", skills: ["IP Law", "Cross-border", "M&A"], bio: "Cross-border counsel for SaaS and creative businesses entering CIS markets.", available: true, hue: 200, earned: 412000, jobs: 22, successScore: 99, completionRate: 100, onTimeDelivery: 100, responseTime: "< 1h", repeatClients: 82, identityVerified: true, businessVerified: true, portfolio: [{ title: "Alif IP Portfolio Setup", category: "Legal", hue: 200, year: 2025 }, { title: "Uzum Cross-border SPA", category: "M&A", hue: 215, year: 2025 }, { title: "Ishbor Terms of Trade", category: "Legal", hue: 250, year: 2024 }, { title: "Chopard IP Licensing", category: "IP Law", hue: 230, year: 2024 }, { title: "UNESCO Heritage IP", category: "IP Law", hue: 280, year: 2023 }, { title: "Kaspi Compliance Audit", category: "Legal", hue: 180, year: 2023 }], caseStudies: [{ title: "Alif: IP portfolio for 9 markets", client: "Alif Bank", clientHue: 200, result: "Protected in 9 jurisdictions, 0 infringement cases", hue: 200 }] },
  { id: "f8", username: "rustam", name: "Rustam Khalilov", title: "Architect & Interior Designer", city: "Samarkand", rate: 50, rating: 4.94, reviews: 28, level: "Verified", skills: ["AutoCAD", "Rhino", "V-Ray", "Sustainable Design"], bio: "Restoration of madrasas meets contemporary residential. Riga-trained.", available: true, hue: 160, earned: 124000, jobs: 19, successScore: 91, completionRate: 95, onTimeDelivery: 93, responseTime: "< 3h", repeatClients: 42, identityVerified: true, businessVerified: false, portfolio: [{ title: "Registan Madrasa Restoration", category: "Heritage", hue: 160, year: 2025 }, { title: "Tashkent Loft Residences", category: "Interior", hue: 250, year: 2025 }, { title: "Bukhara Boutique Hotel", category: "Interior", hue: 230, year: 2024 }, { title: "Almaty Co-working Space", category: "Commercial", hue: 215, year: 2024 }, { title: "Samarkand Villa", category: "Residential", hue: 290, year: 2023 }, { title: "UNESCO Site Documentation", category: "Heritage", hue: 280, year: 2023 }], caseStudies: [] },
];

export const services: Service[] = [
  { id: "s1", slug: "mobile-app-design-fintech", title: "I will design a premium fintech mobile app from scratch", seller: "Nargiza A.", sellerHue: 250, sellerUsername: "nargiza", sellerLevel: "Top Rated", sellerSuccessScore: 98, sellerCompletionRate: 100, sellerOnTime: 99, sellerResponseTime: "< 30m", sellerIdentityVerified: true, sellerRepeatClients: 72, sellerTotalEarned: 184000, category: "Mobile Design", price: 480, rating: 5.0, reviews: 89, delivery: "7 days", hue: 250, inProgress: 2, queuePosition: 3 },
  { id: "s2", slug: "nextjs-marketplace-build", title: "I will build a production Next.js marketplace with Stripe", seller: "Azamat U.", sellerHue: 215, sellerUsername: "azamat", sellerLevel: "Expert", sellerSuccessScore: 96, sellerCompletionRate: 98, sellerOnTime: 97, sellerResponseTime: "< 1h", sellerIdentityVerified: true, sellerRepeatClients: 58, sellerTotalEarned: 310000, category: "Web Development", price: 1800, rating: 4.98, reviews: 41, delivery: "21 days", hue: 215, inProgress: 1, queuePosition: 1 },
  { id: "s3", slug: "brand-identity-system", title: "I will craft a complete brand identity system & guidelines", seller: "Nargiza A.", sellerHue: 250, sellerUsername: "nargiza", sellerLevel: "Top Rated", sellerSuccessScore: 98, sellerCompletionRate: 100, sellerOnTime: 99, sellerResponseTime: "< 30m", sellerIdentityVerified: true, sellerRepeatClients: 72, sellerTotalEarned: 184000, category: "Branding", price: 1200, rating: 5.0, reviews: 67, delivery: "14 days", hue: 230, inProgress: 2, queuePosition: 3 },
  { id: "s4", slug: "ornamental-pattern-suite", title: "I will create custom Central Asian ornamental patterns", seller: "Temur I.", sellerHue: 230, sellerUsername: "temur", sellerLevel: "Top Rated", sellerSuccessScore: 97, sellerCompletionRate: 100, sellerOnTime: 98, sellerResponseTime: "< 1h", sellerIdentityVerified: true, sellerRepeatClients: 65, sellerTotalEarned: 88000, category: "Illustration", price: 280, rating: 5.0, reviews: 38, delivery: "5 days", hue: 280, inProgress: 0, queuePosition: 1 },
  { id: "s5", slug: "ios-app-development", title: "I will build a native iOS app in Swift / SwiftUI", seller: "Farrukh S.", sellerHue: 210, sellerUsername: "farrukh", sellerLevel: "Top Rated", sellerSuccessScore: 97, sellerCompletionRate: 100, sellerOnTime: 99, sellerResponseTime: "< 20m", sellerIdentityVerified: true, sellerRepeatClients: 68, sellerTotalEarned: 198000, category: "Mobile Development", price: 2400, rating: 4.96, reviews: 29, delivery: "30 days", hue: 210, inProgress: 1, queuePosition: 2 },
  { id: "s6", slug: "growth-strategy-audit", title: "I will run a 360 growth audit & 90-day playbook", seller: "Madina A.", sellerHue: 290, sellerUsername: "madina", sellerLevel: "Expert", sellerSuccessScore: 95, sellerCompletionRate: 97, sellerOnTime: 96, sellerResponseTime: "< 45m", sellerIdentityVerified: true, sellerRepeatClients: 52, sellerTotalEarned: 245000, category: "Strategy", price: 850, rating: 5.0, reviews: 22, delivery: "10 days", hue: 260, inProgress: 0, queuePosition: 1 },
  { id: "s7", slug: "3d-product-renders", title: "I will create photoreal 3D product renders & animation", seller: "Dilnoza K.", sellerHue: 270, sellerUsername: "dilnoza", sellerLevel: "Rising", sellerSuccessScore: 88, sellerCompletionRate: 96, sellerOnTime: 94, sellerResponseTime: "< 2h", sellerIdentityVerified: true, sellerRepeatClients: 34, sellerTotalEarned: 62000, category: "3D & Motion", price: 360, rating: 4.92, reviews: 18, delivery: "7 days", hue: 270, inProgress: 1, queuePosition: 1 },
  { id: "s8", slug: "ip-contract-review", title: "I will review and draft cross-border SaaS contracts", seller: "Kamila Y.", sellerHue: 200, sellerUsername: "kamila", sellerLevel: "Expert", sellerSuccessScore: 99, sellerCompletionRate: 100, sellerOnTime: 100, sellerResponseTime: "< 1h", sellerIdentityVerified: true, sellerRepeatClients: 82, sellerTotalEarned: 412000, category: "Legal", price: 520, rating: 5.0, reviews: 14, delivery: "3 days", hue: 200, inProgress: 0, queuePosition: 1 },
];

export const projects: Project[] = [
  { id: "p1", slug: "fintech-app-redesign", title: "Fintech App Redesign for National Bank", client: "Asaka Capital", clientHue: 215, clientSpent: 184200, clientHires: 12, clientVerified: true, clientMemberSince: "2022", budget: 12000, budgetType: "fixed", category: "Product Design", postedAgo: "4h ago", proposals: 12, description: "Looking for an expert UI designer to lead the mobile transformation of our retail banking platform.", skills: ["Figma", "Design Systems", "Fintech", "Accessibility"], duration: "6 weeks", verified: true, escrowProtected: true, scope: ["Mobile app UI redesign", "Design system creation", "Prototype with animations", "Engineering handoff"], experienceLevel: "Expert" },
  { id: "p2", slug: "arabic-cyrillic-localization", title: "Arabic & Cyrillic Localization for E-commerce", client: "Hunar Bazaar", clientHue: 290, clientSpent: 42800, clientHires: 6, clientVerified: true, clientMemberSince: "2023", budget: 3500, budgetType: "fixed", category: "Localization", postedAgo: "8h ago", proposals: 8, description: "RTL layouts and specialized font weights for an upscale regional lifestyle brand.", skills: ["i18n", "RTL", "Typography", "Next.js"], duration: "3 weeks", verified: true, escrowProtected: true, scope: ["RTL layout implementation", "Arabic typography pairing", "Content translation QA", "Cross-browser testing"], experienceLevel: "Intermediate" },
  { id: "p3", slug: "series-a-pitch-deck", title: "Series A Pitch Deck — Climate Tech", client: "Aralink Labs", clientHue: 160, clientSpent: 8500, clientHires: 3, clientVerified: true, clientMemberSince: "2024", budget: 4500, budgetType: "fixed", category: "Strategy & Design", postedAgo: "1d ago", proposals: 21, description: "18-slide deck for $8M Series A. Climate tech / water restoration in the Aral basin.", skills: ["Pitch Decks", "Storytelling", "Keynote", "Climate"], duration: "10 days", verified: true, escrowProtected: true, scope: ["18-slide investor deck", "Data visualization design", "Financial model summary page", "2 rounds of revisions"], experienceLevel: "Expert" },
  { id: "p4", slug: "ios-engineer-on-demand", title: "Long-term iOS Engineer — On-demand startup", client: "Tezda", clientHue: 250, clientSpent: 88000, clientHires: 4, clientVerified: true, clientMemberSince: "2022", budget: 55, budgetType: "hourly", category: "Mobile Development", postedAgo: "1d ago", proposals: 6, description: "Senior iOS engineer for 20-30h/week, 6 months minimum. SwiftUI, Combine, MapKit.", skills: ["Swift", "SwiftUI", "MapKit", "Combine"], duration: "6+ months", verified: true, escrowProtected: true, scope: ["Full-time engagement 20-30h/week", "Feature development in SwiftUI", "MapKit integration", "App Store submission support"], experienceLevel: "Expert" },
  { id: "p5", slug: "madrasa-restoration-3d", title: "Madrasa Restoration — 3D Documentation", client: "UNESCO CA Bureau", clientHue: 280, clientSpent: 32000, clientHires: 2, clientVerified: true, clientMemberSince: "2021", budget: 8000, budgetType: "fixed", category: "Architecture", postedAgo: "2d ago", proposals: 4, description: "Photogrammetry, 3D modelling and restoration drawings for a 16th-century madrasa in Bukhara.", skills: ["Photogrammetry", "Rhino", "Heritage", "AutoCAD"], duration: "8 weeks", verified: true, escrowProtected: true, scope: ["Site photogrammetry scan", "3D model reconstruction in Rhino", "Restoration drawings in AutoCAD", "Final report with measurements"], experienceLevel: "Expert" },
  { id: "p6", slug: "b2b-saas-webflow", title: "B2B SaaS Marketing Site (Webflow)", client: "Soliq Pro", clientHue: 210, clientSpent: 6500, clientHires: 1, clientVerified: false, clientMemberSince: "2025", budget: 6500, budgetType: "fixed", category: "Web Design", postedAgo: "3d ago", proposals: 18, description: "Premium marketing site for a tax-automation SaaS. Webflow build, 8 pages plus blog.", skills: ["Webflow", "Copywriting", "Animation", "SEO"], duration: "5 weeks", verified: false, escrowProtected: true, scope: ["8-page marketing site", "Blog setup in Webflow", "Custom animations", "SEO optimization"], experienceLevel: "Intermediate" },
];

export const categories = [
  { slug: "design", name: "Design & Brand", count: 1240, glyph: "✦" },
  { slug: "development", name: "Development", count: 2820, glyph: "◇" },
  { slug: "marketing", name: "Marketing & Growth", count: 940, glyph: "✶" },
  { slug: "writing", name: "Writing & Translation", count: 1180, glyph: "✧" },
  { slug: "video", name: "Video & Animation", count: 620, glyph: "❋" },
  { slug: "architecture", name: "Architecture & 3D", count: 410, glyph: "◈" },
  { slug: "consulting", name: "Strategy & Legal", count: 380, glyph: "✺" },
  { slug: "craft", name: "Craft & Heritage", count: 290, glyph: "✻" },
];

export const messages = [
  { id: "m1", name: "Nargiza Akhmedova", hue: 250, snippet: "I've prepared three direction explorations for the dashboard…", time: "2m", unread: 2, online: true },
  { id: "m2", name: "Asaka Capital", hue: 215, snippet: "Contract signed. First milestone funded into escrow.", time: "1h", unread: 0, online: false },
  { id: "m3", name: "Azamat Usmanov", hue: 210, snippet: "Shipped the migrations. Ready for review whenever.", time: "3h", unread: 1, online: true },
  { id: "m4", name: "Madina Azimova", hue: 290, snippet: "Quick call Thursday to walk through the growth playbook?", time: "1d", unread: 0, online: false },
  { id: "m5", name: "Hunar Bazaar", hue: 290, snippet: "We loved the proposal. Sending the brief now.", time: "2d", unread: 0, online: false },
];

export const notifications = [
  { id: "n1", kind: "payment" as const, title: "Milestone funded", body: "Asaka Capital funded $4,000 into escrow for Fintech App Redesign.", time: "12m", read: false, priority: "high" as const },
  { id: "n2", kind: "proposal" as const, title: "New proposal received", body: "Azamat Usmanov submitted a proposal on your iOS project.", time: "1h", read: false, priority: "high" as const },
  { id: "n3", kind: "review" as const, title: "5-star review", body: "Tezda left a 5-star review on your iOS engagement. Great work!", time: "3h", read: false, priority: "normal" as const },
  { id: "n4", kind: "escrow" as const, title: "Milestone approved", body: "Your milestone for the Brand Identity project has been approved and released.", time: "5h", read: true, priority: "normal" as const },
  { id: "n5", kind: "message" as const, title: "Message from Nargiza", body: "I've prepared three direction explorations for the dashboard. Want me to walk through them?", time: "1d", read: true, priority: "normal" as const },
  { id: "n6", kind: "system" as const, title: "Identity verified", body: "Your Passport ID is now verified. You qualify for Pro listings and higher escrow limits.", time: "1d", read: true, priority: "normal" as const },
  { id: "n7", kind: "proposal" as const, title: "Proposal shortlisted", body: "Soliq Pro shortlisted your proposal for the Webflow Marketing Site project.", time: "2d", read: true, priority: "normal" as const },
  { id: "n8", kind: "payment" as const, title: "Withdrawal completed", body: "Your withdrawal of $2,200 to Humo card ending in 4421 has been processed.", time: "3d", read: true, priority: "low" as const },
];

export const transactions = [
  { id: "t1", kind: "in" as const, label: "Milestone release", project: "Fintech App Redesign", amount: 4000, date: "Jun 10", status: "Completed" },
  { id: "t2", kind: "out" as const, label: "Withdrawal — Humo card", project: "•••• 4421", amount: -2200, date: "Jun 08", status: "Completed" },
  { id: "t3", kind: "in" as const, label: "Service order", project: "Brand Identity System", amount: 1200, date: "Jun 06", status: "Completed" },
  { id: "t4", kind: "fee" as const, label: "Platform fee", project: "Brand Identity System", amount: -96, date: "Jun 06", status: "Completed" },
  { id: "t5", kind: "in" as const, label: "Milestone release", project: "Localization sprint", amount: 1750, date: "Jun 02", status: "Completed" },
  { id: "t6", kind: "out" as const, label: "Withdrawal — Uzcard", project: "•••• 8829", amount: -3000, date: "May 29", status: "Pending" },
  { id: "t7", kind: "in" as const, label: "Order payment", project: "iOS App Development", amount: 2400, date: "May 25", status: "Completed" },
  { id: "t8", kind: "fee" as const, label: "Platform fee", project: "iOS App Development", amount: -192, date: "May 25", status: "Completed" },
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
    bio: "National retail bank transforming mobile experiences for 2M+ customers across Uzbekistan.",
    website: "asaka.uz",
    team: [
      { name: "Sardor Mirkomilov", role: "Head of Product", hue: 215 },
      { name: "Aisha Karimova", role: "Design Lead", hue: 320 },
      { name: "Daniyar Bekov", role: "Engineering Manager", hue: 22 },
    ],
  },
  {
    slug: "hunar-bazaar",
    name: "Hunar Bazaar",
    hue: 290,
    industry: "E-commerce",
    location: "Tashkent, Uzbekistan",
    teamSize: "11–50",
    memberSince: "2023",
    verified: true,
    spent: 42800,
    hires: 6,
    bio: "Upscale regional lifestyle brand with Arabic and Cyrillic localization needs.",
    team: [
      { name: "Laylo Rahimova", role: "Brand Director", hue: 290 },
      { name: "Jasur Tursunov", role: "Operations", hue: 250 },
    ],
  },
  {
    slug: "tezda",
    name: "Tezda",
    hue: 250,
    industry: "On-demand",
    location: "Tashkent, Uzbekistan",
    teamSize: "11–50",
    memberSince: "2022",
    verified: true,
    spent: 88000,
    hires: 4,
    bio: "On-demand delivery startup scaling iOS and logistics across Central Asia.",
    team: [
      { name: "Bobur Nazarov", role: "CTO", hue: 250 },
      { name: "Nilufar Saidova", role: "Product", hue: 210 },
    ],
  },
  {
    slug: "aralink-labs",
    name: "Aralink Labs",
    hue: 160,
    industry: "Climate Tech",
    location: "Nukus, Uzbekistan",
    teamSize: "2–10",
    memberSince: "2024",
    verified: true,
    spent: 8500,
    hires: 3,
    bio: "Climate tech restoring the Aral basin. Series A in progress.",
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
    bio: "Tax-automation SaaS for SMBs in Uzbekistan.",
    team: [{ name: "Rustam Aliyev", role: "Founder", hue: 210 }],
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
      { label: "Research & wireframes", done: true, amount: 2000 },
      { label: "High-fidelity screens", done: true, amount: 4000 },
      { label: "Prototype & handoff", done: false, amount: 6000 },
    ],
  },
  {
    id: "o2", title: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, clientSlug: "hunar-bazaar",
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, freelancerUsername: "nargiza", status: "review", progress: 90,
    dueDate: "Jun 15", amount: 1200, escrowFunded: true,
    milestones: [
      { label: "Logo & mark", done: true, amount: 400 },
      { label: "Color & type system", done: true, amount: 400 },
      { label: "Brand guidelines PDF", done: false, amount: 400 },
    ],
  },
  {
    id: "o3", title: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, clientSlug: "tezda",
    freelancer: "Farrukh Saidov", freelancerHue: 210, freelancerUsername: "farrukh", status: "in_progress", progress: 35,
    dueDate: "Aug 01", amount: 8800, escrowFunded: true,
    milestones: [
      { label: "Architecture & sprint 1", done: true, amount: 2200 },
      { label: "Core feature build", done: false, amount: 4400 },
      { label: "Testing & App Store", done: false, amount: 2200 },
    ],
  },
  {
    id: "o4", title: "Growth Strategy Audit", client: "Aralink Labs", clientHue: 160, clientSlug: "aralink-labs",
    freelancer: "Madina Azimova", freelancerHue: 290, freelancerUsername: "madina", status: "completed", progress: 100,
    dueDate: "Jun 05", amount: 850, escrowFunded: false,
    milestones: [
      { label: "Audit & findings", done: true, amount: 425 },
      { label: "90-day playbook", done: true, amount: 425 },
    ],
  },
  {
    id: "o5", title: "Webflow Marketing Site", client: "Soliq Pro", clientHue: 210, clientSlug: "soliq-pro",
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, freelancerUsername: "nargiza", status: "cancelled", progress: 10,
    dueDate: "May 20", amount: 6500, escrowFunded: false,
    milestones: [
      { label: "Discovery", done: true, amount: 500 },
      { label: "Build", done: false, amount: 6000 },
    ],
  },
];

export const applications: Application[] = [
  { id: "a1", projectTitle: "B2B SaaS Marketing Site (Webflow)", projectSlug: "b2b-saas-webflow", client: "Soliq Pro", clientHue: 210, clientSlug: "soliq-pro", budget: 6500, proposalAmount: 6200, category: "Web Design", submittedAgo: "2d ago", status: "shortlisted", coverNote: "I've built 12 Webflow marketing sites for SaaS companies including Alif and Payme." },
  { id: "a2", projectTitle: "Series A Pitch Deck — Climate Tech", projectSlug: "series-a-pitch-deck", client: "Aralink Labs", clientHue: 160, clientSlug: "aralink-labs", budget: 4500, proposalAmount: 4200, category: "Strategy & Design", submittedAgo: "3d ago", status: "pending", coverNote: "I specialize in investor narratives for climate and impact-driven startups." },
  { id: "a3", projectTitle: "Arabic & Cyrillic Localization", projectSlug: "arabic-cyrillic-localization", client: "Hunar Bazaar", clientHue: 290, clientSlug: "hunar-bazaar", budget: 3500, proposalAmount: 3400, category: "Localization", submittedAgo: "5d ago", status: "pending", coverNote: "Native Uzbek speaker with deep i18n experience across Central Asian markets." },
  { id: "a4", projectTitle: "Madrasa Restoration 3D Documentation", projectSlug: "madrasa-restoration-3d", client: "UNESCO CA Bureau", clientHue: 280, budget: 8000, proposalAmount: 7800, category: "Architecture", submittedAgo: "1w ago", status: "rejected", coverNote: "Led photogrammetry documentation for three UNESCO heritage sites in Uzbekistan." },
  { id: "a5", projectTitle: "Fintech App Redesign for National Bank", projectSlug: "fintech-app-redesign", client: "Asaka Capital", clientHue: 215, clientSlug: "asaka-capital", budget: 12000, proposalAmount: 11500, category: "Product Design", submittedAgo: "2w ago", status: "accepted", coverNote: "Led mobile transformation for two regional neobanks with full design system delivery." },
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
      { label: "Research & wireframes", amount: 2000, status: "released" },
      { label: "High-fidelity screens", amount: 4000, status: "released" },
      { label: "Prototype & handoff", amount: 6000, status: "funded" },
    ],
    timeline: [
      { step: "Proposal submitted", date: "May 28", done: true },
      { step: "Proposal accepted", date: "May 29", done: true },
      { step: "Escrow funded", date: "May 30", done: true },
      { step: "Work started", date: "Jun 01", done: true },
      { step: "Milestone delivered", date: "Jun 10", done: true },
      { step: "Client review", date: "Jun 12", done: false },
      { step: "Funds released", date: "—", done: false },
      { step: "Completed", date: "—", done: false },
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
      { label: "Logo & mark", amount: 400, status: "released" },
      { label: "Color & type system", amount: 400, status: "released" },
      { label: "Brand guidelines PDF", amount: 400, status: "funded" },
    ],
    timeline: [
      { step: "Proposal submitted", date: "May 20", done: true },
      { step: "Proposal accepted", date: "May 21", done: true },
      { step: "Escrow funded", date: "May 22", done: true },
      { step: "Work started", date: "May 23", done: true },
      { step: "Milestone delivered", date: "Jun 11", done: true },
      { step: "Client review", date: "Jun 12", done: true },
      { step: "Funds released", date: "—", done: false },
      { step: "Completed", date: "—", done: false },
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
      { label: "Architecture & sprint 1", amount: 2200, status: "released" },
      { label: "Core feature build", amount: 4400, status: "funded" },
      { label: "Testing & App Store", amount: 2200, status: "pending" },
    ],
    timeline: [
      { step: "Proposal submitted", date: "Apr 15", done: true },
      { step: "Proposal accepted", date: "Apr 18", done: true },
      { step: "Escrow funded", date: "Apr 20", done: true },
      { step: "Work started", date: "Apr 22", done: true },
      { step: "Milestone delivered", date: "Jun 08", done: false },
      { step: "Client review", date: "—", done: false },
      { step: "Funds released", date: "—", done: false },
      { step: "Completed", date: "—", done: false },
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
      { label: "Discovery", amount: 500, status: "released" },
      { label: "Build", amount: 6000, status: "disputed" },
    ],
    timeline: [
      { step: "Proposal submitted", date: "Apr 01", done: true },
      { step: "Proposal accepted", date: "Apr 03", done: true },
      { step: "Escrow funded", date: "Apr 05", done: true },
      { step: "Work started", date: "Apr 06", done: true },
      { step: "Milestone delivered", date: "May 10", done: true },
      { step: "Client review", date: "May 12", done: true },
      { step: "Dispute opened", date: "May 15", done: true },
      { step: "Completed", date: "—", done: false },
    ],
  },
];

export const reviews: Review[] = [
  { id: "r1", from: "Asaka Capital", fromHue: 215, project: "Fintech App Redesign", rating: 5, body: "Nargiza delivered exceptional work. The designs are both beautiful and production-ready. Will definitely hire again.", date: "Jun 10", freelancerUsername: "nargiza", serviceSlug: "mobile-app-design-fintech" },
  { id: "r2", from: "Tezda", fromHue: 250, project: "iOS App Development", rating: 5, body: "Farrukh is a rockstar. Delivered on time, communicated proactively, and the code quality is superb.", date: "Jun 05", freelancerUsername: "farrukh", serviceSlug: "ios-app-development" },
  { id: "r3", from: "Hunar Bazaar", fromHue: 290, project: "Brand Identity System", rating: 4, body: "Great work overall. Minor delays on revisions but the final output was worth it.", date: "May 28", freelancerUsername: "nargiza", serviceSlug: "brand-identity-system" },
  { id: "r4", from: "Aralink Labs", fromHue: 160, project: "Growth Audit", rating: 5, body: "The playbook Madina built has already generated measurable results in just 3 weeks.", date: "May 20", freelancerUsername: "madina", serviceSlug: "growth-strategy-audit" },
  { id: "r5", from: "Sardor M.", fromHue: 200, project: "Mobile App Design", rating: 5, body: "Best investment we made this quarter. Delivered ahead of schedule and the design system is something we'll use for years.", date: "2 weeks ago", freelancerUsername: "nargiza", serviceSlug: "mobile-app-design-fintech" },
  { id: "r6", from: "Aisha K.", fromHue: 320, project: "Brand Identity", rating: 5, body: "Exceptional eye for typography. The Cyrillic pairing alone was worth the entire engagement.", date: "1 month ago", freelancerUsername: "nargiza", serviceSlug: "brand-identity-system" },
  { id: "r7", from: "Daniyar B.", fromHue: 22, project: "Next.js Marketplace", rating: 5, body: "Communication is on a different level. Felt like working with a senior product partner, not a contractor.", date: "1 month ago", freelancerUsername: "azamat", serviceSlug: "nextjs-marketplace-build" },
  { id: "r8", from: "UNESCO CA Bureau", fromHue: 280, project: "Pattern Suite", rating: 5, body: "Temur's ornamental work is museum-quality. Every pattern tells a story of our heritage.", date: "3 weeks ago", freelancerUsername: "temur", serviceSlug: "ornamental-pattern-suite" },
];

export const escrowRecords: EscrowRecord[] = [
  { id: "e1", project: "Fintech App Redesign", client: "Asaka Capital", clientHue: 215, amount: 6000, status: "funded", milestone: "Prototype & handoff", date: "Jun 10" },
  { id: "e2", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, amount: 4400, status: "funded", milestone: "Core feature build", date: "Jun 08" },
  { id: "e3", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, amount: 400, status: "pending", milestone: "Brand guidelines PDF", date: "Jun 12" },
  { id: "e4", project: "Growth Strategy Audit", client: "Aralink Labs", clientHue: 160, amount: 850, status: "released", milestone: "Full delivery", date: "Jun 05" },
];

export const escrowItems = [
  { id: "ei1", project: "Fintech App Redesign", client: "Asaka Capital", clientHue: 215, amount: 6000, status: "funded" as const, milestone: "Prototype & handoff", dueDate: "Jun 24" },
  { id: "ei2", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, amount: 4400, status: "funded" as const, milestone: "Core feature build", dueDate: "Aug 01" },
  { id: "ei3", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, amount: 400, status: "pending_release" as const, milestone: "Brand guidelines PDF", dueDate: "Jun 15" },
];

export const hiringPipeline: HiringLead[] = [
  { id: "h1", name: "Nargiza Akhmedova", username: "nargiza", hue: 250, title: "Senior Brand Designer", stage: "shortlisted", project: "Fintech App Redesign", rate: 45, rating: 5.0 },
  { id: "h2", name: "Azamat Usmanov", username: "azamat", hue: 215, title: "Full Stack Engineer", stage: "interview", project: "Fintech App Redesign", rate: 65, rating: 4.97 },
  { id: "h3", name: "Farrukh Saidov", username: "farrukh", hue: 210, title: "iOS Engineer", stage: "offer", project: "iOS App", rate: 55, rating: 4.98 },
  { id: "h4", name: "Dilnoza Kim", username: "dilnoza", hue: 270, title: "3D Artist", stage: "reviewing", project: "Series A Deck", rate: 38, rating: 4.92 },
  { id: "h5", name: "Madina Azimova", username: "madina", hue: 290, title: "Growth Consultant", stage: "reviewing", project: "Growth Audit", rate: 80, rating: 4.95 },
];

const skillCategories: Record<string, string> = {
  Branding: "Design", Figma: "Design", Webflow: "Design", "Design Systems": "Design",
  "Next.js": "Development", Rust: "Development", PostgreSQL: "Development", "System Architecture": "Development",
  Blender: "Creative", "Cinema 4D": "Creative", WebGL: "Creative", "After Effects": "Creative",
  Procreate: "Creative", Illustrator: "Creative", "Pattern Design": "Creative",
  "GTM Strategy": "Strategy", "Market Research": "Strategy", Notion: "Strategy", SQL: "Strategy",
  Swift: "Development", SwiftUI: "Development", "Core Data": "Development", ARKit: "Development",
  "IP Law": "Legal", "Cross-border": "Legal", "M&A": "Legal",
  AutoCAD: "Architecture", Rhino: "Architecture", "V-Ray": "Architecture", "Sustainable Design": "Architecture",
};

function buildSkillMatrix(skills: string[], jobs: number): SkillEntry[] {
  return skills.map((name, i) => ({
    name,
    level: Math.min(5, 3 + (i === 0 ? 2 : i === 1 ? 1 : 0)),
    endorsements: Math.max(3, Math.round(jobs * (0.4 - i * 0.05))),
    category: skillCategories[name] ?? "General",
  }));
}

function buildVerification(f: Freelancer): VerificationItem[] {
  return [
    { label: "Passport ID", done: f.identityVerified, verifiedAt: f.identityVerified ? "Jan 2023" : undefined },
    { label: "Business entity", done: f.businessVerified, verifiedAt: f.businessVerified ? "Mar 2024" : undefined },
    { label: "Phone number", done: true, verifiedAt: "Jan 2023" },
    { label: "Email address", done: true, verifiedAt: "Jan 2023" },
    { label: "Payment method", done: true, verifiedAt: "Feb 2023" },
  ];
}

const defaultLanguages: Language[] = [
  { language: "Uzbek", level: "Native" },
  { language: "Russian", level: "Fluent" },
  { language: "English", level: "Professional" },
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
      delivery: `${days} days`,
      revisions: 2,
      description: `Core ${service.category.toLowerCase()} deliverables for a focused scope.`,
      features: [`Core ${service.category.toLowerCase()} scope`, "Source files included", "1 revision round", "Standard delivery"],
    },
    {
      tier: "Premium",
      price: Math.round(base * 2.04),
      delivery: `${days + 5} days`,
      revisions: 4,
      description: `Full ${service.category.toLowerCase()} package with extended revisions and handoff.`,
      features: [`Full ${service.category.toLowerCase()} scope`, "Priority support", "4 revision rounds", "Handoff session", "Design tokens / docs"],
      popular: true,
    },
    {
      tier: "Enterprise",
      price: Math.round(base * 5),
      delivery: `${days + 14} days`,
      revisions: "Unlimited",
      description: `Enterprise-grade engagement with dedicated support and extended warranty.`,
      features: ["Unlimited scope within category", "Dedicated Slack channel", "Unlimited revisions", "30-day post-delivery support", "Team onboarding session"],
    },
  ];
}

function buildGallery(service: Service): ServiceGalleryImage[] {
  return [
    { hue: service.hue, caption: "Hero deliverable preview" },
    { hue: (service.hue + 25) % 360, caption: "Detail view — component library" },
    { hue: (service.hue + 50) % 360, caption: "Mobile responsive layouts" },
    { hue: (service.hue + 75) % 360, caption: "Design system tokens" },
    { hue: (service.hue + 100) % 360, caption: "Handoff documentation" },
  ];
}

function buildFaqs(service: Service): ServiceFaq[] {
  return [
    { question: "What do you need from me to get started?", answer: "A brief describing your goals, brand assets (if any), and target audience. I'll send a kickoff questionnaire within 24 hours of order confirmation." },
    { question: "How do revisions work?", answer: "Each package includes a set number of revision rounds. Revisions cover refinements within the agreed scope — not full redesigns. Additional rounds can be purchased if needed." },
    { question: "Is my payment protected?", answer: "Yes. All payments are held in Ishbor escrow and released only when you approve the delivered work. Full refund if the seller fails to deliver on time." },
    { question: "Can we communicate outside the platform?", answer: "All project communication should stay on Ishbor for escrow protection and dispute resolution. Video calls can be scheduled through the platform." },
    { question: `What makes this ${service.category.toLowerCase()} service different?`, answer: `${service.seller} has a ${service.sellerSuccessScore}/100 success score, ${service.sellerCompletionRate}% completion rate, and ${service.sellerRepeatClients}% repeat client rate — backed by $${(service.sellerTotalEarned / 1000).toFixed(0)}k in verified earnings on Ishbor.` },
  ];
}

const serviceDescriptions: Record<string, { description: string; extended: string; included: string[] }> = {
  "mobile-app-design-fintech": {
    description: "You'll receive a production-grade design system tailored for a regulated financial product. Every deliverable comes with motion specs, accessibility annotations, and a handoff session for your engineering team.",
    extended: "I've shipped retail banking apps for two regional neobanks and consulted on a digital payments rollout for the national post. I work in 2-week sprints with weekly Loom updates and a dedicated Slack channel. Localization-first — Cyrillic, Latin, Arabic scripts handled with proper kerning and weight pairings.",
    included: ["Brand-aligned mobile UI", "Component library in Figma", "Design tokens (CSS / JSON)", "Motion specifications", "Accessibility audit (AA)", "Engineering handoff session"],
  },
  "nextjs-marketplace-build": {
    description: "A production-ready Next.js marketplace with authentication, payments, and admin tooling — built for scale from day one.",
    extended: "Ex-Uzcard engineer with experience shipping payment systems at 99.97% uptime. Stack: Next.js 15, PostgreSQL, Stripe Connect, and Rust microservices for high-throughput operations.",
    included: ["Next.js 15 app router setup", "Stripe Connect integration", "PostgreSQL schema + migrations", "Admin dashboard", "CI/CD pipeline", "30-day bug-fix warranty"],
  },
  "brand-identity-system": {
    description: "A complete brand identity system — logo, typography, color, and guidelines — built for brands that need to scale across markets.",
    extended: "From bazaar to boardroom: identities that work in Tashkent street signage and London investor decks. Includes stakeholder workshop and competitive audit.",
    included: ["Logo & wordmark suite", "Color & typography system", "Brand guidelines PDF", "Social media templates", "Stationery mockups", "Figma source files"],
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
    description: s.description ?? custom?.description ?? `Professional ${s.category.toLowerCase()} service delivered by ${s.seller}, a ${s.sellerLevel} seller on Ishbor with ${s.reviews} verified reviews.`,
    descriptionExtended: s.descriptionExtended ?? custom?.extended ?? `I bring ${s.sellerSuccessScore}/100 success score and ${s.sellerCompletionRate}% on-time delivery to every engagement. Communication stays on-platform with escrow-protected milestones.`,
    included: s.included ?? custom?.included ?? [`${s.category} deliverables`, "Source files", "Revision rounds per package", "Platform messaging support", "Escrow-protected payment"],
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
