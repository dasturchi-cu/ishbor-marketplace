/** UX qo'llanmasi — kutilmoqda va moliyaviy matnlar (O'zbek). */

export const WALLET_PENDING_ETA = "2–3 ish kuni";

export const APPLICATION_WAITING = {
  title: "Mijoz javobi kutilmoqda",
  eta: "24–48 soat ichida",
  hint: "Xabar yozish orqali savollaringizni aniqlashtirishingiz mumkin.",
} as const;

export const ESCROW_NEXT_STEP: Record<string, string> = {
  funded: "Frilanser ishni boshlashi kutilmoqda",
  pending_release: "Mijoz tasdig'i kutilmoqda",
  disputed: "Nizo hal qilinmoqda — qo'llab-quvvatlash bilan bog'laning",
  released: "Mablag' chiqarildi",
  draft: "Moliyalashtirish kutilmoqda",
};

export const EMPTY_STATE_CTA = {
  clientProject: { title: "Hali loyihalar yo'q", description: "Birinchi loyihangizni joylang — frilanserlar 24–48 soat ichida taklif yuboradi.", label: "Loyiha joylash", to: "/projects/create" },
  freelancerWork: { title: "Hali arizalar yo'q", description: "Loyihalarga taklif yuboring — mijoz 48 soat ichida javob beradi.", label: "Loyihalarni ko'rish", to: "/projects" },
  freelancerOrders: { title: "Faol buyurtmalar yo'q", description: "Taklifingiz qabul qilinganda buyurtma shu yerda boshlanadi.", label: "Ish topish", to: "/projects" },
  messages: { title: "Hali suhbatlar yo'q", description: "Buyurtma yoki loyiha bo'yicha frilanser/mijoz bilan bog'laning.", label: "Loyihalarni ko'rish", to: "/projects" },
  wallet: { title: "Tranzaksiyalar yo'q", description: "Hamyonni to'ldiring yoki birinchi buyurtmangizni boshlang.", label: "Hamyonni to'ldirish", to: "" },
  portfolio: { title: "Portfolio yo'q", description: "Kamida bitta loyiha qo'shing — ishonch va qabul qilinish oshadi.", label: "Portfolio yaratish", to: "/portfolio/create" },
  services: { title: "Xizmatlar yo'q", description: "Tayyor paket bilan mijozlarga tezroq sotishni boshlang.", label: "Xizmat yaratish", to: "/services/create" },
} as const;
