import {
  adminUsers as seedUsers,
  adminProjects as seedProjects,
  adminServices as seedServices,
  verificationRequests as seedVerifications,
  disputes as seedDisputes,
  paymentRecords as seedPayments,
  supportTickets as seedSupport,
  moderationQueue as seedModeration,
  type AdminUser,
  type AdminProject,
  type AdminService,
  type VerificationRequest,
  type Dispute,
  type PaymentRecord,
  type SupportTicket,
  type ModerationItem,
} from "./admin-mock-data";
import { applications as seedApplications } from "./mock-data";
import type { Application } from "./mock-data";
import { getAllEscrowWorkflows, releaseEscrowMilestone, openEscrowDispute, refundEscrowToClient, getEscrowByOrderId } from "./escrow-store";
import { setUserVerified } from "./verified-users-store";

const STORAGE_KEY = "ishbor-admin-data";
const listeners = new Set<() => void>();
let cache: AdminDataState | null = null;

export type AdminDataState = {
  users: AdminUser[];
  projects: AdminProject[];
  services: AdminService[];
  applications: Application[];
  verifications: VerificationRequest[];
  disputes: Dispute[];
  payments: PaymentRecord[];
  support: SupportTicket[];
  moderation: ModerationItem[];
};

function notify() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeAdminData(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function seed(): AdminDataState {
  return {
    users: [...seedUsers],
    projects: [...seedProjects],
    services: [...seedServices],
    applications: [...seedApplications],
    verifications: [...seedVerifications],
    disputes: [...seedDisputes],
    payments: [...seedPayments],
    support: [...seedSupport],
    moderation: [...seedModeration],
  };
}

function readState(): AdminDataState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminDataState) : null;
  } catch {
    return null;
  }
}

function writeState(state: AdminDataState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAdminData(): AdminDataState {
  if (typeof window === "undefined") return seed();
  if (!cache) {
    cache = readState() ?? seed();
  }
  return cache;
}

function persist(state: AdminDataState) {
  cache = state;
  writeState(state);
  notify();
}

export function getAdminUsers(): AdminUser[] {
  return getAdminData().users;
}

export function updateAdminUser(id: string, patch: Partial<AdminUser>): AdminUser | undefined {
  const state = getAdminData();
  const idx = state.users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  const users = [...state.users];
  users[idx] = { ...users[idx]!, ...patch };
  persist({ ...state, users });
  return users[idx];
}

export function suspendAdminUser(id: string) {
  return updateAdminUser(id, { status: "suspended" });
}

export function activateAdminUser(id: string) {
  return updateAdminUser(id, { status: "active" });
}

export function banAdminUser(id: string) {
  return updateAdminUser(id, { status: "banned" });
}

export function verifyAdminUser(id: string) {
  setUserVerified(id);
  return updateAdminUser(id, { verified: true, status: "active" });
}

export function updateAdminProject(slug: string, patch: Partial<AdminProject>): AdminProject | undefined {
  const state = getAdminData();
  const idx = state.projects.findIndex((p) => p.slug === slug);
  if (idx === -1) return undefined;
  const projects = [...state.projects];
  projects[idx] = { ...projects[idx]!, ...patch };
  persist({ ...state, projects });
  return projects[idx];
}

export function updateAdminService(slug: string, patch: Partial<AdminService>): AdminService | undefined {
  const state = getAdminData();
  const idx = state.services.findIndex((s) => s.slug === slug);
  if (idx === -1) return undefined;
  const services = [...state.services];
  services[idx] = { ...services[idx]!, ...patch };
  persist({ ...state, services });
  return services[idx];
}

export function updateApplication(id: string, patch: Partial<Application>): Application | undefined {
  const state = getAdminData();
  const idx = state.applications.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  const applications = [...state.applications];
  applications[idx] = { ...applications[idx]!, ...patch };
  persist({ ...state, applications });
  return applications[idx];
}

export function updatePayment(id: string, patch: Partial<PaymentRecord>): PaymentRecord | undefined {
  const state = getAdminData();
  const idx = state.payments.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const payments = [...state.payments];
  payments[idx] = { ...payments[idx]!, ...patch };
  persist({ ...state, payments });
  return payments[idx];
}

export function updateSupportTicket(id: string, patch: Partial<SupportTicket>): SupportTicket | undefined {
  const state = getAdminData();
  const idx = state.support.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const support = [...state.support];
  support[idx] = { ...support[idx]!, ...patch };
  persist({ ...state, support });
  return support[idx];
}

export function updateModerationItem(id: string, patch: Partial<ModerationItem>): ModerationItem | undefined {
  const state = getAdminData();
  const idx = state.moderation.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  const moderation = [...state.moderation];
  moderation[idx] = { ...moderation[idx]!, ...patch };
  persist({ ...state, moderation });
  return moderation[idx];
}

export function updateVerification(id: string, patch: Partial<VerificationRequest>): VerificationRequest | undefined {
  const state = getAdminData();
  const idx = state.verifications.findIndex((v) => v.id === id);
  if (idx === -1) return undefined;
  const verifications = [...state.verifications];
  verifications[idx] = { ...verifications[idx]!, ...patch };
  persist({ ...state, verifications });
  return verifications[idx];
}

export function updateDispute(id: string, patch: Partial<Dispute>): Dispute | undefined {
  const state = getAdminData();
  const idx = state.disputes.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  const disputes = [...state.disputes];
  disputes[idx] = { ...disputes[idx]!, ...patch };
  persist({ ...state, disputes });
  return disputes[idx];
}

export function adminReleaseEscrow(escrowId: string, milestoneLabel: string) {
  return releaseEscrowMilestone(escrowId, milestoneLabel);
}

export function adminFreezeEscrow(escrowId: string) {
  return openEscrowDispute(escrowId);
}

export function adminRefundEscrow(escrowId: string) {
  return refundEscrowToClient(escrowId);
}

export function adminRefundEscrowByOrder(orderId: string) {
  const escrow = getEscrowByOrderId(orderId);
  return escrow ? refundEscrowToClient(escrow.id) : undefined;
}

export function adminReleaseEscrowByOrder(orderId: string, milestoneLabel?: string) {
  const escrow = getEscrowByOrderId(orderId);
  if (!escrow) return undefined;
  const milestone = milestoneLabel ?? escrow.milestones.find((m) => m.status === "funded")?.label;
  return milestone ? releaseEscrowMilestone(escrow.id, milestone) : undefined;
}

export function getAdminEscrowList() {
  return getAllEscrowWorkflows();
}

export function getAdminProjects() {
  return getAdminData().projects;
}

export function getAdminServices() {
  return getAdminData().services;
}

export function getAdminApplications() {
  return getAdminData().applications;
}

export function getAdminPayments() {
  return getAdminData().payments;
}

export function getAdminSupport() {
  return getAdminData().support;
}

export function getAdminModeration() {
  return getAdminData().moderation;
}

export function getAdminVerifications() {
  return getAdminData().verifications;
}

export function getAdminDisputes() {
  return getAdminData().disputes;
}
