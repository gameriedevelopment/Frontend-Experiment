export interface CommunityGame {
  id?: string;
  name: string;
  platforms?: string[];
}

export interface CommunityUser {
  id: string;
  gamerieId?: string | number;
  username?: string;
  displayName?: string;
  profileImage?: string;
  gamerTitle?: string;
  isOnline?: boolean;
}

export interface CommunityMember {
  id?: string;
  userId?: string;
  role?: string;
  title?: string;
  joinedAt?: string;
  isActive?: boolean;
  user?: CommunityUser;
}

interface CommunitySummary {
  id: string;
  ownerId?: string;
  name: string;
  slug?: string;
  logo?: string;
  backgroundImage?: string;
  description?: string;
  region?: string;
  country?: string;
  platforms?: string[];
  games?: CommunityGame[];
  members?: CommunityMember[];
  membersCount?: number;
  followersCount?: number;
}

export interface TeamSummary extends CommunitySummary {
  level?: string;
  /** The current user's role and title on this team, when listed for a user. */
  role?: string;
  title?: string;
  stats?: {
    wins?: number;
    losses?: number;
    matchesPlayed?: number;
    winRate?: number;
    tournamentWins?: number;
    ranking?: number;
  };
}

export interface HubSummary extends CommunitySummary {
  type?: string;
  visibility?: string;
  joinPolicy?: string;
  teamsCount?: number;
}

export interface CommunityInvite<T extends TeamSummary | HubSummary> {
  id: string;
  message?: string;
  createdAt?: string;
  team?: T;
  hub?: T;
}

export type CommunityKind = "team" | "hub";
