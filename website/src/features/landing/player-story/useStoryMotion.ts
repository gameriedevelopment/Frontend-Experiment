import { useEffect, useRef, useState } from "react";
import { chapters, lastChapter } from "./story-content";

const scrollQuery =
  "(min-width: 768px) and (min-height: 690px) and (prefers-reduced-motion: no-preference)";
const reducedQuery = "(prefers-reduced-motion: reduce)";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, weight: number) =>
  from + (to - from) * weight;
const smooth = (value: number) => value * value * (3 - 2 * value);

function paint(
  scene: HTMLDivElement,
  position: number,
  pointerX: number,
  pointerY: number,
  arrival: number,
) {
  const start = Math.floor(position);
  const blend = smooth(position - start);
  const from = chapters[start].pose;
  const to = chapters[Math.min(start + 1, lastChapter)].pose;
  const entrance = 1 - arrival;
  const pose = {
    "--card-x": `${mix(from.x, to.x, blend) + pointerX * 2}%`,
    "--card-y": `${mix(from.y, to.y, blend) + pointerY * 2 + entrance * 12}%`,
    "--card-rx": `${mix(from.rotateX, to.rotateX, blend) - pointerY * 7 + entrance * 9}deg`,
    "--card-ry": `${mix(from.rotateY, to.rotateY, blend) + pointerX * 10 - entrance * 36}deg`,
    "--card-rz": `${mix(from.roll, to.roll, blend) - entrance * 7}deg`,
    "--card-scale": String(
      mix(from.scale, to.scale, blend) * mix(0.78, 1, arrival),
    ),
    "--ring-angle": `${position * 62 + pointerX * 7 - entrance * 62}deg`,
    "--light-x": `${50 + pointerX * 32}%`,
    "--light-y": `${40 + pointerY * 28}%`,
    "--story-progress": String(position / lastChapter),
    "--orbital-light": String(mix(0.26, 0.68, arrival)),
  };

  for (const [name, value] of Object.entries(pose))
    scene.style.setProperty(name, value);

  chapters.forEach((_, index) => {
    const distance = Math.abs(position - index);
    scene.style.setProperty(
      `--chapter-${index}`,
      String(smooth(clamp(1 - distance, 0, 1))),
    );
    scene.style.setProperty(
      `--detail-${index}`,
      String(smooth(clamp((0.75 - distance) / 0.62, 0, 1))),
    );
  });
}

export function useStoryMotion() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const selected = useRef(0);
  const schedule = useRef<(() => void) | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!section || !stage || !scene) return;

    const canScroll = window.matchMedia(scrollQuery);
    const reduced = window.matchMedia(reducedQuery);
    let position = selected.current;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let request = 0;
    let introStart: number | undefined;

    const update = (now: number) => {
      request = 0;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const target = canScroll.matches
        ? clamp(
            (window.innerHeight -
              stage.offsetHeight -
              section.getBoundingClientRect().top) /
              travel,
            0,
            1,
          ) * lastChapter
        : selected.current;
      const chapter = Math.round(target);
      selected.current = chapter;
      setActive(chapter);

      const approach = (current: number, next: number) =>
        reduced.matches || Math.abs(next - current) < 0.002
          ? next
          : mix(current, next, 0.2);

      position = approach(position, target);
      pointerX = approach(pointerX, targetX);
      pointerY = approach(pointerY, targetY);
      introStart ??= now;
      const intro = reduced.matches
        ? 1
        : clamp((now - introStart) / 1050, 0, 1);
      const arrival = 1 - (1 - intro) ** 3;
      paint(stage, position, pointerX, pointerY, arrival);

      if (
        intro < 1 ||
        position !== target ||
        pointerX !== targetX ||
        pointerY !== targetY
      )
        queueFrame();
    };

    const queueFrame = () => {
      if (!request) request = window.requestAnimationFrame(update);
    };

    const onPointer = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType !== "mouse") return;
      const rect = scene.getBoundingClientRect();
      targetX = clamp(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      targetY = clamp(
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
        -1,
        1,
      );
      queueFrame();
    };

    const resetPointer = () => {
      targetX = 0;
      targetY = 0;
      queueFrame();
    };

    const onScroll = () => {
      if (canScroll.matches) queueFrame();
    };

    const observer = new ResizeObserver(queueFrame);
    observer.observe(stage);
    schedule.current = queueFrame;
    queueFrame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", queueFrame);
    canScroll.addEventListener("change", queueFrame);
    reduced.addEventListener("change", resetPointer);
    scene.addEventListener("pointermove", onPointer, { passive: true });
    scene.addEventListener("pointerleave", resetPointer);

    return () => {
      schedule.current = null;
      window.cancelAnimationFrame(request);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", queueFrame);
      canScroll.removeEventListener("change", queueFrame);
      reduced.removeEventListener("change", resetPointer);
      scene.removeEventListener("pointermove", onPointer);
      scene.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  function selectChapter(index: number) {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (section && stage && window.matchMedia(scrollQuery).matches) {
      const stageTop = window.innerHeight - stage.offsetHeight;
      const start =
        window.scrollY + section.getBoundingClientRect().top - stageTop;
      const travel = section.offsetHeight - stage.offsetHeight;
      window.scrollTo({
        top: start + (travel * index) / lastChapter,
        behavior: "smooth",
      });
      return;
    }

    selected.current = index;
    schedule.current?.();
  }

  return { sectionRef, stageRef, sceneRef, active, selectChapter };
}
