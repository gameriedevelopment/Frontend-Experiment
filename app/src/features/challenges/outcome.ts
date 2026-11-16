import { sideIds } from "./lifecycle";
import type { ChallengePerspective } from "./lifecycle";
import type { Challenge } from "./types";

export type Outcome = "win" | "loss" | "draw";

/** The recorded result from the viewer's side, or null when there's no result or they didn't play. */
export function viewerOutcome(challenge: Challenge, view: ChallengePerspective): Outcome | null {
  const winner = challenge.result?.winnerId;
  if (!winner || !view.side) return null;
  if (winner === "draw") return "draw";
  const [challengerId, challengedId] = sideIds(challenge);
  const mine = view.side === "challenger" ? challengerId : challengedId;
  return winner === mine ? "win" : "loss";
}

export const outcomeLabels: Record<Outcome, string> = { win: "Won", loss: "Lost", draw: "Draw" };
