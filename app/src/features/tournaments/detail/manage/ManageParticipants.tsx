import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { OptionCards } from "@/components/ui/OptionCards";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchResults } from "@/features/discovery/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { decideEntrant, disqualifyEntrant, inviteEntrant, type EntrantDecision } from "../../api";
import { EntrantMark } from "../../components/EntrantMark";
import { useTournamentAction, useTournamentParticipants } from "../../hooks";
import type { EntrantStatus, HostedTournamentDetail, TournamentParticipant } from "../../types";
import { entrantStatusLabel } from "../../utils";
import { ReasonDialog } from "./ReasonDialog";

type Pending = { kind: "decline" | "remove" | "disqualify"; entrant: TournamentParticipant } | null;

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <section className="grid gap-3">
      <h3 className="type-label flex items-center gap-2 text-mist-500">
        {title}
        <span className="text-mist-500/60">{count}</span>
      </h3>
      <ul className="grid gap-2">{children}</ul>
    </section>
  );
}

function Row({ entrant, children }: { entrant: TournamentParticipant; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-ink-900/60 px-4 py-3 ring-1 ring-inset ring-white/6">
      <EntrantMark name={entrant.name} src={entrant.avatar} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{entrant.name}</span>
        <span className="block truncate text-xs text-mist-500">
          {entrantStatusLabel(entrant.status)}
          {entrant.seed ? ` · Seed ${entrant.seed}` : ""}
          {entrant.waitlistPosition ? ` · #${entrant.waitlistPosition}` : ""}
          {entrant.roster.length ? ` · ${entrant.roster.length} on roster` : ""}
        </span>
      </span>
      <span className="flex shrink-0 gap-1.5">{children}</span>
    </li>
  );
}

export function ManageParticipants({ tournament }: { tournament: HostedTournamentDetail }) {
  const id = tournament.id;
  const team = tournament.entrantType === "team";
  const started = ["live", "paused"].includes(tournament.phase);
  const participants = useTournamentParticipants(id);
  const [pending, setPending] = useState<Pending>(null);
  const [rrMode, setRrMode] = useState<"forfeit_remaining" | "void_results">("forfeit_remaining");
  const [query, setQuery] = useState("");
  const [invitee, setInvitee] = useState<ComboboxOption | null>(null);
  const term = useDebouncedValue(query);
  const players = useSearchResults("players", term, !team);
  const teams = useSearchResults("teams", term, team);

  const decide = useTournamentAction(id, (args: { entrantId: string; decision: EntrantDecision; reason?: string }) =>
    decideEntrant(id, args.entrantId, args.decision, args.reason),
  );
  const disqualify = useTournamentAction(id, (args: { entrantId: string; reason: string }) =>
    disqualifyEntrant(id, args.entrantId, args.reason, tournament.format === "round_robin" ? rrMode : undefined),
  );
  const invite = useTournamentAction(id, (targetId: string) => inviteEntrant(id, team ? "team" : "player", targetId));

  const all = participants.data ?? [];
  const by = (statuses: EntrantStatus[]) => all.filter((entrant) => statuses.includes(entrant.status));
  const approvals = by(["pending_approval"]);
  const waitlist = by(["waitlisted"]).sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));
  const field = by(["registered", "checked_in", "active"]);
  const invited = by(["invited"]);
  const inviteOptions = useMemo<ComboboxOption[]>(
    () =>
      team
        ? (teams.data?.data ?? []).map((item) => ({ value: item.id, label: item.name, description: item.level, image: item.logo }))
        : (players.data?.data ?? []).map((item) => ({ value: item.id, label: item.username, description: item.gamerTitle, image: item.profileImage })),
    [players.data, team, teams.data],
  );

  const act = (entrant: TournamentParticipant, decision: EntrantDecision, message: string) =>
    decide.mutate({ entrantId: entrant.id, decision }, { onSuccess: () => toast.success(message, entrant.name) });

  if (participants.isLoading) return <Skeleton className="h-64 rounded-card" />;

  return (
    <div className="grid gap-8">
      {tournament.registrationMode !== "open" || tournament.phase === "registration" ? (
        <section className="grid gap-3 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6">
          <h3 className="text-sm font-semibold">Invite {team ? "a team" : "a player"}</h3>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Combobox
              id="invite-entrant"
              label={team ? "Team" : "Player"}
              placeholder={team ? "Search teams" : "Search players"}
              query={query}
              onQueryChange={setQuery}
              options={inviteOptions}
              loading={(team ? teams : players).isFetching}
              value={invitee}
              onChange={setInvitee}
              avatars
            />
            <Button
              size="sm"
              icon="mail"
              className="h-12"
              disabled={!invitee || invite.isPending}
              onClick={() =>
                invitee &&
                invite.mutate(invitee.value, {
                  onSuccess: () => {
                    toast.success("Invitation sent", invitee.label);
                    setInvitee(null);
                  },
                })
              }
            >
              Invite
            </Button>
          </div>
        </section>
      ) : null}

      {(decide.isError || invite.isError) && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(decide.error ?? invite.error, "That didn't go through.")}
        </p>
      )}

      <Group title="Waiting for approval" count={approvals.length}>
        {approvals.map((entrant) => (
          <Row key={entrant.id} entrant={entrant}>
            <Button tone="ghost" size="sm" onClick={() => setPending({ kind: "decline", entrant })}>
              Decline
            </Button>
            <Button size="sm" disabled={decide.isPending} onClick={() => act(entrant, "approve", "Approved")}>
              Approve
            </Button>
          </Row>
        ))}
      </Group>

      <Group title="Waitlist" count={waitlist.length}>
        {waitlist.map((entrant) => (
          <Row key={entrant.id} entrant={entrant}>
            <Button tone="outline" size="sm" disabled={decide.isPending} onClick={() => act(entrant, "promote", "Given a place")}>
              Give a place
            </Button>
          </Row>
        ))}
      </Group>

      <Group title={started ? "Still in" : "In the field"} count={field.length}>
        {field.map((entrant) => (
          <Row key={entrant.id} entrant={entrant}>
            {started ? (
              <Button tone="ghost" size="sm" onClick={() => setPending({ kind: "disqualify", entrant })}>
                Disqualify
              </Button>
            ) : (
              <Button tone="ghost" size="sm" onClick={() => setPending({ kind: "remove", entrant })}>
                Remove
              </Button>
            )}
          </Row>
        ))}
      </Group>

      <Group title="Invited" count={invited.length}>
        {invited.map((entrant) => (
          <Row key={entrant.id} entrant={entrant} />
        ))}
      </Group>

      {!all.length && <p className="text-sm text-mist-400">No one has entered yet. Share the link, or invite people above.</p>}

      {pending && (
        <ReasonDialog
          title={
            pending.kind === "disqualify"
              ? `Disqualify ${pending.entrant.name}?`
              : pending.kind === "remove"
                ? `Remove ${pending.entrant.name}?`
                : `Decline ${pending.entrant.name}?`
          }
          description={
            pending.kind === "disqualify"
              ? "Their open matches are forfeited and it's recorded in the activity log."
              : pending.kind === "remove"
                ? "Their place opens up for the next on the waitlist."
                : "They'll be told their entry wasn't accepted."
          }
          confirmLabel={pending.kind === "disqualify" ? "Disqualify" : pending.kind === "remove" ? "Remove" : "Decline"}
          reasonRequired={pending.kind !== "decline"}
          pending={decide.isPending || disqualify.isPending}
          error={
            decide.isError || disqualify.isError ? getApiErrorMessage(decide.error ?? disqualify.error, "That didn't go through.") : undefined
          }
          onClose={() => setPending(null)}
          onConfirm={(reason) => {
            const done = {
              onSuccess: () => {
                toast.info(pending.kind === "disqualify" ? "Disqualified" : pending.kind === "remove" ? "Removed" : "Declined", pending.entrant.name);
                setPending(null);
              },
            };
            if (pending.kind === "disqualify") disqualify.mutate({ entrantId: pending.entrant.id, reason }, done);
            else decide.mutate({ entrantId: pending.entrant.id, decision: pending.kind, reason: reason || undefined }, done);
          }}
        >
          {pending.kind === "disqualify" && tournament.format === "round_robin" && (
            <OptionCards
              legend="Their results"
              value={rrMode}
              onChange={setRrMode}
              options={[
                { value: "forfeit_remaining", label: "Keep played results", description: "Remaining matches are forfeited" },
                { value: "void_results", label: "Void everything", description: "All their results are removed" },
              ]}
            />
          )}
        </ReasonDialog>
      )}
    </div>
  );
}
