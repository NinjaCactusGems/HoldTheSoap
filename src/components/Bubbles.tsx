import { useEffect, useRef } from 'react';

/**
 * Subtle background canvas of soap bubbles drifting upward. Bubbles dodge the
 * pointer / touch location (repulsion), then ease back to their baseline rise.
 * Purely decorative: fixed, behind content, and `pointer-events: none` so it
 * never blocks the UI. Respects reduced motion.
 */

const MIN_SIZE = 6; // radius
const MAX_SIZE = 26;
const MIN_OPACITY = 0.18;
const MAX_OPACITY = 0.5;
const MIN_VY = 0.2; // upward speed (positive magnitude; applied as -vy)
const MAX_VY = 0.7;
const WOBBLE = 0.25; // gentle horizontal sway amplitude

const REPEL_RADIUS = 110;
const REPEL_FORCE = 0.9;
const EASE_BACK = 0.04;

const MAX_COUNT = 52;
const MIN_COUNT = 16;
const POINTER_IDLE_MS = 1200; // bubbles resettle if pointer stops moving

type Bubble = {
  x: number;
  y: number;
  size: number; // radius
  baseVy: number; // upward baseline speed (negative)
  phase: number; // wobble phase
  vx: number;
  vy: number;
  opacity: number;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function targetCount(width: number): number {
  return Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.round(Math.min(width, 900) / 15)));
}

/** A bubble's rise speed scales with its size for a gentle parallax feel. */
function makeBubble(width: number, height: number, atBottom: boolean): Bubble {
  const size = rand(MIN_SIZE, MAX_SIZE);
  const sizeFrac = (size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE);
  const baseVy = -(MIN_VY + sizeFrac * (MAX_VY - MIN_VY));
  return {
    x: rand(0, width),
    y: atBottom ? height + size + rand(0, height * 0.3) : rand(0, height),
    size,
    baseVy,
    phase: rand(0, Math.PI * 2),
    vx: 0,
    vy: baseVy,
    opacity: rand(MIN_OPACITY, MAX_OPACITY),
  };
}

export function Bubbles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let bubbles: Bubble[] = [];
    let rafId = 0;
    let running = false;

    const pointer = { x: 0, y: 0, active: false };
    let pointerTimer = 0;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Match particle count to viewport.
      const want = targetCount(width);
      while (bubbles.length < want) bubbles.push(makeBubble(width, height, true));
      if (bubbles.length > want) bubbles.length = want;
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const b of bubbles) {
        ctx!.globalAlpha = b.opacity;
        // Translucent white fill + a slightly brighter rim and a small sheen
        // highlight, so each circle reads as a soap bubble.
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fill();
        ctx!.lineWidth = 1;
        ctx!.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, Math.max(1, b.size * 0.18), 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function step() {
      for (const b of bubbles) {
        // Repulsion away from the pointer, with a soft falloff to the edge.
        if (pointer.active) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS) {
            const falloff = (1 - dist / REPEL_RADIUS) ** 2;
            if (dist > 0.0001) {
              b.vx += (dx / dist) * REPEL_FORCE * falloff;
              b.vy += (dy / dist) * REPEL_FORCE * falloff;
            } else {
              b.vx += rand(-1, 1) * REPEL_FORCE;
              b.vy += rand(-1, 1) * REPEL_FORCE;
            }
          }
        }

        // Gentle horizontal sway, plus ease back toward the baseline rise.
        b.phase += 0.02;
        const sway = Math.sin(b.phase) * WOBBLE;
        b.vx += (sway - b.vx) * EASE_BACK;
        b.vy += (b.baseVy - b.vy) * EASE_BACK;

        b.x += b.vx;
        b.y += b.vy;

        // Recycle off the top; wrap if pushed past the left/right edges.
        if (b.y + b.size < 0) {
          Object.assign(b, makeBubble(width, height, true), { y: height + b.size });
        }
        if (b.x < -b.size) b.x = width + b.size;
        else if (b.x > width + b.size) b.x = -b.size;
      }

      draw();
      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function onPointerMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      window.clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(() => {
        pointer.active = false;
      }, POINTER_IDLE_MS);
    }

    function clearPointer() {
      pointer.active = false;
      window.clearTimeout(pointerTimer);
    }

    function onVisibility() {
      if (document.hidden) stop();
      else if (!reduceMotion.matches) start();
    }

    function onMotionPrefChange() {
      stop();
      if (reduceMotion.matches) {
        draw(); // single static frame
      } else {
        start();
      }
    }

    // Init
    resize();
    bubbles = Array.from({ length: targetCount(width) }, () =>
      makeBubble(width, height, false),
    );

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });
    window.addEventListener('pointercancel', clearPointer);
    window.addEventListener('blur', clearPointer);
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener('change', onMotionPrefChange);

    if (reduceMotion.matches) {
      draw(); // static frame, no animation loop
    } else {
      start();
    }

    return () => {
      stop();
      window.clearTimeout(pointerTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerMove);
      window.removeEventListener('pointercancel', clearPointer);
      window.removeEventListener('blur', clearPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener('change', onMotionPrefChange);
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
