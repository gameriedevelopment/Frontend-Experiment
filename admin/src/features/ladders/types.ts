export type LadderStatus = "draft" | "upcoming" | "in_progress" | "completed" | "archived";

export interface LadderRow {
  id: string;
  name: string;
  status: LadderStatus;
  official: boolean;
  game: string;
  platform: string;
  region: string | null;
  banner: string | null;
  host: { type: string; name: string };
  entrantType: "player" | "team";
  participantCount: number;
  maxParticipants: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  organizer: { id: string; username: string; avatar: string | null } | null;
  openDisputes: number;
  removed: { at: string; reason: string | null } | null;
}

export interface LadderQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  source?: "official" | "hosted";
}

export interface LadderDetail {
  id: string;
  name: string;
  status: LadderStatus;
  official: boolean;
  game: { id: string; name: string };
  platform: string;
  region: string | null;
  banner: string | null;
  host: { type: string; id: string; name: string; logo: string | null };
  entrantType: "player" | "team";
  teamSize: number | null;
  participantCount: number;
  maxParticipants: number | null;
  joinMode: string;
  startsAt: string | null;
  endsAt: string | null;
  description: string;
  points: { win: number; draw: number; loss: number };
  allowDraws: boolean;
  bestOf: number;
  groups: { count: number };
  prize: { total: number; currency: string } | null;
  removed: { at: string; reason: string | null } | null;
  organizer: { id: string; username: string; email: string; avatar: string | null } | null;
  participantsByStatus: Record<string, number>;
  matches: { completed: number; open: number; disputed: number };
  activity: Array<{ id: string; action: string; actorRole: string; actor: string | null; details: Record<string, unknown> | null; createdAt: string }>;
}

export interface LadderEntrant {
  id: string;
  name: string;
  avatar: string | null;
  kind: "player" | "team";
  status: string;
  groupId: string | null;
  points: number;
  played: number;
  rematchLocks: number;
}

export interface LadderEntrants {
  groups: Array<{ id: string; name: string }>;
  participants: LadderEntrant[];
}

export type LadderMatchFilter = "open" | "final" | "disputed" | "cancelled";

export interface LadderMatch {
  id: string;
  status: string;
  scheduledAt: string;
  finalAt: string | null;
  challenger: { participantId: string; name: string };
  challenged: { participantId: string; name: string };
  result: { winnerParticipantId: string; challengerScore: number | null; challengedScore: number | null } | null;
}
