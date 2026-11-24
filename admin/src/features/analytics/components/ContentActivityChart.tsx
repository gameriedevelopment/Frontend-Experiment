import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Panel } from "@/components/layout/Panel";
import { figure } from "@/lib/format";
import type { ContentActivityPoint } from "../types";

const series = {
  posts: [{ key: "posts", label: "Posts", color: "#c6a3ff" }],
  interactions: [
    { key: "likes", label: "Reactions", color: "#c6a3ff" },
    { key: "comments", label: "Comments", color: "#8967bd" },
  ],
} as const;
const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const hourLabel = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const tick = { fill: "#8e869b", fontSize: 11, fontFamily: "Geist Mono Variable" };

type ChartView = keyof typeof series;

function ChartTooltip({ active, payload, view, hourly }: TooltipProps<number, string> & { view: ChartView; hourly: boolean }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ContentActivityPoint;
  const date = new Date(row.date);
  return (
    <div className="min-w-40 rounded-xl bg-ink-800 px-3.5 py-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
      <p className="type-label text-mist-500">{dayLabel.format(date)}{hourly && ` · ${hourLabel.format(date)} UTC`}</p>
      <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-1 text-sm">
        {series[view].map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <span className="text-mist-300">{label}</span>
            <span className="tabular-nums">{figure(row[key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContentActivityChart({ rows, view, period, hourly }: {
  rows: ContentActivityPoint[];
  view: ChartView;
  period: string;
  hourly: boolean;
}) {
  const interactions = view === "interactions";
  const description = `${period}, by ${hourly ? "hour" : "day"} (UTC). ${interactions ? "Reactions and comments on posts published in this period." : ""}`.trim();
  const hasActivity = rows.some((row) => series[view].some(({ key }) => row[key] > 0));
  return (
    <Panel title={interactions ? "Post interactions" : "Publishing activity"} description={description}>
      {hasActivity ? (
        <>
          {interactions && (
            <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist-400">
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#c6a3ff]" />Reactions</li>
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#8967bd]" />Comments</li>
            </ul>
          )}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 24, bottom: 0, left: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.06)" />
                <XAxis dataKey="date" tickFormatter={(date: string) => (hourly ? hourLabel : dayLabel).format(new Date(date))} minTickGap={24} tickLine={false} axisLine={false} tick={tick} dy={8} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={figure} tick={tick} />
                <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<ChartTooltip view={view} hourly={hourly} />} />
                {series[view].map(({ key, color }, index) => (
                  <Bar key={key} dataKey={key} stackId={view} fill={color} radius={index === series[view].length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="py-16 text-center text-sm text-mist-400">{interactions ? "No interactions on these posts." : "No posts in this period."}</p>
      )}
    </Panel>
  );
}
