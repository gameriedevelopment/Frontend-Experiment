import { Icon } from "./Icon";
import { Menu } from "./Menu";
import { cn } from "@/lib/cn";

/** A pill that picks one value from a short list, with "Any" to clear it. */
export function FilterMenu({
  label,
  value,
  options,
  onChange,
  anyLabel = "Any",
}: {
  label: string;
  value: string;
  options: ReadonlyArray<string | { value: string; label: string }>;
  onChange: (value: string) => void;
  anyLabel?: string;
}) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  const current = normalized.find((option) => option.value === value);
  return (
    <Menu
      label={`${label}: ${current?.label ?? anyLabel}`}
      align="start"
      triggerClassName={cn(
        "flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.85rem] ring-1 ring-inset transition-colors",
        current ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/40" : "text-mist-300 ring-white/10 hover:text-mist-50 hover:ring-white/20",
      )}
      trigger={
        <>
          <span className="text-mist-500">{label}</span>
          <span className="font-medium">{current?.label ?? anyLabel}</span>
          <Icon name="chevronDown" className="size-3.5 text-mist-500" />
        </>
      }
      items={[
        { label: anyLabel, checked: !current, onSelect: () => onChange("") },
        ...normalized.map((option) => ({ label: option.label, checked: option.value === value, onSelect: () => onChange(option.value) })),
      ]}
    />
  );
}
