import type { LadderJoinMode, LadderStatus, LadderSummary } from "./types";

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

/** "No wait", "12 hours", "3 days" or "1 day 6 hours". */
export function formatRematchWait(hours: number) {
  if (!hours) return "No wait";
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const parts = [days ? `${days} ${days === 1 ? "day" : "days"}` : "", rest ? `${rest} ${rest === 1 ? "hour" : "hours"}` : ""];
  return parts.filter(Boolean).join(" ");
}

export function ladderPlayScopeLabel(value: "own_group" | "other_groups" | "anyone") {
  if (value === "own_group") return "Play within your group";
  if (value === "other_groups") return "Play other groups";
  return "Challenge anyone";
}

export type LadderCardAction = {
  label: string;
  state: "setup" | "manage" | "registered" | "pending" | "invited" | "register" | "view";
  href: string;
};

/** The list card's call to action, from the viewer's place in the ladder. */
export function ladderCardAction(ladder: LadderSummary): LadderCardAction {
  const href = `/ladders/${ladder.id}`;
  if (ladder.status === "draft") return { label: "Continue setup", state: "setup", href: `${href}/edit` };
  if (ladder.viewer?.isOrganizer) return { label: "Manage", state: "manage", href: `${href}?tab=manage` };
  switch (ladder.viewer?.entryStatus) {
    case "active":
    case "inactive":
    case "finished":
      return { label: "Registered", state: "registered", href };
    case "pending_approval":
      return { label: "Awaiting approval", state: "pending", href };
    case "invited":
      return { label: "Invited", state: "invited", href };
  }
  const running = ladder.status === "upcoming" || ladder.status === "in_progress";
  const full = ladder.maxParticipants !== null && ladder.participantCount >= ladder.maxParticipants;
  if (running && ladder.joinMode !== "private" && !full) return { label: "Register", state: "register", href };
  if (ladder.status === "completed" || ladder.status === "archived") {
    return { label: "Final table", state: "view", href };
  }
  return { label: "View ladder", state: "view", href };
}

