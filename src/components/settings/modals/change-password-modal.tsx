import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/site/modals";
import { AuthField, AuthButton } from "@/components/auth/auth-field";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/auth/password-strength";
import { recordPasswordChange } from "@/lib/security-store";

export function ChangePasswordModal({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setError("");
    }
  }, [open]);

  const handleSave = () => {
    if (!current) {
      setError("Joriy parolni kiriting");
      return;
    }
    if (current.length < 6) {
      setError("Joriy parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (next.length < 8) {
      setError("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (next !== confirm) {
      setError("Parollar mos kelmadi");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const strong = getPasswordStrength(next) >= 3;
      recordPasswordChange(userId, strong);
      setLoading(false);
      toast.success("Parol muvaffaqiyatli yangilandi");
      onClose();
    }, 600);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Parolni o'zgartirish"
      description="Hisobingiz xavfsizligi uchun kuchli parol tanlang."
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium">
            Bekor qilish
          </button>
          <AuthButton loading={loading} onClick={handleSave} className="flex-1">
            Parolni yangilash
          </AuthButton>
        </>
      }
    >
      <div className="space-y-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <AuthField
          label="Joriy parol"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
        <AuthField
          label="Yangi parol"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={next} />
        <AuthField
          label="Parolni tasdiqlash"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>
    </Modal>
  );
}
