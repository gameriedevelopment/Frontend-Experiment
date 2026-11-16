import { useQuery } from "@tanstack/react-query";
import { getMyEvents } from "./api";

const closedStatuses = new Set(["completed", "cancelled"]);

/** The next few events from now, soonest first. The start is rounded to the minute so the key stays stable. */
export function useUpcomingEvents(limit = 4) {
  const from = new Date();
  from.setSeconds(0, 0);
  const filters = { startDate: from.toISOString(), order: "asc" as const };
  return useQuery({
    queryKey: ["calendar-events", "upcoming", limit],
    queryFn: () => getMyEvents(filters, 1, limit + 4),
    select: (page) => ({
      total: page.total,
      events: page.events.filter((event) => !closedStatuses.has(event.status)).slice(0, limit),
    }),
    staleTime: 60_000,
  });
}
