import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { HubBreakdown, HubDashboard, HubSummary } from "../types";

const number = (value: number) => value.toLocaleString();
const counted = (value: number, one: string, many = `${one}s`) => `${number(value)} ${value === 1 ? one : many}`;
const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

const card = "rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 print:break-inside-avoid print:bg-white print:ring-ink-950/15";
const muted = "text-mist-400 print:text-ink-950/60";
const exactColor = "print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]";

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className={cn(card, "grid gap-1.5 p-4")}>
      <dt className="type-label text-mist-500 print:text-ink-950/60">{label}</dt>
      <dd className="type-display text-3xl tabular-nums">{value}</dd>
      {detail && <dd className={cn("text-xs", muted)}>{detail}</dd>}
    </div>
  );
}

function Breakdown({ title, rows, total }: { title: string; rows: HubBreakdown; total: number }) {
  const peak = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div>
      <h4 className={cn("text-xs font-semibold", muted)}>{title}</h4>
      {rows.length ? (
        <ul className="mt-2.5 grid gap-2">
          {rows.map((row) => (
            <li key={row.label} className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_2.75rem] items-center gap-3 text-sm">
              <span className="truncate">{row.label}</span>
              <span className={cn("h-1.5 overflow-hidden rounded-full bg-white/8 print:bg-ink-950/10", exactColor)}>
                <span className={cn("block h-full rounded-full bg-lavender-400 print:bg-lavender-700", exactColor)} style={{ width: `${(row.count / peak) * 100}%` }} />
              </span>
              <span className={cn("text-right text-xs tabular-nums", muted)}>{percent(row.count, total)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("mt-2 text-sm", muted)}>No data yet.</p>
      )}
    </div>
  );
}

function Facts({ items }: { items: Array<[label: string, value: string, detail?: string]> }) {
  return (
    <dl className="grid divide-y divide-white/6 print:divide-ink-950/10">
      {items.map(([label, value, detail]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className={cn("text-sm", muted)}>{label}</dt>
          <dd className="text-right">
            <span className="font-semibold tabular-nums">{value}</span>
            {detail && <span className={cn("block text-xs", muted)}>{detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A hub's numbers laid out so an owner can show them to a sponsor: reach and engagement, who the
 * members are, and what the hub's teams have achieved. Prints cleanly on white.
 */
export function HubReport({ hub, data, actions }: { hub: HubSummary; data: HubDashboard; actions?: ReactNode }) {
  const { community, engagement, audience, competition, roles, referral, growth } = data;
  const interactions = engagement.reactions + engagement.comments;
  const record = competition.teamRecord;
  const peak = Math.max(1, ...growth.memberGrowth.map((point) => point.count));

  return (
    <article aria-labelledby="hub-report-title" className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={hub.logo} name={hub.name} size="lg" className="rounded-2xl" />
          <div className="min-w-0">
            <p className="type-label text-lavender-300 print:text-lavender-700">Hub report · last {engagement.days} days</p>
            <h2 id="hub-report-title" className="type-display mt-2 text-2xl break-words">
              {hub.name}
            </h2>
            <p className={cn("mt-1 text-sm", muted)}>
              {hub.type === "organization" ? "Organization" : "Community"} on Gamerie ·{" "}
              {new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Members" value={number(community.members)} detail={`+${number(community.newMembers)} this month`} />
        <Kpi label="Active members" value={number(community.activeMembers)} detail={`${percent(community.activeMembers, community.members)} seen this month`} />
        <Kpi label="Followers" value={number(community.followers)} />
        <Kpi label="Teams" value={number(community.teams)} />
        <Kpi label="Post reach" value={number(engagement.reach)} detail={`${counted(engagement.views, "view")} from ${counted(engagement.posts, "post")}`} />
        <Kpi
          label="Interactions"
          value={number(interactions)}
          detail={engagement.views ? `${percent(interactions, engagement.views)} engagement rate` : `${counted(engagement.reactions, "reaction")}, ${counted(engagement.comments, "comment")}`}
        />
      </dl>

      <section className={card}>
        <h3 className="font-semibold">New members</h3>
        <div role="img" aria-label="New members per day over the last 30 days" className="mt-4 flex h-24 items-end gap-1">
          {growth.memberGrowth.map((point) => (
            <span
              key={point.date}
              title={`${new Date(point.date).toLocaleDateString()}: ${point.count}`}
              className={cn("flex-1 rounded-t bg-lavender-400/80 print:bg-lavender-700", exactColor)}
              style={{ height: `${Math.max(4, (point.count / peak) * 100)}%` }}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 print:grid-cols-2">
        <section className={cn(card, "grid content-start gap-5")}>
          <h3 className="font-semibold">Audience</h3>
          <Breakdown title="Where members play from" rows={audience.regions} total={community.members} />
          <Breakdown title="What they play" rows={audience.games} total={community.members} />
          <Breakdown title="Platforms" rows={audience.platforms} total={community.members} />
          <p className={cn("text-xs", muted)}>
            {percent(audience.verifiedEmail, community.members)} of members have a verified email, {percent(audience.verifiedPhone, community.members)} a
            verified phone.
          </p>
        </section>

        <section className={cn(card, "grid content-start gap-5")}>
          <div>
            <h3 className="mb-3 font-semibold">Competition</h3>
            <Facts
              items={[
                ["Team record", `${record.wins}–${record.draws}–${record.losses}`, record.played ? `${percent(record.wins, record.played)} win rate` : "No matches yet"],
                ["Tournaments", `${number(competition.tournaments.entries)} entered`, `${number(competition.tournaments.wins)} won · ${counted(competition.tournaments.podiums, "podium")}`],
                ["Ladders", `${number(competition.ladders.entries)} entered`, `${counted(competition.ladders.titles, "title")} · ${counted(competition.ladders.podiums, "podium")}`],
                [
                  "Events hosted",
                  number(competition.hosted.tournaments + competition.hosted.ladders),
                  `${counted(competition.hosted.tournaments, "tournament")} · ${counted(competition.hosted.ladders, "ladder")} · ${counted(competition.hosted.entrants, "entrant")}`,
                ],
                ...(competition.engagement
                  ? ([
                      [
                        "Competition views",
                        number(competition.engagement.views),
                        `${counted(competition.engagement.viewers, "person", "people")} · ${counted(competition.engagement.joins, "join")} this month`,
                      ],
                    ] as Array<[string, string, string]>)
                  : []),
              ]}
            />
          </div>
          <div>
            <h3 className="mb-3 font-semibold">People</h3>
            <Facts
              items={[
                ["Leadership", number(roles.owner + roles.coOwners + roles.managers)],
                ["Team players", number(roles.teamLeaders + roles.teamMembers), `${number(roles.teamLeaders)} leading a team`],
                [
                  "Recognized members",
                  number(roles.partners + roles.officialMembers + roles.honoraryMembers),
                  `${counted(roles.partners, "partner")} · ${number(roles.officialMembers)} official · ${number(roles.honoraryMembers)} honorary`,
                ],
                ["Referred sign-ups", number(referral.totalSignups), `${number(referral.verifiedUsers)} verified`],
              ]}
            />
          </div>
        </section>
      </div>
    </article>
  );
}
