import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { EligibleLineupMember } from "../types";

export function LineupPicker({
  members,
  selected,
  unavailablePlayerIds = [],
  required,
  onChange,
  disabled,
  loading,
  error,
}: {
  members: EligibleLineupMember[];
  selected: string[];
  unavailablePlayerIds?: string[];
  required: number;
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const available = members.filter((member) => !unavailablePlayerIds.includes(member.playerId)).length;
  const full = selected.length >= required;
  const toggle = (playerId: string) => {
    if (selected.includes(playerId)) onChange(selected.filter((id) => id !== playerId));
    else if (!full && !unavailablePlayerIds.includes(playerId)) onChange([...selected, playerId]);
  };

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 flex w-full items-center justify-between gap-3 text-sm font-medium text-mist-200">
        Match lineup
        <span className={cn("type-label tabular-nums", selected.length === required ? "text-lavender-300" : "text-mist-500")}>
          {selected.length} / {required} picked
        </span>
      </legend>
      {loading ? (
        <p className="text-sm text-mist-500">Loading your roster…</p>
      ) : members.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {members.map((member) => {
            const active = selected.includes(member.playerId);
            const taken = unavailablePlayerIds.includes(member.playerId);
            return (
              <button
                key={member.playerId}
                type="button"
                aria-pressed={active}
                disabled={disabled || taken || (!active && full)}
                onClick={() => toggle(member.playerId)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow] duration-200 disabled:cursor-not-allowed",
                  active
                    ? "bg-lavender-400/12 ring-lavender-400/70"
                    : "bg-white/4 ring-white/10 enabled:hover:bg-white/7 disabled:opacity-45",
                )}
              >
                <Avatar src={member.profileImage ?? undefined} name={member.username} size="sm" className="rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{member.username}</span>
                  <span className="block truncate text-xs text-mist-500">
                    {taken ? "Picked by the other team" : member.title || (member.role === "owner" ? "Owner" : "Member")}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                    active ? "bg-lavender-400 text-ink-950 ring-lavender-400" : "ring-white/20",
                  )}
                >
                  {active && <Icon name="check" weight="bold" className="size-3" />}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-mist-500">No active roster members are available.</p>
      )}
      {!loading && members.length > 0 && available < required && (
        <p className="text-sm text-mist-400">
          Only {available} of your players can be picked. Add members to the team to field {required}.
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[0.8rem] text-danger">
          <Icon name="warning" className="size-3.5" weight="bold" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
