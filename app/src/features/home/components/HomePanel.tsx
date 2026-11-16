import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

export function HomePanel({
  title,
  description,
  meta,
  link,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  link?: { label: string; to: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-mist-400">{description}</p>}
        </div>
        {meta && <div className="shrink-0 text-sm text-mist-400">{meta}</div>}
        {link && (
          <Link
            to={link.to}
            className="group flex shrink-0 items-center gap-1 text-sm font-medium text-mist-400 transition-colors hover:text-lavender-200"
          >
            {link.label}
            <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

export function PanelError({ onRetry }: { onRetry: () => void }) {
  return (
    <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-400">
      This didn't load.
      <button type="button" onClick={onRetry} className="font-semibold text-lavender-300 hover:text-lavender-200">
        Try again
      </button>
    </p>
  );
}

export function RowSkeletons({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <span className="grid flex-1 gap-2">
            <Skeleton className="h-3 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </span>
        </div>
      ))}
    </div>
  );
}
