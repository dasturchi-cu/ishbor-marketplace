import fs from "fs";

function translateFile(file, pairs) {
  let c = fs.readFileSync(file, "utf8");
  for (const [en, uz] of pairs) {
    c = c.split(en).join(uz);
  }
  fs.writeFileSync(file, c);
  console.log("translated", file);
}

translateFile("src/routes/checkout.tsx", [
  ['{ title: "Checkout — Ishbor" }', '{ title: "To\'lov — Ishbor" }'],
  ["Escrow funded", "Eskrou moliyalashtirildi"],
  [" held in escrow for ", " eskrouda saqlanmoqda — "],
  ["Order confirmed", "Buyurtma tasdiqlandi"],
  ["Your order \"", "Buyurtmangiz \""],
  ['" is now active.', "\" endi faol."],
  ["Order confirmed", "Buyurtma tasdiqlandi"],
  ["Your payment of $", "To'lovingiz $"],
  [" is now held in escrow. The seller will be notified immediately.", " endi eskrouda saqlanmoqda. Sotuvchiga darhol xabar beriladi."],
  ["Funds will be released to the seller only after you approve the milestone delivery. Full refund if delivery terms are not met.", "Mablag'lar faqat bosqich yetkazilishini tasdiqlaganingizdan keyin sotuvchiga chiqariladi. Yetkazish shartlari bajarilmasa to'liq qaytarish."],
  ["View order", "Buyurtmani ko'rish"],
  ["View escrow", "Eskrouni ko'rish"],
  ["Dashboard", "Boshqaruv paneli"],
  ["Message seller", "Sotuvchiga xabar"],
  ["Hiring complete", "Yollash yakunlandi"],
  ["Track milestone delivery in Orders and release escrow when work is approved.", "Buyurtmalarda bosqich yetkazilishini kuzating va ish tasdiqlanganda eskrouni chiqaring."],
  ["Back", "Orqaga"],
  ["Client hiring path", "Mijoz yollash yo'li"],
  ["Complete payment to fund escrow. Your order activates once funds are secured.", "Eskrouni moliyalashtirish uchun to'lovni yakunlang. Mablag'lar xavfsizlangach buyurtma faollashadi."],
  ["Review order details, then proceed to escrow-protected payment.", "Buyurtma tafsilotlarini ko'rib chiqing, keyin eskrou himoyalangan to'lovga o'ting."],
  ["Review order", "Buyurtmani ko'rib chiqish"],
  ["Payment", "To'lov"],
  ["Review your order", "Buyurtmangizni ko'rib chiqing"],
  ["Confirm the details before proceeding to payment.", "To'lovga o'tishdan oldin tafsilotlarni tasdiqlang."],
  ["Package", "Paket"],
  ["Delivery", "Yetkazish"],
  ["Revisions", "Tuzatishlar"],
  ["Freelancer", "Frilanser"],
  ["Amount", "Summa"],
  ["Due", "Muddat"],
  ["Rate", "Stavka"],
  ["Project budget", "Loyiha byudjeti"],
  ["Est. hours", "Taxminiy soatlar"],
  ["Response", "Javob"],
  ["Escrow protected", "Eskrou himoyalangan"],
  ["Payment held until approval", "Tasdiqgacha to'lov saqlanadi"],
  ["Identity verified", "Shaxs tasdiqlangan"],
  ["Seller credentials checked", "Sotuvchi ma'lumotlari tekshirilgan"],
  ["24h resolution", "24 soat hal qilish"],
  ["Dispute support guaranteed", "Nizo yordami kafolatlangan"],
  ["Continue to payment", "To'lovga o'tish"],
  ["Cancel", "Bekor qilish"],
  ["Secure payment", "Xavfsiz to'lov"],
  ["Your payment will be held in escrow until milestone approval.", "To'lovingiz bosqich tasdiqlanguncha eskrouda saqlanadi."],
  ["Payment method", "To'lov usuli"],
  ["Humo card", "Humo karta"],
  ["Uzcard", "Uzcard"],
  ["SWIFT USD transfer", "SWIFT USD o'tkazmasi"],
  ["Selected", "Tanlangan"],
  ["Available", "Mavjud"],
  ["Bank-grade security", "Bank darajasidagi xavfsizlik"],
  ["All payments are processed through Ipoteka-bank with 256-bit encryption. Funds are held in segregated escrow accounts and released only upon your approval.", "Barcha to'lovlar 256-bit shifrlash bilan Ipoteka-bank orqali amalga oshiriladi. Mablag'lar ajratilgan eskrou hisoblarida saqlanadi va faqat sizning tasdig'ingiz bilan chiqariladi."],
  ["Pay $", "To'lash $"],
  ["Order summary", "Buyurtma xulosasi"],
  ["Service fee", "Xizmat to'lovi"],
  ["Freelancer deposit", "Frilanser depoziti"],
  ["Platform fee", "Platforma to'lovi"],
  ["Escrow protection", "Eskrou himoyasi"],
  ["Included", "Kiritilgan"],
  ["Total", "Jami"],
  [" held in escrow", " eskrouda saqlanmoqda"],
  ["Released only when you approve the delivered work. Full refund if terms aren't met.", "Faqat yetkazilgan ishni tasdiqlaganingizda chiqariladi. Shartlar bajarilmasa to'liq qaytarish."],
  ["Hire ", "Yollash "],
]);

console.log("checkout done");
