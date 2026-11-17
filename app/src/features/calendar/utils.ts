import type { CalendarEvent, CalendarEventSource, CalendarEventStatus } from "./types";

export const eventTypeLabels: Record<string, string> = {
  match: "Match",
  practice: "Practice",
  training: "Practice",
  team_meeting: "Team meeting",
  meeting: "Team meeting",
  personal: "Personal",
  tournament: "Tournament",
  "tournament-check-in": "Check-in",
};

/** The label for an event type, readable even for types added after this list. */
export function eventTypeLabel(type: string): string {
  if (eventTypeLabels[type]) return eventTypeLabels[type];
  const words = type.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Event";
}

export const sourceLabels: Record<CalendarEventSource, string> = {
  manual: "Personal",
  challenge: "Challenge",
  tournament: "Tournament",
};

export const statusLabels: Record<CalendarEventStatus, string> = {
  pending: "Awaiting response",
  upcoming: "Upcoming",
  ongoing: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function zonedDateTimeToIso(value: string, timeZone: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Invalid local date and time");
  const target = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5]);
  let instant = target;
  for (let pass = 0; pass < 3; pass += 1) {
    const actual = partsAt(new Date(instant), timeZone);
    const represented = Date.UTC(
      +actual.year,
      +actual.month - 1,
      +actual.day,
      +actual.hour,
      +actual.minute,
      +actual.second,
    );
    instant += target - represented;
  }
  const resolved = partsAt(new Date(instant), timeZone);
  const resolvedWall = `${resolved.year}-${resolved.month}-${resolved.day}T${resolved.hour}:${resolved.minute}`;
  if (resolvedWall !== value)
    throw new Error("This local time does not exist in the selected timezone");
  return new Date(instant).toISOString();
}

/** The first moment of a day in a time zone. Where the clocks skip midnight, that's 01:00. */
export function startOfDayIso(day: string, timeZone: string): string {
  try {
    return zonedDateTimeToIso(`${day}T00:00`, timeZone);
  } catch {
    return zonedDateTimeToIso(`${day}T01:00`, timeZone);
  }
}

export function monthKey(
  date = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  const parts = partsAt(date, timeZone);
  return `${parts.year}-${parts.month}`;
}

export function shiftMonth(month: string, amount: number): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(month: string, timeZone: string) {
  const next = shiftMonth(month, 1);
  return {
    startDate: startOfDayIso(`${month}-01`, timeZone),
    endDate: new Date(new Date(startOfDayIso(`${next}-01`, timeZone)).getTime() - 1).toISOString(),
  };
}

export function dayKey(date: Date | string, timeZone: string): string {
  const parts = partsAt(new Date(date), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthCells(month: string): string[] {
  const [year, value] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, value - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, value - 1, index - mondayOffset + 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  });
}

export function formatEventTime(event: CalendarEvent, timeZone: string): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const day = new Intl.DateTimeFormat(undefined, { timeZone, weekday: "short", day: "numeric", month: "short" });
  const time = new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" });
  return dayKey(start, timeZone) === dayKey(end, timeZone)
    ? `${day.format(start)} · ${time.format(start)}–${time.format(end)}`
    : `${day.format(start)} · ${time.format(start)} – ${day.format(end)} · ${time.format(end)}`;
}

/** Whole days between an event's start and end, for marking times that run past midnight. */
export function daysSpanned(event: CalendarEvent, timeZone: string): number {
  const start = dayKey(event.startTime, timeZone);
  const end = dayKey(event.endTime, timeZone);
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

export function eventContextPath(event: CalendarEvent): string | undefined {
  if (event.sourceType === "challenge" && (event.sourceId || event.challengeId))
    return `/challenges/${event.sourceId || event.challengeId}`;
  if (event.sourceType === "tournament") return event.sourceId ? `/tournaments/${event.sourceId}` : "/tournaments";
  return undefined;
}
