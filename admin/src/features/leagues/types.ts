export type LeagueSeasonStatus = "draft" | "registration" | "in_progress" | "playoffs" | "completed" | "cancelled";
export type SeasonControl = "start" | "pause" | "resume" | "end";

export interface LeagueRow {
  id: string;
  name: string;
  official: boolean;
  status: "draft" | "active" | "archived";
  game: { id: string; name: string };
  platform: string;
  region: string | null;
  banner: string | null;
  logo: string | null;
  host: { type: "hub" | "gamerie"; id: string | null; name: string; logo: string | null };
  entrantType: "player" | "team";
  season: {
    id: string;
    number: number;
    status: LeagueSeasonStatus;
    startsAt: string | null;
    endsAt: string | null;
    participantCount: number;
    maxParticipants: number | null;
  } | null;
  removed: { at: string; reason: string | null } | null;
  openDisputes?: number;
}

export interface LeagueQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  source?: "official" | "hosted";
}

export interface LeagueSeason {
  id: string;
  number: number;
  status: LeagueSeasonStatus;
  paused: boolean;
  startsAt: string | null;
  endsAt: string | null;
  format: "single" | "double";
  matchDay: number;
  matchTime: string;
  timeZone: string;
  bestOf: number;
  points: { win: number; draw: number; loss: number };
  allowDraws: boolean;
  groups: { count: number };
  playoffs: { size: number; format: string | null } | null;
  maxParticipants: number | null;
  participantCount: number;
  prize: { total: number; currency: string } | null;
  weeks: number | null;
  completedAt: string | null;
}

export interface LeagueDetail extends LeagueRow {
  description: string | null;
  organizer: { id: string; username: string; email: string; avatar: string | null } | null;
  seasons: LeagueSeason[];
  currentSeason: LeagueSeason | null;
  participantsByStatus: Record<string, number>;
  fixturesByStatus: Record<string, number>;
  activity: Array<{ id: string; action: string; actorRole: string; details: Record<string, unknown> | null; createdAt: string }>;
}

export interface LeagueFixture {
  id: string;
  stage: "regular" | "playoffs";
  week: number;
  status: string;
  sideA: { participantId: string; name: string };
  sideB: { participantId: string; name: string };
  matchAt: string;
  scoreA: number | null;
  scoreB: number | null;
  winner: "a" | "b" | "draw" | null;
}
