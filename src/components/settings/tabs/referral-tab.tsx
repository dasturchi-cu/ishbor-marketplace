import { toast } from "sonner";
import { Share2, Copy } from "lucide-react";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { getReferralStats, getReferralLink, getReferralState } from "@/lib/referral-store";

export function ReferralTab({ userId }: { userId: string }) {
  const referral = getReferralStats(userId);
  const state = getReferralState(userId);
  const link = getReferralLink(userId);

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Ishbor ga qo'shiling!")}`, "_blank");
  };

  return (
    <SettingsTabLayout
      title=""
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Kredit" value={`${referral.credits.toLocaleString()} UZS`} accent />
          <SettingsStatCard label="Jami" value={referral.total} hint="Takliflar" />
          <SettingsStatCard label="Faol" value={referral.completed} hint="Tasdiqlangan" />
        </SettingsStatRow>
      }
      sidebar={
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="mx-auto mb-3 flex size-32 items-center justify-center rounded-xl border border-border bg-secondary/30 font-mono text-[10px]">
            QR KOD
            <br />
            {referral.code}
          </div>
          <p className="text-xs text-muted-foreground">Taklif kodingiz: {referral.code}</p>
        </div>
      }
    >
      <SettingsSection title="Taklif havolasi">
        <div className="rounded-lg border border-border p-3 text-xs break-all">{link}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(link); toast.success("Havola nusxalandi"); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Copy className="size-4" /> Nusxalash
          </button>
          <button
            onClick={shareTelegram}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20"
          >
            <Share2 className="size-4" /> Telegram
          </button>
        </div>
      </SettingsSection>

      {state && state.referrals.length > 0 && (
        <SettingsSection title="So'nggi takliflar">
          <ul className="space-y-2">
            {state.referrals.slice(0, 5).map((r) => (
              <li key={r.referredUserId} className="flex justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <span>{r.referredEmail}</span>
                <span className={r.status === "completed" ? "text-success" : "text-warning"}>
                  {r.status === "completed" ? "Faol" : "Kutilmoqda"}
                </span>
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}
    </SettingsTabLayout>
  );
}
