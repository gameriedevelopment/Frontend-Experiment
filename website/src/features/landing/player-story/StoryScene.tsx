import type { RefObject } from "react";
import { OrbitArtwork } from "./OrbitArtwork";
import { PlayerArtifact } from "./PlayerArtifact";
import { chapters } from "./story-content";

const backdropVisibility = [
  "opacity-[calc(var(--chapter-1,0)*.74)]",
  "opacity-[calc(var(--chapter-2,0)*.78)]",
  "opacity-[calc(var(--chapter-3,0)*.88)]",
];

export function StoryScene({
  sceneRef,
}: {
  sceneRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className="relative isolate min-h-[20.5rem] overflow-hidden bg-stage sm:min-h-[29rem] md:min-h-0 [contain:paint]"
    >
      <OrbitArtwork />
      {chapters.slice(1).map(
        (chapter, index) =>
          "photo" in chapter && (
            <div
              key={chapter.id}
              className={`absolute inset-0 ${backdropVisibility[index]}`}
            >
              <img
                src={chapter.photo}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-70 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-linear-to-t from-stage via-orbit-mid/39 to-stage/75" />
            </div>
          ),
      )}
      <div className="absolute inset-0 opacity-[var(--chapter-3,0)] [background:radial-gradient(ellipse_at_52%_55%,var(--color-earned-glow),transparent_67%)]" />
      <PlayerArtifact />
      <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-stage/55 from-4% via-transparent via-22% to-transparent md:from-stage" />
      <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-t from-stage via-transparent via-15% to-transparent" />
    </div>
  );
}
