import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/cn";

/** A compact single-choice switch for filters. Native radios keep it keyboard and screen reader friendly. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={cn("inline-flex min-w-0 rounded-full bg-white/4 p-1 ring-1 ring-inset ring-white/8", className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            {active && (
              <motion.span
                layoutId={`${name}-thumb`}
                className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-inset ring-white/10"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span
              className={cn(
                "relative block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400",
                active ? "text-mist-50" : "text-mist-400 hover:text-mist-200",
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
