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
    meta: [{ title: "Elektron pochtani tasdiqlash — Ishbor" }],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/verify-email" });
  const [resent, setResent] = useState(false);

  const displayEmail = email || "email manzilingiz";

  return (
    <AuthLayout
      title="Elektron pochtangizni tasdiqlang"
      subtitle={`Tasdiqlash havolasi ${displayEmail} manziliga yuborildi. Havolani bosing yoki keyingi sahifada kodni kiriting.`}
    >
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="size-7" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Pochtangizni oching va davom etish uchun{" "}
          <span className="font-medium text-foreground">Elektron pochtani tasdiqlash</span> tugmasini bosing.
          Havola 24 soat ichida amal qiladi.
        </p>
        <div className="mt-6 space-y-3">
          <AuthButton
            type="button"
            onClick={() => navigate({ to: "/verify-otp", search: { email: displayEmail } })}
          >
            Tasdiqlash kodini kiriting <ArrowRight className="size-4" />
          </AuthButton>
          <button
            type="button"
            onClick={() => setResent(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {resent ? "Xat qayta yuborildi!" : "Xat kelmadimi? Qayta yuborish"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Elektron pochta noto&apos;g&apos;rimi?{" "}
        <Link to="/register" search={{}} className="font-medium text-primary hover:underline">
          Orqaga qaytish
        </Link>
      </p>
    </AuthLayout>
  );
}
