import { useEffect, useRef } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  MeshPhysicalMaterial,
  DirectionalLight,
  PointLight,
  PMREMGenerator,
  Clock,
  Color,
  MathUtils,
  Box3,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeSoapGeometry, makeStampTexture } from '../lib/soap';

/**
 * A full-screen, procedurally-generated 3D bar of soap (see ../lib/soap). Glossy
 * translucent glycerin material lit by a procedural room environment — no model
 * or HDR assets. The bar trembles in response to the live device-motion
 * `magnitude` (from useShakeDetector), so a shaky hand visibly makes the soap
 * threaten to slip. Mirrors Bubbles.tsx: respects reduced motion, pauses when
 * hidden, and disposes all GPU resources on unmount.
 */
export default function SoapScene({ magnitude }: { magnitude: number }) {
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
    renderer.setSize(width, height, false);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Procedural reflections/lighting — no HDR file needed.
    const pmrem = new PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envRT = pmrem.fromScene(envScene, 0.04);
    scene.environment = envRT.texture;

    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    // A coloured point light we sweep for a travelling specular glint.
    const glint = new PointLight(0xffe0f2, 40, 60, 2);
    scene.add(glint);

    const geometry = makeSoapGeometry();
    const bump = makeStampTexture();
    const material = new MeshPhysicalMaterial({
      color: new Color('#ffd9ec'),
      roughness: 0.18,
      metalness: 0,
      transmission: 0.65,
      thickness: 1.2,
      ior: 1.4,
      clearcoat: 1,
      clearcoatRoughness: 0.25,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      attenuationColor: new Color('#ff9ccb'),
      attenuationDistance: 2.5,
      sheen: 0.5,
      sheenColor: new Color('#ffffff'),
      envMapIntensity: 1.4,
      bumpMap: bump,
      bumpScale: 0.6,
      transparent: true,
    });

    const soap = new Mesh(geometry, material);
    scene.add(soap);

    // Rest pose: the stamped broad face turned toward the camera, tilted back a
    // little so the bar's thickness reads. The animation loop nudges around this.
    const baseRotX = Math.PI / 2 - 0.3;
    const baseRotZ = 0.05;

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
      const fill = 0.9;
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
      const intensity = animated
        ? Math.min(magRef.current / 12, 1.5)
        : 0;
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
      renderer.setSize(width, height, false);
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
      geometry.dispose();
      material.dispose();
      bump.dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
