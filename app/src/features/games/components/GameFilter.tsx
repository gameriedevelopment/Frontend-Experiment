import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useGameOptions } from "../hooks";

/** A filter pill for one game: popular games on open, searchable for the rest. Values are game names. */
export function GameFilter({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const games = useGameOptions(useDebouncedValue(query.trim()), open);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = (games.data?.data ?? []).slice(0, query.trim() ? 20 : 10);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full px-4 text-sm ring-1 ring-inset transition-colors",
          value ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/40" : "text-mist-300 ring-white/10 hover:text-mist-50 hover:ring-white/20",
        )}
      >
        <span className="text-mist-500">Game</span>
        <span className="max-w-36 truncate font-medium">{value || "Any"}</span>
        <Icon name="chevronDown" className="size-3.5 text-mist-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-ink-800 p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
          <label className="relative block">
            <span className="sr-only">Search games</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              className="h-10 w-full rounded-xl bg-white/5 pl-9 pr-3 text-sm outline-none ring-1 ring-inset ring-white/8 placeholder:text-mist-500 focus:ring-lavender-400/60"
            />
          </label>
          <ul role="listbox" aria-label="Games" className="mt-1.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/12">
            {!query.trim() && (
              <li role="presentation" className="type-label px-3 pb-1 pt-2 text-mist-500">
                Popular games
              </li>
            )}
            <li>
              <button type="button" role="option" aria-selected={!value} onClick={() => pick("")} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-mist-100 hover:bg-white/6">
                <span className="flex-1">Any game</span>
                {!value && <Icon name="check" weight="bold" className="size-3.5 text-lavender-300" />}
              </button>
            </li>
            {options.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === game.name}
                  onClick={() => pick(game.name)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-mist-100 hover:bg-white/6"
                >
                  <span className="min-w-0 flex-1 truncate">{game.name}</span>
                  {value === game.name && <Icon name="check" weight="bold" className="size-3.5 text-lavender-300" />}
                </button>
              </li>
            ))}
            {games.isFetching && !options.length && <li className="px-3 py-2 text-sm text-mist-500">Searching…</li>}
            {!games.isFetching && query.trim() && !options.length && <li className="px-3 py-2 text-sm text-mist-500">No games match</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
