import { Heart } from "lucide-react";
import type { SavedType } from "@/lib/saved-store";
import { useSaved } from "@/hooks/use-saved";

export function SaveButton({
  type,
  id,
  className = "",
  size = "sm",
}: {
  type: SavedType;
  id: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { saved, toggle } = useSaved(type, id);
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const btnSize = size === "sm" ? "size-8" : "size-10";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex ${btnSize} items-center justify-center rounded-full transition-default focus-ring ${
        saved ? "bg-primary text-primary-foreground" : "bg-black/50 text-white hover:bg-black/65"
      } ${className}`}
      aria-label={saved ? "Saqlashni bekor qilish" : "Saqlash"}
    >
      <Heart className={`${iconSize} ${saved ? "fill-current" : ""}`} />
    </button>
  );
}

export function SaveButtonInline({
  type,
  id,
  label,
}: {
  type: SavedType;
  id: string;
  label?: string;
}) {
  const { saved, toggle } = useSaved(type, id);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-default ${
        saved ? "border-primary/30 bg-primary/5 text-primary" : "border-border hover:border-primary/20"
      }`}
    >
      <Heart className={`inline size-4 mr-1 ${saved ? "fill-primary" : ""}`} />
      {label ?? (saved ? "Saqlangan" : "Saqlash")}
    </button>
  );
}
