export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

export const range = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start));

export const damp = (
  current: number,
  target: number,
  lambda: number,
  deltaSeconds: number,
) => lerp(current, target, 1 - Math.exp(-lambda * deltaSeconds));

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const easeInCubic = (t: number) => t ** 3;

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

export const easeOutBack = (t: number) => {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
};
