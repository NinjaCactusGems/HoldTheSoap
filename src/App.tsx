import { Lobby } from './components/Lobby';
import { ShakeCard } from './components/ShakeCard';
import { MusicNotes } from './components/MusicNotes';

export default function App() {
  return (
    <div className="relative min-h-dvh bg-staff text-ink flex flex-col">
      <MusicNotes />

      <header className="relative z-10 px-6 pt-6 sm:px-8 sm:pt-8">
        <a href="/" className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper font-serif font-bold text-lg shadow-sm"
          >
            J
          </span>
          <span className="font-semibold tracking-tight text-lg">Joust</span>
        </a>
      </header>

      <main className="relative z-10 flex-1 px-6 py-10 sm:px-8 max-w-md mx-auto w-full flex flex-col items-center gap-8">
        <div className="text-6xl sm:text-7xl" aria-hidden="true">
          :)
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-center">
          Joust
        </h1>

        <ShakeCard />
        <Lobby />
      </main>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-ink-faint border-t border-line">
        In development.
      </footer>
    </div>
  );
}
