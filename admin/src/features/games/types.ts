export interface GameRow {
  id: string;
  name: string;
  integrationKey: string | null;
  matchVerificationAdapter: string | null;
  wallPhoto: string | null;
  description: string;
  company: string;
  gameType: string;
  gameModes: string[];
  requiredSkills: string[];
  platforms: string[];
  officialWebsite: string;
  usersCount: number;
  teamsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type GameCoverage = "live" | "verified" | "unplayed";

export interface GameQuery {
  page: number;
  limit: number;
  search?: string;
  platform?: string;
  coverage?: GameCoverage;
  sort?: "name" | "popular";
}

export interface GameSummary {
  counts: { total: number; live: number; verified: number; unplayed: number };
  integrationKeys: string[];
  verificationAdapters: string[];
}

export interface GameInput {
  name: string;
  company: string;
  gameType: string;
  description: string;
  platforms: string[];
  gameModes: string[];
  requiredSkills: string[];
  officialWebsite: string;
  integrationKey: string;
  matchVerificationAdapter: string;
}
