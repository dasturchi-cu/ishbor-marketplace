import { useRef } from "react";

import { Plus, Trash2, ImagePlus, X, ChevronUp, ChevronDown } from "lucide-react";

import { toast } from "sonner";

import type { PortfolioFormInput } from "@/lib/portfolio-types";

import { portfolioCategoryOptions } from "@/lib/portfolio-store";

import { createMockUpload, isGradientUrl, gradientHue, reorderArray } from "@/lib/mock-upload";

import { parseVideoUrl } from "@/lib/trust-utils";

import { PortfolioField, portfolioInputClass, portfolioTextareaClass } from "./portfolio-field";

import { PortfolioCover } from "./portfolio-preview-card";



type Props = {

  input: PortfolioFormInput;

  onChange: (input: PortfolioFormInput) => void;

  onSaveDraft: () => void;

  onPublish: () => void;

  isEdit?: boolean;

  isValid: boolean;

};



function MediaPreview({

  src,

  hue,

  aspect = "aspect-video",

  className = "",

}: {

  src?: string;

  hue: number;

  aspect?: string;

  className?: string;

}) {

  if (src && !isGradientUrl(src)) {

    return (

      <img

        src={src}

        alt=""

        className={`${aspect} w-full object-cover ${className}`}

      />

    );

  }

  return <PortfolioCover hue={src ? gradientHue(src, hue) : hue} aspect={aspect} className={className} />;

}



export function PortfolioForm({ input, onChange, onSaveDraft, onPublish, isEdit, isValid }: Props) {

  const coverInputRef = useRef<HTMLInputElement>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);



  const set = <K extends keyof PortfolioFormInput>(key: K, value: PortfolioFormInput[K]) =>

    onChange({ ...input, [key]: value });



  const setCaseStudy = (key: keyof PortfolioFormInput["caseStudy"], value: string) =>

    onChange({ ...input, caseStudy: { ...input.caseStudy, [key]: value } });



  const setLink = (key: keyof PortfolioFormInput["links"], value: string) =>

    onChange({ ...input, links: { ...input.links, [key]: value } });



  const addMetric = () => {

    if (input.metrics.length >= 6) return;

    onChange({ ...input, metrics: [...input.metrics, { label: "", value: "" }] });

  };



  const updateMetric = (idx: number, field: "label" | "value", value: string) => {

    const metrics = input.metrics.map((m, i) => (i === idx ? { ...m, [field]: value } : m));

    onChange({ ...input, metrics });

  };



  const removeMetric = (idx: number) => {

    onChange({ ...input, metrics: input.metrics.filter((_, i) => i !== idx) });

  };



  const addGalleryImage = () => {

    if (input.galleryImages.length >= 10) {

      toast.info("Maksimal 10 ta galereya rasmi ruxsat etiladi.");

      return;

    }

    const hue = (input.hue + input.galleryImages.length * 35) % 360;

    onChange({

      ...input,

      galleryImages: [...input.galleryImages, `gradient:${hue}`],

    });

    toast.success("Galereya rasmi qo'shildi");

  };



  const removeGalleryImage = (idx: number) => {

    onChange({ ...input, galleryImages: input.galleryImages.filter((_, i) => i !== idx) });

  };



  const moveGalleryImage = (idx: number, direction: "up" | "down") => {

    const to = direction === "up" ? idx - 1 : idx + 1;

    if (to < 0 || to >= input.galleryImages.length) return;

    onChange({ ...input, galleryImages: reorderArray(input.galleryImages, idx, to) });

  };



  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;

    try {

      const uploaded = await createMockUpload(file, input.hue);

      set("coverImage", uploaded.url);

      if (uploaded.hue !== undefined) set("hue", uploaded.hue);

      toast.success("Muqova yuklandi");

    } catch {

      toast.error("Muqovani yuklab bo'lmadi");

    }

    e.target.value = "";

  };



  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) return;

    const remaining = 10 - input.galleryImages.length;

    if (remaining <= 0) {

      toast.info("Maksimal 10 ta galereya rasmi ruxsat etiladi.");

      e.target.value = "";

      return;

    }

    try {

      const uploads = await Promise.all(

        files.slice(0, remaining).map((file, i) =>

          createMockUpload(file, (input.hue + input.galleryImages.length * 35 + i * 35) % 360),

        ),

      );

      onChange({

        ...input,

        galleryImages: [...input.galleryImages, ...uploads.map((u) => u.url)],

      });

      toast.success(`${uploads.length} image${uploads.length > 1 ? "s" : ""} added`);

    } catch {

      toast.error("Galereya rasmlarini yuklab bo'lmadi");

    }

    e.target.value = "";

  };



  const video = parseVideoUrl(input.videoUrl);



  return (

    <form

      className="space-y-8"

      onSubmit={(e) => {

        e.preventDefault();

        onPublish();

      }}

    >

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="font-display text-lg font-bold">Loyiha tafsilotlari</h2>

        <div className="mt-5 space-y-5">

          <PortfolioField label="Loyiha nomi" required>

            <input

              value={input.title}

              onChange={(e) => set("title", e.target.value)}

              placeholder="masalan, Fintech App Redesign"

              className={portfolioInputClass}

            />

          </PortfolioField>



          <div className="grid gap-4 sm:grid-cols-2">

            <PortfolioField label="Kategoriya" required>

              <select

                value={input.category}

                onChange={(e) => set("category", e.target.value)}

                className={portfolioInputClass}

              >

                {portfolioCategoryOptions.map((c) => (

                  <option key={c} value={c}>{c}</option>

                ))}

              </select>

            </PortfolioField>

            <PortfolioField label="Yakunlash sanasi" required>

              <input

                type="date"

                value={input.completionDate}

                onChange={(e) => set("completionDate", e.target.value)}

                className={portfolioInputClass}

              />

            </PortfolioField>

          </div>



          <PortfolioField label="Tavsif" required>

            <textarea

              value={input.description}

              onChange={(e) => set("description", e.target.value)}

              placeholder="Loyiha doirasi va rolingizni tasvirlab bering..."

              className={portfolioTextareaClass}

              rows={4}

            />

          </PortfolioField>



          <div className="grid gap-4 sm:grid-cols-2">

            <PortfolioField label="Ko'nikmalar" required hint="Vergul bilan ajratilgan">

              <input

                value={input.skills.join(", ")}

                onChange={(e) =>

                  set(

                    "skills",

                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean),

                  )

                }

                placeholder="Figma, Branding, UI Design"

                className={portfolioInputClass}

              />

            </PortfolioField>

            <PortfolioField label="Ishlatilgan texnologiyalar" hint="Vergul bilan ajratilgan">

              <input

                value={input.technologies.join(", ")}

                onChange={(e) =>

                  set(

                    "technologies",

                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean),

                  )

                }

                placeholder="React, TypeScript, Figma"

                className={portfolioInputClass}

              />

            </PortfolioField>

          </div>



          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <PortfolioField label="Mijoz nomi" hint="Ixtiyoriy">

              <input

                value={input.clientName ?? ""}

                onChange={(e) => set("clientName", e.target.value)}

                placeholder="Maxfiy"

                className={portfolioInputClass}

              />

            </PortfolioField>

            <PortfolioField label="Davomiyligi" required>

              <input

                value={input.duration}

                onChange={(e) => set("duration", e.target.value)}

                placeholder="3 months"

                className={portfolioInputClass}

              />

            </PortfolioField>

            <PortfolioField label="Jamoa hajmi" required>

              <input

                value={input.teamSize}

                onChange={(e) => set("teamSize", e.target.value)}

                placeholder="Yakka / 3 kishi"

                className={portfolioInputClass}

              />

            </PortfolioField>

            <PortfolioField label="Byudjet oralig'i" required>

              <input

                value={input.budgetRange}

                onChange={(e) => set("budgetRange", e.target.value)}

                placeholder="$5,000 – $10,000"

                className={portfolioInputClass}

              />

            </PortfolioField>

          </div>



          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">

            <input

              type="checkbox"

              checked={input.featured ?? false}

              onChange={(e) => set("featured", e.target.checked)}

              className="size-4 rounded border-border accent-primary"

            />

            <div>

              <div className="text-sm font-medium">Ajratilgan loyiha</div>

              <div className="text-xs text-muted-foreground">Bu ishni profilingizda va qidiruvda ajratib ko'rsating</div>

            </div>

          </label>

        </div>

      </section>



      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="font-display text-lg font-bold">Loyiha umumiy ko'rinishi</h2>

        <div className="mt-5 space-y-5">

          <PortfolioField label="Maqsadlar">

            <textarea value={input.objectives} onChange={(e) => set("objectives", e.target.value)} className={portfolioTextareaClass} rows={3} />

          </PortfolioField>

          <PortfolioField label="Qiyinchiliklar">

            <textarea value={input.challenges} onChange={(e) => set("challenges", e.target.value)} className={portfolioTextareaClass} rows={3} />

          </PortfolioField>

          <PortfolioField label="Yechimlar">

            <textarea value={input.solutions} onChange={(e) => set("solutions", e.target.value)} className={portfolioTextareaClass} rows={3} />

          </PortfolioField>

          <PortfolioField label="Natijalar">

            <textarea value={input.outcomes} onChange={(e) => set("outcomes", e.target.value)} className={portfolioTextareaClass} rows={3} />

          </PortfolioField>

        </div>

      </section>



      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="font-display text-lg font-bold">Natijalar va ko'rsatkichlar</h2>

        <div className="mt-5 space-y-3">

          {input.metrics.map((m, idx) => (

            <div key={idx} className="flex gap-2">

              <input

                value={m.label}

                onChange={(e) => updateMetric(idx, "label", e.target.value)}

                placeholder="Ko'rsatkich nomi"

                className={`${portfolioInputClass} flex-1`}

              />

              <input

                value={m.value}

                onChange={(e) => updateMetric(idx, "value", e.target.value)}

                placeholder="Qiymat"

                className={`${portfolioInputClass} w-32 sm:w-40`}

              />

              {input.metrics.length > 1 && (

                <button type="button" onClick={() => removeMetric(idx)} className="rounded-lg border border-border px-3 text-muted-foreground hover:text-destructive">

                  <Trash2 className="size-4" />

                </button>

              )}

            </div>

          ))}

          <button type="button" onClick={addMetric} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">

            <Plus className="size-4" /> Ko'rsatkich qo'shish

          </button>

        </div>

      </section>



      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="font-display text-lg font-bold">Tashqi havolalar</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">

          {(

            [

              ["github", "GitHub URL"],

              ["gitlab", "GitLab URL"],

              ["behance", "Behance URL"],

              ["dribbble", "Dribbble URL"],

              ["liveDemo", "Jonli demo URL"],

              ["figma", "Figma URL"],

            ] as const

          ).map(([key, label]) => (

            <PortfolioField key={key} label={label}>

              <input

                value={input.links[key] ?? ""}

                onChange={(e) => setLink(key, e.target.value)}

                placeholder={`https://...`}

                className={portfolioInputClass}

              />

            </PortfolioField>

          ))}

        </div>

      </section>



      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="font-display text-lg font-bold">Media</h2>

        <div className="mt-5 space-y-5">

          <PortfolioField label="Muqova rasmi">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

              <div className="w-full max-w-xs overflow-hidden rounded-xl border border-border">

                <MediaPreview src={input.coverImage} hue={input.hue} aspect="aspect-video" />

              </div>

              <div className="flex flex-col gap-2">

                <PortfolioField label="Urg'u rangi">

                  <input

                    type="range"

                    min={0}

                    max={360}

                    value={input.hue}

                    onChange={(e) => set("hue", Number(e.target.value))}

                    className="w-full"

                  />

                </PortfolioField>

                <input

                  ref={coverInputRef}

                  type="file"

                  accept="image/*"

                  className="hidden"

                  onChange={handleCoverUpload}

                />

                <button

                  type="button"

                  onClick={() => coverInputRef.current?.click()}

                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20"

                >

                  <ImagePlus className="size-4" /> Muqova yuklash

                </button>

                <button

                  type="button"

                  onClick={() => {

                    set("coverImage", `gradient:${input.hue}`);

                    toast.success("Gradient oldindan ko'rish o'rnatildi");

                  }}

                  className="text-xs font-medium text-muted-foreground hover:text-primary"

                >

                  Use gradient preview

                </button>

              </div>

            </div>

          </PortfolioField>



          <PortfolioField label="Galereya rasmlari" hint="10 tagacha rasm · strelkalar bilan tartiblang">

            <input

              ref={galleryInputRef}

              type="file"

              accept="image/*"

              multiple

              className="hidden"

              onChange={handleGalleryUpload}

            />

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">

              {input.galleryImages.map((img, idx) => (

                <div key={`${img}-${idx}`} className="group relative overflow-hidden rounded-lg border border-border">

                  <MediaPreview src={img} hue={input.hue + idx * 30} aspect="aspect-square" />

                  <div className="absolute left-1 top-1 flex flex-col gap-0.5 opacity-0 transition-default group-hover:opacity-100">

                    <button

                      type="button"

                      onClick={() => moveGalleryImage(idx, "up")}

                      disabled={idx === 0}

                      className="rounded bg-black/50 p-0.5 text-white disabled:opacity-30"

                      aria-label="Yuqoriga"

                    >

                      <ChevronUp className="size-3" />

                    </button>

                    <button

                      type="button"

                      onClick={() => moveGalleryImage(idx, "down")}

                      disabled={idx === input.galleryImages.length - 1}

                      className="rounded bg-black/50 p-0.5 text-white disabled:opacity-30"

                      aria-label="Pastga"

                    >

                      <ChevronDown className="size-3" />

                    </button>

                  </div>

                  <button

                    type="button"

                    onClick={() => removeGalleryImage(idx)}

                    className="absolute right-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-default group-hover:opacity-100"

                  >

                    <X className="size-3" />

                  </button>

                </div>

              ))}

              {input.galleryImages.length < 10 && (

                <>

                  <button

                    type="button"

                    onClick={() => galleryInputRef.current?.click()}

                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary"

                  >

                    <ImagePlus className="size-5" />

                  </button>

                  <button

                    type="button"

                    onClick={addGalleryImage}

                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary"

                  >

                    <Plus className="size-5" />

                  </button>

                </>

              )}

            </div>

          </PortfolioField>



          <PortfolioField label="Video URL" hint="YouTube yoki Vimeo havolasi">

            <input

              value={input.videoUrl ?? ""}

              onChange={(e) => set("videoUrl", e.target.value)}

              placeholder="https://youtube.com/watch?v=..."

              className={portfolioInputClass}

            />

            {video.embedUrl && (

              <div className="mt-3 overflow-hidden rounded-xl border border-border">

                <div className="aspect-video">

                  <iframe

                    src={video.embedUrl}

                    title={`${video.provider} preview`}

                    className="size-full"

                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

                    allowFullScreen

                  />

                </div>

                <div className="border-t border-border bg-surface px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">

                  {video.provider} preview

                </div>

              </div>

            )}

          </PortfolioField>

        </div>

      </section>



      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="font-display text-lg font-bold">Keys stadi</h2>

        <p className="mt-1 text-sm text-muted-foreground">Bu loyiha ortidagi to'liq hikoyani bering</p>

        <div className="mt-5 space-y-5">

          {(

            [

              ["clientProblem", "Mijoz muammosi"],

              ["research", "Tadqiqot"],

              ["strategy", "Strategiya"],

              ["designProcess", "Dizayn jarayoni"],

              ["developmentProcess", "Ishlab chiqish jarayoni"],

              ["finalResult", "Yakuniy natija"],

              ["lessonsLearned", "O'rgangan darslar"],

            ] as const

          ).map(([key, label]) => (

            <PortfolioField key={key} label={label}>

              <textarea

                value={input.caseStudy[key]}

                onChange={(e) => setCaseStudy(key, e.target.value)}

                className={portfolioTextareaClass}

                rows={3}

              />

            </PortfolioField>

          ))}

        </div>

      </section>



      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

        <button

          type="button"

          onClick={onSaveDraft}

          className="touch-target rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-default hover:border-primary/20"

        >

          Qoralama saqlash

        </button>

        <button

          type="submit"

          disabled={!isValid}

          className="touch-target rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-default hover:opacity-95 disabled:opacity-50"

        >

          {isEdit ? "Yangilash va nashr qilish" : "Nashr qilish"}

        </button>

      </div>

    </form>

  );

}


