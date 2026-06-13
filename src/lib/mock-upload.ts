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
