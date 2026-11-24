import type { QueryKey } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { RefreshButton } from "@/components/data/RefreshButton";
import { cn } from "@/lib/cn";

/** One per page: the title, an optional line under it, and the page's own actions. */
export function PageHeader({
  title,
  description,
  actions,
  refresh,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Query key prefixes the refresh button reloads. */
  refresh?: QueryKey[];
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4", className)}>
      <div className="min-w-0 max-w-3xl">
        <h1 className="type-display text-display-sm text-mist-50">{title}</h1>
        {description && <p className="mt-2.5 text-[0.95rem] text-mist-400">{description}</p>}
      </div>
      {(actions || refresh) && (
        <div className="flex flex-wrap items-center gap-2">
          {refresh && <RefreshButton queryKeys={refresh} />}
          {actions}
        </div>
      )}
    </header>
  );
}
