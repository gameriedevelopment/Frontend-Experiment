export type ChallengeStatus = "pending" | "accepted" | "reschedule_pending" | "rejected" | "cancelled" | "completed" | "expired";

export interface ChallengeLineupMember {
  id: string;
  teamId: string;
  playerId: string;
  side: "challenger" | "challenged";
  playerNameSnapshot: string;
  gamerieIdSnapshot: string | null;
}

export interface ChallengeResult {
  winnerId: string;
  score: string;
  p1Score?: number;
  p2Score?: number;
  notes?: string;
}

export interface Challenge {
  id: string;
  type: "user" | "team";
  challengerId: string | null;
  challengerName: string | null;
  challengedId: string | null;
  challengedName: string | null;
  challengerTeamId: string | null;
  challengerTeamName: string | null;
  challengedTeamId: string | null;
  challengedTeamName: string | null;
  game: string;
  scheduledDate: string;
  format: string;
  teamSize: number | null;
  lineupRequired: boolean;
  lineups?: ChallengeLineupMember[];
  message: string | null;
  status: ChallengeStatus;
  reportCount: number;
  result: ChallengeResult | null;
  createdAt: string;
  /** Changes on every save, so the editor resets only when the challenge really changed. */
  updatedAt: string;
}

export interface ChallengeQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ChallengeStatus;
  type?: "user" | "team";
  reported?: "true";
}

export type ChallengeSummary = Record<ChallengeStatus | "total" | "reported" | "organiserResults", number>;

export interface CreateChallengeInput {
  type: "user" | "team";
  player1Id?: string;
  player2Id?: string;
  team1Id?: string;
  team2Id?: string;
  teamSize?: number;
  team1LineupPlayerIds?: string[];
  team2LineupPlayerIds?: string[];
  gameId: string;
  scheduledDate: string;
  format: string;
  message?: string;
  status: "accepted" | "completed";
  p1Score?: number;
  p2Score?: number;
  winnerId?: string;
  resultNotes?: string;
}

export interface UpdateChallengeInput {
  game?: string;
  scheduledDate?: string;
  format?: string;
  message?: string;
  status?: ChallengeStatus;
  p1Score?: number;
  p2Score?: number;
  winnerId?: string;
  resultNotes?: string;
  team1LineupPlayerIds?: string[];
  team2LineupPlayerIds?: string[];
  reason: string;
}

export interface EligibleMember {
  playerId: string;
  username: string;
  gamerieId: string | null;
  profileImage: string | null;
  role: string;
}

export interface OrganiserResult {
  id: string;
  eventName: string;
  playedAt: string;
  recordedAt: string;
  recordedBy: string | null;
  game: { id: string; name: string };
  player1: { id: string; username: string; profileImage: string | null; score: number | null };
  player2: { id: string | null; username: string; profileImage: string | null; score: number | null };
  winner: "player1" | "player2" | "draw";
}

export interface OrganiserResultInput {
  player1Id: string;
  player2Id: string;
  gameId: string;
  eventName: string;
  playedAt: string;
  player1Score: number;
  player2Score: number;
  idempotencyKey: string;
  reason: string;
}
