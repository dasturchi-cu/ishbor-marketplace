import { getSession } from "./auth";

const STORAGE_KEY = "ishbor-saved";
const listeners = new Set<() => void>();
let cache: Map<string, SavedState> | null = null;

export type SavedType = "service" | "freelancer" | "project" | "portfolio";

export type SavedEntry = {
  type: SavedType;
  id: string;
  savedAt: string;
};

export type SavedState = {
  services: SavedEntry[];
  freelancers: SavedEntry[];
  projects: SavedEntry[];
  portfolios: SavedEntry[];
};

const empty: SavedState = { services: [], freelancers: [], projects: [], portfolios: [] };
const EMPTY_SAVED: SavedState = empty;

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeSaved(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAll(): Record<string, SavedState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SavedState>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, SavedState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getUserId(userId?: string): string | null {
  return userId ?? getSession()?.user.id ?? null;
}

export function getSaved(userId?: string): SavedState {
  const uid = getUserId(userId);
  if (!uid) return EMPTY_SAVED;
  if (!cache) cache = new Map(Object.entries(readAll()));
  return cache.get(uid) ?? EMPTY_SAVED;
}

function persist(uid: string, state: SavedState) {
  if (!cache) cache = new Map(Object.entries(readAll()));
  cache.set(uid, state);
  const all = readAll();
  all[uid] = state;
  writeAll(all);
  notify();
}

export function removeSavedByTypeAndId(type: SavedType, id: string, userId?: string): void {
  const uid = getUserId(userId);
  if (!uid) return;
  const state = getSaved(uid);
  const key = keyFor(type);
  if (!state[key].some((e) => e.id === id)) return;
  persist(uid, { ...state, [key]: state[key].filter((e) => e.id !== id) });
}

function keyFor(type: SavedType): keyof SavedState {
  return type === "service" ? "services"
    : type === "freelancer" ? "freelancers"
    : type === "project" ? "projects"
    : "portfolios";
}

export function isSaved(type: SavedType, id: string, userId?: string): boolean {
  const uid = getUserId(userId);
  if (!uid) return false;
  const state = getSaved(uid);
  return state[keyFor(type)].some((e) => e.id === id);
}

export function toggleSaved(type: SavedType, id: string, userId?: string): boolean {
  const uid = getUserId(userId);
  if (!uid) return false;
  const state = getSaved(uid);
  const key = keyFor(type);
  const exists = state[key].some((e) => e.id === id);
  const next: SavedState = {
    ...state,
    [key]: exists
      ? state[key].filter((e) => e.id !== id)
      : [{ type, id, savedAt: new Date().toISOString() }, ...state[key]],
  };
  persist(uid, next);
  return !exists;
}

export function getSavedCount(type?: SavedType, userId?: string): number {
  const state = getSaved(userId);
  if (!type) {
    return state.services.length + state.freelancers.length + state.projects.length + state.portfolios.length;
  }
  return state[keyFor(type)].length;
}
