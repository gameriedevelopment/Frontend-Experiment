import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const isVideo = (source: string, mediaType?: string | null) => mediaType === "video" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(source);

function Viewer({ items, index, onIndex, onClose }: { items: string[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndex(Math.min(items.length - 1, index + 1));
      if (event.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [index, items.length, onClose, onIndex]);

  return createPortal(
    <m.div
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${items.length}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/95 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <m.img
        key={items[index]}
        src={items[index]}
        alt=""
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-h-[88svh] max-w-full rounded-2xl object-contain"
        onClick={(event) => event.stopPropagation()}
      />
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/8 text-mist-100 hover:bg-white/14"
      >
        <Icon name="close" className="size-5" />
      </button>
      {items.length > 1 && (
        <>
          {[
            [-1, "arrowLeft", "left-4"],
            [1, "arrowRight", "right-4"],
          ].map(([delta, icon, side]) => (
            <button
              key={side as string}
              type="button"
              aria-label={delta === -1 ? "Previous image" : "Next image"}
              disabled={delta === -1 ? index === 0 : index === items.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                onIndex(index + (delta as number));
              }}
              className={cn(
                "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/8 text-mist-100 hover:bg-white/14 disabled:opacity-30",
                side as string,
              )}
            >
              <Icon name={icon as "arrowLeft" | "arrowRight"} className="size-5" />
            </button>
          ))}
          <span className="type-label absolute bottom-5 left-1/2 -translate-x-1/2 text-mist-300">
            {index + 1} / {items.length}
          </span>
        </>
      )}
    </m.div>,
    document.body,
  );
}

/** One to four images in a tidy grid, with the rest behind a count. Images open full screen. */
export function PostMedia({ media, mediaType }: { media: string[]; mediaType?: string | null }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!media.length) return null;
  const images = media.filter((source) => !isVideo(source, mediaType));
  const videos = media.filter((source) => isVideo(source, mediaType));
  const shown = images.slice(0, 4);

  return (
    <div className="grid gap-2">
      {videos.map((source) => (
        <video key={source} src={source} controls preload="metadata" className="max-h-128 w-full rounded-2xl bg-ink-950 ring-1 ring-white/8" />
      ))}
      {shown.length > 0 && (
        <div className={cn("grid gap-1.5 overflow-hidden rounded-2xl", shown.length > 1 && "grid-cols-2", shown.length === 3 && "grid-rows-2")}>
          {shown.map((source, index) => (
            <button
              key={source}
              type="button"
              aria-label={`Open image ${index + 1}`}
              onClick={() => setOpen(index)}
              className={cn(
                "group relative overflow-hidden bg-ink-850",
                shown.length === 1 ? "max-h-120" : "aspect-square",
                shown.length === 3 && index === 0 && "row-span-2 aspect-auto",
              )}
            >
              <img src={source} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 group-hover:scale-102" />
              {index === 3 && images.length > 4 && (
                <span className="type-display absolute inset-0 grid place-items-center bg-ink-950/60 text-2xl">+{images.length - 4}</span>
              )}
            </button>
          ))}
        </div>
      )}
      <AnimatePresence>{open !== null && <Viewer items={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}
