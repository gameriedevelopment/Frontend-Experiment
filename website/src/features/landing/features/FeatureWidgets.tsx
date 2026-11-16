import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { Tag } from "@/components/ui/Tag";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";

const insights: ReadonlyArray<{ icon: IconName; text: string; tag: string }> = [
  { icon: "trophy", text: "Top 8% Controller in Valorant", tag: "Rank" },
  { icon: "bolt", text: "Clutch rate up 12% this month", tag: "Trend" },
  { icon: "spark", text: "Strongest on defence, map Ascent", tag: "Insight" },
  { icon: "verified", text: "27 verified wins across 3 games", tag: "Record" },
];

export function ProfileInsights() {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reducedMotion = useReducedMotion();
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!inView || reducedMotion) return;
    const id = window.setInterval(() => setFocus((value) => (value + 1) % insights.length), 2200);
    return () => window.clearInterval(id);
  }, [inView, reducedMotion]);

  return (
    <ul ref={ref} className="grid gap-2">
      {insights.map((insight, index) => (
        <li
          key={insight.text}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors duration-500",
            focus === index ? "bg-white/8 text-mist-50" : "text-mist-400",
          )}
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-xl transition-colors duration-500",
              focus === index ? "bg-lavender-400 text-ink-950" : "bg-white/6",
            )}
          >
            <Icon name={insight.icon} className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{insight.text}</span>
          <Tag tone={focus === index ? "signal" : "muted"}>{insight.tag}</Tag>
        </li>
      ))}
    </ul>
  );
}

export function FitGauge({ value = 94 }: { value?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  return (
    <div className="relative mx-auto grid size-44 place-items-center">
      <svg ref={ref} viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="9" className="stroke-ink-950/10" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-ink-950"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: inView ? value / 100 : 0 }}
          transition={{ duration: 1.6, ease: easeOutExpo }}
        />
      </svg>
      <div className="text-center">
        <p className="type-display text-[2.6rem] leading-none">{value}%</p>
        <p className="type-label mt-2 text-ink-950/60">Squad fit</p>
      </div>
    </div>
  );
}

export function Scoreboard() {
  return (
    <div className="rounded-2xl bg-ink-950 p-4 text-mist-50">
      <div className="type-label flex items-center justify-between text-mist-400">
        <span>Challenge · Bo1</span>
        <Tag tone="signal">
          <Icon name="verified" className="size-3.5" strokeWidth={2} />
          Verified
        </Tag>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-lavender-400 text-ink-950">
            <TokenMark className="h-5" />
          </span>
          <span className="truncate text-sm font-semibold">Lagos Lions</span>
        </div>
        <p className="type-display text-[1.75rem] leading-none">
          13<span className="mx-1.5 text-mist-500">:</span>
          <span className="text-mist-400">9</span>
        </p>
        <div className="flex items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-semibold text-mist-400">Northside</span>
          <span className="grid size-8 place-items-center rounded-lg bg-white/8 text-mist-400">
            <TokenMark className="h-5" />
          </span>
        </div>
      </div>
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
    <div className="h-44 overflow-hidden [mask-image:linear-gradient(transparent,black_18%,black_82%,transparent)]">
      <div className="flex animate-marquee-y flex-col motion-reduce:animate-none">
        {[...feedItems, ...feedItems].map((item, index) => (
          <div key={index} aria-hidden={index >= feedItems.length} className="flex items-center gap-3 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lavender-200 text-lavender-700">
              <TokenMark className="h-4.5" />
            </span>
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
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {hubs.map((hub, index) => (
        <li key={hub.name} className="min-w-0 rounded-2xl bg-ink-950/4 p-3.5 ring-1 ring-inset ring-ink-950/8">
          <span
            className={cn(
              "grid size-9 place-items-center rounded-xl",
              index % 2 === 0 ? "bg-ink-950 text-lavender-400" : "bg-lavender-400 text-ink-950",
            )}
          >
            <Icon name={index % 2 === 0 ? "team" : "hub"} className="size-4.5" />
          </span>
          <p className="mt-3 truncate text-sm font-semibold">{hub.name}</p>
          <p className="type-label mt-1.5 text-ink-950/50">{hub.members} members</p>
        </li>
      ))}
    </ul>
  );
}
