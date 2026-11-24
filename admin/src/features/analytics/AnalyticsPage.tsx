import { useQuery } from "@tanstack/react-query";
import { Panel } from "@/components/layout/Panel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { getApiErrorMessage } from "@/lib/errors";
import { figure } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { analyticsKey, getPostAnalytics, getRetentionAnalytics } from "./api";
import { ContentActivityChart } from "./components/ContentActivityChart";
import type { AnalyticsRange, PostAnalytics, RetentionAnalytics } from "./types";

const DEFAULTS = { period: "30d" };
const PERIODS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];
const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

function Figures({ items, period }: { items: { label: string; count: number; detail?: string }[]; period: string }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/6 ring-1 ring-inset ring-white/6 lg:grid-cols-4">
      {items.map(({ label, count, detail }) => (
        <div key={label} className="min-w-0 bg-ink-900 px-5 py-4">
          <dt className="type-label text-[0.6rem] text-mist-500">{label}</dt>
          <dd className="mt-2.5 text-[1.45rem] font-semibold leading-none tabular-nums">{figure(count)}</dd>
          <dd className="mt-1.5 text-xs text-mist-400">{period}{detail && ` · ${detail}`}</dd>
        </div>
      ))}
    </dl>
  );
}

function ContentPanels({ data, period, range }: { data: PostAnalytics; period: string; range: AnalyticsRange }) {
  const accounts = data.regionalData.reduce((sum, region) => sum + region.value, 0);
  const withRegion = accounts - (data.regionalData.find((region) => region.region === "Not provided")?.value ?? 0);
  return (
    <>
      <Figures period={period} items={[
        { label: "Posts published", count: data.contentActivity.reduce((sum, point) => sum + point.posts, 0) },
        { label: "Post interactions", count: data.totalInteractions },
        { label: "Contributors", count: data.activeUsers, detail: "Posted or commented" },
        { label: "Flagged content", count: data.flaggedContent, detail: "Posts and comments" },
      ]} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <ContentActivityChart rows={data.contentActivity} view="posts" period={period} hourly={range === "24h"} />
        <ContentActivityChart rows={data.contentActivity} view="interactions" period={period} hourly={range === "24h"} />
        <Panel title="Registered accounts by region" description="All registered accounts.">
          {accounts > 0 ? (
            <>
              <p className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl font-semibold tabular-nums">{percent.format(withRegion / accounts)}</span>
                <span className="text-sm text-mist-400">with a region ({figure(withRegion)} of {figure(accounts)})</span>
              </p>
              <ul className="max-h-56 divide-y divide-white/6 overflow-y-auto">
                {data.regionalData.map(({ region, value }) => (
                  <li key={region} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="wrap-anywhere text-mist-300">{region}</span>
                    <span className="tabular-nums">{figure(value)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-sm text-mist-400">No registered accounts.</p>}
          <p className="mt-4 text-sm text-mist-400"><span className="font-semibold tabular-nums text-mist-50">{figure(data.regionAdditions)}</span> region additions · {period}</p>
        </Panel>
        <Panel title="Most used post tags" description="All time.">
          {data.topHashtags.length ? (
            <ul className="divide-y divide-white/6">
              {data.topHashtags.map(({ tag, count }) => (
                <li key={tag} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span className="wrap-anywhere text-mist-300">#{tag}</span>
                  <span className="tabular-nums">{figure(count)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-mist-400">No post tags yet.</p>}
        </Panel>
      </div>
    </>
  );
}

function RetentionPanel({ data, period }: { data: RetentionAnalytics; period: string }) {
  return (
    <Panel title="Progression and notifications" bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Figures period={period} items={[
        { label: "Players recording matches", count: data.playersRecordingMatches },
        { label: "Level-ups", count: data.levelUps },
        { label: "Streak updates", count: data.streakUpdates },
        { label: "Player card shares", count: data.playerCardShares, detail: data.sharePrompts ? `${data.shareConversionRate}% of ${figure(data.sharePrompts)} prompts` : undefined },
        { label: "Notifications queued", count: data.notificationsQueued },
        { label: "Notifications delivered", count: data.notificationsDelivered },
        { label: "Notifications opened", count: data.notificationsOpened, detail: data.notificationsDelivered ? `${data.notificationOpenRate}% open rate` : undefined },
        { label: "Notifications withheld", count: data.notificationsOptedOut + data.notificationsCapped, detail: `${figure(data.notificationsOptedOut)} opted out · ${figure(data.notificationsCapped)} capped` },
      ]} />
    </Panel>
  );
}

export function AnalyticsPage() {
  useDocumentTitle("Analytics");
  const [state, set] = useQueryState(DEFAULTS);
  const selected = PERIODS.find(({ value }) => value === state.period) ?? PERIODS[2];
  const range = selected.value;
  const period = `Last ${selected.label}`;
  const content = useQuery({ queryKey: [...analyticsKey, "content", range], queryFn: () => getPostAnalytics(range) });
  const retention = useQuery({ queryKey: [...analyticsKey, "retention", range], queryFn: () => getRetentionAnalytics(range) });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Analytics" refresh={[analyticsKey]} />
      <Segmented label="Reporting period" className="w-fit" options={PERIODS} value={range} onChange={(next) => set({ period: next })} />
      {content.isError ? (
        <StatePanel icon="warning" tone="danger" title="Content analytics didn't load" description={getApiErrorMessage(content.error, "Try again in a moment.")} action={<Button tone="outline" size="sm" icon="refresh" onClick={() => void content.refetch()}>Try again</Button>} />
      ) : content.data ? (
        <ContentPanels data={content.data} period={period} range={range} />
      ) : <Skeleton className="h-72 rounded-card" />}
      {retention.isError ? (
        <StatePanel icon="warning" tone="danger" title="Progression analytics didn't load" description={getApiErrorMessage(retention.error, "Try again in a moment.")} action={<Button tone="outline" size="sm" icon="refresh" onClick={() => void retention.refetch()}>Try again</Button>} />
      ) : retention.data ? (
        <RetentionPanel data={retention.data} period={period} />
      ) : <Skeleton className="h-56 rounded-card" />}
    </div>
  );
}
