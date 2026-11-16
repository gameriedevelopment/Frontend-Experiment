import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ChoiceChip } from "./ChoiceChips";
import { inputClasses } from "./Field";
import { Icon } from "./Icon";

const dayCount = 14;
const presetTimes = ["18:00", "19:00", "20:00", "21:00"];

const pad = (value: number) => String(value).padStart(2, "0");
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const timeKey = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function combine(day: string, time: string) {
  const date = new Date(`${day}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function timeZoneLabel(date = new Date()) {
  return (
    new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC"
  );
}

/** Picks a local day and time in the next two weeks and reports the moment as an ISO string. */
export function ScheduleField({
  label = "When",
  value,
  onChange,
  error,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
}) {
  const name = useId();
  const initial = value ? new Date(value) : null;
  const [day, setDay] = useState(initial ? dayKey(initial) : "");
  const [time, setTime] = useState(initial ? timeKey(initial) : "");
  const now = new Date();
  const today = dayKey(now);

  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: dayCount }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      return date;
    });
  }, []);

  const update = (nextDay: string, nextTime: string) => {
    setDay(nextDay);
    setTime(nextTime);
    const moment = nextDay && nextTime ? combine(nextDay, nextTime) : null;
    onChange(moment ? moment.toISOString() : "");
  };

  const chosen = day && time ? combine(day, time) : null;
  const summary = chosen
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(chosen)
    : null;
  const custom = Boolean(time) && !presetTimes.includes(time);

  return (
    <fieldset className="grid gap-3" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm font-medium text-mist-200">
        {label}
        <span className="text-xs font-normal text-mist-500">Times in {timeZoneLabel()}</span>
      </legend>

      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {days.map((date) => {
          const key = dayKey(date);
          return (
            <ChoiceChip
              key={key}
              name={`${name}-day`}
              value={key}
              checked={day === key}
              onChange={() => update(key, time)}
              className="w-[4.25rem] shrink-0 snap-start [&>span]:flex-col [&>span]:gap-0.5 [&>span]:px-2"
              label={
                <>
                  <span className="type-label text-mist-500">
                    {key === today ? "Today" : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date)}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">{date.getDate()}</span>
                </>
              }
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {presetTimes.map((preset) => {
          const past = day === today && preset <= timeKey(now);
          return (
            <ChoiceChip
              key={preset}
              name={`${name}-time`}
              value={preset}
              checked={time === preset}
              disabled={past}
              onChange={() => update(day, preset)}
              className={cn(past && "opacity-40")}
              label={new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
                combine(today, preset) ?? now,
              )}
            />
          );
        })}
        <label className="col-span-2 sm:col-span-1">
          <span className="sr-only">Other time</span>
          <input
            type="time"
            value={custom ? time : ""}
            onChange={(event) => update(day, event.target.value)}
            className={cn(
              inputClasses,
              "h-11 px-3 text-sm [color-scheme:dark]",
              custom && "bg-lavender-400/12 ring-lavender-400/70",
            )}
          />
        </label>
      </div>

      {summary && (
        <p className="flex items-center gap-2 text-sm text-mist-300">
          <Icon name="calendar" className="size-4 text-lavender-300" />
          {summary}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
          <Icon name="warning" className="size-3.5" weight="bold" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
