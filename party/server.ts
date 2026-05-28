import { Server, routePartykitRequest, type Connection } from 'partyserver';

type PresenceMessage = { type: 'presence'; players: string[] };

const MAX_PLAYERS_PER_ROOM = 16;

// Reject WS upgrades whose Origin isn't ours, so other sites can't drive
// our Durable Objects from their users' browsers (cost-shifting). The
// check runs in the worker's fetch handler before routePartykitRequest,
// so unauthorized requests never spawn a DO.
const ALLOWED_ORIGINS = new Set([
  'https://joust.ninja-cactus.com',
  'https://joust.pages.dev',
]);

const ALLOWED_ORIGIN_SUFFIXES = ['.joust.pages.dev'];

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
  static options = { hibernate: true };

  onConnect(connection: Connection) {
    // getConnections() already includes the new one at this point;
    // close it back out if the room is over capacity. Limits per-room
    // blast radius once a DO is alive.
    if ([...this.getConnections()].length > MAX_PLAYERS_PER_ROOM) {
      connection.close(1013, 'Room full');
      return;
    }
    this.broadcastPresence();
  }

  onClose() {
    this.broadcastPresence();
  }

  private broadcastPresence() {
    const players = [...this.getConnections()].map((c: Connection) => c.id);
    const message: PresenceMessage = { type: 'presence', players };
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
