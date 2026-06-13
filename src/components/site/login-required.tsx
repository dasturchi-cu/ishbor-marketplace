import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export function LoginRequired({
  title = "Kirish talab qilinadi",
  description = "Bu sahifaga kirish uchun hisob yarating yoki tizimga kiring.",
  redirect,
}: {
  title?: string;
  description?: string;
  redirect?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 text-primary">
        <Lock className="size-6" />
      </div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          to="/login"
          search={redirect ? { redirect } : undefined}
          className="touch-target rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Kirish
        </Link>
        <Link
          to="/register"
          search={{}}
          className="touch-target rounded-lg border border-border px-5 text-sm font-medium hover:border-primary/20"
        >
          Hisob yaratish
        </Link>
      </div>
    </div>
  );
}
