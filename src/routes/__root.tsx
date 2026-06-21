import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AlertTriangle, SearchX } from "lucide-react";

import appCss from "../styles.css?url";
import { runClientAuthBootstrap } from "../lib/client-auth-bootstrap";
import { hydrateAuthFromServer } from "../hooks/use-auth";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { applyAppearancePrefs } from "../lib/appearance-apply";
import { getSession } from "../lib/auth";
import { getLocale } from "../lib/locale-store";
import { installStressSeedGlobals } from "../lib/stress-seed";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 inline-flex size-14 items-center justify-center rounded-2xl border border-border bg-primary/8 text-primary">
          <SearchX className="size-6" aria-hidden />
        </div>
        <div className="font-mono mb-3 text-[11px] uppercase tracking-[0.22em] text-primary">
          Ipak yo&apos;ldan adashdingiz
        </div>
        <h1 className="font-display text-6xl font-extrabold tracking-tight">404</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Bu sahifa savdo yo&apos;lidan chiqib ketgan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="touch-target inline-flex items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
          >
            Ishbor&apos;ga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 inline-flex size-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/8 text-destructive">
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Nimadir buzildi
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Biz hal qilmoqdamiz. Qayta urinib ko&apos;ring yoki bosh sahifaga qayting.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="touch-target rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 focus-ring"
          >
            Qayta urinish
          </button>
          <Link
            to="/"
            className="touch-target rounded-lg border border-border bg-surface px-5 text-sm font-medium transition-default hover:border-foreground/20 focus-ring"
          >
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ishbor — Markaziy Osiyoning yetakchi frilans bozori" },
      {
        name: "description",
        content:
          "Ishbor Markaziy Osiyoning eng yaxshi frilanserlarini global loyihalar bilan bog'laydi. Eskrou himoyasi, UZS yoki USD to'lov.",
      },
      { property: "og:title", content: "Ishbor — Markaziy Osiyoning yetakchi frilans bozori" },
      {
        property: "og:description",
        content: "Markaziy Osiyo bo'ylab tekshirilgan mutaxassislarni yollang. Eskrou himoyasi, shaxs tasdiqlangan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800&family=Playfair+Display:ital,wght@1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        children: `(function(){try{var t=localStorage.getItem('ishbor-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className="dark">
      <head>
        <HeadContent />
        <script src="/auth-bootstrap.js" />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Asosiy kontentga o&apos;tish
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void hydrateAuthFromServer().then(() => {
      runClientAuthBootstrap(window.location.pathname);
    });
    installStressSeedGlobals();
    const session = getSession();
    if (session?.user.id) {
      applyAppearancePrefs(session.user.id);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = getLocale() === "uz" ? "uz" : getLocale();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div id="main-content" tabIndex={-1}>
        <Outlet />
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "font-sans border border-border bg-card text-foreground shadow-lg",
            title: "font-semibold text-sm",
            description: "text-muted-foreground text-xs",
            success: "border-success/20",
            error: "border-destructive/20",
          },
        }}
        closeButton
        richColors
      />
    </QueryClientProvider>
  );
}