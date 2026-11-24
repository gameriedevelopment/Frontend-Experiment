import type { CompetitionKind } from "@/features/competitions/types";

/** A disputed result from any competition, shaped for one desk. */
export interface Dispute {
  key: string;
  source: CompetitionKind;
  /** The id the decision endpoint takes: a report, a challenge or a fixture. */
  id: string;
  competition: { id: string; name: string; game: string | null; official: boolean } | null;
  context: string | null;
  sideA: string;
  sideB: string;
  claimed: { scoreA: number | null; scoreB: number | null } | null;
  reportedBy: "a" | "b" | null;
  reason: string | null;
  evidenceUrl: string | null;
  raisedAt: string;
}

export type Decision = "confirm" | "correct" | "replay";

export interface DecisionInput {
  decision: Decision;
  scoreA?: number;
  scoreB?: number;
  notes: string;
}

export interface TournamentReport {
  id: string;
  status: string;
  type: string;
  reason: string;
  createdAt: string;
  tournament: { id: string; name: string; game: string; official: boolean } | null;
  match: { number: number; lane: string; round: number } | null;
  challenge: { sideA: string | null; sideB: string | null; declaredScore: string | null; declaredSide: "a" | "b" | null } | null;
}

export interface LadderDispute {
  id: string;
  createdAt: string;
  reportedAt: string | null;
  evidenceUrl: string | null;
  declaredSide: "a" | "b" | null;
  result: { score: string; p1Score?: number; p2Score?: number; notes?: string } | null;
  challenger: { name: string | null };
  challenged: { name: string | null };
  ladder: { id: string; name: string; game: string; official: boolean } | null;
}

export interface LeagueDispute {
  id: string;
  stage: "regular" | "playoffs";
  week: number;
  sideA: { name: string };
  sideB: { name: string };
  matchAt: string;
  scoreA: number | null;
  scoreB: number | null;
  evidenceUrl: string | null;
  notes: string | null;
  league: { id: string; name: string; official: boolean; game: string } | null;
}
