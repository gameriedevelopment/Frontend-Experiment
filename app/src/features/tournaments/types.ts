export type TournamentStatus = "active" | "upcoming" | "ongoing" | "completed";
export type TournamentSource = "external" | "hosted" | "official";
export type SourceFilter = "" | "gamerie" | "external" | "official";

export interface TournamentCardViewer {
  isOrganizer: boolean;
  entrantStatus: EntrantStatus | null;
  waitlistPosition: number | null;
  checkedIn: boolean;
}

export interface Tournament {
  id: string;
  platform: string;
  platformUrl?: string | null;
  game: string;
  name: string;
  description?: string | null;
  startDate: string | null;
  endDate: string | null;
  prizePool?: number | null;
  registrationDeadline?: string | null;
  format?: string | null;
  teamSize?: number | null;
  currentTeams?: number | null;
  maxTeams?: number | null;
  region?: string | null;
  organizer?: string | null;
  totalParticipants?: number | null;
  skillLevel?: string | null;
  status?: Exclude<TournamentStatus, "active">;
  image?: string | null;
  source?: TournamentSource;
  hostType?: HostType | null;
  hostLogo?: string | null;
  phase?: TournamentPhase | null;
  viewer?: TournamentCardViewer | null;
  entrantType?: EntrantType | null;
  bracketSize?: number | null;
  entrantCount?: number;
  matchRules?: { bestOf?: { default: number } } | null;
  prize?: TournamentPrize | null;
}

export interface TournamentFilters {
  search?: string;
  game?: string;
  platform?: string;
  region?: string;
  skillLevel?: string;
  prizeMin?: number;
  teamSize?: number;
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

export interface TournamentFacets {
  platforms: string[];
  regions: string[];
  skillLevels: string[];
  teamSizes: number[];
}

export type RegistrationState = "open" | "closing" | "full" | "closed" | "started" | "completed";

export interface TournamentTiming {
  lifecycle: "upcoming" | "ongoing" | "completed";
  registration: RegistrationState;
  registrationLabel: string;
}

/* Hosted tournaments */

export type HostType = "user" | "team" | "hub" | "gamerie";
export type EntrantType = "player" | "team";
export type HostedFormat = "single_elimination" | "double_elimination" | "round_robin";
export type GrandFinalMode = "single" | "extended_series" | "reset";
export type Tiebreaker = "head_to_head" | "game_difference" | "games_won" | "wins";
export type TournamentPhase =
  | "draft"
  | "registration"
  | "check_in"
  | "awaiting_start"
  | "live"
  | "paused"
  | "completed"
  | "cancelled";

export interface TournamentPrize {
  description: string;
  currency: string;
  total: number;
  split?: Array<{ placement: number; amount: number }>;
}

export interface TournamentHost {
  type: HostType | null;
  id: string | null;
  name: string | null;
  logo: string | null;
}

export interface HostedTournamentSummary {
  id: string;
  source: TournamentSource;
  official: boolean;
  name: string;
  game: string;
  gameId: string | null;
  platform: string;
  region: string | null;
  mode: "online" | "lan";
  banner: string | null;
  host: TournamentHost;
  format: HostedFormat;
  entrantType: EntrantType | null;
  teamSize: number | null;
  bestOf: number | null;
  entrantCount: number;
  bracketSize: number | null;
  phase: TournamentPhase;
  visibility: "public" | "unlisted";
  startsAt: string | null;
  registrationClosesAt: string | null;
  checkInOpensAt: string | null;
  checkInClosesAt: string | null;
  prize: Pick<TournamentPrize, "total" | "currency" | "description"> | null;
  publishedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  isOrganizer?: boolean;
}

export interface TournamentMatchRules {
  bestOf: { default: number; rounds?: Record<string, number> };
  thirdPlaceMatch: boolean;
  grandFinalMode: GrandFinalMode;
  groupCount: number;
  doubleRoundRobin: boolean;
  points: { win: number; draw: number; loss: number };
  allowDraws: boolean;
  tiebreakers: Tiebreaker[];
  noShowMinutes: number;
  reportWindowMinutes: number;
  replayDeadlineMinutes: number;
  screenshotRequired: boolean;
  rulesText: string;
}

export interface TournamentScheduleSettings {
  roundMode: "fixed" | "deadline";
  roundIntervalMinutes: number;
  checkInOpensMinutesBefore: number;
  checkInClosesMinutesBefore: number;
}

export interface TournamentEligibility {
  minRankingScore: number | null;
  maxRankingScore: number | null;
  regions: string[];
  minRosterSize: number | null;
}

export type EntrantStatus =
  | "pending_approval"
  | "invited"
  | "registered"
  | "waitlisted"
  | "checked_in"
  | "active"
  | "eliminated"
  | "disqualified"
  | "withdrawn"
  | "declined"
  | "removed"
  | "finished";

export interface TournamentViewer {
  isOrganizer: boolean;
  entrant: {
    id: string;
    status: EntrantStatus;
    kind: EntrantType;
    teamId: string | null;
    displayName: string;
    canAct: boolean;
    waitlistPosition: number | null;
    checkedInAt: string | null;
  } | null;
  canRegister: boolean;
  registrationBlocker: string | null;
}

export interface HostedTournamentDetail extends HostedTournamentSummary {
  description: string;
  venue: { name: string; address: string; stations: number } | null;
  substitutes: number;
  minEntrants: number | null;
  seedingMethod: "manual" | "random";
  registrationMode: "open" | "approval" | "invite";
  eligibility: TournamentEligibility | null;
  matchRules: TournamentMatchRules | null;
  schedule: TournamentScheduleSettings | null;
  prize: TournamentPrize | null;
  pausedAt: string | null;
  cancelReason: string | null;
  ownerId: string | null;
  viewer: TournamentViewer;
}

export interface HostingOption {
  type: "user" | "team" | "hub";
  id: string;
  name: string;
  logo: string | null;
}

export interface HostingOptions {
  canHost: boolean;
  restriction: { kind: "locked" | "banned"; reason: string; since: string } | null;
  hosts: HostingOption[];
}

export type BracketLane = "upper" | "lower" | "grand_final" | "third_place" | "group";
export type MatchStatus =
  | "pending"
  | "ready"
  | "scheduled"
  | "live"
  | "result_pending"
  | "disputed"
  | "completed"
  | "bye"
  | "void"
  | "cancelled";

export interface MatchSide {
  entrantId: string | null;
  state: "pending" | "filled" | "empty";
  score: number | null;
}

export interface BracketMatch {
  id: string;
  number: number;
  lane: BracketLane;
  round: number;
  position: number;
  groupIndex: number | null;
  label: string;
  bestOf: number;
  status: MatchStatus;
  isResetMatch: boolean;
  sideA: MatchSide;
  sideB: MatchSide;
  winnerEntrantId: string | null;
  winnerTo: { matchId: string | null; slot: "a" | "b" | null } | null;
  loserTo: { matchId: string | null; slot: "a" | "b" | null } | null;
  opensAt: string | null;
  scheduledAt: string | null;
  deadlineAt: string | null;
  resolution: "result" | "accepted" | "forfeit" | "admin" | "disqualification" | "bye" | null;
  forfeitedBy: "a" | "b" | "both" | null;
  station: number | null;
  timeProposal: { proposedByEntrantId: string; scheduledAt: string; note: string | null } | null;
  challenge: {
    id: string;
    status: string;
    readyA: boolean;
    readyB: boolean;
    declaredSide: "a" | "b" | null;
    declaredBy: string | null;
    provisional: { scoreA: number | null; scoreB: number | null } | null;
    reportWindowEndsAt: string | null;
    replayOfId: string | null;
  } | null;
}

export interface BracketEntrant {
  id: string;
  name: string;
  avatar: string | null;
  kind: EntrantType;
  userId: string | null;
  teamId: string | null;
  seed: number | null;
  status: EntrantStatus;
  placement: number | null;
}

export interface StandingRow {
  entrantId: string;
  groupIndex: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  points: number;
  rank: number;
  tied: boolean;
}

export interface TournamentBracket {
  stage: {
    id: string;
    type: HostedFormat;
    size: number;
    status: "live" | "completed" | "cancelled";
    groups: string[][] | null;
    grandFinalMode: GrandFinalMode | null;
  } | null;
  rounds: Array<{
    lane: BracketLane;
    round: number;
    label: string;
    bestOf: number;
    groupIndex: number | null;
  }>;
  matches: BracketMatch[];
  entrants: BracketEntrant[];
  standings: StandingRow[] | null;
  podium: Array<{ placement: number; entrantId: string }>;
}

export interface TournamentParticipant {
  id: string;
  kind: EntrantType;
  name: string;
  avatar: string | null;
  userId: string | null;
  teamId: string | null;
  status: EntrantStatus;
  seed: number | null;
  waitlistPosition: number | null;
  checkedInAt: string | null;
  placement: number | null;
  statusReason: string | null;
  registeredAt: string;
  roster: Array<{ userId: string; name: string; role: "player" | "substitute" }>;
}

export interface ManageOverview {
  phase: TournamentPhase;
  counts: {
    registered: number;
    checkedIn: number;
    waitlisted: number;
    pending: number;
    invited: number;
  };
  matches: { live: number; scheduled: number; awaitingResult: number; disputed: number };
  needsTime: Array<{ id: string; number: number; deadlineAt: string | null; overdue: boolean }>;
  reports: Array<{
    id: string;
    matchId: string | null;
    status: "pending" | "resolved" | "dismissed";
    reason: string;
    createdAt: string;
    waitingMs: number | null;
  }>;
  canStart: boolean;
}

export interface ActivityEntry {
  id: string;
  actorId: string | null;
  actorRole: "owner" | "admin" | "participant" | "system";
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
}

export interface TournamentLeaderRow {
  rank: number;
  id: string;
  name: string | null;
  avatar: string | null;
  played: number;
  wins: number;
  podiums: number;
  bestPlacement: number;
  points: number;
}

/* Create flow payloads */

export interface BasicsSection {
  hostType: "user" | "team" | "hub";
  hostId?: string;
  name: string;
  gameId: string;
  platform: string;
  region: string;
  description?: string;
  mode: "online" | "lan";
  venue?: { name: string; address: string; stations: number };
}

export interface FormatSection {
  entrantType: EntrantType;
  teamSize?: number;
  substitutes?: number;
  format: HostedFormat;
  bracketSize: number;
  seedingMethod: "manual" | "random";
  minEntrants: number;
  groupCount?: number;
  doubleRoundRobin?: boolean;
}

export interface RulesSection {
  bestOf: { default: number; rounds?: Record<string, number> };
  thirdPlaceMatch: boolean;
  grandFinalMode: GrandFinalMode;
  points: { win: number; draw: number; loss: number };
  allowDraws: boolean;
  tiebreakers: Tiebreaker[];
  noShowMinutes: number;
  reportWindowMinutes: number;
  replayDeadlineMinutes: number;
  rulesText?: string;
}

export interface RegistrationSection {
  registrationMode: "open" | "approval" | "invite";
  eligibility?: {
    minRankingScore?: number | null;
    maxRankingScore?: number | null;
    regions?: string[];
    minRosterSize?: number | null;
  };
  registrationClosesAt: string;
  checkInOpensMinutesBefore: number;
  checkInClosesMinutesBefore: number;
}

export interface ScheduleSection {
  startsAt: string;
  roundMode: "fixed" | "deadline";
  roundIntervalMinutes: number;
  prize?: {
    description: string;
    currency: string;
    total: number;
    split: Array<{ placement: number; amount: number }>;
  } | null;
}

export interface DraftPayload {
  basics?: BasicsSection;
  format?: FormatSection;
  rules?: RulesSection;
  registration?: RegistrationSection;
  schedule?: ScheduleSection;
}
