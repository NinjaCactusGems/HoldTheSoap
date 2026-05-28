import { useId, useState } from 'react';

// Collapsible "How to play" disclosure shown between the title and the lobby.
// Tapping the header toggles a panel that explains the rules.
export function HowToPlay() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 rounded-2xl border border-line bg-paper-raised/80 px-5 py-3 text-left active:scale-[0.99] transition"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-paper font-serif font-bold"
        >
          ?
        </span>
        <span className="flex-1 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          How to play
        </span>
        <span
          aria-hidden="true"
          className={`text-ink-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="mt-2 rounded-2xl border border-line bg-paper-raised/80 px-5 py-4 text-sm leading-relaxed text-ink"
      >
        <p className="text-ink-muted">
          Joust is a game of nerve and balance — played in the real world,
          phone in hand.
        </p>
        <ol className="mt-3 flex flex-col gap-2.5">
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">1.</span>
            <span>
              Hold your phone out, <strong>away from your body</strong>, and
              keep it steady.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">2.</span>
            <span>
              <strong>Dance and weave</strong> around the other players without
              jostling your own phone.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">3.</span>
            <span>
              Make rivals move too quickly — a <strong>touch on the arm</strong>{' '}
              is fair game. Move your phone too fast and you're out.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">4.</span>
            <span>
              Be the <strong>last one standing</strong> to win the joust.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
