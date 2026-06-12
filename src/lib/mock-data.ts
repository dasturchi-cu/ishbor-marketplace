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
  freelancer: string;
  freelancerHue: number;
  status: "in_progress" | "review" | "revision" | "completed" | "disputed";
  progress: number;
  dueDate: string;
  amount: number;
  escrowFunded: boolean;
  milestones: { label: string; done: boolean; amount: number }[];
};

export type Application = {
  id: string;
  projectTitle: string;
  client: string;
  clientHue: number;
  budget: number;
  category: string;
  submittedAgo: string;
  status: "pending" | "shortlisted" | "rejected" | "hired";
  coverNote: string;
};

export type Review = {
  id: string;
  from: string;
  fromHue: number;
  project: string;
  rating: number;
  body: string;
  date: string;
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
  hue: number;
  title: string;
  stage: "reviewing" | "shortlisted" | "interview" | "offer";
  project: string;
  rate: number;
  rating: number;
};

export const freelancers: Freelancer[] = [
  { id: "f1", username: "nargiza", name: "Nargiza Akhmedova", title: "Senior Brand Strategist & UI Designer", city: "Tashkent", rate: 45, rating: 5.0, reviews: 184, level: "Top Rated", skills: ["Branding", "Figma", "Webflow", "Design Systems"], bio: "I help fintech and luxury brands across Central Asia build identities that translate from bazaar to boardroom. 8 years, 120+ projects.", available: true, hue: 250, earned: 184000, jobs: 124 },
  { id: "f2", username: "azamat", name: "Azamat Usmanov", title: "Full Stack Engineer (Next.js / Rust)", city: "Samarkand", rate: 65, rating: 4.97, reviews: 92, level: "Expert", skills: ["Next.js", "Rust", "PostgreSQL", "System Architecture"], bio: "Building distributed payment systems for regional banks. Ex-Uzcard. Open to long-term retainers.", available: true, hue: 215, earned: 310000, jobs: 64 },
  { id: "f3", username: "dilnoza", name: "Dilnoza Kim", title: "3D Artist & Motion Designer", city: "Almaty", rate: 38, rating: 4.92, reviews: 41, level: "Rising", skills: ["Blender", "Cinema 4D", "WebGL", "After Effects"], bio: "Procedural geometry meets nomadic ornament. Latest work: Aral Sea documentary opener.", available: true, hue: 270, earned: 62000, jobs: 28 },
  { id: "f4", username: "temur", name: "Temur Ismoilov", title: "Master Illustrator & Pattern Designer", city: "Bukhara", rate: 35, rating: 5.0, reviews: 67, level: "Top Rated", skills: ["Procreate", "Illustrator", "Pattern Design"], bio: "Six generations of suzani makers in my family. Now I design for fashion houses and CPG brands.", available: false, hue: 230, earned: 88000, jobs: 51 },
  { id: "f5", username: "madina", name: "Madina Azimova", title: "Growth & Strategy Consultant", city: "Tashkent", rate: 80, rating: 4.95, reviews: 53, level: "Expert", skills: ["GTM Strategy", "Market Research", "Notion", "SQL"], bio: "Led growth at three regional unicorns. I build playbooks, not slide decks.", available: true, hue: 290, earned: 245000, jobs: 38 },
  { id: "f6", username: "farrukh", name: "Farrukh Saidov", title: "iOS Engineer • Swift & SwiftUI", city: "Tashkent", rate: 55, rating: 4.98, reviews: 71, level: "Top Rated", skills: ["Swift", "SwiftUI", "Core Data", "ARKit"], bio: "Shipped 14 apps to the App Store. Specializing in fintech and on-demand.", available: true, hue: 210, earned: 198000, jobs: 47 },
  { id: "f7", username: "kamila", name: "Kamila Yusupova", title: "Legal Consultant • IP & Contracts", city: "Tashkent", rate: 95, rating: 5.0, reviews: 32, level: "Expert", skills: ["IP Law", "Cross-border", "M&A"], bio: "Cross-border counsel for SaaS and creative businesses entering CIS markets.", available: true, hue: 200, earned: 412000, jobs: 22 },
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
  { id: "p1", title: "Fintech App Redesign for National Bank", client: "Asaka Capital", clientHue: 215, budget: 12000, budgetType: "fixed", category: "Product Design", postedAgo: "4h ago", proposals: 12, description: "Looking for an expert UI designer to lead the mobile transformation of our retail banking platform.", skills: ["Figma", "Design Systems", "Fintech", "Accessibility"], duration: "6 weeks", verified: true },
  { id: "p2", title: "Arabic & Cyrillic Localization for E-commerce", client: "Hunar Bazaar", clientHue: 290, budget: 3500, budgetType: "fixed", category: "Localization", postedAgo: "8h ago", proposals: 8, description: "RTL layouts and specialized font weights for an upscale regional lifestyle brand.", skills: ["i18n", "RTL", "Typography", "Next.js"], duration: "3 weeks", verified: true },
  { id: "p3", title: "Series A Pitch Deck — Climate Tech", client: "Aralink Labs", clientHue: 160, budget: 4500, budgetType: "fixed", category: "Strategy & Design", postedAgo: "1d ago", proposals: 21, description: "18-slide deck for $8M Series A. Climate tech / water restoration in the Aral basin.", skills: ["Pitch Decks", "Storytelling", "Keynote", "Climate"], duration: "10 days", verified: true },
  { id: "p4", title: "Long-term iOS Engineer — On-demand startup", client: "Tezda", clientHue: 250, budget: 55, budgetType: "hourly", category: "Mobile Development", postedAgo: "1d ago", proposals: 6, description: "Senior iOS engineer for 20-30h/week, 6 months minimum. SwiftUI, Combine, MapKit.", skills: ["Swift", "SwiftUI", "MapKit", "Combine"], duration: "6+ months", verified: true },
  { id: "p5", title: "Madrasa Restoration — 3D Documentation", client: "UNESCO CA Bureau", clientHue: 280, budget: 8000, budgetType: "fixed", category: "Architecture", postedAgo: "2d ago", proposals: 4, description: "Photogrammetry, 3D modelling and restoration drawings for a 16th-century madrasa in Bukhara.", skills: ["Photogrammetry", "Rhino", "Heritage", "AutoCAD"], duration: "8 weeks", verified: true },
  { id: "p6", title: "B2B SaaS Marketing Site (Webflow)", client: "Soliq Pro", clientHue: 210, budget: 6500, budgetType: "fixed", category: "Web Design", postedAgo: "3d ago", proposals: 18, description: "Premium marketing site for a tax-automation SaaS. Webflow build, 8 pages plus blog.", skills: ["Webflow", "Copywriting", "Animation", "SEO"], duration: "5 weeks", verified: false },
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

export const orders: Order[] = [
  {
    id: "o1", title: "Fintech App Redesign — Phase 1", client: "Asaka Capital", clientHue: 215,
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, status: "in_progress", progress: 60,
    dueDate: "Jun 24", amount: 12000, escrowFunded: true,
    milestones: [
      { label: "Research & wireframes", done: true, amount: 2000 },
      { label: "High-fidelity screens", done: true, amount: 4000 },
      { label: "Prototype & handoff", done: false, amount: 6000 },
    ],
  },
  {
    id: "o2", title: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290,
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, status: "review", progress: 90,
    dueDate: "Jun 15", amount: 1200, escrowFunded: true,
    milestones: [
      { label: "Logo & mark", done: true, amount: 400 },
      { label: "Color & type system", done: true, amount: 400 },
      { label: "Brand guidelines PDF", done: false, amount: 400 },
    ],
  },
  {
    id: "o3", title: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250,
    freelancer: "Farrukh Saidov", freelancerHue: 210, status: "in_progress", progress: 35,
    dueDate: "Aug 01", amount: 8800, escrowFunded: true,
    milestones: [
      { label: "Architecture & sprint 1", done: true, amount: 2200 },
      { label: "Core feature build", done: false, amount: 4400 },
      { label: "Testing & App Store", done: false, amount: 2200 },
    ],
  },
  {
    id: "o4", title: "Growth Strategy Audit", client: "Aralink Labs", clientHue: 160,
    freelancer: "Madina Azimova", freelancerHue: 290, status: "completed", progress: 100,
    dueDate: "Jun 05", amount: 850, escrowFunded: false,
    milestones: [
      { label: "Audit & findings", done: true, amount: 425 },
      { label: "90-day playbook", done: true, amount: 425 },
    ],
  },
];

export const applications: Application[] = [
  { id: "a1", projectTitle: "B2B SaaS Marketing Site (Webflow)", client: "Soliq Pro", clientHue: 210, budget: 6500, category: "Web Design", submittedAgo: "2d ago", status: "shortlisted", coverNote: "I've built 12 Webflow marketing sites for SaaS companies including Alif and Payme." },
  { id: "a2", projectTitle: "Series A Pitch Deck — Climate Tech", client: "Aralink Labs", clientHue: 160, budget: 4500, category: "Strategy & Design", submittedAgo: "3d ago", status: "pending", coverNote: "I specialize in investor narratives for climate and impact-driven startups." },
  { id: "a3", projectTitle: "Arabic & Cyrillic Localization", client: "Hunar Bazaar", clientHue: 290, budget: 3500, category: "Localization", submittedAgo: "5d ago", status: "pending", coverNote: "Native Uzbek speaker with deep i18n experience across Central Asian markets." },
  { id: "a4", projectTitle: "Madrasa Restoration 3D Documentation", client: "UNESCO CA Bureau", clientHue: 280, budget: 8000, category: "Architecture", submittedAgo: "1w ago", status: "rejected", coverNote: "Led photogrammetry documentation for three UNESCO heritage sites in Uzbekistan." },
];

export const reviews: Review[] = [
  { id: "r1", from: "Asaka Capital", fromHue: 215, project: "Fintech App Redesign", rating: 5, body: "Nargiza delivered exceptional work. The designs are both beautiful and production-ready. Will definitely hire again.", date: "Jun 10" },
  { id: "r2", from: "Tezda", fromHue: 250, project: "iOS App Development", rating: 5, body: "Farrukh is a rockstar. Delivered on time, communicated proactively, and the code quality is superb.", date: "Jun 05" },
  { id: "r3", from: "Hunar Bazaar", fromHue: 290, project: "Brand Identity System", rating: 4, body: "Great work overall. Minor delays on revisions but the final output was worth it.", date: "May 28" },
  { id: "r4", from: "Aralink Labs", fromHue: 160, project: "Growth Audit", rating: 5, body: "The playbook Madina built has already generated measurable results in just 3 weeks.", date: "May 20" },
];

export const escrowRecords: EscrowRecord[] = [
  { id: "e1", project: "Fintech App Redesign", client: "Asaka Capital", clientHue: 215, amount: 6000, status: "funded", milestone: "Prototype & handoff", date: "Jun 10" },
  { id: "e2", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250, amount: 4400, status: "funded", milestone: "Core feature build", date: "Jun 08" },
  { id: "e3", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290, amount: 400, status: "pending", milestone: "Brand guidelines PDF", date: "Jun 12" },
  { id: "e4", project: "Growth Strategy Audit", client: "Aralink Labs", clientHue: 160, amount: 850, status: "released", milestone: "Full delivery", date: "Jun 05" },
];

export const hiringPipeline: HiringLead[] = [
  { id: "h1", name: "Nargiza Akhmedova", hue: 250, title: "Senior Brand Designer", stage: "shortlisted", project: "Fintech App Redesign", rate: 45, rating: 5.0 },
  { id: "h2", name: "Azamat Usmanov", hue: 215, title: "Full Stack Engineer", stage: "interview", project: "Fintech App Redesign", rate: 65, rating: 4.97 },
  { id: "h3", name: "Farrukh Saidov", hue: 210, title: "iOS Engineer", stage: "offer", project: "iOS App", rate: 55, rating: 4.98 },
  { id: "h4", name: "Dilnoza Kim", hue: 270, title: "3D Artist", stage: "reviewing", project: "Series A Deck", rate: 38, rating: 4.92 },
  { id: "h5", name: "Madina Azimova", hue: 290, title: "Growth Consultant", stage: "reviewing", project: "Growth Audit", rate: 80, rating: 4.95 },
];
