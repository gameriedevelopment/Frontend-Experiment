import type {
  RegistrationState,
  EntrantStatus,
  HostType,
  HostedFormat,
  Tournament,
  TournamentPhase,
  TournamentTiming,
} from "./types";

const day = 24 * 60 * 60 * 1000;

function time(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getTournamentTiming(tournament: Tournament, now = new Date()): TournamentTiming {
  const current = now.getTime();
  const start = time(tournament.startDate) ?? current;
  const end = time(tournament.endDate) ?? start;
  const deadline = time(tournament.registrationDeadline);
  const full = Boolean(
    tournament.maxTeams && (tournament.currentTeams ?? 0) >= tournament.maxTeams,
  );
  const lifecycle = current < start ? "upcoming" : current <= end ? "ongoing" : "completed";

  if (lifecycle === "completed")
    return { lifecycle, registration: "completed", registrationLabel: "Tournament complete" };
  if (lifecycle === "ongoing")
    return { lifecycle, registration: "started", registrationLabel: "In progress" };
  if (full) return { lifecycle, registration: "full", registrationLabel: "Capacity reached" };
  if (!deadline || current > deadline)
    return { lifecycle, registration: "closed", registrationLabel: "Registration closed" };
  if (deadline - current <= 3 * day)
    return { lifecycle, registration: "closing", registrationLabel: "Registration closing soon" };
  return { lifecycle, registration: "open", registrationLabel: "Registration open" };
}

export function formatTournamentDate(value?: string | null, includeTime = false): string {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "To be announced";
  return new Intl.DateTimeFormat(
    undefined,
    includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" },
  ).format(parsed);
}

export function formatShortDateTime(value?: string | null): string {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "To be announced";
  return parsed.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPrize(value?: number | null): string {
  if (!value) return "No prize listed";
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function tournamentRequirements(tournament: Tournament): string[] {
  return [
    tournament.skillLevel || "All skill levels",
    tournament.teamSize
      ? `${tournament.teamSize} player ${tournament.teamSize === 1 ? "entry" : "team"}`
      : "Open team size",
    tournament.region || "Global",
  ];
}

export function safeTournamentUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export const isHosted = (tournament: Pick<Tournament, "source">) =>
  tournament.source === "hosted" || tournament.source === "official";

export const FORMAT_LABELS: Record<HostedFormat, string> = {
  single_elimination: "Single elimination",
  double_elimination: "Double elimination",
  round_robin: "Round robin",
};

export const formatLabel = (format?: string | null) =>
  format && format in FORMAT_LABELS
    ? FORMAT_LABELS[format as HostedFormat]
    : format || "Format TBA";

const PHASE_LABELS: Record<TournamentPhase, string> = {
  draft: "Draft",
  registration: "Registration open",
  check_in: "Check-in open",
  awaiting_start: "Starting soon",
  live: "Live",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const phaseLabel = (phase?: TournamentPhase | null) =>
  phase ? PHASE_LABELS[phase] : "Upcoming";

export const HOST_TYPE_LABELS: Record<HostType, string> = {
  user: "Player",
  team: "Team",
  hub: "Hub",
  gamerie: "Gamerie",
};

const ENTRANT_STATUS_LABELS: Record<EntrantStatus, string> = {
  pending_approval: "Awaiting approval",
  invited: "Invited",
  registered: "Registered",
  waitlisted: "Waitlist",
  checked_in: "Checked in",
  active: "Still in",
  eliminated: "Eliminated",
  disqualified: "Disqualified",
  withdrawn: "Withdrawn",
  declined: "Declined",
  removed: "Removed",
  finished: "Finished",
};

export const entrantStatusLabel = (status: EntrantStatus) => ENTRANT_STATUS_LABELS[status];

export const bestOfLabel = (bestOf?: number | null) => (bestOf ? `Best of ${bestOf}` : "—");

export function ordinal(value: number): string {
  const rem100 = value % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${value}th`;
  return `${value}${{ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th"}`;
}

export function initials(name?: string | null): string {
  const parts = (name ?? "")
    .trim()
    .split(/\s+|_|-/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}

export function durationLabel(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} h ${rest} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d ${hours % 24} h`;
}

export function untilLabel(value?: string | null, now = Date.now()): string | null {
  const target = time(value);
  if (target === undefined) return null;
  const diff = target - now;
  return diff > 0 ? `in ${durationLabel(diff)}` : `${durationLabel(-diff)} ago`;
}

/** Local value for an <input type="datetime-local"> from an ISO string. */
export function toLocalInput(value?: string | null): string {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export interface CardAction {
  label: string;
  to: string;
  primary: boolean;
}

/** The hosted card's call to action, from the viewer's role and entry. */
export function cardAction(tournament: Tournament): CardAction {
  const base = `/tournaments/${tournament.id}`;
  const phase = tournament.phase;
  const viewer = tournament.viewer;
  const closed = phase === "completed" || phase === "cancelled";
  const checkIn = phase === "check_in";

  if (viewer?.isOrganizer && !closed)
    return { label: "Manage", to: `${base}?tab=manage`, primary: false };

  switch (viewer?.entrantStatus) {
    case "invited":
      return { label: "Respond to invite", to: base, primary: true };
    case "pending_approval":
      return { label: "Pending approval", to: base, primary: false };
    case "waitlisted":
      return checkIn && !viewer.checkedIn
        ? { label: "Check in", to: base, primary: true }
        : { label: `Waitlist #${viewer.waitlistPosition ?? "—"}`, to: base, primary: false };
    case "registered":
      return checkIn && !viewer.checkedIn
        ? { label: "Check in", to: base, primary: true }
        : { label: "Registered", to: base, primary: false };
    case "checked_in":
      return { label: "Checked in", to: base, primary: false };
    case "active":
      return closed
        ? { label: "View results", to: base, primary: false }
        : { label: "My matches", to: `${base}?tab=matches`, primary: phase === "live" };
    case "eliminated":
    case "finished":
    case "disqualified":
      return { label: "View results", to: `${base}?tab=bracket`, primary: false };
  }

  if (phase === "registration" || checkIn) return { label: "Register", to: base, primary: true };
  return { label: closed ? "View results" : "View tournament", to: base, primary: false };
}

/** Registration state for a directory card, using hosted fields (entrants, bracket size) when present. */
export function registrationState(tournament: Tournament, now = Date.now()): RegistrationState {
  const start = time(tournament.startDate) ?? now;
  const end = time(tournament.endDate) ?? start;
  const deadline = time(tournament.registrationDeadline);
  const capacity = tournament.bracketSize ?? tournament.maxTeams;
  const entrants = tournament.entrantCount ?? tournament.currentTeams ?? 0;
  if (now > end) return "completed";
  if (now >= start) return "started";
  if (capacity && entrants >= capacity) return "full";
  if (!deadline || now > deadline) return "closed";
  return deadline - now <= 3 * day ? "closing" : "open";
}
