import { CountUp, Reveal } from "@/components/ui/motion";
import { industryStats } from "../content/landing-content";

export function StatsBand() {
  return (
    <section aria-labelledby="stats-title" className="bg-lavender-400 px-gutter py-14 text-ink-950 sm:py-16">
      <div className="mx-auto max-w-shell">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="stats-title" className="type-label">
            The stage is already massive
          </h2>
          <p className="type-label text-ink-950/55">Public industry figures</p>
        </div>
        <Reveal>
          <dl className="mt-10 grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-ink-950/15">
            {industryStats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 lg:px-8 lg:first:pl-0">
                <dt className="max-w-[14rem] text-sm font-medium text-ink-950/70">{stat.label}</dt>
                <dd className="type-display order-first text-display-md">
                  <CountUp value={stat.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
