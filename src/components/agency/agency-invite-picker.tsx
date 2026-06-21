import { useMemo, useState } from "react";
import { Search, UserPlus, Check } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import { searchPlatformUsers, type PlatformUser } from "@/lib/user-directory";
import { agencyRoleLabels, type AgencyRole } from "@/lib/agency-types";

const userTypeLabels: Record<PlatformUser["userType"], string> = {
  client: "Mijoz",
  freelancer: "Frilanser",
};

type AgencyInvitePickerProps = {
  excludeEmails: string[];
  freelancerOnly?: boolean;
  onInvite: (user: PlatformUser, role: AgencyRole) => void;
};

export function AgencyInvitePicker({ excludeEmails, freelancerOnly = false, onInvite }: AgencyInvitePickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [role, setRole] = useState<AgencyRole>("freelancer");

  const users = useMemo(
    () =>
      searchPlatformUsers(query, {
        excludeEmails,
        userType: freelancerOnly ? "freelancer" : undefined,
      }),
    [query, excludeEmails, freelancerOnly],
  );

  const handleInvite = () => {
    if (!selected) return;
    onInvite(selected, freelancerOnly ? "freelancer" : role);
    setSelected(null);
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, email yoki username bo'yicha qidiring..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-secondary/10 p-2">
        {users.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Foydalanuvchi topilmadi. Boshqa qidiruv so&apos;zini kiriting.
          </p>
        ) : (
          users.map((user) => {
            const active = selected?.email === user.email;
            return (
              <button
                key={user.email}
                type="button"
                onClick={() => setSelected(user)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-default ${
                  active
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent bg-card hover:border-border"
                }`}
              >
                <GradientAvatar name={user.fullName} hue={user.avatarHue} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{user.fullName}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {userTypeLabels[user.userType]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  {user.subtitle && (
                    <p className="truncate text-[11px] text-muted-foreground/80">{user.subtitle}</p>
                  )}
                </div>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {!freelancerOnly && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AgencyRole)}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm sm:flex-1"
          >
            {(["manager", "recruiter", "freelancer"] as const).map((item) => (
              <option key={item} value={item}>
                {agencyRoleLabels[item]}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={handleInvite}
          disabled={!selected}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          <UserPlus className="size-4" />
          {selected ? `${selected.fullName.split(" ")[0]} ni taklif qilish` : "Foydalanuvchini tanlang"}
        </button>
      </div>
    </div>
  );
}
