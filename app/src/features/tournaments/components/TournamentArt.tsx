import { useState } from "react";
import { cn } from "@/lib/cn";

/** A tournament's banner, or a generated halftone plate with the game's name when there isn't one. */
export function TournamentArt({ src, game, className }: { src?: string | null; game: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-ink-850", className)}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_85%_0%,rgb(198_163_255/0.32),transparent_60%)]" />
          <div className="halftone absolute inset-0 text-lavender-300/20 mask-[radial-gradient(80%_90%_at_80%_10%,black,transparent)]" />
          <span
            aria-hidden="true"
            className="type-display absolute -bottom-[0.18em] left-4 right-4 truncate text-[clamp(2.4rem,5vw,3.6rem)] leading-none text-white/6"
          >
            {game}
          </span>
        </>
      )}
    </div>
  );
}
