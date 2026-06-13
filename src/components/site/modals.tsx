import { useEffect, useRef, type ReactNode } from "react";
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
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} className="touch-target rounded-lg text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

const emojis = ["👍", "🙏", "✅", "🎉", "💡", "🔥", "👋", "😊", "🚀", "💰", "📎", "⭐"];

export function EmojiPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add emoji" description="Pick an emoji for your message.">
      <div className="grid grid-cols-6 gap-2">
        {emojis.map((e) => (
          <button
            key={e}
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="touch-target rounded-lg border border-border py-2 text-xl transition-default hover:border-primary/20 hover:bg-secondary/50"
          >
            {e}
          </button>
        ))}
      </div>
    </Modal>
  );
}

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
    <Modal open={open} onClose={onClose} title="Attach file" description="Select a file to share in this conversation.">
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send custom offer"
      description="Propose scope, price, and timeline. Funds are protected by escrow."
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:border-primary/20">
            Cancel
          </button>
          <button
            onClick={() => {
              onSend({ title: "Custom engagement", amount: 2500, duration: "2 weeks" });
              onClose();
            }}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Send offer
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Title</span>
          <input defaultValue="Custom engagement" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount (USD)</span>
            <input defaultValue="2500" type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" />
          </label>
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duration</span>
            <input defaultValue="2 weeks" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" />
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
  const titles = { fund: "Fund escrow", release: "Release funds", dispute: "Open dispute" };
  const descriptions = {
    fund: `Hold $${amount.toLocaleString()} in escrow for ${project}. Released only on milestone approval.`,
    release: `Release $${amount.toLocaleString()} to the freelancer for ${project}. This action cannot be undone.`,
    dispute: `Open a dispute for ${project}. Funds remain frozen until Ishbor mediation resolves the case.`,
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
            Cancel
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
            Confirm
          </button>
        </>
      }
    >
      <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        Escrow-protected · Identity-verified parties · Ishbor mediation available
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deposit funds"
      description="Add funds to your Ishbor wallet. Available for escrow and withdrawals."
      footer={
        <button
          onClick={() => {
            onConfirm(1000, "Humo •••• 4421");
            onClose();
          }}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Deposit $1,000
        </button>
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</span>
          <input defaultValue="1000" type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payment method</span>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw funds"
      description={`Available balance: $${balance.toLocaleString()}`}
      footer={
        <button
          onClick={() => {
            onConfirm(500, "Humo •••• 4421");
            onClose();
          }}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Withdraw $500
        </button>
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</span>
          <input defaultValue="500" type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Destination</span>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
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
