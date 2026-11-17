import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const EmojiPanel = lazy(() => import("./EmojiPanel"));
const PANEL = { width: 320, height: 420 };

/** A smiley button that opens the emoji picker above the page, flipping below when there's no room above. */
export function EmojiButton({ onPick, onOpenChange, className }: { onPick: (emoji: string) => void; onOpenChange?: (open: boolean) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) return setOpen(false);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const above = rect.top > PANEL.height + 16;
      const left = Math.min(Math.max(8, rect.left - 8), window.innerWidth - PANEL.width - 8);
      setPlace({ position: "fixed", left, ...(above ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }) });
    }
    setOpen(true);
  };

  useEffect(() => onOpenChange?.(open), [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onResize = () => setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Add emoji"
        aria-expanded={open}
        title="Emoji"
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
        className={cn("grid size-9 shrink-0 place-items-center rounded-full text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50", open && "bg-white/6 text-mist-50", className)}
      >
        <Icon name="smiley" className="size-[1.15rem]" />
      </button>
      {open &&
        createPortal(
          <div ref={panelRef} style={place} className="z-60 overflow-hidden rounded-[20px] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
            <Suspense fallback={<div className="grid h-105 w-80 place-items-center bg-ink-800 text-sm text-mist-500">Loading emoji…</div>}>
              <EmojiPanel onSelect={onPick} />
            </Suspense>
          </div>,
          document.body,
        )}
    </>
  );
}
