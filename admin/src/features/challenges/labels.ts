import type { Challenge, ChallengeStatus } from "./types";

export const STATUS: Record<ChallengeStatus, { label: string; tone: "signal" | "lavender" | "mist" | "danger" }> = {
  pending: { label: "Waiting for reply", tone: "lavender" },
  reschedule_pending: { label: "New time asked", tone: "lavender" },
  accepted: { label: "Ready to play", tone: "signal" },
  completed: { label: "Played", tone: "mist" },
  rejected: { label: "Declined", tone: "mist" },
  cancelled: { label: "Cancelled", tone: "mist" },
  expired: { label: "Expired", tone: "mist" },
};

export const STATUS_ORDER: ChallengeStatus[] = ["pending", "reschedule_pending", "accepted", "completed", "rejected", "cancelled", "expired"];

export const FORMATS = ["Best of 1", "Best of 3", "Best of 5"];

/** The two sides as ids, names and the page each opens. */
export function sides(challenge: Challenge) {
  const team = challenge.type === "team";
  return [
    { id: team ? challenge.challengerTeamId : challenge.challengerId, name: (team ? challenge.challengerTeamName : challenge.challengerName) ?? "Unknown", to: team ? "/teams" : "/users" },
    { id: team ? challenge.challengedTeamId : challenge.challengedId, name: (team ? challenge.challengedTeamName : challenge.challengedName) ?? "Unknown", to: team ? "/teams" : "/users" },
  ] as const;
}

/** Scores as [first, second], read from the numbers or the "2-1" string older results kept. */
export function scores(challenge: Challenge): [number, number] | null {
  const result = challenge.result;
  if (!result) return null;
  if (result.p1Score != null && result.p2Score != null) return [result.p1Score, result.p2Score];
  const parsed = /^(\d+)\s*[-:]\s*(\d+)$/.exec(result.score ?? "");
  return parsed ? [Number(parsed[1]), Number(parsed[2])] : null;
}

/** For a datetime-local input, in the admin's own timezone. */
export function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : "");
