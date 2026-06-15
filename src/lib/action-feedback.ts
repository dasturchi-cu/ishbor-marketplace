import { toast } from "sonner";

/** Consistent micro-feedback messages for user actions (Phase 31). */
export const actionFeedback = {
  saved: (label = "O'zgarishlar", description?: string) =>
    description
      ? toast.success(`${label} saqlandi`, { description })
      : toast.success(`${label} saqlandi`),

  draftSaved: (label = "Qoralama") =>
    toast.success(`${label} saqlandi`, {
      description: "Istalgan vaqtda davom etishingiz mumkin.",
    }),

  created: (label: string, description?: string) =>
    description
      ? toast.success(`${label} yaratildi`, { description })
      : toast.success(`${label} yaratildi`),

  updated: (label: string, description?: string) =>
    description
      ? toast.success(`${label} yangilandi`, { description })
      : toast.success(`${label} yangilandi`),

  deleted: (label: string) => toast.success(`${label} o'chirildi`),

  sent: (label = "Xabar") => toast.success(`${label} yuborildi`),

  published: (label: string, description?: string) =>
    description
      ? toast.success(`${label} e'lon qilindi`, { description })
      : toast.success(`${label} e'lon qilindi`),

  archived: (label: string) => toast.success(`${label} arxivlandi`),

  loaded: (label: string, description?: string) =>
    description
      ? toast.success(`${label} yuklandi`, { description })
      : toast.success(`${label} yuklandi`),

  dismissed: (label = "Bildirishnoma") => toast.success(`${label} yopildi`),

  markedAllRead: () => toast.success("Barcha bildirishnomalar o'qilgan deb belgilandi"),

  copied: () => toast.success("Nusxa olindi"),

  info: (message: string) => toast.info(message),

  error: (message: string, action?: { label: string; onClick: () => void }) =>
    action ? toast.error(message, { action }) : toast.error(message),
} as const;
