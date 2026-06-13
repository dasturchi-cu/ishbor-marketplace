import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { LoadingSpinner, confirmDestructive } from "@/components/site/feedback";
import { SettingsSaveBar } from "@/components/settings/settings-save-bar";
import { AccountTab } from "@/components/settings/tabs/account-tab";
import { SecurityTab } from "@/components/settings/tabs/security-tab";
import { NotificationsTab } from "@/components/settings/tabs/notifications-tab";
import { JobAlertsTab } from "@/components/settings/tabs/job-alerts-tab";
import { ReferralTab } from "@/components/settings/tabs/referral-tab";
import { AppearanceTab } from "@/components/settings/tabs/appearance-tab";
import { LanguageTab } from "@/components/settings/tabs/language-tab";
import { PaymentMethodsTab } from "@/components/settings/tabs/payment-tab";
import { VerificationTab } from "@/components/settings/tabs/verification-tab";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import { updateSessionUser } from "@/lib/auth";
import {
  getUserSettings,
  setAutoSave,
  saveAccountForm,
  buildAccountFormFromSession,
  type SaveState,
  type AccountFormData,
} from "@/lib/settings-store";
import {
  computeProfileCompletionPercent,
} from "@/lib/profile-store";
import { computeSecurityScore } from "@/lib/security-store";
import { computeVerificationScore } from "@/lib/verification-settings-store";

const sections = [
  "Hisob",
  "Xavfsizlik",
  "Bildirishnomalar",
  "Ogohlantirishlar",
  "Taklif dasturi",
  "Ko'rinish",
  "Til",
  "To'lov usullari",
  "Shaxsni tasdiqlash",
] as const;

type Section = (typeof sections)[number];

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
  const search = useSearch({ from: "/settings" });
  const [active, setActive] = useState<Section>("Hisob");
  const [query, setQuery] = useState("");
  const [tabLoading, setTabLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [accountDirty, setAccountDirty] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormData | null>(null);
  const [payAddConsumed, setPayAddConsumed] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const userType = user.userType === "client" ? "client" : "freelancer";
    const profilePct = computeProfileCompletionPercent(user.id, userType);
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
  }, [user]);

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
    setTimeout(() => setTabLoading(false), 200);
  };

  const handleAccountDirty = useCallback((dirty: boolean, form: AccountFormData) => {
    setAccountDirty(dirty);
    setAccountForm(form);
    if (dirty) setSaveState("dirty");
    else if (saveState === "dirty") setSaveState("idle");
  }, [saveState]);

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

  return (
    <WorkspaceShell eyebrow="Hisob" title="Sozlamalar">
      <div className={`grid gap-6 lg:grid-cols-[220px_1fr] ${showSaveBar ? "pb-20" : ""}`}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sozlamalarni qidirish..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
              aria-label="Sozlamalarni qidirish"
            />
          </div>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {filteredSections.map((s) => (
              <button
                key={s}
                onClick={() => switchTab(s)}
                className={`touch-target flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-default lg:w-full ${
                  active === s ? "bg-primary/8 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <span>{s}</span>
                {sectionCompletion[s] && (
                  <span className={`font-mono text-[10px] ${sectionCompletion[s] === "✓" ? "text-success" : "text-muted-foreground"}`}>
                    {sectionCompletion[s]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          {tabLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {active === "Hisob" && (
                <AccountTab user={user} onDirtyChange={handleAccountDirty} />
              )}
              {active === "Xavfsizlik" && <SecurityTab userId={user.id} />}
              {active === "Bildirishnomalar" && <NotificationsTab userId={user.id} />}
              {active === "Ogohlantirishlar" && <JobAlertsTab userId={user.id} />}
              {active === "Taklif dasturi" && <ReferralTab userId={user.id} />}
              {active === "Ko'rinish" && <AppearanceTab userId={user.id} />}
              {active === "Til" && <LanguageTab userId={user.id} />}
              {active === "To'lov usullari" && (
                <PaymentMethodsTab
                  userId={user.id}
                  openAddOnMount={search.pay === "add" && !payAddConsumed}
                  onAddOpened={() => setPayAddConsumed(true)}
                />
              )}
              {active === "Shaxsni tasdiqlash" && <VerificationTab userId={user.id} />}
            </>
          )}
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
