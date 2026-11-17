import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Avatar } from "./Avatar";
import { FieldFrame, inputClasses } from "./Field";
import { Icon } from "./Icon";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  image?: string;
}

/**
 * Search-as-you-type picker. The parent owns the query and the (usually remote) options; the
 * selected option is shown as a summary row that can be cleared to search again. With `browse`,
 * the list opens on focus so people can pick without remembering what to type, and Change keeps
 * the current choice until a new one is picked.
 */
export function Combobox({
  id,
  label,
  placeholder,
  query,
  onQueryChange,
  options,
  loading = false,
  value,
  onChange,
  error,
  emptyText = "No matches",
  hint,
  avatars = false,
  labelAction,
  browse = false,
  browseLabel,
}: {
  id: string;
  label: string;
  placeholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  options: ComboboxOption[];
  loading?: boolean;
  value: ComboboxOption | null;
  onChange: (option: ComboboxOption | null) => void;
  error?: string;
  emptyText?: string;
  hint?: ReactNode;
  avatars?: boolean;
  labelAction?: ReactNode;
  browse?: boolean;
  /** Heading over the unfiltered list, e.g. "Popular games". */
  browseLabel?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [editing, setEditing] = useState(false);
  const browsing = browse && !query.trim();
  const showList = open && (browse || query.trim().length > 0);

  // Opening the full list lands on the current choice rather than the top.
  useEffect(() => {
    if (!showList || !browsing) return;
    const index = value ? options.findIndex((option) => option.value === value.value) : -1;
    if (index < 0) return;
    setActive(index);
    requestAnimationFrame(() => document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: "center" }));
  }, [showList, browsing, listId, options, value]);

  const select = (option: ComboboxOption) => {
    onChange(option);
    onQueryChange("");
    setOpen(false);
    setEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && showList && options[active]) {
      event.preventDefault();
      select(options[active]);
    } else if (event.key === "Escape" && showList) {
      event.stopPropagation();
      setOpen(false);
    }
  };

  if (value && !editing) {
    return (
      <FieldFrame id={id} label={label} error={error} labelAction={labelAction}>
        <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-lavender-400/8 px-3 py-2 ring-1 ring-inset ring-lavender-400/40">
          {avatars && <Avatar src={value.image} name={value.label} size="sm" className="rounded-full" />}
          <span className="min-w-0 flex-1">
            <span id={id} className="block truncate text-[0.95rem] font-semibold">
              {value.label}
            </span>
            {value.description && <span className="block truncate text-xs text-mist-400">{value.description}</span>}
          </span>
          <button
            type="button"
            onClick={() => {
              if (browse) setEditing(true);
              else onChange(null);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-lavender-300 transition-colors hover:bg-white/6 hover:text-lavender-200"
          >
            Change
          </button>
        </div>
      </FieldFrame>
    );
  }

  return (
    <FieldFrame id={id} label={label} error={error} labelAction={labelAction}>
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500"
        />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[active] ? `${listId}-${active}` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            if (!browse) return;
            setEditing(false);
            onQueryChange("");
          }}
          onKeyDown={onKeyDown}
          className={cn(inputClasses, "pl-11")}
        />
        {loading && (
          <Icon
            name="spinner"
            className="absolute inset-y-0 right-4 my-auto size-4 animate-spin text-mist-500 motion-reduce:animate-none"
          />
        )}
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-y-auto rounded-2xl bg-ink-800 p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10"
          >
            {browsing && browseLabel && options.length > 0 && (
              <li role="presentation" className="type-label px-3 pb-1.5 pt-2 text-mist-500">
                {browseLabel}
              </li>
            )}
            {options.length ? (
              options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    index === active && "bg-white/6",
                    value?.value === option.value && "text-lavender-200",
                  )}
                >
                  {avatars && <Avatar src={option.image} name={option.label} size="sm" className="rounded-full" />}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-mist-400">{option.description}</span>
                    )}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-sm text-mist-500">{loading ? "Searching…" : emptyText}</li>
            )}
          </ul>
        )}
      </div>
      {hint && <div className="text-xs text-mist-500">{hint}</div>}
    </FieldFrame>
  );
}
