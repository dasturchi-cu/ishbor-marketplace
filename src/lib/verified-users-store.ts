import { getSession, updateSessionUser } from "./auth";

const STORAGE_KEY = "ishbor-verified-user-ids";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function isUserVerified(userId: string, sessionVerified?: boolean): boolean {
  if (sessionVerified) return true;
  return readIds().has(userId);
}

export function setUserVerified(userId: string): void {
  const ids = readIds();
  ids.add(userId);
  writeIds(ids);
  const session = getSession();
  if (session?.user.id === userId) {
    updateSessionUser({ verified: true });
  }
}
