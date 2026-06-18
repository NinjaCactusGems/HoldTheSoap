import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SUPPORTED, type Locale } from '../i18n/translations';

// Native-language names, deliberately not run through t(): each entry must be
// readable to a speaker of that language regardless of the active locale.
const NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
};

// Globe-icon button anchored top-right of the main screen; opens a small menu
// of full language names (a 5-segment pill no longer fits on mobile).
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('app.language')}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-outline transition ${
          open ? 'bg-ink text-paper' : 'bg-paper-raised/80 text-ink-muted'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('app.language')}
          className="surface absolute right-0 top-9 z-50 min-w-36 bg-paper-raised p-1 shadow-soft"
        >
          {SUPPORTED.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={locale === l}
              lang={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`block w-full rounded-xl px-3 py-1.5 text-left text-sm font-semibold transition ${
                locale === l ? 'bg-ink text-paper' : 'text-ink-muted'
              }`}
            >
              {NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
