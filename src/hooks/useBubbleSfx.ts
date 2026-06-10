import { useEffect, useRef } from 'react';
import { sfx } from '../lib/sfx';

// Pop rate sweeps exponentially with `closeness` (0 = perfectly steady,
// 1 = right at the elimination threshold): rate(c) = RATE_MIN_HZ · RATIO^c.
const RATE_MIN_HZ = 0.25; // steady phone → a pop every ~4s on average
const RATE_MAX_HZ = 6.5; // at the threshold → ~6–7 pops/s, almost annoying
const RATE_RATIO = RATE_MAX_HZ / RATE_MIN_HZ;
// Clamp the randomized gaps so the stream never machine-guns or stalls.
const MIN_DELAY_MS = 90;
const MAX_DELAY_MS = 7000;

/**
 * The hold phase's audio pressure gauge: random bubble pops whose frequency
 * rises exponentially as this player's motion nears the elimination threshold
 * — sparse while the phone is steady, a nervous fizz right at the limit.
 *
 * `closeness` arrives every render (the shake detector re-renders the view at
 * ~60Hz) and is stashed in a ref; a single self-rescheduling timeout chain
 * reads it at each hop, so the rate tracks motion continuously without the
 * effect re-running. Gaps are exponentially distributed (a Poisson stream),
 * which sounds natural rather than metronomic.
 */
export function useBubbleSfx(active: boolean, closeness: number) {
  const cRef = useRef(0);
  cRef.current = Math.min(1, Math.max(0, closeness));

  useEffect(() => {
    if (!active) return;
    let timer = 0;
    const schedule = () => {
      const rate = RATE_MIN_HZ * Math.pow(RATE_RATIO, cRef.current); // Hz
      const mean = 1000 / rate;
      const delay = Math.min(
        MAX_DELAY_MS,
        Math.max(MIN_DELAY_MS, -Math.log(1 - Math.random()) * mean),
      );
      timer = window.setTimeout(() => {
        sfx.bubble(cRef.current);
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [active]);
}
