/* Partner dashboard, round two: grouped side menu, command centre with live tiles, smart insights, quick search (Ctrl/Cmd+K),
   filter and sort for tables, pointer light, day/night ripple. Everything is computed from the partner's own numbers.
   If this file does not load, the dashboard works as before. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var money = function (n, d) { n = Number(n || 0); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', {maximumFractionDigits: d == null ? 0 : d}); };
  function S() { return window.GTE_PD || null; }
  function setT(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function setH(el, h) { if (el && el.dataset.h !== h) { el.dataset.h = h; el.innerHTML = h; } }
  function ready() { var s = S(), a = $('#pd-app'); return s && s.me && s.stats && a && !a.hidden; }

  var DESC = {overview: 'Your money, traffic and progress at a glance', campaigns: 'Your links, one per place you post', customers: 'People who came through you (first names only)', reports: 'Day-by-day numbers you can download', payouts: 'Request money and see what was sent to your wallet', kit: 'Banners, captions and your personal page, ready to use'};
  var GROUPS = [['Earn', ['overview', 'campaigns', 'kit']], ['People', ['customers', 'reports']], ['Money', ['payouts']]];
  var TABICON = {overview: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10', campaigns: 'M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8a5 5 0 010 8M19 5a9 9 0 010 14', customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', reports: 'M12 20V10M18 20V4M6 20v-4', payouts: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6', kit: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'};
  function svg(k) { return '<svg class="pdx-i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (TABICON[k] || TABICON.overview) + '"/></svg>'; }
  function tabName() { var on = $('#pd-bar button.on'); return on ? on.textContent.trim() : 'Overview'; }
  function tabKey() { var on = $('#pd-bar button.on'); return on ? on.dataset.t : 'overview'; }

  /* ---------- side menu ---------- */
  function groups() {
    var bar = $('#pd-bar'); if (!bar || bar.querySelector('.png')) return;
    GROUPS.forEach(function (g, gi) {
      var base = (gi + 1) * 100, l = document.createElement('span'); l.className = 'png'; l.textContent = g[0]; l.style.order = base; bar.appendChild(l);
      g[1].forEach(function (k, i) { var b = bar.querySelector('button[data-t="' + k + '"]'); if (b) { b.style.order = base + 1 + i; b.dataset.tip = b.textContent.trim(); } });
    });
    var cb = document.createElement('button'); cb.type = 'button'; cb.className = 'pcol'; cb.style.order = 999; cb.setAttribute('aria-label', 'Collapse or expand the menu');
    cb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg><span>Collapse</span>';
    cb.onclick = function () { var c = $('.pd').classList.toggle('pdnc'); try { localStorage.setItem('gte_pd_nav', c ? 'c' : 'o'); } catch (e) {} hideTip(); setTimeout(function () { if (window.__pdMark) window.__pdMark(); }, 420); };
    bar.appendChild(cb);
  }
  var tip;
  function hideTip() { if (tip) { tip.remove(); tip = null; } }
  document.addEventListener('mouseover', function (e) {
    var b = e.target.closest && e.target.closest('#pd-bar button[data-tip]'), root = $('.pd');
    if (!b || !root || !root.classList.contains('pdnc') || innerWidth < 1000) { hideTip(); return; }
    hideTip(); var r = b.getBoundingClientRect(); tip = document.createElement('div'); tip.id = 'pdx-tip'; tip.textContent = b.dataset.tip; tip.style.left = (r.right + 10) + 'px'; tip.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(tip);
  });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget || !(e.relatedTarget.closest && e.relatedTarget.closest('#pd-bar button[data-tip]'))) hideTip(); });
  function toggle() {
    var top = $('.pd-top'); if (!top || $('#pdx-nt')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'pdx-nt'; b.setAttribute('aria-label', 'Collapse or expand the menu');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>';
    top.insertBefore(b, top.firstChild);
    try { if (localStorage.getItem('gte_pd_nav') === 'c') $('.pd').classList.add('pdnc'); } catch (e) {}
    b.onclick = function () { var c = $('.pd').classList.toggle('pdnc'); try { localStorage.setItem('gte_pd_nav', c ? 'c' : 'o'); } catch (e) {} setTimeout(function () { if (window.__pdMark) window.__pdMark(); }, 420); };
  }

  /* ---------- command centre ---------- */
  function path(a) {
    var w = 120, h = 34, mx = Math.max.apply(null, a.concat([1])), pts = a.map(function (v, i) { return [a.length > 1 ? i * w / (a.length - 1) : 0, h - 3 - (v / mx) * (h - 8)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return {line: d, area: d + ' L' + w + ' ' + h + ' L0 ' + h + ' Z'};
  }
  function tile(go, cls, label, val, sub, a, tone) {
    var p = a && a.some(function (v) { return v > 0; }) ? path(a) : null;
    return '<button type="button" class="pdx-pl ' + cls + '" data-ps="' + go + '"><span class="pdx-pll">' + label + '</span><b class="pdx-plv" data-v="' + val.n + '" data-f="' + val.f + '" data-s="' + (val.s || '') + '">' + val.t + '</b><span class="pdx-pld ' + (tone || '') + '">' + sub + '</span>' +
      (p ? '<svg class="pdx-pls" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="' + p.area + '"/><path class="l" pathLength="1" d="' + p.line + '"/></svg>' : '') + '</button>';
  }
  var sig = '';
  function hero() {
    var s = S(); if (!ready()) return;
    var ov = $('#pd-overview'), box = $('#pdx-hero');
    if (!box) {
      box = document.createElement('div'); box.id = 'pdx-hero';
      box.innerHTML = '<div class="pdx-hl"><div class="pdx-hk"><i></i><span id="pdx-hk"></span></div><div class="pdx-ht" id="pdx-ht"></div><div class="pdx-hs" id="pdx-hs"></div><div id="pdx-hc"></div></div>' +
        '<div class="pdx-hr"><button type="button" id="pdx-q"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><span>Jump to...</span><kbd>Ctrl K</kbd></button></div><div id="pdx-pulse"></div>';
      ov.parentNode.insertBefore(box, ov); $('#pdx-q').onclick = openPalette;
    }
    box.dataset.tab = tabKey();
    var d = new Date(), h = d.getHours(), g = h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    setT($('#pdx-hk'), (g + ' · ' + d.toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})).toUpperCase());
    setT($('#pdx-ht'), tabName()); setT($('#pdx-hs'), DESC[tabKey()] || '');
    var st = s.stats, B = st.balances || {}, cur = st.cur || {}, prev = st.prev || {}, me = s.me, minp = Number(me.minPayout || 50);
    var ser = function (k) { return (st.series || []).map(function (x) { return Number(x[k] || 0); }); };
    var de = prev.earned > 0 ? Math.round((cur.earned - prev.earned) / prev.earned * 100) : null, dc = prev.clicks > 0 ? Math.round((cur.clicks - prev.clicks) / prev.clicks * 100) : null;
    var conv = cur.clicks > 0 ? Math.round(cur.paid / cur.clicks * 1000) / 10 : 0, ready_ = Number(B.ready || 0);
    var chips = [];
    if (ready_ >= minp) chips.push('<button type="button" class="pdx-hc ok" data-go="payouts"><i></i>You can request a payout</button>');
    if (Number(B.hold) > 0) chips.push('<button type="button" class="pdx-hc warn" data-go="payouts"><i></i><b>' + money(B.hold) + '</b> in the refund wait</button>');
    if (Number(cur.signups) > 0) chips.push('<button type="button" class="pdx-hc info" data-go="customers"><i></i><b>' + Number(cur.signups).toLocaleString('en-US') + '</b> sign-ups this period</button>');
    if (!chips.length) chips.push('<span class="pdx-hc ok"><i></i>All set</span>');
    setH($('#pdx-hc'), chips.join(''));
    var html = tile('bal:ready', 'k1', 'Ready to pay out', {n: ready_, f: '$', t: money(ready_)}, ready_ >= minp ? 'tap to request it' : money(Math.max(0, minp - ready_)) + ' more to the minimum', ser('earned'), ready_ >= minp ? 'up' : '') +
      tile('earned', 'k2', 'Earned, ' + (s.days || 30) + ' days', {n: Math.round(cur.earned || 0), f: '$', t: money(cur.earned)}, de === null ? 'first period' : (de >= 0 ? '&#9650; ' : '&#9660; ') + Math.abs(de) + '% vs before', ser('earned'), de === null ? '' : de >= 0 ? 'up' : 'dn') +
      tile('clicks', 'k3', 'Clicks', {n: Number(cur.clicks || 0), f: '', t: Number(cur.clicks || 0).toLocaleString('en-US')}, dc === null ? 'first period' : (dc >= 0 ? '&#9650; ' : '&#9660; ') + Math.abs(dc) + '% vs before', ser('clicks'), dc === null ? '' : dc >= 0 ? 'up' : 'dn') +
      tile('conv', 'k4', 'Click to sale', {n: conv, f: '', s: '%', t: conv + '%'}, Number(cur.paid || 0) + ' paid sale' + (Number(cur.paid) === 1 ? '' : 's'), null, '');
    if (html !== sig) { var first = !sig; sig = html; $('#pdx-pulse').innerHTML = html; if (first && !reduce) $$('#pdx-pulse .pdx-plv').forEach(count); }
  }
  function count(el) {
    var to = +el.dataset.v, f = el.dataset.f || '', sf = el.dataset.s || ''; if (!isFinite(to) || to < 2) return;
    var t0 = performance.now(), fin = el.textContent; setTimeout(function () { el.textContent = fin; }, 1900);
    (function tick(now) { var p = Math.min(1, (now - t0) / 1000), e = 1 - Math.pow(1 - p, 4); el.textContent = f + Math.round(to * e).toLocaleString('en-US') + sf; if (p < 1) requestAnimationFrame(tick); })(t0);
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-go]'); if (!b || !b.closest('#pdx-hero')) return; var t = $('#pd-bar button[data-t="' + b.dataset.go + '"]'); if (t) { t.click(); window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'}); } });

  /* ---------- smart insights, written from the partner's own numbers ---------- */
  function hourName(h) { return (h % 12 || 12) + (h < 12 ? ' AM' : ' PM'); }
  function insights() {
    var s = S(), st = s.stats, me = s.me, B = st.balances || {}, cur = st.cur || {}, prev = st.prev || {}, out = [];
    var hrs = st.hours || [], hmax = Math.max.apply(null, hrs.concat([0]));
    if (hmax > 0) { var hi = hrs.indexOf(hmax), tot = hrs.reduce(function (a, b) { return a + b; }, 0); out.push({k: 'hour', t: 'g', h: 'Best time to post: ' + hourName(hi), d: 'About ' + Math.round(hmax / tot * 100) + '% of your clicks arrive in that hour (your local time). Post 15 to 30 minutes before it.'}); }
    var wd = [0, 0, 0, 0, 0, 0, 0], names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    (st.series || []).forEach(function (x) { var dt = new Date(String(x.day) + 'T12:00:00Z'); if (!isNaN(dt)) wd[dt.getUTCDay()] += Number(x.clicks || 0); });
    var wm = Math.max.apply(null, wd); if (wm > 0 && (st.series || []).length >= 14) out.push({k: 'wd', t: 'v', h: 'Your strongest day is ' + names[wd.indexOf(wm)], d: 'More of your fans click on this day than any other in the last ' + (s.days || 30) + ' days.'});
    var conv = cur.clicks > 0 ? cur.paid / cur.clicks * 100 : 0;
    if (cur.clicks >= 100) out.push(conv < 1 ? {k: 'conv', t: 'y', h: 'Many clicks, few sales', d: 'Only ' + conv.toFixed(1) + '% of clicks become sales. Send fans to your personal page and mention the discount code in the first line.'} : conv >= 3 ? {k: 'conv', t: 'g', h: 'Your audience converts very well', d: conv.toFixed(1) + '% of clicks become sales. More traffic is your fastest way to earn more.'} : {k: 'conv', t: 'a', h: 'Healthy click-to-sale rate', d: conv.toFixed(1) + '% of clicks become sales. Use the planner below to see what more traffic is worth.'});
    return out.slice(0, 5);
  }
  function renderInsights() {
    var ov = $('#pd-overview'), j = $('#pdx-j', ov); if (!ov || !j) return;
    var s = S(), key = JSON.stringify([s.days, s.stats.cur, s.stats.balances, (s.camps || []).length]);
    var old = $('#pdx-in', ov); if (old && old.dataset.k === key) return; if (old) old.remove();
    var L = insights(); if (!L.length) return;
    var c = document.createElement('div'); c.className = 'pd-card pdx-in pd-fadeup in'; c.id = 'pdx-in'; c.dataset.k = key;
    c.innerHTML = '<div class="pd-row"><h3>Smart insights</h3><span class="pd-pill c">written from your numbers</span></div><div class="pdx-il">' + L.map(function (x, i) { return '<div class="pdx-it ' + x.t + '"' + (x.k ? ' data-ps="ins:' + x.k + '" role="button" tabindex="0"' : '') + ' style="animation-delay:' + (i * 70) + 'ms"><i></i><div><b>' + esc(x.h) + '</b><span>' + esc(x.d) + '</span></div></div>'; }).join('') + '</div>';
    var ech = $('#pd-ech', ov), g = ech && ech.closest('.pd-grid'); (g || j).insertAdjacentElement('afterend', c);
  }

  /* ---------- quick search ---------- */
  var pal;
  function actions() {
    var out = [];
    out.push({k: 'overview', name: 'Switch to my Customer account', hint: 'Switch account', run: function () { location.href = 'my-account.html'; }});
    $$('#pd-bar button[data-t]').forEach(function (b) { out.push({k: b.dataset.t, name: b.textContent.trim(), hint: 'Open section', run: function () { b.click(); window.scrollTo({top: 0}); }}); });
    [['#pd-cl', 'Copy my link', 'overview'], ['#pd-cc', 'Copy my code', 'overview'], ['#pd-sh', 'Share my link', 'campaigns'], ['#pd-qr', 'Show my QR code', 'kit'], ['#pd-req', 'Request a payout', 'payouts']].forEach(function (a) {
      if ($(a[0])) out.push({k: a[2], name: a[1], hint: 'Action', run: function () { var el = $(a[0]); if (el) el.click(); }});
    });
    var tb = $('.theme-btn'); if (tb) out.push({k: 'overview', name: 'Switch day / night', hint: 'Appearance', run: function () { tb.click(); }});
    return out;
  }
  function closePalette() { if (!pal) return; var p = pal; pal = null; p.classList.remove('in'); setTimeout(function () { p.remove(); }, 180); }
  function openPalette() {
    if (pal) return closePalette();
    var list = actions(), sel = 0, shown = list;
    pal = document.createElement('div'); pal.id = 'pdx-pal';
    pal.innerHTML = '<div class="pdx-pb" role="dialog" aria-label="Quick search"><div class="pdx-pi"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="pdx-pq" placeholder="Jump to a section or do something..." autocomplete="off"><kbd>Esc</kbd></div><div class="pdx-pls2" id="pdx-pl"></div></div>';
    document.body.appendChild(pal);
    var q = $('#pdx-pq', pal), ls = $('#pdx-pl', pal);
    function paint() { ls.innerHTML = shown.length ? shown.map(function (a, i) { return '<button type="button" class="pdx-pit' + (i === sel ? ' on' : '') + '" data-i="' + i + '">' + svg(a.k) + '<b>' + esc(a.name) + '</b><small>' + a.hint + '</small></button>'; }).join('') : '<div class="pdx-pno">Nothing matches</div>'; var on = $('.pdx-pit.on', ls); if (on && on.scrollIntoView) on.scrollIntoView({block: 'nearest'}); }
    function go(i) { var a = shown[i]; if (!a) return; closePalette(); a.run(); }
    q.oninput = function () { var v = q.value.trim().toLowerCase(); shown = v ? list.filter(function (a) { return (a.name + ' ' + a.hint).toLowerCase().indexOf(v) > -1; }) : list; sel = 0; paint(); };
    q.onkeydown = function (e) { if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); paint(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); } else if (e.key === 'Enter') { go(sel); e.preventDefault(); } };
    ls.onclick = function (e) { var b = e.target.closest('.pdx-pit'); if (b) go(+b.dataset.i); };
    pal.onclick = function (e) { if (e.target === pal) closePalette(); };
    paint(); requestAnimationFrame(function () { pal.classList.add('in'); q.focus(); });
  }
  document.addEventListener('keydown', function (e) {
    if (!ready()) return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '') || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openPalette(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); openPalette(); }
    else if (e.key === 'Escape' && pal) closePalette();
  });

  /* ---------- filter and sort for tables ---------- */
  function num(t) { var s = t.trim(); if (!/^[^\d-]{0,2}-?[\d,]+(\.\d+)?\s?%?[^\d]{0,3}$/.test(s)) return NaN; return parseFloat(s.replace(/[^0-9.\-]/g, '')); }
  function tools() {
    $$('.pd-scroll > table:not([data-tt])').forEach(function (t) {
      t.dataset.tt = '1';
      var rows = $$('tr', t).filter(function (r) { return r.querySelector('td'); });
      if (rows.length < 6 || t.querySelector('td[colspan]')) return;
      var wrap = t.parentNode, bar = document.createElement('div'); bar.className = 'pdx-tt';
      bar.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" placeholder="Filter this table..." aria-label="Filter this table"><span>' + rows.length + ' rows</span>';
      wrap.parentNode.insertBefore(bar, wrap);
      var q = $('input', bar), tc = $('span', bar);
      q.oninput = function () { var v = q.value.trim().toLowerCase(), n = 0; rows.forEach(function (r) { var ok = !v || r.textContent.toLowerCase().indexOf(v) > -1; r.style.display = ok ? '' : 'none'; if (ok) n++; }); tc.textContent = v ? n + ' of ' + rows.length : rows.length + ' rows'; };
      $$('th', t).forEach(function (th) {
        if (!th.textContent.trim()) return; th.classList.add('so'); th.title = 'Click to sort';
        th.onclick = function () {
          var dir = th.classList.contains('asc') ? -1 : 1, ci = th.cellIndex; $$('th', t).forEach(function (o) { o.classList.remove('asc', 'desc'); }); th.classList.add(dir === 1 ? 'asc' : 'desc');
          var par = rows[0].parentNode;
          rows.slice().sort(function (a, b) { var x = (a.cells[ci] || {textContent: ''}).textContent, y = (b.cells[ci] || {textContent: ''}).textContent, nx = num(x), ny = num(y); if (!isNaN(nx) && !isNaN(ny)) return (nx - ny) * dir; return x.localeCompare(y, undefined, {numeric: true}) * dir; }).forEach(function (r) { par.appendChild(r); });
        };
      });
    });
  }

  /* ---------- pointer light, drifting orbs, page-change sweep, day/night ripple ---------- */
  function glow() {
    if (reduce || !fine || $('#pdx-glow')) return;
    var d = document.createElement('div'); d.id = 'pdx-glow'; document.body.appendChild(d);
    var x = innerWidth / 2, y = 200, tx = x, ty = y;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; var p = $('.pd'); if (p) { p.style.setProperty('--px', ((e.clientX / innerWidth - .5) * -50).toFixed(0) + 'px'); p.style.setProperty('--py', ((e.clientY / innerHeight - .5) * -40).toFixed(0) + 'px'); } }, {passive: true});
    (function loop() { x += (tx - x) * .12; y += (ty - y) * .12; d.style.transform = 'translate3d(' + (x - 260) + 'px,' + (y - 260) + 'px,0)'; requestAnimationFrame(loop); })();
  }
  function sweep() { var b = $('#pdx-sw'); if (!b) { b = document.createElement('div'); b.id = 'pdx-sw'; document.body.appendChild(b); } b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); }
  function wipe() {
    if (!document.startViewTransition || reduce) return;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.theme-btn'); if (!b || b.__fx) return;
      e.stopImmediatePropagation(); e.preventDefault();
      var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var t = document.startViewTransition(function () { b.__fx = true; b.click(); b.__fx = false; });
      t.ready.then(function () { document.documentElement.animate({clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)']}, {duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)'}); }).catch(function () {});
    }, true);
  }

  /* ---------- account switcher: a partner is also a customer ---------- */
  function swHtml(cur, cls) { return '<div class="acsw ' + cls + '" data-v="'+cur+'" role="group" aria-label="Switch account"><a href="my-account.html" data-sw="c" class="'+(cur==="c"?"on":"")+'" title="Customer account"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg><span>Customer</span></a><a href="partner.html" data-sw="p" class="'+(cur==="p"?"on":"")+'" title="Partner dashboard"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Partner</span></a><i></i></div>'; }
  function switcher() {
    var bar = $('#pd-bar'), app = $('#pd-app'); if (!bar || !app) return;
    if (!$('.acsw', bar)) bar.insertAdjacentHTML('afterbegin', swHtml('p', 'side'));
    if (!$('.acsw.mob', app)) app.insertAdjacentHTML('afterbegin', swHtml('p', 'mob'));
  }
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[data-sw]'); if (a && a.closest('.acsw').dataset.v === a.dataset.sw) e.preventDefault(); });
  function mark() {
    ['clicks', 'signups', 'paid', 'earned'].forEach(function (key, i) { var el = $$('#pd-reports .pd-grid .pd-kpi')[i]; if (el && !el.dataset.ps) { el.dataset.ps = key; el.setAttribute('role', 'button'); el.tabIndex = 0; } });
    var o = $('#pdx-p .pdx-out'); if (o && !o.dataset.ps) { o.dataset.ps = 'calc'; o.setAttribute('role', 'button'); o.tabIndex = 0; }
  }
  var booted = false, lastTab = null;
  function boot() {
    if (!ready()) return;
    if (!booted) {
      booted = true; groups(); toggle(); glow(); wipe();
      setInterval(function () { if (ready()) hero(); }, 20000);
    }
    var k = tabKey(); if (k !== lastTab) { if (lastTab !== null) sweep(); lastTab = k; }
    groups(); switcher(); hero(); renderInsights(); tools(); mark();
    if (window.__pdMark) window.__pdMark();
  }
  function start() {
    var root = $('.pd'); if (!root) return;
    var tm; new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(boot, 80); }).observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class']});
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
