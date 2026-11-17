import type { LadderJoinMode, LadderStatus } from "./types";

export const LADDER_STATUS_LABELS: Record<LadderStatus, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  in_progress: "Live",
  completed: "Complete",
  archived: "Archived",
};

export const LADDER_JOIN_LABELS: Record<LadderJoinMode, string> = {
  open: "Open entry",
  approval: "Approval required",
  hub_members: "Hub members only",
  private: "Private",
};

export function formatLadderDate(value: string | null, includeYear = false): string {
  if (!value) return "To be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

export function formatLadderDateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt || !endsAt) return "Dates to be announced";
  return `${formatLadderDate(startsAt)} – ${formatLadderDate(endsAt, true)}`;
}

export function formatLadderMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function ladderPlayScopeLabel(value: "own_group" | "other_groups" | "anyone") {
  if (value === "own_group") return "Play within your group";
  if (value === "other_groups") return "Play other groups";
  return "Challenge anyone";
}
