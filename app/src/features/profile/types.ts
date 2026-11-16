import type { AuthUser } from "@/features/auth/types";

export interface ProfileGame extends Record<string, unknown> {
  id?: string;
  gameId?: string;
  name?: string;
  gameUsername?: string;
  platform?: string;
  platforms?: string[];
  skillLevel?: string;
  rank?: string;
  nickname?: string;
  rankData?: { rank?: string } | null;
  matchVerificationAdapter?: string | null;
  game?:
    | ({
        id?: string;
        name?: string;
        matchVerificationAdapter?: string | null;
      } & Record<string, unknown>)
    | null;
}

export interface ProfileSkill extends Record<string, unknown> {
  id?: string;
  name?: string;
  level?: string;
  endorsements?: number;
  endorsementCount?: number;
  hasEndorsed?: boolean;
}

export interface PlayerProfile extends AuthUser {
  username: string;
  gamerieId?: string | null;
  shareable?: boolean;
  profileVisibility?: "public" | "private" | "friends" | string;
  showGameActivity?: boolean;
  backgroundImage?: string;
  gamerTitle?: string;
  gameLevel?: string;
  bio?: string;
  region?: string;
  dateOfBirth?: string;
  platforms?: string[];
  followersCount?: number;
  followers?: unknown[];
  following?: unknown[];
  isFollowedByCurrentUser?: boolean;
  personalInfo?: {
    fullName?: string;
    location?: string;
    profession?: string;
    gender?: string;
    age?: number;
    phone?: string;
  };
  socialMedia?: Array<{
    id?: string;
    platform?: string;
    url?: string;
    username?: string;
  }>;
  gamingAccounts?: Array<{
    id?: string;
    platform?: string;
    url?: string;
    username?: string;
  }>;
  gamesPlayed?: ProfileGame[];
  games?: ProfileGame[];
  skills?: ProfileSkill[];
  needs?: Array<{
    id?: string;
    title?: string;
    type?: string;
    game?: string;
    description?: string;
    active?: boolean;
    createdAt?: string;
  }>;
  teams?: ProfileTeam[];
  achievements?: Array<{
    id?: string;
    title?: string;
    description?: string;
    points?: number;
    isCompleted?: boolean;
    category?: string;
    achievementId?: string;
  }>;
  milestones?: Array<{
    id?: string;
    title?: string;
    description?: string;
    date?: string;
    createdAt?: string;
    type?: "achievement" | "event" | "career" | "status" | "other" | string;
    icon?: string;
  }>;
  tournaments?: ProfileTournament[];
  stats?: {
    wins?: number;
    losses?: number;
    matchesPlayed?: number;
    winRate?: number;
    ranking?: number;
    rankingScore?: number;
    rankingScope?: string;
    tournamentWins?: number;
  };
  progression?: {
    totalGp: number;
    level: number;
    nextLevel?: number | null;
    nextLevelGp?: number | null;
    progressPercent?: number;
  };
  streak?: {
    currentStreak: number;
    longestStreak: number;
  };
}

export type ProfileTab = "info" | "career" | "games" | "matches" | "posts" | "achievements";

export interface ProfileTeam {
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  role?: string;
  logo?: string;
  level?: string;
  region?: string;
  members?: Array<{
    userId?: string;
    title?: string;
    role?: string;
    joinedAt?: string;
    user?: {
      id?: string;
      username?: string;
      profileImage?: string;
      personalInfo?: { fullName?: string };
    };
  }>;
  stats?: { tournamentWins?: number };
  team?: { id?: string; slug?: string; name?: string; logo?: string };
}

export interface ProfileTournament {
  id?: string;
  name?: string;
  title?: string;
  game?: string | { id?: string; name?: string; wallPhoto?: string | null };
  date?: string;
  placement?: number | null;
  totalParticipants?: number;
  prizePool?: string | number;
  organizer?: string;
  url?: string;
  status?: "upcoming" | "completed";
  tournament?: {
    id?: string;
    name?: string;
    game?: string;
    organizer?: string;
    prizePool?: string | number;
    source?: "external" | "hosted" | "official";
  };
}

export interface PlayerConnection {
  id: string;
  username: string;
  profileImage?: string;
  gamerTitle?: string;
  isOnline?: boolean;
}
export interface ConnectionPage {
  data: PlayerConnection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface GameRanking {
  game?: ProfileGame | string | null;
  gameId?: string;
  rankingScore?: number;
  rank?: number | string;
}

export interface MatchHistoryEntry extends Record<string, unknown> {
  id?: string;
  type?: "user" | "team";
  game?: string | { id?: string; name?: string; wallPhoto?: string | null };
  opponent?: string;
  opponentIdentity?: string | null;
  opponentUserId?: string | null;
  challengerId?: string;
  challengerName?: string;
  challengedId?: string;
  challengedName?: string;
  result?:
    | string
    | {
        winnerId?: string;
        score?: string;
        notes?: string;
      }
    | null;
  score?: string;
  playerScore?: number | null;
  opponentScore?: number | null;
  verificationSource?:
    "player_listed" | "screenshot" | "challenge" | "organiser" | "official_api" | "tournament";
  verificationTier?: number;
  eventName?: string | null;
  playedAt?: string;
  status?: string;
  scheduledDate?: string;
  date?: string;
  createdAt?: string;
}

export interface MatchHistoryPage {
  data: MatchHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  badge?: { imageUrl?: string; color?: string };
  progress?: { current: number; required: number; percentage: number } | null;
  completed: boolean;
  completedAt?: string | null;
  rewardsClaimed: boolean;
}

export interface AchievementsSummary {
  totalPoints: number;
  completedCount: number;
  totalCount: number;
  achievements: AchievementItem[];
}
