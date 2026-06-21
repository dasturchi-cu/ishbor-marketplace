import QRCode from "react-qr-code";

type Props = {
  value: string;
  label: string;
  size?: number;
};

export function ReferralQrCodeInner({ value, label, size = 128 }: Props) {
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
