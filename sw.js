// Crimbo Panic offline support (a service worker).
// Keeps a copy of the game on the phone so it opens and plays with no signal.
// Every file is served from the saved copy straight away, and quietly re-downloaded in
// the background so the next launch picks up any updates.
// Bump VERSION when files are added, removed or renamed below.
const VERSION = 'crimbo-panic-v1';
const FILES = [
  './',
  'index.html',
  'intro.js',
  'manifest.json',
  'audio/music.mp3',
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
  e.respondWith(caches.open(VERSION).then(async cache => {
    const saved = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req)
      .then(res => { if (res.ok && res.status === 200) cache.put(req, res.clone()); return res; })
      .catch(() => saved);
    return saved || fresh;
  }));
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
      'Content-Type': saved.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
