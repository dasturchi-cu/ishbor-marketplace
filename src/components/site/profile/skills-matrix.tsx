import type { SkillEntry } from "@/lib/mock-data";

const levelLabels = ["Boshlang'ich", "O'rta", "Yaxshi", "Ilg'or", "Mutaxassis"];

export function SkillsMatrix({ skills }: { skills: SkillEntry[] }) {
  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div className="space-y-5">
      {categories.map((category) => {
        const categorySkills = skills.filter((s) => s.category === category);
        return (
          <div key={category}>
            <div className="font-mono mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {category}
            </div>
            <div className="space-y-3">
              {categorySkills.map((skill) => (
                <div key={skill.name} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{skill.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {skill.endorsements} endorsements
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${i < skill.level ? "bg-primary" : "bg-secondary"}`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-primary">
                      {levelLabels[skill.level - 1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
