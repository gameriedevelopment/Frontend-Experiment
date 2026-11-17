import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TournamentArt } from "./TournamentArt";

/**
 * Event hero at a fixed, compact height. An uploaded banner sits to the right and fades into the card,
 * so the title always reads on solid ground; generated art sits behind it.
 */
export function HeroBanner({ src, game, className, children }: { src?: string | null; game: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative flex flex-col justify-end", className)}>
      <TournamentArt src={src} game={game} className={cn("absolute inset-0", src && "lg:left-2/5")} />
      {src ? (
        <>
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink-900 from-15% via-ink-900/75 to-ink-900/20 lg:hidden" />
          <div aria-hidden="true" className="absolute inset-0 hidden bg-linear-to-r from-ink-900 from-40% via-ink-900/70 via-55% to-ink-900/0 lg:block" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-1/2 bg-linear-to-t from-ink-900 to-transparent lg:block" />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/55 to-ink-900/5" />
      )}
      <div className="relative p-5 pt-20 sm:p-8 sm:pt-24">{children}</div>
    </div>
  );
}
