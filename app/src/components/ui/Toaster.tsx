import { AnimatePresence, m } from "motion/react";
import { createPortal } from "react-dom";
import { useToastStore, type ToastTone } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

const toneStyles: Record<ToastTone, { icon: IconName; mark: string }> = {
  success: { icon: "check", mark: "bg-signal text-ink-950" },
  info: { icon: "info", mark: "bg-lavender-400 text-ink-950" },
  error: { icon: "warning", mark: "bg-danger text-ink-950" },
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-28 z-60 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end lg:bottom-8 lg:right-8"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const tone = toneStyles[item.tone];
          return (
            <m.div
              key={item.id}
              layout
              role={item.tone === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink-800/95 p-3.5 pr-2.5 shadow-[0_24px_60px_-18px_rgb(0_0_0/0.9)] ring-1 ring-white/10 backdrop-blur-xl"
            >
              <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", tone.mark)}>
                <Icon name={tone.icon} weight="bold" className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 py-0.5">
                <span className="block text-sm font-semibold">{item.title}</span>
                {item.description && (
                  <span className="mt-0.5 block text-sm leading-snug text-mist-400">{item.description}</span>
                )}
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(item.id)}
                className="grid size-7 shrink-0 place-items-center rounded-full text-mist-500 transition-colors hover:bg-white/6 hover:text-mist-50"
              >
                <Icon name="close" className="size-3.5" />
              </button>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
