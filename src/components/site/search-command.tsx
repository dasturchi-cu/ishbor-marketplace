import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight, Briefcase, Users, Package, Shield } from "lucide-react";

import { POPULAR_SEARCHES } from "@/lib/search-suggestions";

const quickLinks = [
  { label: "Xizmatlar", to: "/services" as const, icon: Package },
  { label: "Mutaxassislar", to: "/freelancers" as const, icon: Users },
  { label: "Loyihalar", to: "/projects" as const, icon: Briefcase },
];

export function SearchCommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setQ("");
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const trimmed = q.trim();
    if (/^admin$/i.test(trimmed)) {
      navigate({ to: "/admin" });
      onClose();
      return;
    }
    navigate({ to: "/search", search: { q: trimmed, type: "all", sort: "ranking_score" } });
    onClose();
  };

  const showAdminShortcut = /^admin$/i.test(q.trim());

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[max(1rem,12vh)] sm:p-6">
      <button
        type="button"
        className="liquid-glass-overlay absolute inset-0"
        aria-label="Qidiruvni yopish"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Bozor qidiruvi"
        className="liquid-glass-panel relative z-10 w-full max-w-xl overflow-hidden rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Xizmat, mutaxassis yoki loyiha qidiring…"
            aria-label="Bozor qidiruvi"
            className="min-h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="font-mono hidden shrink-0 rounded border border-border/80 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <div className="p-2">
          {showAdminShortcut && (
            <button
              type="button"
              onClick={() => {
                navigate({ to: "/admin" });
                onClose();
              }}
              className="mb-2 flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-left text-sm transition-default hover:border-primary/35"
            >
              <Shield className="size-4 text-primary" />
              <span className="flex-1 font-semibold text-primary">Admin konsoli</span>
              <ArrowRight className="size-3.5 text-primary" />
            </button>
          )}
          <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Tez havolalar
          </p>
          {quickLinks.map((link) => (
            <button
              key={link.to}
              type="button"
              onClick={() => {
                navigate({ to: link.to });
                onClose();
              }}
              className="premium-press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/50"
            >
              <link.icon className="size-4 text-muted-foreground" />
              <span className="flex-1 font-medium">{link.label}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </button>
          ))}
          <p className="mt-2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Mashhur qidiruvlar
          </p>
          <div className="flex flex-wrap gap-1.5 px-2 pb-2">
            {POPULAR_SEARCHES.slice(0, 4).map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setQ(s.query);
                  navigate({
                    to: "/search",
                    search: { q: s.query, type: s.type ?? "all", sort: "ranking_score" },
                  });
                  onClose();
                }}
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium transition-default hover:border-primary/25 active:scale-[0.98]"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={submit}
            className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
          >
            Qidiruv natijalarini ko&apos;rish
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function useSearchCommandShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);
}
