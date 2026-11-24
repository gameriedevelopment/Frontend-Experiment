import type { IconName } from "@/components/ui/Icon";
import type { QueueLaneKey } from "./types";

export interface LaneMeta {
  key: QueueLaneKey;
  label: string;
  description: string;
  icon: IconName;
  to: string;
  /** Hours before an item counts as overdue. */
  dueHours: number;
}

export const LANES: LaneMeta[] = [
  { key: "reports", label: "Reports", description: "Posts, comments, players and teams reported by the community", icon: "flag", to: "/reports", dueHours: 24 },
  { key: "tournamentReports", label: "Tournament reports", description: "Match results players dispute inside hosted tournaments", icon: "trophy", to: "/disputes?source=tournaments", dueHours: 12 },
  { key: "ladderDisputes", label: "Ladder disputes", description: "Ladder results one side reported as wrong", icon: "ladders", to: "/disputes?source=ladders", dueHours: 24 },
  { key: "leagueDisputes", label: "League disputes", description: "League fixtures waiting on a Gamerie decision", icon: "leagues", to: "/disputes?source=leagues", dueHours: 24 },
];

/** How long the oldest item has waited, in words, and whether it is past due. */
export function waited(oldestAt: string | null, dueHours: number, now = Date.now()) {
  if (!oldestAt) return null;
  const hours = Math.max(0, (now - new Date(oldestAt).getTime()) / 3_600_000);
  const label = hours < 1 ? `${Math.max(1, Math.round(hours * 60))}m` : hours < 48 ? `${Math.round(hours)}h` : `${Math.round(hours / 24)}d`;
  return { label, overdue: hours >= dueHours };
}
