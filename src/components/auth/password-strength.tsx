import { cn } from "@/lib/utils";

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score) as PasswordStrength;
}

const labels = ["", "Zaif", "O'rtacha", "Yaxshi", "Kuchli"];

const colors = [
  "bg-secondary",
  "bg-destructive",
  "bg-warning",
  "bg-primary/60",
  "bg-primary",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-default",
              i < strength ? colors[strength] : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        Parol mustahkamligi: <span className="text-foreground">{labels[strength]}</span>
      </p>
    </div>
  );
}
