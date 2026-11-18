import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { entrantPath } from "@/lib/paths";
import { useHostedLeagueSeasons, useLeagueFinishes } from "../hooks";
import type { LeagueResultLeague } from "../types";
import { ordinal } from "../utils";

const endedOn = (league: LeagueResultLeague) =>
  league.season.endedAt ? new Date(league.season.endedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null;

function Place({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "type-display flex h-9 min-w-12 shrink-0 items-center justify-center gap-1 rounded-xl px-2.5 text-sm",
        value === 1 ? "bg-signal/12 text-signal" : value <= 3 ? "bg-lavender-400/12 text-lavender-200" : "bg-white/5 text-mist-300",
      )}
    >
      {value === 1 && <Icon name="crown" weight="fill" className="size-3.5" />}
      {ordinal(value)}
    </span>
  );
}

function SeasonLink({ league }: { league: LeagueResultLeague }) {
  return (
    <Link to={`/leagues/${league.id}?season=${league.season.id}`} className="block truncate text-sm font-semibold hover:text-lavender-200">
      {league.name} <span className="font-normal text-mist-400">· S{league.season.number}</span>
    </Link>
  );
}

/** Where a player or team finished in each league season, newest first. */
export function LeagueFinishList({ subject, empty, limit = 5 }: { subject: { userId: string } | { teamId: string }; empty?: string; limit?: number }) {
  const query = useLeagueFinishes(subject);
  if (query.isLoading) return <Skeleton className="h-28 rounded-2xl" />;
  const items = query.data?.items ?? [];
  if (!items.length) return empty ? <p className="text-sm text-mist-500">{empty}</p> : null;

  return (
    <ul className="grid gap-1">
      {items.slice(0, limit).map((item) => (
        <li key={item.league.season.id} className="flex items-center gap-3 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
          <Place value={item.place} />
          <span className="min-w-0 flex-1">
            <SeasonLink league={item.league} />
            <span className="block truncate text-xs text-mist-500">
              {[
                item.league.game,
                item.team && "userId" in subject ? `with ${item.team.name}` : null,
                `${item.points} pts · ${item.record.won}W ${item.record.drawn}D ${item.record.lost}L`,
                endedOn(item.league),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** League seasons a hub ran, with each champion. */
export function HostedLeagueList({ hubId, limit = 5 }: { hubId: string; limit?: number }) {
  const query = useHostedLeagueSeasons(hubId);
  if (query.isLoading) return <Skeleton className="h-28 rounded-2xl" />;
  const items = query.data?.items ?? [];
  if (!items.length) return <p className="text-sm text-mist-500">No finished league seasons yet.</p>;

  return (
    <ul className="grid gap-1">
      {items.slice(0, limit).map((item) => (
        <li key={item.league.season.id} className="flex items-center gap-3 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
          <span className="min-w-0 flex-1">
            <SeasonLink league={item.league} />
            <span className="block truncate text-xs text-mist-500">
              {[item.league.game, `${item.league.season.entrants} ${item.league.entrantType === "team" ? "teams" : "players"}`, endedOn(item.league)].filter(Boolean).join(" · ")}
            </span>
          </span>
          {item.champion && (
            <EntrantLink to={entrantPath(item.champion)} className="flex min-w-0 shrink-0 items-center gap-2 text-xs text-mist-300">
              <Icon name="crown" weight="fill" className="size-3.5 text-signal" />
              <Avatar src={item.champion.avatar ?? undefined} name={item.champion.name} size="sm" className="rounded-full" />
              <span className="max-w-28 truncate font-semibold">{item.champion.name}</span>
            </EntrantLink>
          )}
        </li>
      ))}
    </ul>
  );
}
