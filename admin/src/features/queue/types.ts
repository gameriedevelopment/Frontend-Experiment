export interface QueueLane {
  count: number;
  oldestAt: string | null;
}

export interface QueueSummary {
  reports: QueueLane;
  tournamentReports: QueueLane;
  ladderDisputes: QueueLane;
  leagueDisputes: QueueLane;
  total: number;
  generatedAt: string;
}

export type QueueLaneKey = "reports" | "tournamentReports" | "ladderDisputes" | "leagueDisputes";
