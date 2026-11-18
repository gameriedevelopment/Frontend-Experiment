import type {
  LeagueFixture,
  LeagueJoinMode,
  LeaguePlayScope,
  LeaguePlayoffFormat,
  LeagueSeasonStatus,
  LeagueSummary,
  LeagueTiebreaker,
} from "./types";

export const LEAGUE_SEASON_LABELS: Record<LeagueSeasonStatus, string> = {
  draft: "Draft",
  registration: "Registration",
  in_progress: "Live",
  playoffs: "Playoffs",
  completed: "Complete",
  cancelled: "Cancelled",
};

export const LEAGUE_JOIN_LABELS: Record<LeagueJoinMode, string> = {
  open: "Open entry",
  approval: "Approval required",
  hub_members: "Hub members only",
  private: "Invite only",
};

export const LEAGUE_TIEBREAKER_LABELS: Record<LeagueTiebreaker, string> = {
  head_to_head: "Head-to-head",
  game_difference: "Game difference",
  games_won: "Games won",
  wins: "Wins",
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function leaguePlayScopeLabel(value: LeaguePlayScope) {
  if (value === "own_group") return "Play within your group";
  if (value === "other_groups") return "Play the other groups";
  return "Everyone plays everyone";
}

export function leaguePlayoffLabel(playoffs: { size: number; format: LeaguePlayoffFormat | null } | null) {
  if (!playoffs) return "No playoffs";
  return `Top ${playoffs.size} · ${playoffs.format === "double_elimination" ? "double elimination" : "single elimination"}`;
}

export function formatLeagueDate(value: string | null, includeYear = false): string {
  if (!value) return "To be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", ...(includeYear ? { year: "numeric" } : {}) }).format(date);
}

export function formatLeagueDateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt || !endsAt) return "Dates to be announced";
  return `${formatLeagueDate(startsAt)} – ${formatLeagueDate(endsAt, true)}`;
}

export function formatMatchTime(value: string | null): string {
  if (!value) return "Time to be set";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function formatLeagueMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
}

export function ordinal(place: number) {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  return `${place}${["th", "st", "nd", "rd"][place % 10] ?? "th"}`;
}

/** Mirrors the API's match windows so buttons show when the server will accept them. */
export const READY_OPENS_MS = 15 * 60 * 1000;
export const READY_GRACE_MS = 10 * 60 * 1000;

export function fixtureScore(fixture: LeagueFixture) {
  if (fixture.status === "forfeit") return fixture.forfeitedBy === "both" ? "Double forfeit" : "Forfeit";
  if (fixture.status === "void") return "Void";
  return fixture.scoreA != null && fixture.scoreB != null ? `${fixture.scoreA}–${fixture.scoreB}` : null;
}

export type LeagueCardAction = {
  label: string;
  state: "setup" | "manage" | "registered" | "pending" | "invited" | "register" | "view";
  href: string;
};

/** The card's call to action, from the viewer's place in the current season. */
export function leagueCardAction(league: LeagueSummary): LeagueCardAction {
  const href = `/leagues/${league.id}`;
  if (league.status === "draft") return { label: "Continue setup", state: "setup", href: `${href}/edit` };
  if (league.viewer?.isOrganizer) return { label: "Manage", state: "manage", href: `${href}?tab=manage` };
  switch (league.viewer?.entryStatus) {
    case "active":
    case "finished":
      return { label: "Registered", state: "registered", href };
    case "pending_approval":
      return { label: "Awaiting approval", state: "pending", href };
    case "invited":
      return { label: "Invited", state: "invited", href };
  }
  const season = league.season;
  const full = season?.maxParticipants != null && season.participantCount >= season.maxParticipants;
  if (season?.status === "registration" && league.joinMode !== "private" && !full) return { label: "Register", state: "register", href };
  if (season && ["completed", "cancelled"].includes(season.status)) return { label: "Final table", state: "view", href };
  return { label: "View league", state: "view", href };
}
