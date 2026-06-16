import { useEffect, useMemo, useRef, useState } from 'react';
import usePartySocket from 'partysocket/react';
import { QRCodeSVG } from 'qrcode.react';
import { generateRoomCode, normalizeRoomCode } from '../lib/roomCode';
import { generateRandomName, generateBotName } from '../lib/names';
import { Game, type Phase, type Reaction } from './Game';
import { TEAMS, teamById, type TeamId } from '../lib/teams';
import { motionNeedsGesture, useShakeDetector } from '../hooks/useShakeDetector';
import { useServerClock } from '../hooks/useServerClock';
import { useWakeLock } from '../hooks/useWakeLock';
import { sfx } from '../lib/sfx';
import { useI18n } from '../i18n/I18nContext';

const PARTY_HOST = import.meta.env.VITE_PARTY_HOST || 'localhost:1999';

const PLAYER_NAME_KEY = 'holdthesoap:playerName';

// The hold phase runs at the fixed Normal/medium threshold (7 m/s², per the
// CLAUDE.md presets) for everyone, all round.
const HOLD_THRESHOLD = 7;

// NAT/proxy keepalive cadence. The literal 'k' frame is answered by the
// Cloudflare runtime itself (setWebSocketAutoResponse) without waking the
// hibernated room server — never replace this with a JSON message.
const KEEPALIVE_INTERVAL_MS = 25_000;

// "Still playing" heartbeat cadence during the hold phase. A perfectly steady
// phone sends nothing else, so without this the server's abandoned-round
// watchdog couldn't tell a careful room from a dead one. Must be comfortably
// inside the server's HOLD_ABANDON_MS (2 min) even with background-tab timer
// throttling (~1/min).
const ALIVE_INTERVAL_MS = 60_000;

// Applause timing on the losing phones: a beat of silence after the winner is
// revealed before it starts, then a slow fade-out timed to finish as the lobby
// comes in (i.e. ending at winnerEndsAt), so it dies down rather than cuts.
const APPLAUSE_START_DELAY_MS = 1000;
const APPLAUSE_FADE_OUT_MS = 2500;

// Teams unlock at 3+ players (below that it's a free-for-all). Kept in sync with
// the server's MIN_PLAYERS_FOR_TEAMS.
const MIN_PLAYERS_FOR_TEAMS = 3;
// Beyond this many wins the soap row collapses from one icon per win to a
// single icon plus "×N" so the row never overflows.
const SOAP_DISPLAY_CAP = 5;

type Player = {
  id: string;
  name: string;
  ready: boolean;
  eliminated: boolean;
  away: boolean;
  noMotion: boolean;
  team: TeamId | null;
  wins: number;
};

// A player's name with a small soap-tally row beneath it: one 🧼 per round won
// this session, collapsing to "🧼×N" past SOAP_DISPLAY_CAP. Nothing renders
// until a player has at least one win, so the row first appears after a round.
function NameWithSoaps({ name, wins }: { name: string; wins: number }) {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-ink">{name}</span>
      {wins > 0 && (
        <span
          className="text-[11px] leading-none"
          aria-label={t('room.wins', { count: wins })}
        >
          {wins > SOAP_DISPLAY_CAP ? `🧼×${wins}` : '🧼'.repeat(wins)}
        </span>
      )}
    </div>
  );
}

type LobbyState =
  | { phase: 'idle' }
  | { phase: 'in-room'; code: string };

function readRoomFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const code = new URLSearchParams(window.location.search).get('room');
  if (!code) return null;
  const normalized = normalizeRoomCode(code);
  return normalized.length >= 3 ? normalized : null;
}

// Testing mode (?test=1) reveals lobby controls for adding self-eliminating
// bots, so win conditions can be exercised without a roomful of phones. The
// param stays in the URL, so it carries through create/join.
function readTestingFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const value = new URLSearchParams(window.location.search).get('test');
  return value !== null && value !== '' && value !== '0' && value !== 'false';
}

function getPlayerName(): string {
  if (typeof window === 'undefined') return 'Player';
  let name = window.localStorage.getItem(PLAYER_NAME_KEY);
  if (!name) {
    name = generateRandomName();
    window.localStorage.setItem(PLAYER_NAME_KEY, name);
  }
  return name;
}

export function Lobby() {
  const initial = useMemo<LobbyState>(() => {
    const code = readRoomFromUrl();
    return code ? { phase: 'in-room', code } : { phase: 'idle' };
  }, []);
  const [state, setState] = useState<LobbyState>(initial);
  const testing = useMemo(() => readTestingFromUrl(), []);

  const leave = () => {
    setState({ phase: 'idle' });
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState(null, '', url.toString());
    }
  };

  if (state.phase === 'in-room') {
    return <Room code={state.code} onLeave={leave} testing={testing} />;
  }

  return <IdleLobby onEnter={(code) => setState({ phase: 'in-room', code })} />;
}

function IdleLobby({ onEnter }: { onEnter: (code: string) => void }) {
  const { t } = useI18n();
  const [joinCode, setJoinCode] = useState('');
  const normalized = normalizeRoomCode(joinCode);
  const canJoin = normalized.length >= 3;

  return (
    <div className="surface w-full max-w-sm p-6 flex flex-col gap-5">
      <button
        type="button"
        onClick={() => onEnter(generateRoomCode())}
        className="btn btn-primary w-full"
      >
        {t('lobby.create')}
      </button>

      <div className="my-1 flex items-center gap-2 text-xs text-ink-faint">
        <div className="h-px flex-1 bg-line" />
        <span>{t('lobby.or')}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (canJoin) onEnter(normalized);
        }}
      >
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('lobby.codePlaceholder')}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          maxLength={8}
          className="field text-center text-lg font-mono tracking-[0.12em] uppercase placeholder:normal-case placeholder:font-medium placeholder:tracking-normal"
        />
        <button type="submit" disabled={!canJoin} className="btn btn-primary w-full">
          {t('lobby.join')}
        </button>
      </form>
    </div>
  );
}

function Room({
  code,
  onLeave,
  testing,
}: {
  code: string;
  onLeave: () => void;
  testing: boolean;
}) {
  // Per-mount connection id: each tab/Room mount gets its own. Sharing one id
  // across browser tabs (e.g. via localStorage) collides at the partyserver
  // layer — the second WS with the same id evicts the first, so only one
  // tab can stay connected at a time.
  const { t } = useI18n();
  const myId = useMemo(() => crypto.randomUUID(), []);
  const myName = useRef(getPlayerName());

  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [readyEndsAt, setReadyEndsAt] = useState<number | null>(null);
  const [winnerEndsAt, setWinnerEndsAt] = useState<number | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winnerTeam, setWinnerTeam] = useState<TeamId | null>(null);
  // The winner we keep showing once the server returns to the lobby, so the
  // lobby can slide in beneath the celebration. Cleared when a new round starts.
  const [postGameWinnerId, setPostGameWinnerId] = useState<string | null>(null);
  const [postGameWinnerTeam, setPostGameWinnerTeam] = useState<TeamId | null>(
    null,
  );
  const [lastReaction, setLastReaction] = useState<{
    reaction: Reaction;
    at: number;
  } | null>(null);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>(
    'connecting',
  );
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  // One motion session for the whole room, started on the "I'm ready" gesture
  // (iOS requires the permission request to come from a user gesture). The
  // Game overlay reads lastShakeAt from this to detect "moved too fast".
  const detector = useShakeDetector(HOLD_THRESHOLD);
  const { start: startDetector } = detector;

  // Where no permission gesture is needed (Android, desktop), probe for the
  // sensor right away so sensor-less devices learn they'll spectate before
  // they even try to ready up. iOS keeps waiting for the ready tap.
  useEffect(() => {
    if (!motionNeedsGesture()) void startDetector();
  }, [startDetector]);

  // Keep the screen awake for the whole time in a room: a phone slipping into
  // standby hides the page, which the server treats as "away".
  useWakeLock(true);

  const socket = usePartySocket({
    host: PARTY_HOST,
    party: 'main',
    room: code,
    id: myId,
    onOpen() {
      setStatus('open');
    },
    onClose() {
      setStatus('closed');
    },
    onMessage(event: MessageEvent) {
      if (event.data === 'k') return; // keepalive echo, not JSON
      try {
        const data = JSON.parse(event.data) as Partial<{
          type: string;
          phase: Phase;
          readyEndsAt: number | null;
          winnerEndsAt: number | null;
          winnerId: string | null;
          winnerTeam: TeamId | null;
          players: Player[];
          reaction: Reaction;
        }>;
        if (data.type === 'state') {
          const nextPhase = data.phase ?? 'lobby';
          setPhase(nextPhase);
          setReadyEndsAt(data.readyEndsAt ?? null);
          setWinnerEndsAt(data.winnerEndsAt ?? null);
          setWinnerId(data.winnerId ?? null);
          setWinnerTeam(data.winnerTeam ?? null);
          setPlayers(Array.isArray(data.players) ? data.players : []);
          // Remember the winner so the post-game lobby can keep showing it; a
          // new round (ready/holding) clears it.
          if (nextPhase === 'ready' || nextPhase === 'holding') {
            setPostGameWinnerId(null);
            setPostGameWinnerTeam(null);
          } else if (
            nextPhase === 'winner' &&
            (data.winnerId || data.winnerTeam)
          ) {
            setPostGameWinnerId(data.winnerId ?? null);
            setPostGameWinnerTeam(data.winnerTeam ?? null);
          }
        } else if (data.type === 'reaction' && data.reaction) {
          setLastReaction({ reaction: data.reaction, at: Date.now() });
        }
      } catch {
        // ignore non-JSON frames
      }
    },
  });

  // Announce our name once connected.
  useEffect(() => {
    if (status === 'open') {
      socket.send(JSON.stringify({ type: 'setName', name: myName.current }));
    }
  }, [status, socket]);

  // Broadcast tab visibility so the server can ignore backgrounded players
  // for the "all ready" gate — otherwise a forgotten tab in the room holds
  // everyone else hostage waiting for it to ready up.
  useEffect(() => {
    if (status !== 'open') return;
    const send = (visible: boolean) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'visibility', visible }));
      }
    };
    send(!document.hidden);
    const onChange = () => send(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, [status, socket]);

  // Sensor verdict. Denied permission counts as unsupported too — a player who
  // can't be eliminated would win every round by standing still. Unresolved
  // ('unknown' probe, idle permission) reports nothing: the server defaults to
  // supported, and we never hold a phone hostage on a pending probe.
  const motionUnsupported =
    detector.permissionState === 'denied' ||
    detector.permissionState === 'unavailable' ||
    detector.sensorStatus === 'absent';
  const motionResolved =
    detector.sensorStatus === 'present' || motionUnsupported;

  // Report the verdict once resolved. Keyed on `status` so a reconnect (which
  // resets the server's default-true state) re-sends it; a probe that flips
  // later (absent → present after a late first reading) re-sends as well.
  useEffect(() => {
    if (status !== 'open' || !motionResolved) return;
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: 'motionSupport', supported: !motionUnsupported }),
      );
    }
  }, [status, socket, motionResolved, motionUnsupported]);

  // Server clock sync: converts server timestamps to local time so every device
  // in the room acts in lockstep. Pings only in bursts — at connect and again
  // as each round's countdown starts (readyEndsAt is fresh per round) — so a
  // quiet room sends nothing and the hibernating server can sleep.
  const { toLocalTime } = useServerClock(socket, status === 'open', readyEndsAt);

  // Keepalive: NATs and proxies drop idle WebSockets, and the clock sync no
  // longer trickles. The server's auto-response answers without waking it.
  // (Background tabs throttle this interval; partysocket reconnects cover it.)
  useEffect(() => {
    if (status !== 'open') return;
    const id = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send('k');
    }, KEEPALIVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [status, socket]);

  const me = players.find((p) => p.id === myId);

  // "Still playing" heartbeat: while a round is held and we're still in it,
  // tell the server live players remain, so its watchdog only ends rounds
  // that everyone has actually abandoned. Eliminated players and spectators
  // stay quiet — their liveness doesn't keep a round open.
  const holdingAndAlive = phase === 'holding' && me?.eliminated === false;
  useEffect(() => {
    if (status !== 'open' || !holdingAndAlive) return;
    const id = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'alive' }));
      }
    }, ALIVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [status, socket, holdingAndAlive]);

  // When a winner is crowned, the losers' phones applaud — each phone loops the
  // applause clip at a slightly randomized pitch/speed, so a roomful of phones
  // blends into a sustained crowd. It waits a beat after the reveal, then fades
  // out slowly so it has died down by the time the lobby comes in (winnerEndsAt).
  // The winner's own phone stays quiet.
  const myTeam = me?.team ?? null;
  useEffect(() => {
    if (phase !== 'winner') return;
    if (winnerId === null && winnerTeam === null) return;
    const iWon = winnerTeam ? myTeam === winnerTeam : winnerId === myId;
    if (iWon) return;

    let stop: ((fadeMs?: number) => void) | null = null;
    let fadeTimer = 0;
    const startTimer = window.setTimeout(() => {
      stop = sfx.applause();
      // Schedule the slow fade so it finishes as the lobby slides in.
      if (winnerEndsAt !== null) {
        const fadeAt = toLocalTime(winnerEndsAt) - APPLAUSE_FADE_OUT_MS;
        fadeTimer = window.setTimeout(
          () => {
            stop?.(APPLAUSE_FADE_OUT_MS);
            stop = null;
          },
          Math.max(0, fadeAt - Date.now()),
        );
      }
    }, APPLAUSE_START_DELAY_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(fadeTimer);
      // Torn down before the scheduled fade (left the room, or the transition
      // beat us to it) — still fade rather than cut.
      stop?.(APPLAUSE_FADE_OUT_MS);
    };
  }, [phase, winnerId, winnerTeam, winnerEndsAt, myId, myTeam, toLocalTime]);

  const send = (msg: unknown) => {
    if (status === 'open') socket.send(JSON.stringify(msg));
  };

  // Backgrounded tabs are skipped — they neither block start nor count.
  // Sensor-less spectators likewise, mirroring the server's start gate.
  const activePlayers = players.filter((p) => !p.away && !p.noMotion);
  const allReady = activePlayers.length > 0 && activePlayers.every((p) => p.ready);

  // Teams unlock at 3+ active players. Below that, everyone is their own side.
  const teamsActive = activePlayers.length >= MIN_PLAYERS_FOR_TEAMS;
  // Mirror the server gate: need ≥2 distinct sides to start. Blocks both a lone
  // player and the "everyone on one team" start. (Testing-mode bots count as
  // players/sides here, just like on the server.)
  const factions = new Set(
    activePlayers.map((p) =>
      teamsActive && p.team ? `team:${p.team}` : `solo:${p.id}`,
    ),
  );
  const enoughSides = factions.size >= 2;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?room=${code}`
      : `/?room=${code}`;

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const startEditing = () => {
    setDraftName(me?.name ?? myName.current);
    setEditing(true);
  };

  const saveName = () => {
    const name = draftName.trim().slice(0, 24);
    if (name) {
      myName.current = name;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PLAYER_NAME_KEY, name);
      }
      send({ type: 'setName', name });
    }
    setEditing(false);
  };

  // Enabling motion needs a user gesture (iOS); the ready checkbox is one.
  const onToggleReady = (ready: boolean) => {
    if (ready) void detector.start();
    send({ type: 'toggleReady', ready });
  };

  if (phase !== 'lobby') {
    return (
      <Game
        phase={phase}
        players={players}
        myId={myId}
        readyEndsAt={readyEndsAt}
        winnerEndsAt={winnerEndsAt}
        winnerId={winnerId}
        winnerTeam={winnerTeam}
        detector={detector}
        lastReaction={lastReaction}
        toLocalTime={toLocalTime}
        onEliminate={() => send({ type: 'eliminate' })}
        onReaction={(reaction) => send({ type: 'reaction', reaction })}
      />
    );
  }

  const lobbyPanel = (
    <div className="surface relative w-full max-w-sm p-6 flex flex-col gap-5">
      {status !== 'open' && <ConnectionSwirl status={status} />}

      <div className="flex items-center justify-center gap-2 pl-[0.2em]">
        <span className="font-round text-3xl font-bold tracking-[0.2em] text-ink">
          {code}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={t(copied ? 'room.linkCopied' : 'room.copyLink')}
          className="btn-ghost grid h-9 w-9 place-items-center p-0"
        >
          {copied ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-go"
              aria-hidden
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              {/* share: arrow rising out of a tray */}
              <path d="M12 16V4" />
              <path d="m8 8 4-4 4 4" />
              <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl bg-paper-raised p-3">
          <QRCodeSVG value={shareUrl} size={140} bgColor="#FFFFFF" fgColor="#243743" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-ink-muted">
          {t('room.players', { count: players.length })}
        </div>
        {players.length === 0 ? (
          <div className="text-sm text-ink-faint italic">
            {t('room.waiting')}
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {players.map((p) => {
              const isMe = p.id === myId;
              const isBot = p.id.startsWith('bot-');
              const team = teamById(p.team);
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm ${
                    isMe
                      ? 'bg-go/15 ring-1 ring-go/50'
                      : 'bg-paper'
                  } ${p.away ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.away ? 'bg-ink-faint' : p.ready ? 'bg-go' : 'bg-ink-faint'
                    }`}
                    title={t(
                      p.away
                        ? 'room.away'
                        : p.ready
                          ? 'room.ready'
                          : 'room.notReady',
                    )}
                  />
                  {isMe && editing ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveName();
                      }}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={draftName}
                        maxLength={24}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={saveName}
                        className="field min-w-0 flex-1 px-2.5 py-1 text-sm"
                      />
                      <button
                        type="submit"
                        className="btn-ghost border-go bg-go text-paper"
                      >
                        {t('room.save')}
                      </button>
                    </form>
                  ) : isBot && testing ? (
                    <>
                      <NameWithSoaps name={p.name} wins={p.wins} />
                      {players.length >= MIN_PLAYERS_FOR_TEAMS ? (
                        <select
                          value={p.team ?? ''}
                          onChange={(e) =>
                            send({
                              type: 'setBotTeam',
                              id: p.id,
                              team: (e.target.value || null) as TeamId | null,
                            })
                          }
                          className="field min-w-0 shrink px-1.5 py-1 text-xs"
                        >
                          <option value="">{t('room.teamSolo')}</option>
                          {TEAMS.map((tm) => (
                            <option key={tm.id} value={tm.id}>
                              {t(`team.${tm.id}`)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        team && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-paper"
                            style={{ backgroundColor: team.color }}
                          >
                            {t(`team.${team.id}`)}
                          </span>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => send({ type: 'removeBot', id: p.id })}
                        className="btn-ghost"
                      >
                        {t('room.removeBot')}
                      </button>
                    </>
                  ) : (
                    <>
                      <NameWithSoaps name={p.name} wins={p.wins} />
                      {isMe ? (
                        players.length >= MIN_PLAYERS_FOR_TEAMS && (
                          <select
                            value={p.team ?? ''}
                            onChange={(e) =>
                              send({
                                type: 'setTeam',
                                team: (e.target.value || null) as TeamId | null,
                              })
                            }
                            aria-label={t('room.team')}
                            className="field min-w-0 shrink px-1.5 py-1 text-xs"
                          >
                            <option value="">{t('room.teamSolo')}</option>
                            {TEAMS.map((tm) => (
                              <option key={tm.id} value={tm.id}>
                                {t(`team.${tm.id}`)}
                              </option>
                            ))}
                          </select>
                        )
                      ) : (
                        team && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-paper"
                            style={{ backgroundColor: team.color }}
                          >
                            {t(`team.${team.id}`)}
                          </span>
                        )
                      )}
                      {p.noMotion && (
                        <span className="shrink-0 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                          {t('room.spectator')}
                        </span>
                      )}
                      {p.away && (
                        <span className="shrink-0 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                          {t('room.away')}
                        </span>
                      )}
                      {isMe && (
                        <button
                          type="button"
                          onClick={startEditing}
                          aria-label={t('room.rename')}
                          className="btn-ghost grid h-7 w-7 place-items-center p-0"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {testing && (
        <button
          type="button"
          onClick={() =>
            send({ type: 'addBot', name: generateBotName(), team: null })
          }
          className="btn btn-secondary w-full border-dashed text-ink-muted"
        >
          {t('room.addBot')}
        </button>
      )}

      <button
        type="button"
        disabled={motionUnsupported || me?.noMotion}
        onClick={() => onToggleReady(!(me?.ready ?? false))}
        className={`btn w-full px-6 py-4 text-lg text-paper shadow-soft disabled:bg-line disabled:text-ink-faint disabled:shadow-none ${
          me?.ready ? 'bg-go' : 'bg-eliminated'
        }`}
      >
        {t(me?.ready ? 'room.readyDone' : 'room.readyPrompt')}
      </button>

      {motionUnsupported && (
        <p className="-mt-2 text-xs text-accent">{t('room.motionWarning')}</p>
      )}

      <button
        type="button"
        disabled={!allReady || !enoughSides}
        onClick={() => send({ type: 'start' })}
        className="btn btn-primary w-full"
      >
        {t(
          !allReady
            ? 'room.waitingEveryone'
            : !enoughSides
              ? activePlayers.length <= 1
                ? 'room.needPlayers'
                : 'room.needTeams'
              : 'room.startMatch',
        )}
      </button>

      <button
        type="button"
        onClick={onLeave}
        className="btn btn-neutral w-full"
      >
        {t('room.leave')}
      </button>
    </div>
  );

  // Just won? Keep the winner on screen and slide the lobby up beneath it so
  // players can keep tapping smileys. Otherwise show the plain lobby.
  if (postGameWinnerId || postGameWinnerTeam) {
    return (
      <Game
        phase="winner"
        players={players}
        myId={myId}
        readyEndsAt={null}
        winnerEndsAt={null}
        winnerId={postGameWinnerId}
        winnerTeam={postGameWinnerTeam}
        detector={detector}
        lastReaction={lastReaction}
        toLocalTime={toLocalTime}
        onEliminate={() => {}}
        onReaction={(reaction) => send({ type: 'reaction', reaction })}
        postGame
        lobbySheet={lobbyPanel}
      />
    );
  }

  return lobbyPanel;
}

// Connection indicator: a small spinning swirl in the panel's top-right, shown
// only while connecting or offline (a healthy connection shows nothing). Ochre
// while connecting, accent-red once the socket has dropped.
function ConnectionSwirl({ status }: { status: 'connecting' | 'closed' }) {
  const { t } = useI18n();
  return (
    <span
      role="status"
      aria-label={t(
        status === 'connecting' ? 'status.connecting' : 'status.offline',
      )}
      className={`absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-line ${
        status === 'connecting' ? 'border-t-ochre' : 'border-t-accent'
      }`}
    />
  );
}
