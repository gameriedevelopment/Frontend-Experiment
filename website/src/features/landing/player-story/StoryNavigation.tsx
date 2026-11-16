import type { KeyboardEvent } from "react";
import { GamerieIcon } from "../../../components/ui/GamerieIcon";
import { chapters, lastChapter } from "./story-content";

interface StoryNavigationProps {
  id: string;
  active: number;
  onSelect: (index: number) => void;
}

export function StoryNavigation({
  id,
  active,
  onSelect,
}: StoryNavigationProps) {
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    const nextByKey: Record<string, number> = {
      ArrowLeft: current === 0 ? lastChapter : current - 1,
      ArrowRight: current === lastChapter ? 0 : current + 1,
      Home: 0,
      End: lastChapter,
    };
    const next = nextByKey[event.key];
    if (typeof next !== "number") return;
    event.preventDefault();
    event.currentTarget.parentElement
      ?.querySelectorAll("button")
      [next]?.focus({ preventScroll: true });
    onSelect(next);
  }

  return (
    <div className="relative z-30 w-full px-gutter pt-2 pb-4 md:pb-6">
      <div aria-hidden="true" className="relative h-px bg-white/18">
        <div className="absolute inset-y-0 left-0 w-full origin-left scale-x-[var(--story-progress,0)] bg-brand" />
      </div>
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 sm:grid-cols-4 sm:gap-x-5"
        role="tablist"
        aria-label="Explore the Gamerie platform"
      >
        {chapters.map(({ id: chapterId, label, icon }, index) => (
          <button
            key={chapterId}
            id={`${id}-tab-${chapterId}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`${id}-panel-${chapterId}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => handleKey(event, index)}
            className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-1 text-left text-[.78rem] font-bold text-secondary motion-safe:transition-colors hover:text-white aria-selected:text-brand-light sm:gap-3 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-brand/21 bg-brand/8 text-brand-light motion-safe:transition-colors group-aria-selected:border-brand group-aria-selected:bg-brand group-aria-selected:text-stage sm:size-8">
              <GamerieIcon name={icon} size={17} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
