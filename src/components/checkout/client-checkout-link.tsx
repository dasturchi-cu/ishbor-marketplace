import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode, MouseEvent } from "react";
import { getSession } from "@/lib/auth";
import {
  buildCheckoutRedirectPath,
  ensureClientRoleForCheckout,
  type ClientCheckoutSearch,
} from "@/lib/client-checkout";

export function ClientCheckoutLink({
  search,
  className,
  children,
  onClick,
}: {
  search: ClientCheckoutSearch;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (!getSession()) {
      e.preventDefault();
      navigate({ to: "/login", search: { redirect: buildCheckoutRedirectPath(search) } });
      return;
    }
    ensureClientRoleForCheckout();
  };

  return (
    <Link to="/checkout" search={search} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
