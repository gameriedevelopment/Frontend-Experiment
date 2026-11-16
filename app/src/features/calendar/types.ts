export type CalendarEventType = "match" | "practice" | "team_meeting" | "personal" | "tournament";
export type CalendarEventStatus = "pending" | "upcoming" | "ongoing" | "completed" | "cancelled";
export type CalendarEventSource = "manual" | "challenge" | "tournament";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  game?: string;
  team?: string;
  status: CalendarEventStatus;
  sourceType?: CalendarEventSource;
  sourceId?: string | null;
  challengeId?: string | null;
}

export interface CalendarFilters {
  searchTerm?: string;
  type?: string;
  status?: string;
  game?: string;
  sourceType?: CalendarEventSource;
  startDate?: string;
  endDate?: string;
  order?: "asc" | "desc";
}

export interface CalendarPageData {
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
