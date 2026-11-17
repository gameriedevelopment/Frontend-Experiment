import { Link } from "react-router-dom";
import { LinkButton } from "@/components/ui/Button";
import type { Tournament } from "@/features/tournaments/types";
import { formatLabel, registrationState } from "@/features/tournaments/utils";
import { cn } from "@/lib/cn";
import { formatSentenceDay } from "../format";
import { HomePanel, RowSkeletons } from "./HomePanel";

function entryStatus(tournament: Tournament): { label: string; urgent: boolean } {
  if (tournament.phase === "check_in") return { label: "Check-in open", urgent: true };
  if (tournament.phase === "awaiting_start") return { label: "Starting soon", urgent: false };
  const state = registrationState(tournament);
  if (state === "closing") return { label: "Closing soon", urgent: true };
  if (state === "full") return { label: "Full", urgent: false };
  return { label: "Entries open", urgent: false };
}

function TournamentRow({ tournament }: { tournament: Tournament }) {
  const capacity = tournament.bracketSize ?? tournament.maxTeams ?? 0;
  const entrants = tournament.entrantCount ?? tournament.currentTeams ?? 0;
  const fill = capacity ? Math.min(100, Math.round((entrants / capacity) * 100)) : 0;
  const status = entryStatus(tournament);
  const detail = [
    tournament.game,
    formatLabel(tournament.format),
    tournament.startDate ? `Starts ${formatSentenceDay(tournament.startDate)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        to={`/tournaments/${encodeURIComponent(tournament.id)}`}
        className="group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-white/3"
      >
        {tournament.image ? (
          <img src={tournament.image} alt="" className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-white/8" />
        ) : (
          <span
            aria-hidden="true"
            className="type-label grid size-12 shrink-0 place-items-center rounded-xl bg-ink-800 text-lavender-200 ring-1 ring-inset ring-white/8"
          >
            {tournament.game.slice(0, 2)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold transition-colors group-hover:text-lavender-200">
            {tournament.name}
          </span>
          <span className="mt-0.5 block truncate text-sm text-mist-400">{detail}</span>
        </span>
        <span className="hidden w-28 shrink-0 sm:block">
          <span className={cn("type-label block text-right", status.urgent ? "text-lavender-300" : "text-mist-500")}>
            {status.label}
          </span>
          {capacity > 0 && (
            <>
              <span aria-hidden="true" className="mt-2 block h-1 overflow-hidden rounded-full bg-white/8">
                <span className="block h-full rounded-full bg-lavender-400/70" style={{ width: `${fill}%` }} />
              </span>
              <span className="mt-1.5 block text-right text-xs tabular-nums text-mist-500">
                {entrants} / {capacity} entered
              </span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

export function OpenTournaments({
  tournaments,
  loading,
  className,
  title = "Open for entry",
  link = { label: "Tournaments", to: "/tournaments" },
  empty = "No brackets are open right now. Anyone can host one for their friends, team or hub, and Gamerie runs the bracket and records the results.",
  hostTo = "/tournaments/create",
}: {
  tournaments: Tournament[];
  loading: boolean;
  className?: string;
  title?: string;
  link?: { label: string; to: string };
  empty?: string;
  hostTo?: string;
}) {
  return (
    <HomePanel
      className={className}
      title={title}
      description={tournaments.length ? "Tournaments hosted on Gamerie that you can still join." : undefined}
      link={link}
    >
      {loading ? (
        <RowSkeletons rows={2} />
      ) : tournaments.length ? (
        <ul className="-mx-3 -my-1 flex flex-col gap-1">
          {tournaments.map((tournament) => (
            <TournamentRow key={tournament.id} tournament={tournament} />
          ))}
        </ul>
      ) : (
        <div className="grid gap-4">
          <p className="max-w-md text-sm leading-relaxed text-mist-400">{empty}</p>
          <div>
            <LinkButton to={hostTo} size="sm" tone="outline" icon="plus">
              Host a tournament
            </LinkButton>
          </div>
        </div>
      )}
    </HomePanel>
  );
}
