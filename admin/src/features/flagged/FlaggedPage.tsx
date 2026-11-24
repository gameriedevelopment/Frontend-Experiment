import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { plainText } from "@/lib/richText";
import { formatDate } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { listFlagged, removeFlagged, type FlaggedItem, type FlaggedKind } from "./api";

/** Posts and comments with reports against them, most reported first. */
export function FlaggedPage() {
  useDocumentTitle("Flagged content");
  const [state, set] = useQueryState({ kind: "posts", page: "1" });
  const kind = (state.kind === "comments" ? "comments" : "posts") as FlaggedKind;
  const page = Math.max(1, Number(state.page) || 1);
  const client = useQueryClient();
  const flagged = useQuery({ queryKey: ["admin", "flagged", kind, page], queryFn: () => listFlagged(kind, page), placeholderData: keepPreviousData });
  const [removing, setRemoving] = useState<FlaggedItem | null>(null);
  const rows = flagged.data?.data ?? [];
  const noun = kind === "posts" ? "post" : "comment";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Flagged content" description="Everything reported at least once, most reported first." refresh={[["admin", "flagged"]]} />
      <Segmented
        label="Content"
        value={kind}
        onChange={(next) => set({ kind: next })}
        className="w-fit"
        options={[
          { value: "posts", label: "Posts" },
          { value: "comments", label: "Comments" },
        ]}
      />
      {flagged.isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36 rounded-card" />
          ))}
        </div>
      ) : flagged.isError ? (
        <p className="rounded-card bg-ink-900/70 p-8 text-center text-sm text-mist-300 ring-1 ring-inset ring-white/6">{getApiErrorMessage(flagged.error, "Flagged content didn't load.")}</p>
      ) : rows.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-card bg-ink-900/70 px-6 py-20 text-center ring-1 ring-inset ring-white/6">
          <span className="grid size-12 place-items-center rounded-full bg-signal/12 text-signal">
            <Icon name="check" weight="bold" className="size-5" />
          </span>
          <p className="font-semibold">No flagged {kind}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {rows.map((item) => {
            const postId = kind === "posts" ? item.id : (item.post?.id ?? item.postId ?? null);
            return (
              <li key={item.id} className="grid gap-4 rounded-card bg-ink-900/70 p-5 ring-1 ring-inset ring-white/6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    {item.authorId ? (
                      <Link to={`/users/${item.authorId}`} className="font-semibold hover:text-lavender-200">
                        {item.authorName ?? "Unknown"}
                      </Link>
                    ) : (
                      <span className="font-semibold">{item.authorName ?? "Unknown"}</span>
                    )}
                    <span className="font-mono text-xs text-mist-500">{formatDate(item.createdAt)}</span>
                    <Stamp tone="danger" icon="flag">
                      {item.reportCount} {item.reportCount === 1 ? "report" : "reports"}
                    </Stamp>
                    {item.lastReportedAt && <span className="font-mono text-xs text-mist-500">last {timeAgo(item.lastReportedAt)}</span>}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mist-200">{plainText(item.content) || "No text"}</p>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                  {postId && (
                    <ButtonLink href={playerAppLink(`/post/${postId}`)} external tone="outline" size="xs" icon="open">
                      View
                    </ButtonLink>
                  )}
                  <Button tone="ghost" size="xs" icon="trash" className="text-mist-400 hover:text-danger" onClick={() => setRemoving(item)}>
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {flagged.data && flagged.data.total > 20 && <TableFooter page={page} limit={20} total={flagged.data.total} onPage={(next) => set({ page: String(next) })} />}
      {removing && (
        <ReasonDialog
          title={`Remove this ${noun}?`}
          description="It's taken down for everyone. Your reason goes on the audit log."
          confirmLabel={`Remove ${noun}`}
          icon="trash"
          onClose={() => setRemoving(null)}
          onConfirm={(reason) =>
            removeFlagged(kind, removing.id, reason).then(() => {
              toast.info(`The ${noun} was removed`);
              void client.invalidateQueries({ queryKey: ["admin", "flagged"] });
              void client.invalidateQueries({ queryKey: ["admin", "reports"] });
            })
          }
        />
      )}
    </div>
  );
}
