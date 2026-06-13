import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  subscribeSaved,
  isSaved,
  toggleSaved,
  getSavedCount,
  type SavedType,
} from "@/lib/saved-store";
import { recordServiceSave } from "@/lib/analytics-utils";
import { getServiceBySlug } from "@/lib/services-store";
import { services } from "@/lib/mock-data";

export function useSaved(type: SavedType, id: string) {
  const { user } = useAuth();
  const uid = user?.id;

  const saved = useSyncExternalStore(
    subscribeSaved,
    () => (uid ? isSaved(type, id, uid) : false),
    () => false,
  );

  const toggle = () => {
    if (!uid) {
      toast.error("Saqlash uchun tizimga kiring");
      return false;
    }
    const nowSaved = toggleSaved(type, id, uid);
    if (nowSaved && type === "service") {
      const svc = getServiceBySlug(id) ?? services.find((s) => s.slug === id);
      if (svc) recordServiceSave(id, svc.sellerUsername);
    }
    const labels: Record<SavedType, string> = {
      service: "Xizmat",
      freelancer: "Frilanser",
      project: "Loyiha",
      portfolio: "Portfolio",
    };
    toast.success(nowSaved ? `${labels[type]} saqlandi` : "Saqlanganlardan olib tashlandi");
    return nowSaved;
  };

  return { saved, toggle, count: uid ? getSavedCount(type, uid) : 0 };
}
