// Flat, dotted-key translation tables. `en` is the source of truth; `de` is
// typed against it so the typechecker flags any missing/extra German key.
// The four "How to play" rules contain inline <strong> markup and live as JSX
// fragments in ./richText instead.

export const en = {
  'app.title': 'HOLD THE SOAP',

  'howToPlay.title': 'How to play',
  'howToPlay.intro':
    'HOLD THE SOAP is a game of movement and balance that you play in the real world with your phone in hand.',

  'lobby.create': 'Create group',
  'lobby.or': 'or',
  'lobby.codePlaceholder': 'GROUP CODE',
  'lobby.join': 'Join',

  'room.group': 'Group',
  'room.linkCopied': 'Link copied',
  'room.copyLink': 'Copy share link',
  'room.players': 'Players · {count}',
  'room.waiting': 'Waiting for connection…',
  'room.away': 'Away',
  'room.ready': 'Ready',
  'room.notReady': 'Not ready',
  'room.save': 'Save',
  'room.you': 'You',
  'room.rename': 'Rename',
  'room.readyDone': 'Ready ✓',
  'room.readyPrompt': 'Ready?',
  'room.team': 'Team',
  'room.teamSolo': 'No team (solo)',
  'room.needTeams': 'Need at least two sides',
  'room.motionWarning':
    "Motion sensing is off, so you can't be eliminated. Open holdthesoap.com on a phone for the full game.",
  'room.startMatch': 'Start match',
  'room.waitingEveryone': 'Waiting for everyone…',
  'room.leave': 'Leave',

  'status.connected': 'Connected',
  'status.connecting': 'Connecting',
  'status.offline': 'Offline',

  'game.getReady': 'Get Ready',
  'game.go': 'GO!',
  'game.holdStillEllipsis': 'Hold still…',
  'game.holdStill': 'Hold still',
  'game.hold': 'Hold the phone flat and steady',
  'game.careful': 'Careful!',
  'game.soapStamp': 'SOAP',
  'game.droppedSoap': 'You dropped the soap',
  'game.out': 'OUT',
  'game.stillIn': '{count} still in',
  'game.youWin': 'You win!',
  'game.winner': 'Winner',
  'game.teamWins': '{team} win!',
  'game.noOne': 'No one',
  'game.backToLobby': 'Back to lobby in {seconds}…',
} as const;

export type TranslationKey = keyof typeof en;

export const de: Record<TranslationKey, string> = {
  'app.title': 'HALTE DIE SEIFE',

  'howToPlay.title': 'Spielanleitung',
  'howToPlay.intro':
    'HALTE DIE SEIFE ist ein Spiel aus Bewegung und Balance, das in der echten Welt und mit dem Handy in der Hand gespielt wird.',

  'lobby.create': 'Gruppe erstellen',
  'lobby.or': 'oder',
  'lobby.codePlaceholder': 'GRUPPENCODE',
  'lobby.join': 'Beitreten',

  'room.group': 'Gruppe',
  'room.linkCopied': 'Link kopiert',
  'room.copyLink': 'Link kopieren',
  'room.players': 'Spieler · {count}',
  'room.waiting': 'Warte auf Verbindung…',
  'room.away': 'Abwesend',
  'room.ready': 'Bereit',
  'room.notReady': 'Nicht bereit',
  'room.save': 'Speichern',
  'room.you': 'Du',
  'room.rename': 'Umbenennen',
  'room.readyDone': 'Bereit ✓',
  'room.readyPrompt': 'Bereit?',
  'room.team': 'Team',
  'room.teamSolo': 'Kein Team (allein)',
  'room.needTeams': 'Mindestens zwei Seiten nötig',
  'room.motionWarning':
    'Die Bewegungserkennung ist aus, du kannst also nicht ausscheiden. Öffne holdthesoap.com auf einem Handy für das volle Spiel.',
  'room.startMatch': 'Spiel starten',
  'room.waitingEveryone': 'Warte auf alle…',
  'room.leave': 'Verlassen',

  'status.connected': 'Verbunden',
  'status.connecting': 'Verbinde',
  'status.offline': 'Offline',

  'game.getReady': 'Macht euch bereit',
  'game.go': 'LOS!',
  'game.holdStillEllipsis': 'Stillhalten…',
  'game.holdStill': 'Stillhalten',
  'game.hold': 'Halte das Handy flach und ruhig',
  'game.careful': 'Vorsicht!',
  'game.soapStamp': 'SEIFE',
  'game.droppedSoap': 'Du hast die Seife fallen lassen',
  'game.out': 'RAUS',
  'game.stillIn': 'noch {count} dabei',
  'game.youWin': 'Du gewinnst!',
  'game.winner': 'Sieger',
  'game.teamWins': '{team} gewinnt!',
  'game.noOne': 'Niemand',
  'game.backToLobby': 'Zurück zur Lobby in {seconds}…',
};

export const dict = { en, de } as const;

export type Locale = keyof typeof dict; // 'en' | 'de'

export const SUPPORTED: Locale[] = ['en', 'de'];
