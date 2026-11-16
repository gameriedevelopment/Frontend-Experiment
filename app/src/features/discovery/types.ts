import type { PlayerProfile } from "@/features/profile/types";

export interface PlayerFilters {
  search?: string;
  gameLevel?: string;
  platform?: string;
  game?: string;
  region?: string;
  includeCurrentUser?: boolean;
}

export interface PlayerPage {
  data: PlayerProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SearchKind = "players" | "teams";

export interface SearchTeam {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  level?: string;
  members?: Array<{ id: string }>;
}

export interface SearchPage<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
