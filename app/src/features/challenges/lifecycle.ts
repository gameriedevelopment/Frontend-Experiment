import type { Challenge, ChallengeLineupSide, ChallengeStatus } from "./types";

export type ChallengePhase =
  | "pending"
  | "scheduled"
  | "played"
  | "reschedule_pending"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired"
  | "in_report_window"
  | "disputed"
  | "final"
  | "forfeit"
  | "replayed";

export const isTournamentChallenge = (challenge: Challenge) => challenge.source === "tournament";

export function tournamentMatchLink(challenge: Challenge): string | null {
  if (!challenge.tournamentId) return null;
  const match = challenge.tournamentMatchId ? `&match=${challenge.tournamentMatchId}` : "";
  return `/tournaments/${challenge.tournamentId}?tab=matches${match}`;
}

export function challengePhase(challenge: Challenge, now = Date.now()): ChallengePhase {
  if (challenge.status !== "accepted") return challenge.status as ChallengePhase;
  return new Date(challenge.scheduledDate).getTime() > now ? "scheduled" : "played";
}

const phaseLabels: Record<ChallengePhase, string> = {
  pending: "Awaiting response",
  scheduled: "Scheduled",
  played: "Awaiting score",
  reschedule_pending: "New time proposed",
  completed: "Completed",
  rejected: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
  in_report_window: "Result pending",
  disputed: "Under review",
  final: "Completed",
  forfeit: "Forfeit",
  replayed: "Replayed",
};

export function challengePhaseLabel(challenge: Challenge, now = Date.now()): string {
  return phaseLabels[challengePhase(challenge, now)];
}

export const isClosedPhase = (phase: ChallengePhase) =>
  ["completed", "final", "forfeit", "replayed", "rejected", "cancelled", "expired"].includes(phase);

export function canSubmitScore(challenge: Challenge, now = Date.now()): boolean {
  return !isTournamentChallenge(challenge) && challengePhase(challenge, now) === "played";
}

export function canCancel(status: ChallengeStatus): boolean {
  return status === "accepted" || status === "reschedule_pending";
}

export function canDelete(status: ChallengeStatus): boolean {
  return ["pending", "rejected", "cancelled", "expired"].includes(status);
}

export function canPropose(challenge: Challenge, now = Date.now()): boolean {
  return !isTournamentChallenge(challenge) && challengePhase(challenge, now) === "scheduled";
}

export function sideNames(challenge: Challenge): [string, string] {
  return challenge.type === "team"
    ? [challenge.challengerTeamName || "Challenging team", challenge.challengedTeamName || "Challenged team"]
    : [challenge.challengerName || "Challenger", challenge.challengedName || "Opponent"];
}

export function sideIds(challenge: Challenge): [string, string] {
  return challenge.type === "team"
    ? [challenge.challengerTeamId || "", challenge.challengedTeamId || ""]
    : [challenge.challengerId || "", challenge.challengedId || ""];
}

export interface ChallengePerspective {
  /** The viewer (or a team they own) received this challenge. */
  incoming: boolean;
  /** The viewer (or a team they own) sent it. */
  initiated: boolean;
  participant: boolean;
  side: ChallengeLineupSide | null;
  ownTeamId?: string;
  opponentName: string;
}

export function challengePerspective(
  challenge: Challenge,
  userId: string | undefined,
  ownedTeamIds: string[],
): ChallengePerspective {
  const incoming =
    challenge.type === "team"
      ? ownedTeamIds.includes(challenge.challengedTeamId || "")
      : Boolean(userId) && challenge.challengedId === userId;
  const initiated =
    challenge.type === "team"
      ? ownedTeamIds.includes(challenge.challengerTeamId || "")
      : Boolean(userId) && (challenge.initiatedBy === userId || challenge.challengerId === userId);
  const side: ChallengeLineupSide | null = initiated ? "challenger" : incoming ? "challenged" : null;
  const [challenger, challenged] = sideNames(challenge);
  return {
    incoming,
    initiated,
    participant: incoming || initiated,
    side,
    ownTeamId:
      challenge.type === "team"
        ? ownedTeamIds.find((id) => id === challenge.challengerTeamId || id === challenge.challengedTeamId)
        : undefined,
    opponentName: side === "challenger" ? challenged : challenger,
  };
}

/** Team challenges need both full rosters named before a score can be submitted. */
export function lineupsReady(challenge: Challenge) {
  if (challenge.type !== "team" || challenge.lineupRequired === false) return true;
  const required = challenge.teamSize ?? 0;
  return (["challenger", "challenged"] as const).every(
    (side) => (challenge.lineups ?? []).filter((member) => member.side === side).length === required,
  );
}

export type ChallengeTone = "action" | "upcoming" | "waiting" | "done" | "closed" | "alert";

export interface ChallengeNextStep {
  tone: ChallengeTone;
  title: string;
  description: string;
  /** Short verb for list rows when the viewer has something to do. */
  cta?: string;
}

/** What the viewer should know or do next, phrased from their side of the challenge. */
export function nextStep(
  challenge: Challenge,
  view: ChallengePerspective,
  userId: string | undefined,
  now = Date.now(),
): ChallengeNextStep {
  const phase = challengePhase(challenge, now);
  const opponent = view.opponentName;

  if (isTournamentChallenge(challenge)) {
    return {
      tone: isClosedPhase(phase) ? "done" : "action",
      title: isClosedPhase(phase) ? "Tournament result recorded" : "Play it in the tournament",
      description: "Ready up, declare the score and confirm the result from the tournament match.",
      cta: isClosedPhase(phase) ? undefined : "Open match",
    };
  }

  switch (phase) {
    case "pending":
      return view.incoming
        ? { tone: "action", title: "Your answer", description: "Accept to lock in the time, or decline.", cta: "Answer" }
        : {
            tone: "waiting",
            title: view.participant ? `Waiting for ${opponent}` : "Waiting for a response",
            description: "They've been notified. The challenge can be deleted until they answer.",
          };
    case "reschedule_pending":
      return challenge.reschedule?.proposedBy === userId
        ? { tone: "waiting", title: "New time sent", description: `Waiting for ${opponent} to accept it.` }
        : {
            tone: view.participant ? "action" : "waiting",
            title: "New time proposed",
            description: "Accept it, or keep the time you agreed.",
            cta: "Review time",
          };
    case "scheduled":
      return {
        tone: "upcoming",
        title: "Locked in",
        description: "Play at the agreed time, then come back here to submit the score.",
      };
    case "played":
      return lineupsReady(challenge)
        ? {
            tone: view.participant ? "action" : "waiting",
            title: "Submit the score",
            description: "Enter the final score. The other side can report it if it's wrong.",
            cta: "Submit score",
          }
        : {
            tone: "action",
            title: "Lineups needed",
            description: "Both teams have to name their players before the score can be submitted.",
            cta: "Set lineup",
          };
    case "in_report_window":
      return {
        tone: "waiting",
        title: "Result pending",
        description: "The score is in. It becomes final once the report window closes.",
      };
    case "disputed":
      return {
        tone: "alert",
        title: "Under review",
        description: "A report was filed on this result, and Gamerie is reviewing it.",
      };
    case "completed":
    case "final":
      return { tone: "done", title: "Result recorded", description: "This result is on both players' records." };
    case "forfeit":
      return { tone: "done", title: "Forfeit", description: "This challenge ended in a forfeit." };
    case "replayed":
      return { tone: "done", title: "Replayed", description: "This challenge was replayed." };
    case "rejected":
      return { tone: "closed", title: "Declined", description: "This challenge was declined." };
    case "cancelled":
      return { tone: "closed", title: "Cancelled", description: "This challenge was cancelled." };
    case "expired":
      return {
        tone: "closed",
        title: "Expired",
        description: view.participant
          ? "Nobody answered before the match time. Send it again with a new time."
          : "Nobody answered before the match time.",
      };
  }
}

export interface TimelineStep {
  label: string;
  state: "done" | "current" | "upcoming" | "stopped";
}

/** The four beats every challenge passes through, and where this one is. */
export function challengeTimeline(challenge: Challenge, now = Date.now()): TimelineStep[] {
  const phase = challengePhase(challenge, now);
  const labels = ["Sent", "Accepted", "Played", "Result"];
  const stoppedAt: Partial<Record<ChallengePhase, [number, string]>> = {
    rejected: [1, "Declined"],
    expired: [1, "Expired"],
    cancelled: [2, "Cancelled"],
  };
  const stop = stoppedAt[phase];
  if (stop) {
    return labels.map((label, index) => ({
      label: index === stop[0] ? stop[1] : label,
      state: index < stop[0] ? "done" : index === stop[0] ? "stopped" : "upcoming",
    }));
  }
  const current: Record<string, number> = {
    pending: 1,
    reschedule_pending: 2,
    scheduled: 2,
    played: 3,
    in_report_window: 3,
    disputed: 3,
  };
  const at = current[phase] ?? labels.length;
  return labels.map((label, index) => ({
    label,
    state: index < at ? "done" : index === at ? "current" : "upcoming",
  }));
}

export function formatChallengeDateTime(value: string | Date): string {
  // Explicit options: some ICU builds reject dateStyle/timeStyle together with timeZoneName.
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
