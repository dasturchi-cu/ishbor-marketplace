import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { OTPInput } from "input-otp";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthButton } from "@/components/auth/auth-field";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  head: () => ({
    meta: [{ title: "Enter verification code — Ishbor" }],
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

  const handleVerify = () => {
    if (otp.length < 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/welcome", search: {} });
    }, 800);
  };

  return (
    <AuthLayout
      title="Enter verification code"
      subtitle={`We sent a 6-digit code to ${email || "your email"}. Enter it below to verify your account.`}
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
          {loading ? "Verifying…" : "Verify code"}
        </AuthButton>

        <p className="text-center text-sm text-muted-foreground">
          {countdown > 0 ? (
            <>Resend code in {countdown}s</>
          ) : (
            <button
              type="button"
              onClick={() => setCountdown(60)}
              className="font-medium text-primary hover:underline"
            >
              Resend code
            </button>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/verify-email" search={{ email }} className="font-medium text-primary hover:underline">
          Use email link instead
        </Link>
      </p>
    </AuthLayout>
  );
}
