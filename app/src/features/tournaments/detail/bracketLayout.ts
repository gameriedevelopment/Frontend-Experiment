import type { BracketLane, BracketMatch } from "../types";

export interface LaneColumn {
  round: number;
  label: string;
  bestOf: number;
  matches: BracketMatch[];
}

export interface LaneLayout {
  lane: "main" | "lower" | "finals";
  title: string | null;
  columns: LaneColumn[];
}

const isUpper = (lane: BracketLane) => lane === "upper";

/**
 * Splits an elimination stage into the lanes players read: the main (or upper)
 * bracket, the lower bracket, and a finals lane for the grand final and the
 * third-place match.
 */
export function eliminationLanes(matches: BracketMatch[]): LaneLayout[] {
  const double = matches.some((match) => match.lane === "lower");
  const byRound = (lane: (value: BracketLane) => boolean) => {
    const columns = new Map<number, LaneColumn>();
    for (const match of matches.filter((candidate) => lane(candidate.lane))) {
      const column = columns.get(match.round) ?? {
        round: match.round,
        label: match.label,
        bestOf: match.bestOf,
        matches: [],
      };
      column.matches.push(match);
      columns.set(match.round, column);
    }
    return [...columns.values()]
      .sort((a, b) => a.round - b.round)
      .map((column) => ({
        ...column,
        matches: column.matches.sort((a, b) => a.position - b.position),
      }));
  };

  const lanes: LaneLayout[] = [
    { lane: "main", title: double ? "Upper bracket" : null, columns: byRound(isUpper) },
  ];
  if (double)
    lanes.push({
      lane: "lower",
      title: "Lower bracket",
      columns: byRound((lane) => lane === "lower"),
    });

  const finals = matches
    .filter((match) => match.lane === "grand_final" || match.lane === "third_place")
    .filter((match) => !(match.isResetMatch && match.status === "void"))
    .sort((a, b) => (a.lane === b.lane ? a.round - b.round : a.lane === "grand_final" ? -1 : 1));
  if (finals.length) {
    lanes.push({
      lane: "finals",
      title: double ? "Grand final" : "Placement",
      columns: finals.map((match) => ({
        round: match.round,
        label: match.label,
        bestOf: match.bestOf,
        matches: [match],
      })),
    });
  }
  return lanes;
}

/** Every match an entrant appears in, so hovering an entrant lights up their whole path. */
export function pathOf(matches: BracketMatch[], entrantId: string | null): Set<string> {
  if (!entrantId) return new Set();
  return new Set(
    matches
      .filter((match) => match.sideA.entrantId === entrantId || match.sideB.entrantId === entrantId)
      .map((match) => match.id),
  );
}

export type MatchTone = "live" | "pending" | "disputed" | "done" | "upcoming" | "waiting" | "bye";

export function matchTone(match: BracketMatch): MatchTone {
  switch (match.status) {
    case "live":
      return "live";
    case "result_pending":
      return "pending";
    case "disputed":
      return "disputed";
    case "completed":
      return "done";
    case "bye":
    case "void":
    case "cancelled":
      return "bye";
    case "scheduled":
    case "ready":
      return "upcoming";
    default:
      return "waiting";
  }
}
