// Xmas Panic offline support (a service worker).
// Keeps a copy of the game on the phone so it opens and plays with no signal.
// With signal, the game files are always fetched fresh (so updates show up straight
// away) and the saved copy is refreshed; with no signal, the saved copy is used.
// The music is big and never changes, so it always comes from the saved copy.
// Bump VERSION when files are added, removed or renamed below.
const VERSION = 'crimbo-panic-v3';
const FILES = [
  './',
  'index.html',
  'intro.js',
  'manifest.json',
  'audio/music.m4a',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // remove copies saved by older versions
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Phones ask for music in chunks ("range" requests); answer those from the saved copy
  if (req.headers.get('range')) { e.respondWith(rangeResponse(req)); return; }
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const saved = await cache.match(req, { ignoreSearch: true });
    if (saved && /\.(mp3|m4a)$/.test(new URL(req.url).pathname)) return saved;
    try {
      // fresh copy, skipping the browser's own cache; give up after 4 s on a bad signal
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(req.url, { cache: 'no-cache', signal: ctl.signal });
      clearTimeout(timer);
      if (res.ok && res.status === 200) cache.put(req, res.clone());
      return res;
    } catch {
      return saved || Response.error();
    }
  })());
});

async function rangeResponse(req) {
  const cache = await caches.open(VERSION);
  const saved = await cache.match(req.url, { ignoreSearch: true });
  if (!saved) {
    try { return await fetch(req); } catch { return new Response('', { status: 504 }); }
  }
  const buf = await saved.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = m && m[1] ? Number(m[1]) : 0;
  let end = Math.min(m && m[2] ? Number(m[2]) : buf.byteLength - 1, buf.byteLength - 1);
  if (m && !m[1] && m[2]) { start = Math.max(0, buf.byteLength - Number(m[2])); end = buf.byteLength - 1; } // "last N bytes"
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': saved.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
