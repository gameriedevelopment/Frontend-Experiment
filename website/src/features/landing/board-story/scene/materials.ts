import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from "three";

export interface SharedUniforms {
  uLightDir: { value: Vector3 };
  uCell: { value: number };
  uPixelRatio: { value: number };
  uTime: { value: number };
}

export function createSharedUniforms(): SharedUniforms {
  return {
    uLightDir: { value: new Vector3(-0.5, 0.85, 0.6).normalize() },
    uCell: { value: 10 },
    uPixelRatio: { value: 1 },
    uTime: { value: 0 },
  };
}

const halftoneVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

// Screen-space halftone: each cell is a dot whose radius follows the lit tone,
// and cells drop out in a seeded order so objects materialise dot by dot.
const halftoneFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uShadow;
  uniform vec3 uLightDir;
  uniform float uCell;
  uniform float uReveal;
  uniform float uGlow;
  uniform float uSeed;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453);
  }

  void main() {
    vec2 cell = floor(gl_FragCoord.xy / uCell);
    if (hash(cell) >= uReveal) discard;

    vec3 normal = normalize(vNormal);
    float diffuse = max(dot(normal, uLightDir), 0.0);
    float rim = pow(1.0 - max(dot(normal, normalize(vViewDir)), 0.0), 2.4);
    float tone = clamp(0.02 + pow(diffuse, 1.4) * 0.9 + rim * 0.38 + uGlow, 0.0, 1.0);

    vec2 local = fract(gl_FragCoord.xy / uCell) - 0.5;
    float radius = mix(0.04, 0.66, tone);
    float edge = 1.4 / uCell;
    float dotMask = 1.0 - smoothstep(radius - edge, radius + edge, length(local));

    gl_FragColor = vec4(mix(uShadow, uColor * (0.5 + 0.5 * tone), dotMask), 1.0);
    #include <colorspace_fragment>
  }
`;

export function createHalftoneMaterial(
  shared: SharedUniforms,
  color: Color,
  shadow: Color,
  seed: number,
) {
  return new ShaderMaterial({
    vertexShader: halftoneVertex,
    fragmentShader: halftoneFragment,
    uniforms: {
      uLightDir: shared.uLightDir,
      uCell: shared.uCell,
      uColor: { value: color.clone() },
      uShadow: { value: shadow.clone() },
      uReveal: { value: 0 },
      uGlow: { value: 0 },
      uSeed: { value: seed },
    },
  });
}

const boardVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uRadius;
  uniform float uPulse;
  uniform float uPulseStrength;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vRing;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    float dist = length(world.xz);
    float reveal = 1.0 - smoothstep(uRadius * 0.62, uRadius, dist);
    float ring = exp(-pow((dist - uPulse) * 1.3, 2.0)) * uPulseStrength;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 2.4 * uPixelRatio * (1.0 + ring * 1.4) * clamp(9.0 / -mvPosition.z, 0.35, 2.0);
    vAlpha = reveal * (0.16 + 0.14 * aSeed + ring * 0.8);
    vRing = clamp(ring, 0.0, 1.0);
  }
`;

const boardFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uPulseColor;
  varying float vAlpha;
  varying float vRing;

  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(mix(uColor, uPulseColor, vRing), vAlpha);
    #include <colorspace_fragment>
  }
`;

export function createBoardMaterial(shared: SharedUniforms, color: Color) {
  return new ShaderMaterial({
    vertexShader: boardVertex,
    fragmentShader: boardFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPixelRatio: shared.uPixelRatio,
      uColor: { value: color.clone() },
      uPulseColor: { value: color.clone() },
      uRadius: { value: 0 },
      uPulse: { value: 0 },
      uPulseStrength: { value: 0 },
    },
  });
}

const dotPathVertex = /* glsl */ `
  attribute float aT;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uReveal;
  uniform float uCentered;
  uniform float uFlow;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float order = mix(aT, abs(aT - 0.5) * 2.0, uCentered);
    float visible = step(order, uReveal) * step(0.0001, uReveal);
    float dash = mix(1.0, 0.3 + 0.7 * step(0.5, fract(aT * 14.0 - uTime * 0.9)), uFlow);
    vAlpha = visible * dash;
    gl_PointSize = uSize * uPixelRatio * clamp(9.0 / -mvPosition.z, 0.5, 2.4);
  }
`;

const dotPathFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.0 || length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function createDotPathMaterial(
  shared: SharedUniforms,
  color: Color,
  { size = 3, centered = false, flow = false } = {},
) {
  return new ShaderMaterial({
    vertexShader: dotPathVertex,
    fragmentShader: dotPathFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uPixelRatio: shared.uPixelRatio,
      uTime: shared.uTime,
      uColor: { value: color.clone() },
      uSize: { value: size },
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uCentered: { value: centered ? 1 : 0 },
      uFlow: { value: flow ? 1 : 0 },
    },
  });
}
