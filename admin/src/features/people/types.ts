export interface PeopleSummary {
  users: { total: number; new7d: number; active7d: number; banned: number; unverified: number; reported: number };
  teams: { total: number; new7d: number; banned: number; reported: number };
  hubs: { total: number; new7d: number; banned: number; reported: number; organizations: number };
}

export interface AuditTrailEntry {
  id: string;
  actor: string | null;
  action: string;
  reason: string;
  createdAt: string;
}

export interface ReportSummary {
  id: string;
  contentType: string;
  contentId: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
}

export type CompetitionKind = "tournament" | "ladder" | "league";

export interface CompetitionEntry {
  kind: CompetitionKind;
  id: string;
  name: string;
  game: string | null;
  status: string;
  placement: number | null;
  as: "player" | "team";
  enteredAt: string;
}

export interface HostedCompetition {
  kind: CompetitionKind;
  id: string;
  name: string;
  game: string | null;
  status: string;
  createdAt: string;
}

export interface MemberRow {
  id: string;
  username: string;
  gamerieId: string | null;
  profileImage: string | null;
  role: string;
  title: string | null;
  joinedAt: string | null;
  isBanned: boolean;
}

export interface SearchResult {
  kind: "user" | "team" | "hub" | CompetitionKind;
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  flagged: boolean;
}

export interface Owner {
  id: string;
  username: string;
  profileImage: string | null;
}
