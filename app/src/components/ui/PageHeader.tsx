import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="type-label flex items-center gap-2.5 text-mist-400">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
            {eyebrow}
          </p>
        )}
        <h1 className="type-display mt-4 text-heading">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-mist-300">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
