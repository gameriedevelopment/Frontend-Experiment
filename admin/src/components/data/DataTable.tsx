import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import type { MouseEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

export interface ColumnMeta {
  align?: "right";
  className?: string;
}

/** Server-paged rows. A row with an address opens it on click; links and buttons inside keep their own behaviour. */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  rowHref,
  onRowClick,
  loading,
  error,
  onRetry,
  empty,
  minWidth = "48rem",
  rowClassName,
}: {
  columns: ColumnDef<T, any>[];
  data: T[];
  getRowId: (row: T) => string;
  rowHref?: (row: T) => string;
  /** For rows that open a dialog rather than a page. */
  onRowClick?: (row: T) => void;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty: { icon: IconName; title: string; description?: ReactNode };
  minWidth?: string;
  rowClassName?: (row: T) => string | false | undefined;
}) {
  const navigate = useNavigate();
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getRowId });
  const open = (event: MouseEvent<HTMLTableRowElement>, href: string) => {
    if ((event.target as HTMLElement).closest("a, button, input, label, [role=menu]")) return;
    if (event.metaKey || event.ctrlKey) window.open(href, "_blank", "noopener");
    else navigate(href);
  };

  const state = error ? (
    <div className="grid justify-items-center gap-3 px-6 py-16 text-center">
      <Icon name="warning" className="size-6 text-danger" />
      <p className="max-w-sm text-sm text-mist-300">{error}</p>
      {onRetry && (
        <Button tone="outline" size="xs" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  ) : !loading && data.length === 0 ? (
    <div className="grid justify-items-center gap-2 px-6 py-16 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-white/4 text-mist-400">
        <Icon name={empty.icon} className="size-5" />
      </span>
      <p className="mt-2 text-sm font-semibold">{empty.title}</p>
      {empty.description && <p className="max-w-sm text-sm text-mist-400">{empty.description}</p>}
    </div>
  ) : null;

  return (
    <div className="relative min-w-0 overflow-hidden rounded-card bg-ink-900/70 ring-1 ring-inset ring-white/6">
      <div className="relative overflow-x-auto overscroll-x-contain scrollbar-thin">
        <table className="w-full border-collapse text-left text-[0.88rem]" style={{ minWidth }}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-white/6">
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn("type-label h-11 whitespace-nowrap px-4 text-[0.6rem] font-medium text-mist-500 first:pl-5 last:pr-5", meta?.align === "right" && "text-right")}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading && data.length === 0
              ? Array.from({ length: 8 }, (_, index) => (
                  <tr key={index} className="border-b border-white/4 last:border-0">
                    {columns.map((_, cell) => (
                      <td key={cell} className="h-[3.75rem] px-4 first:pl-5 last:pr-5">
                        <Skeleton className={cn("h-4 rounded-md", cell === 0 ? "w-44" : "w-16")} />
                      </td>
                    ))}
                  </tr>
                ))
              : !state &&
                table.getRowModel().rows.map((row) => {
                  const href = rowHref?.(row.original);
                  const click = href
                    ? (event: MouseEvent<HTMLTableRowElement>) => open(event, href)
                    : onRowClick
                      ? (event: MouseEvent<HTMLTableRowElement>) => {
                          if (!(event.target as HTMLElement).closest("a, button, input, label, [role=menu]")) onRowClick(row.original);
                        }
                      : undefined;
                  return (
                    <tr
                      key={row.id}
                      onClick={click}
                      className={cn(
                        "border-b border-white/4 transition-colors last:border-0",
                        click && "cursor-pointer hover:bg-white/3",
                        loading && "opacity-60",
                        rowClassName?.(row.original),
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                        return (
                          <td key={cell.id} className={cn("h-[3.75rem] px-4 align-middle first:pl-5 last:pr-5", meta?.align === "right" && "text-right", meta?.className)}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {state}
    </div>
  );
}
