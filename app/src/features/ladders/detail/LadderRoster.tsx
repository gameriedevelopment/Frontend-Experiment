import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCommunityDetail } from "@/features/communities/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { playerPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { useLadderRoster } from "../hooks";
import type { LadderDetail } from "../types";

const pill =
  "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-mist-200 ring-1 ring-inset ring-white/10 hover:text-mist-50";

/**
 * The team's lineup for this ladder. It locks when the team joins; after that the leader can add one
 * new player a week and drop players while a full lineup remains.
 */
export function LadderRosterPanel({ ladder }: { ladder: LadderDetail }) {
  const entry = ladder.viewer.participant!;
  const roster = useLadderRoster(ladder.id, entry.id);
  const team = useCommunityDetail("team", entry.teamId ?? undefined);
  const [candidate, setCandidate] = useState<{ id: string; name: string } | null>(null);
  const [role, setRole] = useState<"player" | "substitute">("substitute");
  const data = roster.query.data;
  const open = ["upcoming", "in_progress"].includes(ladder.status);

  if (roster.query.isLoading) return <Skeleton className="h-48 rounded-card" />;
  if (!data) return null;

  const onRoster = new Set(data.members.map((member) => member.userId));
  const candidates = (team.data?.members ?? [])
    .filter((member) => member.isActive !== false && member.user?.id && !onRoster.has(member.user.id))
    .map((member) => ({ id: member.user!.id, name: member.user!.displayName || member.user!.username || "Player" }));
  const players = data.members.filter((member) => member.role === "player").length;
  const substitutes = data.members.length - players;
  const waitUntil = data.nextAdditionAt && new Date(data.nextAdditionAt) > new Date() ? new Date(data.nextAdditionAt) : null;
  const fail = (title: string) => (error: unknown) => toast.error(title, getApiErrorMessage(error, "Try again in a moment."));

  return (
    <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Your roster</h2>
        <p className="text-xs text-mist-500">
          {players} of {data.teamSize ?? players} players · {substitutes} of {data.substitutes} substitutes
        </p>
      </div>
      <ul className="grid gap-2">
        {data.members.map((member) => (
          <li key={member.userId} className="flex items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
            <EntrantLink to={playerPath(member.userId)} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={member.displayName} size="sm" className="rounded-full" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.displayName}</span>
            </EntrantLink>
            <span className="type-label rounded-full bg-white/6 px-2 py-0.5 text-mist-300">{member.role === "player" ? "Player" : "Substitute"}</span>
            {data.canManage && open && (member.role === "substitute" || players > (data.teamSize ?? 0) || substitutes > 0) && (
              <Button
                tone="ghost"
                size="sm"
                disabled={roster.remove.isPending}
                onClick={() => roster.remove.mutate(member.userId, { onSuccess: () => toast.info(`${member.displayName} left the roster`), onError: fail("Couldn't remove the player") })}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>

      {data.canManage && open && (
        <div className="mt-5 border-t border-white/6 pt-5">
          {waitUntil ? (
            <p className="flex items-start gap-2 text-sm text-mist-300">
              <Icon name="clock" className="mt-0.5 size-4 shrink-0 text-mist-500" />
              Teams add one new player a week. Your next addition opens{" "}
              {waitUntil.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}.
            </p>
          ) : candidates.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <Menu
                label="Choose a team member"
                align="start"
                triggerClassName={pill}
                trigger={
                  <>
                    {candidate?.name ?? "Choose a team member"}
                    <Icon name="chevronDown" className="size-3.5 text-mist-500" />
                  </>
                }
                items={candidates.map((option) => ({
                  label: option.name,
                  checked: candidate?.id === option.id,
                  onSelect: () => setCandidate(option),
                }))}
              />
              <Segmented
                label="Role"
                value={role}
                onChange={setRole}
                options={[
                  { value: "substitute", label: "Substitute" },
                  { value: "player", label: "Player" },
                ]}
              />
              <Button
                size="sm"
                icon="plus"
                disabled={!candidate || roster.add.isPending}
                onClick={() =>
                  candidate &&
                  roster.add.mutate(
                    { userId: candidate.id, role },
                    { onSuccess: () => (toast.success(`${candidate.name} added`), setCandidate(null)), onError: fail("Couldn't add the player") },
                  )
                }
              >
                Add
              </Button>
              <p className="w-full text-xs text-mist-500">The roster is locked once you join; you can add one new player a week.</p>
            </div>
          ) : (
            <p className="text-sm text-mist-500">Everyone on your team is already on the roster.</p>
          )}
        </div>
      )}
    </section>
  );
}
