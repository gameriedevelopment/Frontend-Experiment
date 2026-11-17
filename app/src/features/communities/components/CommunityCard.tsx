import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { TournamentArt } from "@/features/tournaments/components/TournamentArt";
import { cn } from "@/lib/cn";
import { countOf, hrefOf, hubTypeLabel, type Community } from "../format";
import type { CommunityKind, HubSummary, TeamSummary } from "../types";

export function CommunityCard({ kind, item, role }: { kind: CommunityKind; item: Community; role?: string }) {
  const team = item as TeamSummary;
  const hub = item as HubSummary;
  const members = countOf(item.membersCount, item.members);
  const games = item.games?.slice(0, 2) ?? [];
  const tag = kind === "team" ? team.level : hubTypeLabel(hub);

  return (
    <Link
      to={hrefOf(kind, item)}
      className="group flex flex-col overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6 transition-[box-shadow,background-color] hover:bg-ink-900 hover:ring-lavender-400/30"
    >
      <TournamentArt src={item.backgroundImage} game={item.name} className="h-24 shrink-0" />
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-7 flex items-end justify-between gap-3">
          <Avatar src={item.logo} name={item.name} size="lg" tone="ink" className="rounded-2xl ring-4 ring-ink-900" />
          {role ? (
            <span className={cn("type-label rounded-full px-2.5 py-1", role === "Owner" ? "bg-lavender-400/14 text-lavender-300" : "bg-white/6 text-mist-300")}>{role}</span>
          ) : (
            hub.visibility === "private" && (
              <span className="type-label flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-mist-300">
                <Icon name="lock" className="size-3" />
                Private
              </span>
            )
          )}
        </div>
        <h3 className="mt-3 truncate text-base font-semibold transition-colors group-hover:text-lavender-100">{item.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-relaxed text-mist-400">
          {item.description || (kind === "team" ? "A team building its record on Gamerie." : "A home for players and teams who share a game or a place.")}
        </p>
        <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-mist-400">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Members</dt>
            <Icon name="people" className="size-3.5 text-mist-500" />
            <dd className="tabular-nums">
              {members.toLocaleString()} {members === 1 ? "member" : "members"}
            </dd>
          </div>
          {kind === "hub" && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Teams</dt>
              <Icon name="team" className="size-3.5 text-mist-500" />
              <dd className="tabular-nums">{countOf(hub.teamsCount, hub.teams).toLocaleString()} teams</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Region</dt>
            <Icon name="mapPin" className="size-3.5 text-mist-500" />
            <dd>{item.region || item.country || "Global"}</dd>
          </div>
          {tag && (
            <div>
              <dt className="sr-only">{kind === "team" ? "Level" : "Type"}</dt>
              <dd>{tag}</dd>
            </div>
          )}
        </dl>
        {games.length > 0 && (
          <p className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {games.map((game) => (
              <span key={game.id || game.name} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist-300">
                <Icon name="games" className="size-3.5 text-lavender-300" />
                {game.name}
              </span>
            ))}
          </p>
        )}
      </div>
    </Link>
  );
}
