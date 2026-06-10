import { Server, routePartykitRequest, type Connection } from 'partyserver';

type Phase = 'lobby' | 'ready' | 'holding' | 'winner';

type Reaction = 'turd' | 'heart' | 'dancer' | 'dancerF';

// Team identifiers (places where soap gets used). The id list is duplicated here
// from src/lib/teams.ts (which also carries the labels/colors the client renders),
// mirroring how REACTIONS is duplicated — the server only needs to validate ids.
type TeamId =
  | 'shower'
  | 'sink'
  | 'bathtub'
  | 'toilet'
  | 'basin'
  | 'bidet'
  | 'kitchen'
  | 'hottub';

type Player = {
  id: string;
  name: string;
  ready: boolean;
  eliminated: boolean;
  away: boolean;
  // Device reported no usable motion sensor (or denied access) — a spectator:
  // never eligible for a match, doesn't count as a side, can't win.
  noMotion: boolean;
  team: TeamId | null;
};

// Per-connection player state. Stored via connection.setState() in the
// hibernatable WebSocket attachment (NOT in DO storage): it survives
// hibernation with the socket and is discarded the moment the connection
// closes — names never touch the room's persistent storage.
type PlayerState = {
  name: string;
  ready: boolean;
  eliminated: boolean;
  visible: boolean;
  // Defaults true: clients only report after their sensor probe resolves,
  // and a device we know nothing about (e.g. an older cached client that
  // never sends motionSupport) keeps today's behavior.
  motionSupported: boolean;
  team: TeamId | null;
};

const DEFAULT_PLAYER_STATE: PlayerState = {
  name: 'Player',
  ready: false,
  eliminated: false,
  visible: true,
  motionSupported: true,
  team: null,
};

// A testing-mode bot: a virtual lobby participant added from the testing UI
// (see src/components/Lobby.tsx). Bots are always ready and never away, can be
// put on a team, and self-eliminate `dropAfterMs` into the hold phase — the
// delay is parsed from the trailing number in their name (e.g. "Citrus 6" → 6s),
// so test rounds resolve deterministically. `dropAt` is the absolute server
// time of the pending drop for the in-progress round (alarm-driven), null
// outside the hold phase.
type Bot = {
  id: string;
  name: string;
  team: TeamId | null;
  eliminated: boolean;
  dropAfterMs: number;
  dropAt: number | null;
};

// Room-level state, persisted as one JSON value under the 'room' storage key so
// it survives hibernation. Wiped (with the alarm) when the last player leaves.
type RoomData = {
  phase: Phase;
  readyEndsAt: number | null;
  // Watchdog: hard end of the hold phase. A round whose remaining players all
  // vanish without a clean close would otherwise hang forever now that the
  // server hibernates between messages; when this alarm fires the round
  // resolves to "no one" and the room returns to the lobby.
  holdEndsAt: number | null;
  winnerEndsAt: number | null;
  winnerId: string | null;
  winnerTeam: TeamId | null;
  // Whether team rules apply to the in-progress (or just-finished) round.
  // Captured at start from the active player count so a mid-round disconnect
  // can't flip the win logic. Cleared in resetToLobby.
  teamsActive: boolean;
  bots: Record<string, Bot>;
};

function defaultRoom(): RoomData {
  return {
    phase: 'lobby',
    readyEndsAt: null,
    holdEndsAt: null,
    winnerEndsAt: null,
    winnerId: null,
    winnerTeam: null,
    teamsActive: false,
    bots: {},
  };
}

type RoomState = {
  type: 'state';
  phase: Phase;
  readyEndsAt: number | null;
  winnerEndsAt: number | null;
  winnerId: string | null;
  // The winning team when a group wins (all survivors share one team); null when
  // a lone survivor wins (winnerId carries them instead). See checkWinCondition.
  winnerTeam: TeamId | null;
  players: Player[];
};

// A fire-and-forget reaction burst, re-broadcast to everyone so each client
// can spawn the same emoji particles. Not part of RoomState — it carries no
// persistent state and isn't replayed to late joiners.
type ReactionEvent = {
  type: 'reaction';
  reaction: Reaction;
};

// Messages the client may send us.
type ClientMessage =
  | { type: 'setName'; name: string }
  | { type: 'setTeam'; team: TeamId | null }
  | { type: 'toggleReady'; ready: boolean }
  | { type: 'visibility'; visible: boolean }
  | { type: 'motionSupport'; supported: boolean }
  | { type: 'start' }
  | { type: 'eliminate' }
  | { type: 'reaction'; reaction: Reaction }
  | { type: 'addBot'; name: string; team: TeamId | null }
  | { type: 'setBotTeam'; id: string; team: TeamId | null }
  | { type: 'removeBot'; id: string }
  | { type: 'ping'; t: number };

const MAX_PLAYERS_PER_ROOM = 32;
const MAX_NAME_LENGTH = 24;
const READY_DURATION_MS = 5000;
const WINNER_DURATION_MS = 10000;
// Watchdog cap on the hold phase (see RoomData.holdEndsAt).
const MAX_HOLD_DURATION_MS = 10 * 60_000;
const REACTIONS: readonly Reaction[] = ['turd', 'heart', 'dancer', 'dancerF'];
const TEAM_IDS: readonly TeamId[] = [
  'shower',
  'sink',
  'bathtub',
  'toilet',
  'basin',
  'bidet',
  'kitchen',
  'hottub',
];
// Teams only matter once the room is at least this big; below it, every player
// is treated as their own side (a free-for-all). Captured at game start as
// `teamsActive`.
const MIN_PLAYERS_FOR_TEAMS = 3;

// Testing-mode bots self-eliminate `seconds * 1000` ms into the hold phase,
// where `seconds` is the number parsed from the end of their name. Clamp to a
// sane range, and use this default if a name carries no number.
const BOT_DROP_MIN_SECONDS = 1;
const BOT_DROP_MAX_SECONDS = 60;
const BOT_DROP_DEFAULT_SECONDS = 8;

// Reject WS upgrades whose Origin isn't ours, so other sites can't drive
// our Durable Objects from their users' browsers (cost-shifting). The
// check runs in the worker's fetch handler before routePartykitRequest,
// so unauthorized requests never spawn a DO.
const ALLOWED_ORIGINS = new Set([
  'https://holdthesoap.com',
  'https://www.holdthesoap.com',
  'https://holdthesoap.pages.dev',
]);

const ALLOWED_ORIGIN_SUFFIXES = ['.holdthesoap.pages.dev'];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return ALLOWED_ORIGIN_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export class Main extends Server {
  // Hibernation: the DO is evicted whenever it's idle (an idle lobby costs no
  // duration), while open sockets — and the per-player state in their
  // attachments — survive. Room-level state lives under the 'room' storage key
  // (loaded in onStart, which the runtime completes before any handler after a
  // wake), and the single DO alarm drives every timed phase transition.
  static options = { hibernate: true };

  private room: RoomData = defaultRoom();

  async onStart() {
    this.room = (await this.ctx.storage.get<RoomData>('room')) ?? defaultRoom();
    // NAT/proxy keepalive: clients send a literal 'k' every ~25s; the runtime
    // answers 'k' itself without waking a hibernated DO.
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('k', 'k'));
  }

  // Persist room-level state. Fire-and-forget is safe: the DO output gate
  // holds any broadcasts queued after this put until the write commits.
  private saveRoom() {
    void this.ctx.storage.put('room', this.room);
  }

  private playerOf(c: Connection<PlayerState>): PlayerState {
    return (c.state as PlayerState | null) ?? DEFAULT_PLAYER_STATE;
  }

  private patchPlayer(c: Connection<PlayerState>, patch: Partial<PlayerState>) {
    c.setState({ ...this.playerOf(c), ...patch });
  }

  onConnect(connection: Connection<PlayerState>) {
    // The hibernating connection manager doesn't dedupe ids: a dirty reconnect
    // (mobile network drop, no close frame) can leave a zombie socket with the
    // same client id. Close the old one — the id is always a connection's
    // first tag, so getConnections(id) finds its twins.
    for (const other of this.getConnections<PlayerState>(connection.id)) {
      if (other !== connection) other.close(4000, 'Replaced by reconnect');
    }
    // getConnections() already includes the new one at this point;
    // close it back out if the room is over capacity. Limits per-room
    // blast radius once a DO is alive.
    if ([...this.getConnections()].length > MAX_PLAYERS_PER_ROOM) {
      connection.close(1013, 'Room full');
      return;
    }
    // Someone joining mid-game spectates the current round (eliminated) so they
    // can't skew the win check; resetToLobby() clears this for the next round.
    connection.setState({
      ...DEFAULT_PLAYER_STATE,
      eliminated: this.room.phase !== 'lobby',
    });
    this.broadcastState();
  }

  onMessage(connection: Connection<PlayerState>, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return;
    // Keepalive frames are normally answered by the runtime's auto-response
    // without reaching us; skip any that arrive anyway (e.g. local dev).
    if (message === 'k') return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'setName': {
        const name = String(msg.name ?? '').trim().slice(0, MAX_NAME_LENGTH);
        if (!name) return;
        this.patchPlayer(connection, { name });
        this.broadcastState();
        break;
      }
      case 'setTeam': {
        // Picking a team is a lobby decision. Accept a clear (null) or a known
        // team id; ignore anything else.
        if (this.room.phase !== 'lobby') return;
        const team = msg.team;
        if (team !== null && !TEAM_IDS.includes(team)) return;
        this.patchPlayer(connection, { team });
        this.broadcastState();
        break;
      }
      case 'toggleReady': {
        if (this.room.phase !== 'lobby') return;
        // Sensor-less devices spectate — they can't ready up for a match.
        if (msg.ready && !this.playerOf(connection).motionSupported) return;
        this.patchPlayer(connection, { ready: Boolean(msg.ready) });
        this.broadcastState();
        break;
      }
      case 'motionSupport': {
        // The client's sensor probe resolved (any phase — it can take a few
        // seconds after joining). Sensor-less devices also lose ready, so a
        // desktop that readied inside the probe window can't slip into a match
        // — and one that did anyway is eliminated on the spot rather than
        // left to "win" by never moving.
        const supported = Boolean(msg.supported);
        const patch: Partial<PlayerState> = { motionSupported: supported };
        if (!supported) {
          patch.ready = false;
          if (this.room.phase !== 'lobby') patch.eliminated = true;
        }
        this.patchPlayer(connection, patch);
        this.broadcastState();
        if (this.room.phase === 'holding') this.checkWinCondition();
        break;
      }
      case 'visibility': {
        const visible = Boolean(msg.visible);
        // Backgrounded players can't drive the lobby — clear ready so a
        // forgotten tab can't keep the room "ready" by accident.
        // Mid-round we deliberately do NOT eliminate: a phone that briefly
        // backgrounds (notification, a flick to standby) keeps playing and can
        // still win when it comes back. (Clients also hold a screen wake lock
        // to keep this rare.) Holding still is the whole game, after all.
        this.patchPlayer(
          connection,
          visible ? { visible } : { visible, ready: false },
        );
        this.broadcastState();
        break;
      }
      case 'start': {
        this.tryStartGame();
        break;
      }
      case 'eliminate': {
        if (this.room.phase !== 'holding') return;
        if (this.playerOf(connection).eliminated) return; // idempotent — clients may send twice
        this.patchPlayer(connection, { eliminated: true });
        this.broadcastState();
        this.checkWinCondition();
        break;
      }
      case 'reaction': {
        // Allowed on the winner screen and afterwards in the lobby, so the
        // post-game celebration can keep emoting as the lobby slides in.
        if (this.room.phase !== 'winner' && this.room.phase !== 'lobby') return;
        if (!REACTIONS.includes(msg.reaction)) return;
        // Fire-and-forget: re-broadcast so every client bursts the same emoji.
        const event: ReactionEvent = { type: 'reaction', reaction: msg.reaction };
        this.broadcast(JSON.stringify(event));
        break;
      }
      case 'addBot': {
        // Bots are a lobby-only testing aid. The UI is gated behind a URL
        // param client-side; the server just keeps the room within capacity.
        if (this.room.phase !== 'lobby') return;
        const name = String(msg.name ?? '').trim().slice(0, MAX_NAME_LENGTH);
        if (!name) return;
        const team = msg.team;
        if (team !== null && team !== undefined && !TEAM_IDS.includes(team)) return;
        const total =
          [...this.getConnections()].length + Object.keys(this.room.bots).length;
        if (total >= MAX_PLAYERS_PER_ROOM) return;
        const id = `bot-${crypto.randomUUID()}`;
        this.room.bots[id] = {
          id,
          name,
          team: team ?? null,
          eliminated: false,
          dropAfterMs: this.botDropMsFromName(name),
          dropAt: null,
        };
        this.saveRoom();
        this.broadcastState();
        break;
      }
      case 'setBotTeam': {
        if (this.room.phase !== 'lobby') return;
        const bot = this.room.bots[String(msg.id)];
        if (!bot) return;
        const team = msg.team;
        if (team !== null && !TEAM_IDS.includes(team)) return;
        bot.team = team;
        this.saveRoom();
        this.broadcastState();
        break;
      }
      case 'removeBot': {
        const id = String(msg.id);
        if (this.room.phase !== 'lobby') return;
        if (id in this.room.bots) {
          delete this.room.bots[id];
          this.saveRoom();
          this.broadcastState();
        }
        break;
      }
      case 'ping': {
        // Clock sync: echo the client's send time plus our own clock, so the
        // client can estimate round-trip time and its offset from server time
        // (Cristian's algorithm) and schedule synced events like match start.
        if (typeof msg.t === 'number') {
          connection.send(
            JSON.stringify({ type: 'pong', t: msg.t, serverTime: Date.now() }),
          );
        }
        break;
      }
    }
  }

  onClose(connection: Connection<PlayerState>) {
    // Per-player state needs no cleanup — it dies with the socket attachment.
    const othersLeft = [...this.getConnections()].some(
      (c) => c.id !== connection.id,
    );
    if (!othersLeft) {
      // Last player gone: leave nothing behind (privacy + storage hygiene).
      // deleteAll() doesn't clear the alarm, and this instance may stay
      // resident and greet the next joiner — reset memory too.
      this.room = defaultRoom();
      void this.ctx.storage.deleteAll();
      void this.ctx.storage.deleteAlarm();
      return;
    }
    this.broadcastState();
    // A disconnect can leave a single survivor — resolve the round.
    if (this.room.phase === 'holding') this.checkWinCondition();
  }

  // ——— Alarm-driven phase machine ———
  // The DO has exactly one alarm. Every transition re-arms it for the next
  // due event, and onAlarm dispatches purely on the persisted state — never on
  // which event it *thinks* it was armed for — so stale or early fires (e.g.
  // an eliminate message resolving the round just before a bot-drop alarm
  // lands) degrade to a harmless re-arm.

  private nextDueTime(): number | null {
    switch (this.room.phase) {
      case 'ready':
        return this.room.readyEndsAt;
      case 'winner':
        return this.room.winnerEndsAt;
      case 'holding': {
        let due = this.room.holdEndsAt ?? Number.POSITIVE_INFINITY;
        for (const b of Object.values(this.room.bots)) {
          if (!b.eliminated && b.dropAt !== null) due = Math.min(due, b.dropAt);
        }
        return Number.isFinite(due) ? due : null;
      }
      case 'lobby':
        return null;
    }
  }

  private armAlarm() {
    const due = this.nextDueTime();
    void (due === null
      ? this.ctx.storage.deleteAlarm()
      : this.ctx.storage.setAlarm(due));
  }

  async onAlarm() {
    const now = Date.now();
    const r = this.room;
    if (r.phase === 'ready' && r.readyEndsAt !== null && now >= r.readyEndsAt) {
      this.startHolding();
      return;
    }
    if (r.phase === 'holding') {
      // Eliminate every bot whose drop time has passed, in one pass.
      let changed = false;
      for (const b of Object.values(r.bots)) {
        if (!b.eliminated && b.dropAt !== null && now >= b.dropAt) {
          b.eliminated = true;
          changed = true;
        }
      }
      if (changed) {
        this.saveRoom();
        this.broadcastState();
      }
      this.checkWinCondition();
      if (this.room.phase === 'holding') {
        if (r.holdEndsAt !== null && now >= r.holdEndsAt) {
          // Watchdog: a round nobody can finish (every remaining player gone
          // without a clean close) ends with no winner instead of hanging.
          this.resolveRound(null);
        } else {
          this.armAlarm();
        }
      }
      return;
    }
    if (r.phase === 'winner' && r.winnerEndsAt !== null && now >= r.winnerEndsAt) {
      this.resetToLobby();
      return;
    }
    // Stale fire in any other state: recompute and move on.
    this.armAlarm();
  }

  private currentPlayers(): Player[] {
    const players = [...this.getConnections<PlayerState>()].map((c) => {
      const entry = this.playerOf(c);
      return {
        id: c.id,
        name: entry.name,
        ready: entry.ready,
        eliminated: entry.eliminated,
        away: !entry.visible,
        noMotion: !entry.motionSupported,
        team: entry.team,
      };
    });
    for (const b of Object.values(this.room.bots)) {
      players.push({
        id: b.id,
        name: b.name,
        ready: true, // bots are always ready and never away
        eliminated: b.eliminated,
        away: false,
        noMotion: false,
        team: b.team,
      });
    }
    return players;
  }

  // Parse the trailing number from a bot's name into its hold-phase
  // self-eliminate delay (in ms), clamped to a sane range. Defaults when the
  // name carries no number.
  private botDropMsFromName(name: string): number {
    const match = /(\d+)\s*$/.exec(name);
    const seconds = match ? Number(match[1]) : BOT_DROP_DEFAULT_SECONDS;
    const clamped = Math.min(
      BOT_DROP_MAX_SECONDS,
      Math.max(BOT_DROP_MIN_SECONDS, seconds),
    );
    return clamped * 1000;
  }

  // A player's "side" this round. With teams active, teammates collapse to one
  // side; teamless players (and everyone when teams are off) are a side of one,
  // so they win alone.
  private factionKey(p: Player, teamsActive: boolean): string {
    return teamsActive && p.team ? `team:${p.team}` : `solo:${p.id}`;
  }

  private tryStartGame() {
    if (this.room.phase !== 'lobby') return;
    // Skip away players entirely — they neither block start nor count
    // toward the "all ready" check. They stay in the room and rejoin
    // the next lobby cycle when they come back. Sensor-less devices are
    // skipped the same way: they spectate and never make up a side, so a
    // phone plus only desktops can't start a match.
    const active = this.currentPlayers().filter((p) => !p.away && !p.noMotion);
    if (active.length === 0 || !active.every((p) => p.ready)) return;

    // Teams only count with enough people; otherwise it's a free-for-all.
    this.room.teamsActive = active.length >= MIN_PLAYERS_FOR_TEAMS;
    // Need at least two distinct sides to play — blocks both a lone player and
    // the degenerate "everyone on one team" start. (Testing-mode bots count as
    // players, so a human + 1 bot is a valid two-sided start.)
    const factions = new Set(
      active.map((p) => this.factionKey(p, this.room.teamsActive)),
    );
    if (factions.size < 2) return;

    for (const c of this.getConnections<PlayerState>()) {
      const entry = this.playerOf(c);
      // Away and sensor-less players start the round already eliminated —
      // neither gets to spectate-then-win halfway through.
      this.patchPlayer(c, {
        eliminated: !entry.visible || !entry.motionSupported,
      });
    }
    for (const b of Object.values(this.room.bots)) b.eliminated = false;
    this.room.winnerId = null;
    this.room.phase = 'ready';
    this.room.readyEndsAt = Date.now() + READY_DURATION_MS;
    this.saveRoom();
    this.broadcastState();
    this.armAlarm();
  }

  private startHolding() {
    const now = Date.now();
    this.room.phase = 'holding';
    this.room.readyEndsAt = null;
    this.room.holdEndsAt = now + MAX_HOLD_DURATION_MS;
    // Testing-mode bots drop themselves at their name-defined delay.
    for (const b of Object.values(this.room.bots)) {
      b.dropAt = now + b.dropAfterMs;
    }
    this.saveRoom();
    this.broadcastState();
    this.armAlarm();
    // A room already down to a single side resolves at once rather than
    // hanging in the hold phase forever.
    this.checkWinCondition();
  }

  private checkWinCondition() {
    if (this.room.phase !== 'holding') return;
    const alive = this.currentPlayers().filter((p) => !p.eliminated);
    // The round resolves once everyone left belongs to a single side.
    const factions = new Set(
      alive.map((p) => this.factionKey(p, this.room.teamsActive)),
    );
    if (factions.size > 1) return;

    this.resolveRound(alive[0] ?? null);
  }

  // End the hold phase. `survivor` is the winning player (or null when nobody
  // is left — including the watchdog ending an unresolvable round).
  private resolveRound(survivor: Player | null) {
    this.room.phase = 'winner';
    // A team wins as a group; a teamless survivor (or any winner when teams are
    // off) wins alone via winnerId.
    if (this.room.teamsActive && survivor?.team) {
      this.room.winnerTeam = survivor.team;
      this.room.winnerId = null;
    } else {
      this.room.winnerTeam = null;
      this.room.winnerId = survivor?.id ?? null;
    }
    this.room.readyEndsAt = null;
    this.room.holdEndsAt = null;
    for (const b of Object.values(this.room.bots)) b.dropAt = null;
    this.room.winnerEndsAt = Date.now() + WINNER_DURATION_MS;
    this.saveRoom();
    this.broadcastState();
    this.armAlarm();
  }

  private resetToLobby() {
    this.room.phase = 'lobby';
    this.room.readyEndsAt = null;
    this.room.holdEndsAt = null;
    this.room.winnerEndsAt = null;
    this.room.winnerId = null;
    this.room.winnerTeam = null;
    this.room.teamsActive = false;
    // Everyone returns to the lobby un-readied and back in the game. Team picks
    // persist across rounds (only the per-round flags reset). Bots persist too,
    // re-readied for the next round.
    for (const c of this.getConnections<PlayerState>()) {
      this.patchPlayer(c, { ready: false, eliminated: false });
    }
    for (const b of Object.values(this.room.bots)) {
      b.eliminated = false;
      b.dropAt = null;
    }
    this.saveRoom();
    this.broadcastState();
    this.armAlarm();
  }

  private broadcastState() {
    const message: RoomState = {
      type: 'state',
      phase: this.room.phase,
      readyEndsAt: this.room.readyEndsAt,
      winnerEndsAt: this.room.winnerEndsAt,
      winnerId: this.room.winnerId,
      winnerTeam: this.room.winnerTeam,
      players: this.currentPlayers(),
    };
    this.broadcast(JSON.stringify(message));
  }
}

type Env = { Main: DurableObjectNamespace };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!isAllowedOrigin(request.headers.get('Origin'))) {
      return new Response('Forbidden', { status: 403 });
    }
    return (
      (await routePartykitRequest(request, env as unknown as Record<string, DurableObjectNamespace>)) ||
      new Response('Not found', { status: 404 })
    );
  },
};
