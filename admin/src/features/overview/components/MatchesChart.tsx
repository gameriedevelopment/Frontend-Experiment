import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/layout/Panel";
import { getApiErrorMessage } from "@/lib/errors";
import { figure } from "@/lib/format";
import { useMatchesByWeek } from "../hooks";
import type { WeekOfMatches } from "../types";

const SERIES = [
  { key: "friendly", label: "Friendlies", color: "#b9b1c6" },
  { key: "tournament", label: "Tournaments", color: "#c6a3ff" },
  { key: "ladder", label: "Ladders", color: "#8967bd" },
  { key: "league", label: "Leagues", color: "#6b46a8" },
] as const;

const weekLabel = (week: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${week}T00:00:00`));
const total = (row: WeekOfMatches) => row.friendly + row.tournament + row.ladder + row.league;

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as WeekOfMatches;
  return (
    <div className="min-w-44 rounded-xl bg-ink-800 px-3.5 py-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
      <p className="type-label text-mist-500">Week of {weekLabel(row.week)}</p>
      <ul className="mt-2 grid gap-1 text-sm">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-mist-300">
              <span className="size-2 rounded-full" style={{ background: series.color }} />
              {series.label}
            </span>
            <span className="tabular-nums">{row[series.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Matches finished each week, so a drop in play shows up before it shows in sign-ups. */
export function MatchesChart() {
  const matches = useMatchesByWeek();
  const rows = matches.data ?? [];
  const thisWeek = rows.at(-1);
  const lastWeek = rows.at(-2);
  const change = thisWeek && lastWeek ? total(thisWeek) - total(lastWeek) : null;

  return (
    <Panel title="Matches played" description="Last 12 weeks, by where they were played.">
      {matches.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : matches.isError ? (
        <p className="py-16 text-center text-sm text-mist-400">{getApiErrorMessage(matches.error, "Match figures didn't load.")}</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{thisWeek ? figure(total(thisWeek)) : 0}</span>
              <span className="type-label text-mist-500">This week</span>
              {change !== null && change !== 0 && (
                <span className={change > 0 ? "font-mono text-xs text-signal" : "font-mono text-xs text-danger"}>
                  {change > 0 ? "+" : ""}
                  {change} vs last
                </span>
              )}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist-400">
              {SERIES.map((series) => (
                <li key={series.key} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: series.color }} />
                  {series.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.06)" />
                <XAxis dataKey="week" tickFormatter={weekLabel} tickLine={false} axisLine={false} interval={1} tick={{ fill: "#8e869b", fontSize: 11, fontFamily: "Geist Mono Variable" }} dy={8} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fill: "#8e869b", fontSize: 11, fontFamily: "Geist Mono Variable" }} />
                <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<ChartTooltip />} />
                {SERIES.map((series, index) => (
                  <Bar key={series.key} dataKey={series.key} stackId="matches" fill={series.color} radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}
