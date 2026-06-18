import { useLayoutEffect, useRef } from 'react';
import { Lobby } from './components/Lobby';
import { HowToPlay } from './components/HowToPlay';
import { Bubbles } from './components/Bubbles';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { InstallButton } from './components/InstallButton';
import { useFlatTilt } from './hooks/useFlatTilt';
import { useI18n } from './i18n/I18nContext';

// Small per-word tilts for a hand-lettered, cartoony title.
const WORD_TILT = [-4, 3, -3, 4, -2];

export default function App() {
  const { t } = useI18n();
  const titleRef = useFlatTilt<HTMLHeadingElement>();
  const tailRef = useRef<HTMLSpanElement>(null);

  // Force the title onto two lines regardless of locale: all but the last word
  // on the first line, the last (enlarged) word on the second — every locale's
  // title is three words, so this reads e.g. "HOLD THE" / "SOAP".
  const titleWords = t('app.title').split(' ');
  const headWords = titleWords.length > 1 ? titleWords.slice(0, -1) : [];
  const tailWord = titleWords[titleWords.length - 1] ?? '';

  // The last word is deliberately large, but long localized words (e.g. the
  // Portuguese "SABONETE") would overflow — so shrink it to fit the title width
  // when needed. Short words (e.g. "SOAP") keep the full size. Re-fits on locale
  // change, resize, and once the web font has loaded (its metrics shift width).
  useLayoutEffect(() => {
    const el = tailRef.current;
    if (!el) return;
    el.style.transform = `rotate(${WORD_TILT[headWords.length % WORD_TILT.length]}deg)`;
    const fit = () => {
      const parent = el.parentElement;
      if (!parent) return;
      el.style.fontSize = '';
      const max = parseFloat(getComputedStyle(el).fontSize);
      const avail = parent.clientWidth;
      const w = el.offsetWidth;
      if (w > 0 && w > avail) el.style.fontSize = `${(max * (avail / w) * 0.96).toFixed(2)}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => window.removeEventListener('resize', fit);
  }, [tailWord, headWords.length]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-sky text-ink flex flex-col">
      <Bubbles />

      <main className="relative z-10 flex-1 px-6 pt-12 pb-10 sm:px-8 sm:pt-16 max-w-md mx-auto w-full flex flex-col items-center gap-8">
        <div className="relative w-full">
          <div className="absolute -top-7 -right-1">
            <LanguageSwitcher />
          </div>
          <h1
            ref={titleRef}
            className="font-round text-[15vw] leading-[0.8] tracking-[-0.01em] sm:text-6xl font-bold text-center text-pink will-change-transform"
            style={{
              WebkitTextStroke: '0.05em var(--color-ink)',
              paintOrder: 'stroke fill',
              filter: 'drop-shadow(0 8px 6px rgb(36 55 67 / 0.28))',
            }}
          >
            {headWords.length > 0 && (
              <span className="block">
                {headWords.map((w, i) => (
                  <span key={i}>
                    {i > 0 ? ' ' : ''}
                    <span
                      className="inline-block"
                      style={{ transform: `rotate(${WORD_TILT[i % WORD_TILT.length]}deg)` }}
                    >
                      {w}
                    </span>
                  </span>
                ))}
              </span>
            )}
            <span className="block">
              <span ref={tailRef} className="inline-block text-[1.6em]">
                {tailWord}
              </span>
            </span>
          </h1>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex w-full max-w-sm items-stretch gap-2">
            <HowToPlay />
            <InstallButton />
          </div>
          <Lobby />
        </div>

        <footer className="mt-auto pt-6">
          <a
            href="/privacy"
            className="text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink transition"
          >
            {t('footer.privacy')}
          </a>
        </footer>
      </main>
    </div>
  );
}
