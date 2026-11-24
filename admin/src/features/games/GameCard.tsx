import { Link } from "react-router-dom";
import { Stamp } from "@/components/record/Stamp";
import { Icon } from "@/components/ui/Icon";
import { figure } from "@/lib/format";
import { coverOf } from "./catalog";
import type { GameRow } from "./types";

export function GameCard({ game, live }: { game: GameRow; live: boolean }) {
  const cover = coverOf(game.wallPhoto);
  return (
    <Link
      to={`/games/${game.id}`}
      className="group grid min-w-0 overflow-hidden rounded-card bg-ink-900/70 ring-1 ring-inset ring-white/6 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:ring-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400"
    >
      <div className="relative aspect-video overflow-hidden bg-ink-800">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid size-full place-items-center text-mist-600">
            <Icon name="games" weight="duotone" className="size-9" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/5 to-transparent" />
        {(live || game.matchVerificationAdapter) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {live && (
              <Stamp tone="signal" icon="pulse" className="bg-ink-950/70 backdrop-blur">
                Live stats
              </Stamp>
            )}
            {game.matchVerificationAdapter && (
              <Stamp tone="lavender" icon="verified" className="bg-ink-950/70 backdrop-blur">
                Verifies results
              </Stamp>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-3 px-4 pb-4">
        <div className="min-w-0">
          <p className="truncate font-semibold text-mist-50">{game.name}</p>
          <p className="mt-0.5 truncate text-xs text-mist-400">{[game.company, game.gameType].filter(Boolean).join(" · ") || "No publisher set"}</p>
        </div>
        <p className="flex gap-4 font-mono text-xs text-mist-500">
          <span>
            <span className="font-semibold text-mist-100">{figure(game.usersCount)}</span> {game.usersCount === 1 ? "player" : "players"}
          </span>
          <span>
            <span className="font-semibold text-mist-100">{figure(game.teamsCount)}</span> {game.teamsCount === 1 ? "team" : "teams"}
          </span>
        </p>
      </div>
    </Link>
  );
}
