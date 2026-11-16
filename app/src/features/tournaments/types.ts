export type TournamentStatus = "active" | "upcoming" | "ongoing" | "completed";
export type TournamentSource = "external" | "hosted" | "official";
export type SourceFilter = "" | "gamerie" | "external" | "official";
export type HostType = "user" | "team" | "hub" | "gamerie";
export type EntrantType = "player" | "team";
export type HostedFormat = "single_elimination" | "double_elimination" | "round_robin";
export type TournamentPhase =
  | "draft"
  | "registration"
  | "check_in"
  | "awaiting_start"
  | "live"
  | "paused"
  | "completed"
  | "cancelled";

export interface Tournament {
  id: string;
  platform: string;
  game: string;
  name: string;
  description?: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline?: string | null;
  format?: string | null;
  teamSize?: number | null;
  currentTeams?: number | null;
  maxTeams?: number | null;
  region?: string | null;
  organizer?: string | null;
  status?: Exclude<TournamentStatus, "active">;
  image?: string | null;
  source?: TournamentSource;
  hostType?: HostType | null;
  hostLogo?: string | null;
  phase?: TournamentPhase | null;
  entrantType?: EntrantType | null;
  bracketSize?: number | null;
  entrantCount?: number;
}

export interface TournamentFilters {
  search?: string;
  game?: string;
  source?: SourceFilter;
  entrantType?: EntrantType;
  format?: HostedFormat;
  status: TournamentStatus;
}

export interface TournamentPageData {
  tournaments: Tournament[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
