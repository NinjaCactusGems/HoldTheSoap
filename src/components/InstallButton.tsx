import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

// "Add to Home Screen" pill, anchored under the language globe on the home
// page. On Android/Chromium it fires the native install dialog; on iOS (no
// programmatic install) it opens a small how-to card. Hidden once the app is
// installed/standalone, or when no install path is available.
export function InstallButton() {
  const { t } = useI18n();
  const { canPrompt, isIos, isStandalone, promptInstall } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  if (isStandalone) return null;
  // Android shows only once the browser confirms installability; iOS always
  // can (manually), so offer the instructions there.
  if (!canPrompt && !isIos) return null;

  const onClick = () => {
    if (canPrompt) void promptInstall();
    else setShowIosHelp((s) => !s);
  };

  return (
    <div ref={rootRef} className="relative flex-1">
      <button
        type="button"
        onClick={onClick}
        aria-haspopup={isIos ? 'dialog' : undefined}
        aria-expanded={isIos ? showIosHelp : undefined}
        className="surface flex h-full w-full items-center justify-center gap-2 px-3 py-3 text-center active:scale-95 transition"
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
