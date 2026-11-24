import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The console's working surface: a titled block with optional actions on the right. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-card bg-ink-900/70 ring-1 ring-inset ring-white/6", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[0.95rem] font-semibold text-mist-50">{title}</h2>}
            {description && <p className="mt-1 text-sm text-mist-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", (title || actions) && "pt-4 sm:pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}
