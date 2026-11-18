import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { getApiErrorMessage } from "@/lib/errors";
import { useMyTournaments } from "../hooks";
import type { HostedTournamentSummary } from "../types";
import { formatLabel, formatShortDateTime } from "../utils";
import { PhaseBadge, phaseOf } from "./PhaseBadge";
import { TournamentArt } from "./TournamentArt";

type Role = "all" | "hosting" | "entered";
const roles: Array<{ value: Role; label: string }> = [
  { value: "all", label: "All" },
  { value: "hosting", label: "Hosting" },
  { value: "entered", label: "Entered" },
];
const running = ["registration", "check_in", "awaiting_start", "live", "paused"];

/** Where each row leads and what it says, from the viewer's role and the phase. */
function rowAction(tournament: HostedTournamentSummary): { to: string; label: string } {
  const base = `/tournaments/${tournament.id}`;
  if (tournament.phase === "draft") return { to: `${base}/edit`, label: "Continue setup" };
  if (tournament.isOrganizer && running.includes(tournament.phase)) return { to: `${base}?tab=manage`, label: "Manage" };
  if (tournament.phase === "live") return { to: `${base}?tab=matches`, label: "Your matches" };
  if (["completed", "cancelled"].includes(tournament.phase)) return { to: `${base}?tab=bracket`, label: "Results" };
  return { to: base, label: "Open" };
}

function Row({ tournament }: { tournament: HostedTournamentSummary }) {
  const [label, tone] = phaseOf({ phase: tournament.phase, status: undefined }, tournament.startsAt);
  const action = rowAction(tournament);
  return (
    <li>
      <Link
        to={action.to}
        className="group flex items-center gap-4 rounded-2xl bg-ink-900/60 p-3 pr-4 ring-1 ring-inset ring-white/6 transition-colors hover:bg-ink-900 hover:ring-lavender-400/30"
      >
        <TournamentArt src={tournament.banner} game={tournament.game} className="h-16 w-24 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <PhaseBadge label={label} tone={tone} className="h-5 px-2 text-[0.6rem]" />
            <span className="type-label text-mist-500">{tournament.isOrganizer ? "Hosting" : "Entered"}</span>
          </span>
          <span className="mt-1.5 block truncate font-semibold group-hover:text-lavender-100">{tournament.name}</span>
          <span className="mt-0.5 block truncate text-sm text-mist-400">
            {[tournament.game, formatLabel(tournament.format), tournament.startsAt ? formatShortDateTime(tournament.startsAt) : "Start not set"].join(" · ")}
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-lavender-300 sm:flex">
          {action.label}
          <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

export function MyTournamentsList() {
  const [role, setRole] = useState<Role>("all");
  const query = useMyTournaments(role);
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const active = items.filter((item) => !["completed", "cancelled"].includes(item.phase));
  const past = items.filter((item) => ["completed", "cancelled"].includes(item.phase));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Segmented label="Show" options={roles} value={role} onChange={setRole} className="w-fit" />
      {query.isLoading ? (
        <div aria-hidden="true" className="grid gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-22 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Your tournaments didn't load"
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length ? (
        <>
          {[
            ["Active and upcoming", active],
            ["Finished", past],
          ].map(([title, rows]) =>
            (rows as HostedTournamentSummary[]).length ? (
              <section key={title as string} className="grid grid-cols-[minmax(0,1fr)] gap-3">
                <h2 className="type-label text-mist-500">{title as string}</h2>
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                  {(rows as HostedTournamentSummary[]).map((tournament) => (
                    <Row key={tournament.id} tournament={tournament} />
                  ))}
                </ul>
              </section>
            ) : null,
          )}
          {query.hasNextPage && (
            <div className="flex justify-center">
              <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <StatePanel
          icon="trophy"
          title={role === "hosting" ? "You're not hosting anything yet" : role === "entered" ? "You haven't entered a tournament yet" : "No tournaments yet"}
          description={role === "entered" ? "Find one that's open for entry and register in a tap." : "Host one for your friends, team or hub. Gamerie runs the bracket and records the results."}
          action={
            role === "entered" ? (
              <LinkButton to="/tournaments" size="sm" tone="outline">
                Browse tournaments
              </LinkButton>
            ) : (
              <LinkButton to="/tournaments/create" size="sm" icon="plus">
                Host a tournament
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
