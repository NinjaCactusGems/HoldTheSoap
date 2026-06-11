import { useCallback, useEffect, useRef } from 'react';

// Minimal shape of the partysocket we need — send plus message listening.
interface ClockSocket {
  send(data: string): void;
  readyState: number;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void;
}

const MAX_SAMPLES = 8;

// One sync burst: a ping now and three follow-ups, enough for the lowest-RTT
// pick to converge. Returns a canceller for the pending timeouts.
function pingBurst(socket: ClockSocket): () => void {
  const ping = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping', t: Date.now() }));
    }
  };
  ping();
  const timers = [
    window.setTimeout(ping, 200),
    window.setTimeout(ping, 500),
    window.setTimeout(ping, 1200),
  ];
  return () => timers.forEach((id) => window.clearTimeout(id));
}

/**
 * Estimates the offset between this client's clock and the server's, so that
 * server-authoritative timestamps (e.g. `readyEndsAt`) can be converted to a
 * precise local instant and scheduled in step across every device in the room.
 *
 * It pings in short bursts; the server echoes the client's send time plus its
 * own clock. Using Cristian's algorithm, each round trip yields:
 *   rtt    = now - sentAt
 *   offset = serverTime - (sentAt + now) / 2     // serverTime − localTime
 * We keep the offset from the lowest-RTT recent sample, since the least-delayed
 * exchange gives the tightest estimate (half-RTT either way).
 *
 * Bursts fire at connect and again whenever `resyncKey` changes to a non-null
 * value — the Room passes `readyEndsAt`, which is fresh each round, so the
 * offset is re-measured right as the countdown starts. There is deliberately
 * no steady ping between bursts: clock drift over a round is a few ms, and a
 * quiet socket lets the hibernating server sleep (a 'k' keepalive answered by
 * the runtime keeps NATs happy without waking it).
 *
 * `toLocalTime(serverTs)` maps a server timestamp into local `Date.now()` space.
 * Until the first pong (or against an un-upgraded server), the offset is 0, so
 * it falls back to assuming the clocks agree.
 */
export function useServerClock(
  socket: ClockSocket,
  connected: boolean,
  resyncKey: number | null,
) {
  const samplesRef = useRef<{ offset: number; rtt: number }[]>([]);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!connected) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data === 'k') return; // keepalive echo, not JSON
      let data: { type?: string; t?: number; serverTime?: number };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (
        data.type !== 'pong' ||
        typeof data.t !== 'number' ||
        typeof data.serverTime !== 'number'
      ) {
        return;
      }
      const now = Date.now();
      const rtt = now - data.t;
      if (rtt < 0 || rtt > 10000) return;
      const offset = data.serverTime - (data.t + now) / 2;

      const samples = samplesRef.current;
      samples.push({ offset, rtt });
      if (samples.length > MAX_SAMPLES) samples.shift();
      // Trust the offset from the least-delayed recent round trip.
      let best = samples[0];
      for (const s of samples) if (s.rtt < best.rtt) best = s;
      offsetRef.current = best.offset;
    };

    socket.addEventListener('message', onMessage);

    // A quick burst to converge fast; no steady trickle (see header comment).
    const stopBurst = pingBurst(socket);

    return () => {
      socket.removeEventListener('message', onMessage);
      stopBurst();
    };
  }, [socket, connected]);

  // Re-measure right as a round starts, so the countdown (and everything else
  // scheduled off server timestamps this round) uses a fresh offset. The first
  // pong lands well inside the 5s countdown, which self-corrects each tick.
  useEffect(() => {
    if (!connected || resyncKey === null) return;
    return pingBurst(socket);
  }, [socket, connected, resyncKey]);

  // Map a server timestamp into this client's Date.now() space.
  const toLocalTime = useCallback(
    (serverTs: number) => serverTs - offsetRef.current,
    [],
  );

  return { toLocalTime };
}
