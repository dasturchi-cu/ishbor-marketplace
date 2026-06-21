import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User, LayoutDashboard, ChevronDown, Shield } from "lucide-react";
import { GradientAvatar } from "./avatar";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { getActiveDashboardPath } from "@/lib/active-role-store";
import type { AuthUser } from "@/lib/auth";

export function UserMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { activeRole } = useActiveRole();
  const dashboardPath = getActiveDashboardPath(activeRole);

  const profileTo =
    activeRole === "freelancer" && user.username
      ? { to: "/freelancers/$username" as const, params: { username: user.username } }
      : user.companySlug
        ? { to: "/clients/$company" as const, params: { company: user.companySlug } }
        : { to: "/profile" as const, params: undefined };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "premium-press flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/50";

  return (
    <div ref={ref} className="relative ml-0.5 hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-target liquid-glass-chip inline-flex items-center gap-1.5 rounded-lg pl-1 pr-2 transition-default focus-ring"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Foydalanuvchi menyusi"
      >
        <GradientAvatar name={user.fullName} hue={user.avatarHue} size={32} />
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="liquid-glass-panel absolute right-0 top-[calc(100%+0.5rem)] z-[120] w-56 overflow-hidden rounded-xl p-1.5"
        >
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              to={profileTo.to}
              {...(profileTo.params ? { params: profileTo.params } : {})}
              onClick={() => setOpen(false)}
              className={itemClass}
              role="menuitem"
            >
              <User className="size-4 text-muted-foreground" /> Profil
            </Link>
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className={itemClass}
              role="menuitem"
            >
              <LayoutDashboard className="size-4 text-muted-foreground" /> Boshqaruv paneli
            </Link>
            {user.isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className={itemClass}
                role="menuitem"
              >
                <Shield className="size-4 text-muted-foreground" /> Admin konsoli
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: "/admin", switch: "1" }}
                onClick={() => setOpen(false)}
                className={itemClass}
                role="menuitem"
              >
                <Shield className="size-4 text-muted-foreground" /> Admin kirish
              </Link>
            )}
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className={itemClass}
              role="menuitem"
            >
              <Settings className="size-4 text-muted-foreground" /> Sozlamalar
            </Link>
          </div>
          <div className="border-t border-border/60 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logout();
                setOpen(false);
                navigate({ to: "/" });
              }}
              className={`${itemClass} text-destructive hover:bg-destructive/5`}
            >
              <LogOut className="size-4" /> Chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
