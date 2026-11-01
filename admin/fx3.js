/* Admin, round three: grouped side menu, live pulse tiles drawn from your own data, filter and sort on every long table.
   Purely additive: if this file does not load, the admin works as before. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. side menu: groups, collapse button ---- */
  var GROUPS = [['Sales', ['orders', 'revenue', 'licenses', 'customers', 'affiliates']], ['Growth', ['visitors', 'funnel', 'marketing', 'blog', 'proof', 'email']], ['Care', ['support', 'health']], ['Tools', ['settings', 'backtest', 'videos', 'audit']]];
  function groups() {
    var nav = $('#tabs'); if (!nav || nav.querySelector('.ng')) return;
    GROUPS.forEach(function (g, gi) {
      var base = (gi + 1) * 100, lab = document.createElement('span'); lab.className = 'ng'; lab.textContent = g[0]; lab.style.order = base; nav.appendChild(lab);
      g[1].forEach(function (k, i) { var b = nav.querySelector('button[data-t="' + k + '"]'); if (b) b.style.order = base + 1 + i; });
    });
    nav.querySelectorAll('button[data-t]').forEach(function (b) { if (!b.style.order) b.style.order = 900; });
  }
  function toggle() {
    var h = $('header'); if (!h || $('#navtog')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'navtog'; b.className = 'ntg'; b.setAttribute('aria-label', 'Collapse or expand the menu'); b.title = 'Menu';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>';
    h.insertBefore(b, h.firstChild);
    try { if (localStorage.getItem('gte_admin_nav') === 'c') document.body.classList.add('nc'); } catch (e) {}
    b.onclick = function () {
      var c = document.body.classList.toggle('nc'); try { localStorage.setItem('gte_admin_nav', c ? 'c' : 'o'); } catch (e) {}
    };
  }

  /* ---- 2. pulse tiles ---- */
  function day(s) { return String(s || '').slice(0, 10); }
  function series(rows, pick, n, endMs) {
    var out = [], idx = {}, i;
    for (i = n - 1; i >= 0; i--) { var k = new Date(endMs - i * 864e5).toISOString().slice(0, 10); idx[k] = out.length; out.push(0); }
    rows.forEach(function (r) { var k = day(r.created_at); if (k in idx) out[idx[k]] += pick(r); });
    return out;
  }
  function path(a) {
    var w = 120, h = 34, mx = Math.max.apply(null, a.concat([1])), pts = a.map(function (v, i) { return [i * w / (a.length - 1), h - 3 - (v / mx) * (h - 8)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return {line: d, area: d + ' L' + w + ' ' + h + ' L0 ' + h + ' Z'};
  }
  function usd(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  function tile(go, k, label, val, sub, a, cls) {
    var p = a && a.some(function (v) { return v > 0; }) ? path(a) : null;
    return '<button type="button" class="pl" data-go="' + go + '" style="--k:' + k + '"><span class="pl-l">' + label + '</span><b class="pl-v" data-v="' + val.n + '" data-f="' + val.f + '">' + val.t + '</b><span class="pl-d ' + (cls || '') + '">' + sub + '</span>' +
      (p ? '<svg class="pl-s" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="' + p.area + '"/><path class="l" pathLength="1" d="' + p.line + '"/></svg>' : '') + '</button>';
  }
  var sig = '';
  function pulse() {
    var hero = $('#hero'); if (!hero) return;
    var D; try { D = data; } catch (e) { return; }
    if (!D || !D.orders) return;
    var box = $('#pulse'); if (!box) { box = document.createElement('div'); box.id = 'pulse'; hero.appendChild(box); }
    var now = Date.now(), O = D.orders || [], L = D.licenses || [], C = D.customers || [];
    var paid = O.filter(function (o) { return o.status === 'paid'; });
    var amt = function (o) { return Number(o.amount_usd || 0); };
    var r30 = series(paid, amt, 30, now), rPrev = series(paid, amt, 60, now).slice(0, 30);
    var s30 = r30.reduce(function (a, b) { return a + b; }, 0), sPrev = rPrev.reduce(function (a, b) { return a + b; }, 0);
    var dl = sPrev > 0 ? Math.round((s30 - sPrev) / sPrev * 100) : null;
    var claimed = O.filter(function (o) { return o.status === 'paid_claimed'; }).length, pend = O.filter(function (o) { return o.status === 'pending'; }).length;
    var act = L.filter(function (l) { return l.status === 'active'; }).length, unused = L.filter(function (l) { return l.status === 'unused'; }).length;
    var nc30 = series(C, function () { return 1; }, 30, now), newC = nc30.reduce(function (a, b) { return a + b; }, 0);
    var html = tile('revenue', 'var(--k1)', 'Money received, 30 days', {n: s30, f: '$', t: usd(s30)}, dl === null ? (paid.length + ' paid orders in total') : (dl >= 0 ? '&#9650; ' : '&#9660; ') + Math.abs(dl) + '% vs the 30 days before', r30, dl === null ? '' : dl >= 0 ? 'up' : 'dn') +
      tile('orders', 'var(--k4)', 'Waiting for you', {n: claimed, f: '', t: String(claimed)}, claimed ? 'customers say they paid: check' : (pend ? pend + ' started, not paid' : 'nothing to check'), series(O, function () { return 1; }, 30, now), claimed ? 'dn' : 'up') +
      tile('licenses', 'var(--k2)', 'Active licenses', {n: act, f: '', t: String(act)}, unused + ' unused key' + (unused === 1 ? '' : 's') + ' in stock', series(L, function () { return 1; }, 30, now)) +
      tile('customers', 'var(--k3)', 'Customers', {n: C.length, f: '', t: String(C.length)}, newC ? '&#9650; ' + newC + ' joined in 30 days' : 'no new sign-ups in 30 days', nc30, newC ? 'up' : '');
    if (html === sig) return;
    var first = !sig; sig = html; box.innerHTML = html;
    if (first && !reduce) box.querySelectorAll('.pl-v').forEach(count);
  }
  function count(el) {
    var to = +el.dataset.v, f = el.dataset.f || ''; if (!isFinite(to) || to < 2) return;
    var t0 = performance.now(), fin = el.textContent;
    setTimeout(function () { el.textContent = fin; }, 1900);
    (function tick(now) { var p = Math.min(1, (now - t0) / 1000), e = 1 - Math.pow(1 - p, 4); el.textContent = f + Math.round(to * e).toLocaleString('en-US'); if (p < 1) requestAnimationFrame(tick); })(t0);
  }

  /* ---- 3. filter and sort for long tables ---- */
  function num(t) { var s = t.trim(); if (!/^[^\d-]{0,2}-?[\d,]+(\.\d+)?\s?%?[^\d]{0,3}$/.test(s)) return NaN; return parseFloat(s.replace(/[^0-9.\-]/g, '')); }
  function tools(root) {
    root.querySelectorAll('.tblw > table.tbl:not([data-tt])').forEach(function (t) {
      t.dataset.tt = '1';
      var rows = Array.prototype.filter.call(t.querySelectorAll('tr'), function (r) { return r.querySelector('td'); });
      if (rows.length < 6 || t.querySelector('td[colspan]')) return;
      var wrap = t.parentNode, bar = document.createElement('div'); bar.className = 'tt';
      bar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" placeholder="Filter this table..." aria-label="Filter this table"><span class="tc">' + rows.length + ' rows</span>';
      wrap.parentNode.insertBefore(bar, wrap);
      var q = bar.querySelector('input'), tc = bar.querySelector('.tc');
      q.oninput = function () {
        var s = q.value.trim().toLowerCase(), n = 0;
        rows.forEach(function (r) { var ok = !s || r.textContent.toLowerCase().indexOf(s) > -1; r.style.display = ok ? '' : 'none'; if (ok) n++; });
        tc.textContent = s ? n + ' of ' + rows.length : rows.length + ' rows';
      };
      t.querySelectorAll('th').forEach(function (th) {
        if (!th.textContent.trim()) return;
        th.classList.add('so'); th.title = 'Click to sort';
        th.onclick = function () {
          var dir = th.classList.contains('asc') ? -1 : 1, ci = th.cellIndex;
          t.querySelectorAll('th').forEach(function (o) { o.classList.remove('asc', 'desc'); });
          th.classList.add(dir === 1 ? 'asc' : 'desc');
          var par = rows[0].parentNode;
          rows.slice().sort(function (a, b) {
            var x = (a.cells[ci] || {textContent: ''}).textContent, y = (b.cells[ci] || {textContent: ''}).textContent, nx = num(x), ny = num(y);
            if (!isNaN(nx) && !isNaN(ny)) return (nx - ny) * dir;
            return x.localeCompare(y, undefined, {numeric: true}) * dir;
          }).forEach(function (r) { par.appendChild(r); });
        };
      });
    });
  }

  function boot() {
    var nav = $('#tabs'), view = $('#view');
    groups(); toggle();
    if (nav) new MutationObserver(function () { groups(); if (window.__fxClock) window.__fxClock(); }).observe(nav, {childList: true});
    var tm; if (view) { new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(function () { pulse(); tools(view); }, 80); }).observe(view, {childList: true, subtree: true}); }
    setTimeout(function () { pulse(); if (view) tools(view); }, 400);
    new MutationObserver(function () { setTimeout(function () { if (window.__fxMark) window.__fxMark(); }, 480); }).observe(document.body, {attributes: true, attributeFilter: ['class']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
