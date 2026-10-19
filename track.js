/* Anonymous visit counter. No cookies, no IP address and no device id are stored: the server counts a visitor once per day
   through a one-way daily hash. Skipped for "Do Not Track", for the owner's browser (admin sets gte_notrack) and on localhost. */
(function () {
  try { if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || localStorage.getItem('gte_notrack')) return; } catch (e) {}
  if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
  var U = 'https://ekljeyquxvlfbeadgszx.supabase.co', K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  function rpc(fn, body, keep) {
    return fetch(U + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: !!keep })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  var src = null, SK = 'gte_visit_src';
  try { src = JSON.parse(sessionStorage.getItem(SK) || 'null'); } catch (e) {}
  if (!src) {
    var q = new URLSearchParams(location.search), ref = '';
    try { if (document.referrer) { var h = new URL(document.referrer).hostname; if (h && h !== location.hostname) ref = h; } } catch (e) {}
    src = { ref: ref, s: q.get('utm_source') || q.get('src') || '', m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '', l: location.pathname.replace(/^\/+/, '') || 'index.html' };
    try { sessionStorage.setItem(SK, JSON.stringify(src)); } catch (e) {}
  }
  var standalone = false; try { standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}
  var id = null, shown = 0, since = document.hidden ? 0 : Date.now(), last = 0;
  rpc('track_visit', { p_path: location.pathname, p_ref: src.ref, p_src: src.s, p_medium: src.m, p_campaign: src.c, p_lang: navigator.language, p_tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || null, p_w: window.innerWidth, p_app: standalone }).then(function (v) { id = v; });
  function leave() {
    if (since) { shown += Date.now() - since; since = 0; }
    var s = Math.round(shown / 1000); if (!id || s < 1 || s <= last) return; last = s;
    rpc('track_leave', { p_id: id, p_secs: s }, true);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) leave(); else since = Date.now(); });
  window.addEventListener('pagehide', leave);
})();
