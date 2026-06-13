import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField, AuthButton, AuthDivider, authInputClass } from "@/components/auth/auth-field";
import { GoogleButton } from "@/components/auth/google-button";
import { getDefaultDashboard } from "@/lib/auth";
import { requireGuest } from "@/lib/guards";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: requireGuest,
  head: () => ({
    meta: [{ title: "Sign in — Ishbor" }, { name: "description", content: "Sign in to your Ishbor account" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const result = loginWithCredentials(email, password, remember);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Welcome back!", { description: "Redirecting to your workspace." });
      const dest = redirectTo || getDefaultDashboard(result.session.user.userType);
      navigate({ to: dest as "/" });
    }, 400);
  };

  const handleGoogle = () => {
    const result = loginWithCredentials("nargiza@ishbor.uz", "demo1234", remember);
    if (result.ok) {
      toast.success("Signed in with Google");
      navigate({ to: (redirectTo || getDefaultDashboard(result.session.user.userType)) as "/" });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage projects, messages, and payments."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="mb-4 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
        Demo: <button type="button" onClick={() => { setEmail("sardor@asaka.uz"); setPassword("demo1234"); }} className="font-medium text-primary hover:underline">client</button>
        {" · "}
        <button type="button" onClick={() => { setEmail("nargiza@ishbor.uz"); setPassword("demo1234"); }} className="font-medium text-primary hover:underline">freelancer</button>
        {" · password: demo1234"}
      </div>

      <GoogleButton label="Sign in with Google" onClick={handleGoogle} />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <AuthField
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4" />}
          required
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${authInputClass} pl-10 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="touch-target absolute right-0 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm text-muted-foreground">Remember me for 30 days</span>
        </label>

        <AuthButton type="submit" disabled={loading} loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
