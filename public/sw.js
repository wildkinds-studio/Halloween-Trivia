// Offline cache for the home-screen version. Pages: network first so updates arrive; everything else: cache first.
// The cloud API and photos (/api, /_blob) always go to the network: the app keeps its own copy of both.
const CACHE = 'trivia-day-7c64cd74e2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  if (url.origin === self.location.origin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_blob/'))) return;
  // App launches: use the network copy if it arrives within 3 s (so updates land), otherwise the cached
  // one, so a slow connection never leaves the home-screen app blank. The network copy still refreshes the cache.
  if (req.mode === 'navigate') {
    const net = fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put('./index.html', copy))); } return r; });
    e.waitUntil(net.catch(() => {}));
    e.respondWith((async () => {
      const cached = await caches.match('./index.html');
      if (!cached) return net.catch(() => Response.error());
      const slow = new Promise((res) => setTimeout(() => res(null), 3000));
      const first = await Promise.race([net.catch(() => null), slow]);
      return first && first.ok ? first : cached;
    })());
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
