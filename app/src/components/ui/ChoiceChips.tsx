import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const chipClasses =
  "flex min-h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-2xl bg-white/4 px-4 py-2.5 text-center text-sm font-medium text-mist-300 ring-1 ring-inset ring-white/10 transition-[background-color,color,box-shadow] duration-200 hover:bg-white/7 hover:text-mist-50 peer-checked:bg-lavender-400/12 peer-checked:text-mist-50 peer-checked:ring-lavender-400/70 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400";

type ChipInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  multiple?: boolean;
};

// Native radio/checkbox inputs keep keyboard, form and react-hook-form behaviour; the chip is presentation.
export const ChoiceChip = forwardRef<HTMLInputElement, ChipInputProps>(function ChoiceChip(
  { label, multiple = false, className, ...props },
  ref,
) {
  return (
    <label className={cn("group block", className)}>
      <input ref={ref} type={multiple ? "checkbox" : "radio"} className="peer sr-only" {...props} />
      <span className={chipClasses}>
        {multiple && (
          <Icon
            name="check"
            weight="bold"
            className="hidden size-3.5 text-lavender-300 group-has-checked:block"
          />
        )}
        {label}
      </span>
    </label>
  );
});

export function ChoiceGroup({
  legend,
  hint,
  error,
  columns = 3,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  columns?: 2 | 3 | 4 | 5;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm font-medium text-mist-200">
        {legend}
        {hint && <span className="text-xs font-normal text-mist-500">{hint}</span>}
      </legend>
      <div
        className={cn(
          "grid gap-2",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-2 sm:grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4",
          columns === 5 && "grid-cols-3 sm:grid-cols-5",
        )}
      >
        {children}
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
