import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCalendarEvent, getMyEvents, updateCalendarEventStatus } from "./api";
import type { CalendarEventStatus, CalendarFilters, CreateCalendarEventPayload } from "./types";

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

export function useCalendarAgenda(filters: CalendarFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["calendar-events", "agenda", filters],
    queryFn: ({ pageParam }) => getMyEvents(filters, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 30_000,
    enabled,
  });
}

/** Every event in a month; pages are fetched until the month is complete. */
export function useCalendarMonth(filters: CalendarFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["calendar-events", "month", filters],
    queryFn: ({ pageParam }) => getMyEvents(filters, pageParam, 100),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 30_000,
    enabled,
  });
}

function refreshCalendar(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["calendar-events"] });
  void client.invalidateQueries({ queryKey: ["user-events"] });
}

export function useCreateCalendarEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) => createCalendarEvent(payload),
    onSuccess: () => refreshCalendar(client),
  });
}

export function useUpdateCalendarEventStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CalendarEventStatus }) => updateCalendarEventStatus(id, status),
    onSuccess: () => refreshCalendar(client),
  });
}
