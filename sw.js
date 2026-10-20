/* GoldTriEngine app shell.
   Pages: network first (4 s limit), then the saved copy. Versioned files (?v=...) and images: saved copy first, so the app opens fast.
   Live data (Supabase, YouTube) is never saved. */
const V = 'gte-app-v3';
const SHELL = ['offline.html', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (r, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const font = FONTS.includes(u.hostname);
  if (u.origin !== location.origin && !font) return;
  if (/\.(ex5|zip|apk)$/i.test(u.pathname)) return;
  const html = r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html');
  const asset = font || /\.(css|js|png|jpe?g|webp|svg|gif|woff2?|ico|webmanifest)$/i.test(u.pathname);
  if (asset && !html) {
    const versioned = u.searchParams.has('v') || font;
    e.respondWith(caches.match(r).then(hit => {
      if (hit && versioned) return hit;                                  // versioned file: the saved copy is always right
      const net = fetch(r).then(res => put(r, res)).catch(() => hit);
      return hit || net;                                                 // other files: saved copy now, refreshed in the background
    }));
    return;
  }
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(r).then(m => m || (html ? caches.match('offline.html') : Response.error()));
    const timer = setTimeout(() => { if (!done) caches.match(r).then(m => { if (m && !done) { done = true; resolve(m); } }); }, 4000);
    fetch(r).then(res => { clearTimeout(timer); if (!done) { done = true; resolve(put(r, res)); } else put(r, res); })
      .catch(() => { clearTimeout(timer); if (!done) { done = true; fallback().then(resolve); } });
  }));
});

/* Phone alerts */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'GoldTriEngine', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'GoldTriEngine', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.kind || 'gte', renotify: true, data: { url: d.url || 'my-account.html' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || 'my-account.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
