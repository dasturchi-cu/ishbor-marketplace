import type { AuthUser } from "./auth";

const FTUE_KEY = "ishbor-ftue-state";

type FtueState = {
  welcomeDismissed: Record<string, boolean>;
  gettingStartedDismissed: Record<string, boolean>;
  unlockedSteps: Record<string, number>;
};

function readState(): FtueState {
  if (typeof window === "undefined") {
    return { welcomeDismissed: {}, gettingStartedDismissed: {}, unlockedSteps: {} };
  }
  try {
    const raw = localStorage.getItem(FTUE_KEY);
    return raw
      ? (JSON.parse(raw) as FtueState)
      : { welcomeDismissed: {}, gettingStartedDismissed: {}, unlockedSteps: {} };
  } catch {
    return { welcomeDismissed: {}, gettingStartedDismissed: {}, unlockedSteps: {} };
  }
}

function writeState(state: FtueState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FTUE_KEY, JSON.stringify(state));
}

export function isWelcomeDismissed(userId: string): boolean {
  return readState().welcomeDismissed[userId] ?? false;
}

export function dismissWelcome(userId: string) {
  const state = readState();
  state.welcomeDismissed[userId] = true;
  writeState(state);
}

export function isGettingStartedDismissed(userId: string): boolean {
  return readState().gettingStartedDismissed[userId] ?? false;
}

export function dismissGettingStarted(userId: string) {
  const state = readState();
  state.gettingStartedDismissed[userId] = true;
  writeState(state);
}

/** Progressive unlock: returns how many checklist steps to show (1-based, max 3 initially). */
export function getUnlockedStepCount(userId: string, completedCount: number): number {
  const state = readState();
  const stored = state.unlockedSteps[userId] ?? 1;
  const earned = Math.min(completedCount + 1, 99);
  return Math.max(stored, earned, 1);
}

export function advanceUnlockedSteps(userId: string, completedCount: number) {
  const state = readState();
  const next = Math.min(completedCount + 2, 99);
  state.unlockedSteps[userId] = Math.max(state.unlockedSteps[userId] ?? 1, next);
  writeState(state);
}

export type JourneyStage = {
  id: string;
  label: string;
  done: boolean;
  current: boolean;
};

export function getGuestJourney(): JourneyStage[] {
  return [
    { id: "discover", label: "Tanishish", done: false, current: true },
    { id: "register", label: "Ro'yxatdan o'tish", done: false, current: false },
    { id: "setup", label: "Profil sozlash", done: false, current: false },
    { id: "action", label: "Birinchi harakat", done: false, current: false },
  ];
}

export function getClientJourney(user: AuthUser, hasProject: boolean, verified: boolean): JourneyStage[] {
  const stages = [
    { id: "register", label: "Hisob", done: true, current: false },
    { id: "profile", label: "Profil", done: !!user.company && !!user.bio, current: false },
    { id: "project", label: "Loyiha", done: hasProject, current: false },
    { id: "hire", label: "Yollash", done: false, current: false },
    { id: "escrow", label: "Eskrou", done: false, current: false },
    { id: "review", label: "Sharh", done: false, current: false },
  ];
  const firstIncomplete = stages.findIndex((s) => !s.done);
  if (firstIncomplete >= 0) stages[firstIncomplete]!.current = true;
  if (verified) stages.find((s) => s.id === "profile")!.done = true;
  return stages;
}

export function getFreelancerJourney(
  hasPortfolio: boolean,
  hasService: boolean,
  hasApplication: boolean,
): JourneyStage[] {
  const stages = [
    { id: "register", label: "Hisob", done: true, current: false },
    { id: "profile", label: "Profil", done: false, current: false },
    { id: "portfolio", label: "Portfel", done: hasPortfolio, current: false },
    { id: "service", label: "Xizmat", done: hasService, current: false },
    { id: "apply", label: "Ariza", done: hasApplication, current: false },
    { id: "earn", label: "Daromad", done: false, current: false },
  ];
  const firstIncomplete = stages.findIndex((s) => !s.done);
  if (firstIncomplete >= 0) stages[firstIncomplete]!.current = true;
  return stages;
}

export function getAgencyJourney(published: boolean, hasMembers: boolean, hasCaseStudy: boolean): JourneyStage[] {
  const stages = [
    { id: "create", label: "Yaratish", done: true, current: false },
    { id: "profile", label: "Profil", done: published, current: false },
    { id: "team", label: "Jamoa", done: hasMembers, current: false },
    { id: "portfolio", label: "Portfolio", done: hasCaseStudy, current: false },
    { id: "clients", label: "Mijozlar", done: false, current: false },
  ];
  const firstIncomplete = stages.findIndex((s) => !s.done);
  if (firstIncomplete >= 0) stages[firstIncomplete]!.current = true;
  return stages;
}

export function getAdminJourney(): JourneyStage[] {
  return [
    { id: "login", label: "Kirish", done: true, current: false },
    { id: "overview", label: "Ko'rinish", done: false, current: true },
    { id: "moderate", label: "Moderatsiya", done: false, current: false },
    { id: "audit", label: "Audit", done: false, current: false },
  ];
}
