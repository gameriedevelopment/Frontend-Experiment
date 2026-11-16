import { motion, useInView } from "motion/react";
import { useRef, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { TokenMark } from "@/components/ui/TokenMark";

const highlights = [
  { value: "Top 8%", label: "Controller rank in Valorant" },
  { value: "+12%", label: "Clutch rate this month" },
  { value: "27", label: "Verified wins across 3 games" },
];

export function ProfileHighlights() {
  return (
    <dl className="grid gap-7 border-t border-white/8 pt-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/8">
      {highlights.map((highlight) => (
        <div key={highlight.label} className="flex flex-col gap-3 sm:px-7 sm:first:pl-0 sm:last:pr-0">
          <dt className="order-last text-sm leading-snug text-mist-400">{highlight.label}</dt>
          <dd className="type-display text-[2rem] leading-none">{highlight.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FitGauge({ value = 94 }: { value?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  return (
    <div className="relative mx-auto grid size-44 place-items-center">
      <svg ref={ref} viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="5" className="stroke-ink-950/10" />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-ink-950"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: inView ? value / 100 : 0 }}
          transition={{ duration: 2, ease: easeOutExpo }}
        />
      </svg>
      <div className="text-center">
        <p className="type-display text-[2.6rem] leading-none">{value}%</p>
        <p className="mt-2 text-sm text-ink-950/60">Squad fit</p>
      </div>
    </div>
  );
}

export function Scoreboard() {
  return (
    <div className="rounded-2xl bg-ink-950 p-5 text-mist-50">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TokenMark className="h-6 shrink-0 text-lavender-400" />
          <span className="truncate text-sm font-semibold">Lagos Lions</span>
        </div>
        <p className="type-display text-[1.75rem] leading-none">
          13<span className="mx-1.5 text-mist-500">:</span>
          <span className="text-mist-500">9</span>
        </p>
        <div className="flex min-w-0 items-center justify-end gap-2.5">
          <span className="truncate text-sm font-semibold text-mist-400">Northside</span>
          <TokenMark className="h-6 shrink-0 text-white/20" />
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1.5 border-t border-white/8 pt-4 text-sm text-signal">
        <Icon name="verified" className="size-4" weight="duotone" />
        Result verified
      </p>
    </div>
  );
}

const feedItems = [
  { who: "Lagos Lions", what: "won a Valorant challenge 13–9" },
  { who: "@kemi.gg", what: "reached Level 20" },
  { who: "Naija Chess Club", what: "opened a rapid tournament" },
  { who: "@tobi", what: "joined Lagos Lions as IGL" },
  { who: "@ada.plays", what: "earned the Clutch King badge" },
];

export function FeedTicker() {
  return (
    <div className="h-44 overflow-hidden mask-[linear-gradient(transparent,black_20%,black_80%,transparent)]">
      <div
        className="flex animate-marquee-y flex-col motion-reduce:animate-none"
        style={{ "--marquee-duration": "48s" } as CSSProperties}
      >
        {[...feedItems, ...feedItems].map((item, index) => (
          <div key={index} aria-hidden={index >= feedItems.length} className="flex items-center gap-3 py-2.5">
            <TokenMark className="h-5 shrink-0 text-lavender-300" />
            <p className="text-sm leading-snug text-ink-700">
              <span className="font-semibold text-ink-950">{item.who}</span> {item.what}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const hubs = [
  { name: "Lagos Lions", members: "48" },
  { name: "Naija Chess Club", members: "1.2k" },
  { name: "Valorant NG", members: "3.4k" },
  { name: "Weekend League", members: "620" },
];

export function HubRow() {
  return (
    <ul className="grid grid-cols-2 gap-y-5 border-t border-ink-950/10 pt-6 sm:grid-cols-4 sm:divide-x sm:divide-ink-950/10">
      {hubs.map((hub) => (
        <li key={hub.name} className="min-w-0 sm:px-5 sm:first:pl-0">
          <p className="truncate text-sm font-semibold">{hub.name}</p>
          <p className="mt-1 text-sm text-ink-700/70">{hub.members} members</p>
        </li>
      ))}
    </ul>
  );
}
