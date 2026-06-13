import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminKeyboard } from "./admin-context";
import { canAccessSection } from "@/lib/admin-roles";
import { useAdmin } from "./admin-context";
import { useAdminSearchState } from "./search-context";

const SEARCH_ITEMS = [
  { label: "Dashboard", to: "/admin", section: "dashboard" as const },
  { label: "Users", to: "/admin/users", section: "users" as const },
  { label: "Verifications", to: "/admin/verifications", section: "verifications" as const },
  { label: "Projects", to: "/admin/projects", section: "projects" as const },
  { label: "Services", to: "/admin/services", section: "services" as const },
  { label: "Orders", to: "/admin/orders", section: "orders" as const },
  { label: "Applications", to: "/admin/applications", section: "applications" as const },
  { label: "Escrow", to: "/admin/escrow", section: "escrow" as const },
  { label: "Disputes", to: "/admin/disputes", section: "disputes" as const },
  { label: "Payments", to: "/admin/payments", section: "payments" as const },
  { label: "Moderation", to: "/admin/moderation", section: "moderation" as const },
  { label: "Support", to: "/admin/support", section: "support" as const },
  { label: "Analytics", to: "/admin/analytics", section: "analytics" as const },
  { label: "Audit Logs", to: "/admin/audit", section: "audit" as const },
  { label: "System Health", to: "/admin/system", section: "system" as const },
];

export function AdminSearch() {
  const { open, setOpen } = useAdminSearchState();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { role } = useAdmin();

  useAdminKeyboard(() => setOpen(true));

  const items = SEARCH_ITEMS
    .filter((i) => canAccessSection(role, i.section))
    .filter((i) => !query || i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Admin search</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sections, users, orders…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.to}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-default hover:bg-secondary/50"
              onClick={() => {
                navigate({ to: item.to });
                setOpen(false);
                setQuery("");
              }}
            >
              {item.label}
            </button>
          ))}
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useAdminSearchOpen() {
  const { setOpen } = useAdminSearchState();
  return { onSearchOpen: () => setOpen(true) };
}
