import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stamp } from "@/components/record/Stamp";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { getApiErrorMessage } from "@/lib/errors";
import { figure } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { AchievementDialog } from "./AchievementDialog";
import { CATEGORIES, categoryLabel, listAchievements, type Achievement, type AchievementCategory, type AchievementQuery } from "./api";

const DEFAULTS = { search: "", category: "", page: "1" };
const LIMIT = 25;
const root = ["admin", "achievements"] as const;
const column = createColumnHelper<Achievement>();

export function AchievementsPage() {
  useDocumentTitle("Achievements");
  const client = useQueryClient();
  const [state, set] = useQueryState(DEFAULTS);
  const [editing, setEditing] = useState<Achievement | "new" | null>(null);
  const query: AchievementQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    category: (state.category || undefined) as AchievementCategory | undefined,
  };
  const achievements = useQuery({ queryKey: [...root, query], queryFn: () => listAchievements(query), placeholderData: keepPreviousData });

  const columns = [
    column.display({
      id: "achievement",
      header: "Achievement",
      cell: ({ row: { original: a } }) => (
        <button type="button" onClick={() => setEditing(a)} className="flex min-w-0 items-center gap-3 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lavender-400/10 text-lavender-300 ring-1 ring-inset ring-lavender-400/20">
            <Icon name="medal" weight="duotone" className="size-[1.1rem]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-mist-50">{a.title}</span>
            <span className="block max-w-md truncate text-xs text-mist-400">{a.description}</span>
          </span>
        </button>
      ),
    }),
    column.display({
      id: "category",
      header: "Category",
      cell: ({ row: { original: a } }) => (
        <span className="flex flex-wrap items-center gap-1.5 text-sm text-mist-200">
          {categoryLabel(a.category)}
          {a.automatic && (
            <Stamp tone="signal" icon="bolt">
              Automatic
            </Stamp>
          )}
        </span>
      ),
    }),
    column.display({ id: "game", header: "Game", cell: ({ row }) => <span className="text-sm text-mist-300">{row.original.game || "Any"}</span> }),
    column.display({
      id: "steps",
      header: "Steps",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono text-xs tabular-nums text-mist-300">{figure(row.original.maxProgress || 100)}</span>,
    }),
    column.display({
      id: "points",
      header: "Points",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono text-xs tabular-nums text-mist-100">{figure(row.original.points)}</span>,
    }),
    column.display({
      id: "players",
      header: "Players",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono text-xs tabular-nums text-mist-100">{figure(row.original.awardedCount)}</span>,
    }),
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Achievements"
        description="What players unlock as they play, and the reward points each one is worth."
        refresh={[root]}
        actions={
          <Button size="sm" icon="plus" onClick={() => setEditing("new")}>
            New achievement
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Category"
          className="max-w-full overflow-x-auto scrollbar-none"
          value={(state.category || "all") as AchievementCategory | "all"}
          onChange={(category) => set({ category: category === "all" ? "" : category })}
          options={[{ value: "all", label: "All" }, ...CATEGORIES]}
        />
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search achievements" className="w-full sm:w-72" />
      </div>
      <DataTable
        columns={columns}
        data={achievements.data?.data ?? []}
        getRowId={(a) => a.id}
        onRowClick={setEditing}
        loading={achievements.isFetching}
        error={achievements.isError ? getApiErrorMessage(achievements.error, "Achievements didn't load.") : null}
        onRetry={() => void achievements.refetch()}
        minWidth="52rem"
        empty={{
          icon: "medal",
          title: state.search || state.category ? "No achievements match" : "No achievements yet",
          description: state.search || state.category ? "Try another search or category." : "Add the first one and players will see it on their profile.",
        }}
      />
      {achievements.data && achievements.data.total > LIMIT && (
        <TableFooter page={query.page} limit={LIMIT} total={achievements.data.total} onPage={(page) => set({ page: String(page) })} />
      )}
      {editing && (
        <AchievementDialog
          achievement={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message);
            void client.invalidateQueries({ queryKey: root });
          }}
        />
      )}
    </div>
  );
}
