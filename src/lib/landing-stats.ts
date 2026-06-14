import { freelancers, projects as mockProjects } from "./mock-data";
import { getPublishedProjects } from "./projects-store";
import { getStoredServices } from "./services-store";

export type LandingStat = {
  label: string;
  value: string;
  isLive: boolean;
};

export function getLandingStats(): LandingStat[] {
  const liveProjects = typeof window !== "undefined" ? getPublishedProjects().length : 0;
  const liveServices =
    typeof window !== "undefined"
      ? getStoredServices().filter((s) => s.status === "published").length
      : 0;
  const projectCount = liveProjects > 0 ? liveProjects : mockProjects.length;
  const talentCount = freelancers.length;

  return [
    {
      label: "Ochiq loyihalar",
      value: `${projectCount}+`,
      isLive: liveProjects > 0,
    },
    {
      label: "Tekshirilgan mutaxassislar",
      value: `${talentCount}+`,
      isLive: false,
    },
    {
      label: "Faol xizmatlar",
      value: liveServices > 0 ? `${liveServices}+` : "50+",
      isLive: liveServices > 0,
    },
    {
      label: "Eskrou himoyasi",
      value: "100%",
      isLive: true,
    },
  ];
}
