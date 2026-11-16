import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { easeOutExpo } from "./motion";

const focusableSelector =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex='0']";

export function Dialog({
  open,
  title,
  description,
  onClose,
  dismissible = true,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  /** False while work is in flight, so Escape, the backdrop and the close button can't interrupt it. */
  dismissible?: boolean;
  size?: "md" | "lg";
  footer?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Refs keep the open effect from re-running (and stealing focus from inputs) when the parent re-renders.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissibleRef.current) onCloseRef.current();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const close = () => {
    if (dismissible) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid items-end justify-items-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              "relative flex max-h-[90svh] w-full flex-col overflow-hidden rounded-t-panel bg-ink-900 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] outline-none ring-1 ring-white/10 sm:rounded-card",
              size === "md" ? "sm:max-w-md" : "sm:max-w-2xl",
            )}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/6 px-6 py-4">
              <div className="min-w-0 pt-1.5">
                <h2 id={titleId} className="text-base font-semibold">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-mist-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                disabled={!dismissible}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50 disabled:opacity-40"
              >
                <Icon name="close" className="size-[1.1rem]" />
              </button>
            </header>
            <div
              className={cn(
                "overflow-y-auto [scrollbar-color:rgb(255_255_255/0.12)_transparent] [scrollbar-width:thin]",
                size === "md" ? "p-3" : "px-6 py-5",
              )}
            >
              {children}
            </div>
            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/6 px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
