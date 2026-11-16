import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const GAP_X = 30;
const GAP_Y = 34;
const REACH = 190;
const BASE = [42, 33, 56];
const LIT = [198, 163, 255];

function drawToken(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const radius = size * 0.18;
  context.beginPath();
  context.arc(x, y - size * 0.4, radius, 0, Math.PI * 2);
  context.roundRect(x - radius, y - size * 0.17, radius * 2, radius * 4, radius);
  context.fill();
}

const mix = (from: number[], to: number[], t: number) =>
  `rgb(${from.map((channel, index) => Math.round(channel + (to[index] - channel) * t)).join(" ")})`;

export function TokenField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let frameId = 0;
    let visible = false;
    let seeds: number[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.ceil(width / GAP_X + 2) * Math.ceil(height / GAP_Y + 2);
      seeds = Array.from({ length: count }, () => Math.random());
      if (!visible) draw(0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const t = time / 1000;
      const columns = Math.ceil(width / GAP_X + 2);
      let index = 0;
      for (let row = 0, y = GAP_Y / 2; y < height + GAP_Y; row++, y += GAP_Y) {
        const offset = row % 2 === 0 ? 0 : GAP_X / 2;
        for (let column = 0; column < columns; column++, index++) {
          const x = column * GAP_X + offset;
          const near = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / REACH);
          const wave = reducedMotion ? 0 : Math.max(0, Math.sin(x * 0.008 + y * 0.005 - t * 0.7)) ** 8 * 0.35;
          const lit = Math.min(1, near ** 1.6 + wave);
          const seed = seeds[index] ?? 0;
          context.fillStyle = mix(BASE, LIT, lit);
          const jitter = (seed - 0.5) * 8;
          drawToken(context, x, y + jitter - lit * 5, GAP_Y * (0.5 + seed * 0.16 + lit * 0.26));
        }
      }
    };

    const loop = (time: number) => {
      draw(time);
      if (visible && !reducedMotion) frameId = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      if (reducedMotion) draw(0);
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      if (reducedMotion) draw(0);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frameId);
      if (visible) frameId = requestAnimationFrame(loop);
    });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    observer.observe(canvas);
    const host = canvas.parentElement ?? canvas;
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("size-full", className)} />;
}
