import { Lobby } from './components/Lobby';
import { HowToPlay } from './components/HowToPlay';
import { Bubbles } from './components/Bubbles';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Privacy } from './components/Privacy';
import { useI18n } from './i18n/I18nContext';

export default function App() {
  const { t } = useI18n();

  // No router: the privacy policy is a separate full page reached by an ordinary
  // link (with a _redirects rule serving the SPA on a cold hit). Everything else
  // is the game home screen.
  if (typeof window !== 'undefined' && window.location.pathname === '/privacy') {
    return <Privacy />;
  }

  return (
    <div className="relative min-h-dvh bg-sky text-ink flex flex-col">
      <Bubbles />

      <main className="relative z-10 flex-1 px-6 pt-12 pb-10 sm:px-8 sm:pt-16 max-w-md mx-auto w-full flex flex-col items-center gap-8">
        <div className="relative w-full">
          <div className="absolute -top-7 -right-1">
            <LanguageSwitcher />
          </div>
          <h1 className="font-round text-5xl sm:text-6xl font-bold tracking-tight text-center text-pink">
            {t('app.title')}
          </h1>
        </div>

        <HowToPlay />
        <Lobby />

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
