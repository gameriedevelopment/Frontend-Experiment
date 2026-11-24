import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Kbd } from "@/components/layout/Kbd";
import { useQueue } from "@/features/queue/hooks";
import { cn } from "@/lib/cn";
import { ENVIRONMENT } from "@/lib/env";
import { useCurrentCrumb } from "./crumb";
import { navFor } from "./navigation";
import { usePalette } from "./palette";

const ENVIRONMENT_STYLE = {
  production: "bg-danger/12 text-danger ring-danger/35",
  staging: "bg-lavender-400/12 text-lavender-200 ring-lavender-400/30",
  local: "bg-white/5 text-mist-300 ring-white/12",
} as const;

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const current = navFor(pathname);
  const crumb = useCurrentCrumb();
  const deeper = Boolean(current && crumb && pathname !== current.to);
  const openPalette = usePalette((state) => state.setOpen);
  const queue = useQueue();
  const waiting = queue.data?.total ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/6 bg-ink-950/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="-ml-1 grid size-9 place-items-center rounded-lg text-mist-300 hover:bg-white/6 hover:text-mist-50 lg:hidden"
      >
        <Icon name="sidebar" className="size-5" />
      </button>

      <nav aria-label="Breadcrumb" className="type-label flex min-w-0 items-center gap-2 text-mist-500">
        <span className="hidden sm:inline">{current?.group ?? "Gamerie"}</span>
        <Icon name="chevronRight" className="hidden size-3 sm:block" />
        {deeper ? (
          <>
            <Link to={current!.to} className="hidden shrink-0 transition-colors hover:text-mist-100 sm:inline">
              {current!.label}
            </Link>
            <Icon name="chevronRight" className="hidden size-3 shrink-0 sm:block" />
            <span className="truncate normal-case tracking-normal text-mist-100">{crumb}</span>
          </>
        ) : (
          <span className="truncate text-mist-100">{current?.label ?? "Admin"}</span>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {ENVIRONMENT !== "local" && (
          <span className={cn("type-label hidden rounded-full px-2.5 py-1.5 ring-1 ring-inset sm:inline-flex", ENVIRONMENT_STYLE[ENVIRONMENT])}>{ENVIRONMENT}</span>
        )}
        <Link
          to="/queue"
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3 text-sm ring-1 ring-inset transition-colors",
            waiting ? "bg-lavender-400/10 text-lavender-100 ring-lavender-400/30 hover:bg-lavender-400/16" : "text-mist-400 ring-white/10 hover:text-mist-100",
          )}
        >
          <Icon name="queue" className="size-4" />
          <span className="tabular-nums">{queue.isLoading ? "…" : waiting ? `${waiting} waiting` : "Queue clear"}</span>
        </Link>
        <button
          type="button"
          onClick={() => openPalette(true)}
          aria-label="Search"
          className="flex h-9 items-center gap-2 rounded-full px-3 text-mist-400 ring-1 ring-inset ring-white/10 transition-colors hover:text-mist-100 lg:hidden"
        >
          <Icon name="search" className="size-4" />
          <Kbd className="hidden sm:inline-grid">⌘K</Kbd>
        </button>
      </div>
    </header>
  );
}
