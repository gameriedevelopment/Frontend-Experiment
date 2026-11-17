import { useId, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

/** A short list of free-text values, added with Enter and removed with their ×. */
export function TagInput({
  label,
  hint,
  values,
  onChange,
  max = 20,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim();
    if (!value || values.length >= max) return;
    if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...values, value]);
    setDraft("");
  };
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-mist-200">
          {label}
        </label>
        {hint && <span className="text-xs text-mist-500">{hint}</span>}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          maxLength={60}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-2xl bg-white/4 px-4 text-sm outline-none ring-1 ring-inset ring-white/10 placeholder:text-mist-500 focus:ring-2 focus:ring-lavender-400"
        />
        <Button tone="outline" size="sm" icon="plus" className="h-11" disabled={!draft.trim() || values.length >= max} onClick={add}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value} className="flex items-center gap-1 rounded-full bg-lavender-400/10 py-1 pl-3 pr-1 text-sm text-lavender-100 ring-1 ring-inset ring-lavender-400/25">
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="grid size-6 place-items-center rounded-full text-lavender-300 hover:bg-white/10"
              >
                <Icon name="close" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
