import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

const GAP = 6;
const EDGE = 8;

/**
 * Places a floating panel (rendered in a portal) against its trigger: below when it fits, above when it
 * doesn't, and always inside the viewport horizontally. Closes on an outside press, Escape, a page scroll
 * or a resize, since a fixed panel would otherwise drift away from its trigger.
 */
export function useAnchoredLayer({
  open,
  onClose,
  anchorRef,
  panelRef,
  align = "start",
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  align?: "start" | "end";
}) {
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", top: 0, left: 0, visibility: "hidden" });

  useLayoutEffect(() => {
    // On close the last position is kept, so exit animations play where the panel was.
    if (!open) return;
    const anchor = anchorRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const below = anchor.bottom + GAP + height <= window.innerHeight - EDGE || anchor.top < height + GAP + EDGE;
    const preferred = align === "end" ? anchor.right - width : anchor.left;
    const left = Math.max(EDGE, Math.min(preferred, window.innerWidth - width - EDGE));
    setStyle({ position: "fixed", left, ...(below ? { top: anchor.bottom + GAP } : { bottom: window.innerHeight - anchor.top + GAP }) });
  }, [align, anchorRef, open, panelRef]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      anchorRef.current?.focus();
    };
    const onScroll = (event: Event) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchorRef, onClose, open, panelRef]);

  return style;
}
