import { useId, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { howToPlayRules } from '../i18n/richText';

// Collapsible "How to play" disclosure shown between the title and the lobby.
// Tapping the header toggles a panel that explains the rules.
export function HowToPlay() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rules = howToPlayRules[locale];

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="surface w-full flex items-center gap-3 px-5 py-3 text-left active:scale-95 transition"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-paper font-serif font-bold"
        >
          ?
        </span>
        <span className="flex-1 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          {t('howToPlay.title')}
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
        className="surface mt-2 px-5 py-4 text-sm leading-relaxed text-ink"
      >
        <p className="text-ink-muted">{t('howToPlay.intro')}</p>
        <ol className="mt-3 flex flex-col gap-3.5">
          {rules.map((rule, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4;
            return (
              <li key={n} className="flex gap-2.5">
                <span className="font-serif font-bold text-accent">{n}.</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span>{rule()}</span>
                  <BulletFigure n={n} />
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// Faint humanoid figures illustrating each rule. Decorative only (aria-hidden);
// the ink figures sit soft under the text, while the green/red phones in #3 are
// drawn in the game's olive/eliminated colours so the core mechanic reads.
function BulletFigure({ n }: { n: 1 | 2 | 3 | 4 }) {
  const base = {
    viewBox: '0 0 96 44',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  const ink = 'h-9 w-auto text-ink opacity-40';

  // 1) Hold it flat, screen up: a phone lying level (olive screen) held out on an
  // arm — like balancing the bar of soap on your hand.
  if (n === 1) {
    return (
      <svg {...base} className="h-10 w-auto text-ink opacity-90">
        {/* arm rising to hold the phone out flat */}
        <path d="M12 42 Q16 32 30 29" />
        {/* the phone lying flat, screen up */}
        <path d="M22 27 L54 22 L70 28 L38 33 Z" />
        {/* olive screen, matching the in-game hold colour */}
        <path
          d="M29.6 27.2 L51 23.2 L62 27.8 L40.6 31 Z"
          fill="var(--color-hold)"
          stroke="none"
        />
      </svg>
    );
  }
  // 2) Dance & weave: two players sizing each other up — one near (larger), one
  // further back (smaller), facing each other, heads as eighth notes.
  if (n === 2) {
    return (
      <svg {...base} className={ink}>
        {/* background player — smaller, set back, facing right, arms open */}
        <NoteHead cx={20} cy={15} r={3.5} dir={-1} />
        <line x1="20" y1="18.5" x2="20" y2="27" />
        <line x1="20" y1="27" x2="16" y2="34" />
        <line x1="20" y1="27" x2="24" y2="34" />
        <path d="M20 20 q-6 -1 -10 -5" />
        <path d="M20 20 q6 -1 10 -5" />
        {/* foreground player — larger, facing left, same wide welcome pose */}
        <NoteHead cx={66} cy={12} r={5.5} dir={1} />
        <line x1="66" y1="17.5" x2="66" y2="32" />
        <line x1="66" y1="32" x2="60" y2="42" />
        <line x1="66" y1="32" x2="72" y2="42" />
        <path d="M66 21 q-12 -1 -22 -8" />
        <path d="M66 21 q12 -1 22 -8" />
      </svg>
    );
  }
  // 3) Tap a rival: a calm olive-screen phone, and a red-screen one whose arm
  // was tapped — vibration swirling around it (the "you're out" moment).
  if (n === 3) {
    return (
      <svg {...base} className="h-10 w-auto text-ink opacity-90">
        {/* still in: arm holding an olive-screen phone */}
        <path d="M12 42 q3 -12 12 -17" />
        <rect x="20" y="11" width="13" height="17" rx="2.5" />
        <rect x="22.5" y="13.5" width="8" height="12" rx="1" fill="var(--color-hold)" stroke="none" />
        {/* out: arm holding a red-screen phone, just tapped, buzzing */}
        <path d="M58 42 q3 -12 12 -17" />
        <rect x="66" y="11" width="13" height="17" rx="2.5" />
        <rect x="68.5" y="13.5" width="8" height="12" rx="1" fill="var(--color-dropped)" stroke="none" />
        {/* a rival's arm reaching in to tap the red-phone forearm */}
        <path d="M94 40 q-15 0 -31 -8" />
        {/* vibration swirls around the red phone */}
        <path d="M62 9 q-3 3 0 7" />
        <path d="M83 9 q3 3 0 7" />
        <path d="M59 19 q-3 1 -4 4" />
        <path d="M86 19 q3 1 4 4" />
      </svg>
    );
  }
  // 4) The last one standing, arms raised in celebration.
  return (
    <svg {...base} className={ink}>
      <line x1="30" y1="40" x2="66" y2="40" />
      <NoteHead cx={48} cy={11} r={5} dir={-1} />
      <line x1="48" y1="16" x2="48" y2="30" />
      <line x1="48" y1="30" x2="43" y2="40" />
      <line x1="48" y1="30" x2="53" y2="40" />
      {/* both arms as one connected stroke through the shoulders, raised */}
      <path d="M40 8 L48 19 L56 8" />
    </svg>
  );
}

// A figure's head drawn as an eighth note: the filled knob is the head, a stem
// rises from the crown, and the flag swirls back down like a lock of hair.
// `dir` points the swirl toward the figure's back (-1 = left, 1 = right).
function NoteHead({
  cx,
  cy,
  r,
  dir,
}: {
  cx: number;
  cy: number;
  r: number;
  dir: 1 | -1;
}) {
  const stemX = cx + dir * (r - 0.5); // rises from the side of the knob
  const stemTop = cy - 2 * r - 0.8; // where the hair tuft peaks
  const s = r / 5; // scale the flag to the head size
  // The flag is a filled swirl, slightly thicker where it meets the stem and
  // tapering to a point — a lock of hair trailing toward the figure's back.
  const flag =
    `M${stemX} ${stemTop} ` +
    `C${stemX + dir * 7 * s} ${stemTop + 0.6 * s} ${stemX + dir * 8.5 * s} ${stemTop + 5 * s} ${stemX + dir * 4.5 * s} ${stemTop + 9.5 * s} ` +
    `C${stemX + dir * 5.5 * s} ${stemTop + 6.5 * s} ${stemX + dir * 2 * s} ${stemTop + 4.5 * s} ${stemX} ${stemTop + 2.6 * s} Z`;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
      <line x1={stemX} y1={cy} x2={stemX} y2={stemTop} />
      <path d={flag} fill="currentColor" stroke="none" />
    </>
  );
}
