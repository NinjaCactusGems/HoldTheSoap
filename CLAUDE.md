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

Units are m/s² (acceleration magnitude), matching the `DeviceMotionEvent.acceleration` API. The slider in `App.tsx` and any future per-game-mode defaults should anchor on these values.

### Game flow

A round runs through four server-owned phases (`party/server.ts`), with the client overlay in `src/components/Game.tsx`:

1. **Lobby** — players join and ready up. Toggling "I'm ready" also requests device-motion permission (iOS needs the request to come from a user gesture).
2. **Ready** — a 5-second countdown synced via `readyEndsAt`. The countdown (like the music) converts `readyEndsAt` from server time to local time with the RTT offset from `useServerClock` (`toLocalTime`), so every device counts down in lockstep. Small haptic tick each second, a larger buzz on "Go". Neutral staff background.
3. **Holding** (phase string `'holding'`) — a "hold still" nerve game. Each phone watches its own motion at the **Normal/medium** threshold (7 m/s²) via `useShakeDetector(7)`; a spike reports `eliminate` to the server. Your screen is full-screen **olive** while in, **red** ("OUT") once eliminated — readable across a room. Last player standing wins.
4. **Winner** — shows the survivor's name. While this phase is up, every *losing* phone loops an applause clip (`sfx.applause()`) at a slightly randomized pitch/speed; a roomful of phones blends into a sustained crowd (the winner's own phone stays quiet). It starts a beat after the reveal (`APPLAUSE_START_DELAY_MS`) and fades out slowly (`APPLAUSE_FADE_OUT_MS`) so it has died down by the time the lobby comes in (the fade is timed to end at `winnerEndsAt`). The elimination cue (`sfx.screech()`) and the applause are short sampled clips in `src/assets/`; only the smiley reactions are still synthesized. Any player can tap a smiley (💩 / ❤️ / 🕺 / 💃); each tap re-broadcasts a transient `reaction` event that floats one emoji particle up every screen (no counters). After 10 seconds (`winnerEndsAt`) the server returns everyone to the lobby un-readied, but the client keeps the winner on screen and slides the lobby panel up (it fades in) from below — so players can keep emoting. The match soundtrack rides through this transition and fades out as the lobby panel fades in (held `POSTGAME_HOLD_MS` into the post-game), so it never plays in the idle lobby before the next match. Reactions are accepted by the server in both the `winner` and `lobby` phases for this reason. The post-game winner is cleared on the client when the next round starts.

Notes:
- The server is authoritative for all transitions and timing. Clients only send `eliminate` (self) and `reaction`.
- A match needs **at least two distinct sides** to start (`tryStartGame` in `party/server.ts`); a lone player (or a room where everyone is on one team) cannot start. There is no auto-added solo opponent.
- A player who joins mid-round is marked eliminated (spectates) until the next reset.
- Devices without a usable motion sensor are **spectators** (e.g. desktops; denied motion permission counts too). Detection is an event probe in `useShakeDetector` — desktop Chrome defines `DeviceMotionEvent` but never fires usable events, so "no real reading within ~3s" is the signal. The client reports a `motionSupport` yes/no to the server (noted in the privacy policy); spectators can't ready up, never count as a side or block start, and begin every round eliminated. The server defaults to supported, so clients that never report behave as before.
- A "Buy me a coffee" pill (`CoffeeLink` in `Game.tsx`) shows for eliminated players from elimination onward, and for **everyone — winner included — on the winner screen and through the post-game lobby**. It's a tall pill with a coffee-cup icon in a circle on the left and an external-link arrow on the right.
- Vibration patterns live in `src/lib/haptics.ts`.

### Testing mode

A URL parameter (`?test=1`) reveals an **Add bot** control in the lobby (`src/components/Lobby.tsx`). Bots are virtual server-side participants (`party/server.ts`): always ready, never away, with assignable teams (the bot row gets a team selector once the room reaches the 3-player team threshold) and a **Remove** button. A bot's name carries a number affix (e.g. `Citrus 6`, generated by `generateBotName` in `src/lib/names.ts`); the number is the **number of seconds** into the hold phase at which the bot self-eliminates (parsed back out server-side), so win conditions resolve deterministically. Bots count as players/sides, so one human plus one bot is a valid two-sided start. Bots persist across rounds (re-readied each reset) until removed. The bot UI is gated client-side only — the server accepts `addBot`/`setBotTeam`/`removeBot` in the lobby from any connection. The deploy-preview workflow links both the normal and `?test=1` preview URLs.
