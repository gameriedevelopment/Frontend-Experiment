import { Vector3 } from "three";
import {
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  range,
} from "@/lib/easing";
import { createPose, type TokenPose } from "./token";

export const FIT_COUNT = 4;
export const CROWD_COUNT = 18;
export const PODIUM_HEIGHT = 0.5;

const FORMATION: ReadonlyArray<readonly [number, number]> = [
  [-1, -0.45],
  [1, -0.45],
  [-2, -0.95],
  [2, -0.95],
];

export const RIVAL_SPOTS: ReadonlyArray<readonly [number, number]> = [
  [0, -5.6],
  [-1.15, -6.15],
  [1.15, -6.15],
  [-2.3, -6.7],
  [2.3, -6.7],
];

interface CameraKey {
  at: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

const CAMERA_KEYS: readonly CameraKey[] = [
  { at: 0, position: [0, 1.35, 4.9], target: [0, 1.15, 0] },
  { at: 0.07, position: [0.25, 1.4, 5.1], target: [0, 1.1, 0] },
  { at: 0.25, position: [3.6, 3.0, 8.2], target: [0, 1.0, 0] },
  { at: 0.48, position: [0, 14.5, 17.5], target: [0, 0, -1.4] },
  { at: 0.7, position: [-2.2, 5.8, 13], target: [0, 0.75, -0.5] },
  { at: 0.86, position: [9, 6.8, 11.5], target: [0, 0.6, -3.1] },
  { at: 1, position: [2.4, 5.6, 10.4], target: [0, 1.55, -0.8] },
];

const PULSES = [
  { from: 0.13, to: 0.26, reach: 7, signal: false },
  { from: 0.38, to: 0.5, reach: 16, signal: false },
  { from: 0.66, to: 0.76, reach: 9, signal: false },
  { from: 0.9, to: 1, reach: 16, signal: true },
] as const;

export interface BoardSpot {
  x: number;
  z: number;
  order: number;
}

export function createBoardLayout(): BoardSpot[] {
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const total = FIT_COUNT + CROWD_COUNT;
  return Array.from({ length: total }, (_, index) => {
    const angle = index * 2.39996 + random() * 0.35;
    const radius = 2.4 + Math.sqrt(index) * 1.32 + random() * 0.3;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      order: index / (total - 1),
    };
  });
}

export interface BoardFrame {
  cameraPosition: Vector3;
  cameraTarget: Vector3;
  heroWeight: number;
  you: TokenPose;
  others: TokenPose[];
  rivals: TokenPose[];
  boardRadius: number;
  pulseRadius: number;
  pulseStrength: number;
  pulseSignal: boolean;
  gems: number;
  linkDraw: number;
  linkOpacity: number;
  platform: number;
  versus: number;
  versusOpacity: number;
  podium: number;
  halo: number;
}

export function createFrame(layout: BoardSpot[]): BoardFrame {
  return {
    cameraPosition: new Vector3(),
    cameraTarget: new Vector3(),
    heroWeight: 1,
    you: createPose(),
    others: layout.map((spot) => createPose(spot.x, spot.z)),
    rivals: RIVAL_SPOTS.map(([x, z]) => createPose(x, z)),
    boardRadius: 0,
    pulseRadius: 0,
    pulseStrength: 0,
    pulseSignal: false,
    gems: 0,
    linkDraw: 0,
    linkOpacity: 0,
    platform: 0,
    versus: 0,
    versusOpacity: 0,
    podium: 0,
    halo: 0,
  };
}

function sampleCamera(progress: number, frame: BoardFrame) {
  let index = 0;
  while (index < CAMERA_KEYS.length - 2 && progress > CAMERA_KEYS[index + 1].at) index++;
  const from = CAMERA_KEYS[index];
  const to = CAMERA_KEYS[index + 1];
  const t = easeInOutCubic(range(progress, from.at, to.at));
  frame.cameraPosition.set(
    lerp(from.position[0], to.position[0], t),
    lerp(from.position[1], to.position[1], t),
    lerp(from.position[2], to.position[2], t),
  );
  frame.cameraTarget.set(
    lerp(from.target[0], to.target[0], t),
    lerp(from.target[1], to.target[1], t),
    lerp(from.target[2], to.target[2], t),
  );
}

function poseCommunity(p: number, layout: BoardSpot[], frame: BoardFrame) {
  const linkFocus = range(p, 0.45, 0.5);
  const march = easeInOutCubic(range(p, 0.58, 0.68));

  layout.forEach((spot, index) => {
    const pose = frame.others[index];
    const enter = range(p, 0.36 + spot.order * 0.07, 0.41 + spot.order * 0.07);
    pose.reveal = easeOutCubic(enter);
    pose.y = (easeOutBack(enter) - 1) * 0.55;
    pose.glow = 0;

    if (index < FIT_COUNT) {
      const [formationX, formationZ] = FORMATION[index];
      pose.x = lerp(spot.x, formationX, march);
      pose.z = lerp(spot.z, formationZ, march);
      pose.tone = 1;
      pose.highlight = linkFocus;
      pose.glow = 0.06 * linkFocus;
      return;
    }

    const leave = range(p, 0.55 + spot.order * 0.05, 0.6 + spot.order * 0.05);
    pose.tone = 1 - 0.65 * linkFocus;
    pose.highlight = 0;
    pose.reveal *= 1 - leave;
    pose.y -= easeInCubic(leave) * 0.6;
  });
}

function poseRivals(p: number, frame: BoardFrame) {
  frame.rivals.forEach((pose, index) => {
    const enter = range(p, 0.77 + index * 0.012, 0.81 + index * 0.012);
    const fall = range(p, 0.85 + index * 0.012, 0.885 + index * 0.012);
    const fade = range(p, 0.89 + index * 0.008, 0.93 + index * 0.008);
    pose.reveal = easeOutCubic(enter) * (1 - fade);
    pose.y = (easeOutBack(enter) - 1) * 0.55;
    pose.fall = -easeInCubic(fall) * Math.PI * 0.5;
  });
}

function posePulse(p: number, frame: BoardFrame) {
  frame.pulseStrength = 0;
  for (const pulse of PULSES) {
    const t = range(p, pulse.from, pulse.to);
    if (t <= 0 || t >= 1) continue;
    frame.pulseRadius = pulse.reach * easeOutCubic(t);
    frame.pulseStrength = Math.sin(Math.PI * t);
    frame.pulseSignal = pulse.signal;
  }
}

export function poseBoard(p: number, layout: BoardSpot[], frame: BoardFrame) {
  sampleCamera(p, frame);
  frame.heroWeight = 1 - easeInOutCubic(range(p, 0.03, 0.15));

  frame.podium = easeInOutCubic(range(p, 0.86, 0.93));
  frame.you.y = frame.podium * PODIUM_HEIGHT;
  frame.you.glow = 0.14 * range(p, 0.9, 0.95);

  poseCommunity(p, layout, frame);
  poseRivals(p, frame);
  posePulse(p, frame);

  frame.boardRadius =
    lerp(2.7, 6.8, easeInOutCubic(range(p, 0.12, 0.26))) +
    lerp(0, 10, easeInOutCubic(range(p, 0.34, 0.45)));
  frame.gems = range(p, 0.15, 0.23) * (1 - range(p, 0.34, 0.39));
  frame.linkDraw = easeInOutCubic(range(p, 0.45, 0.51));
  frame.linkOpacity = 1 - range(p, 0.56, 0.6);
  frame.platform = easeInOutCubic(range(p, 0.64, 0.73));
  frame.versus = easeOutCubic(range(p, 0.8, 0.85));
  frame.versusOpacity = 1 - range(p, 0.89, 0.93);
  frame.halo = easeOutCubic(range(p, 0.92, 0.97));
}
