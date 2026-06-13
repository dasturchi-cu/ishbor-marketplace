import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Banknote, Trash2 } from "lucide-react";
import { Modal } from "@/components/site/modals";
import { AuthField, AuthButton } from "@/components/auth/auth-field";
import {
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  type StoredPaymentMethod,
  type PaymentMethodType,
  type AddPaymentMethodInput,
} from "@/lib/payment-methods-store";

const TYPE_OPTIONS: { key: PaymentMethodType; label: string }[] = [
  { key: "humo", label: "Humo" },
  { key: "uzcard", label: "Uzcard" },
  { key: "visa", label: "Visa" },
];

function CardIcon({ type }: { type: PaymentMethodType }) {
  const Icon = type === "visa" ? CreditCard : Banknote;
  return <Icon className="size-4" />;
}

export function AddPaymentMethodModal({
  open,
  onClose,
  userId,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdded: () => void;
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<PaymentMethodType>("humo");
  const [cardNumber, setCardNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setType("humo");
      setCardNumber("");
      setNickname("");
      setExpiryMonth("");
      setExpiryYear("");
      setBillingAddress("");
    }
  }, [open]);

  const submit = () => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 16) {
      toast.error("Karta raqamini to'liq kiriting");
      return;
    }
    if (!expiryMonth || !expiryYear) {
      toast.error("Amal qilish muddatini kiriting");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const input: AddPaymentMethodInput = {
        type,
        cardNumber: digits,
        nickname: nickname || undefined,
        expiryMonth,
        expiryYear,
        billingAddress: billingAddress || undefined,
      };
      addPaymentMethod(userId, input);
      setLoading(false);
      toast.success("To'lov usuli qo'shildi", { description: "24 soat ichida tasdiqlanadi." });
      onAdded();
      onClose();
    }, 500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="To'lov usulini qo'shish"
      description={`Qadam ${step}/2`}
      footer={
        step === 1 ? (
          <AuthButton onClick={() => setStep(2)} className="w-full">
            Keyingi
          </AuthButton>
        ) : (
          <>
            <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
              Orqaga
            </button>
            <AuthButton loading={loading} onClick={submit} className="flex-1">
              Qo'shish
            </AuthButton>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`touch-target flex flex-col items-center gap-2 rounded-xl border p-3 text-sm transition-default ${
                type === t.key ? "border-primary bg-primary/8 text-primary" : "border-border hover:border-primary/20"
              }`}
            >
              <CardIcon type={t.key} />
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <AuthField
            label="Karta raqami"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="8600 0000 0000 0000"
          />
          <AuthField label="Taxallus (ixtiyoriy)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <AuthField label="Oy" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} placeholder="MM" />
            <AuthField label="Yil" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} placeholder="YY" />
          </div>
          <AuthField label="Hisob-kitob manzili" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}

export function EditPaymentMethodModal({
  open,
  onClose,
  userId,
  method,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  method: StoredPaymentMethod | null;
  onUpdated: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && method) {
      setNickname(method.nickname ?? "");
      setExpiryMonth(method.expiryMonth ?? "");
      setExpiryYear(method.expiryYear ?? "");
      setBillingAddress(method.billingAddress ?? "");
    }
  }, [open, method]);

  if (!method) return null;

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      updatePaymentMethod(userId, method.id, { nickname, expiryMonth, expiryYear, billingAddress });
      setLoading(false);
      toast.success("To'lov usuli yangilandi");
      onUpdated();
      onClose();
    }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="To'lov usulini tahrirlash"
      description={`${method.label} ···· ${method.last4}`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Bekor qilish
          </button>
          <AuthButton loading={loading} onClick={save} className="flex-1">
            Saqlash
          </AuthButton>
        </>
      }
    >
      <div className="space-y-3">
        <AuthField label="Taxallus" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <AuthField label="Oy" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} />
          <AuthField label="Yil" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} />
        </div>
        <AuthField label="Hisob-kitob manzili" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
      </div>
    </Modal>
  );
}

export function PaymentDetailModal({
  open,
  onClose,
  method,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  open: boolean;
  onClose: () => void;
  method: StoredPaymentMethod | null;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  if (!method) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={method.nickname ?? method.label}
      description={`${method.label} ···· ${method.last4}`}
      footer={
        <div className="flex w-full flex-wrap gap-2">
          {!method.default && (
            <button onClick={onSetDefault} className="flex-1 rounded-lg border border-primary/30 py-2.5 text-sm font-medium text-primary">
              Asosiy qilish
            </button>
          )}
          <button onClick={onEdit} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Tahrirlash
          </button>
          <button onClick={onDelete} className="flex items-center justify-center gap-1 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm text-destructive">
            <Trash2 className="size-4" />
          </button>
        </div>
      }
    >
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Turi</dt>
          <dd className="font-medium">{method.label}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Oxirgi 4 raqam</dt>
          <dd className="font-mono">{method.last4}</dd>
        </div>
        {method.expiryMonth && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Amal qilish</dt>
            <dd>{method.expiryMonth}/{method.expiryYear}</dd>
          </div>
        )}
        {method.billingAddress && (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Manzil</dt>
            <dd className="text-right">{method.billingAddress}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Holat</dt>
          <dd className={method.default ? "text-primary font-medium" : ""}>{method.default ? "Asosiy" : "Tasdiqlangan"}</dd>
        </div>
      </dl>
    </Modal>
  );
}

export function DeletePaymentMethodModal({
  open,
  onClose,
  userId,
  method,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  method: StoredPaymentMethod | null;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!method) return null;

  const confirm = () => {
    setLoading(true);
    setTimeout(() => {
      deletePaymentMethod(userId, method.id);
      setLoading(false);
      toast.success("To'lov usuli o'chirildi");
      onDeleted();
      onClose();
    }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="To'lov usulini o'chirish"
      description={`${method.label} ···· ${method.last4} ni o'chirmoqchimisiz?`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Bekor qilish
          </button>
          <AuthButton loading={loading} onClick={confirm} className="flex-1 !bg-destructive">
            O'chirish
          </AuthButton>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">Bu amalni ortga qaytarib bo'lmaydi.</p>
    </Modal>
  );
}

export function setDefaultAndNotify(userId: string, id: string) {
  setDefaultPaymentMethod(userId, id);
  toast.success("Asosiy to'lov usuli yangilandi");
}
