export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[1.35rem] font-extrabold leading-none tracking-[-0.04em] ${className}`}
    >
      ishbor
    </span>
  );
}