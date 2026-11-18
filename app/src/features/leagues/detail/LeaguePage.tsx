import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { LadderEntryDialog } from "@/features/ladders/detail/LadderDialogs";
import { HeroBanner } from "@/features/tournaments/components/HeroBanner";
import { cn, titleSize } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { entrantPath, hostPath } from "@/lib/paths";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LeagueLoadError, LeagueStatusBadge } from "../components/LeagueBits";
import { useLeague, useLeagueActions, useLeagueAnnouncements, useLeagueFixtures, useLeagueParticipants, useLeagueRealtime, useLeagueSeasons } from "../hooks";
import type { LeagueDetail, LeagueSeason } from "../types";
import {
  LEAGUE_JOIN_LABELS,
  LEAGUE_SEASON_LABELS,
  LEAGUE_TIEBREAKER_LABELS,
  WEEKDAYS,
  formatLeagueDateRange,
  formatLeagueMoney,
  formatMatchTime,
  leaguePlayScopeLabel,
  leaguePlayoffLabel,
  ordinal,
} from "../utils";
import { LeagueManage } from "./LeagueManage";
import { FixtureRow, LeagueMatches } from "./LeagueMatches";
import { LeagueRosterPanel } from "./LeagueRoster";
import { LeaguePlayoffs, LeagueStandings } from "./LeagueStandings";

type Tab = "overview" | "standings" | "matches" | "playoffs" | "participants" | "rules" | "seasons" | "manage";

function Panel({ title, children, className, action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function matchNight(season: LeagueSeason) {
  return `${WEEKDAYS[season.matchDay]}s at ${season.matchTime}`;
}

function Overview({ league, season, onTab }: { league: LeagueDetail; season: LeagueSeason; onTab: (tab: Tab) => void }) {
  const fixtures = useLeagueFixtures(league.id, season.id);
  const announcements = useLeagueAnnouncements(league.id);
  const field = useLeagueParticipants(league.id, season.id);
  const mine = (fixtures.data ?? []).filter((fixture) => fixture.viewerSide && ["scheduled", "open", "reported", "disputed"].includes(fixture.status));
  const champion = season.championParticipantId ? field.data?.find((entrant) => entrant.id === season.championParticipantId) : null;
  const myPlace = league.viewer.entry ? field.data?.find((entrant) => entrant.id === league.viewer.entry!.id)?.finalPlace : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        {season.status === "completed" && champion && (
          <section className="flex items-center gap-4 rounded-card bg-signal/8 p-5 ring-1 ring-inset ring-signal/25">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-signal/15">
              <Icon name="crown" weight="fill" className="size-6 text-signal" />
            </span>
            <div className="min-w-0">
              <p className="type-label text-signal">Season {season.number} champion</p>
              <EntrantLink to={entrantPath(champion)} className="mt-1 block truncate text-lg font-semibold">
                {champion.displayName}
              </EntrantLink>
              {myPlace && champion.id !== league.viewer.entry?.id && <p className="mt-0.5 text-sm text-mist-300">You finished {ordinal(myPlace)}.</p>}
            </div>
          </section>
        )}
        {mine.length > 0 && (
          <Panel
            title="Your next match"
            action={
              <button type="button" onClick={() => onTab("matches")} className="text-sm font-medium text-lavender-300 hover:text-lavender-200">
                All matches
              </button>
            }
          >
            <ul className="grid gap-2.5">
              <FixtureRow fixture={mine[0]} />
            </ul>
          </Panel>
        )}
        <Panel title="About">
          <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{league.description || "The organizer hasn't added a description yet."}</p>
        </Panel>
        <Panel title="Announcements">
          {announcements.isLoading ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : announcements.data?.data.length ? (
            <ol className="grid gap-4">
              {announcements.data.data.map((item) => (
                <li key={item.id} className="grid gap-1">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{typeof item.details?.title === "string" && item.details.title ? item.details.title : "Update"}</span>
                    <time dateTime={item.createdAt} className="shrink-0 text-xs text-mist-500">
                      {timeAgo(item.createdAt)}
                    </time>
                  </p>
                  <p className="whitespace-pre-line text-sm text-mist-300">{String(item.details?.message ?? "")}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-mist-400">No announcements yet.</p>
          )}
        </Panel>
      </div>
      <aside className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <Panel title={`Season ${season.number}`}>
          <dl className="grid gap-3 text-sm">
            {(
              [
                ["Status", season.paused ? "Paused" : LEAGUE_SEASON_LABELS[season.status]],
                ["Dates", formatLeagueDateRange(season.startsAt, season.endsAt)],
                ["Match night", `${matchNight(season)} (${season.timeZone.replace(/_/g, " ")})`],
                ["Format", `${season.format === "double" ? "Double" : "Single"} round robin${season.weeks ? ` · ${season.weeks} weeks` : ""}`],
                ["Playoffs", leaguePlayoffLabel(season.playoffs)],
              ] as Array<[string, string]>
            ).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                <dt className="text-mist-500">{label}</dt>
                <dd className="text-mist-100">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        {season.prize && (
          <Panel title="Prize">
            <p className="text-2xl font-semibold">{formatLeagueMoney(season.prize.total, season.prize.currency)}</p>
            <ul className="mt-3 grid gap-1.5 text-sm text-mist-300">
              {season.prize.places.map((place) => (
                <li key={place.placement} className="flex justify-between">
                  <span>{ordinal(place.placement)}</span>
                  <span className="tabular-nums">{formatLeagueMoney(place.amount, season.prize!.currency)}</span>
                </li>
              ))}
            </ul>
            {season.prize.description && <p className="mt-3 text-xs text-mist-500">{season.prize.description}</p>}
          </Panel>
        )}
      </aside>
    </div>
  );
}

function Participants({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const query = useLeagueParticipants(league.id, season.id);
  const entry = league.viewer.entry;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {entry?.kind === "team" && ["active", "finished"].includes(entry.status) && <LeagueRosterPanel league={league} season={season} />}
      {query.isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : query.isError ? (
        <LeagueLoadError what="entrants" error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data?.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((entrant) => (
            <li key={entrant.id}>
              <EntrantLink
                to={entrantPath(entrant)}
                className={cn("flex items-center gap-3 rounded-2xl px-3.5 py-3 ring-1 ring-inset", entrant.id === entry?.id ? "bg-lavender-400/6 ring-lavender-400/25" : "bg-white/3 ring-white/6 hover:bg-white/5")}
              >
                <Avatar src={entrant.avatar ?? undefined} name={entrant.displayName} size="sm" tone={entrant.kind === "team" ? "ink" : "brand"} className="shrink-0 rounded-full" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{entrant.displayName}</span>
                {entrant.finalPlace ? <span className="type-label shrink-0 text-mist-400">{ordinal(entrant.finalPlace)}</span> : null}
              </EntrantLink>
            </li>
          ))}
        </ul>
      ) : (
        <StatePanel icon="people" title="No entries yet" description={season.status === "registration" ? "Be the first in." : "Nobody entered this season."} />
      )}
    </div>
  );
}

function Rules({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const rows: Array<[string, ReactNode]> = [
    ["Entrants", league.entrantType === "team" ? `Teams of ${league.teamSize}${league.substitutes ? ` with up to ${league.substitutes} substitutes` : ""}` : "Individual players"],
    ["Matches", `Best of ${season.bestOf}${season.allowDraws ? ", draws allowed in the regular season" : ""}`],
    ["Points", `Win ${season.points.win} · ${season.allowDraws ? `draw ${season.points.draw} · ` : ""}loss ${season.points.loss}`],
    ["Tiebreakers", season.tiebreakers.map((item) => LEAGUE_TIEBREAKER_LABELS[item]).join(", then ")],
    ["Table", season.groups.count > 1 ? `${season.groups.count} groups · ${leaguePlayScopeLabel(season.groups.playScope)}` : "One table, everyone plays everyone"],
    ["Schedule", `One round a week. Default slot ${matchNight(season)}, ${season.timeZone.replace(/_/g, " ")}. Opponents can agree another time in the same week.`],
    ["Ready-up", "Opens 15 minutes before the match. A side that isn't ready 10 minutes after the start forfeits."],
    ["Results", "Either side reports. The other side has an hour to accept or dispute; after that the result stands."],
    ["Playoffs", leaguePlayoffLabel(season.playoffs)],
    ...(league.entrantType === "team" ? ([["Rosters", `Locked at entry. ${season.rosterChangesPerWeek ? `${season.rosterChangesPerWeek} new player${season.rosterChangesPerWeek === 1 ? "" : "s"} a week after that.` : "No additions during the season."} A player can only play for one team in this league.`]] as Array<[string, ReactNode]>) : []),
    ...(season.allowedModes.length ? ([["Modes", season.allowedModes.join(", ")]] as Array<[string, ReactNode]>) : []),
    ...(season.allowedMaps.length ? ([["Map pool", season.allowedMaps.join(", ")]] as Array<[string, ReactNode]>) : []),
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 lg:items-start">
      <Panel title="How it works">
        <dl className="grid gap-3.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
              <dt className="text-mist-500">{label}</dt>
              <dd className="leading-relaxed text-mist-100">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="House rules">
        <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{season.rulesText || "The organizer hasn't added house rules."}</p>
      </Panel>
    </div>
  );
}

function Seasons({ league, selected, onSelect }: { league: LeagueDetail; selected: string; onSelect: (seasonId: string) => void }) {
  const query = useLeagueSeasons(league.id);
  if (query.isLoading) return <Skeleton className="h-48 rounded-card" />;
  if (query.isError) return <LeagueLoadError what="seasons" error={query.error} onRetry={() => void query.refetch()} />;
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
      {(query.data ?? []).map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3.5 text-left ring-1 ring-inset transition-colors",
              item.id === selected ? "bg-lavender-400/8 ring-lavender-400/40" : "bg-white/3 ring-white/6 hover:bg-white/5",
            )}
          >
            <span className="w-24 shrink-0 font-semibold">Season {item.number}</span>
            <LeagueStatusBadge status={item.status} />
            <span className="min-w-0 flex-1 text-sm text-mist-400">
              {formatLeagueDateRange(item.startsAt, item.endsAt)} · {item.participantCount} {league.entrantType === "team" ? "teams" : "players"}
            </span>
            {item.champion && (
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Icon name="crown" weight="fill" className="size-4 shrink-0 text-signal" />
                <span className="truncate font-semibold">{item.champion.name}</span>
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function LeaguePage() {
  const { leagueId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const seasonParam = params.get("season") ?? undefined;
  const query = useLeague(leagueId, seasonParam);
  useLeagueRealtime(leagueId);
  const league = query.data;
  const season = league?.selectedSeason ?? null;
  const actions = useLeagueActions(leagueId, season?.id);
  const [entryMode, setEntryMode] = useState<"join" | "accept" | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  useDocumentTitle(league?.name);

  const tabs = useMemo(() => {
    const items: Array<{ id: Tab; label: string }> = [
      { id: "overview", label: "Overview" },
      { id: "standings", label: "Standings" },
      { id: "matches", label: "Matches" },
    ];
    if (season?.playoffs) items.push({ id: "playoffs", label: "Playoffs" });
    items.push({ id: "participants", label: league?.entrantType === "team" ? "Teams" : "Players" }, { id: "rules", label: "Rules" }, { id: "seasons", label: "Seasons" });
    if (league?.viewer.isOrganizer) items.push({ id: "manage", label: "Manage" });
    return items;
  }, [league?.entrantType, league?.viewer.isOrganizer, season?.playoffs]);
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = tabs.some((item) => item.id === requested) ? requested! : "overview";
  const goTab = (next: Tab) =>
    setParams((current) => {
      const nextParams = new URLSearchParams(current);
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      return nextParams;
    });
  const selectSeason = (seasonId: string) =>
    setParams(() => {
      const nextParams = new URLSearchParams();
      if (seasonId !== league?.currentSeasonId) nextParams.set("season", seasonId);
      return nextParams;
    });

  if (query.isLoading)
    return (
      <div aria-hidden="true" className="grid gap-6">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-96 rounded-panel" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  if (query.isError || !league)
    return (
      <StatePanel
        icon="leagues"
        tone="danger"
        title="League not found"
        description={getApiErrorMessage(query.error, "It may have been removed, made private, or the link is wrong.")}
        action={
          <LinkButton to="/leagues" tone="outline" size="sm" icon="arrowLeft">
            Back to leagues
          </LinkButton>
        }
      />
    );

  const entry = league.viewer.entry;
  const viewingPast = Boolean(season && league.currentSeasonId && season.id !== league.currentSeasonId);
  const full = Boolean(season?.maxParticipants && season.participantCount >= season.maxParticipants);
  const mayEnter = (!league.viewer.isOrganizer || Boolean(league.organizersCanPlay)) && !entry && season?.status === "registration" && (league.joinMode !== "private" || league.viewer.isOrganizer) && !full && !viewingPast;
  const heroAction =
    league.viewer.isOrganizer && league.status === "draft" ? (
      <LinkButton to={`/leagues/${league.id}/edit`} icon="edit">
        Continue setup
      </LinkButton>
    ) : league.viewer.isOrganizer && league.viewer.draftSeasonId ? (
      <LinkButton to={`/leagues/${league.id}/edit`} icon="edit">
        Set up next season
      </LinkButton>
    ) : entry?.status === "invited" ? (
      <>
        <Button tone="outline" disabled={actions.respond.isPending} onClick={() => actions.respond.mutate({ participantId: entry.id, action: "decline" }, { onSuccess: () => toast.info("Invitation declined") })}>
          Decline
        </Button>
        <Button icon="check" onClick={() => setEntryMode("accept")}>
          Accept invitation
        </Button>
      </>
    ) : entry?.status === "pending_approval" ? (
      <span className="flex h-12 items-center rounded-full bg-white/5 px-5 text-sm font-semibold text-mist-200 ring-1 ring-inset ring-white/12">Awaiting approval</span>
    ) : entry && ["active", "finished"].includes(entry.status) ? (
      <span className="flex h-12 items-center gap-2 rounded-full bg-signal/12 px-5 text-sm font-semibold text-signal ring-1 ring-inset ring-signal/30">
        <Icon name="check" weight="bold" className="size-4" />
        {entry.status === "finished" ? "Played this season" : "Entered"}
      </span>
    ) : mayEnter ? (
      <Button icon="leagues" onClick={() => setEntryMode("join")}>
        {league.joinMode === "approval" && !league.viewer.isOrganizer ? "Request to enter" : "Enter league"}
      </Button>
    ) : season?.status === "registration" && full && !entry ? (
      <span className="flex h-12 items-center rounded-full bg-white/5 px-5 text-sm font-semibold text-mist-300 ring-1 ring-inset ring-white/12">Season full</span>
    ) : null;

  const stats: Array<[string, string]> = season
    ? [
        ["Prize", season.prize?.total ? formatLeagueMoney(season.prize.total, season.prize.currency) : "No prize"],
        [league.entrantType === "team" ? "Teams" : "Players", season.maxParticipants ? `${season.participantCount} / ${season.maxParticipants}` : String(season.participantCount)],
        ["Entry", LEAGUE_JOIN_LABELS[league.joinMode]],
        ["Match night", `${WEEKDAYS[season.matchDay].slice(0, 3)} ${season.matchTime}`],
        ["Season", formatLeagueDateRange(season.startsAt, season.endsAt)],
      ]
    : [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link to="/leagues" className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50">
        <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Leagues
      </Link>

      {league.removed && (
        <div role="status" className="flex items-start gap-3 rounded-card bg-danger/8 p-4 ring-1 ring-inset ring-danger/30">
          <Icon name="prohibit" className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Gamerie has removed this league</p>
            <p className="mt-1 text-mist-300">Players can no longer see or enter it.{league.removed.reason ? ` Reason: ${league.removed.reason}` : ""} Contact support if you think this is a mistake.</p>
          </div>
        </div>
      )}
      {season?.paused && (
        <div role="status" className="flex items-start gap-3 rounded-card bg-white/4 p-4 ring-1 ring-inset ring-white/10">
          <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-mist-300" />
          <p className="text-sm text-mist-300">Gamerie has paused this season. Deadlines are on hold until it resumes.</p>
        </div>
      )}
      {viewingPast && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-white/4 px-4 py-3 ring-1 ring-inset ring-white/10">
          <p className="text-sm text-mist-300">You're looking at season {season?.number}.</p>
          <button type="button" onClick={() => selectSeason(league.currentSeasonId!)} className="text-sm font-medium text-lavender-300 hover:text-lavender-200">
            Back to the current season
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/8">
        <HeroBanner src={league.banner} game={league.game.name} className="min-h-56 sm:min-h-72">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <LeagueStatusBadge status={league.status === "draft" ? "draft" : (season?.status ?? null)} paused={season?.paused} />
                {season && <span className="type-label rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">Season {season.number}</span>}
                <span className="type-label rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">{[league.platform, league.region].filter(Boolean).join(" · ")}</span>
              </div>
              <div className="mt-5 flex items-end gap-4">
                {league.logo && <img src={league.logo} alt="" className="size-16 shrink-0 rounded-2xl object-cover ring-2 ring-ink-950 sm:size-20" />}
                <div className="min-w-0">
                  <p className="type-label text-lavender-300">{league.game.name}</p>
                  <h1 className={cn("type-display mt-2 break-words leading-[0.95]", titleSize(league.name))}>{league.name}</h1>
                </div>
              </div>
              <p className="mt-3 text-sm text-mist-300">
                {league.official ? (
                  "Run by Gamerie"
                ) : (
                  <>
                    Run by{" "}
                    <EntrantLink to={hostPath(league.host)} className="font-semibold text-mist-50">
                      {league.host.name}
                    </EntrantLink>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {heroAction}
              {league.viewer.isOrganizer && league.status !== "draft" && (
                <LinkButton to="?tab=manage&manage=settings" tone="outline" icon="edit">
                  Edit details
                </LinkButton>
              )}
              {entry && ["active", "pending_approval"].includes(entry.status) && season?.status === "registration" && (
                <Button tone="ghost" size="sm" onClick={() => setWithdrawing(true)}>
                  Withdraw
                </Button>
              )}
            </div>
          </div>
        </HeroBanner>
        {stats.length > 0 && (
          <dl className="grid grid-cols-2 border-t border-white/6 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map(([label, value], index) => (
              <div
                key={label}
                className={cn(
                  "min-w-0 px-5 py-4 sm:px-6",
                  index > 0 && "lg:border-l lg:border-white/6",
                  index % 2 === 1 && "border-l border-white/6 sm:border-l-0",
                  index >= 2 && "border-t border-white/6 lg:border-t-0",
                  index === 4 && "col-span-2 sm:col-span-1",
                )}
              >
                <dt className="type-label text-mist-500">{label}</dt>
                <dd className="mt-2 truncate text-[0.95rem] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {!season ? (
        <StatePanel icon="calendar" title="No season yet" description="The organizer hasn't set up a season." />
      ) : (
        <>
          <Tabs label="League sections" items={tabs} value={tab} onChange={goTab} indicatorId="league-tab" />
          {tab === "overview" ? (
            <Overview league={league} season={season} onTab={goTab} />
          ) : tab === "standings" ? (
            <LeagueStandings league={league} season={season} />
          ) : tab === "matches" ? (
            <LeagueMatches league={league} season={season} />
          ) : tab === "playoffs" ? (
            <LeaguePlayoffs league={league} season={season} />
          ) : tab === "participants" ? (
            <Participants league={league} season={season} />
          ) : tab === "rules" ? (
            <Rules league={league} season={season} />
          ) : tab === "seasons" ? (
            <Seasons league={league} selected={season.id} onSelect={selectSeason} />
          ) : (
            <LeagueManage league={league} season={season} />
          )}
        </>
      )}

      {entryMode && season && (
        <LadderEntryDialog
          ladder={{ name: league.name, entrantType: league.entrantType, teamSize: league.teamSize, substitutes: league.substitutes, joinMode: league.viewer.isOrganizer ? "open" : league.joinMode, viewer: { participant: entry ? { teamId: entry.teamId } : null } }}
          mode={entryMode}
          soloHint={`Season ${season.number} starts ${formatMatchTime(season.startsAt)}. You'll play one match a week.`}
          soloDetails={
            <div className="grid gap-3 text-sm leading-relaxed text-mist-300">
              <p className="flex items-start gap-2.5">
                <Icon name="calendar" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
                Matches default to {matchNight(season)}. You and your opponent can agree another time in the same week.
              </p>
              <p className="flex items-start gap-2.5">
                <Icon name="standings" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
                Wins are worth {season.points.win} points{season.allowDraws ? `, draws ${season.points.draw}` : ""}. {leaguePlayoffLabel(season.playoffs)}.
              </p>
            </div>
          }
          pending={actions.join.isPending || actions.respond.isPending}
          error={(actions.join.error ?? actions.respond.error) ? getApiErrorMessage(actions.join.error ?? actions.respond.error, "That didn't go through.") : undefined}
          onClose={() => {
            actions.join.reset();
            actions.respond.reset();
            setEntryMode(null);
          }}
          onSubmit={(input) => {
            const done = () => {
              toast.success(entryMode === "accept" ? "You're in" : league.joinMode === "approval" && !league.viewer.isOrganizer ? "Request sent" : "You're in", `Season ${season.number} of ${league.name}`);
              setEntryMode(null);
            };
            if (entryMode === "accept" && entry) actions.respond.mutate({ participantId: entry.id, action: "accept", input }, { onSuccess: done });
            else actions.join.mutate(input, { onSuccess: done });
          }}
        />
      )}
      <ConfirmDialog
        open={withdrawing}
        title="Withdraw from this season?"
        description="Your place opens up for someone else. You can enter again while registration is open, if there's room."
        confirmLabel="Withdraw"
        pending={actions.withdraw.isPending}
        onConfirm={() =>
          entry &&
          actions.withdraw.mutate(entry.id, {
            onSuccess: () => {
              toast.info("You've withdrawn");
              setWithdrawing(false);
            },
            onError: (error) => toast.error("Couldn't withdraw", getApiErrorMessage(error, "Try again in a moment.")),
          })
        }
        onClose={() => setWithdrawing(false)}
      />
    </div>
  );
}
