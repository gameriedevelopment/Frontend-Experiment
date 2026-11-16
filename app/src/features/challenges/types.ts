export type ChallengeType = "user" | "team";
export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "reschedule_pending"
  | "rejected"
  | "cancelled"
  | "completed"
  | "expired"
  | "in_report_window"
  | "disputed"
  | "final"
  | "forfeit"
  | "replayed";
export type ChallengeScope = "for-you" | "team" | "history";
export type ChallengeDirection = "all" | "received" | "sent";

export interface ChallengeResult {
  winnerId: string;
  score: string;
  p1Score?: number;
  p2Score?: number;
  notes?: string;
}

export interface ChallengeReschedule {
  proposedDate: string;
  proposedBy: string;
  previousDate: string;
}

export type ChallengeLineupSide = "challenger" | "challenged";

export interface ChallengeLineupMember {
  id: string;
  teamId: string;
  playerId: string;
  side: ChallengeLineupSide;
  playerNameSnapshot: string;
  gamerieIdSnapshot?: string | null;
  selectedBy?: string;
  createdAt?: string;
}

export interface EligibleLineupMember {
  playerId: string;
  username: string;
  gamerieId?: string | null;
  profileImage?: string | null;
  role: "owner" | "member";
  title?: string;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  challengerId?: string;
  challengerName?: string;
  challengedId?: string;
  challengedName?: string;
  challengerTeamId?: string;
  challengerTeamName?: string;
  challengedTeamId?: string;
  challengedTeamName?: string;
  game: string;
  scheduledDate: string;
  format: string;
  teamSize?: number;
  lineupRequired?: boolean;
  lineupLockAt?: string | null;
  lineups?: ChallengeLineupMember[];
  message?: string;
  status: ChallengeStatus;
  result?: ChallengeResult;
  reschedule?: ChallengeReschedule | null;
  initiatedBy?: string;
  createdAt?: string;
  source?: "player" | "tournament";
  tournamentId?: string | null;
  tournamentMatchId?: string | null;
  tournamentLabel?: string | null;
  reportWindowEndsAt?: string | null;
}

export interface ChallengePageData {
  data: Challenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ChallengeFilters {
  scope: ChallengeScope;
  direction: ChallengeDirection;
  status?: ChallengeStatus | "all";
  searchTerm?: string;
}

export interface CreateChallengePayload {
  type: ChallengeType;
  challengedId?: string;
  challengedTeamId?: string;
  challengerTeamId?: string;
  game: string;
  scheduledDate: string;
  format: string;
  teamSize?: number;
  challengerLineupPlayerIds?: string[];
  message?: string;
}

export type ChallengeUpdate = Partial<Challenge> & { lineupPlayerIds?: string[] };
