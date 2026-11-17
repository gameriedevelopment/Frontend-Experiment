import type { MatchHistoryEntry } from "./types";

function displayText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function structuredResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as { winnerId?: unknown; score?: unknown; notes?: unknown };
}

export function getMatchPresentation(match: MatchHistoryEntry, playerId: string) {
  const result = structuredResult(match.result);
  const status = displayText(match.status) || "Scheduled";
  const score =
    typeof match.playerScore === "number" && typeof match.opponentScore === "number"
      ? `${match.playerScore}-${match.opponentScore}`
      : null;
  const label =
    score ||
    displayText(match.score) ||
    displayText(result?.score) ||
    displayText(match.result) ||
    status;

  let state = displayText(match.result)?.toLowerCase() || status.toLowerCase();
  if (state === "victory") state = "win";
  if (state === "defeat") state = "loss";
  const winnerId = displayText(result?.winnerId);
  const isPlayerMatch = match.challengerId === playerId || match.challengedId === playerId;
  if (winnerId === playerId) state = "win";
  else if (winnerId && isPlayerMatch) state = "loss";

  const opponent =
    displayText(match.opponent) ||
    displayText(match.opponentIdentity) ||
    (match.challengerId === playerId
      ? displayText(match.challengedName)
      : match.challengedId === playerId
        ? displayText(match.challengerName)
        : null);

  return { label, state, opponent };
}

export const matchSourceLabels: Record<NonNullable<MatchHistoryEntry["verificationSource"]>, string> = {
  challenge: "Challenge result",
  tournament: "Tournament result",
  organiser: "Organiser recorded",
  screenshot: "Screenshot verified",
  player_listed: "Player listed",
  official_api: "Official game data",
};

export const matchResultStyles: Record<string, { mark: string; label: string; className: string }> = {
  win: { mark: "W", label: "Win", className: "bg-signal/12 text-signal" },
  loss: { mark: "L", label: "Loss", className: "bg-white/6 text-mist-400" },
  draw: { mark: "D", label: "Draw", className: "bg-lavender-400/12 text-lavender-300" },
};

export function matchGameName(value: MatchHistoryEntry["game"]) {
  if (typeof value === "string") return value;
  return value?.name || "Game";
}

export function matchPlayedAt(match: MatchHistoryEntry) {
  return match.playedAt || match.scheduledDate || match.date || match.createdAt;
}
