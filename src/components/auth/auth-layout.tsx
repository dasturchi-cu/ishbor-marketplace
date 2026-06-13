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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden border-r border-border lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.22 0.08 257) 0%, oklch(0.13 0.04 260) 50%, oklch(0.15 0.06 257) 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, oklch(0.546 0.185 257 / 0.15) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 flex flex-col p-10">
            <Link to="/" className="transition-default hover:opacity-80">
              <Logo className="text-white" />
            </Link>
            <div className="mt-auto pt-16">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
                Trusted across Central Asia
              </p>
              <h2 className="font-display mt-3 max-w-sm text-3xl font-bold leading-tight tracking-tight text-white">
                Hire talent. Ship work. Get paid — protected by escrow.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                Join 12,000+ freelancers and clients building on Ishbor. Identity-verified,
                milestone-protected, built for UZS and USD.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: "12k+", label: "Members" },
                  { value: "98%", label: "Success rate" },
                  { value: "24h", label: "Dispute resolution" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-xl font-bold text-white">{s.value}</div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between px-4 py-4 sm:px-8">
            <Link to="/" className="lg:hidden">
              <Logo />
            </Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {subtitle && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {children}
              {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
