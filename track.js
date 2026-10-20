/* Anonymous visit counter. No cookies, no IP address and no device id are stored: the server counts a visitor once per day
   through a one-way daily hash. Skipped for "Do Not Track", for the owner's browser (admin sets gte_notrack) and on localhost. */
window.gteEvent = window.gteEvent || function () {};          // other scripts can always call it; it only does something when counting is allowed
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

  /* ---- actions: clicks to other channels, installs, speed and errors (no personal text) ---- */
  function ev(name, detail, num, keep) {
    return rpc('track_event', { p_name: name, p_detail: detail == null ? null : String(detail).slice(0, 140), p_path: location.pathname, p_app: standalone, p_num: num == null ? null : num }, keep);
  }
  window.gteEvent = function (name, detail, num) { ev(name, detail, num, true); };
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-ev],a[href]') : null; if (!el) return;
    if (el.hasAttribute('data-ev')) { var p = el.getAttribute('data-ev').split('|'); ev(p[0], p[1] || null, null, true); return; }
    var u; try { u = new URL(el.getAttribute('href'), location.href); } catch (x) { return; }
    var path = u.pathname, host = u.hostname.replace(/^www\./, '');
    if (/\.apk$/i.test(path)) return ev('apk_download', path.split('/').pop(), null, true);
    var plan = el.closest('[id^="plan-"]'); if (plan && host === location.hostname.replace(/^www\./, '')) return ev('plan_click', plan.id.replace('plan-', ''), null, true);
    if (host === location.hostname.replace(/^www\./, '')) return;
    if (/youtube\.com|youtu\.be/.test(host)) return ev('out:youtube', /live/.test(path) ? 'live' : 'channel', null, true);
    if (host === 't.me' || /telegram/.test(host)) return ev('out:telegram', /support/i.test(path) ? 'support' : 'channel', null, true);
    if (/myfxbook/.test(host)) return ev('out:myfxbook', 'profile', null, true);
    if (/tiktok/.test(host)) return ev('out:tiktok', 'profile', null, true);
    if (/fusionmarkets/.test(host)) return ev('out:broker', 'fusion', null, true);
    if (host === 'ic.com' || /icmarkets/.test(host)) return ev('out:broker', 'ic', null, true);
    ev('out:other', host, null, true);
  }, true);
  window.addEventListener('appinstalled', function () { ev('app_installed', null, null, true); });
  var lcp = 0, cls = 0, inp = 0, sentV = false, VK = 'gte_vit';
  try { new PerformanceObserver(function (l) { var x = l.getEntries(); if (x.length) lcp = x[x.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (x) {}
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (x) { if (!x.hadRecentInput) cls += x.value; }); }).observe({ type: 'layout-shift', buffered: true }); } catch (x) {}
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (x) { if (x.interactionId && x.duration > inp) inp = x.duration; }); }).observe({ type: 'event', durationThreshold: 40, buffered: true }); } catch (x) {}
  function vitals() {
    if (sentV) return; sentV = true;
    try { if (sessionStorage.getItem(VK)) return; sessionStorage.setItem(VK, '1'); } catch (x) {}
    var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation') || [])[0];
    if (lcp) ev('lcp', null, Math.round(lcp), true);
    if (nav && nav.loadEventEnd) ev('load', null, Math.round(nav.loadEventEnd), true);
    ev('cls', null, Math.round(cls * 1000), true);
    if (inp) ev('inp', null, Math.round(inp), true);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) vitals(); });
  window.addEventListener('pagehide', vitals);
  var errN = 0;
  window.addEventListener('error', function (e) { if (errN++ > 2) return; ev('js_error', (e.message || 'error') + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0), null, true); });
  window.addEventListener('unhandledrejection', function (e) { if (errN++ > 2) return; ev('js_error', 'promise: ' + String((e.reason && e.reason.message) || e.reason || '').slice(0, 100), null, true); });
})();
