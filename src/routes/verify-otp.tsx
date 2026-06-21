import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { OTPInput } from "input-otp";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthButton } from "@/components/auth/auth-field";
import { cn } from "@/lib/utils";
import { loadOnboardingState } from "@/lib/auth-constants";
import { consumePendingRegistrationPassword } from "@/lib/registration-store";
import { completeRegistrationSession } from "@/lib/api/session.functions";
import { applyServerSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  head: () => ({
    meta: [{ title: "Tasdiqlash kodini kiriting — Ishbor" }],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/verify-otp" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError("6 xonali kodni to'liq kiriting");
      return;
    }
    if (otp !== "123456") {
      setError("Noto'g'ri kod. Qayta urinib ko'ring.");
      return;
    }
    setLoading(true);
    setError("");
    const onboarding = loadOnboardingState();
    const password = consumePendingRegistrationPassword();
    if (!password || password.length < 8) {
      setError("Ro'yxatdan o'tish ma'lumotlari topilmadi. Qayta ro'yxatdan o'ting.");
      setLoading(false);
      return;
    }
    try {
      const result = await completeRegistrationSession({
        data: {
          email: email || onboarding.email,
          password,
          otp,
          fullName: onboarding.fullName || "Foydalanuvchi",
          userType: onboarding.userType,
          company: onboarding.company || undefined,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applyServerSession(result.session);
      toast.success("Hisob tasdiqlandi!");
      navigate({ to: "/welcome", search: {} });
    } catch {
      setError("Tasdiqlashda xatolik. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tasdiqlash kodini kiriting"
      subtitle={`6 xonali kod ${email || "email manzilingizga"} yuborildi. Hisobingizni tasdiqlash uchun quyida kiriting.`}
    >
      <div className="space-y-6">
        <OTPInput
          maxLength={6}
          value={otp}
          onChange={(v) => {
            setOtp(v);
            setError("");
          }}
          containerClassName="flex justify-center gap-2 sm:gap-3"
          render={({ slots }) => (
            <>
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-xl border text-lg font-semibold transition-default sm:size-14",
                    slot.isActive
                      ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                      : "border-input bg-card text-foreground shadow-sm",
                  )}
                >
                  {slot.char}
                  {slot.hasFakeCaret && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-px animate-pulse-subtle bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        />

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <AuthButton type="button" onClick={handleVerify} disabled={loading || otp.length < 6}>
          {loading ? "Tekshirilmoqda…" : "Kodni tasdiqlash"}
        </AuthButton>

        <p className="text-center text-sm text-muted-foreground">
          {countdown > 0 ? (
            <>Kodni qayta yuborish: {countdown}s</>
          ) : (
            <button
              type="button"
              onClick={() => setCountdown(60)}
              className="font-medium text-primary hover:underline"
            >
              Kodni qayta yuborish
            </button>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/verify-email" search={{ email }} className="font-medium text-primary hover:underline">
          Email havolasidan foydalanish
        </Link>
      </p>
    </AuthLayout>
  );
}
