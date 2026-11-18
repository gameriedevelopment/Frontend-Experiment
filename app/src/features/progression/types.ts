export interface ProgressionSnapshot {
  totalGp: number;
  level: number;
  levelFloorGp: number;
  nextLevel: number | null;
  nextLevelGp: number | null;
  gpIntoLevel: number;
  gpForNextLevel: number | null;
  progressPercent: number;
}

export interface ProgressionGuideRule {
  actionType: string;
  label: string;
  description: string | null;
  gpAmount: number;
  dailyGpCap: number | null;
  lifetimeCountCap: number | null;
}

export interface ProgressionGuideSection {
  id: string;
  title: string;
  rules: ProgressionGuideRule[];
}

export interface ProgressionGuide {
  progression: ProgressionSnapshot;
  sections: ProgressionGuideSection[];
  levels: Array<{ level: number; cumulativeGp: number }>;
  notes: string[];
}

export interface ProgressionHistoryEntry {
  id: string;
  actionType: string;
  label: string;
  section: string;
  gpAmount: number;
  ruleAmount: number | null;
  capped: boolean;
  levelUp: number | null;
  awardedAt: string;
}

export interface ProgressionHistory {
  entries: ProgressionHistoryEntry[];
  bySection: Array<{ section: string; gp: number; count: number }>;
  totalGp: number;
  page: number;
  limit: number;
  total: number;
}
