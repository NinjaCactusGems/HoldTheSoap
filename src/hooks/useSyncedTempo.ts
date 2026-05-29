import { useEffect, useRef } from 'react';
import type { Tempo } from '../lib/tempo';

/**
 * Applies a server-driven tempo change at the exact synced instant it takes
 * effect on every device. The server broadcasts the upcoming `tempo` together
 * with `effectiveAt` (a server timestamp, sent slightly ahead of time);
 * `toLocalTime` maps that into this client's clock so all rooms flip together.
 *
 * Used twice — once to drive the music playback rate, once to drive the shake
 * threshold — so both shift in lockstep with each other and across the room.
 *
 * When `effectiveAt` is null (not jousting) it snaps straight back to normal.
 */
export function useSyncedTempo(
  tempo: Tempo,
  effectiveAt: number | null,
  toLocalTime: (serverTs: number) => number,
  apply: (tempo: Tempo) => void,
) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const lastKeyRef = useRef<number | 'none'>('none');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (effectiveAt == null) {
      // Round over / not jousting — return to normal once.
      if (lastKeyRef.current !== 'none') {
        lastKeyRef.current = 'none';
        applyRef.current('normal');
      }
      return;
    }

    // Re-broadcasts of the same change (e.g. a mid-round join) are ignored.
    if (effectiveAt === lastKeyRef.current) return;
    lastKeyRef.current = effectiveAt;

    const delay = Math.max(0, toLocalTime(effectiveAt) - Date.now());
    timerRef.current = window.setTimeout(() => {
      applyRef.current(tempo);
    }, delay);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [tempo, effectiveAt, toLocalTime]);
}
