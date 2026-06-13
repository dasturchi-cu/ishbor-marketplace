import { useState, useSyncExternalStore } from "react";
import { Shield, Monitor, Smartphone, LogOut } from "lucide-react";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { ChangePasswordModal } from "@/components/settings/modals/change-password-modal";
import { TwoFactorSetupModal } from "@/components/settings/modals/two-factor-modal";
import {
  subscribeSecurity,
  getSecurityState,
  computeSecurityScore,
  revokeSession,
  formatLastLogin,
} from "@/lib/security-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { confirmDestructive } from "@/components/site/feedback";

export function SecurityTab({ userId }: { userId: string }) {
  const { session, user } = useAuth();
  const security = useSyncExternalStore(subscribeSecurity, () => getSecurityState(userId), () => getSecurityState(userId));
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [, setTick] = useState(0);

  const score = computeSecurityScore(userId, !!user?.verified);
  const lastLogin = formatLastLogin(session?.loggedInAt);

  return (
    <>
      <SettingsTabLayout
        title="Xavfsizlik"
        description="Parol, 2FA va faol seanslar"
        stats={
          <SettingsStatRow>
            <SettingsStatCard label="Xavfsizlik balli" value={`${score}/100`} accent />
            <SettingsStatCard label="2FA" value={security.twoFAEnabled ? "Faol" : "O'chirilgan"} />
            <SettingsStatCard label="Oxirgi kirish" value={lastLogin} />
          </SettingsStatRow>
        }
        sidebar={
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <span className="text-sm font-semibold">Xavfsizlik maslahati</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>{security.twoFAEnabled ? "✓ 2FA yoqilgan" : "○ 2FA ni yoqing"}</li>
              <li>{security.passwordChangedAt ? "✓ Parol yangilangan" : "○ Parolni yangilang"}</li>
              <li>✓ Email tasdiqlangan</li>
            </ul>
          </div>
        }
      >
        <SettingsSection title="Parol">
          <p className="mb-3 text-sm text-muted-foreground">
            {security.passwordChangedAt
              ? `Oxirgi yangilanish: ${formatLastLogin(security.passwordChangedAt)}`
              : "Parolingizni muntazam yangilang."}
          </p>
          <button
            onClick={() => setPasswordOpen(true)}
            className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20"
          >
            Parolni o'zgartirish
          </button>
        </SettingsSection>

        <SettingsSection title="Ikki bosqichli autentifikatsiya">
          <p className="mb-3 text-sm text-muted-foreground">
            {security.twoFAEnabled
              ? "Hisobingiz qo'shimcha himoya bilan himoyalangan."
              : "Kirish uchun telefon kodini talab qiling."}
          </p>
          <button
            onClick={() => setTwoFAOpen(true)}
            className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20"
          >
            {security.twoFAEnabled ? "2FA sozlamalari" : "2FA ni yoqish"}
          </button>
        </SettingsSection>

        <SettingsSection title="Faol seanslar">
          <ul className="space-y-2">
            {security.sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                {s.device.includes("Mobil") ? (
                  <Smartphone className="size-4 text-muted-foreground" />
                ) : (
                  <Monitor className="size-4 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {s.device} · {s.browser}
                    {s.current && <span className="ml-2 text-xs text-primary">(Joriy)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.location} · {formatLastLogin(s.lastActive)}</div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => {
                      if (!confirmDestructive(`${s.device} seansini tugatishni tasdiqlaysizmi?`)) return;
                      if (revokeSession(userId, s.id)) {
                        toast.success("Seans tugatildi");
                        setTick((t) => t + 1);
                      }
                    }}
                    className="touch-target rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Seansni tugatish"
                  >
                    <LogOut className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </SettingsSection>
      </SettingsTabLayout>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} userId={userId} />
      <TwoFactorSetupModal
        open={twoFAOpen}
        onClose={() => setTwoFAOpen(false)}
        userId={userId}
        alreadyEnabled={security.twoFAEnabled}
        onEnabled={() => setTick((t) => t + 1)}
      />
    </>
  );
}
