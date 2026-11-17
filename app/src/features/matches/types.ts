export type MatchSubmissionStatus =
  | "started"
  | "uploaded"
  | "processing"
  | "ready_for_review"
  | "review_required"
  | "confirmed"
  | "rejected"
  | "failed"
  | "cancelled"
  | "duplicate";

export type VerifiedResult = "victory" | "defeat";
export type RecordedMatchResult = VerifiedResult | "draw";

export interface MatchInterpretation {
  acceptedAsResultScreen: boolean;
  result: VerifiedResult | null;
  playerIdentityMatched: boolean | null;
  playerScore: number | null;
  opponentScore: number | null;
  rejectionReason: string | null;
}

export interface ReviewedMatch {
  result: VerifiedResult;
  playerScore: number | null;
  opponentScore: number | null;
  opponentIdentity: string | null;
  playedAt: string;
  correctedFields: string[];
  correctionReason: string | null;
}

export interface RecordedMatch {
  id: string;
  playerId: string;
  opponentUserId: string | null;
  gameId: string;
  opponentIdentity: string | null;
  result: RecordedMatchResult;
  playerScore: number | null;
  opponentScore: number | null;
  playedAt: string;
  verificationSource:
    "player_listed" | "screenshot" | "challenge" | "organiser" | "official_api" | "tournament";
  verificationTier: number;
  createdAt: string;
}

export interface ProgressionResult {
  gpAwarded: number;
  totalGp: number;
  previousLevel: number;
  level: number;
  levelReached: boolean;
  nextLevel: number | null;
  gpIntoLevel: number;
  gpForNextLevel: number | null;
  progressPercent: number;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  previousStreak: number;
  streakChanged: boolean;
  streakExtended: boolean;
  streakRestarted: boolean;
}

export interface PlayerCardSharePrompt {
  reason: "level_reached" | "session_milestone";
  title: string;
  message: string;
}

export interface ConfirmedMatch {
  match: RecordedMatch;
  progression: ProgressionResult;
  streak: StreakResult;
  matchCount: number;
  sharePrompt: PlayerCardSharePrompt | null;
}

export interface MatchSubmission {
  id: string;
  gameId: string;
  status: MatchSubmissionStatus;
  duplicateOfSubmissionId: string | null;
  failureCode: string | null;
  interpretation: MatchInterpretation | null;
  reviewedMatch: ReviewedMatch | null;
  confirmedAt: string | null;
  recordedMatch: RecordedMatch | null;
  progression: ProgressionResult | null;
  streak: StreakResult | null;
  matchCount: number | null;
  sharePrompt: PlayerCardSharePrompt | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchReviewInput {
  result: VerifiedResult;
  playerScore?: number;
  opponentScore?: number;
  opponentIdentity?: string;
  playedAt: string;
  correctionReason?: string;
}
