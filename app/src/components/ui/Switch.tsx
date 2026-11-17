import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** An on/off setting with its explanation beside it. */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-6", disabled && "opacity-50")}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-mist-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-mist-400">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200",
          checked ? "bg-lavender-400 ring-lavender-400" : "bg-white/8 ring-white/15",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full shadow-sm transition-transform duration-200 ease-out-expo",
            checked ? "translate-x-5 bg-ink-950" : "translate-x-0 bg-mist-300",
          )}
        />
      </button>
    </div>
  );
}
