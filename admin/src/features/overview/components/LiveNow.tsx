import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/layout/Panel";
import { getApiErrorMessage } from "@/lib/errors";
import { figure } from "@/lib/format";
import { useLiveCompetitions } from "../hooks";

const KIND = {
  tournament: { label: "Tournament", path: "/tournaments", icon: "trophy" },
  ladder: { label: "Ladder", path: "/ladders", icon: "ladders" },
  league: { label: "League", path: "/leagues", icon: "leagues" },
} as const;

export function LiveNow() {
  const live = useLiveCompetitions();
  const rows = live.data ?? [];
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-signal/60 motion-reduce:animate-none" />
            <span className="relative size-2 rounded-full bg-signal" />
          </span>
          Live now
        </span>
      }
      className="h-full"
    >
      {live.isLoading ? (
        <div className="grid gap-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : live.isError ? (
        <p className="text-sm text-mist-400">{getApiErrorMessage(live.error, "Running competitions didn't load.")}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white/3 px-4 py-6 text-center text-sm text-mist-400 ring-1 ring-inset ring-white/6">Nothing is being played right now.</p>
      ) : (
        <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
          {rows.slice(0, 8).map((row) => (
            <li key={`${row.kind}-${row.id}`}>
              <Link to={`${KIND[row.kind].path}/${row.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/4">
                <span title={KIND[row.kind].label} className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/4 text-mist-400">
                  <Icon name={KIND[row.kind].icon} className="size-4" />
                  <span className="sr-only">{KIND[row.kind].label}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {row.name}
                    {row.official && <Icon name="seal" weight="fill" className="size-3.5 shrink-0 text-lavender-300" aria-label="Official" />}
                  </span>
                  <span className="block truncate text-xs text-mist-500">
                    {row.game} · {figure(row.entrants)} entered
                  </span>
                </span>
                {row.attention > 0 && (
                  <span className="rounded-full bg-danger/12 px-2 py-0.5 font-mono text-[0.68rem] text-danger ring-1 ring-inset ring-danger/30">
                    {row.attention} disputed
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
