import { useQuery } from "@tanstack/react-query";
import { getGameConnections, searchGameOptions } from "./api";

export function useGameConnections(enabled = true) {
  return useQuery({
    queryKey: ["game-connections"],
    queryFn: getGameConnections,
    enabled,
    staleTime: 60_000,
  });
}

export function useGameOptions(search: string, enabled = true) {
  return useQuery({
    queryKey: ["game-options", search, "first-page"],
    queryFn: () => searchGameOptions(search),
    enabled,
    staleTime: 5 * 60_000,
  });
}
