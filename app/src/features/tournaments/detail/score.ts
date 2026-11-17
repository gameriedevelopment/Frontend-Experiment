export type SeriesVerdict =
  { valid: true; outcome: "a" | "b" | "draw" } | { valid: false; reason: string };

/** Same rules as the server: a best of 3 ends 2-0 or 2-1; draws only where allowed. */
export function judgeSeriesScore(
  bestOf: number,
  scoreA: number,
  scoreB: number,
  allowDraw = false,
): SeriesVerdict {
  if (![scoreA, scoreB].every((score) => Number.isInteger(score) && score >= 0)) {
    return { valid: false, reason: "Scores must be whole numbers of zero or more" };
  }
  const target = Math.ceil(bestOf / 2);
  if (scoreA === scoreB) {
    return allowDraw && scoreA + scoreB <= bestOf && scoreA < target
      ? { valid: true, outcome: "draw" }
      : { valid: false, reason: "This match cannot end in a draw" };
  }
  const high = Math.max(scoreA, scoreB);
  const low = Math.min(scoreA, scoreB);
  if (high !== target || low >= target) {
    return {
      valid: false,
      reason: `A best of ${bestOf} ends when one side reaches ${target} ${target === 1 ? "win" : "wins"}`,
    };
  }
  return { valid: true, outcome: scoreA > scoreB ? "a" : "b" };
}

/** Every valid final score for a best-of, for one-tap entry. */
export function validScores(bestOf: number, allowDraw = false): Array<[number, number]> {
  const target = Math.ceil(bestOf / 2);
  const scores: Array<[number, number]> = [];
  for (let low = 0; low < target; low += 1) {
    scores.push([target, low]);
    scores.push([low, target]);
  }
  if (allowDraw) {
    for (let level = 0; level < target && level * 2 <= bestOf; level += 1)
      scores.push([level, level]);
  }
  return scores;
}
