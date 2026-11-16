import { GamerieIcon } from "../../../components/ui/GamerieIcon";
import { chapters } from "./story-content";

const recordVisibility = [
  "opacity-[var(--chapter-0,1)]",
  "opacity-[var(--chapter-1,0)]",
  "opacity-[var(--chapter-2,0)]",
  "opacity-[var(--chapter-3,0)]",
];

export function PlayerArtifact() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center [perspective:1000px]">
      <div className="relative w-[min(57%,18.3rem)] [transform-style:preserve-3d] [transform:translate3d(var(--card-x,0%),var(--card-y,3%),0)_rotateX(var(--card-rx,7deg))_rotateY(var(--card-ry,-16deg))_rotateZ(var(--card-rz,-9deg))_scale(var(--card-scale,1))] sm:w-[min(54%,20rem)] lg:w-[min(53%,21rem)]">
        <div className="absolute inset-0 rounded-[1.05rem] border border-brand/55 bg-orbit-edge shadow-[0_28px_78px_#0a0416bb] [transform:translateZ(-8px)_translate(2px,3px)]" />
        <div className="relative isolate overflow-hidden rounded-[1.05rem] border border-brand-light/60 bg-panel text-foreground shadow-[inset_0_0_0_1px_#ffffff1a]">
          <img
            src="/media/player-portrait.jpg"
            alt=""
            width="768"
            height="960"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_38%]"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-b from-stage/79 from-0% via-transparent via-33% to-panel to-96%" />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-stage from-0% via-stage/45 via-27% to-transparent to-50%" />
          <div className="absolute inset-0 rounded-[1.05rem] opacity-40 mix-blend-screen [background:radial-gradient(ellipse_at_var(--light-x,50%)_var(--light-y,40%),var(--color-orbit-grid),transparent_57%)]" />
          <div className="relative flex aspect-[0.735] flex-col justify-between p-[7%]">
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 font-display text-[clamp(.85rem,2vw,1.2rem)] font-black tracking-[-0.045em]">
                <GamerieIcon name="identity" size={17} /> Gamerie
              </span>
              <span className="text-[0.5rem] font-bold tracking-[0.16em] text-brand-light uppercase sm:text-[0.58rem]">
                Sample
              </span>
            </div>
            <div>
              <p className="text-[0.53rem] font-bold tracking-[0.2em] text-brand-light uppercase sm:text-[0.64rem]">
                Player Card
              </p>
              <p className="mt-1.5 font-display text-[clamp(2rem,5vw,4.15rem)] leading-[.88] font-black tracking-[-.06em]">
                Nova
              </p>
              <div className="mt-3 grid border-t border-brand/40 pt-2.5 sm:mt-4 sm:pt-3">
                {chapters.map(({ id, record }, index) => (
                  <div
                    key={id}
                    className={`col-start-1 row-start-1 flex items-center justify-between gap-1 ${recordVisibility[index]}`}
                  >
                    <span className="text-[0.55rem] tracking-wide text-brand-light sm:text-xs">
                      {record[0]}
                    </span>
                    <span
                      className={`text-[0.58rem] font-bold sm:text-xs ${id === "competition" ? "text-earned" : "text-foreground"}`}
                    >
                      {record[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside className="absolute right-[4%] top-[24%] hidden items-center gap-3 rounded-xl border border-brand/30 bg-panel/92 px-4 py-3 text-white shadow-lg backdrop-blur-sm opacity-[var(--detail-1,0)] [transform:translateX(calc((1_-_var(--detail-1,0))*2rem))] sm:flex">
        <span className="grid size-9 place-items-center rounded-md bg-brand/20 text-brand-light">
          <GamerieIcon name="players" size={18} />
        </span>
        <div>
          <p className="text-xs font-bold">Squad found</p>
          <p className="mt-0.5 text-[.66rem] text-brand-light">
            Shared game · FPS
          </p>
        </div>
      </aside>
      <aside className="absolute left-[4%] bottom-[20%] hidden items-center gap-3 rounded-xl border border-brand/30 bg-panel/92 px-4 py-3 text-white shadow-lg backdrop-blur-sm opacity-[var(--detail-2,0)] [transform:translateX(calc((var(--detail-2,0)_-_1)*2rem))] sm:flex">
        <span className="grid size-9 place-items-center rounded-md bg-brand/20 text-brand-light">
          <GamerieIcon name="team" size={18} />
        </span>
        <div>
          <p className="text-xs font-bold">Night Shift</p>
          <p className="mt-0.5 text-[.66rem] text-brand-light">
            Roster · 5 of 5
          </p>
        </div>
      </aside>
      <aside className="absolute right-[2%] bottom-[15%] hidden items-center gap-3 rounded-xl border border-earned/60 bg-panel/94 px-4 py-3 text-white shadow-lg backdrop-blur-sm opacity-[var(--detail-3,0)] [transform:translateY(calc((1_-_var(--detail-3,0))*2rem))] sm:flex">
        <span className="grid size-9 place-items-center rounded-md bg-earned/20 text-earned">
          <GamerieIcon name="competition" size={18} />
        </span>
        <div>
          <p className="text-xs font-bold">Result recorded</p>
          <p className="mt-0.5 text-[.66rem] text-earned">Won 2–1</p>
        </div>
      </aside>
    </div>
  );
}
