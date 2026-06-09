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
