import { Lobby } from './components/Lobby';
import { HowToPlay } from './components/HowToPlay';
import { Bubbles } from './components/Bubbles';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { InstallButton } from './components/InstallButton';
import { useFlatTilt } from './hooks/useFlatTilt';
import { useI18n } from './i18n/I18nContext';

export default function App() {
  const { t } = useI18n();
  const titleRef = useFlatTilt<HTMLHeadingElement>();

  // Force the title onto two lines regardless of locale: all but the last word
  // on the first line, the last word on the second (every locale's title is
  // three words, so this reads e.g. "HOLD THE" / "SOAP").
  const titleWords = t('app.title').split(' ');
  const titleHead =
    titleWords.length > 1 ? titleWords.slice(0, -1).join(' ') : t('app.title');
  const titleTail = titleWords.length > 1 ? titleWords[titleWords.length - 1] : '';

  return (
    <div className="relative min-h-dvh bg-sky text-ink flex flex-col">
      <Bubbles />

      <main className="relative z-10 flex-1 px-6 pt-12 pb-10 sm:px-8 sm:pt-16 max-w-md mx-auto w-full flex flex-col items-center gap-8">
        <div className="relative w-full">
          <div className="absolute -top-7 -right-1">
            <LanguageSwitcher />
          </div>
          <h1
            ref={titleRef}
            className="font-round text-[18vw] leading-[0.8] tracking-[-0.06em] sm:text-7xl font-bold text-center text-pink will-change-transform text-balance"
            style={{
              WebkitTextStroke: '0.05em var(--color-ink)',
              paintOrder: 'stroke fill',
              filter: 'drop-shadow(0 8px 6px rgb(36 55 67 / 0.28))',
            }}
          >
            <span className="block">{titleHead}</span>
            {titleTail && <span className="block">{titleTail}</span>}
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
