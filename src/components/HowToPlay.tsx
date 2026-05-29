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

// Faint, abstract humanoid figures — a quiet nod to the sheet-music theme via a
// tilted note-head for each head — illustrating each rule. Decorative only
// (aria-hidden), drawn in ink at low opacity so they read as a watermark.
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
  const head = { rx: 5, ry: 4, fill: 'currentColor', stroke: 'none' };

  // 1) A person standing steady, phone held out away from the body.
  if (n === 1) {
    return (
      <svg {...common}>
        <line x1="22" y1="40" x2="74" y2="40" />
        <ellipse cx="42" cy="11" transform="rotate(-18 42 11)" {...head} />
        <line x1="42" y1="15" x2="42" y2="28" />
        <line x1="42" y1="28" x2="36" y2="40" />
        <line x1="42" y1="28" x2="48" y2="40" />
        <line x1="42" y1="19" x2="60" y2="20" />
        <rect x="60" y="14" width="9" height="12" rx="1.5" />
      </svg>
    );
  }
  // 2) A person dancing / weaving — arms thrown out, mid-stride, with trails.
  if (n === 2) {
    return (
      <svg {...common}>
        <path d="M12 16 q7 9 0 18" />
        <path d="M22 14 q8 10 1 20" />
        <ellipse cx="46" cy="11" transform="rotate(-18 46 11)" {...head} />
        <line x1="46" y1="15" x2="52" y2="27" />
        <line x1="52" y1="27" x2="46" y2="40" />
        <line x1="52" y1="27" x2="62" y2="37" />
        <line x1="48" y1="18" x2="58" y2="8" />
        <line x1="48" y1="19" x2="36" y2="24" />
      </svg>
    );
  }
  // 3) One person shoving another, who topples over.
  if (n === 3) {
    return (
      <svg {...common}>
        <line x1="8" y1="40" x2="88" y2="40" />
        <ellipse cx="22" cy="12" transform="rotate(-18 22 12)" {...head} />
        <line x1="22" y1="16" x2="22" y2="30" />
        <line x1="22" y1="30" x2="17" y2="40" />
        <line x1="22" y1="30" x2="27" y2="40" />
        <line x1="22" y1="21" x2="38" y2="19" />
        <g transform="rotate(48 64 30)">
          <ellipse cx="64" cy="12" {...head} />
          <line x1="64" y1="16" x2="64" y2="30" />
          <line x1="64" y1="30" x2="59" y2="40" />
          <line x1="64" y1="30" x2="69" y2="40" />
          <line x1="64" y1="20" x2="74" y2="16" />
        </g>
      </svg>
    );
  }
  // 4) The last one standing (arms raised) beside a fallen player.
  return (
    <svg {...common}>
      <line x1="8" y1="40" x2="88" y2="40" />
      <ellipse cx="34" cy="11" transform="rotate(-18 34 11)" {...head} />
      <line x1="34" y1="15" x2="34" y2="29" />
      <line x1="34" y1="29" x2="29" y2="40" />
      <line x1="34" y1="29" x2="39" y2="40" />
      <line x1="34" y1="18" x2="26" y2="8" />
      <line x1="34" y1="18" x2="42" y2="8" />
      <ellipse cx="84" cy="36" transform="rotate(70 84 36)" {...head} />
      <line x1="80" y1="37" x2="66" y2="35" />
      <line x1="66" y1="35" x2="60" y2="40" />
      <line x1="70" y1="36" x2="68" y2="41" />
    </svg>
  );
}
