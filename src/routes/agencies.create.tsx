import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { createAgency, publishAgency } from "@/lib/agency-store";
import { setActiveRole } from "@/lib/active-role-store";

export const Route = createFileRoute("/agencies/create")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Agentlik yaratish — Ishbor" }] }),
  component: () => (
    <ProtectedGate>
      <CreateAgencyPage />
    </ProtectedGate>
  ),
});

const defaultSpecs = ["Dizayn", "Dasturlash", "Marketing", "Video", "Konsalting"];
const defaultLangs = ["O'zbek", "Rus", "Ingliz"];

function CreateAgencyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState(new Date().getFullYear());
  const [teamSize, setTeamSize] = useState(5);
  const [location, setLocation] = useState(user?.location ?? "Tashkent, Uzbekistan");
  const [website, setWebsite] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["O'zbek"]);

  const toggleSpec = (s: string) => {
    setSpecializations((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleLang = (l: string) => {
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const handleCreate = (publish: boolean) => {
    if (!name.trim() || !description.trim() || specializations.length === 0) {
      toast.error("Nom, tavsif va kamida bitta mutaxassislik kerak.");
      return;
    }
    const result = createAgency({
      name,
      description,
      foundedYear,
      teamSize,
      specializations,
      languages,
      location,
      website: website || undefined,
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    if (publish) {
      const pub = publishAgency(result.slug);
      if ("error" in pub) {
        toast.error(pub.error);
        setActiveRole("agency");
        navigate({ to: "/agencies/$slug", params: { slug: result.slug } });
        return;
      }
      toast.success("Agentlik e'lon qilindi!");
    } else {
      toast.success("Agentlik qoralama sifatida saqlandi.");
    }
    setActiveRole("agency");
    navigate({ to: "/agencies/$slug", params: { slug: result.slug } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link to="/agencies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Agentliklar
        </Link>
        <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">Agentlik yaratish</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Jamoangizni birlashtiring va katta loyihalar uchun agentlik profili oching.
        </p>

        <div className="mt-8 space-y-5">
          <Field label="Agentlik nomi">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Masalan: Pixel Studio" />
          </Field>
          <Field label="Tavsif">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="Agentlik haqida..." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tashkil etilgan yil">
              <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Jamoa hajmi">
              <input type="number" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className={inputClass} min={1} />
            </Field>
          </div>
          <Field label="Manzil">
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Veb-sayt (ixtiyoriy)">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://" />
          </Field>
          <Field label="Mutaxassisliklar">
            <div className="flex flex-wrap gap-2">
              {defaultSpecs.map((s) => (
                <button key={s} type="button" onClick={() => toggleSpec(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${specializations.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tillar">
            <div className="flex flex-wrap gap-2">
              {defaultLangs.map((l) => (
                <button key={l} type="button" onClick={() => toggleLang(l)} className={`rounded-full border px-3 py-1 text-xs font-medium ${languages.includes(l) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => handleCreate(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Qoralama saqlash
          </button>
          <button type="button" onClick={() => handleCreate(true)} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            E'lon qilish
          </button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
