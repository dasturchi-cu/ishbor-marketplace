import { lazy, Suspense } from "react";

type ReferralQrCodeProps = {
  value: string;
  label: string;
  size?: number;
};

const ReferralQrCodeInner = lazy(() =>
  import("./referral-qr-code-inner").then((m) => ({ default: m.ReferralQrCodeInner })),
);

export function ReferralQrCode({ value, label, size = 128 }: ReferralQrCodeProps) {
  if (!value) {
    return (
      <div
        className="mx-auto rounded-xl border border-border bg-secondary/30"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div
          className="mx-auto grid place-items-center rounded-xl border border-border bg-secondary/20 text-[11px] text-muted-foreground"
          style={{ width: size + 24, height: size + 24 }}
          aria-busy="true"
          aria-label="QR kod yuklanmoqda"
        >
          …
        </div>
      }
    >
      <ReferralQrCodeInner value={value} label={label} size={size} />
    </Suspense>
  );
}
