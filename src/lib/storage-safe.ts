export class StorageError extends Error {
  readonly code: "QUOTA_EXCEEDED" | "PARSE_ERROR" | "UNAVAILABLE";

  constructor(message: string, code: StorageError["code"]) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

export function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[storage] corrupt JSON for ${key}`, error);
    return fallback;
  }
}

export function safeWriteJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.code === 22)
    ) {
      console.error(`[storage] quota exceeded for ${key}`);
      throw new StorageError(
        "Saqlash joyi to'lgan. Eski ma'lumotlarni tozalang yoki brauzer keshini tozalang.",
        "QUOTA_EXCEEDED",
      );
    }
    console.error(`[storage] write failed for ${key}`, error);
    return false;
  }
}

export function safeSessionRead(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionWrite(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
