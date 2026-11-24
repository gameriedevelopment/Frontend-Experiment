import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Stamp } from "@/components/record/Stamp";
import { cn } from "@/lib/cn";
import { ordinal, statusLabel } from "@/lib/format";

export interface EntrantRow {
  id: string;
  name: string;
  avatar: string | null;
  kind: "player" | "team";
  /** The user or team the entrant opens. */
  targetId: string | null;
  status: string;
  /** A rank, seed or final place, already chosen by the caller. */
  position: number | null;
  positionKind: "place" | "seed" | "rank";
  detail?: string | null;
}

const OUT = new Set(["withdrawn", "declined", "removed", "disqualified", "eliminated"]);

/** Entrants of any competition, each opening the player or team dossier. */
export function EntrantList({ rows, empty }: { rows: EntrantRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-mist-400">{empty}</p>;
  return (
    <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
      {rows.map((row) => {
        const content = (
          <>
            <span className={cn("w-9 shrink-0 text-center font-mono text-xs tabular-nums", row.positionKind === "place" && row.position === 1 ? "font-semibold text-signal" : "text-mist-400")}>
              {row.position == null ? "—" : row.positionKind === "place" ? ordinal(row.position) : `#${row.position}`}
            </span>
            <Avatar src={row.avatar ?? undefined} name={row.name} size="sm" tone={row.kind === "team" ? "ink" : "brand"} shape={row.kind === "team" ? "square" : "circle"} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{row.name}</span>
              {row.detail && <span className="block truncate font-mono text-[0.68rem] text-mist-500">{row.detail}</span>}
            </span>
            {OUT.has(row.status) ? <Stamp tone="danger">{statusLabel(row.status)}</Stamp> : <span className="text-xs text-mist-400">{statusLabel(row.status)}</span>}
          </>
        );
        return (
          <li key={row.id}>
            {row.targetId ? (
              <Link to={`/${row.kind === "team" ? "teams" : "users"}/${row.targetId}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/4">
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-2 py-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
