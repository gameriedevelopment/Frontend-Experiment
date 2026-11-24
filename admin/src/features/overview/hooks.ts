import { useQuery } from "@tanstack/react-query";
import { getGrowth, getLiveCompetitions, getMatchesByWeek, getMetrics, getRecentActivity } from "./api";

const root = ["admin", "overview"] as const;

export const useMetrics = () => useQuery({ queryKey: [...root, "metrics"], queryFn: getMetrics, staleTime: 60_000 });
export const useGrowth = () => useQuery({ queryKey: [...root, "growth"], queryFn: getGrowth, staleTime: 5 * 60_000 });
export const useMatchesByWeek = () => useQuery({ queryKey: [...root, "matches"], queryFn: getMatchesByWeek, staleTime: 5 * 60_000 });
export const useLiveCompetitions = () => useQuery({ queryKey: [...root, "live"], queryFn: getLiveCompetitions, refetchInterval: 60_000 });
export const useRecentActivity = () => useQuery({ queryKey: [...root, "activity"], queryFn: getRecentActivity, refetchInterval: 60_000 });
