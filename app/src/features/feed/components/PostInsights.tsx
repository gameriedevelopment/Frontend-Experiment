import { Icon, type IconName } from "@/components/ui/Icon";
import { getPostEngagementRate, getPostReach, getPostViews } from "../metrics";
import type { FeedPost } from "../types";

const formatMetric = (value: number) =>
  new Intl.NumberFormat(undefined, { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);

/** How a post is doing. Only its author sees this. */
export function PostInsights({ post }: { post: FeedPost }) {
  const views = getPostViews(post);
  const reach = getPostReach(post);
  const engagement = getPostEngagementRate(post);
  const metrics: Array<[string, string, IconName]> = [
    ["Views", formatMetric(views), "eye"],
    ["Reach", formatMetric(reach), "people"],
  ];

  return (
    <section aria-labelledby="post-insights" className="relative overflow-hidden rounded-card bg-ink-900 p-5 ring-1 ring-inset ring-white/8">
      <div className="halftone absolute inset-0 text-lavender-400/8 mask-[radial-gradient(70%_90%_at_100%_0%,black,transparent)]" />
      <header className="relative flex items-baseline justify-between gap-3">
        <h2 id="post-insights" className="text-base font-semibold">
          Post performance
        </h2>
        <span className="text-xs text-mist-500">Only you see this</span>
      </header>
      <dl className="relative mt-5 grid grid-cols-2 gap-4">
        {metrics.map(([label, value, icon]) => (
          <div key={label}>
            <dt className="type-label flex items-center gap-1.5 text-mist-500">
              <Icon name={icon} className="size-3.5" />
              {label}
            </dt>
            <dd className="type-display mt-2 text-[1.75rem] leading-none tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/6 pt-4 text-sm">
        <span className="flex items-center gap-2 text-mist-400">
          <Icon name="trendUp" className="size-4 text-lavender-300" />
          Engagement rate
        </span>
        <span className="font-semibold tabular-nums">{engagement.toFixed(1)}%</span>
      </div>
      {!views && <p className="relative mt-4 text-xs text-mist-500">Numbers fill in as people see your post.</p>}
    </section>
  );
}
