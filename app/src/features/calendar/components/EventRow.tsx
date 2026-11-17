import { cn } from "@/lib/cn";
import type { CalendarEvent } from "../types";
import { eventTypeLabels } from "../utils";

const sourceBars: Record<string, string> = {
  challenge: "bg-lavender-400",
  tournament: "bg-lavender-200",
  manual: "bg-white/25",
};

function StatusPill({ status }: { status: CalendarEvent["status"] }) {
  if (status === "pending") return <span className="type-label rounded-full bg-lavender-400/12 px-2 py-1 text-lavender-300">Awaiting reply</span>;
  if (status === "ongoing")
    return (
      <span className="type-label flex items-center gap-1.5 rounded-full bg-signal/10 px-2 py-1 text-signal">
        <span className="size-1.5 rounded-full bg-signal" />
        Live
      </span>
    );
  if (status === "completed") return <span className="type-label rounded-full bg-white/6 px-2 py-1 text-mist-400">Done</span>;
  if (status === "cancelled") return <span className="type-label rounded-full bg-white/6 px-2 py-1 text-mist-500">Cancelled</span>;
  return null;
}

export function EventRow({ event, timeZone, onOpen }: { event: CalendarEvent; timeZone: string; onOpen: () => void }) {
  const time = new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" });
  const cancelled = event.status === "cancelled";
  const meta = [eventTypeLabels[event.type] ?? event.type, event.game, event.team, event.location].filter(Boolean).join(" · ");
  return (
    <button type="button" onClick={onOpen} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/4 sm:gap-4">
      <span className="w-16 shrink-0 tabular-nums">
        <span className={cn("block text-sm font-semibold", cancelled && "text-mist-500")}>{time.format(new Date(event.startTime))}</span>
        <span className="block text-xs text-mist-500">{time.format(new Date(event.endTime))}</span>
      </span>
      <span aria-hidden="true" className={cn("h-10 w-1 shrink-0 rounded-full", cancelled ? "bg-white/10" : (sourceBars[event.sourceType ?? "manual"] ?? sourceBars.manual))} />
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-semibold group-hover:text-lavender-100", cancelled && "text-mist-500 line-through")}>{event.title}</span>
        <span className="block truncate text-xs text-mist-400">{meta}</span>
      </span>
      <span className="shrink-0">
        <StatusPill status={event.status} />
      </span>
    </button>
  );
}
