import type { IconName } from "@/components/ui/Icon";
import type { CompetitionKind } from "@/features/competitions/types";

/** How each competition type shows on the desk, and its target time in hours. */
export const SOURCE: Record<CompetitionKind, { label: string; plural: string; icon: IconName; dueHours: number }> = {
  tournament: { label: "Tournament", plural: "tournaments", icon: "trophy", dueHours: 12 },
  ladder: { label: "Ladder", plural: "ladders", icon: "ladders", dueHours: 24 },
  league: { label: "League", plural: "leagues", icon: "leagues", dueHours: 24 },
};
