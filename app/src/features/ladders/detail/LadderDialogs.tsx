import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserTeams } from "@/features/communities/hooks";
import type { TeamSummary } from "@/features/communities/types";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import type { LadderChallenge, LadderDetail, LadderEntryInput, LadderParticipant } from "../types";
import { formatRematchWait } from "../utils";

// Ladder entries are made by the team's leader: its owner or a member titled leader.
function canLead(team: TeamSummary, userId: string) {
  if ([team.role, team.title].some((value) => ["owner", "leader"].includes(value || ""))) return true;
  if (team.ownerId === userId) return true;
  return Boolean(team.members?.some((member) => (member.userId === userId || member.user?.id === userId) && (member.role === "owner" || member.title === "leader")));
}

/** What the entry dialog needs from a competition, so leagues can share it with ladders. */
export type EntryTarget = Pick<LadderDetail, "name" | "entrantType" | "teamSize" | "substitutes" | "joinMode"> & {
  viewer: { participant?: { teamId?: string | null } | null };
} & Partial<Pick<LadderDetail, "points" | "allowDraws" | "rematchWaitDays" | "rematchWaitHours">>;

export function LadderEntryDialog({
  ladder,
  mode,
  pending,
  error,
  onSubmit,
  onClose,
  soloHint,
  soloDetails,
}: {
  ladder: EntryTarget;
  mode: "join" | "accept";
  /** Replaces the ladder wording for solo entries. */
  soloHint?: string;
  soloDetails?: ReactNode;
  pending: boolean;
  error?: string;
  onSubmit: (input: LadderEntryInput) => void;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const team = ladder.entrantType === "team";
  const teams = useUserTeams(user?.id, team);
  const eligible = useMemo(
    () =>
      (teams.data ?? []).filter(
        (item) => canLead(item, user?.id ?? "") && (!ladder.viewer.participant?.teamId || item.id === ladder.viewer.participant.teamId),
      ),
    [ladder.viewer.participant?.teamId, teams.data, user?.id],
  );
  const [teamId, setTeamId] = useState(ladder.viewer.participant?.teamId ?? "");
  const [starters, setStarters] = useState<string[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [invalid, setInvalid] = useState("");
  const required = ladder.teamSize || 1;
  useEffect(() => {
    if (!teamId && eligible[0]) setTeamId(eligible[0].id);
  }, [eligible, teamId]);
  const selected = eligible.find((item) => item.id === teamId);
  const members = (selected?.members ?? []).filter((member) => member.user?.id || member.userId);

  const toggle = (id: string) => {
    if (starters.includes(id)) return setStarters(starters.filter((item) => item !== id));
    if (subs.includes(id)) return setSubs(subs.filter((item) => item !== id));
    if (starters.length < required) setStarters([...starters, id]);
    else if (subs.length < ladder.substitutes) setSubs([...subs, id]);
  };

  const submit = () => {
    if (!team) return onSubmit({});
    if (!teamId) return setInvalid("Choose a team you lead.");
    if (starters.length !== required) return setInvalid(`Pick exactly ${required} starters.`);
    setInvalid("");
    onSubmit({ teamId, starterUserIds: starters, substituteUserIds: subs });
  };

  return (
    <Dialog
      open
      title={mode === "accept" ? "Accept the invitation" : ladder.joinMode === "approval" ? "Request to join" : `Join ${ladder.name}`}
      description={
        team
          ? `Enter a team you lead with ${required} starters${ladder.substitutes ? ` and up to ${ladder.substitutes} substitutes` : ""}.`
          : ladder.joinMode === "approval"
            ? "The organizer approves each entry. You'll be notified."
            : (soloHint ?? "You can challenge anyone on the table once the season starts.")
      }
      icon={team ? "team" : "ladders"}
      size={team ? "lg" : "md"}
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending} onClick={submit}>
            {pending ? "Sending…" : mode === "accept" ? "Accept" : ladder.joinMode === "approval" ? "Send request" : "Join"}
          </Button>
        </>
      }
    >
      {team ? (
        <div className="grid gap-5">
          {teams.isLoading ? (
            <p className="text-sm text-mist-400">Loading your teams…</p>
          ) : !eligible.length ? (
            <p className="text-sm text-mist-300">You need to lead a team to enter it here. Ask your team's owner to enter, or start a team.</p>
          ) : (
            <>
              {eligible.length > 1 && (
                <ChoiceGroup legend="Team" columns={2}>
                  {eligible.map((item) => (
                    <ChoiceChip
                      key={item.id}
                      name="ladder-team"
                      value={item.id}
                      checked={teamId === item.id}
                      onChange={() => {
                        setTeamId(item.id);
                        setStarters([]);
                        setSubs([]);
                      }}
                      label={item.name}
                    />
                  ))}
                </ChoiceGroup>
              )}
              <div className="flex gap-2">
                <span className={cn("type-label rounded-full px-2.5 py-1", starters.length === required ? "bg-lavender-400 text-ink-950" : "bg-white/6 text-mist-300")}>
                  Starters {starters.length}/{required}
                </span>
                {ladder.substitutes > 0 && (
                  <span className="type-label rounded-full bg-white/6 px-2.5 py-1 text-mist-300">
                    Subs {subs.length}/{ladder.substitutes}
                  </span>
                )}
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {members.map((member) => {
                  const id = member.user?.id ?? member.userId ?? "";
                  const role = starters.includes(id) ? "Starter" : subs.includes(id) ? "Sub" : null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-pressed={Boolean(role)}
                        onClick={() => toggle(id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 ring-inset transition-colors",
                          role === "Starter" ? "bg-lavender-400/12 ring-lavender-400/70" : role ? "bg-white/6 ring-white/25" : "bg-white/4 ring-white/10 hover:bg-white/7",
                        )}
                      >
                        <Avatar src={member.user?.profileImage} name={member.user?.username} size="sm" className="rounded-full" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.user?.username ?? "Member"}</span>
                        <span className={cn("type-label rounded-full px-2 py-1", role === "Starter" ? "bg-lavender-400 text-ink-950" : role ? "bg-white/10 text-mist-200" : "text-mist-500")}>
                          {role ?? "Add"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : soloDetails ? (
        soloDetails
      ) : ladder.points && (
        <div className="grid gap-3 text-sm leading-relaxed text-mist-300">
          <p className="flex items-start gap-2.5">
            <Icon name="challenges" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
            Challenge anyone on the table. Wins are worth {ladder.points.win} points{ladder.allowDraws ? `, draws ${ladder.points.draw}` : ""}.
          </p>
          <p className="flex items-start gap-2.5">
            <Icon name="clock" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
            {ladder.rematchWaitHours === 0 ? "You can play the same opponent again any time." : `You can play the same opponent again after ${formatRematchWait(ladder.rematchWaitHours ?? (ladder.rematchWaitDays ?? 7) * 24)}.`}
          </p>
        </div>
      )}
      {(invalid || error) && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {invalid || error}
        </p>
      )}
    </Dialog>
  );
}

export function LadderChallengeDialog({
  ladder,
  opponent,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  ladder: LadderDetail;
  opponent: LadderParticipant;
  pending: boolean;
  error?: string;
  onSubmit: (input: { scheduledDate: string; mode?: string; message?: string }) => void;
  onClose: () => void;
}) {
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState(ladder.allowedModes[0] ?? "");
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState("");
  const submit = () => {
    if (!when) return setInvalid("Pick a day and a time.");
    if (new Date(when).getTime() <= Date.now()) return setInvalid("Pick a time in the future.");
    setInvalid("");
    onSubmit({ scheduledDate: when, mode: mode || undefined, message: message.trim() || undefined });
  };
  return (
    <Dialog
      open
      title={`Challenge ${opponent.displayName}`}
      description={`Best of ${ladder.bestOf}. They have time to answer before it expires.`}
      icon="challenges"
      size="lg"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" icon="challenges" disabled={pending} onClick={submit}>
            {pending ? "Sending…" : "Send challenge"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <ScheduleField value={when} onChange={setWhen} error={invalid} days={7} />
        {ladder.allowedModes.length > 0 && (
          <ChoiceGroup legend="Mode" columns={3}>
            {ladder.allowedModes.map((item) => (
              <ChoiceChip key={item} name="ladder-mode" value={item} checked={mode === item} onChange={() => setMode(item)} label={item} />
            ))}
          </ChoiceGroup>
        )}
        <TextAreaField id="ladder-message" label="Message (optional)" maxLength={300} value={message} onChange={(event) => setMessage(event.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export function LadderResultDialog({
  match,
  allowDraws,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  match: LadderChallenge;
  allowDraws: boolean;
  pending: boolean;
  error?: string;
  onSubmit: (input: { winnerParticipantId?: string; outcome?: "draw"; challengerScore: number; challengedScore: number }) => void;
  onClose: () => void;
}) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const nameA = match.challengerTeamName ?? match.challengerName ?? "Challenger";
  const nameB = match.challengedTeamName ?? match.challengedName ?? "Opponent";
  const draw = a === b;
  return (
    <Dialog
      open
      title="Report the result"
      description="The other side confirms it or disputes it before it counts on the table."
      icon="trophy"
      size="lg"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={pending || (draw && !allowDraws)}
            onClick={() =>
              onSubmit({
                challengerScore: a,
                challengedScore: b,
                ...(draw ? { outcome: "draw" as const } : { winnerParticipantId: a > b ? match.ladderChallengerParticipantId : match.ladderChallengedParticipantId }),
              })
            }
          >
            {pending ? "Reporting…" : "Report result"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
          {[
            [nameA, a, setA, a > b],
            [nameB, b, setB, b > a],
          ].map(([name, value, setter, leading], index) => (
            <div key={index} className={cn("grid justify-items-center gap-3", index === 1 && "col-start-3")}>
              <span className={cn("w-full truncate text-center text-sm font-semibold", leading && "text-lavender-200")}>{name as string}</span>
              <span
                className={cn(
                  "type-display grid h-24 w-full place-items-center rounded-2xl text-5xl tabular-nums ring-1 ring-inset",
                  leading ? "bg-lavender-400/10 ring-lavender-400/50" : "bg-white/4 ring-white/10",
                )}
              >
                {value as number}
              </span>
              <span className="flex gap-2">
                {[-1, 1].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    aria-label={`${delta < 0 ? "Decrease" : "Increase"} ${name as string}`}
                    disabled={delta < 0 && (value as number) === 0}
                    onClick={() => (setter as (next: number) => void)(Math.max(0, (value as number) + delta))}
                    className="grid size-10 place-items-center rounded-full text-mist-300 ring-1 ring-inset ring-white/12 hover:bg-white/6 disabled:opacity-40"
                  >
                    <Icon name={delta < 0 ? "minus" : "plus"} weight="bold" className="size-4" />
                  </button>
                ))}
              </span>
            </div>
          ))}
          <span aria-hidden="true" className="type-display col-start-2 row-start-1 pb-2 text-3xl text-mist-500">
            –
          </span>
        </div>
        {draw && !allowDraws && <p className="text-center text-sm text-mist-400">This ladder doesn't allow draws. Enter the winning score.</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export const ladderError = (error: unknown, fallback: string) => (error ? getApiErrorMessage(error, fallback) : undefined);
