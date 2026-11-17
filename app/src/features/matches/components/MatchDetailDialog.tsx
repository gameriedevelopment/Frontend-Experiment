import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getMatchPresentation, matchGameName, matchPlayedAt, matchResultStyles, matchSourceLabels } from "@/features/profile/matchHistory";
import type { MatchHistoryEntry } from "@/features/profile/types";
import { cn } from "@/lib/cn";

export function MatchDetailDialog({ match, playerId, onClose }: { match: MatchHistoryEntry; playerId: string; onClose: () => void }) {
  const presentation = getMatchPresentation(match, playerId);
  const result = matchResultStyles[presentation.state];
  const played = matchPlayedAt(match);
  const fields: Array<[string, string]> = [
    ["Played", played ? new Date(played).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not recorded"],
    ["Source", match.verificationSource ? matchSourceLabels[match.verificationSource] : "Gamerie match"],
    ...(match.eventName ? [["Event", match.eventName] as [string, string]] : []),
  ];

  return (
    <Dialog
      open
      title={matchGameName(match.game)}
      icon="games"
      onClose={onClose}
      footer={
        <Button tone="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid gap-6">
        <div className="flex items-center gap-4 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
          <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-bold", result?.className ?? "bg-white/6 text-mist-400")}>{result?.mark ?? "–"}</span>
          <div className="min-w-0">
            <p className="type-display text-2xl tabular-nums">{presentation.label}</p>
            <p className="truncate text-sm text-mist-400">
              {result?.label ?? presentation.state}
              {presentation.opponent ? ` against ${presentation.opponent}` : ""}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="type-label text-mist-500">{label}</dt>
              <dd className="mt-1 text-sm text-mist-100">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Dialog>
  );
}
