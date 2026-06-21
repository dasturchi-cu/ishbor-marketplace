import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, ChevronLeft } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { LoadingSpinner, confirmDestructive } from "@/components/site/feedback";
import { SettingsSaveBar } from "@/components/settings/settings-save-bar";
import {
  SettingsNavButton,
  SettingsMoreToggle,
  SETTINGS_SECTION_META,
  type SettingsSectionId,
} from "@/components/settings/settings-nav";
import { AccountTab } from "@/components/settings/tabs/account-tab";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import { updateSessionUser } from "@/lib/auth";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import {
  getUserSettings,
  setAutoSave,
  saveAccountForm,
  buildAccountFormFromSession,
  type SaveState,
  type AccountFormData,
} from "@/lib/settings-store";
import { computeProfileCompletionPercent } from "@/lib/profile-store";
import { computeSecurityScore } from "@/lib/security-store";
import { computeVerificationScore } from "@/lib/verification-settings-store";

const SecurityTab = lazy(() =>
  import("@/components/settings/tabs/security-tab").then((m) => ({ default: m.SecurityTab })),
);
const NotificationsTab = lazy(() =>
  import("@/components/settings/tabs/notifications-tab").then((m) => ({ default: m.NotificationsTab })),
);
const JobAlertsTab = lazy(() =>
  import("@/components/settings/tabs/job-alerts-tab").then((m) => ({ default: m.JobAlertsTab })),
);
const ReferralTab = lazy(() =>
  import("@/components/settings/tabs/referral-tab").then((m) => ({ default: m.ReferralTab })),
);
const AppearanceTab = lazy(() =>
  import("@/components/settings/tabs/appearance-tab").then((m) => ({ default: m.AppearanceTab })),
);
const LanguageTab = lazy(() =>
  import("@/components/settings/tabs/language-tab").then((m) => ({ default: m.LanguageTab })),
);
const PaymentMethodsTab = lazy(() =>
  import("@/components/settings/tabs/payment-tab").then((m) => ({ default: m.PaymentMethodsTab })),
);
const VerificationTab = lazy(() =>
  import("@/components/settings/tabs/verification-tab").then((m) => ({ default: m.VerificationTab })),
);

const coreSections = [
  "Hisob",
  "Xavfsizlik",
  "Bildirishnomalar",
  "To'lov usullari",
  "Shaxsni tasdiqlash",
] as const satisfies readonly SettingsSectionId[];

const moreSections = [
  "Ogohlantirishlar",
  "Taklif dasturi",
  "Ko'rinish",
  "Til",
] as const satisfies readonly SettingsSectionId[];

const sections = [...coreSections, ...moreSections] as const;

type Section = (typeof sections)[number];

function LazyTab({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<TabSpinner />}>{children}</Suspense>;
}

function TabSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner />
    </div>
  );
}

const TAB_ALIASES: Record<string, Section> = {
  account: "Hisob",
  hisob: "Hisob",
  security: "Xavfsizlik",
  xavfsizlik: "Xavfsizlik",
  notifications: "Bildirishnomalar",
  bildirishnomalar: "Bildirishnomalar",
  alerts: "Ogohlantirishlar",
  ogohlantirishlar: "Ogohlantirishlar",
  referral: "Taklif dasturi",
  taklif: "Taklif dasturi",
  appearance: "Ko'rinish",
  language: "Til",
  til: "Til",
  payment: "To'lov usullari",
  verification: "Shaxsni tasdiqlash",
  tasdiqlash: "Shaxsni tasdiqlash",
};

type SettingsSearch = {
  pay?: string;
  tab?: string;
};

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    pay: typeof search.pay === "string" ? search.pay : undefined,
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "Sozlamalar — Ishbor" }] }),
  component: () => (
    <ProtectedGate>
      <SettingsPage />
    </ProtectedGate>
  ),
});

function SettingsPage() {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const search = useSearch({ from: "/settings" });
  const [active, setActive] = useState<Section>("Hisob");
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [accountDirty, setAccountDirty] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormData | null>(null);
  const [accountSaveVersion, setAccountSaveVersion] = useState(0);
  const [payAddConsumed, setPayAddConsumed] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dashboardPath = getActiveDashboardPath(activeRole);
  const activeMeta = SETTINGS_SECTION_META[active];

  useEffect(() => {
    if (!accountDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [accountDirty]);

  const handleDiscard = () => {
    if (!user || !accountDirty) return;
    if (!confirmDestructive("Saqlanmagan o'zgarishlar bekor qilinsinmi?")) return;
    const baseline = buildAccountFormFromSession(user.id);
    setAccountForm(baseline);
    setAccountDirty(false);
    setSaveState("idle");
    toast.info("O'zgarishlar bekor qilindi");
  };

  const sectionCompletion = useMemo(() => {
    if (!user) return {} as Record<Section, string | null>;
    const profilePct = computeProfileCompletionPercent(user.id, activeRole);
    const security = computeSecurityScore(user.id, !!user.verified);
    const verification = computeVerificationScore(user.id, !!user.verified);
    return {
      Hisob: profilePct < 100 ? `${profilePct}%` : "✓",
      Xavfsizlik: security < 80 ? `${security}/100` : "✓",
      Bildirishnomalar: null,
      Ogohlantirishlar: null,
      "Taklif dasturi": null,
      "Ko'rinish": null,
      Til: null,
      "To'lov usullari": null,
      "Shaxsni tasdiqlash": verification < 100 ? `${verification}%` : "✓",
    } satisfies Record<Section, string | null>;
  }, [user, activeRole]);

  const settings = user ? getUserSettings(user.id) : null;

  const filteredSections = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (search.pay === "add" && !payAddConsumed) {
      setActive("To'lov usullari");
    }
  }, [search.pay, payAddConsumed]);

  useEffect(() => {
    if (!search.tab) return;
    const mapped = TAB_ALIASES[search.tab.toLowerCase()];
    if (mapped) setActive(mapped);
  }, [search.tab]);

  const switchTab = (s: Section) => {
    setTabLoading(true);
    setActive(s);
    setTimeout(() => setTabLoading(false), 150);
  };

  const handleAccountDirty = useCallback((dirty: boolean, form: AccountFormData) => {
    setAccountDirty(dirty);
    setAccountForm(form);
    setSaveState((s) => {
      if (dirty) return "dirty";
      if (s === "dirty") return "idle";
      return s;
    });
  }, []);

  const performSave = useCallback(async () => {
    if (!user || !accountForm) return;
    setSaveState("saving");
    try {
      await new Promise((r) => setTimeout(r, 400));
      saveAccountForm(user.id, accountForm);
      updateSessionUser({
        fullName: accountForm.fullName,
        bio: accountForm.bio,
        location: accountForm.location,
        username: accountForm.username || user.username,
      });
      setAccountDirty(false);
      setAccountSaveVersion((v) => v + 1);
      setSaveState("saved");
      toast.success("Sozlamalar saqlandi");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      toast.error("Saqlashda xato yuz berdi");
    }
  }, [user, accountForm]);

  useEffect(() => {
    if (!settings?.autoSave || !accountDirty || active !== "Hisob") return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      performSave();
    }, 2000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [accountDirty, settings?.autoSave, active, accountForm, performSave]);

  const handleSaveClick = () => {
    if (active === "Hisob") performSave();
  };

  if (!user) return null;

  const showSaveBar = active === "Hisob" && (accountDirty || saveState !== "idle");
  const moreActive = moreSections.includes(active as (typeof moreSections)[number]);

  return (
    <WorkspaceShell
      eyebrow="Hisob"
      title="Sozlamalar"
      actions={
        <Link
          to={dashboardPath}
          className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
        >
          <ChevronLeft className="size-4" />
          Ish maydoni
        </Link>
      }
    >
      <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <activeMeta.icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Faol bo'lim</div>
            <div className="font-display text-lg font-semibold">{active}</div>
            <p className="mt-1 text-sm text-muted-foreground">{activeMeta.description}</p>
          </div>
        </div>
      </div>

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {sections.map((s) => (
          <SettingsNavButton
            key={s}
            section={s}
            active={active === s}
            completion={sectionCompletion[s]}
            onSelect={() => switchTab(s)}
            compact
          />
        ))}
      </div>

      <div className={`grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] ${showSaveBar ? "pb-36 lg:pb-20" : ""}`}>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Qidirish…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm transition-default focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/15"
                aria-label="Sozlamalarni qidirish"
              />
            </div>
            <nav className="flex flex-col gap-1">
              {(query.trim() ? filteredSections : coreSections).map((s) => (
                <SettingsNavButton
                  key={s}
                  section={s}
                  active={active === s}
                  completion={sectionCompletion[s]}
                  onSelect={() => switchTab(s)}
                />
              ))}
              {!query.trim() && (
                <>
                  <SettingsMoreToggle
                    open={moreOpen || moreActive}
                    active={moreActive}
                    onToggle={() => setMoreOpen((o) => !o)}
                  />
                  {(moreOpen || moreActive) && (
                    <div className="space-y-1 pl-1">
                      {moreSections.map((s) => (
                        <SettingsNavButton
                          key={s}
                          section={s}
                          active={active === s}
                          completion={sectionCompletion[s]}
                          onSelect={() => switchTab(s)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-elevated/30 px-4 py-3 sm:px-6">
            <h2 className="font-display text-base font-semibold sm:text-lg">{active}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{activeMeta.description}</p>
          </div>
          <div className="p-4 sm:p-6">
            {tabLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {active === "Hisob" && (
                  <AccountTab user={user} onDirtyChange={handleAccountDirty} saveVersion={accountSaveVersion} />
                )}
                {active === "Xavfsizlik" && (
                  <LazyTab>
                    <SecurityTab userId={user.id} />
                  </LazyTab>
                )}
                {active === "Bildirishnomalar" && (
                  <LazyTab>
                    <NotificationsTab userId={user.id} />
                  </LazyTab>
                )}
                {active === "Ogohlantirishlar" && (
                  <LazyTab>
                    <JobAlertsTab userId={user.id} />
                  </LazyTab>
                )}
                {active === "Taklif dasturi" && (
                  <LazyTab>
                    <ReferralTab userId={user.id} />
                  </LazyTab>
                )}
                {active === "Ko'rinish" && (
                  <LazyTab>
                    <AppearanceTab userId={user.id} />
                  </LazyTab>
                )}
                {active === "Til" && (
                  <LazyTab>
                    <LanguageTab userId={user.id} />
                  </LazyTab>
                )}
                {active === "To'lov usullari" && (
                  <LazyTab>
                    <PaymentMethodsTab
                      userId={user.id}
                      openAddOnMount={search.pay === "add" && !payAddConsumed}
                      onAddOpened={() => setPayAddConsumed(true)}
                    />
                  </LazyTab>
                )}
                {active === "Shaxsni tasdiqlash" && (
                  <LazyTab>
                    <VerificationTab userId={user.id} />
                  </LazyTab>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showSaveBar && (
        <SettingsSaveBar
          saveState={saveState}
          dirty={accountDirty}
          autoSave={settings?.autoSave ?? false}
          onAutoSaveChange={(v) => setAutoSave(user.id, v)}
          onSave={handleSaveClick}
          onDiscard={handleDiscard}
        />
      )}
    </WorkspaceShell>
  );
}
