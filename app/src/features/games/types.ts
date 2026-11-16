export type GameProviderId =
  | "lichess"
  | "clash-royale"
  | "clash-of-clans"
  | "brawl-stars"
  | "league-of-legends"
  | "valorant"
  | "teamfight-tactics"
  | "pubg"
  | "dota-2"
  | "cs2"
  | "steam"
  | "battlenet";

export interface GameConnection {
  id: string;
  provider: GameProviderId;
  providerAccountId: string;
  handle: string | null;
  metadata: Record<string, unknown> | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameOption {
  id: string;
  name: string;
  gameType?: string;
}

export interface GamesPage {
  data: GameOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
