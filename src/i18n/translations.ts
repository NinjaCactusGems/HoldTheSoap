// Flat, dotted-key translation tables. `en` is the source of truth; every
// other locale is typed against it so the typechecker flags any missing/extra
// key. The four "How to play" rules contain inline <strong> markup and live as
// JSX fragments in ./richText instead.

export const en = {
  'app.title': 'HOLD THE SOAP',
  'app.language': 'Language',

  'install.cta': 'Add to Home Screen',
  'install.iosTitle': 'Add to Home Screen',
  'install.iosStep1': 'Tap the Share button in your browser toolbar.',
  'install.iosStep2': 'Choose “Add to Home Screen”.',
  'install.close': 'Got it',

  'howToPlay.title': 'How to play',
  'howToPlay.intro':
    'HOLD THE SOAP is a game of movement and balance that you play in the real world with your phone in hand.',

  'lobby.create': 'Create group',
  'lobby.or': 'or',
  'lobby.codePlaceholder': 'Group code',
  'lobby.join': 'Join',

  'room.group': 'Group',
  'room.linkCopied': 'Link copied',
  'room.copyLink': 'Copy share link',
  'room.players': 'Soaps · {count}',
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
  'room.needPlayers': 'Need at least two players',
  'room.addBot': 'Add bot',
  'room.removeBot': 'Remove',
  'room.motionWarning':
    "No motion sensors here, so you'll watch this one as a spectator. Open holdthesoap.com on a phone to play.",
  'room.spectator': 'Spectator',
  'room.startMatch': 'Start match',
  'room.waitingEveryone': 'Waiting for everyone…',
  'room.leave': 'Leave',
  'room.leaveConfirm': 'Leave this room?',
  'room.cancel': 'Cancel',
  'room.share': 'Share link',
  'room.starting': 'Starting…',
  'room.wins': '{count} wins',

  'team.shower': 'Shower',
  'team.sink': 'Sink',
  'team.bathtub': 'Bathtub',
  'team.toilet': 'Toilet',
  'team.bidet': 'Bidet',
  'team.kitchen': 'Kitchen',
  'team.hottub': 'Hot Tub',

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
  'game.spectating': "You're spectating — this device has no motion sensors",
  'game.youWin': 'You win!',
  'game.winner': 'Winner',
  'game.winsSingular': '{names} wins!',
  'game.winsPlural': '{names} win!',
  'game.and': 'and',
  'game.noOne': 'No one',
  'game.backToLobby': 'Back to lobby in {seconds}…',

  'support.coffee': 'Do you enjoy the game? Consider buying me a coffee :)',

  'footer.privacy': 'Privacy',
} as const;

export type TranslationKey = keyof typeof en;

export const de: Record<TranslationKey, string> = {
  'app.title': 'HALTE DIE SEIFE',
  'app.language': 'Sprache',

  'install.cta': 'Zum Startbildschirm',
  'install.iosTitle': 'Zum Startbildschirm hinzufügen',
  'install.iosStep1': 'Tippe auf das Teilen-Symbol in der Browser-Leiste.',
  'install.iosStep2': 'Wähle „Zum Home-Bildschirm“.',
  'install.close': 'Verstanden',

  'howToPlay.title': 'Spielanleitung',
  'howToPlay.intro':
    'HALTE DIE SEIFE ist ein Bewegungs- und Balance-Spiel, das in der echten Welt und mit dem Handy in der Hand gespielt wird.',

  'lobby.create': 'Gruppe erstellen',
  'lobby.or': 'oder',
  'lobby.codePlaceholder': 'Gruppencode',
  'lobby.join': 'Beitreten',

  'room.group': 'Gruppe',
  'room.linkCopied': 'Link kopiert',
  'room.copyLink': 'Link kopieren',
  'room.players': 'Seifen · {count}',
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
  'room.needPlayers': 'Mindestens zwei Spieler nötig',
  'room.addBot': 'Bot hinzufügen',
  'room.removeBot': 'Entfernen',
  'room.motionWarning':
    'Keine Bewegungssensoren gefunden, du schaust also als Zuschauer zu. Öffne holdthesoap.com auf einem Handy, um mitzuspielen.',
  'room.spectator': 'Zuschauer',
  'room.startMatch': 'Spiel starten',
  'room.waitingEveryone': 'Warte auf alle…',
  'room.leave': 'Verlassen',
  'room.leaveConfirm': 'Diesen Raum verlassen?',
  'room.cancel': 'Abbrechen',
  'room.share': 'Link teilen',
  'room.starting': 'Startet…',
  'room.wins': '{count} Siege',

  'team.shower': 'Dusche',
  'team.sink': 'Waschbecken',
  'team.bathtub': 'Badewanne',
  'team.toilet': 'Toilette',
  'team.bidet': 'Bidet',
  'team.kitchen': 'Küche',
  'team.hottub': 'Whirlpool',

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
  'game.spectating':
    'Du schaust zu — dieses Gerät hat keine Bewegungssensoren',
  'game.youWin': 'Du gewinnst!',
  'game.winner': 'Sieger',
  'game.winsSingular': '{names} gewinnt!',
  'game.winsPlural': '{names} gewinnen!',
  'game.and': 'und',
  'game.noOne': 'Niemand',
  'game.backToLobby': 'Zurück zur Lobby in {seconds}…',

  'support.coffee': 'Gefällt dir das Spiel? Spendier mir doch einen Kaffee :)',

  'footer.privacy': 'Datenschutz',
};

// Neutral Spanish, informal tú — mirrors the German du-form tone.
export const es: Record<TranslationKey, string> = {
  'app.title': 'SUJETA EL JABÓN',
  'app.language': 'Idioma',

  'install.cta': 'Añadir a inicio',
  'install.iosTitle': 'Añadir a la pantalla de inicio',
  'install.iosStep1': 'Toca el botón Compartir en la barra del navegador.',
  'install.iosStep2': 'Elige «Añadir a pantalla de inicio».',
  'install.close': 'Entendido',

  'howToPlay.title': 'Cómo se juega',
  'howToPlay.intro':
    'SUJETA EL JABÓN es un juego de movimiento y equilibrio que se juega en el mundo real con el teléfono en la mano.',

  'lobby.create': 'Crear grupo',
  'lobby.or': 'o',
  'lobby.codePlaceholder': 'Código del grupo',
  'lobby.join': 'Unirse',

  'room.group': 'Grupo',
  'room.linkCopied': 'Enlace copiado',
  'room.copyLink': 'Copiar enlace',
  'room.players': 'Jabones · {count}',
  'room.waiting': 'Esperando conexión…',
  'room.away': 'Ausente',
  'room.ready': 'Listo',
  'room.notReady': 'No listo',
  'room.save': 'Guardar',
  'room.you': 'Tú',
  'room.rename': 'Renombrar',
  'room.readyDone': 'Listo ✓',
  'room.readyPrompt': '¿Listo?',
  'room.team': 'Equipo',
  'room.teamSolo': 'Sin equipo (solo)',
  'room.needTeams': 'Hacen falta al menos dos bandos',
  'room.needPlayers': 'Hacen falta al menos dos jugadores',
  'room.addBot': 'Añadir bot',
  'room.removeBot': 'Quitar',
  'room.motionWarning':
    'Este dispositivo no tiene sensores de movimiento, así que mirarás como espectador. Abre holdthesoap.com en un teléfono para jugar.',
  'room.spectator': 'Espectador',
  'room.startMatch': 'Empezar partida',
  'room.waitingEveryone': 'Esperando a todos…',
  'room.leave': 'Salir',
  'room.leaveConfirm': '¿Salir de esta sala?',
  'room.cancel': 'Cancelar',
  'room.share': 'Compartir enlace',
  'room.starting': 'Empezando…',
  'room.wins': '{count} victorias',

  'team.shower': 'Ducha',
  'team.sink': 'Lavabo',
  'team.bathtub': 'Bañera',
  'team.toilet': 'Inodoro',
  'team.bidet': 'Bidé',
  'team.kitchen': 'Cocina',
  'team.hottub': 'Jacuzzi',

  'status.connected': 'Conectado',
  'status.connecting': 'Conectando',
  'status.offline': 'Sin conexión',

  'game.getReady': 'Prepárense',
  'game.go': '¡YA!',
  'game.holdStillEllipsis': 'No te muevas…',
  'game.holdStill': 'No te muevas',
  'game.hold': 'Mantén el teléfono plano y quieto',
  'game.careful': '¡Cuidado!',
  'game.soapStamp': 'JABÓN',
  'game.droppedSoap': 'Se te cayó el jabón',
  'game.out': 'FUERA',
  'game.stillIn': 'quedan {count}',
  'game.spectating':
    'Estás de espectador — este dispositivo no tiene sensores de movimiento',
  'game.youWin': '¡Ganaste!',
  'game.winner': 'Ganador',
  'game.winsSingular': '¡{names} gana!',
  'game.winsPlural': '¡{names} ganan!',
  'game.and': 'y',
  'game.noOne': 'Nadie',
  'game.backToLobby': 'Volver a la sala en {seconds}…',

  'support.coffee': '¿Te gusta el juego? Invítame a un café :)',

  'footer.privacy': 'Privacidad',
};

// Brazilian Portuguese (celular, tela, você).
export const pt: Record<TranslationKey, string> = {
  'app.title': 'SEGURA O SABONETE',
  'app.language': 'Idioma',

  'install.cta': 'Adicionar à tela inicial',
  'install.iosTitle': 'Adicionar à tela de início',
  'install.iosStep1': 'Toque no botão Compartilhar na barra do navegador.',
  'install.iosStep2': 'Escolha “Adicionar à Tela de Início”.',
  'install.close': 'Entendi',

  'howToPlay.title': 'Como jogar',
  'howToPlay.intro':
    'SEGURA O SABONETE é um jogo de movimento e equilíbrio que você joga no mundo real com o celular na mão.',

  'lobby.create': 'Criar grupo',
  'lobby.or': 'ou',
  'lobby.codePlaceholder': 'Código do grupo',
  'lobby.join': 'Entrar',

  'room.group': 'Grupo',
  'room.linkCopied': 'Link copiado',
  'room.copyLink': 'Copiar link',
  'room.players': 'Sabonetes · {count}',
  'room.waiting': 'Aguardando conexão…',
  'room.away': 'Ausente',
  'room.ready': 'Pronto',
  'room.notReady': 'Não está pronto',
  'room.save': 'Salvar',
  'room.you': 'Você',
  'room.rename': 'Renomear',
  'room.readyDone': 'Pronto ✓',
  'room.readyPrompt': 'Pronto?',
  'room.team': 'Time',
  'room.teamSolo': 'Sem time (solo)',
  'room.needTeams': 'Precisa de pelo menos dois lados',
  'room.needPlayers': 'Precisa de pelo menos dois jogadores',
  'room.addBot': 'Adicionar bot',
  'room.removeBot': 'Remover',
  'room.motionWarning':
    'Este aparelho não tem sensores de movimento, então você vai assistir como espectador. Abra holdthesoap.com num celular para jogar.',
  'room.spectator': 'Espectador',
  'room.startMatch': 'Começar partida',
  'room.waitingEveryone': 'Aguardando todo mundo…',
  'room.leave': 'Sair',
  'room.leaveConfirm': 'Sair desta sala?',
  'room.cancel': 'Cancelar',
  'room.share': 'Compartilhar link',
  'room.starting': 'Começando…',
  'room.wins': '{count} vitórias',

  'team.shower': 'Chuveiro',
  'team.sink': 'Pia',
  'team.bathtub': 'Banheira',
  'team.toilet': 'Privada',
  'team.bidet': 'Bidê',
  'team.kitchen': 'Cozinha',
  'team.hottub': 'Jacuzzi',

  'status.connected': 'Conectado',
  'status.connecting': 'Conectando',
  'status.offline': 'Sem conexão',

  'game.getReady': 'Preparem-se',
  'game.go': 'JÁ!',
  'game.holdStillEllipsis': 'Não se mexa…',
  'game.holdStill': 'Não se mexa',
  'game.hold': 'Segure o celular reto e parado',
  'game.careful': 'Cuidado!',
  'game.soapStamp': 'SABONETE',
  'game.droppedSoap': 'Você deixou o sabonete cair',
  'game.out': 'FORA',
  'game.stillIn': '{count} ainda no jogo',
  'game.spectating':
    'Você está assistindo — este aparelho não tem sensores de movimento',
  'game.youWin': 'Você venceu!',
  'game.winner': 'Vencedor',
  'game.winsSingular': '{names} venceu!',
  'game.winsPlural': '{names} venceram!',
  'game.and': 'e',
  'game.noOne': 'Ninguém',
  'game.backToLobby': 'Voltando para a sala em {seconds}…',

  'support.coffee': 'Curtiu o jogo? Que tal me pagar um café :)',

  'footer.privacy': 'Privacidade',
};

// French, informal tu.
export const fr: Record<TranslationKey, string> = {
  'app.title': 'TIENS LE SAVON',
  'app.language': 'Langue',

  'install.cta': 'Ajouter à l’écran d’accueil',
  'install.iosTitle': 'Ajouter à l’écran d’accueil',
  'install.iosStep1': 'Touche le bouton Partager dans la barre du navigateur.',
  'install.iosStep2': 'Choisis « Sur l’écran d’accueil ».',
  'install.close': 'Compris',

  'howToPlay.title': 'Comment jouer',
  'howToPlay.intro':
    'TIENS LE SAVON est un jeu de mouvement et d’équilibre qui se joue dans le monde réel, téléphone en main.',

  'lobby.create': 'Créer un groupe',
  'lobby.or': 'ou',
  'lobby.codePlaceholder': 'Code du groupe',
  'lobby.join': 'Rejoindre',

  'room.group': 'Groupe',
  'room.linkCopied': 'Lien copié',
  'room.copyLink': 'Copier le lien',
  'room.players': 'Savons · {count}',
  'room.waiting': 'En attente de connexion…',
  'room.away': 'Absent',
  'room.ready': 'Prêt',
  'room.notReady': 'Pas prêt',
  'room.save': 'Enregistrer',
  'room.you': 'Toi',
  'room.rename': 'Renommer',
  'room.readyDone': 'Prêt ✓',
  'room.readyPrompt': 'Prêt ?',
  'room.team': 'Équipe',
  'room.teamSolo': 'Sans équipe (solo)',
  'room.needTeams': 'Il faut au moins deux camps',
  'room.needPlayers': 'Il faut au moins deux joueurs',
  'room.addBot': 'Ajouter un bot',
  'room.removeBot': 'Retirer',
  'room.motionWarning':
    'Pas de capteurs de mouvement ici, tu regarderas donc en spectateur. Ouvre holdthesoap.com sur un téléphone pour jouer.',
  'room.spectator': 'Spectateur',
  'room.startMatch': 'Lancer la partie',
  'room.waitingEveryone': 'En attente de tout le monde…',
  'room.leave': 'Quitter',
  'room.leaveConfirm': 'Quitter ce salon ?',
  'room.cancel': 'Annuler',
  'room.share': 'Partager le lien',
  'room.starting': 'Démarrage…',
  'room.wins': '{count} victoires',

  'team.shower': 'Douche',
  'team.sink': 'Lavabo',
  'team.bathtub': 'Baignoire',
  'team.toilet': 'Toilettes',
  'team.bidet': 'Bidet',
  'team.kitchen': 'Cuisine',
  'team.hottub': 'Jacuzzi',

  'status.connected': 'Connecté',
  'status.connecting': 'Connexion',
  'status.offline': 'Hors ligne',

  'game.getReady': 'Préparez-vous',
  'game.go': 'PARTEZ !',
  'game.holdStillEllipsis': 'Ne bouge plus…',
  'game.holdStill': 'Ne bouge plus',
  'game.hold': 'Tiens le téléphone à plat, sans bouger',
  'game.careful': 'Attention !',
  'game.soapStamp': 'SAVON',
  'game.droppedSoap': 'Tu as fait tomber le savon',
  'game.out': 'ÉLIMINÉ',
  'game.stillIn': 'encore {count} en jeu',
  'game.spectating':
    'Tu es spectateur — cet appareil n’a pas de capteurs de mouvement',
  'game.youWin': 'Tu as gagné !',
  'game.winner': 'Vainqueur',
  'game.winsSingular': '{names} gagne !',
  'game.winsPlural': '{names} gagnent !',
  'game.and': 'et',
  'game.noOne': 'Personne',
  'game.backToLobby': 'Retour au salon dans {seconds}…',

  'support.coffee': 'Le jeu te plaît ? Offre-moi un café :)',

  'footer.privacy': 'Confidentialité',
};

export const dict = { en, de, es, pt, fr } as const;

export type Locale = keyof typeof dict; // 'en' | 'de' | 'es' | 'pt' | 'fr'

export const SUPPORTED: Locale[] = ['en', 'de', 'es', 'pt', 'fr'];
