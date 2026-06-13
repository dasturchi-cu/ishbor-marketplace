import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import {
  publishProject,
  saveProjectDraft,
  getProjectBySlug,
  type ProjectFormInput,
} from "@/lib/projects-store";

type CreateSearch = { edit?: string; published?: string };

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
  }),
  head: () => ({
    meta: [
      { title: "Post a Project — Ishbor" },
      { name: "description", content: "Create a new project and hire freelancers." },
    ],
  }),
  component: CreateProjectPage,
});

function CreateProjectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { edit } = Route.useSearch();
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

  const isValid = title.trim() && category && Number(budget) > 0 && duration.trim() && description.trim();

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast.error("Project title is required to save a draft.");
      return;
    }
    const project = saveProjectDraft(buildInput(), ctx, edit);
    toast.success("Draft saved", { description: "You can continue editing anytime from My Projects." });
    navigate({ to: "/projects/create", search: { edit: project.slug } });
  };

  const handlePublish = () => {
    if (!isValid) {
      toast.error("Please fill in all required fields before publishing.");
      return;
    }
    const project = publishProject(buildInput(), ctx, edit);
    toast.success("Project published", { description: "Freelancers can now submit proposals." });
    navigate({ to: "/projects/$slug", params: { slug: project.slug }, search: { published: "true" } });
  };

  const handleMockAttach = () => {
    const mockFiles = [
      { name: "project-brief.pdf", size: "1.2 MB" },
      { name: "reference-mockups.zip", size: "4.8 MB" },
      { name: "brand-guidelines.pdf", size: "890 KB" },
    ];
    const next = mockFiles[attachments.length % mockFiles.length]!;
    if (attachments.some((a) => a.name === next.name)) {
      toast.info("Attachment already added (mock).");
      return;
    }
    setAttachments((prev) => [...prev, next]);
    toast.success("Attachment added (mock)");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/my-projects" className="flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="size-3" /> My projects
          </Link>
          <span>/</span>
          <span>{edit ? "Edit project" : "Post a project"}</span>
        </nav>

        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {edit ? "Edit project" : "Post a project"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe your project to attract qualified freelancers. Save as draft or publish immediately.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handlePublish();
          }}
        >
          <Field label="Project title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fintech App Redesign"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required>
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
            <Field label="Experience level" required>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
              >
                <option value="Entry">Entry</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget" required>
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
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </Field>
            <Field label="Duration" required>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="6 weeks"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
              />
            </Field>
          </div>

          <Field label="Description" required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the project scope, goals, and deliverables. Use - prefix for scope items."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            />
          </Field>

          <Field label="Required skills" required>
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Figma, Design Systems, Fintech"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">Separate skills with commas.</p>
          </Field>

          <Field label="Attachments (mock)">
            <button
              type="button"
              onClick={handleMockAttach}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-primary/20"
            >
              <Paperclip className="size-4" /> Add attachment
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
              <Save className="size-4" /> Save draft
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" /> Publish project
            </button>
            <Link to="/my-projects" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Cancel
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
