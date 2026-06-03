import { useEffect, useRef } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  MeshStandardMaterial,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  Clock,
  Color,
  MathUtils,
  Box3,
  Vector2,
  Vector3,
  type BufferGeometry,
  type CanvasTexture,
} from 'three';
import { makeSoapGeometry, makeSoapTextures } from '../lib/soap';

/**
 * A full-screen, procedurally-generated 3D bar of soap (see ../lib/soap). Matte
 * soap material lit by cheap lights (no PMREM/env — that was the biggest startup
 * hitch). The bar trembles in response to the live device-motion `magnitude`
 * (from useShakeDetector), so a shaky hand visibly makes the soap threaten to
 * slip. Mirrors Bubbles.tsx: respects reduced motion, pauses when hidden.
 */

// The procedural mesh + textures are built ONCE and reused. HoldingView remounts
// every round, and regenerating the normal map (a per-pixel loop) each time was a
// visible hitch. preloadSoapAssets() lets the Ready countdown build them (and the
// lazy chunk download) ahead of time, so nothing heavy runs when the soap appears.
// Textures depend on the engraved word, so they're cached per label (≤ 2 locales).
let cachedGeometry: BufferGeometry | null = null;
const cachedTextures = new Map<string, { colorMap: CanvasTexture; normalMap: CanvasTexture }>();

function getSoapAssets(label: string) {
  if (!cachedGeometry) cachedGeometry = makeSoapGeometry();
  let textures = cachedTextures.get(label);
  if (!textures) {
    textures = makeSoapTextures(label);
    cachedTextures.set(label, textures);
  }
  return { geometry: cachedGeometry, ...textures };
}

/** Warm the cached geometry + textures for `label` (call during the Ready phase). */
export function preloadSoapAssets(label: string): void {
  getSoapAssets(label);
}

export default function SoapScene({
  magnitude,
  label,
}: {
  magnitude: number;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Latest magnitude, read by the animation loop without re-running the effect.
  const magRef = useRef(magnitude);
  magRef.current = magnitude;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // updateStyle=true (default): three sets the canvas CSS size to the viewport.
    // Without it a <canvas> falls back to its buffer pixel size (replaced
    // element), rendering ~2x too big and pinned to the top-left.
    renderer.setSize(width, height);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Soft, cheap lighting — matte soap doesn't need an environment map, and
    // skipping PMREM removes the big first-frame stall.
    const hemi = new HemisphereLight(0xffe3f1, 0xd98cb4, 1.1);
    scene.add(hemi);
    const key = new DirectionalLight(0xffffff, 2);
    key.position.set(2.5, 4, 4);
    scene.add(key);
    const fill = new DirectionalLight(0xffd9ec, 0.5);
    fill.position.set(-3, -1, 2);
    scene.add(fill);
    // A coloured point light we sweep for a soft travelling highlight.
    const glint = new PointLight(0xffe0f2, 18, 50, 2);
    scene.add(glint);

    const { geometry, colorMap, normalMap } = getSoapAssets(label);
    const material = new MeshStandardMaterial({
      color: new Color('#ffd9ec'),
      // Colour map tints the recessed brand word darker so it always reads.
      map: colorMap,
      // High roughness, no clearcoat/transmission → a soft matte soap finish.
      roughness: 0.72,
      metalness: 0,
      // Normal map adds the engraved bevel on top of the colour recess.
      normalMap: normalMap,
      normalScale: new Vector2(1.1, 1.1),
    });

    const soap = new Mesh(geometry, material);
    scene.add(soap);

    // Top (stamped) face toward the camera, tilted a little so the thickness
    // reads, with a diagonal roll for presence (horizontal bar).
    const baseRotX = Math.PI / 2 - 0.3;
    const baseRotZ = -0.4;

    // Measure the bar's actual projected size at unit scale, then "contain" it
    // inside the camera frustum with a margin. This keeps the whole bar on
    // screen and centred in any aspect ratio (portrait or landscape).
    const fitBox = new Box3();
    const fitSize = new Vector3();
    let baseScale = 1;
    function fit() {
      const vFOV = MathUtils.degToRad(camera.fov);
      const visH = 2 * Math.tan(vFOV / 2) * camera.position.z;
      const visW = visH * camera.aspect;
      soap.position.set(0, 0, 0);
      soap.rotation.set(baseRotX, 0, baseRotZ);
      soap.scale.setScalar(1);
      soap.updateMatrixWorld(true);
      fitBox.setFromObject(soap);
      fitBox.getSize(fitSize);
      const fill = 0.96;
      baseScale = Math.min((visW * fill) / fitSize.x, (visH * fill) / fitSize.y);
      soap.scale.setScalar(baseScale);
    }
    fit();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clock = new Clock();
    let rafId = 0;
    let running = false;
    let tremble = 0;

    function frame(animated: boolean) {
      const t = clock.getElapsedTime();

      // Ease the tremble toward an intensity derived from live acceleration.
      const intensity = animated ? Math.min(magRef.current / 12, 1.5) : 0;
      tremble += (intensity - tremble) * 0.08;

      // Gentle idle sway (kept small so it stays within the fitted margin), plus
      // a tremble that grows with movement.
      const idleRotY = animated ? Math.sin(t * 0.4) * 0.12 : 0.08;
      const idleBob = animated ? Math.sin(t * 0.9) * 0.03 : 0;
      const jitter = animated
        ? Math.sin(t * 34) * 0.05 * tremble + (Math.random() - 0.5) * 0.1 * tremble
        : 0;

      soap.rotation.x = baseRotX + jitter * 0.5;
      soap.rotation.y = idleRotY + jitter;
      soap.rotation.z = baseRotZ + jitter * 0.4;
      soap.position.y = idleBob;
      soap.position.x = animated ? Math.sin(t * 19) * 0.1 * tremble : 0;

      // Squash-stretch pulse around the fitted base scale, growing with tremble.
      const squash = animated ? 1 + Math.sin(t * 26) * 0.04 * tremble : 1;
      soap.scale.set(baseScale, baseScale * squash, baseScale);

      glint.position.set(Math.cos(t * 0.7) * 4, 2 + Math.sin(t * 0.5) * 1.5, 4);

      renderer.render(scene, camera);
    }

    function loop() {
      frame(true);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      clock.start();
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fit();
      if (!running) frame(false); // keep a correct static frame
    }

    function onVisibility() {
      if (document.hidden) stop();
      else if (!reduceMotion.matches) start();
    }

    function onMotionPrefChange() {
      stop();
      if (reduceMotion.matches) frame(false);
      else start();
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener('change', onMotionPrefChange);

    if (reduceMotion.matches) frame(false);
    else start();

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener('change', onMotionPrefChange);
      // Geometry + textures are cached and reused across rounds — only the
      // per-mount renderer and material are disposed.
      material.dispose();
      renderer.dispose();
    };
  }, [label]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
