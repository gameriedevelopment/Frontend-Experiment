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
