import { api, unwrap, type AdminPage } from "@/lib/api";
import type { DecisionInput, Dispute, LadderDispute, LeagueDispute, TournamentReport } from "./types";

const scores = (score: string | null | undefined) => {
  const [a, b] = (score ?? "").split("-").map((part) => Number(part));
  return Number.isFinite(a) && Number.isFinite(b) ? { scoreA: a, scoreB: b } : null;
};

const fromTournament = (report: TournamentReport): Dispute => ({
  key: `tournament-${report.id}`,
  source: "tournament",
  id: report.id,
  competition: report.tournament && { ...report.tournament },
  context: report.match ? `${report.match.lane === "lower" ? "Lower bracket · " : ""}Round ${report.match.round} · Match ${report.match.number}` : null,
  sideA: report.challenge?.sideA ?? "Side A",
  sideB: report.challenge?.sideB ?? "Side B",
  claimed: scores(report.challenge?.declaredScore),
  reportedBy: report.challenge?.declaredSide ?? null,
  reason: report.reason || null,
  evidenceUrl: null,
  raisedAt: report.createdAt,
});

const fromLadder = (dispute: LadderDispute): Dispute => ({
  key: `ladder-${dispute.id}`,
  source: "ladder",
  id: dispute.id,
  competition: dispute.ladder && { ...dispute.ladder },
  context: null,
  sideA: dispute.challenger.name ?? "Challenger",
  sideB: dispute.challenged.name ?? "Challenged",
  claimed: dispute.result
    ? dispute.result.p1Score != null && dispute.result.p2Score != null
      ? { scoreA: dispute.result.p1Score, scoreB: dispute.result.p2Score }
      : scores(dispute.result.score)
    : null,
  reportedBy: dispute.declaredSide,
  reason: dispute.result?.notes ?? null,
  evidenceUrl: dispute.evidenceUrl,
  raisedAt: dispute.reportedAt ?? dispute.createdAt,
});

const fromLeague = (fixture: LeagueDispute): Dispute => ({
  key: `league-${fixture.id}`,
  source: "league",
  id: fixture.id,
  competition: fixture.league && { ...fixture.league },
  context: fixture.stage === "playoffs" ? "Playoffs" : `Week ${fixture.week}`,
  sideA: fixture.sideA.name,
  sideB: fixture.sideB.name,
  claimed: fixture.scoreA != null && fixture.scoreB != null ? { scoreA: fixture.scoreA, scoreB: fixture.scoreB } : null,
  reportedBy: null,
  reason: fixture.notes,
  evidenceUrl: fixture.evidenceUrl,
  raisedAt: fixture.matchAt,
});

/** Every open dispute across the three competition types, oldest first. One failing source doesn't hide the others. */
export async function listDisputes(): Promise<{ disputes: Dispute[]; failed: string[] }> {
  const [tournaments, ladders, leagues] = await Promise.allSettled([
    unwrap<AdminPage<TournamentReport>>(api.get("/admin/hosted-tournaments/reports", { params: { status: "pending", page: 1, limit: 50 } })),
    unwrap<AdminPage<LadderDispute>>(api.get("/admin/ladders/disputes", { params: { page: 1, limit: 50 } })),
    unwrap<AdminPage<LeagueDispute>>(api.get("/admin/leagues/disputes", { params: { page: 1 } })),
  ]);
  const failed = [tournaments.status === "rejected" && "tournaments", ladders.status === "rejected" && "ladders", leagues.status === "rejected" && "leagues"].filter(Boolean) as string[];
  if (failed.length === 3) throw (tournaments as PromiseRejectedResult).reason;
  const disputes = [
    ...(tournaments.status === "fulfilled" ? tournaments.value.data.map(fromTournament) : []),
    ...(ladders.status === "fulfilled" ? ladders.value.data.map(fromLadder) : []),
    ...(leagues.status === "fulfilled" ? leagues.value.data.map(fromLeague) : []),
  ].sort((a, b) => a.raisedAt.localeCompare(b.raisedAt));
  return { disputes, failed };
}

/** Each source has its own decision endpoint and field names; the desk speaks one shape. */
export async function decide(dispute: Dispute, input: DecisionInput): Promise<void> {
  const notes = input.notes.trim();
  if (dispute.source === "tournament") {
    await api.post(`/admin/hosted-tournaments/reports/${dispute.id}/decision`, { decision: input.decision, scoreA: input.scoreA, scoreB: input.scoreB, notes });
    return;
  }
  if (dispute.source === "ladder") {
    await api.post(`/admin/ladders/disputes/${dispute.id}/resolve`, {
      decision: input.decision,
      challengerScore: input.scoreA,
      challengedScore: input.scoreB,
      notes: notes || undefined,
    });
    return;
  }
  await api.post(`/admin/leagues/disputes/${dispute.id}/resolve`, { decision: input.decision, scoreA: input.scoreA, scoreB: input.scoreB, notes: notes || undefined });
}
