import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { TournamentArt } from "@/features/tournaments/components/TournamentArt";
import type { Game, GameStats } from "../types";

const compact = new Intl.NumberFormat(undefined, { notation: "compact" });

export function GameCard({ game, stats, statsLoading }: { game: Game; stats?: GameStats; statsLoading?: boolean }) {
  const platforms = game.platforms ?? [];
  return (
    <Link
      to={`/games/${encodeURIComponent(game.id)}`}
      className="group flex flex-col overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6 transition-[box-shadow,background-color] hover:bg-ink-900 hover:ring-lavender-400/30"
    >
      <div className="relative aspect-video overflow-hidden">
        <TournamentArt src={game.wallPhoto} game={game.name} className="size-full transition-transform duration-700 group-hover:scale-[1.03]" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-ink-900/80 to-transparent" />
        {game.gameType && (
          <span className="type-label absolute left-3 top-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
            {game.gameType}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-base font-semibold transition-colors group-hover:text-lavender-100">{game.name}</h3>
        {game.company && <p className="mt-0.5 truncate text-sm text-mist-500">{game.company}</p>}
        <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-mist-400">
          {stats ? (
            <>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Players</dt>
                <Icon name="people" className="size-3.5 text-mist-500" />
                <dd className="tabular-nums" title={`${stats.usersCount.toLocaleString()} players`}>
                  {compact.format(stats.usersCount)} {stats.usersCount === 1 ? "player" : "players"}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Teams</dt>
                <Icon name="team" className="size-3.5 text-mist-500" />
                <dd className="tabular-nums" title={`${stats.teamsCount.toLocaleString()} teams`}>
                  {compact.format(stats.teamsCount)} {stats.teamsCount === 1 ? "team" : "teams"}
                </dd>
              </div>
            </>
          ) : statsLoading ? (
            <Skeleton className="h-3.5 w-36 rounded-full" />
          ) : null}
        </dl>
        {platforms.length > 0 && (
          <p className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {platforms.slice(0, 3).map((platform) => (
              <span key={platform} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist-300">
                {platform}
              </span>
            ))}
            {platforms.length > 3 && <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist-500">+{platforms.length - 3}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}
