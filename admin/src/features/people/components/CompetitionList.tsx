import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { formatDate, ordinal, statusLabel } from "@/lib/format";
import { entityPath } from "@/lib/paths";
import type { CompetitionEntry, HostedCompetition } from "../types";

const KIND_ICON = { tournament: "trophy", ladder: "ladders", league: "leagues" } as const;

/** Competitions a player or team took part in, or a hub ran. */
export function CompetitionList({ rows, empty }: { rows: Array<CompetitionEntry | HostedCompetition>; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-mist-400">{empty}</p>;
  return (
    <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
      {rows.map((row) => {
        const entry = "placement" in row ? row : null;
        return (
          <li key={`${row.kind}-${row.id}-${"enteredAt" in row ? row.enteredAt : row.createdAt}`}>
            <Link to={entityPath(row.kind, row.id)} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/4 text-mist-400">
                <Icon name={KIND_ICON[row.kind]} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{row.name}</span>
                <span className="block truncate font-mono text-[0.7rem] text-mist-500">
                  {[row.game, statusLabel(row.status), entry ? (entry.as === "team" ? "with a team" : "solo") : null].filter(Boolean).join(" · ")}
                </span>
              </span>
              {entry?.placement ? (
                <span className={entry.placement === 1 ? "font-semibold text-signal" : "font-medium text-mist-200"}>{ordinal(entry.placement)}</span>
              ) : (
                <span className="font-mono text-[0.7rem] text-mist-500">{formatDate("enteredAt" in row ? row.enteredAt : row.createdAt)}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
