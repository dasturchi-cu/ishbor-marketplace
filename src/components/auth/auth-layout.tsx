import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
};

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <Link to="/" className="transition-default hover:opacity-80">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-6 sm:px-6">
        <div className="w-full max-w-[420px] py-4 text-foreground">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="space-y-4">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          )}
        </div>
      </main>
    </div>
  );
}
