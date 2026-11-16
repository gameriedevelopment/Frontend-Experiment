import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Mesh,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  type ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { clamp, damp, easeOutCubic, lerp } from "@/lib/easing";
import {
  createBoardLayout,
  createFrame,
  FIT_COUNT,
  PODIUM_HEIGHT,
  poseBoard,
  type BoardFrame,
  type BoardSpot,
} from "./choreography";
import {
  createBoardMaterial,
  createDotPathMaterial,
  createHalftoneMaterial,
  createSharedUniforms,
} from "./materials";
import { scenePalette } from "./palette";
import { createTokenGeometries, TOKEN_HEIGHT, TokenRig } from "./token";

const TAU = Math.PI * 2;

function dotGeometry(points: Vector3[], closed = false) {
  const positions = new Float32Array(points.length * 3);
  const order = new Float32Array(points.length);
  const span = closed ? points.length : points.length - 1;
  points.forEach((point, index) => {
    positions.set([point.x, point.y, point.z], index * 3);
    order[index] = index / span;
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aT", new BufferAttribute(order, 1));
  return geometry;
}

const ring = (radius: number, count: number, y = 0) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * TAU;
    return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });

const arc = (to: BoardSpot, height: number, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return new Vector3(to.x * t, 0.04 + Math.sin(Math.PI * t) * height, to.z * t);
  });

function boardGeometry(extent: number, spacing: number) {
  const positions: number[] = [];
  const seeds: number[] = [];
  for (let x = -extent; x <= extent; x += spacing) {
    for (let z = -extent; z <= extent; z += spacing) {
      positions.push(x, 0, z);
      seeds.push(Math.random());
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("aSeed", new BufferAttribute(new Float32Array(seeds), 1));
  return geometry;
}

export interface BoardSceneOptions {
  reducedMotion: boolean;
}

export class BoardScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 120);
  private readonly shared = createSharedUniforms();
  private readonly geometries = createTokenGeometries();
  private readonly layout = createBoardLayout();
  private readonly frame: BoardFrame;

  private readonly you: TokenRig;
  private readonly others: TokenRig[];
  private readonly rivals: TokenRig[];
  private readonly gems: Mesh<OctahedronGeometry, ShaderMaterial>[];
  private readonly podium: Mesh<CylinderGeometry, ShaderMaterial>;
  private readonly board: Points<BufferGeometry, ShaderMaterial>;
  private readonly links: Points<BufferGeometry, ShaderMaterial>[];
  private readonly platform: Points<BufferGeometry, ShaderMaterial>;
  private readonly versus: Points<BufferGeometry, ShaderMaterial>;
  private readonly halo: Points<BufferGeometry, ShaderMaterial>;

  private readonly pointer = new Vector2();
  private readonly pointerTarget = new Vector2();
  private readonly lightBase = new Vector3(-0.55, 0.85, 0.55);
  private width = 1;
  private height = 1;
  private progress = 0;
  private progressTarget = 0;
  private elapsed = 0;
  private lastTick = 0;
  private rafId = 0;
  private running = false;
  private readonly bornAt = performance.now();

  constructor(
    canvas: HTMLCanvasElement,
    private readonly options: BoardSceneOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.frame = createFrame(this.layout);

    this.you = new TokenRig(this.geometries, this.shared, scenePalette.you, scenePalette.ally, 3);
    this.others = this.layout.map(
      (_, index) =>
        new TokenRig(this.geometries, this.shared, scenePalette.crowd, scenePalette.ally, index * 7.3),
    );
    this.rivals = this.frame.rivals.map(
      (_, index) => new TokenRig(this.geometries, this.shared, scenePalette.rival, scenePalette.ally, 50 + index * 5.1),
    );
    [this.you, ...this.others, ...this.rivals].forEach((rig) => this.scene.add(rig.group));

    const gemGeometry = new OctahedronGeometry(0.13);
    this.gems = [scenePalette.ally, scenePalette.signal, scenePalette.you].map((color, index) => {
      const gem = new Mesh(gemGeometry, createHalftoneMaterial(this.shared, color, scenePalette.shadow, 90 + index));
      this.scene.add(gem);
      return gem;
    });

    const podiumGeometry = new CylinderGeometry(0.62, 0.72, PODIUM_HEIGHT, 48);
    podiumGeometry.translate(0, PODIUM_HEIGHT / 2, 0);
    this.podium = new Mesh(podiumGeometry, createHalftoneMaterial(this.shared, scenePalette.podium, scenePalette.shadow, 120));
    this.scene.add(this.podium);

    this.board = new Points(boardGeometry(15, 0.5), createBoardMaterial(this.shared, scenePalette.board));
    this.links = this.layout.slice(0, FIT_COUNT).map(
      (spot) => new Points(dotGeometry(arc(spot, 0.55, 46)), createDotPathMaterial(this.shared, scenePalette.signal, { size: 3.4, flow: true })),
    );
    this.platform = new Points(
      dotGeometry([...ring(3.15, 132, 0.015), ...ring(2.65, 104, 0.015)], true),
      createDotPathMaterial(this.shared, scenePalette.ring, { size: 2.6 }),
    );
    this.versus = new Points(
      dotGeometry(Array.from({ length: 72 }, (_, index) => new Vector3(-3.6 + (index / 71) * 7.2, 0.03, -3.05))),
      createDotPathMaterial(this.shared, scenePalette.signal, { size: 3.2, centered: true }),
    );
    this.halo = new Points(
      dotGeometry(ring(0.48, 40), true),
      createDotPathMaterial(this.shared, scenePalette.signal, { size: 3.6 }),
    );
    this.scene.add(this.board, ...this.links, this.platform, this.versus, this.halo);
  }

  setProgress(value: number) {
    this.progressTarget = clamp(value);
  }

  setPointer(x: number, y: number) {
    this.pointerTarget.set(clamp(x, -1, 1), clamp(y, -1, 1));
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.shared.uPixelRatio.value = pixelRatio;
    this.shared.uCell.value = (this.width < 640 ? 5 : 6.5) * pixelRatio;
    if (!this.running) this.render(0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTick = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  dispose() {
    this.stop();
    this.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof Points) {
        object.geometry.dispose();
        (object.material as ShaderMaterial).dispose();
      }
    });
    this.renderer.dispose();
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const delta = Math.min((now - this.lastTick) / 1000, 0.05);
    this.lastTick = now;
    this.render(delta);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private render(delta: number) {
    const { reducedMotion } = this.options;
    this.elapsed += reducedMotion ? 0 : delta;
    this.shared.uTime.value = this.elapsed;
    this.progress = damp(this.progress, this.progressTarget, reducedMotion ? 30 : 5, delta || 1);
    this.pointer.set(
      damp(this.pointer.x, this.pointerTarget.x, 3, delta),
      damp(this.pointer.y, this.pointerTarget.y, 3, delta),
    );

    const intro = reducedMotion ? 1 : easeOutCubic(clamp((performance.now() - this.bornAt - 200) / 1600));
    const frame = this.frame;
    poseBoard(this.progress, this.layout, frame);

    this.applyTokens(frame, intro);
    this.applyEffects(frame, intro);
    this.applyCamera(frame);

    this.shared.uLightDir.value
      .set(this.pointer.x * 0.45, this.pointer.y * 0.25, 0)
      .add(this.lightBase)
      .normalize();

    this.renderer.render(this.scene, this.camera);
  }

  private applyTokens(frame: BoardFrame, intro: number) {
    const t = this.elapsed;
    const you = frame.you;
    you.reveal = intro;
    you.leanZ = -this.pointer.x * 0.1;
    you.leanX = this.pointer.y * 0.06;
    you.bob = Math.sin(t * 1.7) * 0.03;
    this.you.apply(you);
    frame.others.forEach((pose, index) => this.others[index].apply(pose));
    frame.rivals.forEach((pose, index) => this.rivals[index].apply(pose));

    this.gems.forEach((gem, index) => {
      const reveal = clamp(frame.gems * 3 - index * 0.6);
      gem.visible = reveal > 0.002;
      const angle = t * 0.55 + (index * TAU) / 3;
      gem.position.set(Math.cos(angle) * 1.0, you.y + 1.05 + Math.sin(t * 1.4 + index * 2) * 0.09, Math.sin(angle) * 1.0);
      gem.rotation.set(t * 0.6, t * 0.9 + index, 0);
      gem.scale.setScalar(lerp(0.4, 1, reveal));
      gem.material.uniforms.uReveal.value = reveal;
    });

    this.podium.visible = frame.podium > 0.002;
    this.podium.scale.set(1, Math.max(frame.podium, 0.001), 1);
    this.podium.material.uniforms.uReveal.value = clamp(frame.podium * 4);
  }

  private applyEffects(frame: BoardFrame, intro: number) {
    const board = this.board.material.uniforms;
    board.uRadius.value = frame.boardRadius * intro;
    board.uPulse.value = frame.pulseRadius;
    board.uPulseStrength.value = frame.pulseStrength;
    board.uPulseColor.value.copy(frame.pulseSignal ? scenePalette.signal : scenePalette.pulse);

    this.links.forEach((link) => {
      link.visible = frame.linkOpacity > 0 && frame.linkDraw > 0;
      link.material.uniforms.uReveal.value = frame.linkDraw;
      link.material.uniforms.uOpacity.value = frame.linkOpacity;
    });

    this.platform.visible = frame.platform > 0;
    this.platform.rotation.y = this.elapsed * 0.12;
    this.platform.material.uniforms.uReveal.value = frame.platform;
    this.platform.material.uniforms.uOpacity.value = 0.75;

    this.versus.visible = frame.versus > 0 && frame.versusOpacity > 0;
    this.versus.material.uniforms.uReveal.value = frame.versus;
    this.versus.material.uniforms.uOpacity.value = frame.versusOpacity;

    this.halo.visible = frame.halo > 0;
    this.halo.position.y = frame.you.y + TOKEN_HEIGHT + 0.3;
    this.halo.rotation.y = this.elapsed * 0.9;
    this.halo.material.uniforms.uReveal.value = frame.halo;
  }

  private applyCamera(frame: BoardFrame) {
    const { width, height } = this;
    const aspect = width / height;
    const tall = aspect < 0.85;
    const hero = frame.heroWeight;
    const distance = tall
      ? lerp(clamp(0.95 / aspect, 1.25, 2.2), 2, hero)
      : Math.max(1, 1.45 / aspect);

    const sway = this.options.reducedMotion ? 0 : Math.sin(this.elapsed * 0.25) * 0.12;
    this.camera.position
      .copy(frame.cameraPosition)
      .sub(frame.cameraTarget)
      .multiplyScalar(distance)
      .add(frame.cameraTarget);
    this.camera.position.x += this.pointer.x * 0.35 + sway;
    this.camera.position.y += this.pointer.y * 0.18;
    this.camera.lookAt(frame.cameraTarget);

    const shiftX = tall ? 0 : lerp(-0.05, 0, hero);
    const shiftY = tall ? lerp(0.17, 0.05, hero) : lerp(0, -0.17, hero);
    this.camera.setViewOffset(width, height, shiftX * width, shiftY * height, width, height);
  }
}
