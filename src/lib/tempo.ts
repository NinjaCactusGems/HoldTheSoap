// Shared tempo model for the hold-phase "speed shifts".
//
// During a round the server occasionally shifts the tempo for everyone at once
// (synced via the server clock). Each tempo has fixed, always-the-same targets:
//   - a music playback rate (pitch preserved, so it stays a clean audio effect
//     rather than a degraded tape warble), and
//   - an acceleration threshold (m/s², per the CLAUDE.md presets) that makes
//     elimination more or less sensitive.
//
//   slow → music slower, Sensitive threshold (small jolts eliminate you)
//   fast → music faster, Forgiving threshold (needs a deliberate shove)

export type Tempo = 'normal' | 'fast' | 'slow';

export const TEMPO_RATE: Record<Tempo, number> = {
  normal: 1,
  fast: 1.4,
  slow: 0.7,
};

export const TEMPO_THRESHOLD: Record<Tempo, number> = {
  normal: 7, // Normal preset
  fast: 12, // Forgiving — harder to trip
  slow: 3, // Sensitive — twitchy
};
