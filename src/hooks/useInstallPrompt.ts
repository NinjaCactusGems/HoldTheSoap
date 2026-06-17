import { useEffect, useState } from 'react';

// Chromium fires `beforeinstallprompt` once the PWA install criteria are met,
// letting us defer the native install dialog until the user taps our button.
// It isn't in lib.dom yet, so we type just the bits we touch.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Already launched from the home screen — no point offering to install again.
function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari uses this non-standard flag instead of display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iOS gives no programmatic install — the button can only show the manual
// Share → "Add to Home Screen" instructions there.
function detectIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ masquerades as desktop Safari; touch points disambiguate.
    (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1)
  );
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Suppress Chrome's mini-infobar; we surface our own button instead.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The event is single-use; drop it so the button hides afterwards.
    setDeferred(null);
  };

  return {
    canPrompt: deferred !== null,
    isIos: detectIos(),
    isStandalone: detectStandalone(),
    installed,
    promptInstall,
  };
}
