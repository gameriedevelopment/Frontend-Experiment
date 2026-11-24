import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

const focusableSelector =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex='0']";

/** sm for a yes/no, md for a reason or a field or two, lg for a short form, xl for a workspace. */
const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-[40rem]",
  xl: "sm:max-w-5xl",
} as const;

export type DialogSize = keyof typeof sizes;

const tones = {
  brand: "bg-lavender-400/12 text-lavender-300 ring-lavender-400/25",
  danger: "bg-danger/12 text-danger ring-danger/25",
  signal: "bg-signal/12 text-signal ring-signal/25",
} as const;

export type DialogTone = keyof typeof tones;

export function Dialog({
  open,
  title,
  description,
  onClose,
  dismissible = true,
  size = "md",
  icon,
  tone = "brand",
  alert = false,
  footer,
  bodyClassName,
  children,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  /** False while work is in flight, so Escape, the backdrop and the close button can't interrupt it. */
  dismissible?: boolean;
  size?: DialogSize;
  /** A mark beside the title that says what kind of moment this is. */
  icon?: IconName;
  tone?: DialogTone;
  /** Announces as an alert dialog, for confirmations that interrupt. */
  alert?: boolean;
  footer?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
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
          <m.button
            type="button"
            aria-label="Close dialog"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-ink-950/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <m.div
            ref={panelRef}
            role={alert ? "alertdialog" : "dialog"}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              "relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-panel bg-ink-900 shadow-[0_40px_140px_-30px_rgb(0_0_0/0.95)] outline-none ring-1 ring-white/10 sm:max-h-[88svh] sm:rounded-card",
              sizes[size],
            )}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.9 }}
          >
            <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />
            <div
              aria-hidden="true"
              className="halftone pointer-events-none absolute inset-x-0 top-0 h-28 text-lavender-400/8 mask-[radial-gradient(70%_100%_at_100%_0%,black,transparent)]"
            />
            <header className="relative flex shrink-0 items-start gap-4 px-6 pb-4 pt-4 sm:pt-5">
              {icon && (
                <span
                  className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset", tones[tone])}
                >
                  <Icon name={icon} weight="duotone" className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 id={titleId} className="text-pretty break-words text-[1.05rem] font-semibold tracking-[-0.01em]">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 max-w-[60ch] text-pretty text-sm leading-relaxed text-mist-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                disabled={!dismissible}
                aria-label="Close"
                className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50 disabled:opacity-40"
              >
                <Icon name="close" className="size-[1.1rem]" />
              </button>
            </header>
            {children && (
              <div
                className={cn(
                  "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain border-t border-white/6 px-6 py-5 scrollbar-thin",
                  bodyClassName,
                )}
              >
                {children}
              </div>
            )}
            {footer && (
              <footer className="relative flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/6 bg-ink-900 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:*:flex-1 sm:pb-4">
                {footer}
              </footer>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
