import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        className="liquid-glass-overlay absolute inset-0"
        onClick={onClose}
        aria-label="Modalni yopish"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className="liquid-glass-panel relative z-10 w-full max-w-md rounded-t-2xl p-5 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} className="touch-target rounded-lg text-muted-foreground hover:text-foreground" aria-label="Yopish">
            <X className="size-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export { EmojiPickerModal } from "@/components/messages/emoji-picker";

export function FileAttachModal({
  open,
  onClose,
  onAttach,
}: {
  open: boolean;
  onClose: () => void;
  onAttach: (file: { name: string; size: string; kind: "pdf" | "image" }) => void;
}) {
  const samples = [
    { name: "Brief_v2.pdf", size: "1.8 MB", kind: "pdf" as const },
    { name: "Wireframes.fig", size: "4.2 MB", kind: "pdf" as const },
    { name: "Reference_mockup.png", size: "820 KB", kind: "image" as const },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Fayl biriktirish" description="Suhbatda ulashish uchun fayl tanlang.">
      <div className="space-y-2">
        {samples.map((f) => (
          <button
            key={f.name}
            onClick={() => {
              onAttach(f);
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-default hover:border-primary/20 hover:bg-secondary/30"
          >
            <span className="text-sm font-medium">{f.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{f.size}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function SendOfferModal({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (offer: { title: string; amount: number; duration: string }) => void;
}) {
  const [title, setTitle] = useState("Maxsus loyiha");
  const [amount, setAmount] = useState("2500");
  const [duration, setDuration] = useState("2 hafta");

  useEffect(() => {
    if (open) {
      setTitle("Maxsus loyiha");
      setAmount("2500");
      setDuration("2 hafta");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Maxsus taklif yuborish"
      description="Hajm, narx va muddatni taklif qiling. Mablag'lar eskrou himoyasida."
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:border-primary/20">
            Bekor qilish
          </button>
          <button
            onClick={() => {
              onSend({ title, amount: Number(amount) || 0, duration });
              onClose();
            }}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Taklif yuborish
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sarlavha</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summa (USD)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" />
          </label>
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Muddat</span>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" />
          </label>
        </div>
      </div>
    </Modal>
  );
}

export function EscrowActionModal({
  open,
  onClose,
  mode,
  amount,
  project,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  mode: "fund" | "release" | "dispute";
  amount: number;
  project: string;
  onConfirm: () => void;
}) {
  const titles = { fund: "Eskrou to'ldirish", release: "Mablag'larni chiqarish", dispute: "Nizoni ochish" };
  const descriptions = {
    fund: `${project} uchun $${amount.toLocaleString()} eskrouda ushlab turiladi. Faqat bosqich tasdiqlanganda chiqariladi.`,
    release: `${project} uchun frilanserga $${amount.toLocaleString()} chiqariladi. Bu amalni ortga qaytarib bo'lmaydi.`,
    dispute: `${project} bo'yicha nizo ochiladi. Ishbor vositachiligi hal qilgunga qadar mablag'lar muzlatiladi.`,
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titles[mode]}
      description={descriptions[mode]}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Bekor qilish
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-primary-foreground ${
              mode === "dispute" ? "bg-destructive hover:opacity-90" : "bg-primary hover:opacity-90"
            }`}
          >
            Tasdiqlash
          </button>
        </>
      }
    >
      <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        Eskrou himoyasi · Shaxs tasdiqlangan tomonlar · Ishbor vositachiligi mavjud
      </div>
    </Modal>
  );
}

export function DepositModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
}) {
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState("Humo •••• 4421");

  useEffect(() => {
    if (open) {
      setAmount("1000");
      setMethod("Humo •••• 4421");
    }
  }, [open]);

  const parsed = Number(amount) || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mablag' kiritish"
      description="Ishbor hamyoniga mablag' qo'shing. Eskrou va yechib olish uchun mavjud."
      footer={
        <button
          onClick={() => {
            onConfirm(parsed, method);
            onClose();
          }}
          disabled={parsed <= 0}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          ${parsed.toLocaleString()} kiritish
        </button>
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summa</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">To'lov usuli</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option>Humo •••• 4421</option>
            <option>Uzcard •••• 8829</option>
            <option>Visa •••• 1044</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}

export function WithdrawModal({
  open,
  onClose,
  onConfirm,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
  balance: number;
}) {
  const [amount, setAmount] = useState("500");
  const [method, setMethod] = useState("Humo •••• 4421");

  useEffect(() => {
    if (open) {
      setAmount("500");
      setMethod("Humo •••• 4421");
    }
  }, [open]);

  const parsed = Math.min(Number(amount) || 0, balance);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mablag' yechib olish"
      description={`Mavjud balans: $${balance.toLocaleString()}`}
      footer={
        <button
          onClick={() => {
            onConfirm(parsed, method);
            onClose();
          }}
          disabled={parsed <= 0}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          ${parsed.toLocaleString()} yechib olish
        </button>
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summa</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" max={balance} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Manzil</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option>Humo •••• 4421</option>
            <option>Uzcard •••• 8829</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}

export function ReleaseFundsModal({
  open,
  onClose,
  amount,
  milestone,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  milestone: string;
  onConfirm: () => void;
}) {
  return (
    <EscrowActionModal
      open={open}
      onClose={onClose}
      mode="release"
      amount={amount}
      project={milestone}
      onConfirm={onConfirm}
    />
  );
}
