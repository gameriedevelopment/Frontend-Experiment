import { api, unwrap, type AdminPage } from "@/lib/api";

export const CATEGORIES = [
  { value: "competitor", label: "Competitor" },
  { value: "challenges", label: "Challenges" },
  { value: "tournaments", label: "Tournaments" },
  { value: "team", label: "Team" },
  { value: "social", label: "Social" },
] as const;

export type AchievementCategory = (typeof CATEGORIES)[number]["value"];

export const categoryLabel = (value: string) => CATEGORIES.find((category) => category.value === value)?.label ?? value;

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  game: string;
  points: number;
  maxProgress: number;
  icon: string;
  awardedCount: number;
  /** Unlocked by the rules, which find it by its title. */
  automatic: boolean;
  createdAt: string;
}

export interface AchievementQuery {
  page: number;
  limit: number;
  search?: string;
  category?: AchievementCategory;
}

export interface AchievementInput {
  title: string;
  description: string;
  category: AchievementCategory;
  game: string;
  points: number;
  maxProgress: number;
}

export const listAchievements = (query: AchievementQuery) => unwrap<AdminPage<Achievement>>(api.get("/admin/achievements", { params: query }));
export const createAchievement = (input: AchievementInput) => unwrap<Achievement>(api.post("/admin/achievements", input));
export const updateAchievement = (id: string, input: Partial<AchievementInput>) => unwrap<Achievement>(api.patch(`/admin/achievements/${id}`, input));
export const deleteAchievement = (id: string, reason: string) => api.delete(`/admin/achievements/${id}`, { data: { reason } });
