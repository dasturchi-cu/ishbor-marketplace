import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthButton } from "@/components/auth/auth-field";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  head: () => ({
    meta: [{ title: "Verify email — Ishbor" }],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/verify-email" });
  const [resent, setResent] = useState(false);

  const displayEmail = email || "your email";

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a verification link to ${displayEmail}. Click the link or enter the code on the next screen.`}
    >
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="size-7" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Open your inbox and click <span className="font-medium text-foreground">Verify email</span> to
          continue. The link expires in 24 hours.
        </p>
        <div className="mt-6 space-y-3">
          <AuthButton
            type="button"
            onClick={() => navigate({ to: "/verify-otp", search: { email: displayEmail } })}
          >
            Enter verification code <ArrowRight className="size-4" />
          </AuthButton>
          <button
            type="button"
            onClick={() => setResent(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {resent ? "Email resent!" : "Didn't receive it? Resend email"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link to="/register" search={{}} className="font-medium text-primary hover:underline">
          Go back
        </Link>
      </p>
    </AuthLayout>
  );
}
