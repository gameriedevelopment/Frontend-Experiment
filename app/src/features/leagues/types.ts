export type LeagueStatus = "draft" | "active" | "archived";
export type LeagueSeasonStatus = "draft" | "registration" | "in_progress" | "playoffs" | "completed" | "cancelled";
export type LeagueView = "active" | "upcoming" | "in_progress" | "completed" | "mine";
export type LeagueEntrantType = "player" | "team";
export type LeagueJoinMode = "open" | "approval" | "hub_members" | "private";
export type LeagueHostType = "hub" | "gamerie";
export type LeagueFormat = "single" | "double";
export type LeaguePlayScope = "own_group" | "other_groups" | "anyone";
export type LeaguePlayoffFormat = "single_elimination" | "double_elimination";
export type LeagueTiebreaker = "head_to_head" | "game_difference" | "games_won" | "wins";
export type LeagueParticipantStatus =
  | "pending_approval"
  | "invited"
  | "active"
  | "withdrawn"
  | "declined"
  | "removed"
  | "finished";
export type LeagueFixtureStatus = "scheduled" | "open" | "reported" | "disputed" | "final" | "forfeit" | "void";

export interface LeaguePrize {
  description: string;
  currency: string;
  total: number;
  places: Array<{ placement: number; amount: number }>;
}

export interface LeagueSeasonSummary {
  id: string;
  number: number;
  status: LeagueSeasonStatus;
  startsAt: string | null;
  endsAt: string | null;
  participantCount: number;
  maxParticipants: number | null;
  prize: { total: number; currency: string } | null;
}

export interface LeagueSummary {
  id: string;
  name: string;
  official: boolean;
  status: LeagueStatus;
  game: { id: string; name: string };
  platform: string;
  region: string | null;
  banner: string | null;
  logo: string | null;
  host: { type: LeagueHostType; id: string | null; name: string; logo: string | null };
  entrantType: LeagueEntrantType;
  teamSize: number | null;
  joinMode: LeagueJoinMode;
  /** Organizers may enter as players. */
  organizersCanPlay?: boolean;
  season: LeagueSeasonSummary | null;
  removed: { at: string; reason: string | null } | null;
  viewer?: { isOrganizer: boolean; entryStatus: LeagueParticipantStatus | null };
}

export interface LeagueSeason {
  id: string;
  number: number;
  status: LeagueSeasonStatus;
  paused: boolean;
  startsAt: string | null;
  endsAt: string | null;
  format: LeagueFormat;
  weekStartDay: number;
  matchDay: number;
  matchTime: string;
  timeZone: string;
  bestOf: 1 | 3 | 5;
  points: { win: number; draw: number; loss: number };
  allowDraws: boolean;
  tiebreakers: LeagueTiebreaker[];
  allowedMaps: string[];
  allowedModes: string[];
  rulesText: string | null;
  groups: { count: number; allocation: "random" | "manual"; playScope: LeaguePlayScope };
  playoffs: { size: number; format: LeaguePlayoffFormat } | null;
  rosterChangesPerWeek: number;
  maxParticipants: number | null;
  participantCount: number;
  prize: LeaguePrize | null;
  weeks: number | null;
  completedAt: string | null;
  championParticipantId: string | null;
}

export interface LeagueViewerEntry {
  id: string;
  kind: LeagueEntrantType;
  status: LeagueParticipantStatus;
  teamId?: string | null;
}

export interface LeagueDetail extends Omit<LeagueSummary, "viewer"> {
  description: string | null;
  substitutes: number;
  ownerId: string | null;
  currentSeasonId: string | null;
  archivedAt: string | null;
  selectedSeason: LeagueSeason | null;
  viewer: { isOrganizer: boolean; canCreateSeason: boolean; draftSeasonId: string | null; entry: LeagueViewerEntry | null };
}

export interface LeaguePage {
  items: LeagueSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeagueFilters {
  view: LeagueView;
  search?: string;
  game?: string;
  platform?: string;
  region?: string;
  entrantType?: LeagueEntrantType;
  joinMode?: LeagueJoinMode;
  hostType?: LeagueHostType;
  official?: boolean;
}

export interface LeagueHostingOptions {
  hubs: Array<{ type: "hub"; id: string; name: string; logo: string | null }>;
  canCreate: boolean;
  creationLocked: boolean;
}

export interface LeagueParticipant {
  id: string;
  kind: LeagueEntrantType;
  userId: string | null;
  teamId: string | null;
  displayName: string;
  avatar: string | null;
  status: LeagueParticipantStatus;
  groupId: string | null;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gameDifference: number;
  forfeits: number;
  finalPlace: number | null;
  joinedAt: string | null;
}

export interface LeagueStandingRow extends LeagueParticipant {
  rank: number;
  tied: boolean;
  gamesWon: number;
  gamesLost: number;
  playoffSeat: boolean;
}

export interface LeagueStandings {
  perGroup: boolean;
  groups: Array<{ id: string; name: string }>;
  rows: LeagueStandingRow[];
  groupTotals: Array<{ groupId: string | null; points: number; played: number }> | null;
}

export interface LeagueChampion {
  id: string;
  name: string;
  avatar: string | null;
  kind: LeagueEntrantType;
  userId: string | null;
  teamId: string | null;
}

export interface LeagueFixtureSide {
  participantId: string;
  name: string;
  avatar: string | null;
  kind: LeagueEntrantType;
  userId: string | null;
  teamId: string | null;
}

export interface LeagueFixture {
  id: string;
  stage: "regular" | "playoffs";
  week: number;
  groupId: string | null;
  bracketKey: string | null;
  status: LeagueFixtureStatus;
  sideA: LeagueFixtureSide;
  sideB: LeagueFixtureSide;
  defaultAt: string;
  agreedAt: string | null;
  proposedAt: string | null;
  proposedBy: "a" | "b" | null;
  matchAt: string;
  scoreA: number | null;
  scoreB: number | null;
  winner: "a" | "b" | "draw" | null;
  forfeitedBy: "a" | "b" | "both" | null;
  challengeId: string | null;
  ready: { a: boolean; b: boolean };
  reportWindowEndsAt: string | null;
  declaredBy: "a" | "b" | null;
  viewerSide: "a" | "b" | null;
}

export interface LeagueBracketMatch {
  key: string;
  lane: "upper" | "lower" | "grand_final" | "third_place" | "group";
  round: number;
  position: number;
  status: string;
  sides: Array<{
    participantId: string | null;
    name: string | null;
    kind: LeagueEntrantType | null;
    userId: string | null;
    teamId: string | null;
    state: string;
  }>;
  winnerParticipantId: string | null;
  fixtureId: string | null;
  fixtureStatus: LeagueFixtureStatus | null;
  score: string | null;
  matchAt: string | null;
}

export interface LeaguePlayoffs {
  format: LeaguePlayoffFormat | null;
  size: number | null;
  matches: LeagueBracketMatch[] | null;
}

export interface LeagueSeasonListItem {
  id: string;
  number: number;
  status: LeagueSeasonStatus;
  startsAt: string | null;
  endsAt: string | null;
  completedAt: string | null;
  participantCount: number;
  champion: LeagueChampion | null;
}

export interface LeagueGroup {
  id: string;
  name: string;
  order: number;
  participantIds: string[];
}

export interface LeagueActivity {
  id: string;
  createdAt: string;
  seasonId: string | null;
  actorId: string | null;
  actorRole: string;
  action: string;
  subjectId: string | null;
  details: Record<string, unknown> | null;
}

export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LeagueRoster {
  members: Array<{ userId: string; displayName: string; role: "player" | "substitute"; addedAt: string }>;
  teamSize: number | null;
  substitutes: number;
  canManage: boolean;
  nextAdditionAt: string | null;
}

export interface LeagueEntryInput {
  teamId?: string;
  starterUserIds?: string[];
  substituteUserIds?: string[];
}

export interface LeagueResultLeague {
  id: string;
  name: string;
  game: string;
  logo: string | null;
  banner: string | null;
  official: boolean;
  host: { type: string; name: string };
  entrantType: LeagueEntrantType;
  season: { id: string; number: number; entrants: number; endedAt: string | null };
}

export interface LeagueFinish {
  league: LeagueResultLeague;
  place: number;
  points: number;
  record: { played: number; won: number; drawn: number; lost: number };
  team: { id: string; name: string } | null;
}

export interface LeagueHostedSeason {
  league: LeagueResultLeague;
  champion: LeagueChampion | null;
}

export interface LeagueLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  score: number;
  titles: number;
  podiums: number;
  best: number;
  record: { won: number; drawn: number; lost: number };
  seasons: number;
}

/** Draft settings, section by section, as the API takes them. */
export interface LeagueBasicsInput {
  hubId?: string;
  name: string;
  gameId: string;
  platform: string;
  region?: string;
  description?: string;
}

export interface LeagueFormatInput {
  entrantType: LeagueEntrantType;
  teamSize?: number;
  substitutes?: number;
  format: LeagueFormat;
  groupCount: number;
  groupAllocation: "random" | "manual";
  playScope: LeaguePlayScope;
}

export interface LeagueScheduleInput {
  startsAt: string;
  endsAt: string;
  weekStartDay: number;
  matchDay: number;
  matchTime: string;
  timeZone: string;
}

export interface LeagueRulesInput {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  allowDraws: boolean;
  bestOf: 1 | 3 | 5;
  tiebreakers: LeagueTiebreaker[];
  allowedMaps: string[];
  allowedModes: string[];
  rulesText?: string;
}

export interface LeaguePlayoffsInput {
  size: number | null;
  format: LeaguePlayoffFormat | null;
}

export interface LeagueJoiningInput {
  joinMode: LeagueJoinMode;
  maxParticipants: number | null;
  rosterChangesPerWeek: number;
  organizersCanPlay?: boolean;
}

export interface SaveLeagueDraftInput {
  basics?: LeagueBasicsInput;
  format?: LeagueFormatInput;
  schedule?: LeagueScheduleInput;
  rules?: LeagueRulesInput;
  playoffs?: LeaguePlayoffsInput;
  joining?: LeagueJoiningInput;
  prize?: LeaguePrize | null;
}

export interface UpdateLeagueInput {
  name?: string;
  description?: string;
  region?: string;
  rulesText?: string;
  organizersCanPlay?: boolean;
  prize?: LeaguePrize | null;
}
