'use strict';

// Bump VERSION whenever a cached file changes; keep each release's shell together.
const VERSION = 'pwa-1';
const ROOT = new URL('./', self.location.href);
const PREFIX = 'super-manos:' + ROOT.pathname + ':';
const CACHE = PREFIX + VERSION;
// Bump this only when replacing existing art; new files download independently.
const ART = PREFIX + 'art-1';
const CORE = [
  'index.html', 'manifest.webmanifest', 'assets/vendor/peerjs-1.5.4.min.js',
  'assets/fonts/bangers.ttf', 'assets/fonts/russo-one.ttf',
  'assets/icons/icon-180.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  ...['config', 'input', 'audio', 'ui', 'rig', 'characters', 'art', 'moves', 'fx',
    'fighter', 'stages', 'battle', 'ai', 'net', 'netui', 'touch', 'app', 'pwa', 'main'].map(n => 'src/' + n + '.js'),
];
const IDS = ['emanuel', 'leonardo', 'walgidio', 'dave', 'diego', 'naftali', 'atircio', 'daniel', 'alvaro', 'cleusio', 'cristiano', 'rodrigo'];
const PACK = [
  ...IDS.map(id => 'assets/fighters/' + id + (id === 'rodrigo' ? '.png' : '.webp')),
  ...IDS.map(id => 'assets/fighters/combat/' + (id === 'emanuel' ? 'street' : id) + '.png'),
  'assets/stages/bairro.png',
];
const urlFor = path => new URL(path, ROOT).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.map(path => new Request(urlFor(path), { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE && key !== ART) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin) return;
  const relative = url.pathname.slice(ROOT.pathname.length);
  if (!url.pathname.startsWith(ROOT.pathname)) return;
  const home = url.pathname === ROOT.pathname || relative === 'index.html';
  // The platformer and development tools share this origin but own their pages.
  if (!home && !CORE.includes(relative) && !PACK.includes(relative)) return;
  event.respondWith((async () => {
    const cache = await caches.open(PACK.includes(relative) ? ART : CACHE), key = urlFor(home ? 'index.html' : relative);
    const cached = await cache.match(key);
    if (cached) return cached;
    const response = await fetch(new Request(key, { cache: 'reload' }));
    if (response.ok) await cache.put(key, response.clone());
    return response;
  })());
});

async function packStatus(cache) {
  for (const path of PACK) if (!await cache.match(urlFor(path))) return false;
  return true;
}

self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  const send = data => port.postMessage(data);
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(ART);
      if (event.data.type === 'STATUS') {
        send({ done: true, offlineReady: await packStatus(cache), version: VERSION });
      } else if (event.data.type === 'SAVE_OFFLINE') {
        let completed = 0;
        for (const path of PACK) {
          const key = urlFor(path);
          if (!await cache.match(key)) {
            const response = await fetch(new Request(key, { cache: 'reload' }));
            if (!response.ok) throw new Error('asset unavailable');
            await cache.put(key, response);
          }
          send({ completed: ++completed, total: PACK.length });
        }
        send({ done: true, offlineReady: true });
      } else if (event.data.type === 'ACTIVATE_UPDATE') {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const own = windows.filter(client => {
          const url = new URL(client.url);
          return url.origin === ROOT.origin && (url.pathname === ROOT.pathname || url.pathname === ROOT.pathname + 'index.html');
        });
        if (!event.data.safe || own.length !== 1 || own[0].id !== event.source.id) {
          send({ error: 'Fecha as outras janelas do jogo e tenta novamente no menu.' });
          return;
        }
        send({ done: true });
        await self.skipWaiting();
      }
    } catch {
      send({ error: 'Não foi possível guardar os ficheiros. Verifica a ligação e o espaço livre e tenta novamente.' });
    }
  })());
});
