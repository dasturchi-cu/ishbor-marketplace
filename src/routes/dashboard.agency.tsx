import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore, useEffect } from "react";
import { toast } from "sonner";
import {
  Shield,
  Briefcase,
  Building2,
} from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState, confirmDestructive } from "@/components/site/feedback";
import { WorkspaceGuidance } from "@/components/ux/workspace-guidance";
import { DashboardActivityFeed } from "@/components/site/dashboard-activity-feed";
import { SimpleStatCard } from "@/components/site/simple-stat-card";
import { AgencyVerificationBadge } from "@/components/agency/agency-verification-badge";
import { AgencyInvitePicker } from "@/components/agency/agency-invite-picker";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import {
  getAgenciesForUser,
  subscribeAgencies,
  inviteMember,
  removeMember,
  assignRole,
  requestVerification,
  publishAgency,
  hasAgencyPermission,
  getPendingInvitesForUser,
  acceptInvite,
} from "@/lib/agency-store";
import { getAgencyDashboardMetrics } from "@/lib/agency-metrics-store";
import { createCaseStudy, publishCaseStudy, getCaseStudiesByAgency, subscribeAgencyPortfolio } from "@/lib/agency-portfolio-store";
import { agencyRoleLabels, agencyVerificationLabels, type AgencyRole } from "@/lib/agency-types";
import type { AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/agency")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Agentlik paneli — Ishbor" }] }),
  component: () => (
    <ProtectedGate agency>
      <AgencyDashboardPage />
    </ProtectedGate>
  ),
});

function AgencyDashboardPage() {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (activeRole !== "agency") {
      navigate({ to: getActiveDashboardPath(activeRole), replace: true });
    }
  }, [activeRole, navigate]);

  useSyncExternalStore(subscribeAgencies, () => refresh, () => 0);
  useSyncExternalStore(subscribeAgencyPortfolio, () => refresh, () => 0);

  if (!user) return null;

  const agencies = getAgenciesForUser(user.id);
  const pendingInvites = getPendingInvitesForUser(user.email);
  const agency = agencies.find((a) => hasAgencyPermission(a, user.id, "view_dashboard")) ?? agencies[0];

  if (!agency && pendingInvites.length === 0) {
    return (
      <WorkspaceShell title="Agentlik paneli">
        <EmptyState
          icon={Building2}
          title="Agentlik topilmadi"
          description="Agentlik yarating yoki taklifni qabul qiling."
          action={
            <Link to="/agencies/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Agentlik yaratish
            </Link>
          }
        />
      </WorkspaceShell>
    );
  }

  if (!agency && pendingInvites.length > 0) {
    const invite = pendingInvites[0]!;
    return (
      <WorkspaceShell title="Agentlik taklifi">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-semibold">{invite.agency.name} sizni jamoaga taklif qildi</p>
          <p className="mt-1 text-sm text-muted-foreground">Rol: {agencyRoleLabels[invite.member.role]}</p>
          <button
            type="button"
            onClick={() => {
              const r = acceptInvite(invite.agency.slug, invite.member.userId);
              if ("error" in r) toast.error(r.error);
              else { toast.success("Taklif qabul qilindi"); setRefresh((x) => x + 1); }
            }}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Qabul qilish
          </button>
        </div>
      </WorkspaceShell>
    );
  }

  if (!agency) return null;

  const dash = getAgencyDashboardMetrics(agency);
  const canInviteAll = hasAgencyPermission(agency, user.id, "invite");
  const canInvite = canInviteAll || hasAgencyPermission(agency, user.id, "invite_freelancer");
  const canVerify = hasAgencyPermission(agency, user.id, "verify_request");
  const canPublish = hasAgencyPermission(agency, user.id, "publish");
  const caseStudies = getCaseStudiesByAgency(agency.slug);

  return (
    <AgencyDashboardContent
      agency={agency}
      dash={dash}
      user={user}
      canInvite={canInvite}
      canInviteFreelancerOnly={!canInviteAll && canInvite}
      canVerify={canVerify}
      canPublish={canPublish}
      caseStudies={caseStudies}
      onRefresh={() => setRefresh((x) => x + 1)}
    />
  );
}

function AgencyDashboardContent({
  agency,
  dash,
  user,
  canInvite,
  canInviteFreelancerOnly,
  canVerify,
  canPublish,
  caseStudies,
  onRefresh,
}: {
  agency: NonNullable<ReturnType<typeof getAgenciesForUser>[0]>;
  dash: ReturnType<typeof getAgencyDashboardMetrics>;
  user: AuthUser;
  canInvite: boolean;
  canInviteFreelancerOnly: boolean;
  canVerify: boolean;
  canPublish: boolean;
  caseStudies: ReturnType<typeof getCaseStudiesByAgency>;
  onRefresh: () => void;
}) {
  const [csTitle, setCsTitle] = useState("");

  const excludedEmails = agency.members
    .filter((member) => member.status !== "removed")
    .map((member) => member.email);

  const handleInviteUser = (picked: { email: string; fullName: string }, inviteRole: AgencyRole) => {
    const r = inviteMember(agency.slug, picked.email, inviteRole, picked.fullName);
    if ("error" in r) toast.error(r.error);
    else {
      toast.success("Taklif yuborildi");
      onRefresh();
    }
  };

  const handleAddCaseStudy = () => {
    if (!csTitle.trim()) { toast.error("Sarlavha kerak."); return; }
    const r = createCaseStudy(agency.slug, {
      agencySlug: agency.slug,
      title: csTitle,
      client: "Mijoz",
      category: agency.specializations[0] ?? "Umumiy",
      description: csTitle,
      challenge: "",
      solution: "",
      result: "",
      metrics: [],
      teamMembers: [],
      coverHue: 220,
    });
    if ("error" in r) toast.error(r.error);
    else { toast.success("Loyiha hikoyasi qo'shildi"); setCsTitle(""); onRefresh(); }
  };

  return (
    <WorkspaceShell
      eyebrow="Agentlik markazi"
      title={agency.name}
      actions={
        canPublish && agency.status === "draft" ? (
          <button
            type="button"
            onClick={() => {
              const r = publishAgency(agency.slug);
              if ("error" in r) toast.error(r.error);
              else { toast.success("E'lon qilindi"); onRefresh(); }
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            E'lon qilish
          </button>
        ) : (
          <Link to="/agencies/$slug" params={{ slug: agency.slug }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20">
            Agentlik profili
          </Link>
        )
      }
    >
      <WorkspaceGuidance user={user} />

      <div className="mb-4 flex items-center gap-2">
        <AgencyVerificationBadge level={agency.verificationLevel} />
        {agency.status === "draft" && (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">Qoralama</span>
        )}
      </div>

      <div className="mb-6">
        <Link to="/agency/clients" className="text-xs font-medium text-primary hover:underline">
          Mijozlar CRM →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SimpleStatCard label="Daromad" value={`$${dash.revenue.toLocaleString()}`} />
        <SimpleStatCard label="Buyurtmalar" value={String(dash.orders)} />
        <SimpleStatCard label="Jamoa foydalanishi" value={`${dash.teamUtilization}%`} />
      </div>

      <div className="mt-6">
        <DashboardActivityFeed />
      </div>

      {canInvite && (
        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Jamoa boshqaruvi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Platformadagi foydalanuvchini tanlang va jamoaga taklif yuboring.
          </p>
          <div className="mt-4">
            <AgencyInvitePicker
              excludeEmails={[...excludedEmails, user.email]}
              freelancerOnly={canInviteFreelancerOnly}
              onInvite={handleInviteUser}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {agency.members.filter((m) => m.status !== "removed").map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div>
                  <span className="font-medium">{m.fullName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                  <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px]">{agencyRoleLabels[m.role]}</span>
                  {m.status === "pending" && <span className="ml-1 text-[10px] text-warning">Kutilmoqda</span>}
                </div>
                {m.userId !== user.id && m.role !== "owner" && m.status === "active" && (
                  <div className="flex items-center gap-2">
                    {hasAgencyPermission(agency, user.id, "assign_roles") && (
                      <select
                        value={m.role}
                        onChange={(e) => {
                          const r = assignRole(agency.slug, m.userId, e.target.value as AgencyRole);
                          if ("error" in r) toast.error(r.error);
                          else { toast.success("Rol yangilandi"); onRefresh(); }
                        }}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        {(["manager", "recruiter", "freelancer"] as const).map((role) => (
                          <option key={role} value={role}>{agencyRoleLabels[role]}</option>
                        ))}
                      </select>
                    )}
                    {hasAgencyPermission(agency, user.id, "remove") && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirmDestructive(`${m.fullName} jamoadan olib tashlansinmi?`)) return;
                          const r = removeMember(agency.slug, m.userId);
                          if ("error" in r) toast.error(r.error);
                          else { toast.success("Olib tashlandi"); onRefresh(); }
                        }}
                        className="text-xs text-destructive"
                      >
                        Olib tashlash
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {canVerify && (
        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Tasdiqlash</h2>
          <p className="mt-1 text-sm text-muted-foreground">Jamoa hajmi talablariga qarab daraja oshiring.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["verified", "premium", "enterprise"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  const r = requestVerification(agency.slug, level);
                  if ("error" in r) toast.error(r.error);
                  else { toast.success(`${agencyVerificationLabels[level]} tasdiqlandi`); onRefresh(); }
                }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/30"
              >
                <Shield className="mr-1 inline size-3.5" /> {agencyVerificationLabels[level]}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold">Agentlik portfolio</h2>
        <div className="mt-4 flex gap-2">
          <input value={csTitle} onChange={(e) => setCsTitle(e.target.value)} placeholder="Loyiha hikoyasi sarlavhasi" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm" />
          <button type="button" onClick={handleAddCaseStudy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Qo'shish
          </button>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {caseStudies.length === 0 ? (
            <li>
              <EmptyState
                compact
                icon={Briefcase}
                title="Loyiha hikoyalari yo'q"
                description="Muvaffaqiyatli loyihalaringizni ko'rsating — mijozlar agentlik ishonchini oshiradi."
                benefit="Portfolio bilan qabul qilinish 2× ko'proq."
                action={
                  <button
                    type="button"
                    onClick={() => document.querySelector<HTMLInputElement>('[placeholder="Loyiha hikoyasi sarlavhasi"]')?.focus()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Birinchi hikoya qo'shish
                  </button>
                }
              />
            </li>
          ) : caseStudies.map((cs) => (
            <li key={cs.id} className="flex items-center justify-between py-3 text-sm">
              <span>{cs.title}</span>
              <div className="flex gap-2">
                <span className="text-xs text-muted-foreground">{cs.status}</span>
                {cs.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = publishCaseStudy(cs.id);
                      if ("error" in r) toast.error(r.error);
                      else { toast.success("E'lon qilindi"); onRefresh(); }
                    }}
                    className="text-xs text-primary"
                  >
                    E'lon qilish
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </WorkspaceShell>
  );
}
