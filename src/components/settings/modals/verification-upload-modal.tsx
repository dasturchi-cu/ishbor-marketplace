import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Modal } from "@/components/site/modals";
import { AuthButton } from "@/components/auth/auth-field";
import { submitVerificationDocument, approveVerificationStep } from "@/lib/verification-settings-store";

const DOC_TYPES = [
  { id: "identity", label: "Pasport yoki ID karta" },
  { id: "business", label: "Biznes guvohnomasi" },
  { id: "address", label: "Kommunal to'lov yoki manzil hujjati" },
];

export function VerificationUploadModal({
  open,
  onClose,
  userId,
  stepId,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  stepId?: string;
  onSubmitted: () => void;
}) {
  const [selected, setSelected] = useState(stepId ?? "identity");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!fileName) {
      toast.error("Hujjatni tanlang");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      submitVerificationDocument(userId, selected, fileName);
      setTimeout(() => {
        approveVerificationStep(userId, selected);
      }, 1500);
      setLoading(false);
      toast.success("Hujjat yuborildi", { description: "Ko'rib chiqish 1-2 ish kuni davom etadi." });
      onSubmitted();
      onClose();
    }, 600);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hujjat yuklash"
      description="Tasdiqlash uchun hujjatni yuklang."
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Bekor qilish
          </button>
          <AuthButton loading={loading} onClick={submit} className="flex-1">
            Yuborish
          </AuthButton>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Hujjat turi</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setFileName("passport_scan.pdf")}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 transition-default hover:border-primary/30 hover:bg-secondary/20"
        >
          <Upload className="size-8 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName || "Fayl tanlash"}</span>
          <span className="text-xs text-muted-foreground">PDF, JPG — maks. 10 MB</span>
        </button>
      </div>
    </Modal>
  );
}
