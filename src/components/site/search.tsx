import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const popular = [
  { label: "Mobil dizayn", query: "mobil" },
  { label: "Next.js", query: "Next.js" },
  { label: "Fintech", query: "fintech" },
  { label: "Tashkent", query: "Tashkent" },
  { label: "UI dizayn", query: "dizayn" },
];

export function UniversalSearch() {
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const submit = (query = q) => {
    const trimmed = query.trim();
    nav({
      to: "/search",
      search: { q: trimmed, type: "all", sort: "ranking_score" },
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="liquid-glass-panel rounded-2xl p-2 shadow-[0_20px_60px_-20px_oklch(0.546_0.185_257/0.10)]">
        <div className="flex items-center gap-2 px-2 py-1 sm:px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Xizmat, mutaxassis yoki loyiha qidiring…"
            aria-label="Bozor qidiruvi"
            className="min-h-11 w-full min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/50 focus-ring"
          />
          <button
            type="button"
            onClick={() => submit()}
            className="touch-target shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
          >
            Qidirish
          </button>
        </div>
      </div>
      <div className="mobile-scroll-x mt-3 flex items-center gap-1.5 px-1 text-xs text-muted-foreground sm:flex-wrap sm:justify-center sm:px-0">
        <span className="shrink-0 font-mono uppercase tracking-widest text-[10px]">Mashhur</span>
        {popular.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setQ(p.query);
              submit(p.query);
            }}
            className="touch-target shrink-0 rounded-lg liquid-glass-chip px-2.5 text-xs transition-default hover:border-primary/20 hover:text-foreground focus-ring"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
