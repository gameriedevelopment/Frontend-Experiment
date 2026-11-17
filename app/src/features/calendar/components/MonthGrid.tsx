import { cn } from "@/lib/cn";
import type { CalendarEvent } from "../types";
import { monthCells } from "../utils";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A Monday-first month. Wide screens show event titles in each day; phones show a dot per event. */
export function MonthGrid({
  month,
  today,
  selected,
  byDay,
  onSelect,
}: {
  month: string;
  today: string;
  selected: string;
  byDay: Record<string, CalendarEvent[]>;
  onSelect: (day: string) => void;
}) {
  const cells = monthCells(month);
  // Drop a trailing week that belongs entirely to the next month.
  const visible = cells.slice(35).every((day) => !day.startsWith(month)) ? cells.slice(0, 35) : cells;
  return (
    <div className="overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
      <div aria-hidden="true" className="grid grid-cols-7 border-b border-white/6">
        {weekdays.map((day) => (
          <span key={day} className="type-label py-3 text-center text-mist-500">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {visible.map((day, index) => {
          const inMonth = day.startsWith(month);
          const events = byDay[day] ?? [];
          const active = day === selected;
          const label = new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              aria-label={`${label}${events.length ? `, ${events.length} ${events.length === 1 ? "event" : "events"}` : ""}`}
              onClick={() => onSelect(day)}
              className={cn(
                "relative flex min-h-16 flex-col items-stretch gap-1 border-white/6 p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                index % 7 !== 0 && "border-l",
                index >= 7 && "border-t",
                active ? "bg-lavender-400/10" : "hover:bg-white/3",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center self-center rounded-full text-xs font-semibold tabular-nums sm:self-start",
                  day === today ? "bg-lavender-400 text-ink-950" : inMonth ? "text-mist-100" : "text-mist-500/60",
                  active && day !== today && "ring-1 ring-lavender-400/70",
                )}
              >
                {Number(day.slice(8))}
              </span>
              {events.length > 0 && (
                <>
                  <span className="flex justify-center gap-0.5 sm:hidden">
                    {events.slice(0, 3).map((event) => (
                      <span key={event.id} className={cn("size-1.5 rounded-full", event.status === "cancelled" ? "bg-white/20" : "bg-lavender-300")} />
                    ))}
                  </span>
                  <span className="hidden min-w-0 gap-0.5 sm:grid sm:grid-cols-[minmax(0,1fr)]">
                    {events.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          "truncate rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium",
                          event.status === "cancelled" ? "bg-white/4 text-mist-500 line-through" : event.sourceType === "manual" ? "bg-white/6 text-mist-200" : "bg-lavender-400/14 text-lavender-200",
                        )}
                      >
                        {event.title}
                      </span>
                    ))}
                    {events.length > 2 && <span className="px-1.5 text-[0.7rem] text-mist-500">+{events.length - 2} more</span>}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
