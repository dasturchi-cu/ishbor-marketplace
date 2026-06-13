import { createContext, useContext, useState, type ReactNode } from "react";

type SearchContextValue = { open: boolean; setOpen: (open: boolean) => void };

const SearchContext = createContext<SearchContextValue | null>(null);

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SearchContext.Provider value={{ open, setOpen }}>{children}</SearchContext.Provider>;
}

export function useAdminSearchState() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useAdminSearchState must be used within AdminSearchProvider");
  return ctx;
}
