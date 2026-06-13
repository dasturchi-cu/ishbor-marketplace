import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminSearchOpen } from "@/components/admin/search";
import { getAuditLog, subscribeAudit, type AuditEntry } from "@/lib/admin-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — Ishbor Admin" }] }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const [logs, setLogs] = useState<AuditEntry[]>(getAuditLog());
  const [category, setCategory] = useState("all");

  useEffect(() => subscribeAudit(() => setLogs(getAuditLog())), []);

  const filtered = category === "all" ? logs : logs.filter((l) => l.category === category);

  return (
    <AdminShell eyebrow="Audit Logs" title="Audit Trail" onSearchOpen={onSearchOpen}>
      <AdminDataTable
        data={filtered}
        columns={[
          { key: "who", header: "Who", cell: (l) => <span className="text-sm font-medium">{l.who}</span> },
          { key: "what", header: "What", cell: (l) => l.what },
          { key: "category", header: "Category", cell: (l) => <StatusBadge status={l.category} /> },
          { key: "target", header: "Target", cell: (l) => <span className="font-mono text-xs">{l.target ?? "—"}</span> },
          { key: "when", header: "When", cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.when}</span> },
        ]}
        searchFilter={(l, q) => l.who.toLowerCase().includes(q) || l.what.toLowerCase().includes(q)}
        filters={
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="user">User actions</SelectItem>
              <SelectItem value="admin">Admin actions</SelectItem>
              <SelectItem value="escrow">Escrow actions</SelectItem>
              <SelectItem value="payment">Payment actions</SelectItem>
              <SelectItem value="moderation">Moderation</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </AdminShell>
  );
}
