import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Modal } from "@/components/site/modals";
import { AuthField, AuthButton } from "@/components/auth/auth-field";
import { enableTwoFA } from "@/lib/security-store";

export function TwoFactorSetupModal({
  open,
  onClose,
  userId,
  alreadyEnabled,
  onEnabled,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  alreadyEnabled: boolean;
  onEnabled: () => void;
}) {
  const [step, setStep] = useState<"intro" | "scan" | "verify">("intro");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(alreadyEnabled ? "intro" : "intro");
      setCode("");
    }
  }, [open, alreadyEnabled]);

  const verify = () => {
    if (code.length !== 6) {
      toast.error("6 xonali kodni kiriting");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      enableTwoFA(userId);
      setLoading(false);
      toast.success("Ikki bosqichli autentifikatsiya yoqildi");
      onEnabled();
      onClose();
    }, 500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={alreadyEnabled ? "2FA sozlamalari" : "2FA ni yoqish"}
      description={
        alreadyEnabled
          ? "Ikki bosqichli autentifikatsiya faol."
          : "Google Authenticator yoki shunga o'xshash ilova orqali himoyalang."
      }
      footer={
        step === "verify" ? (
          <>
            <button onClick={() => setStep("scan")} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
              Orqaga
            </button>
            <AuthButton loading={loading} onClick={verify} className="flex-1">
              Tasdiqlash
            </AuthButton>
          </>
        ) : step === "scan" ? (
          <AuthButton onClick={() => setStep("verify")} className="w-full">
            Keyingi qadam
          </AuthButton>
        ) : alreadyEnabled ? (
          <button onClick={onClose} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Yopish
          </button>
        ) : (
          <AuthButton onClick={() => setStep("scan")} className="w-full">
            Sozlashni boshlash
          </AuthButton>
        )
      }
    >
      {step === "intro" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Shield className="size-8 text-primary" />
            <div className="text-sm">
              {alreadyEnabled
                ? "Hisobingiz qo'shimcha himoya bilan himoyalangan."
                : "Har kirishda telefoningizdagi 6 xonali kod talab qilinadi."}
            </div>
          </div>
        </div>
      )}
      {step === "scan" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-40 items-center justify-center rounded-xl border border-border bg-secondary/30 font-mono text-xs">
            QR KOD
            <br />
            ISHBOR-2FA
          </div>
          <p className="text-xs text-muted-foreground">
            Maxfiy kalit: <span className="font-mono text-foreground">ISHB-7X2K-9M4P</span>
          </p>
        </div>
      )}
      {step === "verify" && (
        <AuthField
          label="6 xonali kod"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
        />
      )}
    </Modal>
  );
}
