import { Link } from "react-router-dom";
import { LinkButton } from "@/components/ui/Button";
import type { CalendarEvent } from "@/features/calendar/types";
import { formatRelativeDay, formatTime } from "../format";
import { HomePanel, PanelError, RowSkeletons } from "./HomePanel";

const sourceLabels: Record<string, string> = {
  challenge: "Challenge",
  tournament: "Tournament",
};

function eventHref(event: CalendarEvent) {
  if (event.sourceType === "challenge" && (event.challengeId || event.sourceId)) {
    return `/challenges/${event.challengeId || event.sourceId}`;
  }
  if (event.sourceType === "tournament" && event.sourceId) return `/tournaments/${event.sourceId}`;
  return "/calendar";
}

function EventRow({ event }: { event: CalendarEvent }) {
  const start = new Date(event.startTime);
  const live = event.status === "ongoing";
  const detail = [event.game, event.team].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        to={eventHref(event)}
        className="group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-white/3"
      >
        <span className="grid w-14 shrink-0 justify-items-center rounded-xl bg-white/4 py-2 ring-1 ring-inset ring-white/6">
          <span className="type-label text-mist-500">
            {new Intl.DateTimeFormat(undefined, { month: "short" }).format(start)}
          </span>
          <span className="type-display mt-1 text-xl leading-none tabular-nums">{start.getDate()}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold transition-colors group-hover:text-lavender-200">
            {event.title}
          </span>
          <span className="mt-0.5 block truncate text-sm text-mist-400">
            {formatRelativeDay(start)} · {formatTime(start)}
            {detail && ` · ${detail}`}
          </span>
        </span>
        {live ? (
          <span className="type-label flex shrink-0 items-center gap-2 text-signal">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-signal motion-reduce:animate-none" />
            Live
          </span>
        ) : (
          event.sourceType &&
          sourceLabels[event.sourceType] && (
            <span className="type-label hidden shrink-0 text-mist-500 sm:block">{sourceLabels[event.sourceType]}</span>
          )
        )}
      </Link>
    </li>
  );
}

export function UpNext({
  events,
  loading,
  failed,
  onRetry,
  className,
}: {
  events: CalendarEvent[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <HomePanel className={className} title="Up next" link={{ label: "Calendar", to: "/calendar" }}>
      {loading ? (
        <RowSkeletons rows={3} />
      ) : failed ? (
        <PanelError onRetry={onRetry} />
      ) : events.length ? (
        <ul className="-mx-3 -my-1 flex flex-col gap-1">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      ) : (
        <div className="grid gap-4">
          <p className="max-w-md text-sm leading-relaxed text-mist-400">
            Nothing scheduled. Challenges you accept and your tournament matches show up here.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/users" size="sm" tone="outline" icon="challenges">
              Find an opponent
            </LinkButton>
            <LinkButton to="/tournaments" size="sm" tone="outline" icon="trophy">
              Browse tournaments
            </LinkButton>
          </div>
        </div>
      )}
    </HomePanel>
  );
}
