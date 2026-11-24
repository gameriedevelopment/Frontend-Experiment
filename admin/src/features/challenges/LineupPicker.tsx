import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { getEligibleLineup } from "./api";

/** Pick exactly `size` active members of a team to play. */
export function LineupPicker({
  teamId,
  teamName,
  size,
  value,
  onChange,
  disabled,
}: {
  teamId: string;
  teamName: string;
  size: number;
  value: string[];
  onChange: (playerIds: string[]) => void;
  disabled?: boolean;
}) {
  const members = useQuery({ queryKey: ["admin", "challenges", "lineup", teamId], queryFn: () => getEligibleLineup(teamId), staleTime: 60_000 });
  const full = value.length >= size;
  return (
    <fieldset className="grid min-w-0 gap-3" disabled={disabled}>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm font-medium text-mist-200">
        <span className="truncate">{teamName}</span>
        <span className={cn("shrink-0 font-mono text-xs", value.length === size ? "text-signal" : "text-mist-500")}>
          {value.length} of {size}
        </span>
      </legend>
      {members.isLoading ? (
        <div className="grid gap-2">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
        </div>
      ) : members.isError ? (
        <p className="text-sm text-danger">The roster didn't load. Refresh to try again.</p>
      ) : (members.data ?? []).length === 0 ? (
        <p className="text-sm text-mist-400">This team has no active members to pick.</p>
      ) : (
        <ul className="grid gap-2">
          {members.data!.map((member) => {
            const picked = value.includes(member.playerId);
            const blocked = !picked && full;
            return (
              <li key={member.playerId}>
                <label className={cn("relative block", blocked || disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={picked}
                    disabled={blocked || disabled}
                    onChange={() => onChange(picked ? value.filter((id) => id !== member.playerId) : [...value, member.playerId])}
                  />
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-inset transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400",
                      picked ? "bg-lavender-400/12 ring-lavender-400/60" : "bg-white/4 ring-white/10 hover:bg-white/7",
                    )}
                  >
                    <Avatar src={member.profileImage ?? undefined} name={member.username} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{member.username}</span>
                      <span className="block truncate font-mono text-[0.68rem] capitalize text-mist-500">{[member.role, member.gamerieId].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-md ring-1 ring-inset", picked ? "bg-lavender-400 text-ink-950 ring-lavender-400" : "ring-white/25")}>
                      {picked && <Icon name="check" weight="bold" className="size-3" />}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
