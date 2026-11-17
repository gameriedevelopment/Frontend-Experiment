import type { BracketMatch, HostedTournamentDetail, TournamentBracket } from "../types";

export type PrimaryAction =
  | { kind: "continue_draft" }
  | { kind: "register" }
  | { kind: "respond_invite"; entrantId: string }
  | { kind: "check_in"; entrantId: string; standby: boolean }
  | { kind: "checked_in"; standby: boolean }
  | { kind: "waiting"; label: string }
  | { kind: "my_match"; matchId: string; stage: MatchStage }
  | { kind: "manage" }
  | { kind: "none"; label: string | null };

const OPEN = ["ready", "scheduled", "live", "result_pending", "disputed"];
export const READY_WINDOW_MS = 15 * 60_000;

export type MatchStage =
  | { kind: "needs_time" }
  | { kind: "awaiting_time" }
  | { kind: "waiting"; readyOpensAt: number; startsAt: number }
  | { kind: "ready_check" }
  | { kind: "ready"; startsAt: number }
  | { kind: "play" };

/** Where the viewer's own open match stands, so every surface says the same thing. */
export function matchStage(
  match: BracketMatch,
  side: "a" | "b",
  roundMode: "fixed" | "deadline" | undefined,
  now = Date.now(),
): MatchStage {
  const challenge = match.challenge;
  if (!challenge) {
    return match.status === "ready" && roundMode === "deadline"
      ? { kind: "needs_time" }
      : { kind: "awaiting_time" };
  }
  const startsAt = match.scheduledAt ? new Date(match.scheduledAt).getTime() : null;
  if (challenge.status !== "accepted" || startsAt === null) return { kind: "play" };
  const readyOpensAt = startsAt - READY_WINDOW_MS;
  if (now < readyOpensAt) return { kind: "waiting", readyOpensAt, startsAt };
  const imReady = side === "a" ? challenge.readyA : challenge.readyB;
  if (!imReady) return { kind: "ready_check" };
  return now < startsAt ? { kind: "ready", startsAt } : { kind: "play" };
}

export function myOpenMatch(
  bracket: TournamentBracket | undefined,
  entrantId: string | undefined,
): BracketMatch | null {
  if (!bracket || !entrantId) return null;
  return (
    bracket.matches
      .filter(
        (match) =>
          OPEN.includes(match.status) &&
          (match.sideA.entrantId === entrantId || match.sideB.entrantId === entrantId),
      )
      .sort((a, b) => a.number - b.number)[0] ?? null
  );
}

export function checkInOpen(t: HostedTournamentDetail, now = Date.now()): boolean {
  if (t.phase !== "check_in" || !t.checkInOpensAt || !t.checkInClosesAt) return false;
  return now >= new Date(t.checkInOpensAt).getTime() && now < new Date(t.checkInClosesAt).getTime();
}

export function primaryAction(
  t: HostedTournamentDetail,
  bracket: TournamentBracket | undefined,
  now = Date.now(),
): PrimaryAction {
  const viewer = t.viewer;
  const entrant = viewer.entrant;
  if (t.phase === "draft")
    return viewer.isOrganizer ? { kind: "continue_draft" } : { kind: "none", label: null };

  if (entrant && entrant.canAct) {
    if (entrant.status === "invited") return { kind: "respond_invite", entrantId: entrant.id };
    if (entrant.status === "pending_approval")
      return { kind: "waiting", label: "Awaiting approval" };
    if (
      ["registered", "waitlisted"].includes(entrant.status) &&
      checkInOpen(t, now) &&
      !entrant.checkedInAt
    ) {
      return { kind: "check_in", entrantId: entrant.id, standby: entrant.status === "waitlisted" };
    }
    if (entrant.checkedInAt && ["checked_in", "waitlisted"].includes(entrant.status)) {
      return { kind: "checked_in", standby: entrant.status === "waitlisted" };
    }
    if (entrant.status === "waitlisted") {
      return { kind: "waiting", label: `Waitlist #${entrant.waitlistPosition ?? "—"}` };
    }
    if (entrant.status === "registered") {
      return {
        kind: "waiting",
        label: t.phase === "registration" ? "Registered" : "Check in soon",
      };
    }
  }
  if (entrant && (t.phase === "live" || t.phase === "paused")) {
    const match = myOpenMatch(bracket, entrant.id);
    if (match) {
      const side = match.sideA.entrantId === entrant.id ? "a" : "b";
      return {
        kind: "my_match",
        matchId: match.id,
        stage: matchStage(match, side, t.schedule?.roundMode, now),
      };
    }
  }
  if (viewer.isOrganizer && !["completed", "cancelled"].includes(t.phase))
    return { kind: "manage" };
  if (!entrant && viewer.canRegister) return { kind: "register" };
  return { kind: "none", label: viewer.registrationBlocker };
}
