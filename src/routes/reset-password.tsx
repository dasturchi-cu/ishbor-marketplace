import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthButton, authInputClass } from "@/components/auth/auth-field";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/auth/password-strength";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — Ishbor" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = strength >= 2 && password === confirm && password.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 600);
  };

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="Your password has been reset successfully.">
        <div className="rounded-2xl border border-success/20 bg-success/5 p-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <p className="mt-4 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        </div>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90"
        >
          Sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password you haven't used before on Ishbor."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            New password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={`${authInputClass} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={password} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="confirm-password"
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className={`${authInputClass} pl-10`}
            />
          </div>
          {mismatch && <p className="text-xs text-destructive">Passwords don&apos;t match</p>}
        </div>

        <AuthButton type="submit" disabled={!canSubmit || loading}>
          {loading ? "Updating…" : "Update password"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
