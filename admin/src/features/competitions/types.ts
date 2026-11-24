export type CompetitionKind = "tournament" | "ladder" | "league";

export interface CompetitionSummary {
  tournaments: { total: number; live: number; registration: number; completed: number; cancelled: number; official: number; removed: number };
  ladders: { total: number; running: number; upcoming: number; completed: number; official: number; removed: number };
  leagues: { total: number; running: number; registration: number; completed: number; official: number; removed: number };
}

/** A match in a ladder or league, shaped for one table. */
export interface MatchRow {
  id: string;
  sideA: { id: string; name: string };
  sideB: { id: string; name: string };
  scoreA: number | null;
  scoreB: number | null;
  winner: "a" | "b" | "draw" | null;
  status: string;
  when: string | null;
  label: string | null;
}
