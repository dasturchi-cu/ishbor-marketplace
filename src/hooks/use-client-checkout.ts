import { useNavigate } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import { ensureClientRoleForCheckout, buildCheckoutRedirectPath, type ClientCheckoutSearch } from "@/lib/client-checkout";

export function useClientCheckout() {
  const navigate = useNavigate();

  return (search: ClientCheckoutSearch) => {
    if (!getSession()) {
      navigate({ to: "/login", search: { redirect: buildCheckoutRedirectPath(search) } });
      return;
    }
    ensureClientRoleForCheckout();
    navigate({ to: "/checkout", search });
  };
}
