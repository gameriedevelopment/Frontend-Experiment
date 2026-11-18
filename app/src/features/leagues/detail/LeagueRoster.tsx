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
import { useLeagueActions, useLeagueRoster } from "../hooks";
import type { LeagueDetail, LeagueSeason } from "../types";

const pill = "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-mist-200 ring-1 ring-inset ring-white/10 hover:text-mist-50";

/** The team's lineup for this season. It locks at entry; leaders add new players up to the weekly allowance. */
export function LeagueRosterPanel({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const entry = league.viewer.entry!;
  const roster = useLeagueRoster(league.id, season.id, entry.id);
  const actions = useLeagueActions(league.id, season.id);
  const team = useCommunityDetail("team", entry.teamId ?? undefined);
  const [candidate, setCandidate] = useState<{ id: string; name: string } | null>(null);
  const [role, setRole] = useState<"player" | "substitute">("substitute");
  const data = roster.data;
  const open = ["registration", "in_progress", "playoffs"].includes(season.status);

  if (roster.isLoading) return <Skeleton className="h-48 rounded-card" />;
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
                disabled={actions.removeFromRoster.isPending}
                onClick={() =>
                  actions.removeFromRoster.mutate(
                    { participantId: entry.id, userId: member.userId },
                    { onSuccess: () => toast.info(`${member.displayName} left the roster`), onError: fail("Couldn't remove the player") },
                  )
                }
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>

      {data.canManage && open && (
        <div className="mt-5 border-t border-white/6 pt-5">
          {season.rosterChangesPerWeek === 0 && season.status !== "registration" ? (
            <p className="text-sm text-mist-400">This league doesn't allow roster additions once the season starts.</p>
          ) : waitUntil ? (
            <p className="flex items-start gap-2 text-sm text-mist-300">
              <Icon name="clock" className="mt-0.5 size-4 shrink-0 text-mist-500" />
              You've used this week's additions. The next one opens {waitUntil.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}.
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
                items={candidates.map((option) => ({ label: option.name, checked: candidate?.id === option.id, onSelect: () => setCandidate(option) }))}
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
                disabled={!candidate || actions.addToRoster.isPending}
                onClick={() =>
                  candidate &&
                  actions.addToRoster.mutate(
                    { participantId: entry.id, userId: candidate.id, role },
                    { onSuccess: () => (toast.success(`${candidate.name} added`), setCandidate(null)), onError: fail("Couldn't add the player") },
                  )
                }
              >
                Add
              </Button>
              <p className="w-full text-xs text-mist-500">
                {season.rosterChangesPerWeek} new {season.rosterChangesPerWeek === 1 ? "player" : "players"} a week once the season starts. Players can only be on one team in this league.
              </p>
            </div>
          ) : (
            <p className="text-sm text-mist-500">Everyone on your team is already on the roster.</p>
          )}
        </div>
      )}
    </section>
  );
}
