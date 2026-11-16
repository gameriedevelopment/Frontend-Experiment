import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { Tag } from "@/components/ui/Tag";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";
import { cardMilestones, type MilestoneId } from "./story-content";

const games = ["Valorant", "League", "Chess"];
const fits = [94, 91, 88];

const emptySlot = <span className="block h-2 w-16 rounded-full bg-white/[0.08]" />;

function Unlockable({
  unlocked,
  placeholder = emptySlot,
  children,
}: {
  unlocked: boolean;
  placeholder?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {unlocked ? (
        <motion.div
          key="unlocked"
          className="flex min-w-0 items-center justify-end gap-2"
          initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.span
          key="locked"
          aria-label="Not unlocked yet"
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {placeholder}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  unlocked,
  children,
}: {
  label: string;
  unlocked: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="-mx-5 flex min-h-12 items-center justify-between gap-4 px-5 py-2"
      animate={unlocked ? { backgroundColor: ["rgb(212 255 90 / 0.08)", "rgb(212 255 90 / 0)"] } : undefined}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <dt className="type-label text-mist-400">{label}</dt>
      <dd className="min-w-0">
        <Unlockable unlocked={unlocked}>
          {children}
        </Unlockable>
      </dd>
    </motion.div>
  );
}

function usePointerTilt() {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 90, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 90, damping: 18 });

  useEffect(() => {
    if (reducedMotion) return;
    const onPointerMove = (event: PointerEvent) => {
      rotateY.set((event.clientX / window.innerWidth - 0.5) * 12);
      rotateX.set(-(event.clientY / window.innerHeight - 0.5) * 9);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [reducedMotion, rotateX, rotateY]);

  return { rotateX, rotateY };
}

export function PlayerCard({ unlocked, className }: { unlocked: number; className?: string }) {
  const tilt = usePointerTilt();
  const has = (id: MilestoneId) =>
    unlocked > cardMilestones.findIndex((milestone) => milestone.id === id);
  const leveledUp = has("record");
  const xp = !has("level") ? 0 : leveledUp ? 12 : 82;

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <motion.article
        aria-label="Sample Gamerie player card"
        style={tilt}
        className="relative w-[21rem] overflow-hidden rounded-card bg-ink-900/85 shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/10 backdrop-blur-xl"
      >
        <header className="relative overflow-hidden bg-lavender-400 px-5 pb-5 pt-5 text-ink-950">
          <div className="halftone absolute inset-0 text-ink-950/20 [mask-image:linear-gradient(to_bottom_left,black,transparent_65%)]" />
          <div className="relative flex items-center justify-between">
            <span className="type-label">Player ID</span>
            <Tag tone="ink">Sample</Tag>
          </div>
          <div className="relative mt-7 flex items-end gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ink-950 text-lavender-400">
              <TokenMark className="h-9" />
            </div>
            <div className="min-w-0 pb-0.5">
              <Unlockable
                unlocked={has("id")}
                placeholder={
                  <span className="grid gap-2">
                    <span className="block h-4 w-24 rounded-full bg-ink-950/15" />
                    <span className="block h-2.5 w-32 rounded-full bg-ink-950/10" />
                  </span>
                }
              >
                <div className="text-left">
                  <p className="type-display text-[1.9rem] leading-none tracking-[-0.02em]">Nova</p>
                  <p className="mt-1.5 text-sm font-medium text-ink-950/70">@nova · Lagos, NG</p>
                </div>
              </Unlockable>
            </div>
          </div>
        </header>

        <div className="px-5 pb-4 pt-4">
          <div className="type-label flex items-center justify-between text-mist-400">
            <span>
              Level{" "}
              <span className="text-mist-50">{has("level") ? (leveledUp ? 13 : 12) : "—"}</span>
            </span>
            <AnimatePresence>
              {leveledUp && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                >
                  <Tag tone="signal">Level up · +600 XP</Tag>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className={cn("h-full rounded-full", leveledUp ? "bg-signal" : "bg-lavender-400")}
              animate={{ width: `${xp}%` }}
              transition={{ duration: 1, ease: easeOutExpo }}
            />
          </div>

          <dl className="mt-3 divide-y divide-white/7">
            <Row label="Games" unlocked={has("games")}>
              {games.map((game) => (
                <Tag key={game} tone="lavender">
                  {game}
                </Tag>
              ))}
            </Row>
            <Row label="Role" unlocked={has("role")}>
              <span className="text-sm font-semibold">IGL · Controller</span>
            </Row>
            <Row label="Squad fit" unlocked={has("fit")}>
              <span className="flex -space-x-1.5">
                {fits.map((fit) => (
                  <span key={fit} className="grid size-6 place-items-center rounded-full bg-lavender-200 text-ink-950 ring-2 ring-ink-900">
                    <TokenMark className="h-3.5" />
                  </span>
                ))}
              </span>
              <span className="font-mono text-xs text-mist-200">{fits.join(" · ")}%</span>
            </Row>
            <Row label="Team" unlocked={has("team")}>
              <span className="grid size-6 place-items-center rounded-md bg-lavender-400 text-ink-950">
                <Icon name="team" className="size-4" weight="bold" />
              </span>
              <span className="text-sm font-semibold">Lagos Lions</span>
              <span className="font-mono text-xs text-mist-400">{has("roster") ? "5/5" : "4/5"}</span>
            </Row>
            <Row label="Last match" unlocked={has("match")}>
              <span className="font-mono text-sm font-semibold">
                <span className="text-signal">W</span> 13–9
              </span>
              <AnimatePresence>
                {has("verified") && (
                  <motion.span
                    initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 16 }}
                  >
                    <Tag tone="signal">
                      <Icon name="verified" className="size-3.5" weight="bold" />
                      Verified
                    </Tag>
                  </motion.span>
                )}
              </AnimatePresence>
            </Row>
            <Row label="Record" unlocked={has("match")}>
              <span className="font-mono text-sm text-mist-200">
                {leveledUp ? "28" : "27"}W · 9L
              </span>
            </Row>
          </dl>
        </div>
      </motion.article>
    </div>
  );
}
