import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { PlayerProfile } from "@/features/profile/types";
import type { ProgressionGuide } from "@/features/progression/types";
import { useGpGuide } from "@/features/progression/guideStore";
import { PanelError } from "./HomePanel";

export function LevelCard({
  profile,
  className,
  guide,
  loading,
  failed,
  onRetry,
  setup,
}: {
  profile: Pick<PlayerProfile, "username" | "profileImage" | "gamerieId">;
  guide?: ProgressionGuide;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  /** Shown when the player hid an unfinished setup list, so it can be brought back. */
  setup?: { done: number; total: number; onResume: () => void };
  className?: string;
}) {
  const openGuide = useGpGuide((state) => state.openGuide);
  const progression = guide?.progression;
  const percent = Math.min(100, Math.max(0, Math.round(progression?.progressPercent ?? 0)));
  const remaining = progression?.nextLevelGp != null ? Math.max(0, progression.nextLevelGp - progression.totalGp) : null;

  return (
    <section
      aria-label="Your level"
      className={cn("relative overflow-hidden rounded-card bg-ink-900 p-5 ring-1 ring-inset ring-white/8 sm:p-6", className)}
    >
      <div
        aria-hidden="true"
        className="halftone absolute inset-0 text-lavender-400/10 mask-[radial-gradient(80%_70%_at_100%_0%,black,transparent)]"
      />
      <div className="relative">
        <Link to={`/profile/${encodeURIComponent(profile.username)}`} className="group flex items-center gap-3">
          <Avatar src={profile.profileImage} name={profile.username} size="md" className="rounded-full" />
          <span className="min-w-0">
            <span className="block truncate font-semibold transition-colors group-hover:text-lavender-200">
              {profile.username}
            </span>
            <span className="type-label block truncate text-mist-500">{profile.gamerieId || "Your profile"}</span>
          </span>
        </Link>

        <div className="mt-7">
          {loading ? (
            <div aria-hidden="true" className="grid gap-3">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-1.5 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </div>
          ) : failed || !progression ? (
            <PanelError onRetry={onRetry} />
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <p>
                  <span className="type-label block text-mist-500">Level {progression.level}</span>
                  <span className="type-display mt-2 block text-[2rem] leading-none tabular-nums">
                    {progression.totalGp.toLocaleString()}
                    <span className="ml-1.5 text-base text-lavender-300">GP</span>
                  </span>
                </p>
                {progression.nextLevel != null && (
                  <span className="type-label pb-1 text-mist-500">Level {progression.nextLevel}</span>
                )}
              </div>
              <div
                role="progressbar"
                aria-label={`Progress to level ${progression.nextLevel ?? progression.level}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8"
              >
                <div
                  className="h-full rounded-full bg-lavender-400 transition-[width] duration-700 ease-out-expo"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-mist-400">
                {remaining != null
                  ? `${remaining.toLocaleString()} GP to level ${progression.nextLevel}`
                  : "You've reached the top level."}
              </p>
            </>
          )}
        </div>

        {setup && (
          <button
            type="button"
            onClick={setup.onResume}
            className="group mt-6 flex w-full items-center gap-4 rounded-2xl bg-white/3 px-4 py-3.5 text-left ring-1 ring-inset ring-white/6 transition-[box-shadow,background-color] duration-300 hover:bg-white/5 hover:ring-lavender-400/25"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Finish your player ID</span>
              <span aria-hidden="true" className="mt-2.5 flex gap-1">
                {Array.from({ length: setup.total }, (_, index) => (
                  <span
                    key={index}
                    className={cn("h-1 flex-1 rounded-full", index < setup.done ? "bg-lavender-400" : "bg-white/10")}
                  />
                ))}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-lavender-300 group-hover:text-lavender-200">
              {setup.done} of {setup.total}
              <span className="sr-only"> done. Show setup</span>
            </span>
          </button>
        )}

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/6 pt-4 text-sm font-medium">
          <button
            type="button"
            onClick={openGuide}
            disabled={!guide}
            aria-haspopup="dialog"
            className="text-lavender-300 transition-colors hover:text-lavender-200 disabled:text-mist-500"
          >
            Ways to earn GP
          </button>
          <Link
            to={`/card/${encodeURIComponent(profile.username)}`}
            className="text-mist-400 transition-colors hover:text-mist-50"
          >
            Your Player Card
          </Link>
        </div>
      </div>
    </section>
  );
}
