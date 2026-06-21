import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, User, Briefcase } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField, AuthButton, AuthDivider, authInputClass } from "@/components/auth/auth-field";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/auth/password-strength";
import { saveOnboardingState, type UserType } from "@/lib/auth-constants";
import { setPendingRegistrationPassword } from "@/lib/registration-store";
import { loginWithCredentials } from "@/lib/auth";
import { applyReferralCode } from "@/lib/referral-store";
import { cn } from "@/lib/utils";

type RegisterSearch = {
  type?: UserType;
  ref?: string;
};

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => {
    const result: RegisterSearch = {};
    if (search.type === "client" || search.type === "freelancer") result.type = search.type;
    if (typeof search.ref === "string") result.ref = search.ref;
    return result;
  },
  head: () => ({
    meta: [{ title: "Hisob yaratish — Ishbor" }, { name: "description", content: "Ishbor'ga mijoz yoki frilanser sifatida qo'shiling" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { type: initialType, ref } = useSearch({ from: "/register" });
  const [userType, setUserType] = useState<UserType>(initialType ?? "freelancer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const canSubmit = terms && strength >= 2 && name && email && password.length >= 8;

  const handleGoogle = () => {
    saveOnboardingState({ userType, email: email || "nargiza@ishbor.uz", fullName: name || "Nargiza Akhmedova" });
    const result = loginWithCredentials("nargiza@ishbor.uz", "demo1234", true);
    if (result.ok) {
      toast.success("Google orqali hisob yaratildi");
      navigate({ to: "/onboarding" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    saveOnboardingState({ userType, email, fullName: name });
    setPendingRegistrationPassword(password);
    if (ref) {
      sessionStorage.setItem("ishbor-pending-ref", ref);
    }
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/verify-email", search: { email } });
    }, 600);
  };

  return (
    <AuthLayout
      title="Hisobingizni yarating"
      subtitle="Ishbor'ga qo'shiling — Markaziy Osiyoda eskrou himoyalangan ish."
      footer={
        <>
          Allaqachon hisobingiz bormi?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Kirish
          </Link>
        </>
      }
    >
      {/* User type tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-elevated/40 p-1">
        {([
          { type: "client" as const, label: "Mijoz", icon: Briefcase },
          { type: "freelancer" as const, label: "Frilanser", icon: User },
        ]).map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => setUserType(type)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-default",
              userType === type
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <GoogleButton label="Google orqali ro'yxatdan o'tish" onClick={handleGoogle} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="To'liq ism"
          type="text"
          placeholder={userType === "client" ? "Sardor Karimov" : "Nargiza Akhmedova"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="size-4" />}
          required
          autoComplete="name"
        />

        <AuthField
          label="Elektron pochta"
          type="email"
          placeholder="siz@kompaniya.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4" />}
          required
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <label
            htmlFor="reg-password"
            className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Parol
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="Kamida 8 belgi"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={password} />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary/20"
            required
          />
          <span className="text-sm leading-relaxed text-muted-foreground">
            Men{" "}
            <Link to="/terms" className="font-medium text-primary hover:underline">
              Foydalanish shartlari
            </Link>{" "}
            va{" "}
            <Link to="/privacy" className="font-medium text-primary hover:underline">
              Maxfiylik siyosati
            </Link>
            ga roziman
          </span>
        </label>

        <AuthButton type="submit" disabled={!canSubmit || loading} loading={loading}>
          {loading
            ? "Hisob yaratilmoqda…"
            : userType === "client"
              ? "Mijoz hisobini yaratish"
              : "Frilanser hisobini yaratish"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
