import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminSearchOpen } from "@/components/admin/search";
import { getAuditLog, subscribeAudit, type AuditEntry } from "@/lib/admin-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit jurnallari — Ishbor Admin" }] }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const [logs, setLogs] = useState<AuditEntry[]>(getAuditLog());
  const [category, setCategory] = useState("all");

  useEffect(() => subscribeAudit(() => setLogs(getAuditLog())), []);

  const filtered = category === "all" ? logs : logs.filter((l) => l.category === category);

  return (
    <AdminShell eyebrow="Audit jurnallari" title="Audit izi" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={filtered}
        columns={[
          { key: "who", header: "Kim", cell: (l) => <span className="text-sm font-medium">{l.who}</span> },
          { key: "what", header: "Nima", cell: (l) => l.what },
          { key: "category", header: "Kategoriya", cell: (l) => <StatusBadge status={l.category} /> },
          { key: "target", header: "Maqsad", cell: (l) => <span className="font-mono text-xs">{l.target ?? "—"}</span> },
          { key: "when", header: "Qachon", cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.when}</span> },
        ]}
        searchFilter={(l, q) => l.who.toLowerCase().includes(q) || l.what.toLowerCase().includes(q)}
        filters={
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              <SelectItem value="user">Foydalanuvchi harakatlari</SelectItem>
              <SelectItem value="admin">Admin harakatlari</SelectItem>
              <SelectItem value="escrow">Eskrou harakatlari</SelectItem>
              <SelectItem value="payment">To'lov harakatlari</SelectItem>
              <SelectItem value="moderation">Moderatsiya</SelectItem>
              <SelectItem value="system">Tizim</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </AdminShell>
  );
}
