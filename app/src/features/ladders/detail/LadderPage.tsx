import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { HeroBanner } from "@/features/tournaments/components/HeroBanner";
import { cn, titleSize } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LadderStatusBadge } from "../components/LadderBits";
import { useLadder, useLadderAction, useLadderAnnouncements, useLadderParticipants, useLadderStandings } from "../hooks";
import type { LadderChallenge, LadderDetail, LadderParticipant } from "../types";
import { LADDER_JOIN_LABELS, formatLadderDateRange, formatLadderMoney, ladderPlayScopeLabel } from "../utils";
import { LadderChallengeDialog, LadderEntryDialog, LadderResultDialog, ladderError } from "./LadderDialogs";
import { LadderManage } from "./LadderManage";
import { LadderMatches } from "./LadderMatches";

type Tab = "overview" | "standings" | "matches" | "participants" | "rules" | "manage";
const baseTabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "standings", label: "Standings" },
  { id: "matches", label: "Matches" },
  { id: "participants", label: "Participants" },
  { id: "rules", label: "Rules" },
];

function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Standings({ ladder, onChallenge }: { ladder: LadderDetail; onChallenge: (opponent: LadderParticipant) => void }) {
  const query = useLadderStandings(ladder.id);
  const me = ladder.viewer.participant;
  const [group, setGroup] = useState<string>("all");
  const rows = (query.data ?? []).filter((row) => group === "all" || row.groupId === group);
  const groups = [...new Set((query.data ?? []).map((row) => row.groupId).filter(Boolean))] as string[];
  const canChallenge = Boolean(me && me.status === "active" && ladder.status === "in_progress");
  const scope = ladder.groups.count > 0 ? ladder.groups.playScope : "anyone";
  const myGroup = (query.data ?? []).find((row) => row.id === me?.id)?.groupId ?? null;
  const inScope = (groupId: string | null) =>
    scope === "anyone" || !myGroup || (scope === "own_group" ? groupId === myGroup : groupId !== myGroup);

  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (!query.data?.length)
    return <StatePanel icon="standings" title="The table is empty" description="Standings appear once players join. Every result moves the table straight away." />;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {groups.length > 1 && (
        <Segmented
          label="Group"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "All" }, ...groups.map((id, index) => ({ value: id, label: `Group ${String.fromCharCode(65 + index)}` }))]}
          className="w-fit"
        />
      )}
      <div className="relative overflow-x-auto rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
        <table className="w-full min-w-136 text-sm">
          <thead>
            <tr className="type-label text-left text-mist-500">
              <th scope="col" className="px-5 py-4 font-medium">#</th>
              <th scope="col" className="w-full px-2 py-4 font-medium">{ladder.entrantType === "team" ? "Team" : "Player"}</th>
              {["P", "W", "D", "L", "Pts"].map((label) => (
                <th key={label} scope="col" className="px-3 py-4 text-right font-medium">
                  {label}
                </th>
              ))}
              <th scope="col" className="w-28 px-5 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const mine = row.id === me?.id;
              return (
                <tr key={row.id} className={cn("border-t border-white/6", mine && "bg-lavender-400/6")}>
                  <td className={cn("px-5 py-3 font-semibold tabular-nums", row.place === 1 ? "text-signal" : row.place <= 3 ? "text-lavender-300" : "text-mist-400")}>
                    {row.place === 1 ? <Icon name="crown" weight="fill" className="size-4" /> : row.place}
                  </td>
                  <th scope="row" className="px-2 py-3 text-left font-normal">
                    <span className="flex items-center gap-2.5">
                      <Avatar src={row.avatar ?? undefined} name={row.displayName} size="sm" tone={row.kind === "team" ? "ink" : "brand"} className="rounded-full" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 truncate font-semibold">
                          {row.displayName}
                          {mine && <span className="type-label text-lavender-300">You</span>}
                        </span>
                        {row.status === "inactive" && <span className="text-xs text-mist-500">Inactive</span>}
                      </span>
                    </span>
                  </th>
                  {[row.played, row.won, row.drawn, row.lost].map((value, index) => (
                    <td key={index} className="px-3 py-3 text-right tabular-nums text-mist-300">
                      {value}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{row.points}</td>
                  <td className="px-5 py-3 text-right">
                    {canChallenge && !mine && row.status === "active" && inScope(row.groupId) && (
                      <Button tone="outline" size="sm" onClick={() => onChallenge(row)}>
                        Challenge
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-mist-500">
        Win {ladder.points.win} · {ladder.allowDraws ? `draw ${ladder.points.draw} · ` : ""}loss {ladder.points.loss}. At least {ladder.minimumMatchesForPrizes} played to place for prizes.
      </p>
    </div>
  );
}

function Participants({ ladder }: { ladder: LadderDetail }) {
  const query = useLadderParticipants(ladder.id);
  const rows = query.data?.data ?? [];
  if (query.isLoading) return <Skeleton className="h-64 rounded-card" />;
  if (!rows.length) return <StatePanel icon="people" title="No one has joined yet" description="Entrants appear here as they join." />;
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <li key={row.id} className={cn("flex items-center gap-3 rounded-2xl bg-ink-900/60 p-3.5 ring-1 ring-inset ring-white/6", row.id === ladder.viewer.participant?.id && "ring-lavender-400/40")}>
          <Avatar src={row.avatar ?? undefined} name={row.displayName} tone={row.kind === "team" ? "ink" : "brand"} className="rounded-full" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{row.displayName}</span>
            <span className="block text-xs text-mist-500">{row.joinedAt ? `Joined ${timeAgo(row.joinedAt)}` : row.status.replace("_", " ")}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Rules({ ladder }: { ladder: LadderDetail }) {
  const rows: Array<[string, string]> = [
    ["Series", `Best of ${ladder.bestOf}`],
    ["Points", `Win ${ladder.points.win} · ${ladder.allowDraws ? `draw ${ladder.points.draw} · ` : ""}loss ${ladder.points.loss}`],
    ["Rematches", `Same opponent again after ${ladder.rematchWaitDays} days`],
    ["Prize eligibility", `At least ${ladder.minimumMatchesForPrizes} matches played`],
    ["Who you can play", ladder.groups.count > 0 ? ladderPlayScopeLabel(ladder.groups.playScope) : "Anyone on the ladder"],
    ["Entry", LADDER_JOIN_LABELS[ladder.joinMode]],
  ];
  if (ladder.allowedModes.length) rows.push(["Modes", ladder.allowedModes.join(", ")]);
  if (ladder.allowedMaps.length) rows.push(["Maps", ladder.allowedMaps.join(", ")]);
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Panel title="How it works">
        <dl className="grid gap-3.5">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 text-sm">
              <dt className="text-mist-500">{label}</dt>
              <dd className="text-mist-100">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="House rules">
        <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{ladder.rulesText || "No extra rules. Gamerie's platform rules apply."}</p>
      </Panel>
    </div>
  );
}

function Overview({ ladder, onTab }: { ladder: LadderDetail; onTab: (tab: Tab) => void }) {
  const updates = useLadderAnnouncements(ladder.id);
  const standings = useLadderStandings(ladder.id);
  const mine = standings.data?.find((row) => row.id === ladder.viewer.participant?.id);
  const top = (standings.data ?? []).slice(0, 5);
  const posts = updates.data?.data ?? [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid gap-6">
        {mine && (
          <section className="flex flex-wrap items-center gap-5 rounded-card bg-lavender-400/6 p-5 ring-1 ring-inset ring-lavender-400/25 sm:p-6">
            <span className="type-display text-5xl leading-none tabular-nums text-lavender-200">{mine.place}</span>
            <span className="min-w-0 flex-1">
              <span className="type-label block text-mist-500">Your place</span>
              <span className="mt-1 block text-sm text-mist-200">
                {mine.points} points · {mine.won}W {mine.drawn}D {mine.lost}L from {mine.played} played
              </span>
            </span>
            <Button tone="outline" size="sm" icon="standings" onClick={() => onTab("standings")}>
              Full table
            </Button>
          </section>
        )}
        {posts.length > 0 && (
          <Panel title="Latest updates">
            <ul className="grid gap-4">
              {posts.slice(0, 3).map((post) => (
                <li key={post.id} className="border-l-2 border-lavender-400/40 pl-4">
                  {post.details?.title && <p className="text-sm font-semibold">{post.details.title}</p>}
                  <p className="mt-0.5 text-sm leading-relaxed text-mist-300">{post.details?.message}</p>
                  <p className="mt-1 text-xs text-mist-500">{timeAgo(post.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Panel title="About">
          <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-mist-300">{ladder.description || "The organizer hasn't added a description yet."}</p>
        </Panel>
      </div>
      <aside className="grid gap-6">
        <Panel title="Top of the table">
          {top.length ? (
            <ol className="grid gap-2.5">
              {top.map((row) => (
                <li key={row.id} className="flex items-center gap-3 text-sm">
                  <span className={cn("w-5 font-semibold tabular-nums", row.place === 1 ? "text-signal" : "text-mist-500")}>{row.place}</span>
                  <Avatar src={row.avatar ?? undefined} name={row.displayName} size="sm" className="rounded-full" />
                  <span className="min-w-0 flex-1 truncate font-medium">{row.displayName}</span>
                  <span className="tabular-nums text-mist-300">{row.points}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-mist-400">No results yet.</p>
          )}
        </Panel>
        {ladder.prize && (
          <Panel title="Prize">
            <p className="type-display text-3xl leading-none text-lavender-200">{formatLadderMoney(ladder.prize.total, ladder.prize.currency)}</p>
            <ol className="mt-4 grid gap-2">
              {ladder.prize.places.map((place) => (
                <li key={place.placement} className="flex justify-between rounded-xl bg-white/3 px-3 py-2 text-sm ring-1 ring-inset ring-white/6">
                  <span className={place.placement === 1 ? "font-medium text-signal" : "text-mist-300"}>Place {place.placement}</span>
                  <span className="font-semibold tabular-nums">{formatLadderMoney(place.amount, ladder.prize!.currency)}</span>
                </li>
              ))}
            </ol>
            {ladder.prize.description && <p className="mt-3 text-sm text-mist-400">{ladder.prize.description}</p>}
          </Panel>
        )}
      </aside>
    </div>
  );
}

export function LadderPage() {
  const { ladderId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const query = useLadder(ladderId);
  const actions = useLadderAction(ladderId);
  const [entry, setEntry] = useState<"join" | "accept" | null>(null);
  const [opponent, setOpponent] = useState<LadderParticipant | null>(null);
  const [reporting, setReporting] = useState<LadderChallenge | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const ladder = query.data;
  useDocumentTitle(ladder?.name);
  const tabs = useMemo(() => (ladder?.viewer.isOrganizer ? [...baseTabs, { id: "manage" as const, label: "Manage" }] : baseTabs), [ladder?.viewer.isOrganizer]);
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = tabs.some((item) => item.id === requested) ? requested! : "overview";
  const goTab = (next: Tab) => setParams(next === "overview" ? {} : { tab: next });

  if (query.isLoading)
    return (
      <div aria-hidden="true" className="grid gap-6">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-96 rounded-panel" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  if (query.isError || !ladder)
    return (
      <StatePanel
        icon="ladders"
        tone="danger"
        title="Ladder not found"
        description={getApiErrorMessage(query.error, "It may have been removed, or the link is wrong.")}
        action={
          <LinkButton to="/ladders" tone="outline" size="sm" icon="arrowLeft">
            Back to ladders
          </LinkButton>
        }
      />
    );

  const me = ladder.viewer.participant;
  const mayEnter = !ladder.viewer.isOrganizer && !ladder.viewer.isParticipant && !me && ["upcoming", "in_progress"].includes(ladder.status) && ladder.joinMode !== "private";
  const heroAction = ladder.viewer.isOrganizer && ladder.status === "draft" ? (
    <LinkButton to={`/ladders/${ladder.id}/edit`} icon="edit">
      Continue setup
    </LinkButton>
  ) : me?.status === "invited" ? (
    <>
      <Button tone="outline" disabled={actions.invitation.isPending} onClick={() => actions.invitation.mutate({ participantId: me.id, action: "decline" }, { onSuccess: () => toast.info("Invitation declined") })}>
        Decline
      </Button>
      <Button icon="check" onClick={() => setEntry("accept")}>
        Accept invitation
      </Button>
    </>
  ) : me?.status === "pending_approval" ? (
    <span className="flex h-12 items-center rounded-full bg-white/5 px-5 text-sm font-semibold text-mist-200 ring-1 ring-inset ring-white/12">Awaiting approval</span>
  ) : ladder.viewer.isParticipant ? (
    <span className="flex h-12 items-center gap-2 rounded-full bg-signal/12 px-5 text-sm font-semibold text-signal ring-1 ring-inset ring-signal/30">
      <Icon name="check" weight="bold" className="size-4" />
      On the ladder
    </span>
  ) : mayEnter ? (
    <Button icon="ladders" onClick={() => setEntry("join")}>
      {ladder.joinMode === "approval" ? "Request to join" : "Join ladder"}
    </Button>
  ) : null;

  const stats: Array<[string, string]> = [
    ["Prize", ladder.prize?.total ? formatLadderMoney(ladder.prize.total, ladder.prize.currency) : "No prize"],
    [ladder.entrantType === "team" ? "Teams" : "Players", ladder.maxParticipants ? `${ladder.participantCount} / ${ladder.maxParticipants}` : String(ladder.participantCount)],
    ["Entry", LADDER_JOIN_LABELS[ladder.joinMode]],
    ["Scoring", `W ${ladder.points.win} · D ${ladder.points.draw} · L ${ladder.points.loss}`],
    ["Season", formatLadderDateRange(ladder.startsAt, ladder.endsAt)],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link to="/ladders" className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50">
        <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Ladders
      </Link>

      <section className="overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/8">
        <HeroBanner src={ladder.banner} game={ladder.game.name} className="min-h-56 sm:min-h-72">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <LadderStatusBadge status={ladder.status} />
                <span className="type-label rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
                  {[ladder.platform, ladder.region].filter(Boolean).join(" · ")}
                </span>
              </div>
              <p className="type-label mt-5 text-lavender-300">{ladder.game.name}</p>
              <h1 className={cn("type-display mt-2 break-words leading-[0.95]", titleSize(ladder.name))}>{ladder.name}</h1>
              <p className="mt-3 text-sm text-mist-300">
                {ladder.official ? "Run by Gamerie" : <>Hosted by <span className="font-semibold text-mist-50">{ladder.host.name}</span></>}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {heroAction}
              {ladder.viewer.isParticipant && me && ["upcoming", "in_progress"].includes(ladder.status) && (
                <Button tone="ghost" size="sm" onClick={() => setWithdrawing(true)}>
                  Leave
                </Button>
              )}
            </div>
          </div>
        </HeroBanner>
        <dl className="grid grid-cols-2 border-t border-white/6 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(([label, value], index) => (
            <div
              key={label}
              className={cn(
                "min-w-0 px-5 py-4 sm:px-6",
                index > 0 && "lg:border-l lg:border-white/6",
                index % 2 === 1 && "border-l border-white/6 sm:border-l-0",
                index >= 2 && "border-t border-white/6 lg:border-t-0",
                index === 4 && "col-span-2 sm:col-span-1",
              )}
            >
              <dt className="type-label text-mist-500">{label}</dt>
              <dd className="mt-2 truncate text-[0.95rem] font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Tabs label="Ladder sections" items={tabs} value={tab} onChange={goTab} indicatorId="ladder-tab" />

      {tab === "overview" ? (
        <Overview ladder={ladder} onTab={goTab} />
      ) : tab === "standings" ? (
        <Standings ladder={ladder} onChallenge={setOpponent} />
      ) : tab === "matches" ? (
        <LadderMatches ladder={ladder} onReport={setReporting} />
      ) : tab === "participants" ? (
        <Participants ladder={ladder} />
      ) : tab === "rules" ? (
        <Rules ladder={ladder} />
      ) : (
        <LadderManage ladder={ladder} />
      )}

      {entry && (
        <LadderEntryDialog
          ladder={ladder}
          mode={entry}
          pending={actions.join.isPending || actions.invitation.isPending}
          error={ladderError(actions.join.error ?? actions.invitation.error, "That didn't go through.")}
          onClose={() => setEntry(null)}
          onSubmit={(input) => {
            const done = {
              onSuccess: () => {
                setEntry(null);
                toast.success(ladder.joinMode === "approval" && entry === "join" ? "Request sent" : "You're on the ladder", ladder.name);
              },
            };
            if (entry === "accept" && me) actions.invitation.mutate({ participantId: me.id, action: "accept", input }, done);
            else actions.join.mutate(input, done);
          }}
        />
      )}
      {opponent && me && (
        <LadderChallengeDialog
          ladder={ladder}
          opponent={opponent}
          pending={actions.challenge.isPending}
          error={ladderError(actions.challenge.error, "The challenge couldn't be sent.")}
          onClose={() => setOpponent(null)}
          onSubmit={(input) =>
            actions.challenge.mutate(
              { challengerParticipantId: me.id, opponentParticipantId: opponent.id, ...input },
              {
                onSuccess: () => {
                  setOpponent(null);
                  toast.success("Challenge sent", `${opponent.displayName} has been notified.`);
                  goTab("matches");
                },
              },
            )
          }
        />
      )}
      {reporting && (
        <LadderResultDialog
          match={reporting}
          allowDraws={ladder.allowDraws}
          pending={actions.result.isPending}
          error={ladderError(actions.result.error, "The result couldn't be reported.")}
          onClose={() => setReporting(null)}
          onSubmit={(input) =>
            actions.result.mutate(
              { challengeId: reporting.id, input },
              {
                onSuccess: () => {
                  setReporting(null);
                  toast.success("Result reported", "Your opponent confirms it before it counts.");
                },
              },
            )
          }
        />
      )}
      <ConfirmDialog
        open={withdrawing}
        title="Leave this ladder?"
        description="You come off the table. Results already played stay with your opponents."
        confirmLabel="Leave ladder"
        pending={actions.withdraw.isPending}
        error={ladderError(actions.withdraw.error, "You couldn't leave.")}
        onConfirm={() =>
          me &&
          actions.withdraw.mutate(me.id, {
            onSuccess: () => {
              setWithdrawing(false);
              toast.info("You've left the ladder");
            },
          })
        }
        onClose={() => setWithdrawing(false)}
      />
    </div>
  );
}
