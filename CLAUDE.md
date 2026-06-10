# HOLD THE SOAP

Multiplayer web app, mobile-first.

## Hosting & Infrastructure

The app will be deployed to **Cloudflare**.

- **Domain:** `holdthesoap.com` (registered through Cloudflare, managed in the same Cloudflare account). The app is served directly from the **apex** (zone root), not a subdomain.
- **Platform:** Cloudflare (Workers for compute; pick the right storage primitive per need — D1, KV, R2, Durable Objects).
- Mobile-first browser app. Native wrappers are out of scope unless explicitly added later.

## CI/CD

All CI/CD runs in GitHub Actions and deploys to Cloudflare.

Two **organisation secrets** are already configured and must be used by any workflow that talks to Cloudflare:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account ID. |
| `CLOUDFLARE_API_KEY` | API token scoped for Workers, DNS, R2, and related permissions. |

Notes for workflows:

- Reference them as `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` and `${{ secrets.CLOUDFLARE_API_KEY }}`.
- The secret is named `CLOUDFLARE_API_KEY` but holds an **API token** (not a Global API Key). When using `cloudflare/wrangler-action`, pass it as `apiToken:`. When calling the Cloudflare API directly, send it as `Authorization: Bearer $CLOUDFLARE_API_KEY`.
- Token scopes already granted: Workers, DNS, R2, and others. If a workflow needs a scope that isn't present, ask before rotating — don't silently swap in a Global API Key.
- Do **not** add per-repo duplicates of these secrets; rely on the organisation-level ones.
- Never echo the token, write it to logs, or commit it to the repo.

## Conventions

- Default branch: `main`.
- Deploy flow:
  - Push to `main` → `.github/workflows/deploy-prod.yml` deploys the production party Worker (`holdthesoap-party`) and the Pages site to `holdthesoap.com`.
  - Open / push to a PR → `.github/workflows/deploy-preview.yml` deploys the Pages preview to `<branch>.holdthesoap.pages.dev` **and** a separate, isolated party Worker (`holdthesoap-party-preview`) that the preview build points at. This keeps server-side (`party/server.ts`) changes testable on a PR without touching production. It's a single shared preview Worker (rooms are per-code Durable Objects); each preview push redeploys it with that branch's code, so the most recently pushed PR's server wins. The sticky comment posts both the normal and `?test=1` preview URLs.
  - All PRs and pushes to `main` also run `.github/workflows/ci.yml` (lint, typecheck, build).
- Keep infrastructure-as-code (wrangler.toml, workflow files) in the repo so deploys are reproducible. Cloudflare's Git integration is intentionally not used — the repo is the source of truth.
- See `README.md` for one-time setup (Pages project pre-creation, custom domain attach, token scope check).

## Privacy policy

The privacy policy lives at `holdthesoap.com/privacy`. It is a standalone, English-only static page at `public/privacy.html` (served directly by Cloudflare Pages as a real asset — deliberately **not** a React/SPA route, so it resolves with one well-defined request and no rewrite/redirect ambiguity). Its styling mirrors the theme tokens in `src/index.css`. It is reachable from the home-page footer link.

**Keep it in sync:** any change that adds, removes, or alters how personal data is collected, processed, stored, or shared — e.g. new device sensors, analytics, third-party scripts or fonts, cookies, persisted fields, new sub-processors, or sending previously on-device data to the server — **must update `public/privacy.html` (including its "Last updated" date) in the same PR.** If unsure whether a feature is privacy-affecting, assume it is and review the policy.

## Gameplay

### Shake-detection thresholds

The accelerometer hook (`src/hooks/useShakeDetector.ts`) compares smoothed acceleration magnitude against a threshold. Three named presets to use as defaults or UI options:

| Preset    | Threshold | Notes                         |
| --------- | --------- | ----------------------------- |
| Sensitive | 3 m/s²    | Triggers on small jolts.      |
| Normal    | 7 m/s²    | Default for new players.      |
| Forgiving | 12 m/s²   | Needs a deliberate shove.     |

Units are m/s² (acceleration magnitude), matching the `DeviceMotionEvent.acceleration` API. The hold phase runs at the fixed **Normal** preset (7 m/s², `HOLD_THRESHOLD` in `Lobby.tsx`) for everyone; the other presets are reference points for any future difficulty options.

### Game flow

A round runs through four server-owned phases (`party/server.ts`), with the client overlay in `src/components/Game.tsx`:

1. **Lobby** — players join and ready up. Toggling "I'm ready" also requests device-motion permission (iOS needs the request to come from a user gesture).
2. **Ready** — a 5-second countdown synced via `readyEndsAt`. The countdown converts `readyEndsAt` from server time to local time with the RTT offset from `useServerClock` (`toLocalTime`), so every device counts down in lockstep. The clock sync pings only in short bursts — at connect and again as each round's countdown starts (`readyEndsAt` doubles as the re-burst trigger) — there is **no steady ping**, so an idle room sends nothing and the server can hibernate. Small haptic tick each second, a larger buzz on "Go". Neutral staff background.
3. **Holding** (phase string `'holding'`) — a "hold still" nerve game. Each phone watches its own motion at the fixed **Normal/medium** threshold (7 m/s²) via `useShakeDetector(7)`; a spike (or tilting past `TILT_THRESHOLD_DEG`) reports `eliminate` to the server. While you're in, random synthesized bubble pops (`sfx.bubble()`, scheduled by `useBubbleSfx`) act as an audio pressure gauge: their frequency rises **exponentially** with how close your motion is to either drop threshold — a pop every ~4s on a steady phone, a near-constant fizz right at the limit, silent once you're out. Your screen is full-screen **olive** while in, **red** ("OUT") once eliminated — readable across a room. Last player standing wins.
4. **Winner** — shows the survivor's name. While this phase is up, every *losing* phone loops an applause clip (`sfx.applause()`) at a slightly randomized pitch/speed; a roomful of phones blends into a sustained crowd (the winner's own phone stays quiet). It starts a beat after the reveal (`APPLAUSE_START_DELAY_MS`) and fades out slowly (`APPLAUSE_FADE_OUT_MS`) so it has died down by the time the lobby comes in (the fade is timed to end at `winnerEndsAt`). The elimination cue (`sfx.screech()`) and the applause are short sampled clips in `src/assets/`; only the smiley reactions are still synthesized. Any player can tap a smiley (💩 / ❤️ / 🕺 / 💃); each tap re-broadcasts a transient `reaction` event that floats one emoji particle up every screen (no counters). After 10 seconds (`winnerEndsAt`) the server returns everyone to the lobby un-readied, but the client keeps the winner on screen and slides the lobby panel up (it fades in) from below — so players can keep emoting. Reactions are accepted by the server in both the `winner` and `lobby` phases for this reason. The post-game winner is cleared on the client when the next round starts. There is no match soundtrack — the bubble pops, applause, screech, and reaction blips are the entire soundscape.

Notes:
- The server is authoritative for all transitions and timing. Clients only send `eliminate` (self) and `reaction`.
- A match needs **at least two distinct sides** to start (`tryStartGame` in `party/server.ts`); a lone player (or a room where everyone is on one team) cannot start. There is no auto-added solo opponent.
- A player who joins mid-round is marked eliminated (spectates) until the next reset.
- Devices without a usable motion sensor are **spectators** (e.g. desktops; denied motion permission counts too). Detection is an event probe in `useShakeDetector` — desktop Chrome defines `DeviceMotionEvent` but never fires usable events, so "no real reading within ~3s" is the signal. The client reports a `motionSupport` yes/no to the server (noted in the privacy policy); spectators can't ready up, never count as a side or block start, and begin every round eliminated. The server defaults to supported, so clients that never report behave as before.
- A "Buy me a coffee" pill (`CoffeeLink` in `Game.tsx`) shows for eliminated players from elimination onward, and for **everyone — winner included — on the winner screen and through the post-game lobby**. It's a tall pill with a coffee-cup icon in a circle on the left and an external-link arrow on the right.
- Vibration patterns live in `src/lib/haptics.ts`.

### Server hibernation

The room Durable Object hibernates (`static options = { hibernate: true }` in `party/server.ts`) so idle rooms cost no duration. The invariants that keep this correct:

- **Per-player state** (name, ready, eliminated, visible, motionSupported, team) lives in each connection's hibernatable-socket attachment via partyserver's `connection.setState()` — it survives hibernation with the socket and is discarded when the connection closes. Never move it to in-memory class fields.
- **Room-level state** (phase, phase deadlines, winner, `teamsActive`, bots) is one JSON value under the `'room'` storage key, loaded in `onStart()` (which the runtime completes before any handler after a wake) and re-`put` after every mutation (`saveRoom()`).
- **All timed transitions run on the single DO alarm** — never `setTimeout`. `armAlarm()` schedules the next due event (`readyEndsAt`, `winnerEndsAt`, or during holding the earliest of bot drops and the `holdEndsAt` watchdog); `onAlarm()` dispatches purely on persisted state, so stale/early fires degrade to a re-arm.
- **Watchdog:** `holdEndsAt` caps the hold phase at 10 minutes (`MAX_HOLD_DURATION_MS`). A round whose remaining players all vanish without a clean close resolves to "no one" and returns to the lobby instead of hanging forever.
- **Keepalive:** clients send a literal `'k'` frame every ~25s, answered by `setWebSocketAutoResponse` in the runtime **without waking the DO**. Don't replace it with a JSON message — that would defeat hibernation.
- **Cleanup:** when the last connection closes, `onClose` wipes storage (`deleteAll()` + explicit `deleteAlarm()` — deleteAll alone doesn't clear the alarm) and resets the in-memory room, so empty rooms leave nothing behind (this backs the privacy-policy claim that room data is discarded when everyone leaves).
- `onConnect` only fires on fresh upgrades (not after a wake) and dedupes connections that share a client id, closing the older socket — dirty mobile reconnects would otherwise leave zombie duplicates.

### Testing mode

A URL parameter (`?test=1`) reveals an **Add bot** control in the lobby (`src/components/Lobby.tsx`). Bots are virtual server-side participants (`party/server.ts`): always ready, never away, with assignable teams (the bot row gets a team selector once the room reaches the 3-player team threshold) and a **Remove** button. A bot's name carries a number affix (e.g. `Citrus 6`, generated by `generateBotName` in `src/lib/names.ts`); the number is the **number of seconds** into the hold phase at which the bot self-eliminates (parsed back out server-side and scheduled via the room's alarm, not a timer), so win conditions resolve deterministically even across hibernation. Bots count as players/sides, so one human plus one bot is a valid two-sided start. Bots persist across rounds (re-readied each reset) until removed. The bot UI is gated client-side only — the server accepts `addBot`/`setBotTeam`/`removeBot` in the lobby from any connection. The deploy-preview workflow links both the normal and `?test=1` preview URLs.
