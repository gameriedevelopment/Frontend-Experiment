import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonText } from "@/components/ui/Skeleton";
import { publicLinks } from "@/config/links";
import { getApiErrorMessage } from "@/lib/errors";
import { usePlayerRankings } from "../hooks";
import type { PlayerProfile } from "../types";
import { EmptyLine, ProfileSection } from "./ProfileSection";

function gameName(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const game = value as { name?: string; game?: { name?: string }; gameUsername?: string };
    return game.game?.name || game.name || game.gameUsername || "Game";
  }
  return "Game";
}

export function ProfileGames({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = usePlayerRankings(profile.id);
  const games = profile.gamesPlayed?.length ? profile.gamesPlayed : (profile.games ?? []);
  const ranks = query.data ?? [];

  return (
    <div className="grid gap-4">
      <ProfileSection
        title="Games"
        meta={
          own ? (
            <ButtonLink
              href={new URL(`/profile/${encodeURIComponent(profile.username)}?tab=games`, publicLinks.liveApp).href}
              tone="ghost"
              size="sm"
              icon="arrowUpRight"
              className="-mr-3"
            >
              Manage games
            </ButtonLink>
          ) : (
            `${games.length} ${games.length === 1 ? "game" : "games"}`
          )
        }
      >
        {games.length ? (
          <ul className="divide-y divide-white/6">
            {games.map((game, index) => {
              const rank = ranks.find(
                (item) =>
                  String(item.gameId ?? (typeof item.game === "object" ? item.game?.id : "")) ===
                  String(game.id ?? game.game?.id),
              );
              return (
                <li key={game.id || index} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-lavender-300">
                    <Icon name="games" className="size-5" weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{game.game?.name || game.name || "Game"}</p>
                    <p className="mt-0.5 truncate text-xs text-mist-400">
                      {game.gameUsername || game.platform || game.platforms?.join(" · ") || "Player account"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{game.rankData?.rank || game.rank || game.skillLevel || "Unranked"}</p>
                    {rank?.rankingScore != null && (
                      <p className="mt-0.5 text-xs text-mist-500">{Math.round(rank.rankingScore)} ranking score</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyLine>
            {own ? "Add the games you play so your profile and rankings can follow them." : "No games have been added yet."}
          </EmptyLine>
        )}
      </ProfileSection>

      <ProfileSection
        title="Rankings"
        meta={
          <Link to="/leaderboard" className="flex items-center gap-1 font-medium text-lavender-300 hover:text-lavender-200">
            Leaderboards
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        }
      >
        {query.isLoading ? (
          <SkeletonText lines={3} />
        ) : query.isError ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-danger">{getApiErrorMessage(query.error, "Rankings could not be loaded.")}</p>
            <button type="button" onClick={() => void query.refetch()} className="text-sm font-medium text-lavender-300">
              Try again
            </button>
          </div>
        ) : ranks.length ? (
          <ol className="divide-y divide-white/6">
            {ranks.map((rank, index) => (
              <li key={rank.gameId || index} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <span className="w-5 text-sm font-semibold tabular-nums text-mist-500">{index + 1}</span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{gameName(rank.game)}</p>
                <span className="type-display text-lg tabular-nums">{Math.round(rank.rankingScore ?? 0)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyLine>Rankings appear once verified competitive results are recorded.</EmptyLine>
        )}
      </ProfileSection>
    </div>
  );
}
