import { useRef, useState, useEffect } from "react";
import { Film, ImagePlus, Link2, Loader2, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { SettingsField } from "@/components/settings/settings-field";
import { createMockUpload, createMockVideoUpload } from "@/lib/mock-upload";
import {
  saveProfileVideoIntro,
  type ProfileVideoIntro,
  subscribeProfiles,
  getUserProfile,
} from "@/lib/profile-store";
import { parseVideoUrl } from "@/lib/trust-utils";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

type Props = {
  userId: string;
  hue?: number;
  compact?: boolean;
  className?: string;
};

export function ProfileVideoEditor({ userId, hue = 250, compact, className }: Props) {
  const profile = useSyncExternalStore(
    subscribeProfiles,
    () => getUserProfile(userId),
    () => null,
  );
  const video = profile?.videoIntro;
  const [urlInput, setUrlInput] = useState(video?.url ?? "");
  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(video?.url ?? "");
  }, [video?.url]);

  const persist = (next: ProfileVideoIntro | undefined) => {
    saveProfileVideoIntro(userId, next);
  };

  const saveUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      persist(video?.fileUrl ? { ...video, url: undefined } : undefined);
      toast.success("Video havolasi olib tashlandi");
      return;
    }
    const parsed = parseVideoUrl(trimmed);
    if (!parsed.embedUrl && !trimmed.startsWith("data:video") && !/\.(mp4|webm|mov)(\?|$)/i.test(trimmed)) {
      toast.error("YouTube, Vimeo yoki to'g'ridan-to'g'ri MP4/WebM havola kiriting");
      return;
    }
    persist({
      ...video,
      url: trimmed,
      fileUrl: undefined,
    });
    toast.success("Video havolasi saqlandi");
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await createMockVideoUpload(file);
      persist({
        url: undefined,
        fileUrl: uploaded.url,
        posterUrl: video?.posterUrl,
        duration: uploaded.duration,
      });
      setUrlInput("");
      toast.success("Video yuklandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Videoni yuklab bo'lmadi");
    } finally {
      setUploading(false);
    }
  };

  const uploadPoster = async (file: File) => {
    try {
      const uploaded = await createMockUpload(file, hue);
      if (uploaded.url.startsWith("gradient:")) {
        toast.error("Rasm faylini tanlang");
        return;
      }
      persist({ ...video, posterUrl: uploaded.url });
      toast.success("Muqova saqlandi");
    } catch {
      toast.error("Muqovani yuklab bo'lmadi");
    }
  };

  const removeAll = () => {
    persist(undefined);
    setUrlInput("");
    toast.success("Video tanishtiruv o'chirildi");
  };

  const hasMedia = !!(video?.url || video?.fileUrl);

  return (
    <div className={cn("space-y-4", className)}>
      {!compact && (
        <div>
          <h3 className="text-sm font-semibold">Video tanishtiruv</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            YouTube/Vimeo havola yoki MP4/WebM fayl (25 MB gacha). Mijozlar ishonchni oshiradi.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <SettingsField
            label="Video havolasi"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="YouTube, Vimeo yoki video URL"
            icon={<Link2 className="size-4" />}
          />
          <button
            type="button"
            onClick={saveUrl}
            className="touch-target rounded-lg border border-border px-3 py-2 text-xs font-medium transition-default hover:border-primary/25 hover:text-primary"
          >
            Havolani saqlash
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Yoki fayl yuklash</span>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadVideo(file);
            }}
          />
          <input
            ref={posterInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadPoster(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => videoInputRef.current?.click()}
            className="touch-target flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm font-medium transition-default hover:border-primary/35 hover:bg-primary/5 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Yuklanmoqda…" : "Video fayl (MP4/WebM)"}
          </button>
          <button
            type="button"
            onClick={() => posterInputRef.current?.click()}
            className="touch-target flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-default hover:border-primary/25"
          >
            <ImagePlus className="size-3.5" />
            Muqova rasmi {video?.posterUrl ? "· almashtirish" : "(ixtiyoriy)"}
          </button>
        </div>
      </div>

      {hasMedia && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <Film className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {video?.fileUrl ? "Yuklangan video" : "Video havolasi"}
              {video?.duration ? ` · ${video.duration}` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={removeAll}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-destructive/10 hover:text-destructive"
            aria-label="Videoni o'chirish"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      {!hasMedia && compact && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
          <Video className="size-4 shrink-0" />
          Video qo&apos;shing — profil ko&apos;rinishi yaxshilanadi
        </div>
      )}
    </div>
  );
}
