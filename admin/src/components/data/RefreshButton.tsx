import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** Reloads a page's data. Keys are prefixes, so ["admin", "users"] covers every users query. */
export function RefreshButton({ queryKeys, className }: { queryKeys: QueryKey[]; className?: string }) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    await Promise.allSettled([
      ...queryKeys.map((queryKey) => client.invalidateQueries({ queryKey })),
      new Promise((resolve) => setTimeout(resolve, 600)),
    ]);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      aria-label="Refresh"
      title="Refresh"
      aria-busy={busy}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-mist-300 ring-1 ring-inset ring-white/12 transition-colors hover:bg-white/6 hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender-400",
        className,
      )}
    >
      <Icon name="refresh" weight="bold" className={cn("size-4", busy && "animate-spin")} />
    </button>
  );
}
