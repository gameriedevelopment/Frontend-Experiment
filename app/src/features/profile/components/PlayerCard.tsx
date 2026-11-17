import { m, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";
import type { PlayerCardModel, PlayerCardStatTone } from "../playerCard";

const statTone: Record<PlayerCardStatTone, string> = {
  brand: "text-lavender-300",
  achievement: "text-signal",
  neutral: "text-mist-50",
};

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
  const interactive = tilt && !reducedMotion;

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 10);
    rotateX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 8);
  };
  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <m.article
        aria-label={`${model.username}'s Gamerie player card`}
        style={interactive ? { rotateX, rotateY } : undefined}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        className="relative w-full overflow-hidden rounded-card bg-ink-900 shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/10"
      >
        <header className="relative overflow-hidden bg-lavender-400 px-6 pb-6 pt-5 text-ink-950">
          <div className="halftone absolute inset-0 text-ink-950/20 [mask-image:linear-gradient(to_bottom_left,black,transparent_65%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="type-label">Player ID</span>
            {model.gamerieId && <span className="type-label text-ink-950/60">{model.gamerieId}</span>}
          </div>
          <div className="relative mt-7 flex items-end gap-4">
            <Avatar src={model.profileImage} name={model.username} size="lg" tone="ink" className="rounded-full ring-4 ring-ink-950/10" />
            <div className="min-w-0 pb-0.5">
              <p className="type-display truncate text-[1.7rem] leading-none tracking-[-0.02em]">{model.username}</p>
              <p className="mt-1.5 truncate text-sm font-medium text-ink-950/70">
                {model.title}
                {model.region ? ` · ${model.region}` : ""}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 px-6 py-5">
          <dl className="grid grid-cols-2 gap-4 border-b border-white/6 pb-5">
            <div className="min-w-0">
              <dt className="type-label text-mist-500">Game</dt>
              <dd className="mt-2 truncate text-sm font-semibold">{model.game?.name || "Not shared"}</dd>
              {model.game?.identity && <dd className="mt-0.5 truncate text-xs text-mist-400">{model.game.identity}</dd>}
            </div>
            <div className="min-w-0">
              <dt className="type-label text-mist-500">Standing</dt>
              <dd className="mt-2 truncate text-sm font-semibold">{model.game?.standing || "Not recorded"}</dd>
            </div>
          </dl>

          {model.stats.length ? (
            <dl className="grid gap-3.5">
              {model.stats.map((stat) => (
                <div key={stat.key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <dt className="truncate text-sm font-medium">{stat.label}</dt>
                    <p className="mt-0.5 truncate text-xs text-mist-500">{stat.context}</p>
                  </div>
                  <dd className={cn("type-display shrink-0 text-lg leading-none tabular-nums", statTone[stat.tone])}>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-mist-500">No competitive statistics recorded yet.</p>
          )}

          {model.strengths.length > 0 && (
            <ul className="grid gap-2.5 border-t border-white/6 pt-5">
              {model.strengths.map((strength) => (
                <li key={strength.name} className="flex items-center gap-3">
                  <Icon
                    name={strength.endorsementCount ? "verified" : "user"}
                    weight="duotone"
                    className={cn("size-[1.1rem]", strength.endorsementCount ? "text-lavender-300" : "text-mist-500")}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{strength.name}</span>
                  <span className="shrink-0 text-xs text-mist-500">
                    {strength.endorsementCount ? `${strength.endorsementCount} endorsed` : "Player listed"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="type-label flex items-center justify-between border-t border-white/6 px-6 py-4 text-mist-500">
          <span className="flex items-center gap-2">
            <TokenMark className="h-3.5 text-lavender-400" />
            gamerie.gg
          </span>
          <span>Player card</span>
        </footer>
      </m.article>
    </div>
  );
}
