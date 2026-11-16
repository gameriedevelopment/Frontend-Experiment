import { type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";
import { connectableGames } from "../content/landing-content";

export function ConnectedGames() {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/8 pt-7 text-sm sm:grid-cols-4">
      {connectableGames.map((game) => (
        <li key={game} className="truncate text-mist-200">
          {game}
        </li>
      ))}
      <li className="text-lavender-300">More coming</li>
    </ul>
  );
}

const standings = [
  { name: "Denver Drift", value: 42 },
  { name: "Brooklyn Static", value: 39 },
  { name: "Austin Ember", value: 35 },
];

export function LeaderboardPreview() {
  return (
    <div>
      <div className="flex justify-between border-b border-ink-950/10 pb-3 text-sm text-ink-950/60">
        <span>Teams · Wins</span>
        <span>All games</span>
      </div>
      <ol className="divide-y divide-ink-950/10">
        {standings.map((row, index) => (
          <li key={row.name} className="flex items-center gap-3 py-3">
            <span className="w-4 text-sm font-semibold tabular-nums text-ink-950/50">{index + 1}</span>
            <TokenMark className="h-5 text-ink-950" />
            <span className="flex-1 truncate text-sm font-semibold">{row.name}</span>
            <span className="type-display text-lg tabular-nums">{row.value}</span>
          </li>
        ))}
      </ol>
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
        Result recorded
      </p>
    </div>
  );
}

const feedItems = [
  { who: "Lagos Lions", what: "won a Valorant challenge 13–9" },
  { who: "@kemi.gg", what: "reached Level 20" },
  { who: "Naija Chess Club", what: "opened a rapid tournament" },
  { who: "@tobi", what: "joined Lagos Lions" },
  { who: "Abuja Aces", what: "posted a new ladder fixture" },
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

function BracketMatch({ sides, winner }: { sides: readonly [string, string]; winner: 0 | 1 }) {
  return (
    <div className="divide-y divide-white/8 overflow-hidden rounded-xl bg-white/5 ring-1 ring-inset ring-white/8">
      {sides.map((side, index) => (
        <div
          key={side}
          className={cn(
            "flex h-9 items-center gap-2 px-3 text-[0.8rem]",
            index === winner ? "font-semibold text-mist-50" : "text-mist-500",
          )}
        >
          <TokenMark className={cn("h-3.5 shrink-0", index === winner ? "text-lavender-400" : "text-white/20")} />
          <span className="truncate">{side}</span>
        </div>
      ))}
    </div>
  );
}

export function Bracket() {
  return (
    <div aria-hidden="true" className="flex items-center">
      <div className="grid min-w-0 flex-1 gap-3">
        <BracketMatch sides={["Lagos Lions", "Northside"]} winner={0} />
        <BracketMatch sides={["Abuja Aces", "Kings XI"]} winner={0} />
      </div>
      <span className="h-21 w-4 shrink-0 rounded-r-lg border-y border-r border-white/15" />
      <span className="h-px w-3 shrink-0 bg-white/15" />
      <div className="min-w-0 flex-1">
        <BracketMatch sides={["Lagos Lions", "Abuja Aces"]} winner={0} />
      </div>
    </div>
  );
}
