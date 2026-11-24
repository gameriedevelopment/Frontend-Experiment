import { api, unwrap, type AdminPage } from "@/lib/api";
import type { AuditEntry, DashboardMetrics, GrowthPoint, LiveCompetition, WeekOfMatches } from "./types";

export const getMetrics = () => unwrap<DashboardMetrics>(api.get("/admin/dashboard-metrics"));

export const getGrowth = () => unwrap<GrowthPoint[]>(api.get("/admin/user-growth"));

export const getMatchesByWeek = () => unwrap<WeekOfMatches[]>(api.get("/admin/competitions/matches-by-week", { params: { weeks: 12 } }));

export const getRecentActivity = () => unwrap<AdminPage<AuditEntry>>(api.get("/admin/audit-logs", { params: { page: 1, limit: 8 } }));

type TournamentRow = { id: string; name: string; game: string; official: boolean; entrantCount: number; completedAt: string | null };
type LadderRow = { id: string; name: string; game: string; official: boolean; participantCount: number; openDisputes: number; endsAt: string | null };
type LeagueRow = {
  id: string;
  name: string;
  official: boolean;
  game: { name: string };
  openDisputes?: number;
  season: { participantCount: number; endsAt: string | null } | null;
};

/** What is being played right now, across the three competition types. */
export async function getLiveCompetitions(): Promise<LiveCompetition[]> {
  const settled = await Promise.allSettled([
    unwrap<AdminPage<TournamentRow>>(api.get("/admin/hosted-tournaments", { params: { page: 1, limit: 6, phase: "live" } })),
    unwrap<AdminPage<LadderRow>>(api.get("/admin/ladders", { params: { page: 1, limit: 6, status: "in_progress" } })),
    unwrap<AdminPage<LeagueRow>>(api.get("/admin/leagues", { params: { page: 1, limit: 6, status: "in_progress" } })),
  ]);
  // One failing list shouldn't hide the other two.
  if (settled.every((result) => result.status === "rejected")) throw (settled[0] as PromiseRejectedResult).reason;
  const rows = <T,>(result: PromiseSettledResult<AdminPage<T>>) => (result.status === "fulfilled" ? result.value.data : []);
  const [tournaments, ladders, leagues] = [rows(settled[0]), rows(settled[1]), rows(settled[2])] as [TournamentRow[], LadderRow[], LeagueRow[]];
  return [
    ...tournaments.map((row) => ({
      kind: "tournament" as const,
      id: row.id,
      name: row.name,
      game: row.game,
      official: row.official,
      entrants: row.entrantCount,
      attention: 0,
      endsAt: null,
    })),
    ...ladders.map((row) => ({
      kind: "ladder" as const,
      id: row.id,
      name: row.name,
      game: row.game,
      official: row.official,
      entrants: row.participantCount,
      attention: row.openDisputes ?? 0,
      endsAt: row.endsAt,
    })),
    ...leagues.map((row) => ({
      kind: "league" as const,
      id: row.id,
      name: row.name,
      game: row.game.name,
      official: row.official,
      entrants: row.season?.participantCount ?? 0,
      attention: row.openDisputes ?? 0,
      endsAt: row.season?.endsAt ?? null,
    })),
  ].sort((a, b) => b.attention - a.attention || b.entrants - a.entrants);
}
