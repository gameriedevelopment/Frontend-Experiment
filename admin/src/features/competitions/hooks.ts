import { useQuery } from "@tanstack/react-query";
import { getCompetitionSummary } from "./api";

export const useCompetitionSummary = () =>
  useQuery({ queryKey: ["admin", "competitions", "summary"], queryFn: getCompetitionSummary, staleTime: 60_000 });
