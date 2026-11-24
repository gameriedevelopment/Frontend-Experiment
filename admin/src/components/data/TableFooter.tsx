import { Button } from "@/components/ui/Button";

/** Range, totals and previous/next for a server-paged table. */
export function TableFooter({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="font-mono text-xs tabular-nums text-mist-500">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-mist-500">
          Page {page} / {pages}
        </span>
        <Button tone="outline" size="xs" icon="arrowLeft" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <span className="sr-only">Previous page</span>
        </Button>
        <Button tone="outline" size="xs" icon="arrowRight" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}
