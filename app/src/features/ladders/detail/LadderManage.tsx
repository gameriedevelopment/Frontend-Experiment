import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchResults } from "@/features/discovery/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useLadderAction, useLadderActivity, useLadderGroups, useLadderManagement, useLadderParticipants } from "../hooks";
import type { LadderDetail, LadderParticipant } from "../types";

type View = "entries" | "groups" | "updates";

const activityLabels: Record<string, [string, IconName]> = {
  "ladder.draft_created": ["Draft created", "edit"],
  "ladder.draft_updated": ["Details updated", "edit"],
  "ladder.published": ["Ladder published", "ladders"],
  "announcement.posted": ["Update posted", "megaphone"],
  "challenge.created": ["Challenge sent", "challenges"],
  "groups.assigned": ["Groups saved", "people"],
  "groups.randomized": ["Groups shuffled", "refresh"],
  "participant.invited": ["Invitation sent", "mail"],
  "participant.joined": ["New entrant", "follow"],
  "participant.requested": ["Asked to join", "hourglass"],
  "participant.approved": ["Entry approved", "check"],
  "participant.declined": ["Entry declined", "close"],
  "participant.invitation_accepted": ["Invitation accepted", "check"],
  "participant.withdrew": ["Left the ladder", "arrowLeft"],
  "participant.removed": ["Entrant removed", "minus"],
  "result.declared": ["Result reported", "trophy"],
  "result.disputed": ["Result disputed", "flag"],
  "result.finalized": ["Result final", "check"],
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

function PersonRow({ participant, children }: { participant: LadderParticipant; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
      <Avatar src={participant.avatar ?? undefined} name={participant.displayName} size="sm" className="rounded-full" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{participant.displayName}</span>
      <span className="flex gap-1.5">{children}</span>
    </li>
  );
}

function Entries({ ladder }: { ladder: LadderDetail }) {
  const actions = useLadderAction(ladder.id);
  const pending = useLadderParticipants(ladder.id, true, "pending_approval", true);
  const invited = useLadderParticipants(ladder.id, true, "invited", true);
  const active = useLadderParticipants(ladder.id);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const [removing, setRemoving] = useState<LadderParticipant | null>(null);
  const team = ladder.entrantType === "team";
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
  const error = actions.invite.error ?? actions.reviewEntry.error ?? actions.remove.error;

  return (
    <div className="grid gap-6">
      <Card title={`Invite ${team ? "teams" : "players"}`} description="Invitations stay pending until the other side accepts.">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Combobox id="ladder-invite" label={team ? "Team" : "Player"} placeholder="Search" query={query} onQueryChange={setQuery} options={options} loading={(team ? teams : players).isFetching} value={target} onChange={setTarget} avatars />
          <Button
            size="sm"
            icon="mail"
            className="h-12"
            disabled={!target || actions.invite.isPending}
            onClick={() =>
              target &&
              actions.invite.mutate(target.value, {
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
      </Card>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(error, "That didn't go through.")}
        </p>
      )}
      {(pending.data?.data.length ?? 0) > 0 && (
        <Card title="Waiting for approval" count={pending.data!.data.length}>
          <ul className="grid gap-2">
            {pending.data!.data.map((participant) => (
              <PersonRow key={participant.id} participant={participant}>
                <Button tone="ghost" size="sm" onClick={() => actions.reviewEntry.mutate({ participantId: participant.id, action: "decline" }, { onSuccess: () => toast.info("Declined", participant.displayName) })}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => actions.reviewEntry.mutate({ participantId: participant.id, action: "approve" }, { onSuccess: () => toast.success("Approved", participant.displayName) })}>
                  Approve
                </Button>
              </PersonRow>
            ))}
          </ul>
        </Card>
      )}
      <Card title="On the ladder" count={active.data?.data.length}>
        {active.isLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : active.data?.data.length ? (
          <ul className="grid gap-2">
            {active.data.data.map((participant) => (
              <PersonRow key={participant.id} participant={participant}>
                <Button tone="ghost" size="sm" onClick={() => setRemoving(participant)}>
                  Remove
                </Button>
              </PersonRow>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist-400">No one yet.</p>
        )}
        {(invited.data?.data.length ?? 0) > 0 && (
          <p className="mt-4 text-xs text-mist-500">
            Invited and not answered: {invited.data!.data.map((participant) => participant.displayName).join(", ")}
          </p>
        )}
      </Card>
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing?.displayName}?`}
        description="They come off the table. Results already played stay with their opponents."
        confirmLabel="Remove"
        pending={actions.remove.isPending}
        onConfirm={() =>
          removing &&
          actions.remove.mutate(removing.id, {
            onSuccess: () => {
              toast.info("Removed", removing.displayName);
              setRemoving(null);
            },
          })
        }
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

function Groups({ ladder }: { ladder: LadderDetail }) {
  const groups = useLadderGroups(ladder.id, ladder.groups.count > 0);
  const participants = useLadderParticipants(ladder.id);
  const management = useLadderManagement(ladder.id);
  const saved = useMemo(
    () => Object.fromEntries((participants.data?.data ?? []).filter((item) => item.groupId).map((item) => [item.id, item.groupId!])) as Record<string, string>,
    [participants.data],
  );
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  useEffect(() => setAssignments(saved), [saved]);
  const dirty = Object.keys({ ...saved, ...assignments }).some((id) => saved[id] !== assignments[id]);

  if (ladder.groups.count === 0)
    return <Card title="Groups" description="This ladder is one table. Groups are set when the ladder is created."><p className="text-sm text-mist-400">Everyone plays on a single table.</p></Card>;
  if (groups.isLoading || participants.isLoading) return <Skeleton className="h-64 rounded-card" />;
  const list = groups.data ?? [];
  const entrants = participants.data?.data ?? [];
  const unplaced = entrants.filter((item) => !assignments[item.id]).length;

  return (
    <Card title="Groups" description={ladder.groups.allocation === "random" ? "Groups are shuffled for you, or you can place players yourself." : "Place each entrant in a group."}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {list.map((group) => (
          <span key={group.id} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-sm ring-1 ring-inset ring-white/8">
            <span className="grid size-6 place-items-center rounded-full bg-lavender-400/14 text-xs font-semibold text-lavender-200">{group.name}</span>
            <span className="tabular-nums text-mist-300">{entrants.filter((item) => assignments[item.id] === group.id).length}</span>
          </span>
        ))}
        {unplaced > 0 && <span className="text-sm text-mist-400">{unplaced} not placed</span>}
        <span className="flex-1" />
        <Button tone="outline" size="sm" icon="refresh" disabled={management.randomizeGroups.isPending} onClick={() => management.randomizeGroups.mutate(undefined, { onSuccess: () => toast.success("Groups shuffled"), onError: (error) => toast.error("Couldn't shuffle groups", getApiErrorMessage(error, "Try again in a moment.")) })}>
          Shuffle groups
        </Button>
        <Button
          size="sm"
          icon="check"
          disabled={!dirty || management.assignGroups.isPending}
          onClick={() =>
            management.assignGroups.mutate(
              Object.entries(assignments).map(([participantId, groupId]) => ({ participantId, groupId })),
              { onSuccess: () => toast.success("Groups saved"), onError: (error) => toast.error("Couldn't save groups", getApiErrorMessage(error, "Try again in a moment.")) },
            )
          }
        >
          {dirty ? "Save groups" : "Saved"}
        </Button>
      </div>
      <ul className="grid gap-2">
        {(participants.data?.data ?? []).map((participant) => (
          <li key={participant.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
            <Avatar src={participant.avatar ?? undefined} name={participant.displayName} size="sm" className="rounded-full" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{participant.displayName}</span>
            <span className="flex flex-wrap gap-1">
              {list.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={assignments[participant.id] === group.id}
                  onClick={() => setAssignments({ ...assignments, [participant.id]: group.id })}
                  className={cn(
                    "h-8 min-w-10 rounded-lg px-2.5 text-xs font-semibold ring-1 ring-inset transition-colors",
                    assignments[participant.id] === group.id ? "bg-lavender-400/14 text-mist-50 ring-lavender-400/60" : "text-mist-400 ring-white/10 hover:text-mist-100",
                  )}
                >
                  {group.name}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Updates({ ladder }: { ladder: LadderDetail }) {
  const management = useLadderManagement(ladder.id);
  const activity = useLadderActivity(ladder.id);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="grid gap-6">
      <Card title="Post an update" description="It shows on the ladder's overview and reaches everyone on it.">
        <div className="grid gap-4">
          <TextField id="ladder-update-title" label="Title (optional)" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} />
          <TextAreaField id="ladder-update-message" label="Message" maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} />
          <div className="flex justify-end">
            <Button
              size="sm"
              icon="megaphone"
              disabled={message.trim().length < 3 || management.announce.isPending}
              onClick={() =>
                management.announce.mutate(
                  { title: title.trim() || undefined, message: message.trim() },
                  {
                    onSuccess: () => {
                      setTitle("");
                      setMessage("");
                      toast.success("Update posted");
                    },
                    onError: (error) => toast.error("Couldn't post the update", getApiErrorMessage(error, "Try again in a moment.")),
                  },
                )
              }
            >
              Post update
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Activity">
        {activity.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : activity.data?.data.length ? (
          <ol className="grid grid-cols-[minmax(0,1fr)]">
            {activity.data.data.map((entry) => {
              const [label, icon] = activityLabel(entry.action);
              const detail = entry.details?.title || entry.details?.message || (entry.details?.count ? `${entry.details.count} entrants` : null);
              return (
                <li key={entry.id} className="flex items-center gap-3 border-t border-white/6 py-3 text-sm first:border-t-0 first:pt-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/5 text-mist-300">
                    <Icon name={icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-mist-100">{label}</span>
                    {detail && <span className="block truncate text-xs text-mist-500">{detail}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-mist-500">{timeAgo(entry.createdAt)}</span>
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

export function LadderManage({ ladder }: { ladder: LadderDetail }) {
  const [view, setView] = useState<View>("entries");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Organizer tools"
          value={view}
          onChange={setView}
          options={[
            { value: "entries", label: "Entries" },
            { value: "groups", label: "Groups" },
            { value: "updates", label: "Updates" },
          ]}
        />
        <LinkButton to={`/ladders/${ladder.id}/edit`} tone="outline" size="sm" icon="edit">
          Edit details
        </LinkButton>
      </div>
      {view === "entries" ? <Entries ladder={ladder} /> : view === "groups" ? <Groups ladder={ladder} /> : <Updates ladder={ladder} />}
    </div>
  );
}
