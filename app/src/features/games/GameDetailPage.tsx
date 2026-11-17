import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/features/auth/authStore";
import { hrefOf } from "@/features/communities/format";
import { COMMUNITY_REGIONS } from "@/features/communities/options";
import { OpenTournaments } from "@/features/home/components/OpenTournaments";
import { VERIFIABLE_ADAPTERS } from "@/features/matches/verification";
import { HeroBanner } from "@/features/tournaments/components/HeroBanner";
import { useOpenTournaments } from "@/features/tournaments/hooks";
import { cn, titleSize } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { GAME_PROVIDERS } from "./connections/registry";
import { useActiveGameTeams, useActiveGameUsers, useGame, useGameConnections, useGameStats, useGridSeries } from "./hooks";
import type { ActiveGameTeam, ActiveGameUser, Game, GridGameKey, GridSeries } from "./types";

type Section = "overview" | "players" | "teams" | "schedule";

const safeUrl = (value?: string) => (value && /^https?:\/\//i.test(value) ? value : undefined);
const channelNames: Record<string, string> = { x: "X", twitter: "X", youtube: "YouTube", tiktok: "TikTok", twitch: "Twitch", instagram: "Instagram", discord: "Discord", facebook: "Facebook", reddit: "Reddit" };
const channelName = (platform: string) => channelNames[platform.toLowerCase()] ?? platform;
const percent = (wins?: number, played?: number, rate?: number | string) =>
  played ? `${Math.round(((wins ?? 0) / played) * 100)}%` : rate != null && Number(rate) > 0 ? `${Math.round(Number(rate))}%` : "—";

/** Verified match schedules exist for a few titles only. */
function gridKeyOf(game: Game): GridGameKey | undefined {
  const identity = `${game.integrationKey ?? ""} ${game.name}`.toLowerCase();
  if (identity.includes("dota")) return "dota-2";
  if (identity.includes("cs2") || identity.includes("counter-strike") || identity.includes("counter strike")) return "cs2";
  return undefined;
}

function providerOf(game: Game) {
  const key = game.integrationKey?.toLowerCase();
  const name = game.name.toLowerCase();
  return GAME_PROVIDERS.find((provider) => provider.id === key || provider.name.toLowerCase() === name);
}

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function MoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex shrink-0 items-center gap-1 text-sm font-medium text-mist-400 transition-colors hover:text-lavender-200">
      {label}
      <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Chips({ items, empty }: { items?: string[]; empty: string }) {
  return items?.length ? (
    <p className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist-200 ring-1 ring-inset ring-white/6">
          {item}
        </span>
      ))}
    </p>
  ) : (
    <p className="text-sm text-mist-500">{empty}</p>
  );
}

function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-1">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-1/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Place({ position }: { position?: number }) {
  if (!position) return null;
  return <span className={cn("w-6 shrink-0 text-right text-sm font-semibold tabular-nums", position <= 3 ? "text-lavender-300" : "text-mist-500")}>{position}</span>;
}

const playerColumns = [
  { label: "Rank", className: "hidden w-24 sm:block" },
  { label: "Rating", className: "w-20" },
  { label: "Win rate", className: "hidden w-20 md:block" },
];
const teamColumns = [
  { label: "Rating", className: "w-20" },
  { label: "Win rate", className: "hidden w-20 sm:block" },
  { label: "Roster", className: "hidden w-20 md:block" },
];

/** Rows carry their labels for screen readers; sighted readers get one header above the list. */
function Metric({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("text-right", className)}>
      <dt className="sr-only">{label}</dt>
      <dd className="truncate text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ColumnHeader({ lead, columns }: { lead: string; columns: Array<{ label: string; className: string }> }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 px-3 pb-2 pt-3">
      <span className="min-w-0 flex-1 truncate text-xs text-mist-500">{lead}</span>
      <span className="flex shrink-0 items-center gap-2">
        {columns.map((column) => (
          <span key={column.label} className={cn("type-label text-right text-mist-500", column.className)}>
            {column.label}
          </span>
        ))}
      </span>
    </div>
  );
}

function PlayerRow({ entry, position, compact }: { entry: ActiveGameUser; position?: number; compact?: boolean }) {
  const user = entry.user;
  const rank = entry.rankData?.rank || entry.rankData?.tier || entry.skillLevel;
  const rating = entry.rankData?.rankPoints ?? user.stats?.rankingScore ?? user.stats?.eloRating;
  const handle = entry.nickname || entry.gameUsername;
  return (
    <Link to={`/profile/${encodeURIComponent(user.username)}`} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/4">
      <Place position={position} />
      <Avatar src={user.profileImage} name={user.username} online={user.isOnline} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{user.username}</span>
        <span className="block truncate text-xs text-mist-500">{[handle && handle !== user.username ? handle : null, compact ? rank : entry.platform].filter(Boolean).join(" · ") || user.gamerTitle || "Player"}</span>
      </span>
      {!compact && (
        <dl className="flex shrink-0 items-center gap-2">
          <Metric label="Rank" value={rank || "—"} className={playerColumns[0].className} />
          <Metric label="Rating" value={rating != null && Number(rating) > 0 ? Number(rating).toLocaleString() : "—"} className={playerColumns[1].className} />
          <Metric label="Win rate" value={percent(user.stats?.wins, user.stats?.matchesPlayed, user.stats?.winRate)} className={playerColumns[2].className} />
        </dl>
      )}
    </Link>
  );
}

function TeamRow({ team, position, compact }: { team: ActiveGameTeam; position?: number; compact?: boolean }) {
  const members = team.members?.length ?? 0;
  return (
    <Link to={hrefOf("team", { id: team.id, slug: team.slug })} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/4">
      <Place position={position} />
      <Avatar src={team.logo} name={team.name} tone="ink" className="rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{team.name}</span>
        <span className="block truncate text-xs text-mist-500">{[team.region, team.level].filter(Boolean).join(" · ") || "Team"}</span>
      </span>
      {!compact && (
        <dl className="flex shrink-0 items-center gap-2">
          <Metric label="Rating" value={team.stats?.ranking ? team.stats.ranking.toLocaleString() : "—"} className={teamColumns[0].className} />
          <Metric label="Win rate" value={percent(team.stats?.wins, team.stats?.matchesPlayed, team.stats?.winRate)} className={teamColumns[1].className} />
          <Metric label="Roster" value={members} className={teamColumns[2].className} />
        </dl>
      )}
    </Link>
  );
}

function SeriesRow({ series }: { series: GridSeries }) {
  const date = new Date(series.startTimeScheduled);
  const past = date.getTime() < Date.now();
  return (
    <li className="flex items-center gap-4 rounded-2xl px-3 py-3">
      <time dateTime={series.startTimeScheduled} className={cn("grid w-12 shrink-0 place-items-center rounded-xl py-1.5 ring-1 ring-inset", past ? "bg-white/3 text-mist-400 ring-white/6" : "bg-lavender-400/10 text-lavender-200 ring-lavender-400/20")}>
        <span className="text-lg font-semibold leading-none tabular-nums">{date.toLocaleDateString(undefined, { day: "numeric" })}</span>
        <span className="type-label mt-1">{date.toLocaleDateString(undefined, { month: "short" })}</span>
      </time>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{series.teams.length ? series.teams.map((team) => team.name).join(" vs ") : "Teams to be confirmed"}</span>
        <span className="block truncate text-xs text-mist-500">
          {[series.tournament?.name, date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }), series.format].filter(Boolean).join(" · ")}
        </span>
      </span>
    </li>
  );
}

function SeriesList({ items }: { items: GridSeries[] }) {
  const now = Date.now();
  const upcoming = items.filter((item) => new Date(item.startTimeScheduled).getTime() >= now);
  const recent = items.filter((item) => new Date(item.startTimeScheduled).getTime() < now).reverse();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {[
        { title: "Coming up", list: upcoming },
        { title: "Recently played", list: recent },
      ]
        .filter((group) => group.list.length)
        .map((group) => (
          <section key={group.title}>
            <h3 className="type-label mb-1 px-3 text-mist-500">{group.title}</h3>
            <ul className="grid grid-cols-[minmax(0,1fr)]">
              {group.list.map((item) => (
                <SeriesRow key={item.id} series={item} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function ConnectCard({ game }: { game: Game }) {
  const user = useAuthStore((state) => state.user);
  const provider = providerOf(game);
  const connections = useGameConnections(Boolean(provider && user));
  if (!provider || !user || connections.isLoading) return null;
  const connected = connections.data?.some((connection) => connection.provider === provider.id);
  if (connected) return null;
  return (
    <section className="rounded-card bg-lavender-400/8 p-5 ring-1 ring-inset ring-lavender-400/20">
      <span className="grid size-10 place-items-center rounded-2xl bg-lavender-400/14 text-lavender-300">
        <Icon name="link" className="size-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold">Connect {provider.name}</h2>
      <p className="mt-1 text-sm leading-relaxed text-mist-300">{provider.description}</p>
      <LinkButton to={`/profile/${encodeURIComponent(user.username ?? user.id)}?tab=games`} size="sm" tone="outline" className="mt-4">
        Connect account
      </LinkButton>
    </section>
  );
}

function Overview({ game, onSection }: { game: Game; onSection: (section: Section) => void }) {
  const players = useActiveGameUsers(game.id, "");
  const teams = useActiveGameTeams(game.id, {});
  const open = useOpenTournaments(3, game.name);
  const gridKey = gridKeyOf(game);
  const series = useGridSeries(gridKey);
  const playerRows = players.data?.pages[0]?.data.slice(0, 5) ?? [];
  const teamRows = teams.data?.pages[0]?.data.slice(0, 5) ?? [];
  const channels = (game.socialMedia ?? []).filter((item) => safeUrl(item.url));
  const upcoming = (series.data?.series ?? []).filter((item) => new Date(item.startTimeScheduled).getTime() >= Date.now()).slice(0, 3);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <Panel title={`About ${game.name}`}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{game.description || "No description yet."}</p>
          <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-white/6 pt-5 sm:grid-cols-3">
            {[
              ["Studio", game.company || "Not listed"],
              ["Genre", game.gameType || "Not listed"],
              ["Platforms", game.platforms?.join(", ") || "Not listed"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="type-label text-mist-500">{label}</dt>
                <dd className="mt-1 text-sm text-mist-100">{value}</dd>
              </div>
            ))}
          </dl>
          {(game.gameModes?.length || game.requiredSkills?.length) ? (
            <div className="mt-5 grid gap-5 border-t border-white/6 pt-5 sm:grid-cols-2">
              <div>
                <h3 className="type-label mb-2 text-mist-500">Ways to play</h3>
                <Chips items={game.gameModes} empty="No modes listed." />
              </div>
              <div>
                <h3 className="type-label mb-2 text-mist-500">Skills that matter</h3>
                <Chips items={game.requiredSkills} empty="No skills listed." />
              </div>
            </div>
          ) : null}
        </Panel>

        <OpenTournaments
          tournaments={open.data?.tournaments ?? []}
          loading={open.isLoading}
          title={`Open ${game.name} tournaments`}
          link={{ label: "All tournaments", to: `/tournaments?game=${encodeURIComponent(game.name)}` }}
          empty={`No ${game.name} brackets are open right now. Host one for your friends, team or hub, and Gamerie runs the bracket and records the results.`}
          hostTo={`/tournaments/create?gameId=${encodeURIComponent(game.id)}`}
        />

        {gridKey && (
          <Panel title="Pro schedule" action={<MoreButton label="Full schedule" onClick={() => onSection("schedule")} />}>
            {series.isLoading ? (
              <RowsSkeleton rows={2} />
            ) : upcoming.length ? (
              <ul className="-mx-3 grid grid-cols-[minmax(0,1fr)]">
                {upcoming.map((item) => (
                  <SeriesRow key={item.id} series={item} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist-500">{series.isError ? "The schedule isn't available right now." : "No pro series are scheduled in the next two weeks."}</p>
            )}
          </Panel>
        )}
      </div>

      <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <ConnectCard game={game} />
        <Panel title="Top players" action={playerRows.length ? <MoreButton label="All" onClick={() => onSection("players")} /> : undefined}>
          {players.isLoading ? (
            <RowsSkeleton rows={3} />
          ) : playerRows.length ? (
            <div className="-mx-3 grid grid-cols-[minmax(0,1fr)]">
              {playerRows.map((entry, index) => (
                <PlayerRow key={entry.id} entry={entry} position={index + 1} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-mist-500">No one has added {game.name} to their profile yet.</p>
          )}
        </Panel>
        <Panel title="Top teams" action={teamRows.length ? <MoreButton label="All" onClick={() => onSection("teams")} /> : undefined}>
          {teams.isLoading ? (
            <RowsSkeleton rows={3} />
          ) : teamRows.length ? (
            <div className="-mx-3 grid grid-cols-[minmax(0,1fr)]">
              {teamRows.map((team, index) => (
                <TeamRow key={team.id} team={team} position={index + 1} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-mist-500">No teams play {game.name} yet.</p>
          )}
        </Panel>
        {channels.length > 0 && (
          <Panel title="Official channels">
            <ul className="grid gap-1">
              {channels.map((item) => (
                <li key={`${item.platform}-${item.url}`}>
                  <a href={item.url} target="_blank" rel="noreferrer" className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-mist-200 hover:bg-white/4 hover:text-mist-50">
                    <Icon name="globe" className="size-4 text-mist-500" />
                    <span className="min-w-0 flex-1 truncate">{channelName(item.platform)}</span>
                    <Icon name="external" className="size-3.5 text-mist-500" />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}

function Directory({ kind, game }: { kind: "players" | "teams"; game: Game }) {
  const [input, setInput] = useState("");
  const [region, setRegion] = useState("");
  const search = useDebouncedValue(input.trim());
  const players = useActiveGameUsers(game.id, search, kind === "players");
  const teams = useActiveGameTeams(game.id, { search, region }, kind === "teams");
  const query = kind === "players" ? players : teams;
  const rows: Array<ActiveGameUser | ActiveGameTeam> = query.data?.pages.flatMap((page): Array<ActiveGameUser | ActiveGameTeam> => page.data) ?? [];
  const filtered = Boolean(search || region);
  const clear = () => {
    setInput("");
    setRegion("");
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">Search {kind}</span>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={kind === "players" ? "Search by username or in-game name" : "Search teams by name"}
            className={cn(inputClasses, "h-11 rounded-full pl-11")}
          />
        </label>
        {kind === "teams" && <FilterMenu label="Region" value={region} options={COMMUNITY_REGIONS} onChange={setRegion} />}
      </div>

      {query.isLoading ? (
        <div className="rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
          <RowsSkeleton rows={6} />
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title={`${kind === "players" ? "Players" : "Teams"} didn't load`}
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : rows.length ? (
        <>
          <section aria-label={kind === "players" ? "Players" : "Teams"} className="rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
            <ColumnHeader
              lead={filtered ? (kind === "players" ? "Player" : "Team") : kind === "players" ? "Ranked by rating, then career score" : "Ranked by team rating"}
              columns={kind === "players" ? playerColumns : teamColumns}
            />
            <div className="grid grid-cols-[minmax(0,1fr)]">
              {rows.map((row, index) =>
                kind === "players" ? (
                  <PlayerRow key={row.id} entry={row as ActiveGameUser} position={filtered ? undefined : index + 1} />
                ) : (
                  <TeamRow key={row.id} team={row as ActiveGameTeam} position={filtered ? undefined : index + 1} />
                ),
              )}
            </div>
          </section>
          {query.hasNextPage && (
            <Button tone="outline" size="sm" className="mx-auto" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          )}
        </>
      ) : (
        <StatePanel
          icon={kind === "players" ? "people" : "team"}
          title={filtered ? `No ${kind} match` : kind === "players" ? `No ${game.name} players yet` : `No ${game.name} teams yet`}
          description={
            filtered ? "Try another search or clear the filter." : kind === "players" ? "Players show up here when they add the game to their profile." : "Teams show up here when they list the game."
          }
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
  );
}

function Schedule({ game }: { game: Game }) {
  const series = useGridSeries(gridKeyOf(game));
  if (series.isLoading)
    return (
      <div className="rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
        <RowsSkeleton rows={6} />
      </div>
    );
  if (series.isError)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="The schedule didn't load"
        description={getApiErrorMessage(series.error, "Try again in a moment.")}
        action={
          <Button tone="outline" size="sm" icon="refresh" onClick={() => void series.refetch()}>
            Try again
          </Button>
        }
      />
    );
  const items = series.data?.series ?? [];
  if (!items.length) return <StatePanel icon="calendar" title="Nothing scheduled" description={`No pro ${game.name} series in the last week or the next two.`} />;
  return (
    <section aria-label="Pro schedule" className="rounded-card bg-ink-900/60 p-2 pt-4 ring-1 ring-inset ring-white/6">
      <p className="px-3 pb-3 text-xs text-mist-500">Pro series from the last week and the next two, in your time zone.</p>
      <SeriesList items={items} />
    </section>
  );
}

export function GameDetailPage() {
  const { gameId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const game = useGame(gameId);
  useDocumentTitle(game.data?.name);
  const stats = useGameStats(gameId);
  const open = useOpenTournaments(3, game.data?.name, Boolean(game.data));

  if (game.isLoading)
    return (
      <div aria-hidden="true" className="grid gap-6">
        <Skeleton className="h-80 rounded-panel" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>
    );
  if (game.isError || !game.data)
    return (
      <StatePanel
        icon="games"
        tone="danger"
        title="This game isn't available"
        description={getApiErrorMessage(game.error, "It may have been removed, or Gamerie couldn't reach it.")}
        action={
          <LinkButton to="/games" tone="outline" size="sm" icon="arrowLeft">
            All games
          </LinkButton>
        }
      />
    );

  const title = game.data;
  const hasSchedule = Boolean(gridKeyOf(title));
  const sections: Array<{ id: Section; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "players", label: "Players" },
    { id: "teams", label: "Teams" },
    ...(hasSchedule ? [{ id: "schedule" as const, label: "Pro schedule" }] : []),
  ];
  const requested = params.get("view") as Section | null;
  const section: Section = sections.some((item) => item.id === requested) ? requested! : "overview";
  const website = safeUrl(title.officialWebsite);
  const selectSection = (next: Section) => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "overview") nextParams.delete("view");
        else nextParams.set("view", next);
        return nextParams;
      },
      { replace: true },
    );
  };
  const facts: Array<[string, string]> = [
    ["Players", stats.data ? stats.data.usersCount.toLocaleString() : "—"],
    ["Teams", stats.data ? stats.data.teamsCount.toLocaleString() : "—"],
    ["Open tournaments", open.data ? open.data.total.toLocaleString() : "—"],
    ["Platforms", String(title.platforms?.length ?? 0)],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/8">
        <HeroBanner src={title.wallPhoto} game={title.name} className="min-h-56 sm:min-h-72">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
                  <Icon name="games" className="size-3" />
                  {title.gameType || "Game"}
                </span>
                {title.company && <span className="type-label rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur">{title.company}</span>}
              </div>
              <h1 className={cn("type-display mt-3 break-words leading-[0.95]", titleSize(title.name))}>{title.name}</h1>
              {title.platforms?.length ? <p className="mt-3 text-sm text-mist-300">{title.platforms.join(" · ")}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap">
              <LinkButton to={`/tournaments/create?gameId=${encodeURIComponent(title.id)}`} icon="plus">
                Host a tournament
              </LinkButton>
              {VERIFIABLE_ADAPTERS.has(title.matchVerificationAdapter ?? "") && (
                <LinkButton to={`/matches/log?game=${encodeURIComponent(title.id)}`} tone="outline" icon="camera">
                  Log a match
                </LinkButton>
              )}
              {website && (
                <ButtonLink href={website} external tone="outline" icon="external">
                  Official site
                </ButtonLink>
              )}
            </div>
          </div>
        </HeroBanner>
        <dl className="grid grid-cols-2 border-t border-white/6 sm:grid-cols-4">
          {facts.map(([label, value], index) => (
            <div key={label} className={cn("border-white/6 px-5 py-4 sm:px-6", index % 2 && "border-l", index > 1 && "border-t sm:border-t-0", index === 2 && "sm:border-l")}>
              <dt className="type-label text-mist-500">{label}</dt>
              <dd className="mt-1.5 font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Tabs label="Game sections" indicatorId="game-sections" items={sections} value={section} onChange={selectSection} />

      {section === "overview" ? (
        <Overview game={title} onSection={selectSection} />
      ) : section === "schedule" ? (
        <Schedule game={title} />
      ) : (
        <Directory key={section} kind={section} game={title} />
      )}
    </div>
  );
}
