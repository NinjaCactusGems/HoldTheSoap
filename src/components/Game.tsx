import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bubbles } from './Bubbles';
import { useBubbleSfx } from '../hooks/useBubbleSfx';
import { useI18n } from '../i18n/I18nContext';
import { haptics } from '../lib/haptics';
import { sfx } from '../lib/sfx';
import { teamById, type TeamId } from '../lib/teams';
import { TILT_THRESHOLD_DEG, type useShakeDetector } from '../hooks/useShakeDetector';

export type Phase = 'lobby' | 'ready' | 'holding' | 'winner';
export type Reaction = 'turd' | 'heart' | 'dancer' | 'dancerF';
export type Player = {
  id: string;
  name: string;
  ready: boolean;
  eliminated: boolean;
  away: boolean;
  noMotion: boolean;
  team: TeamId | null;
  wins: number;
};

const REACTION_EMOJI: Record<Reaction, string> = {
  turd: '💩',
  heart: '❤️',
  dancer: '🕺',
  dancerF: '💃',
};

const COFFEE_URL = 'https://buymeacoffee.com/ninjacactus';

// A tip-jar pill, shown to eliminated players during the hold phase and to
// everyone (winner included) on the winner screen, and it stays up when the
// post-game lobby slides in. Coffee cup in a circle on the left, external-link
// arrow on the right, so it reads as a tappable link at a glance.
function CoffeeLink() {
  const { t } = useI18n();
  return (
    <a
      href={COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 mt-4 flex max-w-[92vw] items-center gap-3 rounded-full border border-line bg-paper/70 py-2 pl-2 pr-5 text-xs font-semibold text-ink-muted active:scale-95 transition"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ochre/15 text-ochre">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          {/* cup with handle and rising steam */}
          <path d="M17 9h1a3.5 3.5 0 1 1 0 7h-1" />
          <path d="M4 9h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
          <path d="M8 2.5q-1 1.5 0 3" />
          <path d="M12.5 2.5q-1 1.5 0 3" />
        </svg>
      </span>
      <span className="text-left leading-snug">{t('support.coffee')}</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0 opacity-60"
        aria-hidden
      >
        {/* external-link arrow */}
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      </svg>
    </a>
  );
}

type GameProps = {
  phase: Exclude<Phase, 'lobby'>;
  players: Player[];
  myId: string;
  readyEndsAt: number | null;
  winnerEndsAt: number | null;
  winnerId: string | null;
  winnerTeam: TeamId | null;
  detector: ReturnType<typeof useShakeDetector>;
  lastReaction: { reaction: Reaction; at: number } | null;
  // Maps a server timestamp into this client's clock (RTT-synced, the same
  // offset the music uses), so countdowns run in lockstep across devices.
  toLocalTime: (serverTs: number) => number;
  onEliminate: () => void;
  onReaction: (reaction: Reaction) => void;
  // Post-game: the winner stays on screen and the lobby slides up from below
  // (rendered here) so players can keep emoting. Server phase is 'lobby', but
  // Room renders Game with phase 'winner' + these props.
  postGame?: boolean;
  lobbySheet?: ReactNode;
};

export function Game(props: GameProps) {
  const { phase } = props;
  if (phase === 'ready')
    return (
      <ReadyView readyEndsAt={props.readyEndsAt} toLocalTime={props.toLocalTime} />
    );
  if (phase === 'holding') return <HoldingView {...props} />;
  return <WinnerView {...props} />;
}

// Get Ready: a synced countdown on the neutral staff background. A small tick
// each second, a larger buzz on "Go". The server flips everyone to the hold
// phase when the timer ends.
function ReadyView({
  readyEndsAt,
  toLocalTime,
}: {
  readyEndsAt: number | null;
  toLocalTime: (serverTs: number) => number;
}) {
  const { t } = useI18n();

  // readyEndsAt is a server timestamp — convert it to local time with the same
  // RTT-synced offset the music uses, so the countdown counts down (and the
  // ticks land) at the same real instant on every device.
  const localEndsAt = readyEndsAt === null ? null : toLocalTime(readyEndsAt);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    localEndsAt ? Math.max(0, Math.ceil((localEndsAt - Date.now()) / 1000)) : 0,
  );

  // Tracks the last second we buzzed for, so each boundary fires its haptic
  // exactly once (the 200ms interval visits each second multiple times). The
  // "Go" buzz is fired by HoldingView on mount instead — the countdown
  // reaching 0 here races the server's hold-phase message and is unreliable.
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (localEndsAt === null) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((localEndsAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s > 0 && lastTickRef.current !== s) {
        lastTickRef.current = s;
        haptics.tick();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [localEndsAt]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-sky text-ink">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-muted">
        {t('game.getReady')}
      </div>
      {secondsLeft > 0 ? (
        <div className="font-round text-9xl font-bold tabular-nums">
          {secondsLeft}
        </div>
      ) : (
        <div className="font-round text-8xl font-bold tracking-tight text-go">
          {t('game.go')}
        </div>
      )}
      <div className="text-sm text-ink-muted">{t('game.holdStillEllipsis')}</div>
    </div>
  );
}

// Fraction of each drop threshold at which we warn the player to steady up.
// A round can end two ways — too much shake (acceleration) or too much tilt
// (gravity/orientation) — so the warning watches 60% of both: the shake
// magnitude vs its threshold, and the tilt vs TILT_THRESHOLD_DEG.
const WARN_FRACTION = 0.6;
// Re-arm the warning haptic only once motion settles back below this lower band
// (hysteresis), so sensor noise around the boundary doesn't re-fire it.
const WARN_REARM_FRACTION = WARN_FRACTION * 0.8;

// Holding: hold still. A motion spike above the Normal threshold (wired in
// Room as useShakeDetector(7)) reports elimination to the server. Full-screen
// olive while you're in, red the moment you're out — readable across a room.
function HoldingView({
  players,
  myId,
  detector,
  onEliminate,
}: GameProps) {
  const { t } = useI18n();
  const me = players.find((p) => p.id === myId);
  const iAmOut = me?.eliminated ?? false;

  // Audio pressure gauge: random bubble pops that get exponentially more
  // frequent as motion nears either drop threshold (shake or tilt) — the same
  // closeness signal the ⚠️ warning watches. Silent once you're out.
  const closeness = Math.max(
    detector.magnitude / detector.threshold,
    detector.tilt / TILT_THRESHOLD_DEG,
  );
  useBubbleSfx(!iAmOut, closeness);

  // lastShakeAt persists across phases, so ignore any spike from before
  // the hold phase began. Set the gate once when this view first mounts.
  const startedAtRef = useRef<number>(Date.now());
  // Fire elimination at most once per round (the view remounts each round).
  const firedRef = useRef(false);
  // Whether the "be careful" haptic is armed to fire on the next 60% crossing.
  const warnArmedRef = useRef(true);

  // Live "be careful" state: text shown while shake or tilt is above 60% of its
  // threshold; a single warn pulse fires on each rising crossing into that band
  // and re-arms once both settle back below it.
  const nearLimit =
    !iAmOut &&
    (detector.magnitude >= detector.threshold * WARN_FRACTION ||
      detector.tilt >= TILT_THRESHOLD_DEG * WARN_FRACTION);

  // "Go" buzz: fired here (rather than at the countdown's racy 0) so it
  // reliably lands exactly when the hold phase begins.
  useEffect(() => {
    haptics.go();
  }, []);

  useEffect(() => {
    if (firedRef.current || iAmOut) return;
    if (detector.lastShakeAt === null) return;
    if (detector.lastShakeAt <= startedAtRef.current) return;
    firedRef.current = true;
    haptics.elimination();
    sfx.screech();
    onEliminate();
  }, [detector.lastShakeAt, iAmOut, onEliminate]);

  // Tilt the phone too far from flat (screen up) and the soap slides off — out.
  // Shares firedRef with the shake rule so a round eliminates at most once.
  useEffect(() => {
    if (firedRef.current || iAmOut) return;
    if (detector.tilt <= TILT_THRESHOLD_DEG) return;
    firedRef.current = true;
    haptics.elimination();
    sfx.screech();
    onEliminate();
  }, [detector.tilt, iAmOut, onEliminate]);

  // "Be careful" cue: fire a single warn pulse when motion crosses 60% of
  // either threshold, re-arming only once both settle back below the band.
  useEffect(() => {
    if (iAmOut) return;
    if (nearLimit && warnArmedRef.current) {
      warnArmedRef.current = false;
      haptics.warn();
    } else if (
      detector.magnitude < detector.threshold * WARN_REARM_FRACTION &&
      detector.tilt < TILT_THRESHOLD_DEG * WARN_REARM_FRACTION
    ) {
      warnArmedRef.current = true;
    }
  }, [detector.magnitude, detector.tilt, detector.threshold, nearLimit, iAmOut]);

  const aliveCount = players.filter((p) => !p.eliminated).length;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 ${
        iAmOut ? 'bg-dropped text-ink' : 'bg-hold text-white'
      }`}
    >
      {/* Alive: a faint, oversized SOAP watermark turned on its side, blended
          into the pink so it reads as texture rather than text. */}
      {!iAmOut && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
        >
          <span className="-rotate-90 whitespace-nowrap font-round text-[32vh] font-bold leading-none tracking-tight text-white/10">
            {t('game.soapStamp')}
          </span>
        </div>
      )}
      <Bubbles />
      {iAmOut ? (
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <div className="text-7xl" aria-hidden="true">
            {me?.noMotion ? '👀' : '😟'}
          </div>
          <div className="font-round text-3xl sm:text-4xl font-bold tracking-tight">
            {t(me?.noMotion ? 'game.spectating' : 'game.droppedSoap')}
          </div>
          <div className="text-sm uppercase tracking-[0.3em] text-ink-muted">
            {t('game.stillIn', { count: aliveCount })}
          </div>
          <CoffeeLink />
        </div>
      ) : (
        <>
          {nearLimit && (
            <div className="pointer-events-none absolute inset-x-0 top-[14vh] z-10 animate-pulse text-center font-round text-3xl font-bold uppercase tracking-[0.2em] text-ochre [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]">
              ⚠️ {t('game.careful')}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-[9vh] z-10 px-8 text-center font-round text-xl font-semibold text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">
            {t('game.hold')}
          </div>
        </>
      )}
    </div>
  );
}

// Winner: the survivor's name, with smiley reaction buttons open to everyone.
// Each tap (local or remote) bursts emoji particles on every screen. The server
// returns everyone to the lobby after the winner timer ends.
function WinnerView({
  players,
  myId,
  winnerId,
  winnerTeam,
  winnerEndsAt,
  lastReaction,
  toLocalTime,
  onReaction,
  postGame,
  lobbySheet,
}: GameProps) {
  const { t } = useI18n();
  const me = players.find((p) => p.id === myId);
  const winner = players.find((p) => p.id === winnerId);
  const winningTeam = teamById(winnerTeam);
  // A team victory counts for everyone on it; otherwise only the lone survivor.
  const iWon = winnerTeam
    ? me?.team === winnerTeam
    : winnerId !== null && winnerId === myId;

  // Server timestamp → local clock (RTT-synced), so the back-to-lobby countdown
  // matches across devices.
  const localEndsAt = winnerEndsAt === null ? null : toLocalTime(winnerEndsAt);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    localEndsAt ? Math.max(0, Math.ceil((localEndsAt - Date.now()) / 1000)) : 0,
  );
  useEffect(() => {
    if (localEndsAt === null) return;
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.ceil((localEndsAt - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [localEndsAt]);

  const header = (
    <div className="relative z-30 flex flex-col items-center gap-2">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-ochre">
        {t(iWon ? 'game.youWin' : 'game.winner')}
      </div>
      {winningTeam ? (
        <div className="font-round text-5xl font-bold tracking-tight text-center px-6">
          {t('game.teamWins', { team: t(`team.${winningTeam.id}`) })}
        </div>
      ) : (
        <div className="font-round text-5xl font-bold tracking-tight text-center px-6">
          {winner?.name ?? t('game.noOne')}
        </div>
      )}
    </div>
  );

  // Reaction bar stays available so the celebration can keep emoting, both on
  // the winner screen and once the lobby has slid in beneath it.
  const smileys = (
    <div className="relative z-30 flex gap-3">
      {(Object.keys(REACTION_EMOJI) as Reaction[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onReaction(r)}
          className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-paper-raised text-4xl shadow-sm active:scale-95 transition"
          aria-label={r}
        >
          {REACTION_EMOJI[r]}
        </button>
      ))}
    </div>
  );

  if (postGame) {
    // The whole overlay scrolls as one page (like the initial lobby), rather
    // than pinning the lobby into its own inner scroll area.
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-sky text-ink">
        <ReactionParticles lastReaction={lastReaction} />
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 pt-10 pb-10">
          {/* Once the lobby has slid up, the winner banner fades away so the
              room can focus on getting the next match going (smileys stay). */}
          <div className="animate-winner-fade">{header}</div>
          {smileys}
          <CoffeeLink />
          <div className="animate-sheet-up w-full max-w-sm">{lobbySheet}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-sky text-ink">
      <ReactionParticles lastReaction={lastReaction} />
      {header}
      {smileys}
      {secondsLeft > 0 && (
        <div className="relative z-30 text-sm text-ink-muted">
          {t('game.backToLobby', { seconds: secondsLeft })}
        </div>
      )}
      <CoffeeLink />
    </div>
  );
}

type Particle = { id: number; emoji: string; left: number };

// Floats a single emoji up the screen for each reaction event (one per tap).
// Particles self-remove once their animation completes.
function ReactionParticles({
  lastReaction,
}: {
  lastReaction: { reaction: Reaction; at: number } | null;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const seqRef = useRef(0);

  // Re-run per distinct reaction event, keyed by its timestamp.
  const at = lastReaction?.at;
  const reaction = lastReaction?.reaction;
  useEffect(() => {
    if (!reaction) return;
    sfx.reaction(reaction);
    const particle: Particle = {
      id: seqRef.current++,
      emoji: REACTION_EMOJI[reaction],
      left: 5 + Math.random() * 90, // vw
    };
    setParticles((prev) => [...prev, particle]);

    const timer = window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particle.id));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [at, reaction]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="animate-reaction-float absolute bottom-0 text-5xl"
          style={{ left: `${p.left}vw` }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
