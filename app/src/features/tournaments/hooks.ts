import { useQuery } from "@tanstack/react-query";
import { getTournaments } from "./api";

/** Upcoming tournaments hosted on Gamerie, for surfaces that show a short list. */
export function useOpenTournaments(limit = 3) {
  return useQuery({
    queryKey: ["tournaments", "open", limit],
    queryFn: () => getTournaments({ status: "upcoming", source: "gamerie" }, 1, limit),
    staleTime: 2 * 60_000,
  });
}
