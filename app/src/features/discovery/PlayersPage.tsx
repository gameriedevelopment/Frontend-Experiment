import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useAuthStore } from "@/features/auth/authStore";
import { TEAM_LEVELS } from "@/features/communities/options";
import { GameFilter } from "@/features/games/components/GameFilter";
import { useTogglePlayerFollow } from "@/features/profile/hooks";
import { PROFILE_REGIONS } from "@/features/profile/regions";
import type { PlayerProfile } from "@/features/profile/types";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { usePlayers } from "./hooks";
import type { PlayerFilters } from "./types";

const platforms = [
  { value: "PC", label: "PC" },
  { value: "XBOX", label: "Xbox" },
  { value: "PS5", label: "PS5" },
  { value: "Switch", label: "Switch" },
  { value: "Mobile", label: "Mobile" },
];

function FollowButton({ player, viewerId }: { player: PlayerProfile; viewerId: string }) {
  const following = Boolean(player.isFollowedByCurrentUser);
  const follow = useTogglePlayerFollow(viewerId, player.id, following);
  return (
    <Button
      size="sm"
      tone={following ? "ghost" : "outline"}
      icon={following ? "check" : undefined}
      disabled={follow.isPending}
      aria-label={`${following ? "Unfollow" : "Follow"} ${player.username}`}
      onClick={() =>
        follow.mutate(undefined, {
          onError: (error) => toast.error(following ? "Couldn't unfollow" : "Couldn't follow", getApiErrorMessage(error, "Try again in a moment.")),
        })
      }
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

function PlayerCard({ player, viewerId }: { player: PlayerProfile; viewerId?: string }) {
  const games = (player.gamesPlayed?.length ? player.gamesPlayed : (player.games ?? [])).map((game) => game.name).filter(Boolean).slice(0, 2);
  const followers = Number(player.followersCount ?? 0);
  const wins = Number(player.stats?.wins ?? 0);
  const location = player.region || player.personalInfo?.location;
  const href = `/profile/${encodeURIComponent(player.username)}`;
  return (
    <article className="group relative flex flex-col rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 transition-[box-shadow,background-color] hover:bg-ink-900 hover:ring-lavender-400/30">
      <div className="flex items-start gap-3">
        <Avatar src={player.profileImage} name={player.username} online={player.isOnline} size="lg" />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate text-base font-semibold transition-colors group-hover:text-lavender-100">
            <Link to={href} className="after:absolute after:inset-0 after:rounded-card">
              {player.username}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-mist-400">{[player.gamerTitle, player.gameLevel].filter(Boolean).join(" · ") || "Player"}</p>
        </div>
        {viewerId && viewerId !== player.id && (
          <div className="relative shrink-0">
            <FollowButton player={player} viewerId={viewerId} />
          </div>
        )}
      </div>
      <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-mist-400">
        {location && (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Region</dt>
            <Icon name="mapPin" className="size-3.5 text-mist-500" />
            <dd>{location}</dd>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Followers</dt>
          <Icon name="people" className="size-3.5 text-mist-500" />
          <dd className="tabular-nums">
            {followers.toLocaleString()} {followers === 1 ? "follower" : "followers"}
          </dd>
        </div>
        {wins > 0 && (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Wins</dt>
            <Icon name="trophy" className="size-3.5 text-mist-500" />
            <dd className="tabular-nums">
              {wins.toLocaleString()} {wins === 1 ? "win" : "wins"}
            </dd>
          </div>
        )}
      </dl>
      {games.length > 0 && (
        <p className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {games.map((game) => (
            <span key={game} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist-300">
              <Icon name="games" className="size-3.5 text-lavender-300" />
              {game}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

export function PlayersPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());
  const level = params.get("level") ?? "";
  const platform = params.get("platform") ?? "";
  const game = params.get("game") ?? "";
  const region = params.get("region") ?? "";
  const filters = useMemo<PlayerFilters>(
    () => ({ search: term || undefined, gameLevel: level || undefined, platform: platform || undefined, game: game || undefined, region: region || undefined }),
    [game, level, platform, region, term],
  );
  const query = usePlayers(filters);
  const players = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const filtered = Boolean(term || level || platform || game || region);

  const setParam = (key: string, value?: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    // Mirror the debounced search into the URL so a search survives reloads and sharing.
    setParams(
      (current) => {
        if ((current.get("q") ?? "") === term) return current;
        const next = new URLSearchParams(current);
        if (term) next.set("q", term);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [setParams, term]);

  const clear = () => {
    setSearch("");
    setParams({}, { replace: true });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Players" description="Find people who play what you play, at your level and near you." />

      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-64">
            <span className="sr-only">Search players</span>
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by username" className={cn(inputClasses, "h-11 rounded-full pl-11")} />
          </label>
          <GameFilter value={game} onChange={(value) => setParam("game", value)} />
          <FilterMenu label="Level" value={level} options={TEAM_LEVELS} onChange={(value) => setParam("level", value)} />
          <FilterMenu label="Platform" value={platform} options={platforms} onChange={(value) => setParam("platform", value)} />
          <FilterMenu label="Region" value={region} options={PROFILE_REGIONS} onChange={(value) => setParam("region", value)} />
        </div>

        {query.isLoading ? (
          <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-44 rounded-card" />
            ))}
          </div>
        ) : query.isError ? (
          <StatePanel
            icon="warning"
            tone="danger"
            title="Players didn't load"
            description={getApiErrorMessage(query.error, "Try again in a moment.")}
            action={
              <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : players.length ? (
          <>
            {filtered && (
              <p className="text-sm text-mist-500">
                {total.toLocaleString()} {total === 1 ? "player matches" : "players match"}
              </p>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {players.map((player) => (
                <PlayerCard key={player.id} player={player} viewerId={user?.id} />
              ))}
            </div>
            {query.hasNextPage && (
              <Button tone="outline" size="sm" className="mx-auto" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            )}
          </>
        ) : (
          <StatePanel
            icon="people"
            title={filtered ? "No players match" : "No players yet"}
            description={filtered ? "Try another search or clear a filter." : "Players show up here as they join Gamerie."}
            action={
              filtered ? (
                <Button tone="outline" size="sm" onClick={clear}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
