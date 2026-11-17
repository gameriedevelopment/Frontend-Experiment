import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { useEligibleLineupMembers } from "@/features/challenges/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { answerInvitation, registerForTournament, updateRoster } from "../api";
import { useHostingOptions, useTournamentAction } from "../hooks";
import type { HostedTournamentDetail } from "../types";
import { FORMAT_LABELS, formatShortDateTime } from "../utils";

export type RegisterMode =
  | { kind: "register" }
  | { kind: "invitation"; entrantId: string; teamId?: string | null }
  | { kind: "roster"; entrantId: string; teamId: string; players: string[]; substitutes: string[] };

function NextSteps({ tournament }: { tournament: HostedTournamentDetail }) {
  const steps = [
    tournament.checkInOpensAt
      ? `Check in between ${formatShortDateTime(tournament.checkInOpensAt)} and ${formatShortDateTime(tournament.checkInClosesAt)}.`
      : "Check in when the window opens before the start.",
    `The bracket is drawn at ${tournament.startsAt ? formatShortDateTime(tournament.startsAt) : "the start"}.`,
    "Each match shows up in Challenges and on your calendar.",
  ];
  return (
    <ol className="grid gap-3">
      {steps.map((step, index) => (
        <li key={step} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 text-sm leading-relaxed text-mist-300">
          <span className="grid size-7 place-items-center rounded-full bg-white/5 text-xs font-semibold text-mist-200 ring-1 ring-inset ring-white/10">
            {index + 1}
          </span>
          <span className="pt-1">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function RegisterDialog({
  tournament,
  mode,
  onClose,
}: {
  tournament: HostedTournamentDetail;
  mode: RegisterMode;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const team = tournament.entrantType === "team";
  const hosting = useHostingOptions(team);
  const leaderTeams = (hosting.data?.hosts ?? []).filter((host) => host.type === "team");
  const [teamId, setTeamId] = useState(mode.kind !== "register" && mode.teamId ? mode.teamId : "");
  const activeTeam = teamId || (leaderTeams.length === 1 ? leaderTeams[0].id : "");
  const members = useEligibleLineupMembers(activeTeam, team && Boolean(activeTeam));
  const [players, setPlayers] = useState<string[]>(mode.kind === "roster" ? mode.players : []);
  const [subs, setSubs] = useState<string[]>(mode.kind === "roster" ? mode.substitutes : []);
  const [done, setDone] = useState<string | null>(null);
  const size = tournament.teamSize ?? 1;

  const action = useTournamentAction(tournament.id, async () => {
    const roster = team ? { teamId: activeTeam, playerIds: players, substituteIds: subs } : {};
    if (mode.kind === "roster") {
      await updateRoster(tournament.id, mode.entrantId, { playerIds: players, substituteIds: subs });
      return "Your roster is saved. It locks at check-in.";
    }
    if (mode.kind === "invitation") {
      await answerInvitation(tournament.id, mode.entrantId, true, roster);
      return "Invitation accepted. You're in the field.";
    }
    const result = await registerForTournament(tournament.id, team ? roster : {});
    if (result.status === "waitlisted") return `The bracket is full, so you're #${result.waitlistPosition} on the waitlist.`;
    if (result.status === "pending_approval") return "Sent to the organizer for approval. You'll be notified.";
    return `You're registered for ${tournament.name}.`;
  });
  const decline = useTournamentAction(tournament.id, async () => {
    if (mode.kind === "invitation") await answerInvitation(tournament.id, mode.entrantId, false);
  });

  const toggle = (id: string) => {
    if (players.includes(id)) return setPlayers(players.filter((item) => item !== id));
    if (subs.includes(id)) return setSubs(subs.filter((item) => item !== id));
    if (players.length < size) setPlayers([...players, id]);
    else if (subs.length < tournament.substitutes) setSubs([...subs, id]);
  };

  const blocker = team && hosting.isSuccess && !leaderTeams.length ? "Only team leaders can register a team." : null;
  const rosterReady = !team || (players.length === size && Boolean(activeTeam));
  const pending = action.isPending || decline.isPending;

  if (done) {
    return (
      <Dialog
        open
        title={mode.kind === "roster" ? "Roster saved" : "You're in"}
        description={done}
        icon="check"
        tone="signal"
        onClose={onClose}
        footer={
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        }
      >
        {mode.kind !== "roster" && <NextSteps tournament={tournament} />}
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      title={mode.kind === "roster" ? "Edit roster" : mode.kind === "invitation" ? "You're invited" : `Register for ${tournament.name}`}
      description={
        team
          ? `Pick ${size} starters${tournament.substitutes ? ` and up to ${tournament.substitutes} substitutes` : ""}. Rosters lock at check-in.`
          : "You'll play under your Gamerie account."
      }
      icon={team ? "team" : "ticket"}
      size={team ? "lg" : "md"}
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          {mode.kind === "invitation" && (
            <Button
              tone="ghost"
              size="sm"
              className="mr-auto"
              disabled={pending}
              onClick={() => decline.mutate(undefined, { onSuccess: onClose })}
            >
              Decline
            </Button>
          )}
          <Button tone="ghost" size="sm" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!rosterReady || Boolean(blocker) || pending}
            onClick={() =>
              action.mutate(undefined, { onSuccess: (message) => setDone(message) })
            }
          >
            {action.isPending ? "Saving…" : mode.kind === "roster" ? "Save roster" : mode.kind === "invitation" ? "Accept" : "Register"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        {!team && (
          <div className="overflow-hidden rounded-2xl ring-1 ring-inset ring-white/10">
            <div className="flex items-center gap-3 bg-lavender-400 px-4 py-3.5 text-ink-950">
              <Avatar src={user?.profileImage} name={user?.username} size="md" tone="ink" className="rounded-full" />
              <div className="min-w-0">
                <p className="type-label text-ink-950/60">Entry</p>
                <p className="truncate font-semibold">{user?.username ?? "You"}</p>
              </div>
              <Icon name="ticket" weight="duotone" className="ml-auto size-6 text-ink-950/60" />
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-white/15 bg-ink-900 px-4 py-4 text-sm">
              <div>
                <dt className="type-label text-mist-500">Format</dt>
                <dd className="mt-1 font-semibold">{FORMAT_LABELS[tournament.format]}</dd>
              </div>
              <div>
                <dt className="type-label text-mist-500">Starts</dt>
                <dd className="mt-1 font-semibold">{tournament.startsAt ? formatShortDateTime(tournament.startsAt) : "To be set"}</dd>
              </div>
            </dl>
          </div>
        )}

        {!team && mode.kind === "register" && <NextSteps tournament={tournament} />}

        {blocker && (
          <p role="alert" className="text-sm text-danger">
            {blocker}
          </p>
        )}

        {team && leaderTeams.length > 1 && mode.kind === "register" && (
          <ChoiceGroup legend="Team" columns={2}>
            {leaderTeams.map((option) => (
              <ChoiceChip
                key={option.id}
                name="register-team"
                value={option.id}
                checked={activeTeam === option.id}
                onChange={() => {
                  setTeamId(option.id);
                  setPlayers([]);
                  setSubs([]);
                }}
                label={option.name}
              />
            ))}
          </ChoiceGroup>
        )}

        {team && activeTeam && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              <span
                className={cn(
                  "type-label rounded-full px-2.5 py-1",
                  players.length === size ? "bg-lavender-400 text-ink-950" : "bg-white/6 text-mist-300",
                )}
              >
                Starters {players.length}/{size}
              </span>
              {tournament.substitutes > 0 && (
                <span className="type-label rounded-full bg-white/6 px-2.5 py-1 text-mist-300">
                  Subs {subs.length}/{tournament.substitutes}
                </span>
              )}
            </div>
            {members.isLoading ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {(members.data ?? []).map((member) => {
                  const role = players.includes(member.playerId) ? "Starter" : subs.includes(member.playerId) ? "Sub" : null;
                  return (
                    <li key={member.playerId}>
                      <button
                        type="button"
                        aria-pressed={Boolean(role)}
                        onClick={() => toggle(member.playerId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow]",
                          role === "Starter"
                            ? "bg-lavender-400/12 ring-lavender-400/70"
                            : role === "Sub"
                              ? "bg-white/6 ring-white/25"
                              : "bg-white/4 ring-white/10 hover:bg-white/7",
                        )}
                      >
                        <Avatar src={member.profileImage ?? undefined} name={member.username} size="sm" className="rounded-full" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{member.username}</span>
                          <span className="block truncate text-xs text-mist-500">{member.title || member.role}</span>
                        </span>
                        <span
                          className={cn(
                            "type-label shrink-0 rounded-full px-2 py-1",
                            role === "Starter" ? "bg-lavender-400 text-ink-950" : role === "Sub" ? "bg-white/10 text-mist-200" : "text-mist-500",
                          )}
                        >
                          {role ?? "Add"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-mist-500">
              A player can be on one roster per tournament. Tap a player again to take them off.
            </p>
          </div>
        )}

        {(action.isError || decline.isError) && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(action.error ?? decline.error, "That didn't go through.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}
