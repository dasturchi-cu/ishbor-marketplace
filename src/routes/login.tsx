import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";

import { toast } from "sonner";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";

import { AuthField, AuthButton, AuthDivider, authInputClass } from "@/components/auth/auth-field";

import { GoogleButton } from "@/components/auth/google-button";

import { loginWithCredentials, isAdminUser, type AuthUser } from "@/lib/auth";
import { resetActiveRoleOnLogin, getActiveDashboardPath } from "@/lib/active-role-store";

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

    meta: [{ title: "Kirish — Ishbor" }, { name: "description", content: "Ishbor hisobingizga kiring" }],

  }),

  component: LoginPage,

});



function LoginPage() {

  const { redirect: redirectTo } = Route.useSearch();

  const navigate = Route.useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  const postLoginPath = (user: AuthUser) => {
    resetActiveRoleOnLogin(user);
    if (isAdminUser(user)) return "/admin";
    return getActiveDashboardPath();
  };

  const demoLogin = (email: string) => {
    const result = loginWithCredentials(email, "demo1234", true);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Xush kelibsiz!", { description: "Ish maydoningizga yo'naltirilmoqda." });
    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }
    navigate({ to: postLoginPath(result.session.user) });
  };

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    setLoading(true);

    setError("");

    setTimeout(() => {

      try {

        const result = loginWithCredentials(email, password, remember);

        if (!result.ok) {

          setError(result.error);

          return;

        }

        toast.success("Xush kelibsiz!", { description: "Ish maydoningizga yo'naltirilmoqda." });

        if (redirectTo) {

          window.location.href = redirectTo;

          return;

        }

        navigate({
          to: postLoginPath(result.session.user),
        });

      } catch {

        setError("Nimadir xato ketdi. Qayta urinib ko'ring.");

      } finally {

        setLoading(false);

      }

    }, 400);

  };



  const handleGoogle = () => {

    const result = loginWithCredentials("nargiza@ishbor.uz", "demo1234", remember);

    if (result.ok) {

      toast.success("Google orqali kirdingiz");

      if (redirectTo) {

        window.location.href = redirectTo;

        return;

      }

      navigate({ to: postLoginPath(result.session.user) });

    }

  };



  return (

    <AuthLayout

      title="Xush kelibsiz"

      subtitle="Loyihalar, xabarlar va to'lovlarni boshqarish uchun kiring."

      footer={

        <>

          Hisobingiz yo&apos;qmi?{" "}

          <Link to="/register" search={{}} className="font-medium text-primary hover:underline">

            Ro&apos;yxatdan o&apos;ting

          </Link>

        </>

      }

    >

      <div className="mb-4 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">

        Tezkor kirish: <button type="button" onClick={() => demoLogin("sardor@asaka.uz")} className="font-medium text-primary hover:underline">mijoz</button>

        {" · "}

        <button type="button" onClick={() => demoLogin("nargiza@ishbor.uz")} className="font-medium text-primary hover:underline">frilanser</button>

        {" · "}

        <button type="button" onClick={() => demoLogin("admin@ishbor.uz")} className="font-medium text-primary hover:underline">admin</button>

        {" · standart parol bilan"}

      </div>



      <GoogleButton label="Google orqali kirish" onClick={handleGoogle} />



      <AuthDivider />



      <form onSubmit={handleSubmit} className="space-y-4">

        {error && (

          <p className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p>

        )}

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

          <div className="flex items-center justify-between">

            <label

              htmlFor="password"

              className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"

            >

              Parol

            </label>

            <Link

              to="/forgot-password"

              className="text-xs font-medium text-primary hover:underline"

            >

              Parolni unutdingizmi?

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

              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}

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

          <span className="text-sm text-muted-foreground">30 kun eslab qolish</span>

        </label>



        <AuthButton type="submit" disabled={loading} loading={loading}>

          {loading ? "Kirish…" : "Kirish"}

        </AuthButton>

      </form>

    </AuthLayout>

  );

}

