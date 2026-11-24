import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { waited } from "@/features/queue/lanes";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { DisputeCase } from "./DisputeCase";
import { useDisputes } from "./hooks";
import { SOURCE } from "./sources";

type Filter = "all" | "tournaments" | "ladders" | "leagues";
const KIND_OF: Record<Exclude<Filter, "all">, keyof typeof SOURCE> = { tournaments: "tournament", ladders: "ladder", leagues: "league" };

export function DisputesPage() {
  useDocumentTitle("Disputes");
  const [state, set] = useQueryState({ source: "all", case: "" });
  const disputes = useDisputes();
  const filter = (["all", "tournaments", "ladders", "leagues"].includes(state.source) ? state.source : "all") as Filter;
  const all = disputes.data?.disputes ?? [];
  const rows = filter === "all" ? all : all.filter((dispute) => dispute.source === KIND_OF[filter]);
  const selected = rows.find((dispute) => dispute.key === state.case) ?? rows[0] ?? null;
  const count = (kind: keyof typeof SOURCE) => all.filter((dispute) => dispute.source === kind).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Disputes" description="Results players say are wrong, from every competition. Oldest first." refresh={[["admin", "disputes"]]} />
      <Segmented
        label="Source"
        value={filter}
        onChange={(source) => set({ source, case: "" })}
        className="w-fit max-w-full overflow-x-auto scrollbar-none"
        options={[
          { value: "all", label: `All ${all.length || ""}`.trim() },
          { value: "tournaments", label: `Tournaments ${count("tournament") || ""}`.trim() },
          { value: "ladders", label: `Ladders ${count("ladder") || ""}`.trim() },
          { value: "leagues", label: `Leagues ${count("league") || ""}`.trim() },
        ]}
      />
      {disputes.data && disputes.data.failed.length > 0 && (
        <p className="text-sm text-danger">Disputes from {disputes.data.failed.join(" and ")} didn't load. Refresh to try again.</p>
      )}

      {disputes.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      ) : disputes.isError ? (
        <p className="rounded-card bg-ink-900/70 p-8 text-center text-sm text-mist-300 ring-1 ring-inset ring-white/6">{getApiErrorMessage(disputes.error, "Disputes didn't load.")}</p>
      ) : rows.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-card bg-ink-900/70 px-6 py-20 text-center ring-1 ring-inset ring-white/6">
          <span className="grid size-12 place-items-center rounded-full bg-signal/12 text-signal">
            <Icon name="check" weight="bold" className="size-5" />
          </span>
          <p className="font-semibold">No open disputes</p>
          <p className="max-w-sm text-sm text-mist-400">When players report a result as wrong, it lands here for a decision.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5 lg:sticky lg:top-24">
            {rows.map((dispute) => {
              const source = SOURCE[dispute.source];
              const wait = waited(dispute.raisedAt, source.dueHours);
              const active = dispute.key === selected?.key;
              return (
                <li key={dispute.key}>
                  <button
                    type="button"
                    onClick={() => set({ case: dispute.key })}
                    aria-current={active || undefined}
                    className={cn(
                      "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 ring-inset transition-colors",
                      active ? "bg-lavender-400/8 ring-lavender-400/40" : "ring-white/6 hover:bg-white/3",
                    )}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white/4 text-mist-400">
                      <Icon name={source.icon} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {dispute.sideA} <span className="text-mist-500">vs</span> {dispute.sideB}
                      </span>
                      <span className="block truncate font-mono text-[0.68rem] text-mist-500">{dispute.competition?.name ?? source.label}</span>
                    </span>
                    {wait && <span className={cn("font-mono text-xs tabular-nums", wait.overdue ? "text-danger" : "text-mist-400")}>{wait.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {selected && (
            <DisputeCase
              key={selected.key}
              dispute={selected}
              onDecided={() => {
                const next = rows.find((dispute) => dispute.key !== selected.key);
                set({ case: next?.key ?? "" });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
