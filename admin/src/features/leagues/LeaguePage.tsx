import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { IconName } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { StatePanel } from "@/components/ui/StatePanel";
import { Panel } from "@/components/layout/Panel";
import { ActivityFeed } from "@/components/record/ActivityFeed";
import { BackLink } from "@/components/record/BackLink";
import { DossierHeader, DossierSkeleton } from "@/components/record/DossierHeader";
import { Facts, Figures } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { useBreadcrumb } from "@/app/shell/crumb";
import { MatchTable } from "@/features/competitions/components/MatchTable";
import { StatusStamp } from "@/features/competitions/components/StatusStamp";
import { formatLabel, money } from "@/features/competitions/format";
import { OwnerCell } from "@/features/people/components/OwnerCell";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useLeague, useLeagueActions, useSeasonFixtures } from "./hooks";
import type { LeagueFixture, SeasonControl } from "./types";

type FixtureFilter = "disputed" | "open" | "scheduled" | "final";
const FILTERS: Array<{ value: FixtureFilter; label: string }> = [
  { value: "disputed", label: "Disputed" },
  { value: "open", label: "This week" },
  { value: "scheduled", label: "Upcoming" },
  { value: "final", label: "Final" },
];

const CONTROL: Record<SeasonControl, { label: string; icon: IconName; title: string; body: string; done: string }> = {
  start: { label: "Start now", icon: "play", title: "Start the season now?", body: "Registration closes and the schedule is built from everyone who entered.", done: "Season started" },
  pause: { label: "Pause", icon: "pause", title: "Pause the season?", body: "Match timers stop until it's resumed. Everyone in the season is told.", done: "Season paused" },
  resume: { label: "Resume", icon: "play", title: "Resume the season?", body: "Match timers start again from where they stopped.", done: "Season resumed" },
  end: { label: "End season", icon: "flag", title: "End the season now?", body: "The regular season closes on the current table. Unplayed fixtures are voided.", done: "Season ended" },
};

const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function LeaguePage() {
  const { leagueId = "" } = useParams();
  const league = useLeague(leagueId);
  const [filter, setFilter] = useState<FixtureFilter>("disputed");
  const season = league.data?.currentSeason ?? null;
  const fixtures = useSeasonFixtures(leagueId, season?.id, filter);
  const actions = useLeagueActions(leagueId);
  const [dialog, setDialog] = useState<SeasonControl | "remove" | null>(null);
  const data = league.data;
  useBreadcrumb(data?.name);
  useDocumentTitle(data?.name ?? "League");

  if (league.isLoading) return <DossierSkeleton />;
  if (!data) {
    return (
      <div className="grid gap-6">
        <BackLink to="/leagues" label="Leagues" />
        <StatePanel icon="leagues" tone="danger" title="This league didn't load" description={getApiErrorMessage(league.error, "It may have been deleted.")} />
      </div>
    );
  }

  const controls: SeasonControl[] = !season || data.removed
    ? []
    : season.status === "registration"
      ? ["start"]
      : ["in_progress", "playoffs"].includes(season.status)
        ? [season.paused ? "resume" : "pause", "end"]
        : [];
  const fixtureCount = (status: string) => data.fixturesByStatus[status] ?? 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <DossierHeader
        title={data.name}
        image={data.logo ?? data.host.logo}
        cover={data.banner}
        square
        stamps={
          <>
            <StatusStamp status={season?.paused ? "paused" : (season?.status ?? data.status)} removed={Boolean(data.removed)} />
            {data.official && <Stamp tone="lavender" icon="seal">Official</Stamp>}
            {fixtureCount("disputed") > 0 && <Stamp tone="danger" icon="scales">{fixtureCount("disputed")} disputed</Stamp>}
          </>
        }
        meta={
          <>
            <span>{data.game.name}</span>
            <span>{[data.platform, data.region].filter(Boolean).join(" · ")}</span>
            {season && <span>Season {season.number}</span>}
            <span>Run by {data.official ? "Gamerie" : data.host.name}</span>
          </>
        }
        actions={
          <>
            <ButtonLink href={playerAppLink(`/leagues/${data.id}`)} external tone="outline" size="sm" icon="open">
              Open in Gamerie
            </ButtonLink>
            {controls.map((control) => (
              <Button key={control} tone="outline" size="sm" icon={CONTROL[control].icon} onClick={() => setDialog(control)}>
                {CONTROL[control].label}
              </Button>
            ))}
            {data.removed ? (
              <Button
                tone="outline"
                size="sm"
                icon="refresh"
                onClick={() =>
                  void actions
                    .restore()
                    .then(() => toast.success("League restored"))
                    .catch((error) => toast.error("Couldn't restore it", getApiErrorMessage(error, "Try again in a moment.")))
                }
              >
                Restore
              </Button>
            ) : (
              <Button tone="ghost" size="sm" icon="eyeSlash" className="text-mist-400 hover:text-danger" onClick={() => setDialog("remove")}>
                Remove
              </Button>
            )}
          </>
        }
      />
      {data.removed && (
        <div className="rounded-2xl bg-danger/6 px-5 py-4 text-sm text-mist-200 ring-1 ring-inset ring-danger/25">
          Removed {formatDateTime(data.removed.at)}. {data.removed.reason ? `Reason: ${data.removed.reason}` : ""}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Figures
            items={[
              { label: "Entrants", value: season ? `${season.participantCount}${season.maxParticipants ? ` / ${season.maxParticipants}` : ""}` : "—", hint: data.entrantType === "team" ? "Teams" : "Players" },
              { label: "Played", value: fixtureCount("final") + fixtureCount("forfeit") },
              { label: "To play", value: fixtureCount("scheduled") + fixtureCount("open") + fixtureCount("reported") },
              { label: "Disputed", value: fixtureCount("disputed"), hint: fixtureCount("disputed") ? "Waiting on Gamerie" : "None" },
            ]}
          />
          <Panel title="Fixtures" actions={season && <Segmented label="Fixtures" value={filter} onChange={setFilter} options={FILTERS} />}>
            {!season ? (
              <p className="text-sm text-mist-400">This league has no published season yet.</p>
            ) : (
              <MatchTable
                rows={(fixtures.data ?? []).map((fixture: LeagueFixture) => ({
                  id: fixture.id,
                  sideA: { id: fixture.sideA.participantId, name: fixture.sideA.name },
                  sideB: { id: fixture.sideB.participantId, name: fixture.sideB.name },
                  scoreA: fixture.scoreA,
                  scoreB: fixture.scoreB,
                  winner: fixture.winner,
                  status: fixture.status,
                  when: fixture.matchAt,
                  label: fixture.stage === "playoffs" ? "Playoffs" : `Week ${fixture.week}`,
                }))}
                loading={fixtures.isLoading}
                empty={filter === "disputed" ? "No disputed fixtures." : "Nothing here."}
                actions={{
                  canAct: (match) => ({
                    correct: ["final", "reported", "disputed", "forfeit"].includes(match.status),
                    cancel: !["void"].includes(match.status),
                  }),
                  correct: (match, a, b, reason) => actions.correct(match.id, a, b, reason).then(() => toast.success("Result corrected", "The table has been recalculated.")),
                  cancel: (match, reason) => actions.cancel(match.id, reason).then(() => toast.info("Fixture voided")),
                }}
              />
            )}
          </Panel>
          <ActivityFeed entries={data.activity} />
        </div>
        <aside className="grid min-w-0 gap-6">
          {data.organizer && !data.official && (
            <Panel title="Organizer">
              <OwnerCell owner={{ id: data.organizer.id, username: data.organizer.username, profileImage: data.organizer.avatar }} />
              <p className="mt-2 font-mono text-xs text-mist-500">{data.organizer.email}</p>
            </Panel>
          )}
          {season && (
            <Panel title={`Season ${season.number}`}>
              <Facts
                items={[
                  ["Runs", `${formatDate(season.startsAt)} → ${formatDate(season.endsAt)}`],
                  ["Format", formatLabel(season.format)],
                  ["Match night", `${weekDay[season.matchDay] ?? "—"} ${season.matchTime}`],
                  ["Time zone", season.timeZone],
                  ["Best of", season.bestOf],
                  ["Points (W/D/L)", `${season.points.win} / ${season.points.draw} / ${season.points.loss}`],
                  ["Playoffs", season.playoffs ? `Top ${season.playoffs.size}` : "None"],
                  ["Prize", money(season.prize) ?? "None"],
                ]}
              />
            </Panel>
          )}
          {data.seasons.length > 1 && (
            <Panel title="Seasons">
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                {data.seasons.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
                    <span className="text-sm font-medium">Season {item.number}</span>
                    <StatusStamp status={item.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>

      {dialog === "remove" && (
        <ReasonDialog
          title={`Remove ${data.name}?`}
          description="It disappears from Gamerie for everyone except its organizers, who are told why. You can restore it later."
          confirmLabel="Remove"
          icon="eyeSlash"
          onClose={() => setDialog(null)}
          onConfirm={(reason) => actions.remove(reason).then(() => toast.info("League removed"))}
        />
      )}
      {dialog && dialog !== "remove" && season && (
        <ReasonDialog
          title={CONTROL[dialog].title}
          description={CONTROL[dialog].body}
          confirmLabel={CONTROL[dialog].label}
          icon={CONTROL[dialog].icon}
          tone={dialog === "end" ? "danger" : "brand"}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => actions.control(season.id, dialog, reason).then(() => toast.success(CONTROL[dialog].done))}
        />
      )}
    </div>
  );
}
