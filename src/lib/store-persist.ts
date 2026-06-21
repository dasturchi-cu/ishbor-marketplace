import { safeReadJson, safeWriteJson, StorageError } from "./storage-safe";

export { StorageError };

/** Read JSON from localStorage with corrupt-data fallback. */
export function persistRead<T>(key: string, fallback: T): T {
  return safeReadJson(key, fallback);
}

/** Write JSON to localStorage; throws StorageError on quota exceeded. */
export function persistWrite(key: string, value: unknown): boolean {
  return safeWriteJson(key, value);
}
