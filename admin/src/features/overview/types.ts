export interface Metric {
  total: number;
  thisMonth: number;
  percentageThisMonth: string;
}

export interface DashboardMetrics {
  users: Metric;
  teams: Metric;
  tournaments: Metric;
  ladders?: Metric;
  leagues?: Metric;
  games: Metric;
}

export interface GrowthPoint {
  name: string;
  users: number;
  newUsers: number;
  activeUsers: number;
}

export interface LiveCompetition {
  kind: "tournament" | "ladder" | "league";
  id: string;
  name: string;
  game: string;
  official: boolean;
  entrants: number;
  /** Open disputes or reports on it, when the list reports them. */
  attention: number;
  endsAt: string | null;
}

export interface WeekOfMatches {
  week: string;
  friendly: number;
  tournament: number;
  ladder: number;
  league: number;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}
