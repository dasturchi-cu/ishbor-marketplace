# Ishbor Design Guardrails

Har bir UI o'zgarishida shu qoidalarga rioya qiling.

## Asosiy tamoyillar

- **To'liq qayta dizayn yo'q** — mavjud Ishbor arxitekturasi va navigatsiyasini saqlang
- **Ko'k tizim** — primary `#2563EB` / `oklch(0.546 0.185 257)` ranglarini o'zgartirmang
- **Brending** — logo, nav tuzilmasi, dashboard arxitekturasi o'zgarmasin
- **Uzbek tilida** — foydalanuvchi matnlari o'zbekcha; `font-mono` eyebrow/label uchun

## Komponent naqshlari

- **Kartalar:** `rounded-2xl border border-border bg-card hover-lift hover:border-primary/20`
- **Soyalar:** `hover:shadow-[0_20px_56px_-16px_oklch(0.546_0.185_257/0.14)]`
- **Sarlavhalar:** `font-display font-semibold tracking-tight`
- **Eyebrow:** `eyebrow` yoki `font-mono text-[10px] uppercase tracking-widest`
- **Stat panellar:** `rounded-xl border border-border bg-surface/80 px-3 py-2`
- **Asosiy panel:** `rounded-xl border border-primary/20 bg-primary/5`
- **Tugmalar (kartalar):** `actionBase` + `actionSecondary` / `actionPrimary`
- **Touch:** `touch-target`, `focus-ring`, `transition-default`

## Kartalar tuzilmasi

```
┌─ overflow-hidden rounded-2xl ─────────────┐
│  [Hero / avatar / kategoriya]             │
│  [Asosiy kontent — flex-1]                │
│  [Footer actions — mt-auto, border-t]     │
└───────────────────────────────────────────┘
```

- Konteyner: `flex h-full flex-col`
- Link blok: `flex-1`
- Footer: `mt-auto flex gap-2 border-t bg-elevated/50 p-3`

## Grid

- Marketplace: `gap-4` yoki `gap-5`, `stagger-children`
- Responsive: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

## O'zgartirmaslik

- `src/styles.css` global tokenlar
- `WorkspaceShell`, `SiteNav` tuzilmasi
- Admin OS alohida dizayn tizimi (shadcn/ui)

## Konversiya

- Har bir karta: ko'rish + bog'lanish + asosiy CTA (buyurtma/yollash/taklif)
- CTA matnlari qisqa: "Ko'rish", "Bog'lanish", "Buyurtma", "Yollash", "Taklif"
