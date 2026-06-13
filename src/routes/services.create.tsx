import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Save, Send } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireRole } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  publishService,
  saveServiceDraft,
  getServiceBySlug,
  type ServiceFormInput,
} from "@/lib/services-store";

type CreateSearch = { edit?: string };

const categoryOptions = [
  "Mobil dizayn",
  "Veb dasturlash",
  "Brending",
  "Illustratsiya",
  "Mobil dasturlash",
  "Strategiya",
  "3D va Motion",
  "Huquq",
  "Marketing",
  "Konsalting",
];

export const Route = createFileRoute("/services/create")({
  beforeLoad: requireRole(["freelancer"]),
  validateSearch: (search: Record<string, unknown>): CreateSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Xizmat yaratish — Ishbor" },
      { name: "description", content: "Yangi xizmat paketi yarating va sotishni boshlang." },
    ],
  }),
  component: () => (
    <ProtectedGate roles={["freelancer"]}>
      <CreateServicePage />
    </ProtectedGate>
  ),
});

function CreateServicePage() {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();
  const { edit } = Route.useSearch();

  const existing = edit ? getServiceBySlug(edit) : undefined;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? categoryOptions[0]!);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(existing?.price?.toString() ?? "");
  const [delivery, setDelivery] = useState(existing?.delivery ?? "7 kun");
  const [included, setIncluded] = useState((existing?.included ?? []).join("\n"));

  if (!user?.username) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Username talab qilinadi</h1>
          <p className="mt-3 text-sm text-muted-foreground">Avval profilingizni to'ldiring.</p>
          <Link to="/settings" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Sozlamalar
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const buildInput = (): ServiceFormInput | null => {
    if (!title.trim() || !description.trim() || !price) return null;
    return {
      title,
      category,
      description,
      price: Number(price),
      delivery,
      included: included.split("\n").map((l) => l.trim()).filter(Boolean),
    };
  };

  const ctx = {
    ownerUserId: user.id,
    seller: user.fullName.split(" ")[0] + " " + (user.fullName.split(" ")[1]?.[0] ?? "") + ".",
    sellerUsername: user.username,
    sellerHue: user.avatarHue,
    sellerIdentityVerified: user.verified,
  };

  const handleDraft = () => {
    const input = buildInput();
    if (!input) {
      toast.error("Sarlavha, tavsif va narx to'ldirilishi shart.");
      return;
    }
    const s = saveServiceDraft(input, ctx, edit);
    toast.success("Qoralama saqlandi");
    navigate({ to: "/services/create", search: { edit: s.slug } });
  };

  const handlePublish = () => {
    const input = buildInput();
    if (!input) {
      toast.error("Sarlavha, tavsif va narx to'ldirilishi shart.");
      return;
    }
    const s = publishService(input, ctx, edit);
    if ("error" in s) {
      toast.error(s.error, { action: { label: "Narxlar", onClick: () => navigate({ to: "/pricing" }) } });
      return;
    }
    toast.success("Xizmat e'lon qilindi!");
    navigate({ to: "/services/$slug", params: { slug: s.slug } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/dashboard/freelancer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Frilanser paneli
        </Link>
        <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">Xizmat yaratish</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aniq narx, muddat va tavsif bilan xizmat paketingizni yarating.
        </p>

        <div className="mt-8 space-y-6">
          <Field label="Xizmat sarlavhasi">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Fintech mobil ilova dizayn qilaman"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </Field>

          <Field label="Kategoriya">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Narxi (USD)">
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="480"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="Yetkazish muddati">
              <input
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder="7 kun"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Tavsif">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Xizmatingiz nimalarni o'z ichiga oladi?"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </Field>

          <Field label="Nima kiritilgan (har qator — bitta band)">
            <textarea
              value={included}
              onChange={(e) => setIncluded(e.target.value)}
              rows={4}
              placeholder="UI dizayn&#10;Prototip&#10;3 ta revision"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Send className="size-4" /> E'lon qilish
          </button>
          <button
            type="button"
            onClick={handleDraft}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold hover:border-primary/20"
          >
            <Save className="size-4" /> Qoralama saqlash
          </button>
          <Link
            to="/services"
            className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Bekor qilish
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
