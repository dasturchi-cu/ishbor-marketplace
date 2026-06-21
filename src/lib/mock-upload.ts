/** Mock upload — stores image metadata as data URLs or gradient fallbacks. No backend. */

export type UploadedImage = {
  id: string;
  url: string;
  name: string;
  size: number;
  hue?: number;
};

export function createMockUpload(file: File, hue = 250): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve({
        id: `img-${Date.now()}`,
        url: `gradient:${hue}`,
        name: file.name,
        size: file.size,
        hue,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `img-${Date.now()}`,
        url: reader.result as string,
        name: file.name,
        size: file.size,
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function createMockUploadFromHue(hue: number, name = "image.png"): UploadedImage {
  return {
    id: `img-${Date.now()}`,
    url: `gradient:${hue}`,
    name,
    size: 240000,
    hue,
  };
}

export function isGradientUrl(url: string): boolean {
  return url.startsWith("gradient:");
}

export function gradientHue(url: string, fallback = 250): number {
  if (!isGradientUrl(url)) return fallback;
  return Number(url.split(":")[1]) || fallback;
}

export function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  if (item === undefined) return arr;
  next.splice(to, 0, item);
  return next;
}

const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export type UploadedVideo = {
  id: string;
  url: string;
  name: string;
  size: number;
  duration?: string;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function createMockVideoUpload(file: File): Promise<UploadedVideo> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("video/")) {
      reject(new Error("Faqat video fayl yuklash mumkin"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      reject(new Error("Video 25 MB dan kichik bo'lishi kerak"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({
          id: `vid-${Date.now()}`,
          url,
          name: file.name,
          size: file.size,
          duration: Number.isFinite(video.duration) ? formatDuration(video.duration) : undefined,
        });
      };
      video.onerror = () => {
        resolve({
          id: `vid-${Date.now()}`,
          url,
          name: file.name,
          size: file.size,
        });
      };
      video.src = url;
    };
    reader.onerror = () => reject(new Error("Videoni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}
