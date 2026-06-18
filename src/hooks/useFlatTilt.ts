import { useEffect, useRef } from 'react';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const LIMIT_DEG = 20; // tilt angle mapped to the full offset
const MAX_PX = 16; // furthest the element drifts
const EASE = 0.08; // lerp factor — gentle follow

// Subtly parallax an element with the phone's tilt, taking "lying flat" as the
// baseline: deviceorientation beta (front-back) and gamma (left-right) are ~0°
// when the phone is face-up on a table, so the element rests centred and drifts
// a few pixels as you tilt. Processed entirely on-device; we don't prompt for
// permission here, so it simply stays still where orientation isn't available
// (e.g. iOS before motion access is granted). Respects reduced-motion.
export function useFlatTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0,
      targetY = 0,
      curX = 0,
      curY = 0,
      raf = 0,
      running = false;

    const tick = () => {
      curX += (targetX - curX) * EASE;
      curY += (targetY - curY) * EASE;
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      targetX = (clamp(e.gamma, -LIMIT_DEG, LIMIT_DEG) / LIMIT_DEG) * MAX_PX;
      targetY = (clamp(e.beta, -LIMIT_DEG, LIMIT_DEG) / LIMIT_DEG) * MAX_PX;
      // Only spin up the animation loop once the device actually reports tilt.
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('deviceorientation', onOrient);
    return () => {
      window.removeEventListener('deviceorientation', onOrient);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}
