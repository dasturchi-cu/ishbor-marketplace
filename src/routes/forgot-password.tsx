import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField, AuthButton } from "@/components/auth/auth-field";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Parolni unutdim — Ishbor" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 600);
  };

  if (sent) {
    return (
      <AuthLayout
        title="Emailingizni tekshiring"
        subtitle={`Parolni tiklash havolasi ${email} manziliga yuborildi. Havola 1 soat ichida amal qiladi.`}
      >
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Xat kelmadimi? Spam papkasini tekshiring yoki{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-medium text-primary hover:underline"
            >
              qayta urinib ko&apos;ring
            </button>
          </p>
        </div>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Kirish sahifasiga qaytish
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Parolni tiklash"
      subtitle="Hisobingizga bog'langan email manzilini kiriting — tiklash havolasini yuboramiz."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" /> Kirish sahifasiga qaytish
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <AuthButton type="submit" disabled={loading}>
          {loading ? "Yuborilmoqda…" : "Tiklash havolasini yuborish"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
