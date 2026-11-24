import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/layout/Panel";
import { getApiErrorMessage } from "@/lib/errors";
import { figure } from "@/lib/format";
import { useGrowth } from "../hooks";
import type { GrowthPoint } from "../types";

type Series = "users" | "newUsers" | "activeUsers";

const SERIES: Array<{ value: Series; label: string }> = [
  { value: "users", label: "Total" },
  { value: "newUsers", label: "New" },
  { value: "activeUsers", label: "Active" },
];

const LAVENDER = "#c6a3ff";

function ChartTooltip({ active, payload, label, series }: TooltipProps<number, string> & { series: Series }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as GrowthPoint;
  return (
    <div className="rounded-xl bg-ink-800 px-3.5 py-2.5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
      <p className="type-label text-mist-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums">{figure(point[series])}</p>
      <p className="text-xs text-mist-400">{SERIES.find((item) => item.value === series)?.label} players</p>
    </div>
  );
}

export function GrowthChart() {
  const growth = useGrowth();
  const [series, setSeries] = useState<Series>("users");
  const data = growth.data ?? [];
  const latest = data.at(-1);

  return (
    <Panel
      title="Player growth"
      description="This year, by month."
      actions={<Segmented label="Series" value={series} onChange={setSeries} options={SERIES} />}
    >
      {growth.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : growth.isError ? (
        <p className="py-16 text-center text-sm text-mist-400">{getApiErrorMessage(growth.error, "Growth figures didn't load.")}</p>
      ) : (
        <>
          {latest && (
            <p className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{figure(latest[series])}</span>
              <span className="type-label text-mist-500">{latest.name}</span>
            </p>
          )}
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LAVENDER} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={LAVENDER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.06)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#8e869b", fontSize: 11, fontFamily: "Geist Mono Variable" }} dy={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  allowDecimals={false}
                  tickFormatter={(value: number) => figure(value)}
                  tick={{ fill: "#8e869b", fontSize: 11, fontFamily: "Geist Mono Variable" }}
                />
                <Tooltip cursor={{ stroke: "rgb(255 255 255 / 0.18)" }} content={<ChartTooltip series={series} />} />
                <Area type="monotone" dataKey={series} stroke={LAVENDER} strokeWidth={2} fill="url(#growth-fill)" activeDot={{ r: 4, fill: LAVENDER, stroke: "#0a0710", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}
