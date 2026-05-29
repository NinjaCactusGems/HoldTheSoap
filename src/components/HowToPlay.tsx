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
          Joust is a game of movement and balance — played in the real world,
          phone in hand.
        </p>
        <ol className="mt-3 flex flex-col gap-3.5">
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">1.</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span>
                Hold your phone out, <strong>away from your body</strong>, and
                keep it steady.
              </span>
              <BulletFigure n={1} />
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">2.</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span>
                <strong>Dance and weave</strong> around the other players
                without jostling your own phone.
              </span>
              <BulletFigure n={2} />
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">3.</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span>
                Make rivals move too quickly — a{' '}
                <strong>touch on the arm</strong> is fair game. Move your phone
                too fast and you're out.
              </span>
              <BulletFigure n={3} />
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-serif font-bold text-accent">4.</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span>
                Be the <strong>last one standing</strong> to win the joust.
              </span>
              <BulletFigure n={4} />
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}

// Faint, abstract figures built from musical-note shapes — a quiet nod to the
// sheet-music theme under each rule. Decorative only (aria-hidden), drawn in
// ink at low opacity so they read as a watermark, not an icon.
function BulletFigure({ n }: { n: 1 | 2 | 3 | 4 }) {
  const common = {
    viewBox: '0 0 96 44',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'h-9 w-auto text-ink opacity-[0.14]',
  };
  const head = { fill: 'currentColor', stroke: 'none' };

  // 1) A note standing balanced upright on a staff line.
  if (n === 1) {
    return (
      <svg {...common}>
        <line x1="10" y1="38" x2="86" y2="38" />
        <line x1="52" y1="32" x2="52" y2="10" />
        <ellipse cx="48" cy="32" rx="6.5" ry="5" {...head} />
      </svg>
    );
  }
  // 2) A leaning, flagged eighth note mid-stride, trailed by weaving arcs.
  if (n === 2) {
    return (
      <svg {...common}>
        <path d="M12 14 q7 9 0 18" />
        <path d="M22 12 q9 11 1 22" />
        <ellipse cx="50" cy="33" rx="6.5" ry="5" transform="rotate(-18 50 33)" {...head} />
        <line x1="56" y1="31" x2="62" y2="9" />
        <path d="M62 9 q13 4 7 18" />
      </svg>
    );
  }
  // 3) Two notes — one upright, one knocked toppling over.
  if (n === 3) {
    return (
      <svg {...common}>
        <line x1="8" y1="38" x2="88" y2="38" />
        <ellipse cx="30" cy="32" rx="6.5" ry="5" {...head} />
        <line x1="34" y1="31" x2="34" y2="10" />
        <g transform="rotate(52 64 32)">
          <ellipse cx="64" cy="32" rx="6.5" ry="5" {...head} />
          <line x1="68" y1="31" x2="68" y2="10" />
        </g>
      </svg>
    );
  }
  // 4) The last note standing tall beside a fallen one.
  return (
    <svg {...common}>
      <line x1="8" y1="38" x2="88" y2="38" />
      <ellipse cx="40" cy="32" rx="7" ry="5.5" {...head} />
      <line x1="45" y1="31" x2="45" y2="8" />
      <ellipse cx="70" cy="36" rx="6" ry="4.5" transform="rotate(90 70 36)" {...head} />
      <line x1="70" y1="33" x2="86" y2="33" />
    </svg>
  );
}
