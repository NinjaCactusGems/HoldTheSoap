// Team play: places where soap gets used, that you can rally behind. Teams are
// distinguished by an icon + name (no colors).
//
// Display names live in the i18n dictionary as `team.<id>` keys; render them
// via t(`team.${id}`).

export type TeamId =
  | 'shower'
  | 'sink'
  | 'bathtub'
  | 'toilet'
  | 'bidet'
  | 'kitchen'
  | 'hottub';

export type Team = {
  id: TeamId;
  // Emoji glyph shown in the compact team picker pill and its menu.
  icon: string;
};

export const TEAMS: Team[] = [
  { id: 'shower', icon: '🚿' },
  { id: 'sink', icon: '🚰' },
  { id: 'bathtub', icon: '🛁' },
  { id: 'toilet', icon: '🚽' },
  { id: 'bidet', icon: '💦' },
  { id: 'kitchen', icon: '🧽' },
  { id: 'hottub', icon: '♨️' },
];

export const TEAM_IDS: TeamId[] = TEAMS.map((t) => t.id);

const TEAM_BY_ID = new Map<TeamId, Team>(TEAMS.map((t) => [t.id, t]));

export function teamById(id: TeamId | null): Team | undefined {
  return id ? TEAM_BY_ID.get(id) : undefined;
}
