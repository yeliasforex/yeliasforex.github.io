/* Partner dashboard polish: journey and achievements, earnings planner, tab icons and marker, swipe between tabs, living background,
   light that follows the pointer, celebration. Everything is computed from the partner's own numbers; nothing is invented.
   If this file does not load, the dashboard works as before. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var money = function (n, d) { n = Number(n || 0); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', {maximumFractionDigits: d == null ? 0 : d}); };
  function cv(n, fb) { var r = $('.pd'); var v = r ? getComputedStyle(r).getPropertyValue(n).trim() : ''; return v || fb; }
  function S() { return window.GTE_PD || null; }

  var ICON = {
    overview: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
    campaigns: 'M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8a5 5 0 010 8M19 5a9 9 0 010 14',
    customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    reports: 'M12 20V10M18 20V4M6 20v-4',
    payouts: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    kit: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };
  function ic(k) { return '<svg class="pdx-i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICON[k] || ICON.overview) + '"/></svg>'; }

  /* ---------- 1. tabs: icons, sliding marker, swipe ---------- */
  var last = null;
  function tabs() {
    var bar = $('#pd-bar'); if (!bar) return;
    $$('button[data-t]', bar).forEach(function (b) { if (!b.querySelector('.pdx-i')) b.insertAdjacentHTML('afterbegin', ic(b.dataset.t)); });
    var on = $('button.on', bar); if (!on) return;
    var side = getComputedStyle(bar).flexDirection === 'column';
    var m = $('#pdx-mk', bar); if (!m) { m = document.createElement('i'); m.id = 'pdx-mk'; bar.appendChild(m); }
    var pos = side ? {left: '2px', width: '3px', top: (on.offsetTop + 9) + 'px', height: Math.max(10, on.offsetHeight - 18) + 'px', bottom: 'auto'} : {left: (on.offsetLeft + 12) + 'px', width: Math.max(10, on.offsetWidth - 24) + 'px', top: 'auto', height: '2px', bottom: '3px'};
    function put() { for (var k in pos) m.style[k] = pos[k]; }
    if (last === null) { m.style.transition = 'none'; put(); void m.offsetWidth; m.style.transition = ''; } else requestAnimationFrame(put);
    last = pos;
    if (!side && bar.scrollWidth > bar.clientWidth) bar.scrollTo({left: Math.max(0, on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2), behavior: reduce ? 'auto' : 'smooth'});
  }
  window.__pdMark = tabs;
  function swipe() {
    var app = $('#pd-app'); if (!app || app.__sw) return; app.__sw = true;
    var x0 = 0, y0 = 0, t0 = 0, ok = false;
    app.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
      ok = !(e.target.closest && e.target.closest('input,textarea,select,.pd-sheet,.pd-bar,.pd-seg,[data-noswipe],.pdx-plan'));
    }, {passive: true});
    app.addEventListener('touchend', function (e) {
      if (!ok) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || Date.now() - t0 > 600) return;
      var bs = $$('#pd-bar button[data-t]'), i = bs.findIndex(function (b) { return b.classList.contains('on'); }), n = bs[i + (dx < 0 ? 1 : -1)];
      if (n) n.click();
    }, {passive: true});
  }

  /* ---------- 2. journey, achievements and planner (rebuilt when the overview is redrawn) ---------- */
  var MS = [
    {k: 'first', t: 'First sale', d: 'Your first paying customer', f: function (d) { return d.sales; }, g: 1},
    {k: 'five', t: '5 sales', d: 'Five paying customers', f: function (d) { return d.sales; }, g: 5},
    {k: 'c100', t: '$100 earned', d: 'Total commission so far', f: function (d) { return d.life; }, g: 100},
    {k: 'c500', t: '$500 earned', d: 'Total commission so far', f: function (d) { return d.life; }, g: 500},
    {k: 'pay', t: 'First payout', d: 'Money sent to your wallet', f: function (d) { return d.paidOut; }, g: 0.01}
  ];
  function dat() {
    var s = S(); if (!s || !s.me || !s.stats) return null;
    var me = s.me, st = s.stats, B = st.balances || {}, cur = st.cur || {};
    return {me: me, st: st, B: B, cur: cur, sales: Number(me.paidReferrals || 0), goldAt: Number(me.goldAt || 10), life: Number(B.lifetime || 0), paidOut: Number(B.paidOut || 0), ready: Number(B.ready || 0), minp: Number(me.minPayout || 50), days: s.days || 30};
  }
  function ring(p, c) { var C = 2 * Math.PI * 15; return '<svg viewBox="0 0 36 36" class="pdx-rg"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--track)" stroke-width="3"/><circle cx="18" cy="18" r="15" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - Math.min(1, p))).toFixed(1) + '" transform="rotate(-90 18 18)"/></svg>'; }
  function journey(d) {
    var h = new Date().getHours(), g = h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    var gold = d.sales >= d.goldAt, lvlP = Math.min(1, d.sales / d.goldAt);
    var items = MS.map(function (m) { var goal = typeof m.g === 'function' ? m.g(d) : m.g, have = m.f(d), got = have >= goal; return {m: m, got: got, p: Math.min(1, have / goal), have: have, goal: goal}; });
    var next = items.filter(function (x) { return !x.got; })[0];
    var seen = {}; try { seen = JSON.parse(localStorage.getItem('gte_pd_ms') || '{}'); } catch (e) {}
    var fresh = items.filter(function (x) { return x.got && !seen[x.m.k]; });
    var nt = !next ? 'Every achievement unlocked. You are at the top.' : next.m.k === 'first' || next.m.k === 'five' ? (Math.ceil(next.goal - next.have) + ' more paid sale' + (Math.ceil(next.goal - next.have) === 1 ? '' : 's') + ' to ' + next.m.t.toLowerCase()) : next.m.k === 'pay' ? 'Request your first payout when you reach ' + money(d.minp) : (money(next.goal - next.have) + ' more commission to reach ' + next.m.t);
    var html = '<div class="pd-card pdx-j pd-fadeup in" id="pdx-j"><div class="pdx-jh"><div><div class="pdx-k">YOUR JOURNEY</div><div class="pdx-t">' + esc(d.me.name || 'Partner') + '</div></div></div>' +
      '<div class="pdx-next"><i></i><span>' + esc(nt) + '</span></div>' +
      '<div class="pdx-bd">' + items.map(function (x) { return '<button type="button" class="pdx-b' + (x.got ? ' got' : '') + '" data-k="' + x.m.k + '" title="' + esc(x.m.d) + '">' + ring(x.got ? 1 : x.p, x.got ? '#F5C165' : cv('--cyan', '#3CD2FF')) + '<span class="pdx-bi">' + (x.got ? '&#10003;' : Math.round(x.p * 100) + '%') + '</span><em>' + esc(x.m.t) + '</em></button>'; }).join('') + '</div></div>';
    return {html: html, fresh: fresh, seen: seen};
  }
  function planner(d) {
    var clicks = Number(d.cur.clicks || 0), paid = Number(d.cur.paid || 0), earned = Number(d.cur.earned || 0), perM = clicks / d.days * 30;
    if (paid < 1 || clicks < 5) return '<div class="pd-card pdx-plan pd-fadeup in" id="pdx-p"><div class="pd-row"><h3>Earnings planner</h3><span class="pd-pill c">personal</span></div><div class="pd-help">After your first sale this tool uses your real click-to-sale rate and your real earning per sale to show what more traffic would bring. Nothing is guessed.</div></div>';
    var conv = paid / clicks, avg = earned / paid, max = Math.max(500, Math.ceil(perM * 4 / 100) * 100), start = Math.max(0, Math.round(perM / 10) * 10);
    return '<div class="pd-card pdx-plan pd-fadeup in" id="pdx-p" data-conv="' + conv + '" data-avg="' + avg + '"><div class="pd-row"><h3>Earnings planner</h3><span class="pd-pill c">uses your real numbers</span></div>' +
      '<div class="pd-help">Slide to see what a month could bring. It uses your own click-to-sale rate (' + (conv * 100).toFixed(1) + '%) and your own earning per sale (' + money(avg, 2) + '). It is an estimate, not a promise.</div>' +
      '<div class="pdx-pr"><label for="pdx-sl">Clicks per month</label><b id="pdx-cv">' + start.toLocaleString('en-US') + '</b></div><input id="pdx-sl" type="range" min="0" max="' + max + '" step="10" value="' + start + '" data-noswipe>' +
      '<div class="pdx-out"><div><small>Paid sales</small><b id="pdx-s">0</b></div><div><small>You earn</small><b id="pdx-e" class="pdx-m">$0</b></div><div><small>Per year</small><b id="pdx-y">$0</b></div></div></div>';
  }
  function plan() {
    var p = $('#pdx-p'); if (!p || !p.dataset.conv) return; var conv = +p.dataset.conv, avg = +p.dataset.avg, sl = $('#pdx-sl', p);
    function upd() { var c = +sl.value, s = c * conv, e = s * avg; $('#pdx-cv', p).textContent = c.toLocaleString('en-US'); $('#pdx-s', p).textContent = (Math.round(s * 10) / 10).toLocaleString('en-US'); $('#pdx-e', p).textContent = money(e); $('#pdx-y', p).textContent = money(e * 12); var pc = c / sl.max * 100; sl.style.setProperty('--p', pc + '%'); }
    sl.oninput = upd; upd();
  }
  function ensure() {
    var ov = $('#pd-overview'), d = dat(); if (!ov || !d || !ov.children.length) return;
    if (!$('#pdx-j', ov)) {
      var j = journey(d); ov.insertAdjacentHTML('afterbegin', j.html);
      var firstView = false; try { firstView = localStorage.getItem('gte_pd_ms') === null; } catch (e) {}
      if (j.fresh.length) {
        j.fresh.forEach(function (x) { j.seen[x.m.k] = 1; }); try { localStorage.setItem('gte_pd_ms', JSON.stringify(j.seen)); } catch (e) {}
        if (!firstView) setTimeout(function () { confetti(innerWidth / 2, 160); toast('Achievement unlocked: ' + j.fresh[0].m.t); }, 700);
      } else if (firstView) { try { localStorage.setItem('gte_pd_ms', '{}'); } catch (e) {} }
      $$('.pdx-b', ov).forEach(function (b) { b.onclick = function () { var x = MS.filter(function (m) { return m.k === b.dataset.k; })[0]; toast(x.t + ': ' + x.d + (b.classList.contains('got') ? ' (unlocked)' : ' (' + $('.pdx-bi', b).textContent + ')')); }; });
    }
    if (!$('#pdx-p', ov)) { ov.insertAdjacentHTML('beforeend', planner(d)); plan(); }
  }
  function toast(t) {
    var d = document.createElement('div'); d.className = 'pd-toast on'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d);
    setTimeout(function () { d.classList.remove('on'); setTimeout(function () { d.remove(); }, 400); }, 2600);
  }

  /* ---------- 3. balance chip that follows you down the page ---------- */
  function chip() {
    var d = dat(); if (!d || $('#pdx-chip')) return;
    var c = document.createElement('button'); c.type = 'button'; c.id = 'pdx-chip'; c.setAttribute('aria-label', 'Open payouts');
    c.innerHTML = '<span class="pdx-cd"></span><span><small>Ready to pay out</small><b id="pdx-cb">' + money(d.ready) + '</b></span><em>Payouts</em>';
    c.onclick = function () { var b = $('#pd-bar button[data-t="payouts"]'); if (b) b.click(); window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'}); };
    document.body.appendChild(c);
    var tk; addEventListener('scroll', function () { if (tk) return; tk = requestAnimationFrame(function () { tk = 0; var dd = dat(); if (dd) $('#pdx-cb').textContent = money(dd.ready); c.classList.toggle('on', scrollY > 520 && !$('.pd-sheet.on')); }); }, {passive: true});
  }

  /* ---------- 4. living background, pointer light, tilt ---------- */
  function net() {
    var host = $('.pd-bgfx'); if (!host || reduce || $('#pdx-net')) return;
    var c = document.createElement('canvas'); c.id = 'pdx-net'; host.appendChild(c);
    var g = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1), P = [], mx = -999, my = -999, A = '#3CD2FF', B = '#F5C165', run = true;
    function size() { var r = host.getBoundingClientRect(); W = Math.max(300, r.width); H = Math.max(300, Math.min(r.height, 1600)); c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0); var n = Math.round(Math.min(60, Math.max(22, W * Math.min(H, 900) / 26000))); while (P.length < n) P.push({x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .26, vy: (Math.random() - .5) * .26, r: 1 + Math.random() * 1.5, h: Math.random() < .35}); P.length = n; }
    function rgba(h, a) { var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a + ')' : h; }
    function colors() { A = cv('--cyan', '#3CD2FF'); B = cv('--amber', '#F5C165'); }
    function light() { return document.documentElement.getAttribute('data-theme') === 'light'; }
    function frame() {
      if (!run) return; g.clearRect(0, 0, W, H); var k = light() ? .45 : .8, L = 120;
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.x += p.vx; p.y += p.vy; if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy; if (d2 < 14000) { var f = (1 - d2 / 14000); p.x += dx * f * .012; p.y += dy * f * .012; }
        for (var j = i + 1; j < P.length; j++) { var q = P[j], ax = p.x - q.x, ay = p.y - q.y, dd = ax * ax + ay * ay; if (dd < L * L) { g.strokeStyle = rgba(p.h ? B : A, (1 - Math.sqrt(dd) / L) * .26 * k); g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } }
        g.fillStyle = rgba(p.h ? B : A, .7 * k); g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
      }
      requestAnimationFrame(frame);
    }
    size(); colors(); frame(); addEventListener('resize', size);
    addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, {passive: true});
    document.addEventListener('visibilitychange', function () { var was = run; run = !document.hidden; if (run && !was) frame(); });
    new MutationObserver(colors).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  }
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.pd-card'); if (!el) return;
    var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
    if (fine && !reduce && el.classList.contains('pd-kpi')) { el.style.setProperty('--ry', ((x / r.width - .5) * 7).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((.5 - y / r.height) * 7).toFixed(2) + 'deg'); }
  }, {passive: true});
  document.addEventListener('pointerout', function (e) { var el = e.target.closest && e.target.closest('.pd-kpi'); if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); } }, {passive: true});

  /* ---------- 5. celebration ---------- */
  function confetti(ox, oy) {
    if (reduce) return;
    var c = document.createElement('canvas'); c.id = 'pdx-conf'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var g = c.getContext('2d'), cols = ['#3CD2FF', '#F5C165', '#FFE9A8', '#42C496', '#A99BFF', '#ffffff'], P = [];
    for (var i = 0; i < 100; i++) { var a = -Math.PI / 2 + (Math.random() - .5) * 2, v = 6 + Math.random() * 8; P.push({x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length]}); }
    var t0 = performance.now();
    (function step(now) {
      g.clearRect(0, 0, c.width, c.height); var alive = false;
      P.forEach(function (p) { p.vy += .3; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr; var l = Math.max(0, 1 - (now - t0) / 2200); if (l > 0 && p.y < c.height + 20) { alive = true; g.save(); g.globalAlpha = l; g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); } });
      if (alive && now - t0 < 2600) requestAnimationFrame(step); else c.remove();
    })(t0);
    setTimeout(function () { c.remove(); }, 3200);
  }
  new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList && n.classList.contains('pd-toast') && /^Payout of|^Discount saved|^Link created/i.test(n.textContent || '') && !/Achievement/.test(n.textContent)) confetti(innerWidth / 2, innerHeight - 60); }); }); }).observe(document.body, {childList: true});

  /* ---------- wire up ---------- */
  var booted = false;
  function boot() {
    var app = $('#pd-app'); if (!app || app.hidden || !S() || !S().stats) return;
    if (!booted) { booted = true; net(); swipe(); chip(); var bar = $('#pd-bar'); if (bar) new MutationObserver(function () { tabs(); }).observe(bar, {attributes: true, subtree: true, attributeFilter: ['class']}); addEventListener('resize', tabs); }
    tabs(); ensure();
  }
  function start() {
    var app = $('#pd-app'); if (!app) return;
    var tm; new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(boot, 60); }).observe(document.querySelector('.pd'), {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden']});
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
