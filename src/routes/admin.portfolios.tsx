import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore, useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminDataTable, StatusBadge } from "@/components/admin/data-table";
import { useAdminActionDialog } from "@/components/admin/actions";
import { useAdminSearchOpen } from "@/components/admin/search";
import { GradientAvatar } from "@/components/site/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  getAllPortfolios,
  subscribePortfolios,
  updatePortfolioAdminStatus,
  deletePortfolioAdmin,
} from "@/lib/portfolio-store";
import type { PortfolioItem } from "@/lib/portfolio-types";
import { performAdminAction } from "@/lib/admin-store";
import { useAdmin } from "@/components/admin/admin-context";

export const Route = createFileRoute("/admin/portfolios")({
  head: () => ({ meta: [{ title: "Portfolio moderatsiyasi — Ishbor Admin" }] }),
  component: AdminPortfoliosPage,
});

const EMPTY: PortfolioItem[] = [];

function AdminPortfoliosPage() {
  const { onSearchOpen } = useAdminSearchOpen();
  const { dialog, confirm } = useAdminActionDialog();
  const { adminName } = useAdmin();
  const [tab, setTab] = useState("all");
  const items = useSyncExternalStore(subscribePortfolios, getAllPortfolios, () => EMPTY);

  const filtered =
    tab === "all"
      ? items
      : tab === "pending"
        ? items.filter((p) => p.adminStatus === "pending")
        : tab === "approved"
          ? items.filter((p) => p.adminStatus === "approved" || p.adminStatus === "featured")
          : items.filter((p) => p.adminStatus === "rejected");

  const runAction = (
    title: string,
    description: string,
    action: string,
    target: string,
    onExecute: () => void,
    variant?: "destructive",
    confirmLabel?: string,
  ) => {
    confirm({
      title,
      description,
      action,
      target,
      category: "moderation",
      variant,
      confirmLabel,
      onConfirm: () => {
        performAdminAction({
          action,
          target,
          who: adminName,
          category: "moderation",
          onExecute,
        });
      },
    });
  };

  return (
    <AdminShell eyebrow="Portfolio moderatsiyasi" title="Portfoliolar" onSearchOpen={onSearchOpen}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Barchasi ({items.length})</TabsTrigger>
          <TabsTrigger value="pending">Kutilmoqda ({items.filter((p) => p.adminStatus === "pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Tasdiqlangan ({items.filter((p) => p.adminStatus === "approved" || p.adminStatus === "featured").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rad etilgan ({items.filter((p) => p.adminStatus === "rejected").length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <AdminDataTable
            data={filtered}
            columns={[
              {
                key: "title",
                header: "Loyiha",
                cell: (p) => (
                  <div>
                    <Link to="/portfolio/$slug" params={{ slug: p.slug }} className="text-sm font-medium hover:text-primary">
                      {p.title}
                    </Link>
                    <div className="font-mono text-[10px] text-muted-foreground">{p.category}</div>
                  </div>
                ),
              },
              {
                key: "freelancer",
                header: "Frilanser",
                cell: (p) => (
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={p.freelancerName} hue={p.freelancerHue} size={24} />
                    <span className="text-sm">{p.freelancerName}</span>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Holat",
                cell: (p) => <StatusBadge status={p.adminStatus} />,
              },
              {
                key: "portfolioStatus",
                header: "Ko'rinish",
                cell: (p) => <StatusBadge status={p.status} />,
              },
              {
                key: "featured",
                header: "Ajratilgan",
                cell: (p) => (p.featured ? "Ha" : "—"),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (p) => (
                  <div className="flex flex-wrap justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {p.adminStatus === "pending" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          runAction("Portfolioni tasdiqlash", `"${p.title}" tasdiqlansinmi?`, `Portfolio tasdiqlandi: ${p.title}`, p.id, () =>
                            updatePortfolioAdminStatus(p.slug, "approved"),
                          )
                        }
                      >
                        Tasdiqlash
                      </Button>
                    )}
                    {(p.adminStatus === "approved" || p.adminStatus === "featured") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction("Portfolioni ajratib ko'rsatish", `"${p.title}" bozorda ajratib ko'rsatilsinmi?`, `Portfolio ajratildi: ${p.title}`, p.id, () =>
                            updatePortfolioAdminStatus(p.slug, "featured", true),
                          )
                        }
                      >
                        Ajratish
                      </Button>
                    )}
                    {p.adminStatus !== "hidden" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction("Portfolioni yashirish", `"${p.title}" ommaviy ko'rinishdan yashirilsinmi?`, `Portfolio yashirildi: ${p.title}`, p.id, () =>
                            updatePortfolioAdminStatus(p.slug, "hidden"),
                          )
                        }
                      >
                        Yashirish
                      </Button>
                    )}
                    {p.adminStatus !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction("Portfolioni rad etish", `"${p.title}" rad etilsinmi?`, `Portfolio rad etildi: ${p.title}`, p.id, () =>
                            updatePortfolioAdminStatus(p.slug, "rejected"),
                          )
                        }
                      >
                        Rad etish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        runAction(
                          "Portfolioni o'chirish",
                          `"${p.title}" butunlay o'chirilsinmi?`,
                          `Portfolio o'chirildi: ${p.title}`,
                          p.id,
                          () => deletePortfolioAdmin(p.slug),
                          "destructive",
                          "O'chirish",
                        )
                      }
                    >
                      O'chirish
                    </Button>
                  </div>
                ),
              },
            ]}
            searchFilter={(p, q) =>
              p.title.toLowerCase().includes(q) ||
              p.freelancerName.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q)
            }
            bulkActions={(rows) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  runAction(
                    "Ommaviy tasdiqlash",
                    `${rows.length} ta portfolio tasdiqlansinmi?`,
                    `Ommaviy tasdiqlandi: ${rows.length} ta portfolio`,
                    "bulk",
                    () => rows.forEach((p) => updatePortfolioAdminStatus(p.slug, "approved")),
                  )
                }
              >
                Tasdiqlash ({rows.length})
              </Button>
            )}
          />
        </TabsContent>
      </Tabs>
      {dialog}
    </AdminShell>
  );
}
