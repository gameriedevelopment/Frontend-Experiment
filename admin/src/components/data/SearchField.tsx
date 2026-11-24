import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** A debounced search box that writes to the URL a beat after typing stops. */
export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => latest.current(draft.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [draft, value]);

  return (
    <label className={cn("relative flex h-9 min-w-0 items-center", className)}>
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute left-3 size-4 text-mist-500" />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-full bg-white/4 pl-9 pr-9 text-[0.88rem] text-mist-50 ring-1 ring-inset ring-white/10 transition-[box-shadow,background-color] placeholder:text-mist-500 hover:ring-white/20 focus:bg-white/6 focus:outline-none focus:ring-lavender-400/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          className="absolute right-2 grid size-6 place-items-center rounded-full text-mist-500 hover:bg-white/8 hover:text-mist-100"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      )}
    </label>
  );
}
