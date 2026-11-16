import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useTogglePlayerFollow } from "@/features/profile/hooks";
import type { PlayerProfile } from "@/features/profile/types";
import { HomePanel, PanelError, RowSkeletons } from "./HomePanel";

function PlayerRow({ player, currentUserId }: { player: PlayerProfile; currentUserId: string }) {
  const following = Boolean(player.isFollowedByCurrentUser);
  const follow = useTogglePlayerFollow(currentUserId, player.id, following);
  const game = player.gamesPlayed?.[0]?.name || player.games?.[0]?.name;
  const detail = player.gamerTitle || game || player.region || "Gamerie player";

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Link to={`/profile/${encodeURIComponent(player.username)}`} className="group flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={player.profileImage} name={player.username} online={player.isOnline} size="md" className="rounded-full" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold transition-colors group-hover:text-lavender-200">
            {player.username}
          </span>
          <span className="mt-0.5 block truncate text-sm text-mist-400">{detail}</span>
        </span>
      </Link>
      <Button
        size="sm"
        tone={following ? "ghost" : "outline"}
        icon={following ? "check" : undefined}
        disabled={follow.isPending}
        aria-label={`${following ? "Unfollow" : "Follow"} ${player.username}`}
        onClick={() => follow.mutate()}
      >
        {following ? "Following" : "Follow"}
      </Button>
    </li>
  );
}

export function PlayersToFollow({
  players,
  currentUserId,
  loading,
  failed,
  onRetry,
  className,
}: {
  players: PlayerProfile[];
  currentUserId: string;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  className?: string;
}) {
  // Fix the suggestions on first load so a row stays in place, showing "Following", after it is followed.
  const [shownIds, setShownIds] = useState<string[] | null>(null);
  if (!shownIds && players.length) {
    setShownIds(
      players
        .filter((player) => player.id !== currentUserId && !player.isFollowedByCurrentUser)
        .slice(0, 4)
        .map((player) => player.id),
    );
  }
  const shown = (shownIds ?? [])
    .map((id) => players.find((player) => player.id === id))
    .filter((player): player is PlayerProfile => Boolean(player));

  return (
    <HomePanel className={className} title="Players to follow" link={{ label: "Discover", to: "/users" }}>
      {loading ? (
        <RowSkeletons rows={4} />
      ) : failed ? (
        <PanelError onRetry={onRetry} />
      ) : shown.length ? (
        <ul className="-mx-3 -my-1 flex flex-col gap-1">
          {shown.map((player) => (
            <PlayerRow key={player.id} player={player} currentUserId={currentUserId} />
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-mist-400">
          You're following everyone we'd suggest right now. Discover has more players by game, region and level.
        </p>
      )}
    </HomePanel>
  );
}
