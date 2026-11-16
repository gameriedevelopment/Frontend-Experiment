import { useQuery } from "@tanstack/react-query";
import { getProgressionGuide } from "./api";

export function useProgressionGuide(enabled = true) {
  return useQuery({
    queryKey: ["progression-guide"],
    queryFn: getProgressionGuide,
    enabled,
    staleTime: 0,
  });
}
