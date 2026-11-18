import { Icon } from "@/components/ui/Icon";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { cn } from "@/lib/cn";
import { entrantPath } from "@/lib/paths";
import type { BracketEntrant, TournamentBracket } from "../types";
import { ordinal } from "../utils";
import { EntrantMark } from "./EntrantMark";

const order = [2, 1, 3];
const heights: Record<number, string> = { 1: "h-28", 2: "h-20", 3: "h-14" };

/** The top three on steps, champion in the middle. */
export function Podium({ bracket }: { bracket: TournamentBracket }) {
  const entrants = new Map<string, BracketEntrant>(bracket.entrants.map((entrant) => [entrant.id, entrant]));
  const places = new Map(bracket.podium.map((row) => [row.placement, entrants.get(row.entrantId)]));
  if (!places.get(1)) return null;

  return (
    <section
      aria-label="Final standings"
      className="relative overflow-hidden rounded-card bg-ink-900/60 px-5 pt-6 ring-1 ring-inset ring-white/6 sm:px-8"
    >
      <div className="halftone absolute inset-0 text-signal/10 mask-[radial-gradient(50%_70%_at_50%_100%,black,transparent)]" />
      <h2 className="type-label relative text-center text-mist-500">Final standings</h2>
      <ol className="relative mt-6 grid grid-cols-3 items-end gap-2 sm:gap-4">
        {order.map((place) => {
          const entrant = places.get(place);
          return (
            <li key={place} className="grid min-w-0 justify-items-center gap-3">
              {entrant ? (
                <>
                  {place === 1 && <Icon name="crown" weight="fill" className="size-5 text-signal" />}
                  <EntrantLink to={entrantPath(entrant)} className="grid w-full min-w-0 justify-items-center gap-3">
                    <EntrantMark name={entrant.name} src={entrant.avatar} size={place === 1 ? "lg" : "md"} />
                    <span className="w-full truncate text-center text-sm font-semibold">{entrant.name}</span>
                  </EntrantLink>
                </>
              ) : (
                <span className="text-sm text-mist-500">Shared</span>
              )}
              <span
                className={cn(
                  "grid w-full place-items-center rounded-t-2xl ring-1 ring-inset",
                  heights[place],
                  place === 1 ? "bg-signal/12 ring-signal/30" : "bg-white/4 ring-white/8",
                )}
              >
                <span className={cn("type-display text-xl", place === 1 ? "text-signal" : "text-mist-300")}>
                  {ordinal(place)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
