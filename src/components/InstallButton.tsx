import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Bubble = {
  id: number;
  size: number;
  startX: number; // px offset from the pill centre where it spawns
  bx: number; // px the bubble drifts horizontally
  by: number; // px the bubble rises (negative = up)
  dur: number; // seconds
  delay: number; // seconds (stagger)
};

// One celebratory burst of soap bubbles floating up out of the pill.
function makeBurst(nextId: () => number): Bubble[] {
  return Array.from({ length: 26 }, () => ({
    id: nextId(),
    size: rand(8, 22),
    startX: rand(-18, 18),
    bx: rand(-70, 70),
    by: rand(-150, -70),
    dur: rand(0.9, 1.6),
    delay: rand(0, 0.18),
  }));
}

// "Add to Home Screen" pill, paired with How-to-play under the title. On
// Android/Chromium it fires the native install dialog; on iOS (no programmatic
// install) it opens a small how-to card. Once the app is installed it stays put
// and becomes a soap-bubble button — each tap pops a burst of bubbles.
export function InstallButton() {
  const { t } = useI18n();
  const { canPrompt, isIos, isStandalone, installed, promptInstall } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // Dismiss the iOS help card on outside tap / Escape — mirrors LanguageSwitcher.
  useEffect(() => {
    if (!showIosHelp) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setShowIosHelp(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIosHelp(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showIosHelp]);

  // Already installed: running standalone, or installed via our button this
  // session. There's nothing left to install, so the pill just pops bubbles.
  const alreadyInstalled = isStandalone || installed;

  // Hide only when there's no install path at all and the app isn't installed
  // (e.g. a desktop browser that never offers an install) — keeps the row tidy.
  if (!canPrompt && !isIos && !alreadyInstalled) return null;

  const popBubbles = () => {
    const batch = makeBurst(() => idRef.current++);
    setBubbles((prev) => [...prev, ...batch]);
    const ids = new Set(batch.map((b) => b.id));
    window.setTimeout(
      () => setBubbles((prev) => prev.filter((b) => !ids.has(b.id))),
      1900,
    );
  };

  const onClick = () => {
    if (alreadyInstalled) popBubbles();
    else if (canPrompt) void promptInstall();
    else setShowIosHelp((s) => !s);
  };

  return (
    <div ref={rootRef} className="relative flex-1">
      <button
        type="button"
        onClick={onClick}
        aria-haspopup={isIos && !alreadyInstalled ? 'dialog' : undefined}
        aria-expanded={isIos && !alreadyInstalled ? showIosHelp : undefined}
        className="surface relative flex h-full w-full items-center justify-center gap-2 overflow-visible px-3 py-3 text-center shadow-soft rotate-[2deg] active:scale-95 transition"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-ink-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Phone outline with a down-arrow: "put this onto your device". */}
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M12 8v6m0 0-2.5-2.5M12 14l2.5-2.5" />
        </svg>
        <span className="text-sm font-semibold text-ink-muted">{t('install.cta')}</span>

        {/* Soap-bubble burst: spawns from the pill centre and floats up/out. */}
        {bubbles.length > 0 && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
            {bubbles.map((b) => (
              <span
                key={b.id}
                className="animate-bubble-rise absolute rounded-full bg-white/70 ring-1 ring-white/90"
                style={
                  {
                    width: b.size,
                    height: b.size,
                    left: `calc(50% + ${b.startX}px)`,
                    top: '50%',
                    '--bx': `${b.bx}px`,
                    '--by': `${b.by}px`,
                    '--bdur': `${b.dur}s`,
                    animationDelay: `${b.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        )}
      </button>

      {isIos && showIosHelp && (
        <div
          role="dialog"
          aria-label={t('install.iosTitle')}
          className="surface absolute right-0 top-full z-50 mt-2 w-64 bg-paper-raised p-3 text-left shadow-soft"
        >
          <p className="mb-2 text-sm font-bold text-ink">{t('install.iosTitle')}</p>
          <ol className="list-decimal space-y-1.5 pl-4 text-xs text-ink-muted">
            <li>{t('install.iosStep1')}</li>
            <li>{t('install.iosStep2')}</li>
          </ol>
          <button
            type="button"
            onClick={() => setShowIosHelp(false)}
            className="btn btn-ghost mt-3 w-full"
          >
            {t('install.close')}
          </button>
        </div>
      )}
    </div>
  );
}
