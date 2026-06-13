import { useState, useSyncExternalStore, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, Banknote, Plus, Wallet } from "lucide-react";
import { EmptyState } from "@/components/site/feedback";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import {
  AddPaymentMethodModal,
  EditPaymentMethodModal,
  PaymentDetailModal,
  DeletePaymentMethodModal,
  setDefaultAndNotify,
} from "@/components/settings/modals/payment-modals";
import {
  subscribePaymentMethods,
  getPaymentMethods,
  type StoredPaymentMethod,
} from "@/lib/payment-methods-store";

function CardIcon({ type }: { type: StoredPaymentMethod["type"] }) {
  const Icon = type === "visa" ? CreditCard : Banknote;
  return <Icon className="size-4" />;
}

export function PaymentMethodsTab({
  userId,
  openAddOnMount,
  onAddOpened,
}: {
  userId: string;
  openAddOnMount?: boolean;
  onAddOpened?: () => void;
}) {
  const methods = useSyncExternalStore(
    subscribePaymentMethods,
    () => getPaymentMethods(userId),
    () => getPaymentMethods(userId),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<StoredPaymentMethod | null>(null);
  const [detailMethod, setDetailMethod] = useState<StoredPaymentMethod | null>(null);
  const [deleteMethod, setDeleteMethod] = useState<StoredPaymentMethod | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (openAddOnMount) {
      setAddOpen(true);
      onAddOpened?.();
    }
  }, [openAddOnMount, onAddOpened]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <>
      <SettingsTabLayout
        title="To'lov usullari"
        description="Kartalar va hisob-kitob ma'lumotlari"
        stats={
          <SettingsStatRow>
            <SettingsStatCard label="Jami kartalar" value={methods.length} accent />
            <SettingsStatCard label="Asosiy" value={methods.find((m) => m.default)?.label ?? "—"} />
            <SettingsStatCard label="Hamyon" value="Boshqarish" hint="Tranzaksiyalar" />
          </SettingsStatRow>
        }
        sidebar={
          <Link
            to="/wallet"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-default hover:border-primary/20"
          >
            <Wallet className="size-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Hamyon</div>
              <div className="text-xs text-muted-foreground">To'lov tarixi va balans</div>
            </div>
          </Link>
        }
      >
        {methods.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="To'lov usuli yo'q"
            description="Eskrou va buyurtmalar uchun karta qo'shing."
            action={
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" /> Karta qo'shish
              </button>
            }
          />
        ) : (
          <>
            <SettingsSection title="Saqlangan kartalar">
              <ul className="space-y-2">
                {methods.map((pm) => (
                  <li key={pm.id}>
                    <button
                      onClick={() => setDetailMethod(pm)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-default hover:border-primary/20 ${
                        pm.default ? "border-primary/30 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className={`inline-flex size-9 items-center justify-center rounded-lg ${pm.default ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        <CardIcon type={pm.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">
                          {pm.nickname ? `${pm.nickname} · ` : ""}{pm.label} ···· {pm.last4}
                        </div>
                        <div className="text-xs text-muted-foreground">{pm.default ? "Asosiy karta" : "Tasdiqlangan"}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </SettingsSection>
            <button
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              <Plus className="size-4" /> To'lov usulini qo'shish
            </button>
          </>
        )}
      </SettingsTabLayout>

      <AddPaymentMethodModal open={addOpen} onClose={() => setAddOpen(false)} userId={userId} onAdded={refresh} />
      <EditPaymentMethodModal
        open={!!editMethod}
        onClose={() => setEditMethod(null)}
        userId={userId}
        method={editMethod}
        onUpdated={refresh}
      />
      <PaymentDetailModal
        open={!!detailMethod}
        onClose={() => setDetailMethod(null)}
        method={detailMethod}
        onEdit={() => { setEditMethod(detailMethod); setDetailMethod(null); }}
        onDelete={() => { setDeleteMethod(detailMethod); setDetailMethod(null); }}
        onSetDefault={() => { if (detailMethod) { setDefaultAndNotify(userId, detailMethod.id); refresh(); setDetailMethod(null); } }}
      />
      <DeletePaymentMethodModal
        open={!!deleteMethod}
        onClose={() => setDeleteMethod(null)}
        userId={userId}
        method={deleteMethod}
        onDeleted={refresh}
      />
    </>
  );
}
