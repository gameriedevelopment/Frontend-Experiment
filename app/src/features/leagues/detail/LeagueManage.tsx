import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { useSearchResults } from "@/features/discovery/hooks";
import { useAuthStore } from "@/features/auth/authStore";
import { DeleteCompetition } from "@/features/ladders/components/DeleteCompetition";
import { LadderCoverDrop, LadderLogoDrop } from "@/features/ladders/create/LadderSteps";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { entrantPath } from "@/lib/paths";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useManageView } from "@/lib/useManageView";
import { deleteLeague } from "../api";
import { useLeagueActivity, useLeagueFixtures, useLeagueGroups, useLeagueManagement, useLeagueParticipants, useLeagueReports } from "../hooks";
import type { LeagueDetail, LeagueFixture, LeagueParticipant, LeagueSeason } from "../types";
import { fixtureScore, formatMatchTime } from "../utils";
import { FixtureRow } from "./LeagueMatches";

type View = "entries" | "matches" | "groups" | "updates" | "settings";

const activityLabels: Record<string, [string, IconName]> = {
  "league.draft_created": ["Draft created", "edit"],
  "league.draft_updated": ["Settings saved", "edit"],
  "league.settings_updated": ["Details updated", "edit"],
  "league.announcement": ["Announcement posted", "megaphone"],
  "season.draft_created": ["Next season drafted", "calendar"],
  "season.published": ["Season published", "leagues"],
  "season.started": ["Season started", "flag"],
  "season.extended": ["Season extended", "calendar"],
  "season.completed": ["Season complete", "crown"],
  "season.cancelled": ["Season cancelled", "close"],
  "week.opened": ["Week opened", "calendar"],
  "playoffs.started": ["Playoffs started", "bracket"],
  "fixture.proposed": ["New time proposed", "clock"],
  "fixture.time_agreed": ["Time agreed", "check"],
  "fixture.moved": ["Match moved", "calendar"],
  "fixture.ready": ["Ready", "check"],
  "groups.assigned": ["Groups saved", "people"],
  "groups.randomized": ["Groups shuffled", "refresh"],
  "participant.invited": ["Invitation sent", "mail"],
  "participant.joined": ["New entrant", "follow"],
  "participant.requested": ["Asked to join", "hourglass"],
  "participant.approved": ["Entry approved", "check"],
  "participant.declined": ["Entry declined", "close"],
  "participant.accepted_invitation": ["Invitation accepted", "check"],
  "participant.withdrew": ["Withdrew", "arrowLeft"],
  "participant.removed": ["Entrant removed", "minus"],
  "result.declared": ["Result reported", "trophy"],
  "result.disputed": ["Result disputed", "flag"],
  "result.finalized": ["Result final", "check"],
  "result.forfeit": ["Forfeit", "warning"],
  "result.corrected": ["Result corrected by Gamerie", "edit"],
  "dispute.resolved": ["Dispute resolved", "check"],
  "match.cancelled": ["Match cancelled", "close"],
};

function activityLabel(action: string): [string, IconName] {
  const known = activityLabels[action];
  if (known) return known;
  const words = (action.split(".").pop() ?? action).replace(/_/g, " ");
  return [words.charAt(0).toUpperCase() + words.slice(1), "history"];
}

function Card({ title, count, description, children }: { title: string; count?: number; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
      <h3 className="flex items-center gap-2.5 text-base font-semibold">
        {title}
        {count != null && count > 0 && <span className="rounded-full bg-white/7 px-2 py-0.5 text-xs font-medium tabular-nums text-mist-300">{count}</span>}
      </h3>
      {description && <p className="mt-1 text-sm text-mist-400">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PersonRow({ participant, children }: { participant: LeagueParticipant; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
      <EntrantLink to={entrantPath(participant)} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={participant.avatar ?? undefined} name={participant.displayName} size="sm" tone={participant.kind === "team" ? "ink" : "brand"} className="rounded-full" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{participant.displayName}</span>
      </EntrantLink>
      <span className="flex gap-1.5">{children}</span>
    </li>
  );
}

function ErrorLine({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-danger">
      <Icon name="warning" className="mt-0.5 size-4 shrink-0" />
      {getApiErrorMessage(error, "That didn't go through.")}
    </p>
  );
}

function RemoveDialog({ participant, running, pending, error, onConfirm, onClose }: { participant: LeagueParticipant; running: boolean; pending: boolean; error: unknown; onConfirm: (input: { mode: "void" | "forfeit_rest"; reason: string }) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"void" | "forfeit_rest">("forfeit_rest");
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open
      title={`Remove ${participant.displayName}?`}
      description="They're notified with your reason. This can't be undone this season."
      icon="minus"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending || reason.trim().length < 5} onClick={() => onConfirm({ mode, reason: reason.trim() })}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {running && (
          <OptionCards
            legend="Their matches"
            value={mode}
            onChange={setMode}
            options={[
              { value: "forfeit_rest", label: "Keep played results", description: "Matches still to play count as forfeits" },
              { value: "void", label: "Wipe all results", description: "Every match they played or have left is void" },
            ]}
          />
        )}
        <TextAreaField id="remove-reason" label="Reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="No-shows in weeks 2 and 3." />
        <ErrorLine error={error} />
      </div>
    </Dialog>
  );
}

function Entries({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const management = useLeagueManagement(league.id, season.id);
  const pending = useLeagueParticipants(league.id, season.id, ["pending_approval"]);
  const invited = useLeagueParticipants(league.id, season.id, ["invited"]);
  const active = useLeagueParticipants(league.id, season.id, ["active", "finished"]);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const [removing, setRemoving] = useState<LeagueParticipant | null>(null);
  const team = league.entrantType === "team";
  const term = useDebouncedValue(query);
  const players = useSearchResults("players", term, !team);
  const teams = useSearchResults("teams", term, team);
  const options = useMemo<ComboboxOption[]>(
    () =>
      team
        ? (teams.data?.data ?? []).map((item) => ({ value: item.id, label: item.name, image: item.logo }))
        : (players.data?.data ?? []).map((item) => ({ value: item.id, label: item.username, description: item.gamerTitle, image: item.profileImage })),
    [players.data, team, teams.data],
  );
  const open = season.status === "registration";
  const running = ["in_progress", "playoffs"].includes(season.status);

  return (
    <div className="grid gap-6">
      {open && (
        <Card title={`Invite ${team ? "teams" : "players"}`} description="Invitations stay pending until the other side accepts. They count toward the entry limit once accepted.">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Combobox id="league-invite" label={team ? "Team" : "Player"} placeholder="Search" query={query} onQueryChange={setQuery} options={options} loading={(team ? teams : players).isFetching} value={target} onChange={setTarget} avatars />
            <Button
              size="sm"
              icon="mail"
              className="h-12"
              disabled={!target || management.invite.isPending}
              onClick={() =>
                target &&
                management.invite.mutate(target.value, {
                  onSuccess: () => {
                    toast.success("Invitation sent", target.label);
                    setTarget(null);
                  },
                })
              }
            >
              Invite
            </Button>
          </div>
          <div className="mt-3">
            <ErrorLine error={management.invite.error} />
          </div>
        </Card>
      )}
      {(pending.data?.length ?? 0) > 0 && (
        <Card title="Waiting for approval" count={pending.data!.length}>
          <ul className="grid gap-2">
            {pending.data!.map((participant) => (
              <PersonRow key={participant.id} participant={participant}>
                <Button tone="ghost" size="sm" disabled={management.review.isPending} onClick={() => management.review.mutate({ participantId: participant.id, approve: false }, { onSuccess: () => toast.info("Declined", participant.displayName) })}>
                  Decline
                </Button>
                <Button size="sm" disabled={management.review.isPending} onClick={() => management.review.mutate({ participantId: participant.id, approve: true }, { onSuccess: () => toast.success("Approved", participant.displayName) })}>
                  Approve
                </Button>
              </PersonRow>
            ))}
          </ul>
          <div className="mt-3">
            <ErrorLine error={management.review.error} />
          </div>
        </Card>
      )}
      <Card title="Entered" count={active.data?.length} description={season.maxParticipants ? `${season.participantCount} of ${season.maxParticipants} places taken.` : undefined}>
        {active.isLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : active.data?.length ? (
          <ul className="grid gap-2">
            {active.data.map((participant) => (
              <PersonRow key={participant.id} participant={participant}>
                {participant.status === "active" && season.status !== "completed" && (
                  <Button tone="ghost" size="sm" onClick={() => setRemoving(participant)}>
                    Remove
                  </Button>
                )}
              </PersonRow>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist-400">No one yet.</p>
        )}
        {(invited.data?.length ?? 0) > 0 && <p className="mt-4 text-xs text-mist-500">Invited and not answered: {invited.data!.map((participant) => participant.displayName).join(", ")}</p>}
      </Card>
      {removing && (
        <RemoveDialog
          participant={removing}
          running={running}
          pending={management.remove.isPending}
          error={management.remove.error}
          onClose={() => {
            management.remove.reset();
            setRemoving(null);
          }}
          onConfirm={(input) =>
            management.remove.mutate(
              { participantId: removing.id, ...input },
              {
                onSuccess: () => {
                  toast.info("Removed", removing.displayName);
                  setRemoving(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

function MoveDialog({ fixture, pending, error, onSubmit, onClose }: { fixture: LeagueFixture; pending: boolean; error: unknown; onSubmit: (at: string) => void; onClose: () => void }) {
  const [at, setAt] = useState(fixture.defaultAt);
  return (
    <Dialog
      open
      title="Move this match"
      description={`Sets a new default time for ${fixture.sideA.name} v ${fixture.sideB.name}. Both sides are told.`}
      icon="calendar"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending} onClick={() => onSubmit(at)}>
            {pending ? "Moving…" : "Move match"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <ScheduleField label="New time" days={60} value={at} onChange={setAt} />
        <ErrorLine error={error} />
      </div>
    </Dialog>
  );
}

function Matches({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const reports = useLeagueReports(league.id, season.id);
  const fixtures = useLeagueFixtures(league.id, season.id);
  const management = useLeagueManagement(league.id, season.id);
  const [moving, setMoving] = useState<LeagueFixture | null>(null);
  const upcoming = (fixtures.data ?? []).filter((fixture) => ["scheduled", "open"].includes(fixture.status)).slice(0, 12);
  return (
    <div className="grid gap-6">
      <Card title="Disputed results" count={reports.data?.length} description="Players dispute a result within an hour of it being reported. Gamerie staff review disputes and can correct the score.">
        {reports.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : reports.data?.length ? (
          <ul className="grid gap-2.5">
            {reports.data.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture}>
                <p className="border-t border-white/6 pt-3 text-xs text-mist-400">
                  Week {fixture.week} · reported {fixtureScore(fixture)}
                </p>
              </FixtureRow>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist-400">No disputes. Results are standing.</p>
        )}
      </Card>
      <Card title="Coming up" description="Move a match when something clashes. Players can still agree another time between themselves.">
        {fixtures.isLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : upcoming.length ? (
          <ul className="grid gap-2.5">
            {upcoming.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture}>
                <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-3">
                  <span className="text-xs text-mist-400">
                    Week {fixture.week} · {formatMatchTime(fixture.matchAt)}
                    {fixture.agreedAt ? " · agreed by both sides" : ""}
                  </span>
                  <Button tone="outline" size="sm" icon="calendar" onClick={() => setMoving(fixture)}>
                    Move
                  </Button>
                </div>
              </FixtureRow>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist-400">Nothing scheduled.</p>
        )}
      </Card>
      {moving && (
        <MoveDialog
          fixture={moving}
          pending={management.moveFixture.isPending}
          error={management.moveFixture.error}
          onClose={() => {
            management.moveFixture.reset();
            setMoving(null);
          }}
          onSubmit={(defaultAt) =>
            management.moveFixture.mutate(
              { fixtureId: moving.id, defaultAt },
              {
                onSuccess: () => {
                  toast.success("Match moved");
                  setMoving(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

function Groups({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const groups = useLeagueGroups(league.id, season.id);
  const entrants = useLeagueParticipants(league.id, season.id, ["active"]);
  const management = useLeagueManagement(league.id, season.id);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const editable = season.status === "registration";
  useEffect(() => {
    if (!groups.data) return;
    setDraft(Object.fromEntries(groups.data.flatMap((group) => group.participantIds.map((id) => [id, group.id]))));
  }, [groups.data]);

  if (groups.isLoading || entrants.isLoading) return <Skeleton className="h-64 rounded-card" />;
  const list = groups.data ?? [];
  if (!list.length) return <Card title="Groups">{<p className="text-sm text-mist-400">Groups are created when the season is published.</p>}</Card>;
  const unplaced = (entrants.data ?? []).filter((entrant) => !draft[entrant.id]);

  return (
    <Card
      title="Groups"
      description={
        editable
          ? season.groups.allocation === "random"
            ? "Shuffle now, or leave it: Gamerie shuffles when the season starts, keeping teams from the same hub apart."
            : "Place every entrant before the season starts. Anyone left over is placed in the smallest group."
          : "Groups are locked once the season starts."
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((group) => (
          <section key={group.id} className="rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
            <h4 className="text-sm font-semibold">{group.name}</h4>
            <ul className="mt-3 grid gap-1.5">
              {(entrants.data ?? [])
                .filter((entrant) => draft[entrant.id] === group.id)
                .map((entrant) => (
                  <li key={entrant.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{entrant.displayName}</span>
                    {editable && (
                      <button type="button" onClick={() => setDraft((current) => ({ ...current, [entrant.id]: "" }))} className="text-xs text-mist-500 hover:text-mist-100">
                        Take out
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      {editable && unplaced.length > 0 && (
        <div className="mt-5 grid gap-2">
          <p className="text-sm font-medium">Not placed</p>
          <ul className="grid gap-2">
            {unplaced.map((entrant) => (
              <li key={entrant.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/3 px-3.5 py-2 ring-1 ring-inset ring-white/6">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{entrant.displayName}</span>
                {list.map((group) => (
                  <Button key={group.id} tone="outline" size="sm" onClick={() => setDraft((current) => ({ ...current, [entrant.id]: group.id }))}>
                    {group.name}
                  </Button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
      {editable && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            icon="check"
            disabled={management.assignGroups.isPending}
            onClick={() =>
              management.assignGroups.mutate(
                Object.entries(draft)
                  .filter(([, groupId]) => groupId)
                  .map(([participantId, groupId]) => ({ participantId, groupId })),
                { onSuccess: () => toast.success("Groups saved") },
              )
            }
          >
            Save groups
          </Button>
          <Button tone="outline" size="sm" icon="refresh" disabled={management.randomizeGroups.isPending} onClick={() => management.randomizeGroups.mutate(undefined, { onSuccess: () => toast.success("Groups shuffled") })}>
            Shuffle
          </Button>
        </div>
      )}
      <div className="mt-3">
        <ErrorLine error={management.assignGroups.error ?? management.randomizeGroups.error} />
      </div>
    </Card>
  );
}

function Updates({ league }: { league: LeagueDetail }) {
  const management = useLeagueManagement(league.id);
  const activity = useLeagueActivity(league.id);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="grid gap-6">
      <Card title="Announce" description="Everyone in the current season gets a notification and it shows on the league's overview.">
        <div className="grid gap-3">
          <TextField id="league-announce-title" label="Title (optional)" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} />
          <TextAreaField id="league-announce-message" label="Message" maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Week 4 moves to Thursday because of the holiday." />
          <ErrorLine error={management.announce.error} />
          <div>
            <Button
              size="sm"
              icon="megaphone"
              disabled={!message.trim() || management.announce.isPending}
              onClick={() =>
                management.announce.mutate(
                  { title: title.trim() || undefined, message: message.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Announcement sent");
                      setTitle("");
                      setMessage("");
                    },
                  },
                )
              }
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Activity">
        {activity.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : activity.data?.data.length ? (
          <ol className="grid gap-3">
            {activity.data.data.map((entry) => {
              const [label, icon] = activityLabel(entry.action);
              const detail = typeof entry.details?.score === "string" ? entry.details.score : typeof entry.details?.reason === "string" ? entry.details.reason : null;
              return (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/5 ring-1 ring-inset ring-white/8">
                    <Icon name={icon} className="size-4 text-mist-300" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{label}</span>
                    {detail && <span className="block truncate text-xs text-mist-400">{detail}</span>}
                  </span>
                  <time dateTime={entry.createdAt} className="shrink-0 text-xs text-mist-500">
                    {timeAgo(entry.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-mist-400">Nothing yet.</p>
        )}
      </Card>
    </div>
  );
}

function NextSeason({ league }: { league: LeagueDetail }) {
  const management = useLeagueManagement(league.id);
  const current = league.selectedSeason;
  const lengthMs = current?.startsAt && current.endsAt ? new Date(current.endsAt).getTime() - new Date(current.startsAt).getTime() : 10 * 7 * 86_400_000;
  const [startsAt, setStartsAt] = useState(() => {
    const date = new Date(Date.now() + 14 * 86_400_000);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  });
  const [carryOver, setCarryOver] = useState(true);
  const endsAt = new Date(new Date(startsAt).getTime() + lengthMs).toISOString();
  if (league.viewer.draftSeasonId)
    return (
      <Card title="Next season" description="You've drafted the next season. Finish its settings and publish it to open entries.">
        <LinkButton to={`/leagues/${league.id}/edit`} size="sm" icon="edit">
          Continue setup
        </LinkButton>
      </Card>
    );
  if (!league.viewer.canCreateSeason) return null;
  return (
    <Card title="Next season" description="Copies this season's format, schedule and rules. You can change anything before publishing.">
      <div className="grid gap-4">
        <ScheduleField label="Starts" days={120} value={startsAt} onChange={setStartsAt} />
        <p className="text-sm text-mist-400">Runs as long as the last one, until {new Date(endsAt).toLocaleDateString()}. Change the end date in setup.</p>
        <Switch label="Bring everyone back" description={`Enter this season's ${league.entrantType === "team" ? "teams" : "players"} into the next one with their rosters.`} checked={carryOver} onChange={setCarryOver} />
        <ErrorLine error={management.nextSeason.error} />
        <div>
          <Button size="sm" icon="calendar" disabled={management.nextSeason.isPending} onClick={() => management.nextSeason.mutate({ startsAt, endsAt, carryOver }, { onSuccess: () => toast.success("Next season drafted", "Check the settings and publish it.") })}>
            {management.nextSeason.isPending ? "Drafting…" : "Draft next season"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Settings({ league }: { league: LeagueDetail }) {
  const management = useLeagueManagement(league.id);
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? "");
  const [rulesText, setRulesText] = useState(league.selectedSeason?.rulesText ?? "");
  const [organizersCanPlay, setOrganizersCanPlay] = useState(Boolean(league.organizersCanPlay));
  const [cover, setCover] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const save = async () => {
    try {
      await management.update.mutateAsync({ name: name.trim(), description: description.trim(), rulesText: rulesText.trim(), organizersCanPlay });
      if (cover) await management.uploadImage.mutateAsync({ file: cover, kind: "banner" });
      if (logo) await management.uploadImage.mutateAsync({ file: logo, kind: "logo" });
      setCover(null);
      setLogo(null);
      toast.success("League updated");
    } catch {
      // The error shows under the form.
    }
  };
  const pending = management.update.isPending || management.uploadImage.isPending;
  return (
    <div className="grid gap-6">
      <Card title="Details" description="Format, schedule and scoring are fixed for a published season; these can change any time.">
        <div className="grid gap-4">
          <TextField id="league-edit-name" label="Name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
          <TextAreaField id="league-edit-description" label="Description" maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} />
          <TextAreaField id="league-edit-rules" label="House rules" maxLength={8000} value={rulesText} onChange={(event) => setRulesText(event.target.value)} />
          <Switch
            label="Organizers can play"
            description="You and the other organizers can enter. You can't move your own matches, and disputes go to Gamerie."
            checked={organizersCanPlay}
            onChange={setOrganizersCanPlay}
          />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <LadderCoverDrop file={cover} url={league.banner} onFile={setCover} />
            <LadderLogoDrop file={logo} url={league.logo} onFile={setLogo} />
          </div>
          <ErrorLine error={management.update.error ?? management.uploadImage.error} />
          <div>
            <Button size="sm" icon="check" disabled={pending || name.trim().length < 3} onClick={() => void save()}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </Card>
      <NextSeason league={league} />
    </div>
  );
}

export function LeagueManage({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const reports = useLeagueReports(league.id, season.id);
  const disputes = reports.data?.length ?? 0;
  const views = useMemo(
    () =>
      [
        { value: "entries" as const, label: "Entries" },
        { value: "matches" as const, label: disputes ? `Matches · ${disputes}` : "Matches" },
        ...(season.groups.count > 1 ? [{ value: "groups" as const, label: "Groups" }] : []),
        { value: "updates" as const, label: "Updates" },
        { value: "settings" as const, label: "Settings" },
      ] satisfies Array<{ value: View; label: string }>,
    [disputes, season.groups.count],
  );
  const [view, setView] = useManageView(views.map((item) => item.value), "entries");
  const me = useAuthStore((state) => state.user?.id);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-none">
        <Segmented label="Manage" value={view} onChange={setView} options={views} className={cn("w-fit")} />
      </div>
      {view === "entries" ? (
        <Entries league={league} season={season} />
      ) : view === "matches" ? (
        <Matches league={league} season={season} />
      ) : view === "groups" ? (
        <Groups league={league} season={season} />
      ) : view === "updates" ? (
        <Updates league={league} />
      ) : (
        <>
          <Settings league={league} />
          {(league.ownerId === me || league.host.type === "hub") && (
            <DeleteCompetition kind="league" name={league.name} onDelete={() => deleteLeague(league.id)} />
          )}
        </>
      )}
    </div>
  );
}
