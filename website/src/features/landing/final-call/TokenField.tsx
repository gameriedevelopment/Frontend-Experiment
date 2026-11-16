import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const SPACING = 30;
const REACH = 190;
const BASE = [55, 44, 72];
const LIT = [198, 163, 255];
const SIGNAL = [212, 255, 90];

function drawToken(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const radius = size * 0.18;
  context.beginPath();
  context.arc(x, y - size * 0.34, radius, 0, Math.PI * 2);
  context.roundRect(x - radius, y - size * 0.14, radius * 2, size * 0.5, radius);
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
      const count = Math.ceil(width / SPACING + 1) * Math.ceil(height / SPACING + 1);
      seeds = Array.from({ length: count }, () => Math.random());
      if (!visible) draw(0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const t = time / 1000;
      const columns = Math.ceil(width / SPACING + 1);
      let index = 0;
      for (let y = SPACING / 2; y < height + SPACING; y += SPACING) {
        for (let column = 0; column < columns; column++, index++) {
          const x = column * SPACING + SPACING / 2;
          const near = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / REACH);
          const wave = reducedMotion ? 0 : Math.max(0, Math.sin(x * 0.012 + y * 0.008 - t * 1.4)) ** 6 * 0.55;
          const lit = Math.min(1, near ** 1.6 + wave);
          const seed = seeds[index] ?? 0;
          const online = !reducedMotion && seed > 0.985 && Math.sin(t * 2 + seed * 40) > 0.2;
          context.fillStyle = online ? mix(BASE, SIGNAL, 0.9) : mix(BASE, LIT, lit);
          drawToken(context, x, y, SPACING * (0.7 + lit * 0.3));
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
