import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getProgressionGuide, getProgressionHistory } from "./api";

export function useProgressionGuide(enabled = true) {
  return useQuery({
    queryKey: ["progression-guide"],
    queryFn: getProgressionGuide,
    enabled,
    staleTime: 0,
  });
}

/** The signed-in player's GP awards, newest first. */
export function useProgressionHistory(enabled = true) {
  return useInfiniteQuery({
    queryKey: ["progression-history"],
    queryFn: ({ pageParam }) => getProgressionHistory(pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page * page.limit < page.total ? page.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
  });
}
