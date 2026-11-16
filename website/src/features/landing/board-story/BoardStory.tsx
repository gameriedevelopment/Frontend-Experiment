import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { useSmoothScroll } from "@/app/SmoothScroll";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";
import { PlayerCard } from "./PlayerCard";
import { useBoardScene } from "./scene/useBoardScene";
import { chapterAt, milestonesAt, storyChapters, type StoryChapter } from "./story-content";
import {
  ChapterCopy,
  CopyScrim,
  HeroOverlay,
  MilestoneHud,
  StageBackdrop,
  StoryFooter,
} from "./StoryOverlays";

const STORY_TRAVEL_SVH = 540;

export function BoardStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const { canvasRef, failed } = useBoardScene(scrollYProgress, heroTitleRef);
  const { scrollTo } = useSmoothScroll();
  const [active, setActive] = useState(-1);
  const [unlocked, setUnlocked] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(chapterAt(value));
    setUnlocked(milestonesAt(value));
  });

  const jumpTo = (chapter: StoryChapter) => {
    const section = sectionRef.current;
    if (!section) return;
    const travel = section.offsetHeight - window.innerHeight;
    scrollTo(section.offsetTop + chapter.focus * travel);
  };

  return (
    <section
      ref={sectionRef}
      aria-label="How Gamerie works"
      className="relative h-[640svh]"
    >
      <span
        id="platform"
        aria-hidden="true"
        className="absolute inset-x-0"
        style={{ top: `${storyChapters[0].focus * STORY_TRAVEL_SVH}svh` }}
      />

      <div className="sticky top-0 h-svh overflow-hidden bg-ink-950">
        <StageBackdrop progress={scrollYProgress} />
        {failed ? (
          <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
            <TokenMark className="h-[42svh] text-lavender-400/80" />
          </div>
        ) : (
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
        )}

        <CopyScrim progress={scrollYProgress} />
        <HeroOverlay
          progress={scrollYProgress}
          titleRef={heroTitleRef}
          onExplore={() => jumpTo(storyChapters[0])}
        />
        <ChapterCopy active={active} />
        <MilestoneHud unlocked={active >= 0 ? unlocked : 0} className="lg:hidden" />

        <div className="pointer-events-none absolute inset-y-0 right-gutter z-10 hidden items-center lg:flex">
          <div
            className={cn(
              "transition-[opacity,translate] duration-700 ease-out-expo [@media(max-height:820px)]:origin-right [@media(max-height:820px)]:scale-90",
              active >= 0 ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0",
            )}
          >
            <PlayerCard unlocked={unlocked} className="pointer-events-auto" />
          </div>
        </div>

        <StoryFooter progress={scrollYProgress} active={active} onSelect={jumpTo} />
      </div>

      <ol className="sr-only">
        {storyChapters.map((chapter) => (
          <li key={chapter.id}>
            {chapter.label}: {chapter.title.join(" ")} {chapter.copy}
          </li>
        ))}
      </ol>
    </section>
  );
}
