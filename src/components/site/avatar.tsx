// Deterministic gradient avatar with initials — no image hosting required.

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function GradientAvatar({
  name,
  hue = 30,
  size = 40,
  rounded = "rounded-full",
  className = "",
}: {
  name: string;
  hue?: number;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const bg = `radial-gradient(120% 120% at 20% 10%, oklch(0.78 0.16 ${hue}) 0%, oklch(0.55 0.18 ${
    hue + 28
  }) 55%, oklch(0.32 0.12 ${hue + 50}) 100%)`;
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white ${rounded} ${className}`}
      style={{ width: size, height: size, background: bg }}
    >
      <span
        className="font-display font-semibold tracking-tight"
        style={{ fontSize: Math.round(size * 0.36) }}
      >
        {initials(name)}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 90%, rgba(0,0,0,0.35) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}