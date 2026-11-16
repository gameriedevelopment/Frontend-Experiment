import type { HostedFormat, Tournament } from "./types";

const day = 24 * 60 * 60 * 1000;

const time = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const FORMAT_LABELS: Record<HostedFormat, string> = {
  single_elimination: "Single elimination",
  double_elimination: "Double elimination",
  round_robin: "Round robin",
};

export const formatLabel = (format?: string | null) =>
  format && format in FORMAT_LABELS ? FORMAT_LABELS[format as HostedFormat] : format || "Format TBA";

export type RegistrationState = "open" | "closing" | "full" | "closed" | "started" | "completed";

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
