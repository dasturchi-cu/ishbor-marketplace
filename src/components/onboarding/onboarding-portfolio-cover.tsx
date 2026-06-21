import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PortfolioCover } from "@/components/portfolio/portfolio-preview-card";
import { createMockUpload, isGradientUrl } from "@/lib/mock-upload";
import { cn } from "@/lib/utils";

const MAX_BYTES = 3 * 1024 * 1024;

type Props = {
  coverImage?: string;
  hue: number;
  onChange: (url: string) => void;
  onClear: () => void;
};

export function OnboardingPortfolioCover({ coverImage, hue, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const hasImage = !!coverImage && !isGradientUrl(coverImage);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat JPG, PNG yoki WebP rasm yuklash mumkin");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Rasm 3 MB dan kichik bo'lishi kerak");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await createMockUpload(file, hue);
      onChange(uploaded.url);
      toast.success("Muqova yuklandi");
    } catch {
      toast.error("Rasmni yuklab bo'lmadi");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadFile(file);
  };

  const openPicker = () => {
    if (!uploading) inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-elevated/30",
        hasImage ? "border-border" : "border-dashed border-border hover:border-primary/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleInputChange}
      />

      {hasImage ? (
        <>
          <img src={coverImage} alt="" className="aspect-[4/3] w-full object-cover sm:aspect-auto sm:min-h-[132px]" />
          <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-sm transition-default hover:bg-white focus-ring disabled:opacity-60"
            >
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
              O&apos;zgartirish
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={uploading}
              className="inline-flex size-8 items-center justify-center rounded-lg bg-black/55 text-white transition-default hover:bg-destructive/90 focus-ring disabled:opacity-60"
              aria-label="Muqovani o'chirish"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center transition-default focus-ring disabled:cursor-wait sm:aspect-auto sm:min-h-[132px]"
          aria-label="Muqova rasmini yuklash"
        >
          <PortfolioCover hue={hue} aspect="absolute inset-0 h-full w-full" className="opacity-30" />
          <div className="relative z-[1] flex flex-col items-center gap-1.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background/95 text-primary shadow-sm">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {uploading ? "Yuklanmoqda…" : "Muqova yuklash"}
            </span>
            <span className="text-[10px] text-muted-foreground">JPG, PNG · 3 MB gacha</span>
          </div>
        </button>
      )}
    </div>
  );
}
