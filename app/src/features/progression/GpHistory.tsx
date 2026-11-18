import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useGpGuide } from "./guideStore";
import { useProgressionHistory } from "./hooks";

const day = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

/** Where a player's GP came from: a split by kind of activity, then every award in order. */
export function GpHistory() {
  const query = useProgressionHistory();
  const openGuide = useGpGuide((state) => state.openGuide);
  const first = query.data?.pages[0];
  const entries = query.data?.pages.flatMap((page) => page.entries) ?? [];
  const top = Math.max(1, ...(first?.bySection.map((item) => item.gp) ?? [1]));

  return (
    <section aria-labelledby="gp-history" className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="gp-history" className="text-base font-semibold">
            How you earned your GP
          </h2>
          <p className="mt-1 text-sm text-mist-400">Every award on your record. Only you can see this.</p>
        </div>
        <button type="button" onClick={() => openGuide()} className="text-sm font-medium text-lavender-300 hover:text-lavender-200">
          How GP works
        </button>
      </header>

      {query.isLoading ? (
        <Skeleton className="mt-6 h-48 rounded-2xl" />
      ) : query.isError ? (
        <p role="alert" className="mt-6 text-sm text-danger">
          {getApiErrorMessage(query.error, "Your GP history didn't load. Try again in a moment.")}
        </p>
      ) : !entries.length ? (
        <p className="mt-6 text-sm text-mist-400">No GP yet. Complete your profile, play recorded matches or join a team to start earning.</p>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            {first!.bySection.map((item) => (
              <div key={item.section}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-mist-200">{item.section}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{item.gp.toLocaleString()} GP</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-lavender-400" style={{ width: `${Math.round((item.gp / top) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-mist-500">
                  {item.count} {item.count === 1 ? "award" : "awards"}
                </p>
              </div>
            ))}
          </div>
          <div className="grid content-start gap-3">
            <ol className="grid grid-cols-[minmax(0,1fr)]">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 border-t border-white/6 py-3 first:border-t-0 first:pt-0">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", entry.levelUp ? "bg-signal/12 text-signal" : "bg-lavender-400/10 text-lavender-300")}>
                    <Icon name={entry.levelUp ? "crown" : "spark"} weight="fill" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{entry.label}</span>
                    <span className="block truncate text-xs text-mist-500">
                      {entry.section} · {day.format(new Date(entry.awardedAt))}
                      {entry.levelUp ? ` · reached level ${entry.levelUp}` : ""}
                      {entry.capped ? ` · limit reached${entry.ruleAmount != null ? `, usually ${entry.ruleAmount} GP` : ""}` : ""}
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-sm font-semibold tabular-nums", entry.gpAmount > 0 ? "text-lavender-200" : "text-mist-500")}>
                    {entry.gpAmount > 0 ? "+" : ""}
                    {entry.gpAmount}
                  </span>
                </li>
              ))}
            </ol>
            {query.hasNextPage && (
              <Button tone="outline" size="sm" className="w-fit" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Loading…" : "Show older awards"}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
