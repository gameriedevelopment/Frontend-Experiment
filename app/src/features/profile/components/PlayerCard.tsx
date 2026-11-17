import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import type { PointerEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";
import type { PlayerCardModel, PlayerCardStat, PlayerCardStatTone } from "../playerCard";

const statTone: Record<PlayerCardStatTone, string> = {
  brand: "text-lavender-300",
  achievement: "text-signal",
  neutral: "text-mist-50",
};

function StatValue({ stat, className }: { stat: PlayerCardStat; className?: string }) {
  return (
    <span className={cn("type-display flex items-baseline leading-none tabular-nums", stat.unit === "%" ? "gap-0.5" : "gap-1", statTone[stat.tone], className)}>
      {stat.value}
      {stat.unit && <span className="text-[0.55em] tracking-normal">{stat.unit}</span>}
    </span>
  );
}

export function PlayerCard({
  model,
  tilt = false,
  className,
}: {
  model: PlayerCardModel;
  tilt?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 120, damping: 18 });
  const glareX = useMotionValue(30);
  const glareY = useMotionValue(0);
  const glare = {
    rotateX,
    rotateY,
    "--glare-x": useMotionTemplate`${glareX}%`,
    "--glare-y": useMotionTemplate`${glareY}%`,
  } as MotionStyle;
  const interactive = tilt && !reducedMotion;

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    rotateY.set((x - 0.5) * 10);
    rotateX.set(-(y - 0.5) * 8);
    glareX.set(x * 100);
    glareY.set(y * 100);
  };
  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const level = model.stats.find((stat) => stat.key === "gamerie-level");
  const stats = model.stats.filter((stat) => stat !== level);

  return (
    <div className={cn("@container [perspective:1400px]", className)}>
      <m.article
        aria-label={`${model.username}'s Gamerie player card`}
        style={interactive ? glare : undefined}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        className="group/card relative isolate w-full overflow-hidden rounded-card bg-ink-900 shadow-[0_60px_120px_-50px_rgb(0_0_0/0.95),0_30px_80px_-60px_rgb(198_163_255/0.5)] ring-1 ring-white/10"
      >
        <header className="relative overflow-hidden bg-[linear-gradient(140deg,var(--color-lavender-200),var(--color-lavender-400)_45%,var(--color-lavender-500))] px-6 pb-6 pt-5 text-ink-950">
          <div aria-hidden="true" className="halftone absolute inset-0 text-ink-950/20 [mask-image:linear-gradient(to_bottom_left,black,transparent_65%)]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.45)_48%,transparent_62%)] bg-[length:250%_100%] bg-[position:var(--glare-x,30%)_0] opacity-60 mix-blend-soft-light"
          />
          <div className="relative flex items-center justify-between gap-3">
            <span className="type-label">Player ID</span>
            {model.gamerieId && <span className="type-label text-ink-950/60">{model.gamerieId}</span>}
          </div>
          <div className="relative mt-8 flex items-center gap-4">
            <Avatar
              src={model.profileImage}
              name={model.username}
              size="lg"
              tone="ink"
              className="rounded-full shadow-[0_12px_28px_-10px_rgb(10_7_16/0.7)] ring-[3px] ring-ink-950"
            />
            <div className="min-w-0">
              <p className="type-display truncate text-[clamp(1.4rem,7.5cqi,1.9rem)] leading-none tracking-[-0.02em]">{model.username}</p>
              <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-medium text-ink-950/70">
                <span className="truncate">{model.title}</span>
                {model.region && (
                  <>
                    <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-ink-950/40" />
                    <span className="truncate">{model.region}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 px-6 pb-6 pt-5">
          <dl className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <dt className="type-label text-mist-500">Main game</dt>
              <dd className="mt-2 truncate font-semibold">{model.game?.name || "No game shared yet"}</dd>
              {model.game?.identity && <dd className="mt-0.5 truncate text-xs text-mist-400">{model.game.identity}</dd>}
            </div>
            {model.game?.standing && (
              <div className="min-w-0 max-w-[45%]">
                <dt className="sr-only">Standing</dt>
                <dd className="truncate rounded-full bg-lavender-400/12 px-3 py-1.5 text-xs font-semibold text-lavender-200 ring-1 ring-inset ring-lavender-400/25">
                  {model.game.standing}
                </dd>
              </div>
            )}
          </dl>

          {level && (
            <div>
              <div className="flex items-end justify-between gap-4">
                <p className="type-label text-mist-300">{level.label}</p>
                <StatValue stat={level} className="text-[1.35rem]" />
              </div>
              {model.levelProgress !== undefined && (
                <div
                  role="progressbar"
                  aria-label={level.context}
                  aria-valuenow={Math.round(model.levelProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"
                >
                  <div
                    className="h-full rounded-full bg-linear-to-r from-lavender-600 to-lavender-300"
                    style={{ width: `${Math.max(2, model.levelProgress)}%` }}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-mist-500">{level.context}</p>
            </div>
          )}

          {stats.length > 0 && (
            <dl className={cn("grid gap-2.5", stats.length > 1 && "grid-cols-2")}>
              {stats.map((stat, index) => (
                <div
                  key={stat.key}
                  className={cn(
                    "flex min-w-0 flex-col rounded-tile bg-white/[0.035] p-3.5 ring-1 ring-inset ring-white/6",
                    stats.length === 3 && index === 2 && "col-span-2",
                  )}
                >
                  <dt className="order-2 mt-2.5 truncate text-xs font-semibold text-mist-100">{stat.label}</dt>
                  <dd className="order-1">
                    <StatValue stat={stat} className="text-[clamp(1.1rem,6cqi,1.4rem)]" />
                  </dd>
                  <dd className="order-3 mt-0.5 truncate text-[0.7rem] text-mist-500">{stat.context}</dd>
                </div>
              ))}
            </dl>
          )}

          {!model.stats.length && (
            <p className="rounded-tile bg-white/[0.035] px-4 py-5 text-center text-sm text-mist-400 ring-1 ring-inset ring-white/6">
              No competitive statistics recorded yet.
            </p>
          )}

          {model.strengths.length > 0 && (
            <div>
              <p className="type-label text-mist-500">Top skills</p>
              <ul className="mt-3 grid gap-2.5">
                {model.strengths.map((strength) => (
                  <li key={strength.name} className="flex items-center gap-3">
                    <Icon
                      name={strength.endorsementCount ? "verified" : "user"}
                      weight="duotone"
                      className={cn("size-[1.1rem] shrink-0", strength.endorsementCount ? "text-lavender-300" : "text-mist-500")}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{strength.name}</span>
                    <span className="shrink-0 text-xs text-mist-500">
                      {strength.endorsementCount ? `${strength.endorsementCount} endorsed` : "Player listed"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="type-label flex items-center justify-between border-t border-white/6 bg-ink-950/40 px-6 py-4 text-mist-500">
          <span className="flex items-center gap-2">
            <TokenMark className="h-3.5 text-lavender-400" />
            gamerie.gg
          </span>
          <span>Player card</span>
        </footer>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_var(--glare-x,50%)_var(--glare-y,0%),rgb(255_255_255/0.14),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px bg-linear-to-r from-transparent via-white/70 to-transparent" />
      </m.article>
    </div>
  );
}
