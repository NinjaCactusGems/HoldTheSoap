import { useCallback, useEffect, useRef, useState } from 'react';
import { haptics } from '../lib/haptics';

type PermissionState = 'idle' | 'granted' | 'denied' | 'unavailable';

interface DeviceMotionEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const SMOOTHING_ALPHA = 0.3;
const TILT_SMOOTHING_ALPHA = 0.2;
const DEBOUNCE_MS = 500;
const GRAVITY = 9.81;

/** Tilt (degrees from flat/screen-up) past which the soap slides off / drops. */
export const TILT_THRESHOLD_DEG = 30;

const RAD_TO_DEG = 180 / Math.PI;

/** Current screen rotation in degrees (0/90/180/270), used to map device → screen. */
function screenAngle(): number {
  if (typeof screen !== 'undefined' && typeof screen.orientation?.angle === 'number') {
    return screen.orientation.angle;
  }
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
}

export function useShakeDetector(initialThreshold = 15) {
  const [started, setStarted] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [magnitude, setMagnitude] = useState(0);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [shakeCount, setShakeCount] = useState(0);
  const [lastShakeAt, setLastShakeAt] = useState<number | null>(null);
  // Orientation: tilt away from flat (screen-up), plus the unit downhill
  // direction the soap should slide (device-screen coords; 0,0 when flat).
  const [tilt, setTilt] = useState(0);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  // Refs hold the high-frequency state so 60-100Hz sensor events
  // don't trigger a React re-render per sample. The rAF loop below
  // copies the smoothed value into React state at ~60Hz max.
  const smoothedRef = useRef(0);
  const tiltRef = useRef(0);
  const tiltXRef = useRef(0);
  const tiltYRef = useRef(0);
  const thresholdRef = useRef(initialThreshold);
  const cooldownUntilRef = useRef(0);
  const wasAboveRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    // Prefer gravity-removed linear acceleration. Some browsers (older
    // Android, some iOS configurations) only populate the gravity-
    // included variant; subtract a fixed gravity baseline from the
    // magnitude in that case.
    let mag: number;
    const a = e.acceleration;
    if (a && (a.x !== null || a.y !== null || a.z !== null)) {
      const x = a.x ?? 0;
      const y = a.y ?? 0;
      const z = a.z ?? 0;
      mag = Math.sqrt(x * x + y * y + z * z);
    } else {
      const g = e.accelerationIncludingGravity;
      if (!g) return;
      const x = g.x ?? 0;
      const y = g.y ?? 0;
      const z = g.z ?? 0;
      mag = Math.max(0, Math.sqrt(x * x + y * y + z * z) - GRAVITY);
    }

    const prev = smoothedRef.current;
    const next = SMOOTHING_ALPHA * mag + (1 - SMOOTHING_ALPHA) * prev;
    smoothedRef.current = next;

    const now = performance.now();
    const isAbove = next >= thresholdRef.current;
    const isRisingEdge = isAbove && !wasAboveRef.current;
    wasAboveRef.current = isAbove;

    if (isRisingEdge && now >= cooldownUntilRef.current) {
      cooldownUntilRef.current = now + DEBOUNCE_MS;
      haptics.shake();
      const ts = Date.now();
      setLastShakeAt(ts);
      setShakeCount((c) => c + 1);
    }

    // Orientation from the gravity vector. While the phone is roughly still
    // (the intent during "hold"), accelerationIncludingGravity ≈ gravity, so
    // the tilt away from flat is the angle between it and the screen normal
    // (z). The in-plane part (gx, gy) is the downhill direction the soap slides.
    const g = e.accelerationIncludingGravity;
    if (g && (g.x !== null || g.y !== null || g.z !== null)) {
      const gx = g.x ?? 0;
      const gy = g.y ?? 0;
      const gz = g.z ?? 0;
      const gm = Math.sqrt(gx * gx + gy * gy + gz * gz);
      if (gm > 0.0001) {
        // Tilt magnitude is sign-independent (|gz|/|g|), so it's already correct
        // on every platform.
        const tiltDeg = Math.acos(Math.min(1, Math.abs(gz) / gm)) * RAD_TO_DEG;

        // Downhill direction. iOS reports accelerationIncludingGravity with the
        // opposite sign to Android, but sign(gz) (+ screen-up on Android, − on
        // iOS) captures that, so −sign(gz)·(gx,gy) is the true downhill on both.
        const planar = Math.sqrt(gx * gx + gy * gy);
        let dx = 0;
        let dy = 0;
        if (planar > 0.0001) {
          const s = gz >= 0 ? 1 : -1;
          dx = (-s * gx) / planar;
          dy = (-s * gy) / planar;
          // Device axes are fixed to the hardware; rotate into screen space so
          // the slide is correct in portrait or landscape.
          const r = (screenAngle() * Math.PI) / 180;
          if (r) {
            const c = Math.cos(r);
            const sn = Math.sin(r);
            const rx = dx * c + dy * sn;
            const ry = -dx * sn + dy * c;
            dx = rx;
            dy = ry;
          }
        }

        const a = TILT_SMOOTHING_ALPHA;
        tiltRef.current = a * tiltDeg + (1 - a) * tiltRef.current;
        tiltXRef.current = a * dx + (1 - a) * tiltXRef.current;
        tiltYRef.current = a * dy + (1 - a) * tiltYRef.current;
      }
    }
  }, []);

  const start = useCallback(async () => {
    if (started) return;

    if (typeof DeviceMotionEvent === 'undefined') {
      setPermissionState('unavailable');
      return;
    }

    const ctor = DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
    if (typeof ctor.requestPermission === 'function') {
      try {
        const result = await ctor.requestPermission();
        if (result !== 'granted') {
          setPermissionState('denied');
          return;
        }
      } catch {
        setPermissionState('denied');
        return;
      }
    }

    setPermissionState('granted');
    listenerRef.current = handleMotion;
    window.addEventListener('devicemotion', handleMotion);
    setStarted(true);
  }, [started, handleMotion]);

  // Pump the smoothed ref into React state at ~60Hz max.
  useEffect(() => {
    if (!started) return;
    const tick = () => {
      setMagnitude(smoothedRef.current);
      setTilt(tiltRef.current);
      setTiltX(tiltXRef.current);
      setTiltY(tiltYRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [started]);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('devicemotion', listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, []);

  return {
    start,
    started,
    permissionState,
    magnitude,
    threshold,
    setThreshold,
    shakeCount,
    lastShakeAt,
    tilt,
    tiltX,
    tiltY,
  };
}
