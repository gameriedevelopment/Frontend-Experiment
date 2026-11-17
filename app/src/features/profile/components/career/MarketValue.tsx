import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useRecalculateSalary, useSalaryHistory, useSalaryInsights } from "../../hooks";
import type { PlayerProfile, SalaryHistoryItem } from "../../types";

const suggestionRoutes: Array<[RegExp, (username: string) => string]> = [
  [/competitive matches/i, () => "/challenges/new"],
  [/tournament history/i, () => "#tournament-history"],
  [/skills/i, () => "?tab=career&edit=skills"],
  [/endorsements/i, (username) => `/card/${encodeURIComponent(username)}`],
  [/achievements/i, () => "?tab=achievements"],
  [/personal information/i, () => "?tab=career&edit=personal"],
  [/social media/i, () => "?tab=career&edit=links"],
  [/audience reach/i, () => "/feed"],
];

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

function parseSuggestion(text: string, username: string) {
  const [label, detail = ""] = text.split(/\s*→\s*/);
  return {
    label,
    gain: detail.match(/[+-]?\$[\d,]+/)?.[0] ?? null,
    to: suggestionRoutes.find(([pattern]) => pattern.test(label))?.[1](username) ?? null,
  };
}

function RangeBar({ min, max, estimate, confidence, currency }: { min: number; max: number; estimate: number; confidence: number; currency: string }) {
  const position = max > min ? Math.min(100, Math.max(0, ((estimate - min) / (max - min)) * 100)) : 50;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-label text-mist-500">Range</span>
        <span className="text-xs text-mist-400">{Math.round(confidence)}% confidence</span>
      </div>
      <div className="relative mt-4 h-2 rounded-full bg-linear-to-r from-lavender-400/15 via-lavender-400/45 to-lavender-400/15">
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender-300 ring-4 ring-ink-900"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm tabular-nums text-mist-300">
        <span>{formatMoney(min, currency)}</span>
        <span>{formatMoney(max, currency)}</span>
      </div>
    </div>
  );
}

function History({ items, currency }: { items: SalaryHistoryItem[]; currency: string }) {
  const points = [...items].sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime()).slice(-12);
  const peak = Math.max(...points.map((point) => point.estimate), 1);
  const delta = points.length > 1 ? points[points.length - 1].estimate - points[points.length - 2].estimate : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="type-label text-mist-500">Recent estimates</h3>
        {delta !== 0 && (
          <span className={cn("text-xs tabular-nums", delta > 0 ? "text-lavender-200" : "text-mist-400")}>
            {delta > 0 ? "+" : "−"}
            {formatMoney(Math.abs(delta), currency)} since last
          </span>
        )}
      </div>
      <div className="mt-4 flex h-24 items-end gap-1.5">
        {points.map((point, index) => (
          <span
            key={point.id}
            title={`${new Date(point.calculatedAt).toLocaleDateString()}: ${formatMoney(point.estimate, currency)}`}
            className={cn("flex-1 rounded-t-md transition-colors", index === points.length - 1 ? "bg-lavender-400" : "bg-white/10 hover:bg-white/20")}
            style={{ height: `${Math.max(10, (point.estimate / peak) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function MarketValue({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = useSalaryInsights(profile.id, true);
  const history = useSalaryHistory(profile.id, own);
  const recalculate = useRecalculateSalary(profile.id);

  if (query.isLoading) return <Skeleton className="h-80 rounded-card" />;
  if (query.isError || !query.data)
    return (
      <section className="rounded-card bg-ink-900/60 p-6 ring-1 ring-inset ring-white/6 sm:p-7">
        <h2 className="text-base font-semibold">Market value</h2>
        <p className="mt-2 text-sm text-mist-400">{getApiErrorMessage(query.error, "The estimate couldn't be calculated right now.")}</p>
        <Button tone="outline" size="sm" icon="refresh" className="mt-4" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </section>
    );

  const salary = query.data;
  const currency = salary.currency || "USD";
  const factors = [...(salary.components ?? [])].sort((a, b) => b.contributionUSD - a.contributionUSD).slice(0, 6);
  const percentile = salary.benchmarks?.percentile;
  const suggestions = own ? (salary.improvementSuggestions ?? []).slice(0, 4).map((text) => parseSuggestion(text, profile.username)) : [];
  const showHistory = own && (history.data?.length ?? 0) > 1;

  const refresh = () =>
    recalculate.mutate(undefined, {
      onSuccess: (next) => toast.success("Estimate refreshed", `${formatMoney(next.estimate, next.currency || currency)} a month`),
      onError: (error) => toast.error("Couldn't refresh the estimate", getApiErrorMessage(error, "Try again in a moment.")),
    });

  return (
    <section aria-labelledby="market-value" className="relative overflow-hidden rounded-card bg-ink-900 ring-1 ring-inset ring-white/8">
      <div className="halftone absolute inset-0 text-lavender-400/8 mask-[radial-gradient(55%_80%_at_100%_0%,black,transparent)]" />
      <div className="relative p-6 sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="market-value" className="text-base font-semibold">
              Market value
            </h2>
            <p className="mt-1 text-sm text-mist-400">An estimated monthly benchmark from profile signals, not a salary offer.</p>
          </div>
          {own && (
            <Button tone="ghost" size="sm" icon="refresh" className="-mr-3" disabled={recalculate.isPending} onClick={refresh}>
              {recalculate.isPending ? "Refreshing…" : "Refresh"}
            </Button>
          )}
        </header>

        <div className="mt-7 grid gap-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:items-end sm:gap-10">
          <div>
            <p className="type-label text-mist-500">Per month</p>
            <p className="type-display mt-2 text-[2.75rem] leading-none tabular-nums">{formatMoney(salary.estimate, currency)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Tag tone="lavender">{salary.tier || "Player"} tier</Tag>
              {percentile != null && percentile > 0 && <Tag>Top {Math.max(1, 100 - Math.round(percentile))}%</Tag>}
              {salary.isVerified && (
                <Tag tone="signal" dot>
                  Verified signals
                </Tag>
              )}
            </div>
          </div>
          <RangeBar min={salary.min} max={salary.max} estimate={salary.estimate} confidence={salary.confidenceScore} currency={currency} />
        </div>

        {factors.length > 0 && (
          <div className="mt-8 border-t border-white/6 pt-6">
            <h3 className="type-label text-mist-500">What drives it</h3>
            <ul className="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {factors.map((factor) => (
                <li key={factor.factor}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-mist-200">{factor.factor}</span>
                    <span className="shrink-0 tabular-nums text-mist-400">{Math.round(factor.normalizedScore)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/6">
                    <div className="h-full rounded-full bg-lavender-400/80" style={{ width: `${Math.min(100, Math.max(2, factor.normalizedScore))}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(showHistory || suggestions.length > 0) && (
          <div className={cn("mt-8 grid gap-8 border-t border-white/6 pt-6", showHistory && suggestions.length > 0 && "lg:grid-cols-2 lg:gap-10")}>
            {showHistory && <History items={history.data!} currency={currency} />}
            {suggestions.length > 0 && (
              <div>
                <h3 className="type-label text-mist-500">Raise your value</h3>
                <ul className="mt-3 grid gap-1">
                  {suggestions.map((item) => {
                    const body = (
                      <>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lavender-400/12 text-lavender-300">
                          <Icon name="trendUp" className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm text-mist-200">{item.label}</span>
                        {item.gain && <span className="shrink-0 text-sm font-semibold tabular-nums text-lavender-200">{item.gain}</span>}
                      </>
                    );
                    const rowClass = "flex items-center gap-3 rounded-2xl px-2 py-2";
                    return (
                      <li key={item.label}>
                        {item.to?.startsWith("#") ? (
                          <a href={item.to} className={cn(rowClass, "transition-colors hover:bg-white/4")}>
                            {body}
                          </a>
                        ) : item.to ? (
                          <Link to={item.to} className={cn(rowClass, "transition-colors hover:bg-white/4")}>
                            {body}
                          </Link>
                        ) : (
                          <div className={rowClass}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {salary.lastCalculated && <p className="mt-6 text-xs text-mist-500">Updated {timeAgo(salary.lastCalculated)}</p>}
      </div>
    </section>
  );
}
