import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { useAuth } from "@/hooks/use-auth";
import { requireAuth } from "@/lib/guards";
import { paymentMethods as mockPaymentMethods } from "@/lib/mock-data";
import { updateSessionUser } from "@/lib/auth";

const sections = ["Account", "Security", "Notifications", "Appearance", "Language", "Payment methods", "Identity verification"] as const;

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Settings — Ishbor" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [active, setActive] = useState<(typeof sections)[number]>("Account");
  const [name, setName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState("English");

  if (!user) return null;

  const save = () => {
    updateSessionUser({ fullName: name, bio });
    toast.success("Settings saved");
  };

  return (
    <WorkspaceShell eyebrow="Account" title="Settings">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`touch-target shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-default lg:w-full ${
                active === s ? "bg-primary/8 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          {active === "Account" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Account</h2>
              <label className="block space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
                <input value={user.email} disabled className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground" />
              </label>
              <label className="block space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bio</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Save changes</button>
            </div>
          )}

          {active === "Security" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Security</h2>
              <button onClick={() => toast.success("Password reset email sent")} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20">Change password</button>
              <button onClick={() => toast.success("2FA setup started")} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/20">Enable two-factor authentication</button>
            </div>
          )}

          {active === "Notifications" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Notifications</h2>
              <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <span className="text-sm">Email notifications</span>
                <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="size-4 rounded" />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <span className="text-sm">Push notifications</span>
                <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} className="size-4 rounded" />
              </label>
              <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save preferences</button>
            </div>
          )}

          {active === "Appearance" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Appearance</h2>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      document.documentElement.classList.toggle("dark", t === "dark");
                      localStorage.setItem("ishbor-theme", t);
                      toast.success(`Switched to ${t} mode`);
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm capitalize ${theme === t ? "border-primary bg-primary/8 text-primary" : "border-border"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {active === "Language" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Language</h2>
              <select value={language} onChange={(e) => { setLanguage(e.target.value); toast.success("Language updated"); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>English</option>
                <option>Uzbek</option>
                <option>Russian</option>
              </select>
            </div>
          )}

          {active === "Payment methods" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Payment methods</h2>
              {mockPaymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{pm.label} •••• {pm.last4}</div>
                    {pm.default && <div className="text-xs text-primary">Default</div>}
                  </div>
                  <button onClick={() => toast.success("Payment method updated")} className="text-xs text-primary hover:underline">Edit</button>
                </div>
              ))}
              <button onClick={() => toast.success("Add payment method flow opened")} className="rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium hover:border-primary/30">Add payment method</button>
            </div>
          )}

          {active === "Identity verification" && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">Identity verification</h2>
              <div className={`rounded-lg border px-4 py-3 ${user.verified ? "border-success/20 bg-success/8" : "border-border"}`}>
                <div className="text-sm font-medium">{user.verified ? "Verified" : "Not verified"}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.verified ? "Your identity is verified. You qualify for Pro listings and higher escrow limits." : "Complete verification to unlock higher escrow limits and Pro listings."}
                </p>
              </div>
              {!user.verified && (
                <button onClick={() => { updateUser({ verified: true }); toast.success("Identity verification submitted"); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  Start verification
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
