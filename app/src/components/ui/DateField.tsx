import { useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Part = "day" | "month" | "year";

const partMeta: Record<Part, { placeholder: string; length: number; width: string; label: string }> = {
  day: { placeholder: "DD", length: 2, width: "w-[2.6ch]", label: "Day" },
  month: { placeholder: "MM", length: 2, width: "w-[2.9ch]", label: "Month" },
  year: { placeholder: "YYYY", length: 4, width: "w-[4.8ch]", label: "Year" },
};

function localeOrder(): Part[] {
  const parts = new Intl.DateTimeFormat(undefined).formatToParts(new Date(2000, 10, 22));
  const order = parts.map((part) => part.type).filter((type): type is Part => type === "day" || type === "month" || type === "year");
  return order.length === 3 ? order : ["day", "month", "year"];
}

function splitIso(value: string): Record<Part, string> {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? { year: match[1], month: match[2], day: match[3] } : { day: "", month: "", year: "" };
}

function toDate({ day, month, year }: Record<Part, string>) {
  if (day.length < 1 || month.length < 1 || year.length !== 4) return null;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const real =
    date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day);
  return real ? date : null;
}

const pad = (value: string) => value.padStart(2, "0");

function parsePasted(text: string): Record<Part, string> | null {
  const iso = text.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return { year: iso[1], month: pad(iso[2]), day: pad(iso[3]) };
  const numbers = text.trim().match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/);
  if (!numbers) return null;
  const [first, second] = [numbers[1], numbers[2]];
  return localeOrder()[0] === "month"
    ? { month: pad(first), day: pad(second), year: numbers[3] }
    : { day: pad(first), month: pad(second), year: numbers[3] };
}

// A segmented date input that emits an ISO "YYYY-MM-DD" string (or "" until it's a real date).
export function DateField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const order = useMemo(localeOrder, []);
  const [parts, setParts] = useState(() => splitIso(value));
  const refs = useRef<Record<Part, HTMLInputElement | null>>({ day: null, month: null, year: null });
  const date = toDate(parts);
  const complete = parts.day !== "" && parts.month !== "" && parts.year.length === 4;
  const hint = complete && !date ? "That date doesn't exist" : undefined;
  const shownError = error ?? hint;

  function toIso(next: Record<Part, string>) {
    const real = toDate(next);
    return real ? `${next.year}-${pad(next.month)}-${pad(next.day)}` : "";
  }

  const commit = (next: Record<Part, string>) => {
    setParts(next);
    onChange(toIso(next));
  };

  const focusPart = (part: Part | undefined) => {
    if (!part) return;
    const input = refs.current[part];
    input?.focus();
    input?.select();
  };

  const update = (part: Part, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, partMeta[part].length);
    commit({ ...parts, [part]: digits });
    const index = order.indexOf(part);
    const full =
      digits.length === partMeta[part].length ||
      (part === "day" && Number(digits) > 3) ||
      (part === "month" && Number(digits) > 1);
    if (full) focusPart(order[index + 1]);
  };

  const onKeyDown = (part: Part, event: KeyboardEvent<HTMLInputElement>) => {
    const index = order.indexOf(part);
    if (event.key === "Backspace" && parts[part] === "") {
      event.preventDefault();
      focusPart(order[index - 1]);
    } else if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0) {
      focusPart(order[index - 1]);
    } else if (
      event.key === "ArrowRight" &&
      event.currentTarget.selectionEnd === event.currentTarget.value.length
    ) {
      focusPart(order[index + 1]);
    } else if (event.key === "/" || event.key === "-" || event.key === ".") {
      event.preventDefault();
      focusPart(order[index + 1]);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = parsePasted(event.clipboardData.getData("text"));
    if (!pasted) return;
    event.preventDefault();
    commit(pasted);
    focusPart(order[2]);
  };

  return (
    <div className="grid gap-2">
      <label htmlFor={`${id}-${order[0]}`} className="text-sm font-medium text-mist-200">
        {label}
      </label>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-invalid={Boolean(shownError)}
        className="group flex h-12 items-center gap-1 rounded-2xl bg-white/4 px-4 ring-1 ring-inset ring-white/10 transition-[background-color,box-shadow] duration-200 hover:ring-white/18 focus-within:bg-white/6 focus-within:ring-2 focus-within:ring-lavender-400 aria-[invalid=true]:ring-danger/70"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur?.();
        }}
      >
        <span id={`${id}-label`} className="sr-only">
          {label}
        </span>
        {order.map((part, index) => (
          <span key={part} className="flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="mx-1.5 text-mist-500">
                /
              </span>
            )}
            <input
              ref={(element) => {
                refs.current[part] = element;
              }}
              id={`${id}-${part}`}
              aria-label={partMeta[part].label}
              inputMode="numeric"
              autoComplete={`bday-${part}`}
              placeholder={partMeta[part].placeholder}
              value={parts[part]}
              onChange={(event) => update(part, event.target.value)}
              onKeyDown={(event) => onKeyDown(part, event)}
              onPaste={onPaste}
              onFocus={(event) => event.currentTarget.select()}
              className={cn(
                "bg-transparent text-center text-[0.95rem] tabular-nums text-mist-50 outline-none placeholder:text-mist-500",
                partMeta[part].width,
              )}
            />
          </span>
        ))}
        <Icon name="calendar" className="ml-auto size-[1.1rem] text-mist-500" />
      </div>
      {shownError ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
          <Icon name="warning" className="size-3.5" weight="bold" />
          {shownError}
        </p>
      ) : (
        date && (
          <p className="text-[0.8rem] text-mist-400">
            {new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(date)}
          </p>
        )
      )}
    </div>
  );
}
