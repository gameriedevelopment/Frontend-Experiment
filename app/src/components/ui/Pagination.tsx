import { cn } from "@/lib/cn";
import { Button } from "./Button";

type PageItem = number | "start-ellipsis" | "end-ellipsis";

export function pageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  if (currentPage >= totalPages - 3) return [1, "start-ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "start-ellipsis", currentPage - 1, currentPage, currentPage + 1, "end-ellipsis", totalPages];
}

/** Numbered pages for lists people return to, like rankings and records. Hidden when there's one page. */
export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-1.5">
      <Button tone="ghost" size="sm" icon="arrowLeft" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <span className="sr-only">Previous page</span>
      </Button>
      {pageItems(page, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPage(item)}
            className={cn(
              "grid size-10 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors",
              item === page ? "bg-lavender-400 text-ink-950" : "text-mist-300 hover:bg-white/6",
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-1 text-mist-500">
            …
          </span>
        ),
      )}
      <Button tone="ghost" size="sm" icon="arrowRight" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        <span className="sr-only">Next page</span>
      </Button>
    </nav>
  );
}
