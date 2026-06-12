// Mock data for Ishbor marketplace. Replace with real APIs later.

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
  bio: string;
  available: boolean;
  hue: number;
  earned: number;
  jobs: number;
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  seller: string;
  sellerHue: number;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  delivery: string;
  hue: number;
};

export type Project = {
  id: string;
  title: string;
  client: string;
  clientHue: number;
  budget: number;
  budgetType: "fixed" | "hourly";
  category: string;
  postedAgo: string;
  proposals: number;
  description: string;
  skills: string[];
  duration: string;
  verified: boolean;
};

export type Order = {
  id: string;
  title: string;
  client: string;
  clientHue: number;
  amount: number;
  status: "in_progress" | "review" | "revision" | "completed";
  dueDate: string;
  daysLeft: number;
  milestones: { label: string; done: boolean }[];
};

export type Application = {
  id: string;
  projectTitle: string;
  client: string;
  clientHue: number;
  budget: number;
  appliedAgo: string;
  status: "pending" | "shortlisted" | "rejected" | "hired";
  bid: number;
};

export type EscrowItem = {
  id: string;
  project: string;
  client: string;
  clientHue: number;
  amount: number;
  status: "funded" | "pending_release" | "released" | "disputed";
  milestone: string;
  dueDate: string;
};

export type Review = {
  id: string;
  author: string;
  authorHue: number;
  rating: number;
  body: string;
  project: string;
  date: string;
};

export const freelancers: Freelancer[] = [
  { id: "f1", username: "nargiza", name: "Nargiza Akhmedova", title: "Senior Brand Strategist & UI Designer", city: "Tashkent", rate: 45, rating: 5.0, reviews: 184, level: "Top Rated", skills: ["Branding", "Figma", "Webflow", "Design Systems"], bio: "I help fintech and luxury brands across Central Asia build identities that translate from bazaar to boardroom. 8 years, 120+ projects.", available: true, hue: 250, earned: 184000, jobs: 124 },
  { id: "f2", username: "azamat", name: "Azamat Usmanov", title: "Full Stack Engineer (Next.js / Rust)", city: "Samarkand", rate: 65, rating: 4.97, reviews: 92, level: "Expert", skills: ["Next.js", "Rust", "PostgreSQL", "System Architecture"], bio: "Building distributed payment systems for regional banks. Ex-Uzcard. Open to long-term retainers.", available: true, hue: 215, earned: 310000, jobs: 64 },
  { id: "f3", username: "dilnoza", name: "Dilnoza Kim", title: "3D Artist & Motion Designer", city: "Almaty", rate: 38, rating: 4.92, reviews: 41, level: "Rising", skills: ["Blender", "Cinema 4D", "WebGL", "After Effects"], bio: "Procedural geometry meets nomadic ornament. Latest work: Aral Sea documentary opener.", available: true, hue: 270, earned: 62000, jobs: 28 },
  { id: "f4", username: "temur", name: "Temur Ismoilov", title: "Master Illustrator & Pattern Designer", city: "Bukhara", rate: 35, rating: 5.0, reviews: 67, level: "Top Rated", skills: ["Procreate", "Illustrator", "Pattern Design"], bio: "Six generations of suzani makers in my family. Now I design for fashion houses and CPG brands.", available: false, hue: 230, earned: 88000, jobs: 51 },
  { id: "f5", username: "madina", name: "Madina Azimova", title: "Growth & Strategy Consultant", city: "Tashkent", rate: 80, rating: 4.95, reviews: 53, level: "Expert", skills: ["GTM Strategy", "Market Research", "Notion", "SQL"], bio: "Led growth at three regional unicorns. I build playbooks, not slide decks.", available: true, hue: 290, earned: 245000, jobs: 38 },
  { id: "f6", username: "farrukh", name: "Farrukh Saidov", title: "iOS Engineer - Swift & SwiftUI", city: "Tashkent", rate: 55, rating: 4.98, reviews: 71, level: "Top Rated", skills: ["Swift", "SwiftUI", "Core Data", "ARKit"], bio: "Shipped 14 apps to the App Store. Specializing in fintech and on-demand.", available: true, hue: 210, earned: 198000, jobs: 47 },
  { id: "f7", username: "kamila", name: "Kamila Yusupova", title: "Legal Consultant - IP & Contracts", city: "Tashkent", rate: 95, rating: 5.0, reviews: 32, level: "Expert", skills: ["IP Law", "Cross-border", "M&A"], bio: "Cross-border counsel for SaaS and creative businesses entering CIS markets.", available: true, hue: 200, earned: 412000, jobs: 22 },
  { id: "f8", username: "rustam", name: "Rustam Khalilov", title: "Architect & Interior Designer", city: "Samarkand", rate: 50, rating: 4.94, reviews: 28, level: "Verified", skills: ["AutoCAD", "Rhino", "V-Ray", "Sustainable Design"], bio: "Restoration of madrasas meets contemporary residential. Riga-trained.", available: true, hue: 160, earned: 124000, jobs: 19 },
];

export const services: Service[] = [
  { id: "s1", slug: "mobile-app-design-fintech", title: "I will design a premium fintech mobile app from scratch", seller: "Nargiza A.", sellerHue: 250, category: "Mobile Design", price: 480, rating: 5.0, reviews: 89, delivery: "7 days", hue: 250 },
  { id: "s2", slug: "nextjs-marketplace-build", title: "I will build a production Next.js marketplace with Stripe", seller: "Azamat U.", sellerHue: 215, category: "Web Development", price: 1800, rating: 4.98, reviews: 41, delivery: "21 days", hue: 215 },
  { id: "s3", slug: "brand-identity-system", title: "I will craft a complete brand identity system & guidelines", seller: "Nargiza A.", sellerHue: 250, category: "Branding", price: 1200, rating: 5.0, reviews: 67, delivery: "14 days", hue: 230 },
  { id: "s4", slug: "ornamental-pattern-suite", title: "I will create custom Central Asian ornamental patterns", seller: "Temur I.", sellerHue: 230, category: "Illustration", price: 280, rating: 5.0, reviews: 38, delivery: "5 days", hue: 280 },
  { id: "s5", slug: "ios-app-development", title: "I will build a native iOS app in Swift / SwiftUI", seller: "Farrukh S.", sellerHue: 210, category: "Mobile Development", price: 2400, rating: 4.96, reviews: 29, delivery: "30 days", hue: 210 },
  { id: "s6", slug: "growth-strategy-audit", title: "I will run a 360 growth audit & 90-day playbook", seller: "Madina A.", sellerHue: 290, category: "Strategy", price: 850, rating: 5.0, reviews: 22, delivery: "10 days", hue: 260 },
  { id: "s7", slug: "3d-product-renders", title: "I will create photoreal 3D product renders & animation", seller: "Dilnoza K.", sellerHue: 270, category: "3D & Motion", price: 360, rating: 4.92, reviews: 18, delivery: "7 days", hue: 270 },
  { id: "s8", slug: "ip-contract-review", title: "I will review and draft cross-border SaaS contracts", seller: "Kamila Y.", sellerHue: 200, category: "Legal", price: 520, rating: 5.0, reviews: 14, delivery: "3 days", hue: 200 },
];

export const projects: Project[] = [
  { id: "p1", title: "Fintech App Redesign for National Bank", client: "Asaka Capital", clientHue: 215, budget: 12000, budgetType: "fixed", category: "Product Design", postedAgo: "4h ago", proposals: 12, description: "Looking for an expert UI designer to lead the mobile transformation of our retail banking platform. Focus on accessibility, localized typography (Cyrillic + Latin), and a 6-week sprint to MVP.", skills: ["Figma", "Design Systems", "Fintech", "Accessibility"], duration: "6 weeks", verified: true },
  { id: "p2", title: "Arabic & Cyrillic Localization for E-commerce", client: "Hunar Bazaar", clientHue: 290, budget: 3500, budgetType: "fixed", category: "Localization", postedAgo: "8h ago", proposals: 8, description: "Consultation and implementation of RTL layouts and specialized font weights for an upscale regional lifestyle brand.", skills: ["i18n", "RTL", "Typography", "Next.js"], duration: "3 weeks", verified: true },
  { id: "p3", title: "Series A Pitch Deck - Climate Tech", client: "Aralink Labs", clientHue: 160, budget: 4500, budgetType: "fixed", category: "Strategy & Design", postedAgo: "1d ago", proposals: 21, description: "Need a story-driven 18-slide deck for our $8M Series A. Climate tech / water restoration in the Aral basin. Must move investors.", skills: ["Pitch Decks", "Storytelling", "Keynote", "Climate"], duration: "10 days", verified: true },
  { id: "p4", title: "Long-term iOS Engineer - On-demand startup", client: "Tezda", clientHue: 250, budget: 55, budgetType: "hourly", category: "Mobile Development", postedAgo: "1d ago", proposals: 6, description: "Looking for a senior iOS engineer for 20-30h/week, 6 months minimum. SwiftUI, Combine, MapKit. Equity option available.", skills: ["Swift", "SwiftUI", "MapKit", "Combine"], duration: "6+ months", verified: true },
  { id: "p5", title: "Madrasa Restoration - 3D Documentation", client: "UNESCO CA Bureau", clientHue: 280, budget: 8000, budgetType: "fixed", category: "Architecture", postedAgo: "2d ago", proposals: 4, description: "Photogrammetry, 3D modelling and historically accurate restoration drawings for a 16th-century madrasa in Bukhara.", skills: ["Photogrammetry", "Rhino", "Heritage", "AutoCAD"], duration: "8 weeks", verified: true },
  { id: "p6", title: "B2B SaaS Marketing Site (Webflow)", client: "Soliq Pro", clientHue: 210, budget: 6500, budgetType: "fixed", category: "Web Design", postedAgo: "3d ago", proposals: 18, description: "Premium marketing site for a tax-automation SaaS. Webflow build, CMS, 8 pages plus blog. Linear/Stripe quality bar.", skills: ["Webflow", "Copywriting", "Animation", "SEO"], duration: "5 weeks", verified: false },
];

export const categories = [
  { slug: "design", name: "Design & Brand", count: 1240, glyph: "+" },
  { slug: "development", name: "Development", count: 2820, glyph: "o" },
  { slug: "marketing", name: "Marketing & Growth", count: 940, glyph: "*" },
  { slug: "writing", name: "Writing & Translation", count: 1180, glyph: "#" },
  { slug: "video", name: "Video & Animation", count: 620, glyph: "@" },
  { slug: "architecture", name: "Architecture & 3D", count: 410, glyph: "~" },
  { slug: "consulting", name: "Strategy & Legal", count: 380, glyph: "=" },
  { slug: "craft", name: "Craft & Heritage", count: 290, glyph: "%" },
];

export const messages = [
  { id: "m1", name: "Nargiza Akhmedova", hue: 250, snippet: "I've prepared three direction explorations for the dashboard...", time: "2m", unread: 2, online: true },
  { id: "m2", name: "Asaka Capital", hue: 215, snippet: "Contract signed. First milestone funded into escrow.", time: "1h", unread: 0, online: false },
  { id: "m3", name: "Azamat Usmanov", hue: 210, snippet: "Shipped the migrations. Ready for review whenever.", time: "3h", unread: 1, online: true },
  { id: "m4", name: "Madina Azimova", hue: 290, snippet: "Quick call Thursday to walk through the growth playbook?", time: "1d", unread: 0, online: false },
  { id: "m5", name: "Hunar Bazaar", hue: 290, snippet: "We loved the proposal. Sending the brief now.", time: "2d", unread: 0, online: false },
];

export const notifications = [
  { id: "n1", kind: "payment" as const, title: "Milestone funded", body: "Asaka Capital funded $4,000 into escrow for Fintech App Redesign.", time: "12m", read: false, priority: true },
  { id: "n2", kind: "proposal" as const, title: "New proposal received", body: "Azamat Usmanov submitted a proposal for your iOS project at $55/h.", time: "1h", read: false, priority: true },
  { id: "n3", kind: "review" as const, title: "5-star review", body: "Tezda left a 5-star review on your iOS engagement. Great work!", time: "3h", read: false, priority: false },
  { id: "n4", kind: "system" as const, title: "Identity verified", body: "Your Pasport ID is now verified. You qualify for Pro listings.", time: "1d", read: true, priority: false },
  { id: "n5", kind: "message" as const, title: "Message from Nargiza", body: "I've prepared three direction explorations for the dashboard wireframes.", time: "1d", read: true, priority: false },
  { id: "n6", kind: "payment" as const, title: "Withdrawal processed", body: "Your withdrawal of $2,200 to Humo card ending 4421 is complete.", time: "2d", read: true, priority: false },
  { id: "n7", kind: "proposal" as const, title: "Application shortlisted", body: "Soliq Pro shortlisted your application for the Webflow Marketing Site project.", time: "2d", read: true, priority: false },
];

export const transactions = [
  { id: "t1", kind: "in" as const, label: "Milestone release", project: "Fintech App Redesign", amount: 4000, date: "Jun 10", status: "Completed" },
  { id: "t2", kind: "out" as const, label: "Withdrawal - Humo card", project: "#### 4421", amount: -2200, date: "Jun 08", status: "Completed" },
  { id: "t3", kind: "in" as const, label: "Service order", project: "Brand Identity System", amount: 1200, date: "Jun 06", status: "Completed" },
  { id: "t4", kind: "fee" as const, label: "Platform fee", project: "Brand Identity System", amount: -96, date: "Jun 06", status: "Completed" },
  { id: "t5", kind: "in" as const, label: "Milestone release", project: "Localization sprint", amount: 1750, date: "Jun 02", status: "Completed" },
  { id: "t6", kind: "out" as const, label: "Withdrawal - Uzcard", project: "#### 8829", amount: -3000, date: "May 29", status: "Pending" },
  { id: "t7", kind: "in" as const, label: "Service order", project: "iOS App Development", amount: 2400, date: "May 24", status: "Completed" },
  { id: "t8", kind: "fee" as const, label: "Platform fee", project: "iOS App Development", amount: -192, date: "May 24", status: "Completed" },
];

export const orders: Order[] = [
  {
    id: "o1",
    title: "Fintech App Redesign - Mobile UI",
    client: "Asaka Capital",
    clientHue: 215,
    amount: 12000,
    status: "in_progress",
    dueDate: "Jun 24",
    daysLeft: 12,
    milestones: [
      { label: "Discovery & Research", done: true },
      { label: "Wireframes", done: true },
      { label: "Visual Design", done: false },
      { label: "Handoff & Specs", done: false },
    ],
  },
  {
    id: "o2",
    title: "Brand Identity System",
    client: "Aralink Labs",
    clientHue: 160,
    amount: 1200,
    status: "review",
    dueDate: "Jun 14",
    daysLeft: 2,
    milestones: [
      { label: "Brand Strategy", done: true },
      { label: "Logo Design", done: true },
      { label: "Guidelines Doc", done: true },
      { label: "Client Review", done: false },
    ],
  },
  {
    id: "o3",
    title: "Webflow Marketing Site",
    client: "Soliq Pro",
    clientHue: 210,
    amount: 6500,
    status: "revision",
    dueDate: "Jun 18",
    daysLeft: 6,
    milestones: [
      { label: "Design", done: true },
      { label: "Development", done: true },
      { label: "Revision round", done: false },
      { label: "Launch", done: false },
    ],
  },
];

export const applications: Application[] = [
  { id: "a1", projectTitle: "Series A Pitch Deck - Climate Tech", client: "Aralink Labs", clientHue: 160, budget: 4500, appliedAgo: "2d ago", status: "shortlisted", bid: 3800 },
  { id: "a2", projectTitle: "Long-term iOS Engineer - On-demand startup", client: "Tezda", clientHue: 250, budget: 55, appliedAgo: "3d ago", status: "pending", bid: 55 },
  { id: "a3", projectTitle: "Arabic & Cyrillic Localization for E-commerce", client: "Hunar Bazaar", clientHue: 290, budget: 3500, appliedAgo: "5d ago", status: "hired", bid: 3200 },
  { id: "a4", projectTitle: "Madrasa Restoration - 3D Documentation", client: "UNESCO CA Bureau", clientHue: 280, budget: 8000, appliedAgo: "1w ago", status: "rejected", bid: 7200 },
];

export const escrowItems: EscrowItem[] = [
  { id: "e1", project: "Fintech App Redesign", client: "Asaka Capital", clientHue: 215, amount: 4000, status: "funded", milestone: "Visual Design milestone", dueDate: "Jun 24" },
  { id: "e2", project: "Webflow Marketing Site", client: "Soliq Pro", clientHue: 210, amount: 3250, status: "pending_release", milestone: "Development complete", dueDate: "Jun 18" },
  { id: "e3", project: "Brand Identity System", client: "Aralink Labs", clientHue: 160, amount: 600, status: "funded", milestone: "Final delivery", dueDate: "Jun 14" },
];

export const reviews: Review[] = [
  { id: "r1", author: "Tezda Inc.", authorHue: 250, rating: 5, body: "Nargiza delivered exceptional mobile UI work. Her attention to Central Asian typography nuances was exactly what we needed. Will hire again without hesitation.", project: "iOS Banking App Redesign", date: "Jun 10" },
  { id: "r2", author: "Asaka Capital", authorHue: 215, rating: 5, body: "Top-tier strategic thinking and execution. The brand identity system she created has become our foundation for all future communications.", project: "Brand Identity System", date: "May 28" },
  { id: "r3", author: "Hunar Bazaar", authorHue: 290, rating: 4, body: "Great work on the localization project. Some back-and-forth on the Cyrillic weights but the final result is polished.", project: "E-commerce Localization", date: "May 15" },
];

export const teamActivity = [
  { id: "ta1", actor: "Nargiza A.", actorHue: 250, action: "submitted milestone", project: "Fintech App Redesign", time: "15m ago" },
  { id: "ta2", actor: "Azamat U.", actorHue: 215, action: "started contract", project: "Backend API integration", time: "2h ago" },
  { id: "ta3", actor: "Kamila Y.", actorHue: 200, action: "delivered contract review", project: "SaaS legal audit", time: "4h ago" },
  { id: "ta4", actor: "Madina A.", actorHue: 290, action: "uploaded growth playbook", project: "Q3 GTM strategy", time: "1d ago" },
];
