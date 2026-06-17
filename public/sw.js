// Minimal service worker. Its only job is to exist with a `fetch` handler so
// Chromium treats the app as installable (fires `beforeinstallprompt`). It does
// NOT cache anything — Hold The Soap is realtime/multiplayer, so every request
// goes straight to the network to avoid serving stale assets. No offline mode.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Pass-through: let the browser handle the request normally.
});
