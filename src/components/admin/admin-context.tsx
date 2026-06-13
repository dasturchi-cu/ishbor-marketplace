import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminRole } from "@/lib/admin-roles";

type AdminContextValue = {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
  adminName: string;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AdminRole>("super_admin");
  return (
    <AdminContext.Provider value={{ role, setRole, adminName: "Sardor Mirkomilov" }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function useAdminKeyboard(onSearch: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearch();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onSearch]);
}
