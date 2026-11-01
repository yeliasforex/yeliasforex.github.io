/* Partner links. A link like goldtriengine.com/?ref=RAHIM&c=youtube remembers the partner on this device for 90 days (a random id and the code, nothing personal),
   counts the click, and once the visitor signs in, tells the database who sent them. The partner's discount is then applied automatically at checkout. */
(function () {
  var U = 'https://ekljeyquxvlfbeadgszx.supabase.co', K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  var KEY = 'gte_ref', DAYS = 90;
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.code && Date.now() - v.t < DAYS * 864e5) return v; } catch (e) {} return null; }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function rpc(fn, args, token) {
    return fetch(U + '/rest/v1/rpc/' + fn, { method: 'POST', keepalive: true, headers: { apikey: K, Authorization: 'Bearer ' + (token || K), 'Content-Type': 'application/json' }, body: JSON.stringify(args) }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function token() {
    try { var k = Object.keys(localStorage).find(function (x) { return /^sb-.*-auth-token$/.test(x); }); if (!k) return null;
      var t = (JSON.parse(localStorage.getItem(k)) || {}).access_token; if (!t) return null;
      var ex = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp; return ex * 1000 > Date.now() + 30000 ? t : null; } catch (e) { return null; }
  }
  function device() { var w = window.innerWidth || 1024; return /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : (/iPad|Tablet/i.test(navigator.userAgent) || (w >= 600 && w < 1000 && 'ontouchstart' in window)) ? 'tablet' : 'desktop'; }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) { return null; } }

  var q = new URLSearchParams(location.search);
  var code = (q.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20), camp = (q.get('c') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  var cur = load();
  if (code.length >= 3 && (!cur || cur.code !== code || (camp && cur.c !== camp))) {
    cur = { code: code, c: camp || null, vid: (cur && cur.vid) || (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 24), t: Date.now(), done: false };
    save(cur);
    rpc('partner_click', { p_code: code, p_campaign: camp || null, p_vid: cur.vid, p_tz: tz(), p_device: device() });
  }
  window.gtePartnerRef = function () { return load(); };


  // pricing page: show the partner's code in the discount box so the customer can see it is applied
  function fillBox() {
    var v = load(), b = document.getElementById('coupon'); if (!v || !b || b.value) return;
    b.value = v.code; var f = b.parentNode && b.parentNode.querySelector('.fine'); if (f) f.textContent = 'Partner code ' + v.code + ' is applied. Your discount shows on your order.';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillBox); else fillBox();

  // after sign-in: attach once per code
  function attach() {
    var v = load(), t = token(); if (!v || v.done || !t) return;
    v.done = true; save(v);                                         // set first so two tabs do not both send it
    rpc('partner_attach', { p_code: v.code, p_campaign: v.c, p_vid: v.vid }, t).then(function (r) { if (r === null) { v.done = false; save(v); } });
  }
  attach(); setTimeout(attach, 2500); window.addEventListener('focus', attach);
  try { window.addEventListener('storage', function (e) { if (/^sb-.*-auth-token$/.test(e.key || '')) attach(); }); } catch (e) {}
})();
