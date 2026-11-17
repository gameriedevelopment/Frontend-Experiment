import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

export interface OptionCardItem<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
}

/** A single choice shown as cards, for options that need a line of explanation. */
export function OptionCards<T extends string | number>({
  legend,
  hint,
  options,
  value,
  onChange,
  columns = 2,
  error,
  disabled,
}: {
  legend: string;
  hint?: ReactNode;
  options: OptionCardItem<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
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
      <div className={cn("grid gap-2", columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {options.map((option) => {
          const active = option.value === value;
          const off = disabled || option.disabled;
          return (
            <label key={String(option.value)} className={cn("relative block", off ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={active}
                disabled={off}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-full items-center gap-3 rounded-2xl px-4 py-3.5 ring-1 ring-inset transition-[background-color,box-shadow] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400",
                  active ? "bg-lavender-400/12 ring-lavender-400/70" : "bg-white/4 ring-white/10 hover:bg-white/7",
                )}
              >
                {option.icon && (
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                      active ? "bg-lavender-400 text-ink-950" : "bg-white/6 text-mist-300",
                    )}
                  >
                    <Icon name={option.icon} weight="duotone" className="size-[1.1rem]" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{option.label}</span>
                  {option.description && <span className="mt-0.5 block text-xs leading-snug text-mist-400">{option.description}</span>}
                </span>
                {!option.icon && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                      active ? "bg-lavender-400 ring-lavender-400" : "ring-white/25",
                    )}
                  >
                    {active && <span className="size-1.5 rounded-full bg-ink-950" />}
                  </span>
                )}
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
