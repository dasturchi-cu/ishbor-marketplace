import QRCode from "react-qr-code";

type ReferralQrCodeProps = {
  value: string;
  label: string;
  size?: number;
};

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
    <div className="mx-auto w-fit rounded-xl border border-border bg-white p-3 shadow-sm">
      <QRCode
        value={value}
        size={size}
        level="M"
        bgColor="#FFFFFF"
        fgColor="#0B1220"
        aria-label={label}
        title={label}
      />
    </div>
  );
}
