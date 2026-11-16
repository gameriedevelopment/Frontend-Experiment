import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import type { RefObject } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo, Marquee } from "@/components/ui/motion";
import { Eyebrow } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { links } from "@/config/links";
import { cn } from "@/lib/cn";
import { cardMilestones, HERO_END, storyChapters, type StoryChapter } from "./story-content";

const heroLines = ["Your game,", "on the record."] as const;

const tickerSteps = [
  "Profile created",
  "Games connected",
  "Squad found",
  "Team formed",
  "Challenge accepted",
  "Result verified",
  "Record updated",
];

export function StageBackdrop({ progress }: { progress: MotionValue<number> }) {
  const glow = useTransform(
    progress,
    [0, 0.3, 0.5, 0.72, 0.88, 1],
    ["#c6a3ff", "#b48ef5", "#8967bd", "#aa82e8", "#aa82e8", "#c6a3ff"],
  );
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <motion.div
        style={{ backgroundColor: glow }}
        className="absolute inset-0 opacity-[0.14] [mask-image:radial-gradient(52%_48%_at_50%_44%,black,transparent)]"
      />
      <div className="halftone absolute inset-0 text-white/[0.045] [mask-image:radial-gradient(75%_65%_at_50%_42%,black,transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}

export function CopyScrim({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.08, HERO_END + 0.02], [0, 1]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[52%] bg-gradient-to-r from-ink-950/90 via-ink-950/55 to-transparent lg:block"
    />
  );
}

export function HeroOverlay({
  progress,
  onExplore,
  titleRef,
}: {
  progress: MotionValue<number>;
  onExplore: () => void;
  titleRef: RefObject<HTMLHeadingElement>;
}) {
  const opacity = useTransform(progress, [0.012, 0.065], [1, 0]);
  const y = useTransform(progress, [0, 0.08], [0, -70]);
  const pointerEvents = useTransform(progress, (value) => (value < 0.04 ? "auto" : "none"));

  return (
    <motion.div
      style={{ opacity, y, pointerEvents }}
      className="absolute inset-0 z-10 flex flex-col px-gutter pb-20 pt-28 sm:pb-24 sm:pt-32"
    >
      <h1 ref={titleRef} className="type-display text-center text-display-xl">
        {heroLines.map((line, index) => (
          <span key={line} className="block overflow-hidden pb-[0.05em]">
            <motion.span
              className={cn("block", index === 1 && "text-lavender-400")}
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.15 + index * 0.1, ease: easeOutExpo }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.div
        className="mx-auto mt-auto grid w-full max-w-shell items-end gap-6 lg:grid-cols-12"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.55, ease: easeOutExpo }}
      >
        <div className="lg:col-span-4">
          <Eyebrow>The verified platform for competitive gamers</Eyebrow>
          <p className="mt-4 max-w-sm text-lead text-mist-300">
            Build a player identity, find people worth playing with, run a real team, and turn every result into a record that follows you.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:col-start-7 lg:justify-end">
          <ButtonLink href={links.register} size="lg" icon="arrowUpRight" orb>
            Create your player ID
          </ButtonLink>
          <Button tone="outline" size="lg" icon="arrowDown" onClick={onExplore} className="hidden sm:inline-flex">
            See how it plays
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StoryFooter({
  progress,
  active,
  onSelect,
}: {
  progress: MotionValue<number>;
  active: number;
  onSelect: (chapter: StoryChapter) => void;
}) {
  const tickerOpacity = useTransform(progress, [0.02, 0.06], [1, 0]);
  const railOpacity = useTransform(progress, [0.07, HERO_END], [0, 1]);
  const railEvents = useTransform(progress, (value) => (value > 0.08 ? "auto" : "none"));
  const fill = useTransform(progress, [HERO_END, 1], [0, 1]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      <motion.div
        style={{ opacity: tickerOpacity }}
        className="border-t border-white/8 bg-ink-950/60 py-3.5 backdrop-blur-md"
        aria-hidden="true"
      >
        <Marquee duration={45}>
          {tickerSteps.map((step) => (
            <span key={step} className="type-label flex items-center gap-3 px-5 text-mist-400">
              <span className="size-1.5 rounded-full bg-signal" />
              {step}
              <Icon name="arrowRight" className="size-3.5 text-mist-500" />
            </span>
          ))}
        </Marquee>
      </motion.div>

      <motion.nav
        aria-label="Story chapters"
        style={{ opacity: railOpacity, pointerEvents: railEvents }}
        className="absolute inset-x-0 bottom-0 px-gutter pb-5"
      >
        <div className="mx-auto max-w-shell">
          <div className="relative h-px bg-white/12">
            <motion.div style={{ scaleX: fill }} className="absolute inset-0 origin-left bg-lavender-400" />
          </div>
          <ol className="mt-3.5 grid grid-cols-4 gap-2">
            {storyChapters.map((chapter, index) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => onSelect(chapter)}
                  aria-current={index === active ? "step" : undefined}
                  className={cn(
                    "type-label flex items-center gap-2 py-1 transition-colors duration-300",
                    index === active ? "text-mist-50" : "text-mist-500 hover:text-mist-300",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full transition-colors duration-300",
                      index <= active ? "bg-lavender-400" : "bg-white/20",
                    )}
                  />
                  {chapter.index}
                  <span className="hidden sm:inline">{chapter.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </motion.nav>
    </div>
  );
}

const copyItem = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: easeOutExpo } },
  exit: { opacity: 0, y: -14, filter: "blur(6px)", transition: { duration: 0.3 } },
};

const titleLine = {
  hidden: { y: "105%" },
  visible: { y: 0, transition: { duration: 0.9, ease: easeOutExpo } },
  exit: { y: "-105%", transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] as const } },
};

export function ChapterCopy({ active }: { active: number }) {
  const chapter = storyChapters[active];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-10 px-gutter pb-24 pt-32 transition-opacity duration-500 lg:inset-y-0 lg:flex lg:items-center lg:py-0",
        "bg-gradient-to-t from-ink-950 via-ink-950/85 to-transparent lg:bg-none",
        chapter ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="mx-auto w-full max-w-shell">
        <AnimatePresence mode="wait">
          {chapter && (
            <motion.div
              key={chapter.id}
              className="max-w-[30rem]"
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ staggerChildren: 0.07 }}
            >
              <motion.p variants={copyItem} className="type-label flex items-center gap-3 text-mist-400">
                <span className="text-lavender-400">{chapter.index}</span>
                <span>/ 04</span>
                <span className="h-px w-8 bg-white/20" />
                <span className="text-mist-200">{chapter.label}</span>
              </motion.p>
              <h2 className="type-display mt-5 text-display-md">
                {chapter.title.map((line, index) => (
                  <span key={line} className="block overflow-hidden pb-[0.06em]">
                    <motion.span variants={titleLine} className={cn("block", index === 1 && "text-lavender-400")}>
                      {line}
                    </motion.span>
                  </span>
                ))}
              </h2>
              <motion.p variants={copyItem} className="mt-5 text-lead text-mist-300">
                {chapter.copy}
              </motion.p>
              <motion.ul variants={copyItem} className="mt-6 hidden flex-wrap items-center gap-2 sm:flex">
                <li className="type-label mr-1 text-mist-500">Unlocks</li>
                {chapter.unlocks.map((unlock) => (
                  <li key={unlock}>
                    <Tag tone="signal" size="md">
                      <Icon name="plus" className="size-3" weight="bold" />
                      {unlock}
                    </Tag>
                  </li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MilestoneHud({ unlocked, className }: { unlocked: number; className?: string }) {
  const latest = unlocked > 0 ? cardMilestones[unlocked - 1] : undefined;
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center", className)} aria-live="polite">
      <AnimatePresence mode="wait">
        {latest && (
          <motion.div
            key={latest.id}
            initial={{ opacity: 0, y: -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
          >
            <Tag tone="signal" size="md" dot="live" className="bg-ink-900/80 ring-1 ring-signal/25 backdrop-blur">
              {latest.hud}
            </Tag>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
