import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ProfileSection({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-6 ring-1 ring-inset ring-white/6 sm:p-7", className)}>
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {meta && <div className="text-sm text-mist-400">{meta}</div>}
      </header>
      {children}
    </section>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-mist-500">{children}</p>;
}
