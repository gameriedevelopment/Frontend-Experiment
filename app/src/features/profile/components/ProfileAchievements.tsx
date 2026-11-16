import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SkeletonText } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useAchievements, useClaimAchievement } from "../hooks";
import type { PlayerProfile } from "../types";
import { ProfileSection } from "./ProfileSection";

export function ProfileAchievements({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = useAchievements(profile.id);
  const claim = useClaimAchievement(profile.id);

  if (query.isLoading)
    return (
      <ProfileSection title="Achievements">
        <SkeletonText lines={4} />
      </ProfileSection>
    );

  if (query.isError)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="Achievements could not load"
        description={getApiErrorMessage(query.error, "Please try again in a moment.")}
        action={
          <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );

  const data = query.data;
  const achievements = data?.achievements ?? [];
  const completion = data?.totalCount ? Math.round((data.completedCount / data.totalCount) * 100) : 0;

  return (
    <div className="grid gap-4">
      <dl className="grid grid-cols-3 divide-x divide-white/6 rounded-card bg-ink-900/60 py-5 ring-1 ring-inset ring-white/6">
        {[
          ["Completed", `${data?.completedCount ?? 0} / ${data?.totalCount ?? 0}`],
          ["Reward points", (data?.totalPoints ?? 0).toLocaleString()],
          ["Completion", `${completion}%`],
        ].map(([label, value]) => (
          <div key={label} className="px-5 sm:px-7">
            <dd className="type-display text-xl tabular-nums">{value}</dd>
            <dt className="mt-1.5 text-xs text-mist-400">{label}</dt>
          </div>
        ))}
      </dl>

      {achievements.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <li
              key={achievement.id}
              className={cn(
                "flex flex-col gap-4 rounded-card p-5 ring-1 ring-inset",
                achievement.completed ? "bg-ink-900/80 ring-lavender-400/20" : "bg-ink-900/40 ring-white/6",
              )}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    achievement.completed ? "bg-lavender-400/12 text-lavender-300" : "bg-white/5 text-mist-500",
                  )}
                >
                  <Icon name={achievement.completed ? "trophy" : "lock"} className="size-5" weight="duotone" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-mist-500">{achievement.category}</p>
                  <p className="mt-0.5 text-sm font-semibold">{achievement.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mist-400">{achievement.description}</p>
                </div>
              </div>
              {achievement.progress && !achievement.completed && (
                <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-lavender-400"
                      style={{ width: `${Math.min(100, achievement.progress.percentage)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-mist-500">
                    {achievement.progress.current} / {achievement.progress.required}
                  </span>
                </div>
              )}
              <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3.5 text-xs">
                <span className="font-semibold text-mist-300">{achievement.points} points</span>
                {own && achievement.completed && !achievement.rewardsClaimed ? (
                  <button
                    type="button"
                    disabled={claim.isPending}
                    onClick={() => claim.mutate(achievement.id)}
                    className="font-semibold text-lavender-300 hover:text-lavender-200 disabled:opacity-60"
                  >
                    {claim.isPending ? "Claiming" : "Claim reward"}
                  </button>
                ) : (
                  <span className={achievement.completed ? "text-signal" : "text-mist-500"}>
                    {achievement.rewardsClaimed ? "Claimed" : achievement.completed ? "Completed" : "In progress"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <StatePanel icon="trophy" title="No achievements yet" description="Achievements earned across Gamerie collect here." />
      )}
      {claim.isError && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(claim.error, "The reward could not be claimed.")}
        </p>
      )}
    </div>
  );
}
