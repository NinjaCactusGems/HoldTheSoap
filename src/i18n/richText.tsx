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
        <strong>Berührung am Arm</strong> ist erlaubt.{' '}
        <strong>Kippst du mehr als 30°</strong> oder ruckelst du, rutscht die
        Seife weg und du bist raus.
      </>
    ),
    () => (
      <>
        Sei der <strong>Letzte, der übrig bleibt</strong>, um das Spiel zu
        gewinnen.
      </>
    ),
  ],
};
