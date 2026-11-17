import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  days: dayRange = dayCount,
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  /** How many days ahead to offer, starting today. Widened to include an existing value. */
  days?: number;
  disabled?: boolean;
}) {
  const name = useId();
  const initial = value ? new Date(value) : null;
  const [day, setDay] = useState(initial ? dayKey(initial) : "");
  const [time, setTime] = useState(initial ? timeKey(initial) : "");
  const now = new Date();
  const today = dayKey(now);
  const stripRef = useRef<HTMLDivElement>(null);

  // Bring an existing choice into view, since it may be weeks along the strip.
  useEffect(() => {
    const strip = stripRef.current;
    const chosen = strip?.querySelector<HTMLElement>("input:checked")?.parentElement;
    if (strip && chosen) strip.scrollLeft = chosen.offsetLeft - 8;
  }, []);

  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const reach = initial ? Math.ceil((initial.getTime() - start.getTime()) / 86_400_000) + 1 : 0;
    return Array.from({ length: Math.max(dayRange, reach) }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      return date;
    });
    // The initial value only widens the range once; later picks are always inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayRange]);

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
  const lastStripDay = dayKey(days[days.length - 1]);
  const afterStrip = (() => {
    const next = new Date(days[days.length - 1]);
    next.setDate(next.getDate() + 1);
    return dayKey(next);
  })();
  const later = day > lastStripDay ? day : "";

  return (
    <fieldset className="grid min-w-0 gap-3" disabled={disabled} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm font-medium text-mist-200">
        {label}
        <span className="flex items-center gap-3 text-xs font-normal text-mist-500">
          {/* The strip covers the next few weeks; anything further goes through the native date picker. */}
          <label className="relative flex cursor-pointer items-center gap-1.5 font-medium text-lavender-300 hover:text-lavender-200">
            <Icon name="calendar" className="size-3.5" />
            {later
              ? new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${later}T12:00`))
              : "Later date"}
            <input
              type="date"
              min={afterStrip}
              value={later}
              aria-label="Pick a later date"
              onChange={(event) => event.target.value && update(event.target.value, time)}
              onClick={(event) => event.currentTarget.showPicker?.()}
              className="absolute inset-0 cursor-pointer opacity-0 scheme-dark"
            />
          </label>
          <span>Times in {timeZoneLabel()}</span>
        </span>
      </legend>

      <div ref={stripRef} className="relative -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 pr-8 scrollbar-none mask-[linear-gradient(to_right,black_85%,transparent)]">
        {days.map((date, index) => {
          const key = dayKey(date);
          const marker =
            key === today
              ? "Today"
              : index > 0 && date.getDate() === 1
                ? new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)
                : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
          return (
            <ChoiceChip
              key={key}
              name={`${name}-day`}
              value={key}
              checked={day === key}
              onChange={() => update(key, time)}
              className="w-17 shrink-0 snap-start [&>span]:flex-col [&>span]:gap-0.5 [&>span]:px-2"
              label={
                <>
                  <span className={cn("type-label", index > 0 && date.getDate() === 1 ? "text-lavender-300" : "text-mist-500")}>
                    {marker}
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
              "h-11 px-3 text-sm scheme-dark",
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
