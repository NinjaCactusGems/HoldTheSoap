// Friendly player names: two distinct soap scents, e.g. "Lavender Citrus".

const SCENTS = [
  'Lavender',
  'Vanilla',
  'Citrus',
  'Rose',
  'Sandalwood',
  'Eucalyptus',
  'Mint',
  'Jasmine',
  'Coconut',
  'Lemon',
  'Almond',
  'Honey',
  'Oatmeal',
  'Aloe',
  'Cedar',
  'Bergamot',
  'Lemongrass',
  'Ginger',
  'Cucumber',
  'Shea',
];

function pick<T>(list: T[]): T {
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return list[bytes[0] % list.length];
}

export function generateRandomName(): string {
  const first = pick(SCENTS);
  // Pick the second scent from everything but the first, so we never repeat
  // ("Lavender Lavender").
  const second = pick(SCENTS.filter((s) => s !== first));
  return `${first} ${second}`;
}

// Testing-mode bot name: one scent plus a number affix, e.g. "Lavender 7". The
// trailing number is how many seconds into the hold phase the bot eliminates
// itself (parsed back out server-side), so its name reads as its lifespan.
const BOT_MIN_SECONDS = 2;
const BOT_MAX_SECONDS = 20;

export function generateBotName(): string {
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  const span = BOT_MAX_SECONDS - BOT_MIN_SECONDS + 1;
  const seconds = BOT_MIN_SECONDS + (bytes[0] % span);
  return `${pick(SCENTS)} ${seconds}`;
}
