export type LadderStatus = "draft" | "upcoming" | "in_progress" | "completed" | "archived";
export type LadderView = "active" | "upcoming" | "in_progress" | "completed" | "mine";
export type LadderEntrantType = "player" | "team";
export type LadderJoinMode = "open" | "approval" | "hub_members" | "private";
export type LadderHostType = "user" | "team" | "hub" | "gamerie";

export interface LadderSummary {
  id: string;
  name: string;
  official: boolean;
  status: LadderStatus;
  game: { id: string; name: string };
  platform: string;
  region: string | null;
  banner: string | null;
  logo: string | null;
  host: {
    type: LadderHostType;
    id: string;
    name: string;
    logo: string | null;
  };
  entrantType: LadderEntrantType;
  participantCount: number;
  maxParticipants: number | null;
  joinMode: LadderJoinMode;
  startsAt: string | null;
  endsAt: string | null;
  prize: { total: number; currency: string; places: number } | null;
}

export interface LadderDetail extends Omit<LadderSummary, "prize"> {
  description: string;
  ownerId: string;
  teamSize: number | null;
  substitutes: number;
  allowedMaps: string[];
  allowedModes: string[];
  allowDraws: boolean;
  points: { win: number; draw: number; loss: number };
  bestOf: number;
  rematchWaitDays: number;
  minimumMatchesForPrizes: number;
  groups: {
    count: number;
    allocation: "random" | "manual";
    playScope: "own_group" | "other_groups" | "anyone";
  };
  prize: {
    description: string;
    currency: string;
    total: number;
    places: Array<{ placement: number; amount: number }>;
  } | null;
  rulesText: string;
  viewer: {
    isOrganizer: boolean;
    isParticipant: boolean;
    participant: {
      id: string;
      kind: LadderEntrantType;
      userId: string | null;
      teamId: string | null;
      status: LadderParticipantStatus;
    } | null;
  };
}

export interface LadderFilters {
  view: LadderView;
  search?: string;
  gameId?: string;
  platform?: string;
  region?: string;
  entrantType?: LadderEntrantType;
  joinMode?: LadderJoinMode;
  hostType?: LadderHostType;
  official?: boolean;
}

export interface LadderPageData {
  items: LadderSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LadderHostingOptions {
  user: { type: "user"; id: string; name: string; logo: string | null };
  teams: Array<{ type: "team"; id: string; name: string; logo: string | null }>;
  hubs: Array<{ type: "hub"; id: string; name: string; logo: string | null }>;
  activeUserLadders: number;
  activeUserLadderLimit: number;
  canCreateUserOrTeamLadder: boolean;
}

export interface LadderBasicsInput {
  hostType: Exclude<LadderHostType, "gamerie">;
  hostId?: string;
  name: string;
  gameId: string;
  platform: string;
  region?: string;
  description?: string;
}

export interface LadderFormatInput {
  entrantType: LadderEntrantType;
  teamSize?: number;
  substitutes?: number;
  groupCount: number;
  groupAllocation: "random" | "manual";
  playScope: "own_group" | "other_groups" | "anyone";
}

export interface LadderRulesInput {
  winPoints: number;
  drawPoints: number;
  allowDraws: boolean;
  bestOf: 1 | 3 | 5;
  rematchWaitDays: number;
  minimumMatchesForPrizes: number;
  allowedMaps: string[];
  allowedModes: string[];
  rulesText?: string;
}

export interface LadderJoiningInput {
  joinMode: LadderJoinMode;
  maxParticipants?: number | null;
}

export interface LadderDatesPrizeInput {
  startsAt: string;
  endsAt: string;
  prize?: {
    description: string;
    currency: string;
    total: number;
    places: Array<{ placement: number; amount: number }>;
  } | null;
}

export interface SaveLadderDraftInput {
  basics?: LadderBasicsInput;
  format?: LadderFormatInput;
  rules?: LadderRulesInput;
  joining?: LadderJoiningInput;
  datesAndPrize?: LadderDatesPrizeInput;
}

export type LadderParticipantStatus =
  | "pending_approval"
  | "invited"
  | "active"
  | "inactive"
  | "withdrawn"
  | "declined"
  | "removed"
  | "finished";

export interface LadderParticipant {
  id: string;
  kind: LadderEntrantType;
  userId: string | null;
  teamId: string | null;
  displayName: string;
  avatar: string | null;
  status: LadderParticipantStatus;
  groupId: string | null;
  joinedAt: string | null;
}

export interface LadderStanding extends LadderParticipant {
  place: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
}

export interface LadderChallenge {
  id: string;
  status: string;
  challengerId: string | null;
  challengerName: string | null;
  challengedId: string | null;
  challengedName: string | null;
  challengerTeamId: string | null;
  challengerTeamName: string | null;
  challengedTeamId: string | null;
  challengedTeamName: string | null;
  ladderChallengerParticipantId: string;
  ladderChallengedParticipantId: string;
  scheduledDate: string;
  answerDeadlineAt: string | null;
  playDeadlineAt: string | null;
  reportWindowEndsAt: string | null;
  declaredSide: "a" | "b" | null;
  result: { winnerId: string; score: string; p1Score?: number; p2Score?: number } | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface LadderGroup {
  id: string;
  name: string;
  order: number;
  participantCount: number;
}

export interface LadderActivity {
  id: string;
  actorId: string | null;
  actorRole: string;
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  details: { title?: string; message?: string; count?: number; notes?: string | null } | null;
  createdAt: string;
}

export interface LadderEntryInput {
  teamId?: string;
  starterUserIds?: string[];
  substituteUserIds?: string[];
}
