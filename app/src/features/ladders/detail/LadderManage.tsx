import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { LadderSettings } from "./LadderSettings";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchResults } from "@/features/discovery/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { entrantPath, playerPath } from "@/lib/paths";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useLadderAction, useLadderActivity, useLadderGroups, useLadderManagement, useLadderParticipants, useLadderStaff } from "../hooks";
import type { LadderDetail, LadderParticipant, LadderPermission, LadderStaffRole } from "../types";
import { useAuthStore } from "@/features/auth/authStore";

type View = "entries" | "groups" | "updates" | "settings" | "staff";

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
      <EntrantLink to={entrantPath(participant)} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={participant.avatar ?? undefined} name={participant.displayName} size="sm" tone={participant.kind === "team" ? "ink" : "brand"} className="rounded-full" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{participant.displayName}</span>
      </EntrantLink>
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
  const canRemove = (ladder.viewer.permissions ?? ["participants"]).includes("participants");

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
                {canRemove && (
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
            <EntrantLink to={entrantPath(participant)} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar src={participant.avatar ?? undefined} name={participant.displayName} size="sm" tone={participant.kind === "team" ? "ink" : "brand"} className="rounded-full" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{participant.displayName}</span>
            </EntrantLink>
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

const ROLE_INFO: Record<LadderStaffRole, { label: string; description: string }> = {
  manager: { label: "Manager", description: "Reviews entries, removes entrants, changes groups and settings, posts updates" },
  moderator: { label: "Moderator", description: "Reviews entries, sends invitations and posts updates" },
};

function Staff({ ladder }: { ladder: LadderDetail }) {
  const me = useAuthStore((state) => state.user);
  const owner = ladder.viewer.role === "owner" || !ladder.viewer.role;
  const staff = useLadderStaff(ladder.id);
  const management = useLadderManagement(ladder.id);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const [role, setRole] = useState<LadderStaffRole>("moderator");
  const term = useDebouncedValue(query);
  const players = useSearchResults("players", term, owner);
  const options = useMemo<ComboboxOption[]>(() => {
    const taken = new Set([ladder.ownerId, ...(staff.data ?? []).map((member) => member.userId)]);
    return (players.data?.data ?? [])
      .filter((item) => !taken.has(item.id))
      .map((item) => ({ value: item.id, label: item.username, description: item.gamerTitle, image: item.profileImage }));
  }, [ladder.ownerId, players.data, staff.data]);
  const error = management.setStaff.error ?? management.removeStaff.error;

  return (
    <div className="grid gap-6">
      {owner && (
        <Card title="Add staff" description="Give trusted players a role so they can help run the ladder. You stay the organizer.">
          <div className="grid gap-4">
            <Combobox id="ladder-staff" label="Player" placeholder="Search players" query={query} onQueryChange={setQuery} options={options} loading={players.isFetching} value={target} onChange={setTarget} avatars />
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(ROLE_INFO) as LadderStaffRole[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={role === value}
                  onClick={() => setRole(value)}
                  className={cn("rounded-2xl px-4 py-3 text-left ring-1 ring-inset transition-colors", role === value ? "bg-lavender-400/10 ring-lavender-400/60" : "bg-white/3 ring-white/8 hover:bg-white/5")}
                >
                  <span className="block text-sm font-semibold">{ROLE_INFO[value].label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-mist-400">{ROLE_INFO[value].description}</span>
                </button>
              ))}
            </div>
            <div>
              <Button
                size="sm"
                icon="plus"
                disabled={!target || management.setStaff.isPending}
                onClick={() =>
                  target &&
                  management.setStaff.mutate(
                    { userId: target.value, role },
                    {
                      onSuccess: () => {
                        toast.success(`${target.label} is now a ${ROLE_INFO[role].label.toLowerCase()}`);
                        setTarget(null);
                        setQuery("");
                      },
                    },
                  )
                }
              >
                Add {ROLE_INFO[role].label.toLowerCase()}
              </Button>
            </div>
          </div>
        </Card>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(error, "That didn't go through.")}
        </p>
      )}
      <Card title="Staff" count={staff.data?.length} description={owner ? "Change a role or take it away at any time. They're told either way." : "You help run this ladder. The organizer manages roles."}>
        {staff.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : staff.data?.length ? (
          <ul className="grid gap-2">
            {staff.data.map((member) => (
              <li key={member.userId} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
                <EntrantLink to={playerPath(member.username || member.userId)} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar src={member.avatar ?? undefined} name={member.username} size="sm" className="rounded-full" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{member.username}</span>
                    <span className="block text-xs text-mist-500">Added {timeAgo(member.addedAt)}</span>
                  </span>
                </EntrantLink>
                {owner ? (
                  <Segmented
                    label={`Role for ${member.username}`}
                    value={member.role}
                    onChange={(next) => next !== member.role && management.setStaff.mutate({ userId: member.userId, role: next }, { onSuccess: () => toast.success(`${member.username} is now a ${ROLE_INFO[next].label.toLowerCase()}`) })}
                    options={[
                      { value: "manager", label: "Manager" },
                      { value: "moderator", label: "Moderator" },
                    ]}
                  />
                ) : (
                  <span className="type-label rounded-full bg-white/6 px-2.5 py-1 text-mist-200">{ROLE_INFO[member.role].label}</span>
                )}
                {(owner || member.userId === me?.id) && (
                  <Button tone="ghost" size="sm" disabled={management.removeStaff.isPending} onClick={() => management.removeStaff.mutate(member.userId, { onSuccess: () => toast.info(member.userId === me?.id ? "You stepped down" : `${member.username} no longer has a role`) })}>
                    {member.userId === me?.id ? "Step down" : "Remove"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist-400">No staff yet. You run the ladder on your own.</p>
        )}
      </Card>
    </div>
  );
}

const VIEWS: Array<{ value: View; label: string; needs: LadderPermission }> = [
  { value: "entries", label: "Entries", needs: "entries" },
  { value: "groups", label: "Groups", needs: "groups" },
  { value: "updates", label: "Updates", needs: "announce" },
  { value: "settings", label: "Settings", needs: "settings" },
  { value: "staff", label: "Staff", needs: "activity" },
];

export function LadderManage({ ladder }: { ladder: LadderDetail }) {
  // Older responses carry no permissions; the organizer has them all.
  const permissions = ladder.viewer.permissions ?? ["entries", "participants", "groups", "announce", "activity", "settings", "staff"];
  const views = VIEWS.filter((item) => permissions.includes(item.needs));
  const [chosen, setView] = useState<View>("entries");
  const view = views.some((item) => item.value === chosen) ? chosen : (views[0]?.value ?? "entries");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Organizer tools" value={view} onChange={setView} options={views.map(({ value, label }) => ({ value, label }))} />
        {ladder.viewer.role && ladder.viewer.role !== "owner" && (
          <span className="type-label rounded-full bg-lavender-400/12 px-2.5 py-1 text-lavender-200 ring-1 ring-inset ring-lavender-400/30">You're a {ladder.viewer.role}</span>
        )}
      </div>
      {view === "entries" ? (
        <Entries ladder={ladder} />
      ) : view === "groups" ? (
        <Groups ladder={ladder} />
      ) : view === "updates" ? (
        <Updates ladder={ladder} />
      ) : view === "staff" ? (
        <Staff ladder={ladder} />
      ) : (
        <LadderSettings ladder={ladder} />
      )}
    </div>
  );
}
