import type { ReactNode } from 'react';
import type { Locale } from './translations';

// The four "How to play" rules carry inline <strong> emphasis, so they live as
// per-locale JSX fragments rather than plain strings in the translation table.
// Order matches the numbered list (and BulletFigure n) in HowToPlay.tsx.
export const howToPlayRules: Record<Locale, (() => ReactNode)[]> = {
  en: [
    () => (
      <>
        Hold your phone <strong>flat, screen up</strong>, as if you were
        balancing the soap on your palm, and keep it level.
      </>
    ),
    () => (
      <>
        <strong>Dance and weave</strong> around the other players without
        jostling your own phone.
      </>
    ),
    () => (
      <>
        Make rivals move too quickly. A <strong>touch on the arm</strong> is
        fair game. If you <strong>tilt or jerk your phone</strong> the soap
        slips off.
      </>
    ),
    () => (
      <>
        Be the <strong>last one standing</strong> to win the round.
      </>
    ),
  ],
  de: [
    () => (
      <>
        Halte dein Handy <strong>flach, mit dem Bildschirm nach oben</strong>,
        als würdest du die Seife auf der Handfläche balancieren, und halte es
        waagerecht.
      </>
    ),
    () => (
      <>
        <strong>Umtanze</strong> andere Spieler und{' '}
        <strong>weiche ihnen aus</strong>, ohne dein Handy zu erschüttern.
      </>
    ),
    () => (
      <>
        Bring deine Rivalen dazu, sich zu schnell zu bewegen. Eine{' '}
        <strong>Berührung am Arm</strong> ist erlaubt. Wenn du{' '}
        <strong>dein Handy kippst oder ruckelst</strong>, rutscht die Seife weg.
      </>
    ),
    () => (
      <>
        Sei der <strong>Letzte, der übrig bleibt</strong>, um das Spiel zu
        gewinnen.
      </>
    ),
  ],
  es: [
    () => (
      <>
        Sostén el teléfono <strong>plano, con la pantalla hacia arriba</strong>,
        como si equilibraras el jabón en la palma de la mano, y mantenlo
        nivelado.
      </>
    ),
    () => (
      <>
        <strong>Baila y esquiva</strong> entre los demás jugadores sin sacudir
        tu propio teléfono.
      </>
    ),
    () => (
      <>
        Haz que tus rivales se muevan demasiado rápido. Un{' '}
        <strong>toque en el brazo</strong> vale. Si{' '}
        <strong>inclinas o sacudes el teléfono</strong>, el jabón se resbala.
      </>
    ),
    () => (
      <>
        Sé <strong>el último en pie</strong> para ganar la ronda.
      </>
    ),
  ],
  pt: [
    () => (
      <>
        Segure o celular <strong>reto, com a tela para cima</strong>, como se
        estivesse equilibrando o sabonete na palma da mão, e mantenha-o
        nivelado.
      </>
    ),
    () => (
      <>
        <strong>Dance e desvie</strong> dos outros jogadores sem balançar o seu
        próprio celular.
      </>
    ),
    () => (
      <>
        Faça os rivais se mexerem rápido demais. Um{' '}
        <strong>toque no braço</strong> vale. Se você{' '}
        <strong>inclinar ou sacudir o celular</strong>, o sabonete escorrega.
      </>
    ),
    () => (
      <>
        Seja <strong>o último de pé</strong> para vencer a rodada.
      </>
    ),
  ],
  fr: [
    () => (
      <>
        Tiens ton téléphone <strong>à plat, écran vers le haut</strong>, comme
        si tu tenais le savon en équilibre sur ta paume, et garde-le bien
        horizontal.
      </>
    ),
    () => (
      <>
        <strong>Danse et faufile-toi</strong> entre les autres joueurs sans
        secouer ton propre téléphone.
      </>
    ),
    () => (
      <>
        Pousse tes rivaux à bouger trop vite. Une{' '}
        <strong>touche sur le bras</strong> est permise. Si tu{' '}
        <strong>inclines ou secoues ton téléphone</strong>, le savon glisse.
      </>
    ),
    () => (
      <>
        Sois <strong>le dernier debout</strong> pour gagner la manche.
      </>
    ),
  ],
};
