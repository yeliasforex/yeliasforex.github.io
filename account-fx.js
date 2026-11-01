/* My account polish: grouped side menu, command-centre header, quick search (Ctrl/Cmd+K), get-started checklist for new customers,
   filter / sort / CSV for long tables, pointer light, living background, equity chip, day/night ripple.
   Purely visual and additive: if this file does not load, My account works as before. Nothing here changes any data. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var usd = function (n) { n = Number(n || 0); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', {maximumFractionDigits: 2}); };
  function M() { return window.GTE_MA || null; }
  function setT(el, t) { if (el && el.textContent !== t) el.textContent = t; }

  var ICON = {
    overview: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
    results: 'M3 17l5-6 4 3 8-9',
    trades: 'M4 6h16M4 12h16M4 18h10',
    billing: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    dl: 'M12 3v12M7 11l5 5 5-5M5 21h14', app: 'M7 2.5h10a2.5 2.5 0 012.5 2.5v14a2.5 2.5 0 01-2.5 2.5H7A2.5 2.5 0 014.5 19V5A2.5 2.5 0 017 2.5zM11 18.5h2',
    bt: 'M3 17l5-6 4 3 8-9', plans: 'M3 6h18v12H3zM3 10h18', help: 'M21 4L3 11l5 2 2 6 3-4 5 4z', gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0', key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4', moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z'
  };
  function ic(k) { return '<svg class="maz-i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICON[k] || ICON.overview) + '"/></svg>'; }
  var DESC = {overview: 'Live status, equity and anything that needs you', results: 'Charts, calendar and statistics of every closed trade', trades: 'Every trade the EA made, newest first', billing: 'Your license keys, orders and invoices'};
  var SHORT = [['download.html', 'Download EA', 'dl'], ['apps.html', 'Get the app', 'app'], ['free-backtest.html', 'Free backtest', 'bt'], ['pricing.html', 'Plans', 'plans'], ['https://t.me/GoldTriEngine_Support', 'Support', 'help']];
  function tabKey() { var on = $('#subnav a.on'); return on ? on.dataset.tab : 'overview'; }
  function tabName() { var on = $('#subnav a.on'); return on ? on.textContent.replace(/\d+$/, '').trim() : 'Overview'; }

  /* ---------- side menu: icons, groups, shortcuts, collapse ---------- */
  function menu() {
    var nav = $('#subnav'); if (!nav) return;
    $$('a[data-tab]', nav).forEach(function (a) { if (!a.querySelector('.maz-i')) a.insertAdjacentHTML('afterbegin', ic(a.dataset.tab)); });
    if (nav.querySelector('.mzg')) return;
    var mk = function (t, ord) { var s = document.createElement('span'); s.className = 'mzg'; s.textContent = t; s.style.order = ord; nav.appendChild(s); };
    mk('Account', 0); $$('a[data-tab]', nav).forEach(function (a, i) { a.style.order = 1 + i; });
    mk('Shortcuts', 20);
    SHORT.forEach(function (s, i) { var a = document.createElement('a'); a.className = 'mzs'; a.href = s[0]; if (/^https?:/.test(s[0])) a.rel = 'noopener'; a.style.order = 21 + i; a.innerHTML = ic(s[2]) + '<span>' + s[1] + '</span>'; nav.appendChild(a); });
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'mzt'; bt.style.order = 40; bt.setAttribute('aria-label', 'Collapse or expand the menu'); bt.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg><span>Collapse</span>';
    bt.onclick = function () { var c = document.body.classList.toggle('mznc'); try { localStorage.setItem('gte_ma_nav', c ? 'c' : 'o'); } catch (e) {} };
    nav.appendChild(bt);
  }
  try { if (localStorage.getItem('gte_ma_nav') === 'c') document.documentElement.classList.add('mznc-pre'); } catch (e) {}

  /* ---------- command header ---------- */
  function header() {
    var A = $('#acct'); if (!A || !A.children.length) return;
    var h = $('#macc'); if (!h) {
      h = document.createElement('div'); h.id = 'macc';
      h.innerHTML = '<div class="mc-l"><div class="mc-k"><i></i><span id="mck"></span></div><div class="mc-t" id="mct"></div><div class="mc-s" id="mcs"></div></div><div class="mc-r"><button type="button" id="mcq"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><span>Jump to...</span><kbd>Ctrl K</kbd></button><div class="mc-c" id="mcc"></div></div>';
      A.insertBefore(h, A.firstChild); $('#mcq').onclick = openPalette;
    } else if (h !== A.firstChild) A.insertBefore(h, A.firstChild);
    var d = new Date(), hr = d.getHours(), g = hr < 5 ? 'Working late' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening', nm = (($('#manm') || {}).textContent || '').trim().split(/\s+/)[0];
    setT($('#mck'), (g + (nm && nm !== '·' ? ', ' + nm : '') + ' · ' + d.toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})).toUpperCase());
    setT($('#mct'), tabName()); setT($('#mcs'), DESC[tabKey()] || '');
    setT($('#mcc'), d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'}));
  }

  /* ---------- get-started checklist: only until the account is fully connected ---------- */
  function checklist() {
    var m = M(), A = $('#acct'); if (!m || !A || !m.lic || $('#mz-gs')) return; if (m.admin) return;
    var l = m.lic, st = m.st || {}, steps = [
      {t: 'Get the EA file', d: 'Download it once and put it in MT5.', done: !!(l.bound_account || st.ea_version), a: ['Download', 'download.html']},
      {t: 'Paste your license key', d: 'Open the EA settings in MT5 and paste your key.', done: !!l.bound_account, a: ['Copy my key', '', 'key']},
      {t: 'EA is online', d: 'Keep MT5 open. The EA reports here every minute.', done: !!st.online, a: ['Setup guide', 'guide.html']},
      {t: 'First trade closed', d: 'Trades appear here by themselves once the EA closes one.', done: (m.trades || []).length > 0, a: ['How it works', 'faq.html']}
    ];
    var n = steps.filter(function (s) { return s.done; }).length; if (n === steps.length || l.status !== 'active') return;
    var next = steps.findIndex(function (s) { return !s.done; });
    var c = document.createElement('div'); c.id = 'mz-gs'; c.className = 'panel mz-gs';
    c.innerHTML = '<div class="mz-gh"><div><h2>Get started</h2><p class="sub" style="margin:0">' + n + ' of ' + steps.length + ' done. The last steps happen on your own computer.</p></div><div class="mz-pr"><i style="width:' + (n / steps.length * 100) + '%"></i></div></div><div class="mz-st">' + steps.map(function (s, i) {
      return '<div class="mz-s' + (s.done ? ' done' : i === next ? ' now' : '') + '"><i>' + (s.done ? '&#10003;' : i + 1) + '</i><div><b>' + esc(s.t) + '</b><small>' + esc(s.d) + '</small></div>' + (s.done ? '' : (s.a[2] === 'key' ? '<button type="button" class="btn sm' + (i === next ? ' mint' : '') + '" data-mzkey>' + s.a[0] + '</button>' : '<a class="btn sm' + (i === next ? ' mint' : '') + '" href="' + s.a[1] + '">' + s.a[0] + '</a>')) + '</div>'; }).join('') + '</div>';
    var h = $('#macc'); (h || A.firstChild).insertAdjacentElement(h ? 'afterend' : 'beforebegin', c);
    var kb = $('[data-mzkey]', c); if (kb) kb.onclick = function () { copyKey(); };
  }
  function copyKey() { var m = M(); if (!m || !m.lic) return; try { navigator.clipboard.writeText(m.lic.key).then(function () { toast('License key copied'); }, function () { toast('Could not copy. Select it and copy by hand.'); }); } catch (e) { toast('Could not copy'); } }
  function toast(t) { var d = document.createElement('div'); d.className = 'msg'; d.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:9000;min-width:220px;text-align:center'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400); }

  /* ---------- quick search ---------- */
  var pal;
  function actions() {
    var out = [];
    $$('#subnav a[data-tab]').forEach(function (a) { out.push({k: a.dataset.tab, name: a.textContent.replace(/\d+$/, '').trim(), hint: 'Open section', run: function () { a.click(); window.scrollTo({top: 0}); }}); });
    var sel = $('#licSel'); if (sel) $$('option', sel).forEach(function (o) { if (!o.selected) out.push({k: 'billing', name: 'Switch to ' + o.textContent.trim(), hint: 'License', run: function () { sel.value = o.value; sel.dispatchEvent(new Event('change')); }}); });
    if (M() && M().lic) out.push({k: 'key', name: 'Copy my license key', hint: 'Action', run: copyKey});
    SHORT.forEach(function (s) { out.push({k: s[2], name: s[1], hint: 'Open', run: function () { if (/^https?:/.test(s[0])) window.open(s[0], '_blank', 'noopener'); else location.href = s[0]; }}); });
    [['#mabell', 'Notifications', 'bell'], ['#mager', 'Settings', 'gear']].forEach(function (p) { var b = $(p[0]); if (b && !b.hidden) out.push({k: p[2], name: p[1], hint: 'Open', run: function () { b.click(); }}); });
    var tb = $('.theme-btn'); if (tb) out.push({k: 'moon', name: 'Switch day / night', hint: 'Appearance', run: function () { tb.click(); }});
    return out;
  }
  function closePalette() { if (!pal) return; var p = pal; pal = null; p.classList.remove('in'); setTimeout(function () { p.remove(); }, 180); }
  function openPalette() {
    if (pal) return closePalette();
    var list = actions(), sel = 0, shown = list; pal = document.createElement('div'); pal.id = 'mz-pal';
    pal.innerHTML = '<div class="mz-pb" role="dialog" aria-label="Quick search"><div class="mz-pi"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="mz-pq" placeholder="Jump to a section or do something..." autocomplete="off"><kbd>Esc</kbd></div><div class="mz-pl" id="mz-pl"></div></div>';
    document.body.appendChild(pal); var q = $('#mz-pq', pal), ls = $('#mz-pl', pal);
    function paint() { ls.innerHTML = shown.length ? shown.map(function (a, i) { return '<button type="button" class="mz-pt' + (i === sel ? ' on' : '') + '" data-i="' + i + '">' + ic(a.k) + '<b>' + esc(a.name) + '</b><small>' + a.hint + '</small></button>'; }).join('') : '<div class="mz-pn">Nothing matches</div>'; var on = $('.mz-pt.on', ls); if (on && on.scrollIntoView) on.scrollIntoView({block: 'nearest'}); }
    function go(i) { var a = shown[i]; if (!a) return; closePalette(); a.run(); }
    q.oninput = function () { var v = q.value.trim().toLowerCase(); shown = v ? list.filter(function (a) { return (a.name + ' ' + a.hint).toLowerCase().indexOf(v) > -1; }) : list; sel = 0; paint(); };
    q.onkeydown = function (e) { if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); paint(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); } else if (e.key === 'Enter') { go(sel); e.preventDefault(); } };
    ls.onclick = function (e) { var b = e.target.closest('.mz-pt'); if (b) go(+b.dataset.i); }; pal.onclick = function (e) { if (e.target === pal) closePalette(); };
    paint(); requestAnimationFrame(function () { pal.classList.add('in'); q.focus(); });
  }
  document.addEventListener('keydown', function (e) {
    if (!$('#acct') || !$('#subnav')) return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '') || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openPalette(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); openPalette(); }
    else if (e.key === 'Escape' && pal) closePalette();
  });

  /* ---------- tables: filter, sort, CSV ---------- */
  function num(t) { var s = t.trim(); if (!/^[^\d-]{0,3}[+-]?[\d,]+(\.\d+)?\s?%?[^\d]{0,3}$/.test(s)) return NaN; return parseFloat(s.replace(/[^0-9.\-]/g, '')); }
  function tools() {
    $$('#tabbody table.tbl2:not([data-tt])').forEach(function (t) {
      t.dataset.tt = '1'; var rows = $$('tr', t).filter(function (r) { return r.querySelector('td'); });
      if (rows.length < 8 || t.querySelector('td[colspan]')) return;
      var wrap = t.parentNode, bar = document.createElement('div'); bar.className = 'mz-tt';
      bar.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" placeholder="Filter these rows..." aria-label="Filter rows"><span>' + rows.length + ' rows</span><button type="button" class="btn sm" data-csv>Download CSV</button>';
      wrap.parentNode.insertBefore(bar, wrap); var q = $('input', bar), tc = $('span', bar);
      q.oninput = function () { var v = q.value.trim().toLowerCase(), n = 0; rows.forEach(function (r) { var ok = !v || r.textContent.toLowerCase().indexOf(v) > -1; r.style.display = ok ? '' : 'none'; if (ok) n++; }); tc.textContent = v ? n + ' of ' + rows.length : rows.length + ' rows'; };
      $('[data-csv]', bar).onclick = function () {
        var heads = $$('th', t).map(function (h) { return h.textContent.trim(); }), lines = [heads].concat(rows.filter(function (r) { return r.style.display !== 'none'; }).map(function (r) { return $$('td', r).map(function (c) { return c.textContent.trim().replace(/\s+/g, ' '); }); }));
        var csv = lines.map(function (r) { return r.map(function (c) { return '"' + c.replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type: 'text/csv'})); a.download = 'goldtriengine-' + tabKey() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); toast('CSV downloaded');
      };
      $$('th', t).forEach(function (th) {
        if (!th.textContent.trim()) return; th.classList.add('so'); th.title = 'Click to sort';
        th.onclick = function () { var dir = th.classList.contains('asc') ? -1 : 1, ci = th.cellIndex; $$('th', t).forEach(function (o) { o.classList.remove('asc', 'desc'); }); th.classList.add(dir === 1 ? 'asc' : 'desc'); var par = rows[0].parentNode;
          rows.slice().sort(function (a, b) { var x = (a.cells[ci] || {textContent: ''}).textContent, y = (b.cells[ci] || {textContent: ''}).textContent, nx = num(x), ny = num(y); if (!isNaN(nx) && !isNaN(ny)) return (nx - ny) * dir; return x.localeCompare(y, undefined, {numeric: true}) * dir; }).forEach(function (r) { par.appendChild(r); }); };
      });
    });
  }

  /* ---------- equity chip that follows you down the page ---------- */
  function chip() {
    if ($('#mz-chip')) return; var c = document.createElement('button'); c.type = 'button'; c.id = 'mz-chip'; c.setAttribute('aria-label', 'Back to the top');
    c.innerHTML = '<span class="mz-cd" id="mz-cd"></span><span><small>Equity</small><b id="mz-cb">-</b></span><em>Top</em>'; c.onclick = function () { window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'}); }; document.body.appendChild(c);
    var tk; addEventListener('scroll', function () { if (tk) return; tk = requestAnimationFrame(function () { tk = 0; var m = M(), st = m && m.st; if (st && st.equity != null) { setT($('#mz-cb'), usd(st.equity)); $('#mz-cd').className = 'mz-cd' + (st.online ? ' on' : ''); c.classList.toggle('on', scrollY > 640); } else c.classList.remove('on'); }); }, {passive: true});
  }

  /* ---------- pointer light, tilt, living background, sweep, day/night ripple ---------- */
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('#acct .panel,#acct .hero,#acct .tile,#acct .lv'); if (!el) return;
    var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive: true});
  function glow() {
    if (reduce || !fine || $('#mz-glow')) return; var d = document.createElement('div'); d.id = 'mz-glow'; document.body.appendChild(d);
    var x = innerWidth / 2, y = 200, tx = x, ty = y; addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; document.body.style.setProperty('--mpx', ((e.clientX / innerWidth - .5) * -40).toFixed(0) + 'px'); document.body.style.setProperty('--mpy', ((e.clientY / innerHeight - .5) * -30).toFixed(0) + 'px'); }, {passive: true});
    (function loop() { x += (tx - x) * .12; y += (ty - y) * .12; d.style.transform = 'translate3d(' + (x - 260) + 'px,' + (y - 260) + 'px,0)'; requestAnimationFrame(loop); })();
  }
  function net() {
    if (reduce || $('#mz-net')) return; var c = document.createElement('canvas'); c.id = 'mz-net'; document.body.insertBefore(c, document.body.firstChild);
    var g = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1), P = [], mx = -999, my = -999, run = true;
    function size() { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0); var n = Math.round(Math.min(55, Math.max(20, W * H / 26000))); while (P.length < n) P.push({x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: 1 + Math.random() * 1.4, h: Math.random() < .3}); P.length = n; }
    function light() { return document.documentElement.getAttribute('data-theme') === 'light'; }
    function frame() { if (!run) return; g.clearRect(0, 0, W, H); var k = light() ? .4 : .7, L = 120;
      for (var i = 0; i < P.length; i++) { var p = P[i]; p.x += p.vx; p.y += p.vy; if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy; if (d2 < 14000) { var f = 1 - d2 / 14000; p.x += dx * f * .012; p.y += dy * f * .012; }
        for (var j = i + 1; j < P.length; j++) { var q = P[j], ax = p.x - q.x, ay = p.y - q.y, dd = ax * ax + ay * ay; if (dd < L * L) { g.strokeStyle = (p.h ? 'rgba(227,185,95,' : 'rgba(120,160,255,') + ((1 - Math.sqrt(dd) / L) * .24 * k) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } }
        g.fillStyle = (p.h ? 'rgba(227,185,95,' : 'rgba(120,160,255,') + .65 * k + ')'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill(); }
      requestAnimationFrame(frame); }
    size(); frame(); addEventListener('resize', size); addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, {passive: true});
    document.addEventListener('visibilitychange', function () { var was = run; run = !document.hidden; if (run && !was) frame(); });
  }
  function sweep() { var b = $('#mz-sw'); if (!b) { b = document.createElement('div'); b.id = 'mz-sw'; document.body.appendChild(b); } b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); }
  function wipe() {
    if (!document.startViewTransition || reduce) return;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.theme-btn'); if (!b || b.__fx) return; e.stopImmediatePropagation(); e.preventDefault();
      var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var t = document.startViewTransition(function () { b.__fx = true; b.click(); b.__fx = false; });
      t.ready.then(function () { document.documentElement.animate({clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)']}, {duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)'}); }).catch(function () {});
    }, true);
  }

  /* ---------- wire up ---------- */
  var lastTab = null, booted = false;
  function boot() {
    var A = $('#acct'); if (!A || !$('#subnav')) return;
    if (!booted) { booted = true; document.body.classList.add('mzfx'); if (document.documentElement.classList.contains('mznc-pre')) document.body.classList.add('mznc'); net(); glow(); wipe(); chip(); setInterval(header, 20000); }
    menu(); header(); checklist(); tools();
    var k = tabKey(); if (k !== lastTab) { if (lastTab !== null) sweep(); lastTab = k; }
  }
  function start() {
    var A = $('#acct'); if (!A) return; var tm;
    new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(boot, 80); }).observe(A, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
