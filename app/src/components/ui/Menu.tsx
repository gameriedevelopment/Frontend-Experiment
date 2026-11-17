import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

export interface MenuItem {
  label: string;
  icon?: IconName;
  danger?: boolean;
  /** Marks the current choice when the menu picks a value. */
  checked?: boolean;
  onSelect: () => void;
}

/**
 * A small action menu behind an icon button. Closes on selection, Escape, an outside click or a scroll.
 * The list renders in a layer above the page, so cards with clipped corners never cut it off.
 */
export function Menu({
  label,
  items,
  trigger,
  triggerClassName,
  align = "end",
}: {
  label: string;
  items: MenuItem[];
  trigger?: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const toggle = () => {
    if (open) return setOpen(false);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const estimated = Math.min(320, items.length * 40 + 16);
      const flip = rect.bottom + estimated + 12 > window.innerHeight && rect.top > estimated + 12;
      setPlace({
        position: "fixed",
        ...(flip ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
        ...(align === "end" ? { right: Math.max(8, window.innerWidth - rect.right) } : { left: Math.max(8, rect.left) }),
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event.type === "scroll" && listRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        className={triggerClassName ?? "grid size-9 place-items-center rounded-full text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50"}
      >
        {trigger ?? <Icon name="more" weight="bold" className="size-5" />}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
          <motion.ul
            ref={listRef}
            id={id}
            role="menu"
            style={place}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="z-60 max-h-80 min-w-44 overflow-y-auto rounded-2xl bg-ink-800 p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10 scrollbar-thin scrollbar-thumb-white/12 scrollbar-track-transparent"
          >
            {items.map((item) => (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role={item.checked === undefined ? "menuitem" : "menuitemradio"}
                  aria-checked={item.checked}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/6",
                    item.danger ? "text-danger" : "text-mist-100",
                  )}
                >
                  {item.icon && <Icon name={item.icon} className="size-4" />}
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {item.checked && <Icon name="check" weight="bold" className="size-3.5 text-lavender-300" />}
                </button>
              </li>
            ))}
          </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
