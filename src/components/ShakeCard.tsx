import { useEffect, useState } from 'react';
import { useShakeDetector } from '../hooks/useShakeDetector';

const DISPLAY_MAX = 40;
const FLASH_MS = 250;

export function ShakeCard() {
  const {
    start,
    started,
    permissionState,
    magnitude,
    threshold,
    setThreshold,
    shakeCount,
    lastShakeAt,
  } = useShakeDetector(15);

  const [flashing, setFlashing] = useState(false);
  useEffect(() => {
    if (lastShakeAt === null) return;
    setFlashing(true);
    const id = window.setTimeout(() => setFlashing(false), FLASH_MS);
    return () => window.clearTimeout(id);
  }, [lastShakeAt]);

  return !started ? (
    <IdleView start={start} permissionState={permissionState} />
  ) : (
    <RunningView
      magnitude={magnitude}
      threshold={threshold}
      setThreshold={setThreshold}
      shakeCount={shakeCount}
      flashing={flashing}
    />
  );
}

function IdleView({
  start,
  permissionState,
}: {
  start: () => Promise<void>;
  permissionState: 'idle' | 'granted' | 'denied' | 'unavailable';
}) {
  const blocked = permissionState === 'denied' || permissionState === 'unavailable';
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <button
        type="button"
        onClick={start}
        disabled={blocked}
        className="w-full rounded-full border-2 border-accent-edge bg-accent px-8 py-4 text-lg font-semibold text-paper shadow-lg shadow-accent/25 hover:bg-accent-soft active:scale-95 transition disabled:border-line disabled:bg-line disabled:text-ink-faint disabled:shadow-none"
      >
        Start
      </button>
      <p className="text-sm text-ink-muted text-center">
        Tap to enable motion sensing.
      </p>
      {blocked && (
        <p className="text-sm text-accent text-center">
          Motion sensors aren&apos;t available or were denied. Open
          holdthesoap.com on a phone.
        </p>
      )}
    </div>
  );
}

function RunningView({
  magnitude,
  threshold,
  setThreshold,
  shakeCount,
  flashing,
}: {
  magnitude: number;
  threshold: number;
  setThreshold: (v: number) => void;
  shakeCount: number;
  flashing: boolean;
}) {
  const fillPct = Math.min(100, (magnitude / DISPLAY_MAX) * 100);
  const tickPct = Math.min(100, (threshold / DISPLAY_MAX) * 100);

  return (
    <div className="flex flex-col items-stretch gap-5 w-full max-w-sm">
      <label className="flex flex-col gap-2">
        <span className="flex justify-between text-sm text-ink-muted">
          <span>Threshold</span>
          <span className="font-mono text-ink">
            {threshold.toFixed(1)} m/s²
          </span>
        </span>
        <input
          type="range"
          min={5}
          max={DISPLAY_MAX}
          step={0.5}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-ink-muted">
          <span>Acceleration</span>
          <span className="font-mono text-ink">
            {magnitude.toFixed(1)} m/s²
          </span>
        </div>
        <div
          className={`relative h-4 w-full rounded-full overflow-hidden transition-colors duration-150 ${
            flashing ? 'bg-flash/40' : 'bg-line'
          }`}
        >
          <div
            className="h-full bg-accent transition-[width] duration-75 ease-linear"
            style={{ width: `${fillPct}%` }}
          />
          <div
            className="absolute top-0 h-full w-px bg-ink/70"
            style={{ left: `${tickPct}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="text-sm text-ink-muted text-center">
        Shakes: <span className="font-mono text-ink">{shakeCount}</span>
      </div>
    </div>
  );
}
