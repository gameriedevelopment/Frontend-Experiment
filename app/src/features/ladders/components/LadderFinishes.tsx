import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { useHostedLadders, useLadderFinishes } from "../hooks";
import type { LadderResultLadder } from "../types";

const ordinal = (value: number) => {
  const rest = value % 100;
  if (rest >= 11 && rest <= 13) return `${value}th`;
  return `${value}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th"}`;
};

const endedOn = (ladder: LadderResultLadder) =>
  ladder.endedAt ? new Date(ladder.endedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null;

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

function LadderLink({ ladder }: { ladder: LadderResultLadder }) {
  return (
    <Link to={`/ladders/${ladder.id}`} className="block truncate text-sm font-semibold hover:text-lavender-200">
      {ladder.name}
    </Link>
  );
}

/** Where a player or team finished in each ladder, newest first. */
export function LadderFinishList({
  subject,
  empty,
  limit = 5,
}: {
  subject: { userId: string } | { teamId: string };
  empty?: string;
  limit?: number;
}) {
  const query = useLadderFinishes(subject);
  if (query.isLoading) return <Skeleton className="h-28 rounded-2xl" />;
  const items = query.data?.items ?? [];
  if (!items.length) return empty ? <p className="text-sm text-mist-500">{empty}</p> : null;

  return (
    <ul className="grid gap-1">
      {items.slice(0, limit).map((item) => (
        <li key={item.ladder.id} className="flex items-center gap-3 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
          <Place value={item.place} />
          <span className="min-w-0 flex-1">
            <LadderLink ladder={item.ladder} />
            <span className="block truncate text-xs text-mist-500">
              {[
                item.ladder.game,
                item.team && "userId" in subject ? `with ${item.team.name}` : null,
                `${item.points} pts · ${item.record.won}W ${item.record.drawn}D ${item.record.lost}L`,
                endedOn(item.ladder),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          {item.prizeWinner && (
            <span className="type-label hidden shrink-0 rounded-full bg-signal/10 px-2 py-0.5 text-signal sm:inline">Prize</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Ladders a hub ran, with who won each. */
export function HostedLadderList({ hubId, limit = 5 }: { hubId: string; limit?: number }) {
  const query = useHostedLadders(hubId);
  if (query.isLoading) return <Skeleton className="h-28 rounded-2xl" />;
  const items = query.data?.items ?? [];
  if (!items.length) return <p className="text-sm text-mist-500">No finished ladders yet.</p>;

  return (
    <ul className="grid gap-1">
      {items.slice(0, limit).map((item) => (
        <li key={item.ladder.id} className="flex items-center gap-3 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
          <span className="min-w-0 flex-1">
            <LadderLink ladder={item.ladder} />
            <span className="block truncate text-xs text-mist-500">
              {[item.ladder.game, `${item.ladder.entrants} ${item.ladder.entrantType === "team" ? "teams" : "players"}`, endedOn(item.ladder)]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          {item.champion && (
            <span className="flex min-w-0 shrink-0 items-center gap-2 text-xs text-mist-300">
              <Icon name="crown" weight="fill" className="size-3.5 text-signal" />
              <Avatar src={item.champion.avatar ?? undefined} name={item.champion.name} size="sm" className="rounded-full" />
              <span className="max-w-28 truncate font-semibold">{item.champion.name}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
