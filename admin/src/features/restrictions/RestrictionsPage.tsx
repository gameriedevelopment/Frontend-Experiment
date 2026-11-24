import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { DataTable } from "@/components/data/DataTable";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { entityPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { AddRestrictionDialog } from "./AddRestrictionDialog";
import { liftRestriction, listRestrictions, type Restriction, type RestrictionSource } from "./api";

const column = createColumnHelper<Restriction>();

export function RestrictionsPage() {
  useDocumentTitle("Restrictions");
  const client = useQueryClient();
  const [state, set] = useQueryState({ source: "" });
  const restrictions = useQuery({ queryKey: ["admin", "restrictions"], queryFn: listRestrictions });
  const [lifting, setLifting] = useState<Restriction | null>(null);
  const [adding, setAdding] = useState(false);
  const all = restrictions.data?.rows ?? [];
  const rows = state.source ? all.filter((row) => row.source === state.source) : all;
  const count = (source: RestrictionSource) => all.filter((row) => row.source === source).length;
  const refresh = () => {
    for (const key of [["admin", "restrictions"], ["admin", "people"], ["admin", "users"], ["admin", "teams"], ["admin", "hubs"]]) void client.invalidateQueries({ queryKey: key });
  };

  const columns = [
    column.display({
      id: "subject",
      header: "Who",
      cell: ({ row: { original: r } }) => (
        <Link to={entityPath(r.subject.kind, r.subject.id)} className="flex min-w-0 items-center gap-3">
          <Avatar src={r.subject.image ?? undefined} name={r.subject.name} size="sm" tone={r.subject.kind === "user" ? "brand" : "ink"} shape={r.subject.kind === "user" ? "circle" : "square"} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-mist-50">{r.subject.name}</span>
            <span className="block font-mono text-[0.68rem] capitalize text-mist-500">{r.subject.kind === "user" ? "player" : r.subject.kind}</span>
          </span>
        </Link>
      ),
    }),
    column.display({
      id: "what",
      header: "Restriction",
      cell: ({ row: { original: r } }) => (
        <span className="flex flex-wrap items-center gap-2">
          <Stamp tone="danger">{r.kind === "banned" ? "Banned" : "Locked"}</Stamp>
          <span className="text-sm text-mist-200">{r.what}</span>
        </span>
      ),
    }),
    column.display({
      id: "reason",
      header: "Reason",
      cell: ({ row: { original: r } }) =>
        r.reason ? <span className="line-clamp-2 max-w-sm text-sm text-mist-300">{r.reason}</span> : <span className="text-xs text-mist-500">On their admin history</span>,
    }),
    column.display({ id: "since", header: "Since", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.since)}</span> }),
    column.display({
      id: "lift",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Button tone="ghost" size="xs" onClick={() => setLifting(row.original)}>
          Lift
        </Button>
      ),
    }),
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Restrictions"
        description="Every ban and lock on Gamerie in one place."
        refresh={[["admin", "restrictions"]]}
        actions={
          <Button size="sm" icon="plus" onClick={() => setAdding(true)}>
            Add restriction
          </Button>
        }
      />
      <SegmentStrip
        loading={restrictions.isLoading}
        active={state.source || null}
        onPick={(key) => set({ source: key && key !== "all" ? key : "" })}
        segments={[
          { key: "all", label: "All", value: restrictions.data ? all.length : undefined, hint: "Active right now" },
          { key: "account", label: "Accounts", value: restrictions.data ? count("account") : undefined, tone: "danger", hint: "Banned players" },
          { key: "community", label: "Teams and hubs", value: restrictions.data ? count("community") : undefined, tone: "danger", hint: "Banned communities" },
          { key: "creator", label: "Ladders and leagues", value: restrictions.data ? count("creator") : undefined, hint: "Can't create" },
          { key: "hosting", label: "Tournaments", value: restrictions.data ? count("hosting") : undefined, hint: "Can't host" },
        ]}
      />
      {restrictions.data && restrictions.data.failed.length > 0 && (
        <Notice tone="danger">
          {restrictions.data.failed.join(", ").replace(/^./, (first) => first.toUpperCase())} didn't load, so this list may be missing some. Refresh to try again.
        </Notice>
      )}
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.key}
        loading={restrictions.isLoading}
        error={restrictions.isError ? getApiErrorMessage(restrictions.error, "Restrictions didn't load.") : null}
        onRetry={() => void restrictions.refetch()}
        minWidth="52rem"
        empty={{ icon: "shield", title: "No one is restricted", description: state.source ? "Nothing in this group." : "Bans and locks you add show up here." }}
      />
      {lifting && (
        <ReasonDialog
          title={`Lift this restriction on ${lifting.subject.name}?`}
          description={`${lifting.what}. They can do it again straight away.`}
          confirmLabel="Lift"
          icon="check"
          tone="brand"
          askReason={lifting.source === "account" || lifting.source === "community"}
          onClose={() => setLifting(null)}
          onConfirm={(reason) =>
            liftRestriction(lifting, reason).then(() => {
              toast.success("Restriction lifted");
              refresh();
            })
          }
        />
      )}
      {adding && (
        <AddRestrictionDialog
          onClose={() => setAdding(false)}
          onAdded={() => {
            toast.success("Restriction added");
            refresh();
          }}
        />
      )}
    </div>
  );
}
