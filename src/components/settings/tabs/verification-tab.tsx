import { useState, useSyncExternalStore } from "react";
import { ShieldCheck, Upload } from "lucide-react";
import { VerificationCenter } from "@/components/site/profile/verification-center";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { VerificationUploadModal } from "@/components/settings/modals/verification-upload-modal";
import {
  subscribeVerificationSettings,
  getVerificationSettings,
  buildVerificationItems,
  computeVerificationScore,
} from "@/lib/verification-settings-store";
import { useAuth } from "@/hooks/use-auth";

export function VerificationTab({ userId }: { userId: string }) {
  const { user, updateUser } = useAuth();
  const verified = !!user?.verified;
  const vState = useSyncExternalStore(
    subscribeVerificationSettings,
    () => getVerificationSettings(userId, verified),
    () => getVerificationSettings(userId, verified),
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeStepId, setActiveStepId] = useState("identity");
  const [, setTick] = useState(0);

  const openUpload = (stepId: string) => {
    setActiveStepId(stepId);
    setUploadOpen(true);
  };

  const items = buildVerificationItems(userId, verified);
  const score = computeVerificationScore(userId, verified);
  const approvedCount = vState.steps.filter((s) => s.status === "approved").length;

  return (
    <>
      <SettingsTabLayout
        title=""
        stats={
          <SettingsStatRow>
            <SettingsStatCard label="Tasdiqlash balli" value={`${score}/100`} accent />
            <SettingsStatCard label="Holat" value={verified ? "Tasdiqlangan" : "Jarayonda"} />
            <SettingsStatCard label="Qadamlar" value={`${approvedCount}/${vState.steps.length}`} />
          </SettingsStatRow>
        }
        sidebar={
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck className="size-4" />
              <span className="text-sm font-semibold">Afzalliklar</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>✓ Pro ro'yxatlar</li>
              <li>✓ Yuqori eskrou limitlari</li>
              <li>✓ Ishonch belgisi</li>
              <li>✓ Ustuvor qo'llab-quvvatlash</li>
            </ul>
          </div>
        }
      >
        <VerificationCenter items={items} />

        <SettingsSection title="Tasdiqlash jarayoni">
          <ul className="space-y-3">
            {vState.steps.map((step) => (
              <li key={step.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {step.status === "approved" && "Tasdiqlangan"}
                    {step.status === "review" && "Ko'rib chiqilmoqda"}
                    {step.status === "none" && "Boshlanmagan"}
                    {step.status === "pending" && "Kutilmoqda"}
                  </div>
                </div>
                {step.status !== "approved" && (
                  <button
                    onClick={() => openUpload(step.id)}
                    className="touch-target rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/20"
                  >
                    Yuklash
                  </button>
                )}
              </li>
            ))}
          </ul>
        </SettingsSection>

        {!verified && (
          <button
            onClick={() => openUpload("identity")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Upload className="size-4" /> Tasdiqlashni boshlash
          </button>
        )}

        {vState.history.length > 0 && (
          <SettingsSection title="Tarix">
            <ul className="space-y-2">
              {vState.history.slice(0, 5).map((h, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{h.action}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(h.date).toLocaleDateString("uz-UZ")}
                  </span>
                </li>
              ))}
            </ul>
          </SettingsSection>
        )}
      </SettingsTabLayout>

      <VerificationUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        userId={userId}
        stepId={activeStepId}
        onSubmitted={() => {
          const state = getVerificationSettings(userId, !!user?.verified);
          const manualSteps = state.steps.filter((s) => !["email", "phone"].includes(s.id));
          if (manualSteps.every((s) => s.status === "approved")) {
            updateUser({ verified: true });
          }
          setTick((t) => t + 1);
        }}
      />
    </>
  );
}
