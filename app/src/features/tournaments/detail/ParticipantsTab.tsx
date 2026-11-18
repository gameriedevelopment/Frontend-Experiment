import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { entrantPath, playerPath } from "@/lib/paths";
import { EntrantMark } from "../components/EntrantMark";
import { useTournamentBracket, useTournamentParticipants } from "../hooks";
import type { BracketMatch, EntrantStatus, HostedTournamentDetail, TournamentParticipant } from "../types";
import { entrantStatusLabel, ordinal } from "../utils";
import type { RegisterMode } from "./RegisterDialog";

const stillIn: EntrantStatus[] = ["registered", "checked_in", "active"];
const out: EntrantStatus[] = ["eliminated", "disqualified", "withdrawn", "finished"];
type Filter = "all" | "in" | "out" | "checked" | "waitlist";

function progress(entrant: TournamentParticipant, matches: BracketMatch[]): string | null {
  const mine = matches.filter((match) => match.sideA.entrantId === entrant.id || match.sideB.entrantId === entrant.id);
  if (entrant.status === "eliminated") {
    const last = mine.filter((match) => match.status === "completed").sort((a, b) => b.number - a.number)[0];
    return last ? `Out in the ${last.label.toLowerCase()}` : null;
  }
  const open = mine.find((match) => ["ready", "scheduled", "live", "result_pending", "disputed"].includes(match.status));
  if (open) return open.status === "live" ? `Playing the ${open.label.toLowerCase()}` : `Next: ${open.label}`;
  return null;
}

function statusClasses(status: EntrantStatus) {
  if (status === "checked_in") return "bg-signal/12 text-signal";
  if (status === "disqualified") return "bg-danger/12 text-danger";
  if (out.includes(status)) return "bg-white/4 text-mist-500";
  if (status === "waitlisted" || status === "pending_approval" || status === "invited") return "bg-white/6 text-mist-300";
  return "bg-lavender-400/12 text-lavender-300";
}

function ParticipantCard({
  entrant,
  mine,
  team,
  note,
  onEditRoster,
}: {
  entrant: TournamentParticipant;
  mine: boolean;
  team: boolean;
  note: string | null;
  onEditRoster?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const starters = entrant.roster.filter((member) => member.role === "player");
  const subs = entrant.roster.filter((member) => member.role === "substitute");

  return (
    <li
      className={cn(
        "grid gap-4 rounded-2xl bg-ink-900/60 p-4 ring-1 ring-inset",
        mine ? "ring-lavender-400/40" : "ring-white/6",
        out.includes(entrant.status) && "opacity-70",
      )}
    >
      <div className="flex items-center gap-3">
        <EntrantLink to={entrantPath(entrant)} className="flex min-w-0 flex-1 items-center gap-3">
          <EntrantMark name={entrant.name} src={entrant.avatar} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 truncate font-semibold">
              {entrant.name}
              {mine && <span className="type-label text-lavender-300">You</span>}
            </span>
            <span className="mt-0.5 block truncate text-xs text-mist-500">
              {entrant.seed ? `Seed ${entrant.seed}` : "Unseeded"}
              {note ? ` · ${note}` : ""}
            </span>
          </span>
        </EntrantLink>
        {entrant.placement ? (
          <span
            className={cn(
              "type-label flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1",
              entrant.placement === 1 ? "bg-signal/12 text-signal" : "bg-white/6 text-mist-200",
            )}
          >
            {entrant.placement === 1 && <Icon name="crown" weight="fill" className="size-3" />}
            {ordinal(entrant.placement)}
          </span>
        ) : (
          <span className={cn("type-label shrink-0 rounded-full px-2.5 py-1", statusClasses(entrant.status))}>
            {entrantStatusLabel(entrant.status)}
            {entrant.status === "waitlisted" && entrant.waitlistPosition ? ` #${entrant.waitlistPosition}` : ""}
          </span>
        )}
      </div>

      {team && entrant.roster.length > 0 && (
        <div className="border-t border-white/6 pt-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center justify-between text-left text-xs text-mist-400 hover:text-mist-200"
          >
            <span className="flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {starters.slice(0, 5).map((member) => (
                  <EntrantMark key={member.userId} name={member.name} size="xs" className="rounded-full ring-2 ring-ink-900" />
                ))}
              </span>
              {starters.length} {starters.length === 1 ? "player" : "players"}
              {subs.length ? ` · ${subs.length} ${subs.length === 1 ? "sub" : "subs"}` : ""}
            </span>
            <Icon name="chevronDown" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <ul className="mt-3 grid gap-1.5 text-sm">
              {entrant.roster.map((member) => (
                <li key={member.userId} className="flex items-center justify-between gap-3">
                  <EntrantLink to={playerPath(member.userId)} className="truncate text-mist-200">
                    {member.name}
                  </EntrantLink>
                  <span className="text-xs text-mist-500">{member.role === "substitute" ? "Substitute" : "Starter"}</span>
                </li>
              ))}
            </ul>
          )}
          {onEditRoster && (
            <Button tone="ghost" size="sm" icon="edit" className="mt-2 -ml-3" onClick={onEditRoster}>
              Edit roster
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function ParticipantsTab({
  tournament,
  onEditRoster,
}: {
  tournament: HostedTournamentDetail;
  onEditRoster: (mode: RegisterMode) => void;
}) {
  const participants = useTournamentParticipants(tournament.id);
  const started = ["live", "paused", "completed"].includes(tournament.phase);
  const bracket = useTournamentBracket(tournament.id, started, tournament.phase === "live");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const me = tournament.viewer.entrant;
  const team = tournament.entrantType === "team";
  const all = participants.data ?? [];

  const options: Array<{ value: Filter; label: string }> = started
    ? [
        { value: "all", label: `All ${all.length}` },
        { value: "in", label: `Still in ${all.filter((entrant) => stillIn.includes(entrant.status)).length}` },
        { value: "out", label: `Out ${all.filter((entrant) => out.includes(entrant.status)).length}` },
      ]
    : [
        { value: "all", label: `All ${all.filter((entrant) => !["declined", "removed", "withdrawn"].includes(entrant.status)).length}` },
        { value: "checked", label: `Checked in ${all.filter((entrant) => entrant.status === "checked_in").length}` },
        { value: "waitlist", label: `Waitlist ${all.filter((entrant) => entrant.status === "waitlisted").length}` },
      ];

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all
      .filter((entrant) => {
        if (filter === "in") return stillIn.includes(entrant.status);
        if (filter === "out") return out.includes(entrant.status);
        if (filter === "checked") return entrant.status === "checked_in";
        if (filter === "waitlist") return entrant.status === "waitlisted";
        return started || !["declined", "removed", "withdrawn"].includes(entrant.status);
      })
      .filter(
        (entrant) =>
          !term ||
          entrant.name.toLowerCase().includes(term) ||
          entrant.roster.some((member) => member.name.toLowerCase().includes(term)),
      )
      .sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999) || (a.seed ?? 999) - (b.seed ?? 999));
  }, [all, filter, search, started]);

  if (participants.isLoading) {
    return (
      <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (participants.isError) {
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="Participants didn't load"
        description={getApiErrorMessage(participants.error, "Try again in a moment.")}
        action={
          <Button tone="outline" size="sm" onClick={() => void participants.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const rosterEditable = team && me && ["registered", "waitlisted"].includes(me.status) && tournament.phase === "registration";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search participants</span>
          <Icon name="search" className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={team ? "Search teams or players" : "Search players"}
            className={cn(inputClasses, "h-11 pl-11 text-sm")}
          />
        </label>
        <Segmented label="Show" options={options} value={filter} onChange={setFilter} className="relative w-fit max-w-full overflow-x-auto scrollbar-none" />
      </div>

      {rows.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((entrant) => {
            const mine = entrant.id === me?.id;
            return (
              <ParticipantCard
                key={entrant.id}
                entrant={entrant}
                mine={mine}
                team={team}
                note={progress(entrant, bracket.data?.matches ?? [])}
                onEditRoster={
                  mine && rosterEditable && entrant.teamId
                    ? () =>
                        onEditRoster({
                          kind: "roster",
                          entrantId: entrant.id,
                          teamId: entrant.teamId!,
                          players: entrant.roster.filter((member) => member.role === "player").map((member) => member.userId),
                          substitutes: entrant.roster.filter((member) => member.role === "substitute").map((member) => member.userId),
                        })
                    : undefined
                }
              />
            );
          })}
        </ul>
      ) : (
        <StatePanel
          icon="people"
          title={search ? "Nobody matches that search" : "No one here yet"}
          description={search ? "Try another name." : "Entrants show up here as they register."}
        />
      )}
    </div>
  );
}
