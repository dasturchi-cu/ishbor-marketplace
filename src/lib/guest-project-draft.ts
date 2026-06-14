export type GuestProjectDraft = {
  title: string;
  description: string;
  category: string;
  budget: string;
  duration: string;
  skills: string;
  savedAt: string;
};

const STORAGE_KEY = "ishbor-guest-project-draft";

export function saveGuestProjectDraft(draft: Omit<GuestProjectDraft, "savedAt">): GuestProjectDraft {
  const full: GuestProjectDraft = { ...draft, savedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  }
  return full;
}

export function loadGuestProjectDraft(): GuestProjectDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestProjectDraft) : null;
  } catch {
    return null;
  }
}

export function consumeGuestProjectDraft(): GuestProjectDraft | null {
  const draft = loadGuestProjectDraft();
  if (draft && typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return draft;
}

export function clearGuestProjectDraft(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
