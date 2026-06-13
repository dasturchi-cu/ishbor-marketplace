import type { CaseStudy } from "@/lib/portfolio-types";

const sections: { key: keyof CaseStudy; label: string }[] = [
  { key: "clientProblem", label: "Mijoz muammosi" },
  { key: "research", label: "Tadqiqot" },
  { key: "strategy", label: "Strategiya" },
  { key: "designProcess", label: "Dizayn jarayoni" },
  { key: "developmentProcess", label: "Ishlab chiqish jarayoni" },
  { key: "finalResult", label: "Yakuniy natija" },
  { key: "lessonsLearned", label: "O'rgangan darslar" },
];

export function CaseStudyDisplay({ caseStudy }: { caseStudy: CaseStudy }) {
  const filled = sections.filter((s) => caseStudy[s.key]?.trim());
  if (filled.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold tracking-tight">Keys stadi</h2>
      <p className="mt-1 text-sm text-muted-foreground">Loyiha jarayoni va natijalariga chuqur nazar</p>
      <div className="mt-6 space-y-6">
        {filled.map((s, i) => (
          <div
            key={s.key}
            className="relative rounded-xl border border-border bg-secondary/20 p-5 pl-6"
          >
            <div
              className="absolute left-0 top-5 h-[calc(100%-2.5rem)] w-1 rounded-full bg-primary"
              aria-hidden
            />
            <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
              {String(i + 1).padStart(2, "0")} · {s.label}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{caseStudy[s.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
