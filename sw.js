/* GoldTriEngine app shell. Pages: network first, then cache. Live data (Supabase, YouTube) is never cached. */
const V = 'gte-app-v1';
const SHELL = ['offline.html', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (/\.(ex5|zip|apk)$/i.test(u.pathname)) return;
  const html = r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html');
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || (html ? caches.match('offline.html') : Response.error())))
  );
});
