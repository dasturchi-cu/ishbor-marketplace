import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  Save,
  Send,
  Paperclip,
  X,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { loginDemo, logout } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  publishProject,
  saveProjectDraft,
  getProjectBySlug,
  type ProjectFormInput,
} from "@/lib/projects-store";
import { validateProjectInput } from "@/lib/project-validation";
import { consumeAiProjectDraft, mapAiCategoryToForm } from "@/lib/ai-project-generator";

type CreateSearch = { edit?: string; published?: string; ai?: string };

const projectCategoryOptions = [
  "Product Design",
  "Web Design",
  "Mobile Development",
  "Localization",
  "Strategy & Design",
  "Architecture",
  "Marketing",
  "Consulting",
];

export const Route = createFileRoute("/projects/create")({
  beforeLoad: requireRole(["client"]),
  validateSearch: (search: Record<string, unknown>): CreateSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
    published: typeof search.published === "string" ? search.published : undefined,
    ai: typeof search.ai === "string" ? search.ai : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Loyiha joylash — Ishbor" },
      { name: "description", content: "Yangi loyiha yarating va frilanserlar yollang." },
    ],
  }),
  component: () => (
    <ProtectedGate roles={["client"]}>
      <CreateProjectPage />
    </ProtectedGate>
  ),
});

function CreateProjectPage() {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();
  const { edit, ai } = Route.useSearch();

  if (activeRole !== "client") {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Mijoz hisobi talab qilinadi</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Faqat mijozlar loyiha joylash va frilanser yollashi mumkin. Siz{" "}
            <span className="font-medium text-foreground">frilanser</span> sifatida kirdingiz.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate({ to: "/login", search: { redirect: "/projects/create" } });
              }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Mijoz sifatida kirish
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                loginDemo("client");
                navigate({ to: "/projects/create" });
              }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:border-primary/20"
            >
              Demo mijozni sinash (Asaka Capital)
            </button>
            <Link to="/dashboard/freelancer" className="text-sm text-muted-foreground hover:text-foreground">
              Frilanser paneliga qaytish
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const existing = edit ? getProjectBySlug(edit) : undefined;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? projectCategoryOptions[0]!);
  const [budget, setBudget] = useState(String(existing?.budget ?? ""));
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">(existing?.budgetType ?? "fixed");
  const [duration, setDuration] = useState(existing?.duration ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [skillsText, setSkillsText] = useState(existing?.skills.join(", ") ?? "");
  const [experienceLevel, setExperienceLevel] = useState<"Entry" | "Intermediate" | "Expert">(
    existing?.experienceLevel ?? "Intermediate",
  );
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>(
    existing?.attachments ?? [],
  );

  useEffect(() => {
    if (edit || ai !== "1") return;
    const draft = consumeAiProjectDraft();
    if (!draft) return;
    setTitle(draft.title);
    setCategory(mapAiCategoryToForm(draft.category));
    setBudget(String(draft.budget.suggested));
    setDuration(`${draft.timeline.weeks} hafta`);
    setDescription(draft.description);
    setSkillsText(draft.skills.join(", "));
    toast.success("AI loyiha ma'lumotlari yuklandi");
  }, [edit, ai]);

  const buildInput = (): ProjectFormInput => ({
    title,
    category,
    budget: Number(budget) || 0,
    budgetType,
    duration,
    description,
    skills: skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    experienceLevel,
    attachments,
  });

  const ctx = {
    ownerUserId: user!.id,
    client: user!.company ?? user!.fullName,
    clientHue: user!.avatarHue,
    clientSlug: user!.companySlug,
    clientVerified: user!.verified,
  };

  const validation = validateProjectInput(buildInput());
  const isValid = validation.ok;

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast.error("Qoralama saqlash uchun loyiha nomi talab qilinadi.");
      return;
    }
    const project = saveProjectDraft(buildInput(), ctx, edit);
    toast.success("Qoralama saqlandi", { description: "Mening loyihalarimdan istalgan vaqtda davom etishingiz mumkin." });
    navigate({ to: "/projects/create", search: { edit: project.slug } });
  };

  const handlePublish = () => {
    const result = validateProjectInput(buildInput());
    if (!result.ok) {
      toast.error(result.errors[0] ?? "Joylashdan oldin barcha majburiy maydonlarni to'ldiring.");
      return;
    }
    const project = publishProject(buildInput(), ctx, edit);
    toast.success("Loyiha joylandi", { description: "Frilanserlar endi taklif yuborishi mumkin." });
    navigate({ to: "/projects/$slug", params: { slug: project.slug }, search: { published: true } });
  };

  const handleMockAttach = () => {
    const mockFiles = [
      { name: "project-brief.pdf", size: "1.2 MB" },
      { name: "reference-mockups.zip", size: "4.8 MB" },
      { name: "brand-guidelines.pdf", size: "890 KB" },
    ];
    const next = mockFiles[attachments.length % mockFiles.length]!;
    if (attachments.some((a) => a.name === next.name)) {
      toast.info("Ilova allaqachon qo'shilgan (mock).");
      return;
    }
    setAttachments((prev) => [...prev, next]);
    toast.success("Ilova qo'shildi (mock)");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/my-projects" className="flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="size-3" /> Mening loyihalarim
          </Link>
          <span>/</span>
          <span>{edit ? "Loyihani tahrirlash" : "Loyiha joylash"}</span>
        </nav>

        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {edit ? "Loyihani tahrirlash" : "Loyiha joylash"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Malakali frilanserlar jalb qilish uchun loyihangizni tasvirlab bering. Qoralama sifatida saqlang yoki darhol joylang.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handlePublish();
          }}
        >
          <Field label="Loyiha nomi" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="masalan, Fintech ilova qayta dizayni"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategoriya" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
              >
                {projectCategoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Tajriba darajasi" required>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
              >
                <option value="Entry">Boshlang'ich</option>
                <option value="Intermediate">O'rta</option>
                <option value="Expert">Ekspert</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Byudjet" required>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="12000"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
                />
                <select
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value as "fixed" | "hourly")}
                  className="rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary/30"
                >
                  <option value="fixed">Belgilangan</option>
                  <option value="hourly">Soatlik</option>
                </select>
              </div>
            </Field>
            <Field label="Muddat" required>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="6 hafta"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
              />
            </Field>
          </div>

          <Field label="Tavsif" required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Loyiha doirasi, maqsadlar va natijalarni tasvirlang. Doira bandlari uchun - prefiksidan foydalaning."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            />
          </Field>

          <Field label="Talab qilinadigan ko'nikmalar" required>
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Figma, Design Systems, Fintech"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">Ko'nikmalarni vergul bilan ajrating.</p>
          </Field>

          <Field label="Ilovalar (mock)">
            <button
              type="button"
              onClick={handleMockAttach}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-primary/20"
            >
              <Paperclip className="size-4" /> Ilova qo'shish
            </button>
            {attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {attachments.map((a) => (
                  <li key={a.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span>{a.name} <span className="text-muted-foreground">({a.size})</span></span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.name !== a.name))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:border-primary/20"
            >
              <Save className="size-4" /> Qoralamani saqlash
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" /> Loyihani joylash
            </button>
            <Link to="/my-projects" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Bekor qilish
            </Link>
          </div>
        </form>
      </div>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}
