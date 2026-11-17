import { AnimatePresence, m } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function SettingsCard({ title, description, action, children, className }: { title: string; description?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <header className={cn("flex items-start justify-between gap-4", children && "mb-5")}>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-mist-400">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Rows separated by hairlines, for lists of switches or account details. */
export function SettingsRows({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,1fr)] divide-y divide-white/6 [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">{children}</div>;
}

/** Appears while a section has unsaved edits; also asks before the tab is closed. */
export function SaveBar({ dirty, saving, onDiscard, onSave }: { dirty: boolean; saving: boolean; onDiscard: () => void; onSave: () => void }) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <AnimatePresence>
      {dirty && (
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18 }}
          className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 lg:bottom-6"
        >
          <div role="region" aria-label="Unsaved changes" className="flex items-center gap-2 rounded-2xl bg-ink-800/95 p-2 pl-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10 backdrop-blur">
            <p className="min-w-0 flex-1 truncate text-sm text-mist-200">Unsaved changes</p>
            <Button tone="ghost" size="sm" disabled={saving} onClick={onDiscard}>
              Discard
            </Button>
            <Button size="sm" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
