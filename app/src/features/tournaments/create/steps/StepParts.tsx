import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** A titled group of fields inside a step. */
export function StepSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-white/6 pt-7 first:border-t-0 first:pt-0">
      <header>
        <h3 className="text-sm font-semibold text-mist-50">{title}</h3>
        {description && <p className="mt-1 text-sm leading-relaxed text-mist-400">{description}</p>}
      </header>
      {children}
    </section>
  );
}

/** A wrapping row of small single-choice chips, for numeric presets like timers and sizes. */
export function ChipRow<T extends string | number>({
  legend,
  hint,
  options,
  value,
  onChange,
  format = String,
  error,
  disabled,
}: {
  legend: string;
  hint?: ReactNode;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  error?: string;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="grid min-w-0 gap-3" disabled={disabled}>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm font-medium text-mist-200">
        {legend}
        {hint && <span className="text-xs font-normal text-mist-500">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;
          return (
            <label key={String(option)} className={cn("relative", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
              <input
                type="radio"
                name={name}
                value={String(option)}
                checked={active}
                onChange={() => onChange(option)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-10 min-w-12 items-center justify-center rounded-xl px-3.5 text-sm font-medium tabular-nums ring-1 ring-inset transition-[background-color,box-shadow,color] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400",
                  active ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/70" : "bg-white/4 text-mist-300 ring-white/10 hover:bg-white/7",
                )}
              >
                {format(option)}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
          <Icon name="warning" className="size-3.5" weight="bold" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function LockedNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs text-mist-500">
      <Icon name="lock" className="size-3.5" />
      {children}
    </p>
  );
}

export const minutesLabel = (value: number) =>
  value >= 1440
    ? `${value / 1440} day${value === 1440 ? "" : "s"}`
    : value >= 60
      ? `${value / 60} h`
      : `${value} min`;
