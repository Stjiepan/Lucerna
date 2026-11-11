/* Service worker: l'app funziona anche offline.
   Per rilasciare una nuova versione cambia BUILD qui e in index.html (stesso valore).
   Il nuovo worker resta "in attesa": è la pagina a chiedere all'utente se aggiornare subito. */
const BUILD = 'lucerna-v14';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(BUILD).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== BUILD).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  else if (d.type === 'GET_BUILD' && e.ports && e.ports[0]) e.ports[0].postMessage({ build: BUILD });
});

// Risponde subito dalla cache e intanto aggiorna in background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request, { cache: 'no-cache' }).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(BUILD).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit || caches.match('./index.html'));
      return hit || net;
    })
  );
});
