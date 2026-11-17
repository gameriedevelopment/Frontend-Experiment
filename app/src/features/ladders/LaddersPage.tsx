import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { LadderCard } from "./components/LadderCard";
import { useLadders } from "./hooks";
import type { LadderEntrantType, LadderFilters, LadderView } from "./types";

const views: Array<{ id: LadderView; label: string }> = [
  { id: "active", label: "All open" },
  { id: "in_progress", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Finished" },
  { id: "mine", label: "Yours" },
];

export function LaddersPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("view") as LadderView | null;
  const view: LadderView = views.some((item) => item.id === requested) ? requested! : "active";
  const entry = (params.get("entry") as LadderEntrantType | null) ?? null;
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());
  const filters = useMemo<LadderFilters>(() => ({ view, search: term || undefined, entrantType: entry ?? undefined }), [entry, term, view]);
  const query = useLadders(filters);
  const ladders = query.data?.pages.flatMap((page) => page.items) ?? [];

  const set = (key: string, value?: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  useEffect(() => {
    setParams(
      (current) => {
        if ((current.get("q") ?? "") === term) return current;
        const next = new URLSearchParams(current);
        if (term) next.set("q", term);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [setParams, term]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Ladders"
        description="Season-long tables. Challenge anyone on the ladder, win to climb, and hold your place until the season ends."
        actions={
          <LinkButton to="/ladders/create" icon="plus">
            Start a ladder
          </LinkButton>
        }
      />

      <div className="grid gap-5">
        <Tabs label="Ladder views" items={views} value={view} onChange={(next) => set("view", next === "active" ? undefined : next)} indicatorId="ladder-view" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search ladders</span>
            <Icon name="search" className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or game"
              className={cn(inputClasses, "h-11 pl-11 text-sm")}
            />
          </label>
          <Segmented
            label="Entry"
            value={entry ?? "any"}
            onChange={(value) => set("entry", value === "any" ? undefined : value)}
            options={[
              { value: "any", label: "Any" },
              { value: "player", label: "Solo" },
              { value: "team", label: "Teams" },
            ]}
          />
        </div>
      </div>

      {query.isLoading ? (
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-88 rounded-card" />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Ladders didn't load"
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : ladders.length ? (
        <div className="grid gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ladders.map((ladder) => (
              <LadderCard key={ladder.id} ladder={ladder} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="flex justify-center">
              <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <StatePanel
          icon="ladders"
          title={term ? "Nothing matches that search" : view === "mine" ? "You're not on a ladder yet" : "No ladders here yet"}
          description={
            term ? "Try another name or game." : "Start one for your game, team or hub. Players challenge each other all season and the table updates itself."
          }
          action={
            term ? undefined : (
              <LinkButton to="/ladders/create" size="sm" icon="plus">
                Start a ladder
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
