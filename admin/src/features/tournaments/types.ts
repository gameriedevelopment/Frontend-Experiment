export type TournamentPhase = "draft" | "registration" | "check_in" | "awaiting_start" | "live" | "paused" | "completed" | "cancelled";

export interface TournamentRow {
  id: string;
  source: "hosted" | "official";
  official: boolean;
  name: string;
  game: string;
  platform: string;
  region: string | null;
  mode: "online" | "lan";
  banner: string | null;
  host: { type: string | null; id: string | null; name: string | null; logo: string | null };
  format: "single_elimination" | "double_elimination" | "round_robin";
  entrantType: "player" | "team" | null;
  teamSize: number | null;
  entrantCount: number;
  bracketSize: number | null;
  phase: TournamentPhase;
  visibility: "public" | "unlisted";
  startsAt: string | null;
  prize: { total: number; currency: string; description: string } | null;
  publishedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  removedAt?: string | null;
  removedReason?: string | null;
}

export interface TournamentDetail extends TournamentRow {
  description: string;
  registrationMode: "open" | "approval" | "invite" | null;
  seedingMethod: "manual" | "random" | null;
  matchRules: { bestOf: { default: number }; thirdPlaceMatch: boolean; noShowMinutes: number; reportWindowMinutes: number } | null;
  cancelReason: string | null;
}

export interface TournamentQuery {
  page: number;
  limit: number;
  search?: string;
  phase?: string;
  source?: "hosted" | "official";
}

export interface TournamentEntrant {
  id: string;
  kind: "player" | "team";
  name: string;
  avatar: string | null;
  userId: string | null;
  teamId: string | null;
  status: string;
  seed: number | null;
  placement: number | null;
  registeredAt: string;
}

export interface TournamentActivity {
  id: string;
  action: string;
  actorRole: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
