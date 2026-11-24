import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";

/** The top of every dossier: cover, mark, name, status stamps, facts and the record's actions. */
export function DossierHeader({
  title,
  image,
  cover,
  square,
  stamps,
  meta,
  actions,
  idLabel,
}: {
  title: string;
  image: string | null;
  cover: string | null;
  square?: boolean;
  stamps?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Shown first in the facts line, with a copy button. */
  idLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <header className="relative overflow-hidden rounded-card bg-ink-900 ring-1 ring-inset ring-white/6">
      <div aria-hidden="true" className={cn("relative overflow-hidden", cover ? "h-32 sm:h-40" : "h-20")}>
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
        ) : (
          <div className="absolute -top-24 left-1/4 h-48 w-2/3 rounded-full bg-lavender-400/10 blur-3xl" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-ink-900" />
      </div>
      <div className={cn("relative flex flex-wrap items-end gap-x-6 gap-y-5 px-5 pb-6 sm:px-7", cover ? "-mt-14" : "-mt-8")}>
        <Avatar
          src={image ?? undefined}
          name={title}
          size="xl"
          tone={square ? "ink" : "brand"}
          shape={square ? "square" : "circle"}
          className={cn("ring-4 ring-ink-900", square ? "rounded-[28%]" : "rounded-full")}
        />
        <div className="min-w-0 flex-1 basis-72">
          <h1 className="type-display break-words text-display-sm leading-none">{title}</h1>
          {stamps && <div className="mt-3 flex flex-wrap gap-1.5">{stamps}</div>}
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-mist-400">
            {idLabel && (
              <button
                type="button"
                onClick={() => void copyText(idLabel).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1500)))}
                className="group flex items-center gap-1.5 text-mist-200 transition-colors hover:text-mist-50"
                aria-label={`Copy ${idLabel}`}
              >
                {idLabel}
                <Icon name={copied ? "check" : "copy"} className={cn("size-3", copied ? "text-signal" : "text-mist-500 group-hover:text-mist-200")} />
              </button>
            )}
            {meta}
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function DossierSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Skeleton className="h-64 rounded-card" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-card lg:col-span-2" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}
