import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { deviceTimeZone, timeZoneLabel } from "@/components/ui/TimeZoneField";
import { useAuthStore } from "@/features/auth/authStore";
import { GameFilter } from "@/features/games/components/GameFilter";
import { usePlayerSettings } from "@/features/settings/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { EventComposer } from "./components/EventComposer";
import { EventDetailDialog } from "./components/EventDetailDialog";
import { EventRow } from "./components/EventRow";
import { MonthGrid } from "./components/MonthGrid";
import { useCalendarAgenda, useCalendarMonth } from "./hooks";
import type { CalendarEvent, CalendarEventSource, CalendarFilters } from "./types";
import { dayKey, monthRange, shiftMonth, startOfDayIso } from "./utils";

const views = [
  { value: "agenda" as const, label: "Agenda" },
  { value: "month" as const, label: "Month" },
];
const periods = [
  { value: "upcoming" as const, label: "Upcoming" },
  { value: "past" as const, label: "Past" },
];
const sources = [
  { value: "challenge", label: "Challenges" },
  { value: "tournament", label: "Tournaments" },
  { value: "manual", label: "Your plans" },
];

function validZone(zone?: string) {
  if (!zone) return null;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: zone });
    return zone;
  } catch {
    return null;
  }
}

function dayHeading(day: string, today: string) {
  const offset = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  const date = new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(day.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" } : {}),
  });
  const relative = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : offset === -1 ? "Yesterday" : null;
  return { relative, date };
}

function groupByDay(events: CalendarEvent[], timeZone: string) {
  return events.reduce<Record<string, CalendarEvent[]>>((groups, event) => {
    (groups[dayKey(event.startTime, timeZone)] ||= []).push(event);
    return groups;
  }, {});
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-1 rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}

function DayList({ day, today, events, timeZone, onOpen }: { day: string; today: string; events: CalendarEvent[]; timeZone: string; onOpen: (event: CalendarEvent) => void }) {
  const { relative, date } = dayHeading(day, today);
  return (
    <section aria-label={relative ? `${relative}, ${date}` : date}>
      <h2 className="mb-1 flex items-baseline gap-2 px-3 pt-2">
        {relative && <span className="text-sm font-semibold text-mist-50">{relative}</span>}
        <span className={relative ? "text-sm text-mist-500" : "text-sm font-semibold text-mist-100"}>{date}</span>
      </h2>
      <ul className="grid grid-cols-[minmax(0,1fr)]">
        {events.map((event) => (
          <li key={event.id}>
            <EventRow event={event} timeZone={timeZone} onOpen={() => onOpen(event)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CalendarPage() {
  const user = useAuthStore((state) => state.user);
  const settings = usePlayerSettings(user?.id);
  const timeZone = validZone(settings.data?.timezone) ?? deviceTimeZone();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "month" ? "month" : "agenda";
  const period = params.get("period") === "past" ? "past" : "upcoming";
  const today = dayKey(new Date(), timeZone);
  const thisMonth = today.slice(0, 7);
  const requestedMonth = params.get("month") ?? "";
  const month = /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : thisMonth;
  const requestedDay = params.get("day") ?? "";
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(requestedDay) && requestedDay.startsWith(month) ? requestedDay : month === thisMonth ? today : `${month}-01`;
  const source = sources.some((item) => item.value === params.get("source")) ? (params.get("source") as CalendarEventSource) : undefined;
  const game = params.get("game") ?? "";
  const [composing, setComposing] = useState(false);
  const [opened, setOpened] = useState<CalendarEvent | null>(null);

  const setParam = (changes: Record<string, string | undefined>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true },
    );

  const base = useMemo<CalendarFilters>(() => ({ sourceType: source, game: game || undefined }), [game, source]);
  // Upcoming starts at the beginning of today, so events already under way stay in view.
  const agendaFilters = useMemo<CalendarFilters>(() => {
    const startOfToday = startOfDayIso(today, timeZone);
    return period === "past"
      ? { ...base, startDate: monthRange(shiftMonth(thisMonth, -24), timeZone).startDate, endDate: startOfToday, order: "desc" }
      : { ...base, startDate: startOfToday, endDate: monthRange(shiftMonth(thisMonth, 12), timeZone).endDate, order: "asc" };
  }, [base, period, thisMonth, timeZone, today]);
  const monthFilters = useMemo<CalendarFilters>(() => ({ ...base, ...monthRange(month, timeZone), order: "asc" }), [base, month, timeZone]);
  const agenda = useCalendarAgenda(agendaFilters, view === "agenda");
  const monthQuery = useCalendarMonth(monthFilters, view === "month");
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = monthQuery;

  useEffect(() => {
    if (view === "month" && hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage, view]);

  const agendaEvents = useMemo(() => agenda.data?.pages.flatMap((page) => page.events) ?? [], [agenda.data]);
  const monthEvents = useMemo(() => monthQuery.data?.pages.flatMap((page) => page.events) ?? [], [monthQuery.data]);
  const agendaDays = useMemo(() => Object.entries(groupByDay(agendaEvents, timeZone)), [agendaEvents, timeZone]);
  const monthByDay = useMemo(() => groupByDay(monthEvents, timeZone), [monthEvents, timeZone]);
  const dayEvents = monthByDay[selectedDay] ?? [];
  const filtered = Boolean(source || game);
  const query = view === "month" ? monthQuery : agenda;

  // Links from elsewhere (Home's "Up next") open an event by id once it has loaded.
  const requestedEvent = params.get("event");
  useEffect(() => {
    if (!requestedEvent || opened) return;
    const match = [...agendaEvents, ...monthEvents].find((event) => event.id === requestedEvent);
    if (match) setOpened(match);
  }, [agendaEvents, monthEvents, opened, requestedEvent]);

  const open = (event: CalendarEvent) => {
    setOpened(event);
    setParam({ event: event.id });
  };
  const close = () => {
    setOpened(null);
    setParam({ event: undefined });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Calendar"
        description="Your challenges, tournaments and plans in one place."
        actions={
          <Button icon="plus" onClick={() => setComposing(true)}>
            Add event
          </Button>
        }
      />

      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="View" options={views} value={view} onChange={(next) => setParam({ view: next === "agenda" ? undefined : next, event: undefined })} />
          {view === "agenda" ? (
            <Segmented label="When" options={periods} value={period} onChange={(next) => setParam({ period: next === "upcoming" ? undefined : next })} />
          ) : (
            <div className="flex items-center gap-1">
              <Button tone="ghost" size="sm" icon="arrowLeft" onClick={() => setParam({ month: shiftMonth(month, -1), day: undefined })}>
                <span className="sr-only">Previous month</span>
              </Button>
              <p className="min-w-36 text-center text-sm font-semibold" aria-live="polite">
                {new Date(`${month}-15T12:00:00Z`).toLocaleDateString(undefined, { timeZone: "UTC", month: "long", year: "numeric" })}
              </p>
              <Button tone="ghost" size="sm" icon="arrowRight" onClick={() => setParam({ month: shiftMonth(month, 1), day: undefined })}>
                <span className="sr-only">Next month</span>
              </Button>
              {month !== thisMonth && (
                <Button tone="outline" size="sm" onClick={() => setParam({ month: undefined, day: undefined })}>
                  Today
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <FilterMenu label="Show" value={source ?? ""} options={sources} anyLabel="Everything" onChange={(value) => setParam({ source: value || undefined })} />
            <GameFilter value={game} onChange={(value) => setParam({ game: value || undefined })} />
          </div>
        </div>
        <p className="text-xs text-mist-500">
          Times in {timeZoneLabel(timeZone)}.{" "}
          <Link to="/settings?section=notifications" className="font-medium text-mist-400 hover:text-lavender-200">
            Change
          </Link>
        </p>

        {query.isLoading ? (
          view === "month" ? <Skeleton className="h-96 rounded-card" /> : <ListSkeleton />
        ) : query.isError ? (
          <StatePanel
            icon="warning"
            tone="danger"
            title="Your calendar didn't load"
            description={getApiErrorMessage(query.error, "Try again in a moment.")}
            action={
              <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : view === "month" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
            <MonthGrid month={month} today={today} selected={selectedDay} byDay={monthByDay} onSelect={(day) => setParam({ day })} />
            <section className="rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6 xl:sticky xl:top-24">
              {dayEvents.length ? (
                <DayList day={selectedDay} today={today} events={dayEvents} timeZone={timeZone} onOpen={open} />
              ) : (
                <div className="grid justify-items-start gap-3 p-3">
                  <p className="text-sm font-semibold">{dayHeading(selectedDay, today).relative ?? dayHeading(selectedDay, today).date}</p>
                  <p className="text-sm text-mist-400">Nothing on this day.</p>
                  {selectedDay >= today && (
                    <Button tone="outline" size="sm" icon="plus" onClick={() => setComposing(true)}>
                      Add an event
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : agendaDays.length ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
              {agendaDays.map(([day, events]) => (
                <DayList key={day} day={day} today={today} events={events} timeZone={timeZone} onOpen={open} />
              ))}
            </div>
            {agenda.hasNextPage && (
              <Button tone="outline" size="sm" className="mx-auto" disabled={agenda.isFetchingNextPage} onClick={() => void agenda.fetchNextPage()}>
                {agenda.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            )}
          </div>
        ) : (
          <StatePanel
            icon="calendar"
            title={filtered ? "Nothing matches" : period === "past" ? "Nothing in the past two years" : "Nothing planned yet"}
            description={
              filtered
                ? "Try another filter, or show everything."
                : period === "past"
                  ? "Finished challenges, tournaments and plans show up here."
                  : "Accepted challenges and tournaments you enter land here automatically. Add your own plans too."
            }
            action={
              filtered ? (
                <Button tone="outline" size="sm" onClick={() => setParam({ source: undefined, game: undefined })}>
                  Show everything
                </Button>
              ) : period === "upcoming" ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" icon="plus" onClick={() => setComposing(true)}>
                    Add event
                  </Button>
                  <LinkButton to="/challenges/new" tone="outline" size="sm" icon="challenges">
                    Challenge someone
                  </LinkButton>
                </div>
              ) : undefined
            }
          />
        )}
      </div>

      {composing && <EventComposer defaultTimeZone={timeZone} day={view === "month" ? selectedDay : undefined} onClose={() => setComposing(false)} />}
      {opened && <EventDetailDialog event={opened} timeZone={timeZone} onClose={close} />}
    </div>
  );
}
