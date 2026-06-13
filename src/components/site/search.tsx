import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const modes = [
  { key: "services" as const, label: "Services", placeholder: "Search services…" },
  { key: "freelancers" as const, label: "Talent", placeholder: "Find talent…" },
  { key: "projects" as const, label: "Projects", placeholder: "Find work…" },
];

const popular = ["iOS Development", "Brand Identity", "Webflow", "Pitch Decks", "Cyrillic Type"];

export function UniversalSearch({ defaultMode = "services" as "services" | "freelancers" | "projects" }) {
  const [mode, setMode] = useState(defaultMode);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const submit = () => {
    if (mode === "services") nav({ to: "/services" });
    else if (mode === "freelancers") nav({ to: "/freelancers" });
    else nav({ to: "/projects" });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-border bg-surface p-2 shadow-[0_20px_60px_-20px_oklch(0.546_0.185_257/0.10)]">
        <div className="mx-auto mb-1.5 flex w-full max-w-xs items-center gap-1 rounded-lg bg-secondary p-0.5 sm:max-w-none sm:w-fit">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`touch-target flex-1 rounded-md px-2 text-xs font-semibold transition-default sm:flex-none sm:px-3 ${
                mode === m.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-2 py-1 sm:px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={modes.find((m) => m.key === mode)!.placeholder}
            className="min-h-11 w-full min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/50 focus-ring"
          />
          <button
            onClick={submit}
            className="touch-target shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
          >
            <span className="sm:hidden">Go</span>
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
      <div className="mobile-scroll-x mt-3 flex items-center gap-1.5 px-1 text-xs text-muted-foreground sm:flex-wrap sm:justify-center sm:px-0">
        <span className="shrink-0 font-mono uppercase tracking-widest text-[10px]">Trending</span>
        {popular.map((p) => (
          <button
            key={p}
            onClick={() => setQ(p)}
            className="touch-target shrink-0 rounded-lg border border-border bg-surface px-2.5 text-xs transition-default hover:border-primary/20 hover:text-foreground focus-ring"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
