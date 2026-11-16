import {
  BufferGeometry,
  Color,
  Group,
  LatheGeometry,
  Mesh,
  type ShaderMaterial,
  SphereGeometry,
  Vector2,
} from "three";
import { createHalftoneMaterial, type SharedUniforms } from "./materials";
import { scenePalette } from "./palette";

// Proportions follow the Gamerie mark: head diameter equals body width,
// body is twice as tall as it is wide, with a thin gap between them.
const RADIUS = 0.32;
const BODY_HEIGHT = 1.26;
const GAP = 0.07;
export const HEAD_Y = BODY_HEIGHT + GAP + RADIUS;
export const TOKEN_HEIGHT = HEAD_Y + RADIUS;

export interface TokenGeometries {
  head: BufferGeometry;
  body: BufferGeometry;
}

export function createTokenGeometries(): TokenGeometries {
  const shoulder = BODY_HEIGHT - RADIUS;
  const profile = [
    new Vector2(0, 0),
    new Vector2(RADIUS - 0.035, 0),
    new Vector2(RADIUS, 0.035),
    new Vector2(RADIUS, shoulder),
  ];
  for (let step = 1; step <= 18; step++) {
    const angle = (step / 18) * (Math.PI / 2);
    profile.push(
      new Vector2(Math.cos(angle) * RADIUS, shoulder + Math.sin(angle) * RADIUS),
    );
  }
  return {
    head: new SphereGeometry(RADIUS, 48, 32),
    body: new LatheGeometry(profile, 64),
  };
}

export interface TokenPose {
  x: number;
  y: number;
  z: number;
  scale: number;
  reveal: number;
  fall: number;
  tone: number;
  highlight: number;
  glow: number;
  leanX: number;
  leanZ: number;
  bob: number;
}

export const createPose = (x = 0, z = 0): TokenPose => ({
  x,
  y: 0,
  z,
  scale: 1,
  reveal: 0,
  fall: 0,
  tone: 1,
  highlight: 0,
  glow: 0,
  leanX: 0,
  leanZ: 0,
  bob: 0,
});

export class TokenRig {
  readonly group = new Group();
  private readonly head: Mesh;
  private readonly materials: ShaderMaterial[];
  private readonly mixed = new Color();

  constructor(
    geometries: TokenGeometries,
    shared: SharedUniforms,
    private readonly base: Color,
    private readonly highlightColor: Color = scenePalette.ally,
    seed = Math.random() * 100,
  ) {
    const headMaterial = createHalftoneMaterial(shared, base, scenePalette.shadow, seed);
    const bodyMaterial = createHalftoneMaterial(shared, base, scenePalette.shadow, seed + 17);
    this.materials = [headMaterial, bodyMaterial];
    this.head = new Mesh(geometries.head, headMaterial);
    this.head.position.y = HEAD_Y;
    this.group.add(new Mesh(geometries.body, bodyMaterial), this.head);
  }

  apply(pose: TokenPose) {
    const visible = pose.reveal > 0.002;
    this.group.visible = visible;
    if (!visible) return;

    this.group.position.set(pose.x, pose.y, pose.z);
    this.group.scale.setScalar(pose.scale);
    this.group.rotation.set(pose.fall + pose.leanX, 0, pose.leanZ);
    this.head.position.y = HEAD_Y + pose.bob;

    this.mixed.lerpColors(scenePalette.dim, this.base, pose.tone).lerp(this.highlightColor, pose.highlight);
    for (const material of this.materials) {
      material.uniforms.uReveal.value = pose.reveal;
      material.uniforms.uGlow.value = pose.glow;
      material.uniforms.uColor.value.copy(this.mixed);
    }
  }

  dispose() {
    this.materials.forEach((material) => material.dispose());
  }
}
