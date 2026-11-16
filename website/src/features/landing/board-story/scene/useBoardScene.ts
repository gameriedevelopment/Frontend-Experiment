import { useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { BoardScene } from "./BoardScene";

export function useBoardScene(progress: MotionValue<number>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let teardown = () => {};

    import("./BoardScene")
      .then(({ BoardScene }) => {
        if (disposed) return;
        let scene: BoardScene;
        try {
          scene = new BoardScene(canvas, { reducedMotion });
        } catch {
          setFailed(true);
          return;
        }

        const resize = () => scene.resize(canvas.clientWidth, canvas.clientHeight);
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();

        scene.setProgress(progress.get());
        const unsubscribe = progress.on("change", (value) => scene.setProgress(value));

        const onPointerMove = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          scene.setPointer(
            (event.clientX / window.innerWidth) * 2 - 1,
            -((event.clientY / window.innerHeight) * 2 - 1),
          );
        };
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        const visibility = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) scene.start();
          else scene.stop();
        });
        visibility.observe(canvas);

        teardown = () => {
          visibility.disconnect();
          resizeObserver.disconnect();
          unsubscribe();
          window.removeEventListener("pointermove", onPointerMove);
          scene.dispose();
        };
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      teardown();
    };
  }, [progress, reducedMotion]);

  return { canvasRef, failed };
}
