import fs from "fs";
const file = "src/routes/freelancers.$username.tsx";
let c = fs.readFileSync(file, "utf8");

// Only replace quoted UI strings - safe replacements
const pairs = [
  ['Profile not found', 'Profil topilmadi'],
  ['Profile link copied', 'Profil havolasi nusxalandi'],
  ['Sign in as a client to invite freelancers', 'Frilanserlarni taklif qilish uchun mijoz sifatida kiring'],
  ['Post a project first', 'Avval loyiha joylang'],
  ['Create a project before inviting freelancers.', 'Frilanserlarni taklif qilishdan oldin loyiha yarating.'],
  ['Invitation sent', 'Taklif yuborildi'],
  ['Order created. Fund escrow to activate the hire.', 'Buyurtma yaratildi. Yollashni faollashtirish uchun eskrouni moliyalashtiring.'],
  ['>Talent<', '>Iste\'dod<'],
  ['Member since ', 'A\'zo bo\'lgan sana: '],
  [' reviews)', ' sharh)'],
  ['k earned', 'k topilgan'],
  ['Hire at $', 'Yollash $'],
  ['>Message<', '>Xabar<'],
  ['>Invite<', '>Taklif qilish<'],
  ['Save profile', 'Profilni saqlash'],
  ['label: "About"', 'label: "Haqida"'],
  ['label: "Portfolio"', 'label: "Portfolio"'],
  ['label: "Services"', 'label: "Xizmatlar"'],
  ['label: "Reviews"', 'label: "Sharhlar"'],
  ['>About<', '>Haqida<'],
  ['Performance & trust', 'Natija va ishonch'],
  ['Track record verified on Ishbor', 'Ishborda tasdiqlangan faoliyat'],
  ['Skills matrix', 'Ko\'nikmalar matritsasi'],
  ['Case study highlights', 'Keys stadiyalar'],
  ['>Result<', '>Natija<'],
  ['Selected work from recent engagements', 'So\'nggi loyihalardan tanlangan ishlar'],
  ['No published portfolio items yet.', 'Hali joylangan portfolio elementlari yo\'q.'],
  ['Services offered', 'Taklif etiladigan xizmatlar'],
  ['No services listed yet.', 'Hali xizmatlar ro\'yxati yo\'q.'],
  [' verified client reviews', ' tasdiqlangan mijoz sharhi'],
  ['Hourly rate', 'Soatlik stavka'],
  ['Available now', 'Hozir mavjud'],
  ['Currently busy', 'Hozir band'],
  ['Responds ', 'Javob beradi '],
  ['Hire freelancer', 'Frilanserni yollash'],
  ['Invite to project', 'Loyihaga taklif qilish'],
  ['Send message', 'Xabar yuborish'],
  ['Checkout, escrow funding, then active order. Funds release when you approve each milestone.', 'To\'lov, eskrou moliyalashtirish, keyin faol buyurtma. Har bir bosqichni tasdiqlaganingizda mablag\' chiqariladi.'],
  ['Hiring flow', 'Yollash jarayoni'],
  ['label: "Profile"', 'label: "Profil"'],
  ['Message first or hire directly with escrow protection.', 'Avval xabar yozing yoki to\'g\'ridan-to\'g\'ri eskrou himoyasi bilan yollang.'],
  ['label: "Earned"', 'label: "Topilgan"'],
  ['label: "Jobs"', 'label: "Ishlar"'],
  ['label: "Member since"', 'label: "A\'zo bo\'lgan sana"'],
  ['label: "Response"', 'label: "Javob"'],
  ['Languages', 'Tillar'],
  ['Payment protected', 'To\'lov himoyalangan'],
  ['Your payment is held in escrow and released only when you approve the milestone. 24h dispute', 'To\'lovingiz eskrouda saqlanadi va faqat bosqichni tasdiqlaganingizda chiqariladi. 24 soatlik nizo'],
  ['resolution guaranteed.', 'hal qilish kafolatlangan.'],
  ['Invite to project', 'Loyihaga taklif qilish'],
  ['Select a project to invite ', 'Taklif qilish uchun loyihani tanlang '],
  ['. An order will be created for escrow funding.', '. Eskrou moliyalashtirish uchun buyurtma yaratiladi.'],
  ['Invite & create order', 'Taklif qilish va buyurtma yaratish'],
  ['>Cancel<', '>Bekor qilish<'],
  ['>Share<', '>Ulashish<'],
];

for (const [en, uz] of pairs) {
  c = c.split(en).join(uz);
}

fs.writeFileSync(file, c);
console.log("done");
