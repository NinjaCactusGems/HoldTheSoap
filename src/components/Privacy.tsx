import { useEffect } from 'react';

// Standalone privacy policy served at /privacy. English-only by design (legal
// text doesn't track the EN/DE switcher), styled to match the app shell so it
// reads as part of HOLD THE SOAP. Reached via a normal full-page link, with a
// _redirects rule (public/_redirects) so a cold hit/refresh serves the SPA.
//
// IMPORTANT: if a change adds, removes, or alters how personal data is
// collected, processed, stored, or shared, update this policy and the
// "Last updated" date below in the same change (see CLAUDE.md).

const CONTACT_EMAIL = 'Robin.daraban@gmail.com';
const CONTACT_NAME = 'Robin Daraban';
const LAST_UPDATED = '9 June 2026';

export function Privacy() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Privacy Policy · HOLD THE SOAP';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="relative min-h-dvh bg-sky text-ink">
      <main className="mx-auto w-full max-w-2xl px-6 pt-10 pb-16 sm:px-8 sm:pt-14">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-ink-muted hover:text-ink transition"
        >
          <span aria-hidden="true">←</span> Back
        </a>

        <h1 className="mt-6 font-round text-4xl sm:text-5xl font-bold tracking-tight text-pink">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 rounded-2xl border border-line bg-paper-raised/80 px-6 py-6 text-[15px] leading-relaxed">
          <Section title="Who we are">
            <p>
              HOLD THE SOAP is a free, browser-based party game available at{' '}
              <strong>holdthesoap.com</strong>. The game is operated by{' '}
              {CONTACT_NAME}, who is the data controller responsible for your
              personal data. You can reach us at{' '}
              <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p>
              This policy explains what limited personal data we process when you
              play, why, and the rights you have. It is written for visitors in
              the United Kingdom and follows the UK GDPR and the Data Protection
              Act 2018.
            </p>
          </Section>

          <Section title="The data we process">
            <p>We have deliberately kept this game lightweight. We process:</p>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>
                <strong>A display name</strong> you type when you join a group, so
                other players in your room can tell who is who. You choose this and
                it does not need to be your real name.
              </li>
              <li>
                <strong>A language preference</strong> (English or German), stored
                on your own device so the game remembers your choice.
              </li>
              <li>
                <strong>Device-motion readings</strong> from your phone's
                accelerometer during a round. These are read and processed{' '}
                <strong>only on your device</strong> to detect when you "drop the
                soap". The raw motion data is never sent to us or stored; only the
                fact that you have been eliminated is shared with your room.
              </li>
              <li>
                <strong>Your IP address and basic connection data</strong>, which
                are processed by our hosting provider to connect your device to a
                game room and to keep the service secure and reliable.
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> ask you to create an account, and we do{' '}
              <strong>not</strong> collect your email address, location, contacts,
              photos, or any special-category data.
            </p>
          </Section>

          <Section title="Cookies and local storage">
            <p>
              We do not use tracking or advertising cookies, and we do not run any
              analytics. The only thing we store on your device is your language
              preference, kept in your browser's local storage. It stays on your
              device until you clear your browser data and is never used to track
              you across other sites.
            </p>
          </Section>

          <Section title="Why we are allowed to process this data">
            <p>
              Under the UK GDPR our lawful basis is our{' '}
              <strong>legitimate interests</strong> in providing a working,
              secure, multiplayer game that you have chosen to play — specifically
              running game rooms, showing players to one another, and protecting
              the service from abuse. We only process the minimum data needed to do
              that.
            </p>
          </Section>

          <Section title="Who else is involved">
            <p>
              We do not sell or share your data for marketing. A small number of
              service providers process data on our behalf or as part of delivering
              the page:
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>
                <strong>Cloudflare</strong> hosts the game and runs the real-time
                game servers. It processes your IP address and connection data to
                deliver the service and protect it from attacks.
              </li>
              <li>
                <strong>Google Fonts</strong> serves the font used on the page.
                When the page loads, your browser requests the font from Google,
                which means Google receives your IP address.
              </li>
            </ul>
            <p className="mt-3">
              These providers may process data on servers outside the UK. Where
              that happens, the transfer is covered by appropriate safeguards (such
              as the UK International Data Transfer Agreement or equivalent
              mechanisms).
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              Display names and room information are temporary: they exist only
              while a game room is active and are discarded when the room ends or
              everyone leaves. We do not keep a history of games or names. Your
              language preference stays on your own device until you remove it.
            </p>
          </Section>

          <Section title="Children">
            <p>
              HOLD THE SOAP is a general-audience party game and is not directed at
              children under 13. We do not knowingly collect personal data from
              children. If you believe a child has provided personal data, please
              contact us and we will address it.
            </p>
          </Section>

          <Section title="Your rights">
            <p>Under the UK GDPR you have the right to:</p>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>access the personal data we hold about you;</li>
              <li>ask us to correct data that is inaccurate;</li>
              <li>ask us to erase your data;</li>
              <li>object to, or ask us to restrict, our processing.</li>
            </ul>
            <p className="mt-3">
              Because we hold so little data and most of it is transient, there is
              often nothing for us to retrieve. To exercise any of these rights,
              email us at{' '}
              <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="Complaints">
            <p>
              If you are unhappy with how we have handled your data, you can
              complain to the UK's Information Commissioner's Office (ICO) at{' '}
              <a
                className="text-accent underline"
                href="https://ico.org.uk"
                target="_blank"
                rel="noreferrer"
              >
                ico.org.uk
              </a>
              . We would appreciate the chance to address your concerns first.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we add features that change what data we process, we will update
              this policy and the "Last updated" date at the top. Please check back
              from time to time.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="font-round text-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-ink">{children}</div>
    </section>
  );
}
