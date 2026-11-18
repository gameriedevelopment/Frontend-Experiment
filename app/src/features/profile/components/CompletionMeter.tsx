import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { playerPath } from "@/lib/paths";
import { getProfileCompletion } from "../profileCompletion";
import type { PlayerProfile } from "../types";

/** How complete a player's ID is and the next thing to add. Hidden once it's complete. */
export function CompletionMeter({ profile, className }: { profile: PlayerProfile; className?: string }) {
  const completion = getProfileCompletion(profile);
  const next = completion.missing[0];
  if (completion.score >= 100 || !next) return null;
  return (
    <aside
      aria-label={`Profile ${completion.score}% complete`}
      className={cn("flex flex-col gap-4 rounded-card bg-ink-900/70 p-5 ring-1 ring-inset ring-white/6 sm:flex-row sm:items-center sm:gap-6", className)}
    >
      <span className="type-display text-[1.6rem] leading-none text-lavender-300">{completion.score}%</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Your player ID is {completion.score}% complete</p>
        <p className="mt-0.5 text-sm text-mist-400">
          Next: {next.label}
          {completion.missing.length > 1 ? `, and ${completion.missing.length - 1} more` : ""}.
        </p>
        <div
          role="progressbar"
          aria-label="Profile completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion.score}
          className="mt-3 h-1 overflow-hidden rounded-full bg-white/8"
        >
          <div className="h-full rounded-full bg-lavender-400" style={{ width: `${completion.score}%` }} />
        </div>
      </div>
      <Link to={`${playerPath(profile.username || profile.id)}${next.route}`} className="shrink-0 text-sm font-semibold text-lavender-300 hover:text-lavender-200">
        {next.action}
      </Link>
    </aside>
  );
}
