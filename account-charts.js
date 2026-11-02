/* My account: a key-facts strip on every tab, plus new charts (drawdown, trade results, long vs short, how trades ended, time in a trade,
   plan and license gauges). Every fact, slice, bar and point opens the existing detail sheet with the real trades or numbers behind it.
   It uses only this customer's own data. Purely additive: if this file does not load, the page works as before. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var N = function (n) { n = Number(n); return isFinite(n) ? n : 0; };
  var arr = function (a) { return Array.isArray(a) ? a : []; };
  var M = function () { return window.GTE_MA || null; }, R = function () { return window.gteResults || null; };
  var pct = function (a, b) { return b > 0 ? Math.round(a / b * 1000) / 10 : 0; };
  var num = function (n) { return N(n).toLocaleString('en-US', {maximumFractionDigits: 1}); };
  var usd = function (n, d) { return R() ? R().usd(N(n), d == null ? 0 : d) : '$' + N(n).toFixed(d == null ? 0 : d); };
  var sgn = function (n, d) { return R() ? R().sgn(N(n), d == null ? 2 : d) : (N(n) >= 0 ? '+$' : '-$') + Math.abs(N(n)).toFixed(2); };
  var col = function (n) { return R() ? R().col(N(n)) : ''; };
  var DAY = 864e5, plural = function (n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); };
  var PAL = ['var(--blue-hi)', 'var(--mint)', 'var(--gold)', 'var(--red)', '#a78bfa', '#22d3ee'], pal = function (i) { return PAL[i % PAL.length]; };
  var ago = function (t) { var s = (Date.now() - new Date(t).getTime()) / 1000; return s < 90 ? 'just now' : s < 5400 ? Math.round(s / 60) + ' min ago' : s < 172800 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; };
  var dstr = function (d) { return d ? new Date(d).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'}) : '-'; };
  var dk = function (d) { var x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

  /* ---------- the existing detail sheet ---------- */
  function open(spec) { if (window.gteSheet && window.gteSheet.open) window.gteSheet.open(spec); }
  function explain(title, sub, rows, text, links) {
    return {k: 'explain', title: title, sub: sub, html: (text ? '<p class="gs-lead">' + text + '</p>' : '') + '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + E(r[1]) + '</b></div>'; }).join('') + '</div>' + arr(links).map(function (l) { return '<button type="button" class="gs-more" data-gsel="' + l[0] + '">' + E(l[1]) + '</button>'; }).join('')};
  }
  var sel = function (s) { return function () { if (window.gteSheet) window.gteSheet.sel(s); }; };
  var goTab = function (t) { var a = $('#subnav a[data-tab="' + t + '"]'); if (a) { a.click(); window.scrollTo({top: 0, behavior: 'smooth'}); } };

  /* ---------- registry + charts ---------- */
  var REG = {}, seq = 0; function reg(items, meta) { var id = 'a' + (++seq); REG[id] = {items: items, meta: meta || {}}; return id; }
  function donut(items, o) {
    o = o || {}; items = items.filter(function (i) { return N(i.value) > 0; }); var tot = items.reduce(function (s, i) { return s + N(i.value); }, 0); if (!tot) return '';
    items.forEach(function (it, i) { if (!it.color) it.color = pal(i); });
    var id = reg(items, {title: o.title, total: tot}), Rr = 38, C = 2 * Math.PI * Rr, acc = 0, segs = '', f = o.fmt || num, ct = String(o.center != null ? o.center : f(tot)), fs = ct.length <= 4 ? 14 : ct.length <= 6 ? 11 : ct.length <= 8 ? 9 : 7.5;
    items.forEach(function (it, i) { var len = N(it.value) / tot * C; segs += '<circle class="acg-s" data-g="' + id + '" data-i="' + i + '" cx="50" cy="50" r="' + Rr + '" fill="none" stroke="' + it.color + '" stroke-width="14" stroke-dasharray="' + Math.max(0, len - (items.length > 1 ? 1.2 : 0)).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 50 50)"><title>' + E(it.label) + ': ' + E(f(it.value)) + '</title></circle>'; acc += len; });
    return '<div class="acg-d"><svg viewBox="0 0 100 100" role="img" aria-label="' + E(o.title || 'Chart') + '">' + segs + '<text x="50" y="49" text-anchor="middle" class="acg-t1" style="font-size:' + fs + 'px">' + E(ct) + '</text><text x="50" y="61" text-anchor="middle" class="acg-t2">' + E(o.centerLabel || 'total') + '</text></svg><ul class="acg-l">' + items.map(function (it, i) { return '<li><button type="button" data-g="' + id + '" data-i="' + i + '"><i style="background:' + it.color + '"></i><span>' + E(it.label) + '</span><b>' + E(f(it.value)) + '</b><em>' + pct(N(it.value), tot) + '%</em></button></li>'; }).join('') + '</ul></div>';
  }
  function bars(items, o) {
    o = o || {}; if (!items.length) return ''; var H = 120, W = 300, pl = 6, pr = 6, pb = 18, pt = 14, n = items.length, id = reg(items, {title: o.title}), f = o.fmt || num;
    var mx = Math.max.apply(null, items.map(function (i) { return Math.abs(N(i.value)); }).concat([1])), neg = items.some(function (i) { return N(i.value) < 0; }), base = neg ? pt + (H - pt - pb) / 2 : H - pb, half = neg ? (H - pt - pb) / 2 : (H - pt - pb), step = (W - pl - pr) / n, bw = Math.max(2, Math.min(30, step * .72)), every = Math.ceil(n / (o.labels || 8));
    var grid = '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + base + '" y2="' + base + '" class="acg-g0" style="stroke-dasharray:none"/>';
    return '<svg class="acg-b" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(o.title || 'Chart') + '">' + grid + items.map(function (it, i) {
      var v = N(it.value), x = pl + step * i + (step - bw) / 2, h = Math.max(v !== 0 ? 2 : 0, half * Math.abs(v) / mx), y = v >= 0 ? base - h : base;
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + (it.color || (v < 0 ? 'var(--red)' : (o.color || 'var(--mint)'))) + '" rx="2"/>' +
        '<rect class="acg-s" data-g="' + id + '" data-i="' + i + '" x="' + (pl + step * i).toFixed(1) + '" y="' + pt + '" width="' + step.toFixed(1) + '" height="' + (H - pt - pb) + '" fill="transparent"><title>' + E(it.label) + ': ' + E(f(v)) + '</title></rect>' +
        (i % every === 0 || i === n - 1 ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" class="acg-t3">' + E(it.short || it.label) + '</text>' : '');
    }).join('') + '</svg>';
  }
  function line(items, o) {
    o = o || {}; if (items.length < 2) return ''; var H = 120, W = 300, pl = 6, pr = 8, pb = 18, pt = 12, n = items.length, id = reg(items, {title: o.title}), f = o.fmt || num, c = o.color || 'var(--red)';
    var vals = items.map(function (i) { return N(i.value); }), mn = Math.min.apply(null, vals.concat([0])), mx = Math.max.apply(null, vals.concat([0, 1e-9])), rngv = (mx - mn) || 1, sx = (W - pl - pr) / (n - 1), y = function (v) { return pt + (H - pt - pb) * (1 - (v - mn) / rngv); };
    var pts = items.map(function (it, i) { return [pl + sx * i, y(N(it.value))]; }), path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '), z = y(0), area = path + ' L' + pts[n - 1][0].toFixed(1) + ' ' + z.toFixed(1) + ' L' + pl + ' ' + z.toFixed(1) + ' Z', gid = 'al' + id;
    var every = Math.ceil(n / (o.labels || 6));
    return '<svg class="acg-b" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(o.title || 'Chart') + '"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".05"/><stop offset="1" stop-color="' + c + '" stop-opacity=".38"/></linearGradient></defs><line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + z.toFixed(1) + '" y2="' + z.toFixed(1) + '" class="acg-g0"/><path d="' + area + '" fill="url(#' + gid + ')"/><path d="' + path + '" fill="none" stroke="' + c + '" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      items.map(function (it, i) { return '<circle class="acg-s" data-g="' + id + '" data-i="' + i + '" cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="' + (n > 40 ? 3 : 4.5) + '" fill="' + c + '" fill-opacity="' + (n > 40 ? 0 : .9) + '" stroke="var(--panel)" stroke-width="1.5"><title>' + E(it.label) + ': ' + E(f(it.value)) + '</title></circle>'; }).join('') +
      items.map(function (it, i) { return i % every === 0 || i === n - 1 ? '<text x="' + pts[i][0].toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" class="acg-t3">' + E(it.short || it.label) + '</text>' : ''; }).join('') + '</svg>';
  }
  function hbars(items, o) {
    o = o || {}; items = items.filter(function (i) { return N(i.value) > 0; }); if (!items.length) return ''; var id = reg(items, {title: o.title}), mx = Math.max.apply(null, items.map(function (i) { return N(i.value); }).concat([1])), f = o.fmt || num, tot = items.reduce(function (s, i) { return s + N(i.value); }, 0);
    return '<ul class="acg-h">' + items.map(function (it, i) { return '<li><button type="button" data-g="' + id + '" data-i="' + i + '"><span class="acg-n">' + E(it.label) + '</span><span class="acg-k"><i style="width:' + Math.max(2, N(it.value) / mx * 100).toFixed(1) + '%;background:' + (it.color || pal(i)) + '"></i></span><b>' + E(f(it.value)) + '</b>' + (o.share === false ? '' : '<em>' + pct(N(it.value), tot) + '%</em>') + '</button></li>'; }).join('') + '</ul>';
  }
  function gauge(value, max, o) {
    o = o || {}; var v = N(value), m = N(max) || 1, p = Math.min(100, v / m * 100), Rr = 38, C = 2 * Math.PI * Rr, c = o.color || (p > 100 ? 'var(--red)' : p > 85 ? 'var(--gold)' : 'var(--mint)'), id = reg([{label: o.label || 'Used', value: v, sheet: o.sheet}], {});
    return '<button type="button" class="acg-ga" data-g="' + id + '" data-i="0"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + Rr + '" fill="none" stroke="var(--line-2)" stroke-width="12"/><circle cx="50" cy="50" r="' + Rr + '" fill="none" stroke="' + c + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (C * Math.min(100, p) / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="53" text-anchor="middle" class="acg-t1" style="font-size:15px">' + Math.round(p) + '%</text></svg><span>' + E(o.caption || '') + '</span></button>';
  }
  function card(title, sub, body, hint, wide) { return body ? {html: '<section class="panel acg-c' + (wide ? ' acg-w' : '') + '"><h3>' + E(title) + '</h3><div class="hint">' + E(sub) + '</div>' + body + '<div class="acg-f">Tap any part for the details.</div></section>'} : {empty: true, title: title, hint: hint || ''}; }
  function fact(tone, title, text, act) { return {tone: tone, title: title, text: text, act: act}; }
  var TONE = {bad: '!', warn: '!', ok: '&#10003;', info: 'i', mute: '&middot;'};

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-g][data-i]'); if (!el || !REG[el.dataset.g] || !el.closest('#acct')) return; var r = REG[el.dataset.g], it = r.items[+el.dataset.i]; if (!it) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var sp = typeof it.sheet === 'function' ? it.sheet(it, r) : null;
    if (!sp) { var tot = r.meta.total || r.items.reduce(function (s, x) { return s + N(x.value); }, 0); sp = explain(it.label, r.meta.title || 'Details', [['Amount', num(it.value)], ['Share', pct(N(it.value), tot) + '%']]); }
    open(sp);
  }, true);

  /* ================================================================ builders */
  var B = {};
  function ctx() {
    var m = M(); if (!m || !m.lic) return null;
    var all = arr(m.trades), T = m.rng ? arr(m.rng(all)) : all, st = m.st || {}, pl = m.plan || {}, tol = m.tol == null ? 5 : m.tol, lim = pl.limit_usd;
    var allowed = lim == null ? null : N(lim) * (1 + tol / 100) + N(m.lic.extra_allowance_usd || 0);
    return {m: m, all: all, T: T, st: st, pl: pl, tol: tol, lim: lim, allowed: allowed, funded: N(st.funded_usd), lic: m.lic};
  }
  function listSheet(title, sub, list, note) { return {k: 'trades', title: title, sub: sub, list: list, group: true, note: note || ''}; }

  /* ---- key facts that belong on every tab: the license and the EA ---- */
  function accountFacts(c) {      // only what the Live status card above the tabs does not already say: a license that is about to end, with its renewal price
    var f = [], lic = c.lic, st = c.st, days = lic.expires_at ? Math.ceil((new Date(lic.expires_at) - Date.now()) / DAY) : null, price = N(c.pl.price_usd);
    if (days != null) {
      var licSheet = function () { return explain('Your license', (c.pl.name || 'Plan') + ' plan', [['Status', lic.status], ['Valid until', dstr(lic.expires_at)], ['Days left', days >= 0 ? days + ' days' : 'Expired'], ['Renewal price', price ? usd(price) : '-'], ['MT5 account', lic.bound_account ? String(lic.bound_account) + (lic.bound_is_demo ? ' (demo)' : '') : 'Not used yet']], days <= 45 ? 'Renew before it ends so the EA never stops. You can renew in Keys & orders.' : 'Your license is in good time. Renewing early never wastes days.', []); };
      if (days < 0) f.push(fact('bad', 'Your license has ended', 'It ended on ' + dstr(lic.expires_at) + '. The EA stops trading until you renew.', function () { open(licSheet()); }));
      else if (days <= 14) f.push(fact('bad', 'Your license ends in ' + plural(days, 'day'), 'Renew' + (price ? ' for ' + usd(price) : '') + ' in Keys & orders so the EA keeps trading.', function () { open(licSheet()); }));
      else if (days <= 45) f.push(fact('warn', 'Your license ends in ' + plural(days, 'day'), 'Valid until ' + dstr(lic.expires_at) + (price ? '. Renewal ' + usd(price) + '.' : '.'), function () { open(licSheet()); }));
    }
    return f;
  }

  B.overview = function () {
    var c = ctx(); if (!c) return null; var f = accountFacts(c), all = c.all;
    if (all.length) {
      var wk = all.filter(function (t) { return Date.now() - new Date(t.closed_at).getTime() < 7 * DAY; }), wn = wk.reduce(function (a, t) { return a + N(t.profit); }, 0);
      if (wk.length) f.push(fact(wn >= 0 ? 'ok' : 'warn', 'Last 7 days ' + sgn(wn), plural(wk.length, 'trade') + ' closed. Tap for the days.', sel('week')));
      var cur = R() && c.m && (function () { var s = all.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }), sign = 0, n = 0; for (var i = s.length - 1; i >= 0; i--) { var g = s[i].profit > 0 ? 1 : s[i].profit < 0 ? -1 : 0; if (!g) break; if (!sign) sign = g; if (g !== sign) break; n++; } return {sign: sign, n: n}; })();
      if (cur && cur.n >= 3) f.push(fact(cur.sign > 0 ? 'ok' : 'warn', cur.n + (cur.sign > 0 ? ' wins' : ' losses') + ' in a row right now', cur.sign > 0 ? 'A winning run. Do not change anything because of it.' : 'Losses in a row are normal and each one is limited by a stop. Nothing to fix.', sel('streaknow')));
    }
    return f.length ? {title: 'What matters now', facts: f, cards: []} : null;
  };

  B.results = function () {
    var c = ctx(); if (!c) return null; var T = c.T, f = [];
    if (!T.length) return {title: 'What matters in this period', facts: f.concat([fact('info', 'No closed trades in this period', 'Pick a longer period above to see the charts.')]), cards: [card('Drawdown', '', '', 'needs trades'), card('Trade results', '', '', 'needs trades')]};
    var s = R().stats(T), cv = R().curve(T), wins = T.filter(function (t) { return t.profit > 0; }), losses = T.filter(function (t) { return t.profit < 0; });
    // drawdown over time (below the previous high)
    var dd = cv.filter(function (p) { return p.tr; }).map(function (p) { return {label: new Date(p.t).toLocaleDateString([], {day: 'numeric', month: 'short'}), short: new Date(p.t).toLocaleDateString([], {day: 'numeric', month: 'short'}), value: -p.dd, sheet: function () { return p.tr ? {k: 'trade', t: p.tr, day: true, title: 'Trade details', sub: 'Result ' + sgn(-p.dd) + ' below the highest point so far'} : null; }}; });
    var peak = Math.max.apply(null, cv.map(function (p) { return p.c; }).concat([0])), mdd = s.maxDD, mddPct = peak > 0 ? pct(mdd, peak) : 0;
    // histogram of single-trade results
    var pr = T.map(function (t) { return N(t.profit); }), lo = Math.min.apply(null, pr), hi = Math.max.apply(null, pr), nb = Math.min(12, Math.max(5, Math.round(Math.sqrt(T.length)))), span = Math.max(hi - lo, 1), bw = span / nb, bins = [];
    for (var i = 0; i < nb; i++) bins.push({a: lo + i * bw, b: lo + (i + 1) * bw, list: []}); T.forEach(function (t) { var k = Math.min(nb - 1, Math.floor((N(t.profit) - lo) / bw)); bins[k].list.push(t); });
    var hist = bins.map(function (b) { var mid = (b.a + b.b) / 2; return {label: sgn(b.a, 0) + ' to ' + sgn(b.b, 0), short: Math.round(mid), value: b.list.length, color: mid >= 0 ? 'var(--mint)' : 'var(--red)', sheet: function () { return listSheet('Results from ' + sgn(b.a, 0) + ' to ' + sgn(b.b, 0), plural(b.list.length, 'trade') + ' closed in this range.', b.list); }}; });
    // long vs short
    var buy = T.filter(function (t) { return t.dir > 0; }), sell = T.filter(function (t) { return t.dir < 0; }), net = function (l) { return l.reduce(function (a, t) { return a + N(t.profit); }, 0); };
    var side = [{label: 'BUY (up)', value: buy.length, color: 'var(--mint)', sheet: function () { return listSheet('BUY trades', 'Net ' + sgn(net(buy)) + ', win rate ' + pct(buy.filter(function (t) { return t.profit > 0; }).length, buy.length) + '%', buy); }}, {label: 'SELL (down)', value: sell.length, color: 'var(--red)', sheet: function () { return listSheet('SELL trades', 'Net ' + sgn(net(sell)) + ', win rate ' + pct(sell.filter(function (t) { return t.profit > 0; }).length, sell.length) + '%', sell); }}];
    // how trades ended
    var EX = {stop: ['Stop-loss', 'var(--red)'], target: ['Take-profit', 'var(--mint)']}, ex = {}; T.forEach(function (t) { var k = t.exit_reason || 'other'; (ex[k] = ex[k] || []).push(t); });
    var exI = Object.keys(ex).map(function (k) { return {label: (EX[k] || [k === 'other' ? 'Not recorded' : k])[0], value: ex[k].length, color: (EX[k] || [])[1], sheet: function () { return listSheet((EX[k] || [k])[0] + ' exits', 'Trades that ended this way. Net ' + sgn(net(ex[k])), ex[k]); }}; });
    // time in a trade
    var HB = [['Under 5 min', 0, 5], ['5 to 15 min', 5, 15], ['15 to 60 min', 15, 60], ['1 to 4 hours', 60, 240], ['4 to 24 hours', 240, 1440], ['Over a day', 1440, 1e9]], hm = function (t) { return R().holdMin(t); };
    var hold = HB.map(function (h) { var l = T.filter(function (t) { var v = hm(t); return v != null && v >= h[1] && v < h[2]; }); return {label: h[0], short: h[0].replace(' min', 'm').replace(' hours', 'h').replace('Under ', '<').replace('Over a day', '>1d').replace(' to ', '-'), value: l.length, sheet: function () { return listSheet('Held ' + h[0].toLowerCase(), plural(l.length, 'trade') + '. Net ' + sgn(net(l)), l); }}; });
    var anyHold = hold.some(function (h) { return h.value > 0; });
    var facts = f.slice();
    facts.push(fact(s.net >= 0 ? 'ok' : 'warn', sgn(s.net) + ' from ' + plural(s.n, 'trade') + ' in this period', s.win.toFixed(0) + '% won. Average win ' + sgn(s.avgWin) + ', average loss ' + sgn(s.avgLoss) + '.', sel('net')));
    facts.push(fact('info', 'Deepest dip ' + usd(mdd, 2) + (mddPct ? ' (' + mddPct + '% of the peak)' : ''), 'The most the result fell from a high point. It is normal for any strategy.', sel('dd')));
    if (s.pf != null) facts.push(fact(s.pf >= 1 ? 'ok' : 'warn', 'Profit factor ' + s.pf.toFixed(2), s.pf >= 1 ? 'The winners earned ' + s.pf.toFixed(2) + ' dollars for every dollar the losers cost.' : 'The losers cost more than the winners earned in this period.', sel('pf')));
    var dm = {}; T.forEach(function (t) { var k = dk(t.closed_at); dm[k] = (dm[k] || 0) + N(t.profit); }); var dks = Object.keys(dm).sort(function (a, b) { return dm[a] - dm[b]; });
    if (dks.length > 1) facts.push(fact('info', 'Best day ' + sgn(dm[dks[dks.length - 1]]) + ', worst day ' + sgn(dm[dks[0]]), 'Tap for the trades of each day.', sel('bestday')));
    return {title: 'What matters in this period', facts: facts, cards: [
      card('Drawdown over time', 'How far the result sat below its highest point after each trade. Zero is a new high.', line(dd, {title: 'Drawdown', fmt: function (v) { return usd(v, 2); }, color: 'var(--red)'}), 'needs trades'),
      card('How big your trades were', 'Each bar counts trades by their result. Green is profit, red is loss.', bars(hist, {title: 'Results', labels: 7}), 'needs trades'),
      card('BUY and SELL', 'Which direction the EA traded most.', donut(side, {title: 'Direction', center: T.length, centerLabel: 'trades'}), 'needs trades'),
      card('How trades ended', 'At the stop, at the target or another way.', donut(exI, {title: 'Exits', center: T.length, centerLabel: 'trades'}), 'needs exit reasons'),
      card('Time in a trade', 'How long trades stayed open.', anyHold ? bars(hold, {title: 'Time in a trade', color: 'var(--blue-hi)', labels: 6}) : '', 'needs open times')]};
  };

  /* ---- pending (limit) orders: placed, waited, then filled, expired or cancelled ---- */
  var PST = {pending: ['Waiting', 'var(--blue-hi)'], filled: ['Filled', 'var(--mint)'], expired: ['Expired, not filled', 'var(--gold)'], cancelled: ['Cancelled', 'var(--faint)']};
  function pTime(d) { return d ? new Date(d).toLocaleString([], {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '-'; }
  function pName(o) { return (o.kind || (o.dir > 0 ? 'BUY LIMIT' : 'SELL LIMIT')) + ' at ' + N(o.order_price).toFixed(2); }
  function pAway(o, px) { if (px == null) return null; return (N(px) - N(o.order_price)) * (o.dir > 0 ? 1 : -1); }   // positive = the market is still on the far side of the order
  function pStory(o) {
    var a = [], ap = pAway(o, o.price_at_place), cl = pAway(o, o.closest_price), st = o.status, ea = pAway(o, o.end_price);
    if (o.price_at_place != null) a.push('Placed when the market was ' + N(o.price_at_place).toFixed(2) + (ap != null ? ', ' + Math.abs(ap).toFixed(2) + (ap >= 0 ? ' away from the order price' : ' beyond the order price') : '') + '.');
    if (o.closest_price != null) a.push((st === 'pending' ? 'So far the market came as close as ' : 'The market came as close as ') + N(o.closest_price).toFixed(2) + (cl != null ? ' (' + Math.max(0, cl).toFixed(2) + ' from filling)' : '') + (o.closest_at ? ' at ' + pTime(o.closest_at) : '') + '.');
    if (st === 'filled') a.push('The order was filled' + (o.ended_at ? ' at ' + pTime(o.ended_at) : '') + ' and became a trade.');
    else if (st === 'expired') a.push('It expired' + (o.ended_at ? ' at ' + pTime(o.ended_at) : '') + ' without being filled' + (o.end_price != null ? ', with the market at ' + N(o.end_price).toFixed(2) + (ea != null ? ' (' + Math.abs(ea).toFixed(2) + (ea >= 0 ? ' away' : ' past the order') + ')' : '') : '') + '.');
    else if (st === 'cancelled') a.push('The EA cancelled it' + (o.ended_at ? ' at ' + pTime(o.ended_at) : '') + (o.end_reason ? ' (' + o.end_reason + ')' : '') + (o.end_price != null ? ', with the market at ' + N(o.end_price).toFixed(2) : '') + '.');
    else a.push(o.expires_at ? 'It waits until ' + pTime(o.expires_at) + ' and is then cancelled if not filled.' : 'It waits until it is filled or cancelled.');
    return a.join(' ');
  }
  function pHead(o) {
    var cl = pAway(o, o.closest_price), cs = cl != null ? Math.max(0, cl).toFixed(2) : null, st = o.status;
    if (st === 'filled') return 'Filled and became a trade' + (o.ended_at ? ' at ' + pTime(o.ended_at) : '') + '.';
    if (st === 'expired') return 'Missed' + (cs != null ? ': the market came within ' + cs + ' of the order' : '') + (o.end_price != null ? ', then ended at ' + N(o.end_price).toFixed(2) : '') + '. It expired without a fill.';
    if (st === 'cancelled') return 'Cancelled by the EA' + (cs != null ? '; the market came within ' + cs + ' of it' : '') + '.';
    return 'Waiting' + (cs != null ? ': the market has come within ' + cs + ' of the order so far' : '') + (o.expires_at ? '. Expires ' + pTime(o.expires_at) + '.' : '.');
  }
  function pLadder(o) {      // the prices that matter, highest first, so you can see where the market was against the order
    var pts = [['Market when placed', o.price_at_place, 'var(--muted)'], ['Order price', o.order_price, 'var(--gold)'], ['Closest the market came', o.closest_price, 'var(--mint)'], [o.status === 'pending' ? 'Market at last update' : 'Market when it ended', o.end_price, 'var(--blue-hi)'], ['Stop-loss if filled', o.sl, 'var(--red)']].filter(function (x) { return x[1] != null; });
    if (!pts.length) return ''; pts.sort(function (a, b) { return N(b[1]) - N(a[1]); });
    return '<div class="acg-lad">' + pts.map(function (x) { return '<div><i style="background:' + x[2] + '"></i><span>' + E(x[0]) + '</span><b>' + N(x[1]).toFixed(2) + '</b></div>'; }).join('') + '</div>';
  }
  function pSheet(o) {
    var s = PST[o.status] || [o.status, ''], sp = explain(pName(o), (o.engine === 'D' ? 'Gamma' : (R().ENG[o.engine] || o.engine)) + ' pending order - ' + s[0], [
      ['Status', s[0], s[1]], ['Lots', o.lots != null ? N(o.lots).toFixed(2) : '-'], ['Placed', pTime(o.placed_at)], ['Expires', pTime(o.expires_at)],
      ['Closest approach at', o.closest_at ? pTime(o.closest_at) : '-'], ['Ended', o.ended_at ? pTime(o.ended_at) : '-']], '', []);
    sp.html = '<p class="gs-head">' + E(pHead(o)) + '</p>' + pLadder(o) + sp.html + (o.end_reason ? '<p class="gs-fine">' + E(o.end_reason) + '</p>' : '');
    return sp;
  }
  function pendingParts() {
    var P = arr(M().pending).slice().sort(function (a, b) { return new Date(b.placed_at) - new Date(a.placed_at); }); if (!P.length) return null;
    var f = [], wait = P.filter(function (o) { return o.status === 'pending'; }), done = P.filter(function (o) { return o.status !== 'pending'; });
    wait.slice(0, 2).forEach(function (o) { f.push(fact('info', (o.engine === 'D' ? 'Gamma ' : '') + 'order waiting: ' + pName(o), (o.price_at_place != null ? 'Placed with the market at ' + N(o.price_at_place).toFixed(2) + '. ' : '') + (o.closest_price != null ? 'Closest so far ' + N(o.closest_price).toFixed(2) + '. ' : '') + (o.expires_at ? 'Expires ' + pTime(o.expires_at) + '.' : ''), function () { open(pSheet(o)); })); });
    var L = done[0]; if (L) { var ls = pStory(L); f.push(fact(L.status === 'filled' ? 'ok' : 'info', 'Last order ' + (PST[L.status] || [L.status])[0].toLowerCase() + ': ' + pName(L), ls.length > 150 ? ls.slice(0, 150) + '...' : ls, function () { open(pSheet(L)); })); }
    var by = {}; P.forEach(function (o) { (by[o.status] = by[o.status] || []).push(o); });
    var items = Object.keys(PST).filter(function (k) { return by[k]; }).map(function (k) { return {label: PST[k][0], value: by[k].length, color: PST[k][1], sheet: function () { return explain(PST[k][0] + ' orders', plural(by[k].length, 'order'), by[k].slice(0, 12).map(function (o) { return [pName(o), pTime(o.placed_at)]; }), 'Open the bar chart and tap an order for its full story.', []); }}; });
    var rows = P.slice(0, 12).map(function (o) { var s = PST[o.status] || [o.status, '']; return {label: pName(o) + ' - ' + pTime(o.placed_at), value: o.closest_price != null ? Math.max(0, pAway(o, o.closest_price)) : 0, color: s[1], sheet: function () { return pSheet(o); }}; });
    return {facts: f, cards: [
      card('Pending orders', 'Each order the EA placed and waited for, and how it ended. Tap a slice for the orders.', donut(items, {title: 'Orders', center: P.length, centerLabel: 'orders'}), 'needs pending orders'),
      card('How close each order came', 'Distance between the nearest market price and the order price. Zero means it reached it. Tap a bar for the full story.', hbars(rows, {title: 'Closest approach', fmt: function (v) { return v.toFixed(2); }, share: false}), 'needs pending orders')]};
  }

  B.trades = function () {
    var c = ctx(); if (!c) return null; var all = c.all, f = [], pp = pendingParts();
    if (!all.length) return {title: 'What matters here', facts: (pp ? pp.facts : []).concat([fact('info', 'No closed trades yet', 'Trades appear here as soon as the EA closes its first one.')]), cards: pp ? pp.cards : [card('Last trades', '', '', 'needs trades')]};
    var last = all.slice().sort(function (a, b) { return new Date(b.closed_at) - new Date(a.closed_at); }), L = last[0], s = R().stats(all);
    f.push(fact(L.profit >= 0 ? 'ok' : 'warn', 'Last trade ' + sgn(L.profit), (L.dir > 0 ? 'BUY' : 'SELL') + ' closed ' + ago(L.closed_at) + '. Tap for entry, exit and why it closed.', function () { window.gteSheet && window.gteSheet.trade(L); }));
    f.push(fact('info', plural(s.n, 'trade') + ' closed, ' + s.win.toFixed(0) + '% won', 'Average time in a trade ' + (s.avgHold == null ? '-' : R().fmtMin(s.avgHold)) + '. Net ' + sgn(s.net) + '.', sel('allnet')));
    var best = last.slice().sort(function (a, b) { return b.profit - a.profit; })[0]; if (best && best.profit > 0) f.push(fact('ok', 'Best trade ' + sgn(best.profit), 'Closed ' + new Date(best.closed_at).toLocaleDateString([], {day: 'numeric', month: 'short', year: 'numeric'}) + '.', function () { window.gteSheet.trade(best); }));
    var recent = last.slice(0, 40).reverse().map(function (t) { return {label: new Date(t.closed_at).toLocaleString([], {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}), short: new Date(t.closed_at).toLocaleDateString([], {day: 'numeric', month: 'short'}), value: N(t.profit), sheet: function () { return {k: 'trade', t: t, day: true, title: 'Trade details', sub: new Date(t.closed_at).toLocaleString()}; }}; });
    if (pp) f = pp.facts.concat(f);
    return {title: 'What matters here', facts: f, cards: [card('Your last ' + recent.length + ' trades', 'Each bar is one trade: green won, red lost. Tap a bar for its details.', bars(recent, {title: 'Last trades', labels: 6}), 'needs trades', true)].concat(pp ? pp.cards : [])};
  };

  B.billing = function () {
    var c = ctx(); if (!c) return null; var m = c.m, facts = accountFacts(c), orders = arr(m.orders), plans = arr(m.plans).filter(function (p) { return p.active !== false; }), lic = c.lic;
    var wait = orders.filter(function (o) { return o.status === 'paid_claimed' || o.status === 'pending'; });
    if (wait.length) facts.unshift(fact('warn', plural(wait.length, 'order') + ' not confirmed yet', 'We confirm payments by hand, usually within a few hours. Write to support if it takes longer.', function () { open(explain('Orders waiting', plural(wait.length, 'order'), wait.map(function (o) { return [o.ref + ' - ' + o.kind, usd(o.amount_usd, 2) + ' - ' + String(o.status).replace('_', ' ')]; }), 'Payments are confirmed after we receive your money.', [])); }));
    var up = plans.filter(function (p) { return N(p.price_usd) > N(c.pl.price_usd); }).sort(function (a, b) { return N(a.price_usd) - N(b.price_usd); })[0];
    if (up && c.allowed && pct(c.funded, c.allowed) > 70) facts.push(fact('info', 'Next plan: ' + up.name + ' covers ' + usd(up.limit_usd), 'It costs ' + usd(up.price_usd) + '. Upgrade before you add more money.', function () { open(explain(up.name + ' plan', 'The next step up', [['Price', usd(up.price_usd)], ['Covers deposits up to', usd(up.limit_usd)], ['Your plan now', (c.pl.name || '-') + ' (' + usd(c.pl.limit_usd) + ')']], 'Only deposits minus withdrawals count towards the limit. Profits never do.', [])); }));
    var stat = {}; orders.forEach(function (o) { var k = o.status === 'paid_claimed' ? 'To confirm' : o.status === 'pending' ? 'Not paid' : o.status === 'paid' ? 'Paid' : o.status; (stat[k] = stat[k] || []).push(o); });
    var stI = Object.keys(stat).map(function (k) { return {label: k, value: stat[k].length, color: {Paid: 'var(--mint)', 'To confirm': 'var(--gold)', 'Not paid': 'var(--faint)'}[k], sheet: function () { return explain(k + ' orders', plural(stat[k].length, 'order'), stat[k].map(function (o) { return [o.ref + ' - ' + o.kind, usd(o.amount_usd, 2) + ' - ' + dstr(o.created_at)]; }), '', []); }}; });
    var mo = {}; orders.filter(function (o) { return o.status === 'paid'; }).forEach(function (o) { var k = String(o.confirmed_at || o.created_at).slice(0, 7); mo[k] = (mo[k] || 0) + N(o.amount_usd); });
    var moI = Object.keys(mo).sort().map(function (k) { return {label: k, short: k.slice(2), value: mo[k], sheet: function () { var l = orders.filter(function (o) { return o.status === 'paid' && String(o.confirmed_at || o.created_at).slice(0, 7) === k; }); return explain('Paid in ' + k, usd(mo[k], 2), l.map(function (o) { return [o.ref + ' - ' + o.kind, usd(o.amount_usd, 2)]; }), '', []); }}; });
    var plI = plans.map(function (p) { return {label: p.name + (p.id === lic.plan_id ? ' (yours)' : ''), value: N(p.limit_usd), color: p.id === lic.plan_id ? 'var(--mint)' : 'var(--blue-hi)', sheet: function () { return explain(p.name + ' plan', p.id === lic.plan_id ? 'Your plan' : 'Another plan', [['Price', usd(p.price_usd)], ['Covers deposits up to', usd(p.limit_usd)], ['Price per $1000 covered', usd(N(p.price_usd) / Math.max(1, N(p.limit_usd)) * 1000, 2)]], 'Only deposits minus withdrawals count towards the limit. Profits never do.', []); }}; });
    return {title: 'What matters for your license', facts: facts, cards: [card('What each plan covers', 'Deposit limit per plan. Your plan is green.', hbars(plI, {title: 'Plans', fmt: function (v) { return usd(v); }, share: false}), 'plan list'), card('Your orders', 'Paid, waiting or not paid.', donut(stI, {title: 'Orders', center: orders.length, centerLabel: 'orders'}), 'needs an order'), card('What you paid', 'Confirmed payments by month.', moI.length ? bars(moI, {title: 'Payments', fmt: function (v) { return usd(v, 2); }, color: 'var(--gold)', labels: 8}) : '', 'needs a paid order')]};
  };

  /* ================================================================ wiring */
  var pending = 0; function schedule() { clearTimeout(pending); pending = setTimeout(inject, 160); }
  function tabKey() { var a = $('#subnav a.on[data-tab]') || $('#subnav a[aria-current][data-tab]'); if (a) return a.dataset.tab; var m = /tab=([a-z]+)/.exec(location.hash); return m ? m[1] : 'overview'; }
  function inject() {
    var tb = $('#tabbody'); if (!tb || !tb.firstElementChild || !M() || !R()) return; var key = tabKey(); if (!B[key] || tb.querySelector('#acg-' + key)) return;
    var m; try { m = B[key](); } catch (e) { if (window.console) console.warn('account charts: ' + key, e); return; } if (!m) return;
    var facts = arr(m.facts), cards = arr(m.cards).filter(Boolean), real = cards.filter(function (x) { return !x.empty; }), empty = cards.filter(function (x) { return x.empty; }); if (!facts.length && !real.length) return;
    var box = document.createElement('div'); box.id = 'acg-' + key; box.className = 'acg'; var open_ = true; try { open_ = localStorage.getItem('gte_acg_' + key) !== 'c'; } catch (e) {}
    box.innerHTML = '<div class="acg-hd"><h3>' + E(m.title) + '</h3><button type="button" class="acg-tg" data-acg-t>' + (open_ ? 'Hide' : 'Show') + '</button></div><div class="acg-bd"' + (open_ ? '' : ' hidden') + '>' +
      (facts.length ? '<div class="acg-i">' + facts.map(function (i, k) { return '<button type="button" class="t-' + (i.tone || 'info') + '" data-af="' + k + '"><i>' + (TONE[i.tone || 'info'] || 'i') + '</i><span><strong>' + E(i.title) + '</strong>' + (i.text ? '<small>' + E(i.text) + '</small>' : '') + '</span></button>'; }).join('') + '</div>' : '') +
      (real.length ? '<div class="acg-gr">' + real.map(function (x) { return x.html; }).join('') + '</div>' : '') +
      (empty.length ? '<p class="hint acg-e"><b>More charts appear with data:</b> ' + empty.map(function (x) { return E(x.title) + (x.hint ? ' (' + E(x.hint) + ')' : ''); }).join(' &middot; ') + '</p>' : '') + '</div>';
    tb.insertBefore(box, tb.firstElementChild);
    $('[data-acg-t]', box).onclick = function () { var bd = $('.acg-bd', box), h = !bd.hidden; bd.hidden = h; this.textContent = h ? 'Show' : 'Hide'; try { localStorage.setItem('gte_acg_' + key, h ? 'c' : 'o'); } catch (e) {} };
    $$('[data-af]', box).forEach(function (b) { b.onclick = function () { var i = facts[+b.dataset.af]; if (!i) return; if (typeof i.act === 'function') i.act(); else open(explain(i.title, 'Key fact', [], E(i.text || ''), [])); }; });
  }
  var css = '.acg-lad{margin:6px 0 12px;display:flex;flex-direction:column;gap:6px}.acg-lad div{position:relative;display:flex;align-items:center;gap:8px;font-size:.84rem;padding:7px 10px 7px 24px;border-radius:9px;background:var(--panel-2)}.acg-lad i{position:absolute;left:8px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%}.acg-lad span{flex:1;min-width:0}.acg-lad b{font-variant-numeric:tabular-nums}.gs-head{margin:0 0 6px;font-size:14px;font-weight:600;line-height:1.4}' +
    '.acg{margin:0 0 18px}.acg-hd{display:flex;align-items:center;gap:10px;margin:0 0 10px}.acg-hd h3{margin:0;font-size:1.02rem}.acg-tg{margin-left:auto;font:inherit;font-size:.78rem;color:var(--muted);background:var(--panel-2);border:1px solid var(--line-2);border-radius:999px;padding:5px 12px;cursor:pointer}' +
    '.acg-i{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px}.acg-i button{display:flex;gap:11px;align-items:flex-start;text-align:left;font:inherit;color:var(--fg);background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--tone,var(--blue-hi));border-radius:14px;padding:11px 13px;cursor:pointer;transition:transform .15s,border-color .2s}.acg-i button:hover{transform:translateY(-2px);border-color:var(--tone,var(--blue-hi))}' +
    '.acg-i i{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:.8rem;color:#fff;background:var(--tone,var(--blue-hi))}.acg-i strong{display:block;font-size:.88rem;line-height:1.3}.acg-i small{display:block;color:var(--muted);font-size:.76rem;margin-top:2px;line-height:1.4}' +
    '.acg-i .t-bad{--tone:var(--red)}.acg-i .t-warn{--tone:var(--gold)}.acg-i .t-ok{--tone:var(--mint)}.acg-i .t-info{--tone:var(--blue-hi)}.acg-i .t-mute{--tone:var(--faint)}' +
    '.acg-gr{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.acg-c{min-width:0;padding:18px 18px 14px}.acg-c h3{margin:0 0 2px;font-size:.98rem}.acg-w{grid-column:1/-1}.acg-f{margin-top:10px;font-size:.72rem;color:var(--muted);opacity:.85}.acg-e{margin-top:12px}.acg-c .hint{margin:0 0 10px;font-size:.8rem}' +
    '.acg-d{display:grid;grid-template-columns:128px 1fr;gap:12px;align-items:center}@media(max-width:480px){.acg-d{grid-template-columns:1fr}.acg-d svg{max-width:160px;margin:0 auto}}.acg-d svg{width:100%}' +
    '.acg-t1{font-weight:700;font-family:inherit;fill:var(--fg)}.acg-t2{font-size:5.5px;font-weight:500;font-family:inherit;fill:var(--muted)}.acg-t3{font-size:8px;font-weight:500;font-family:inherit;fill:var(--muted)}.acg-g0{stroke:var(--line-2);stroke-width:.6;stroke-dasharray:3 3}' +
    '.acg-s{cursor:pointer;transition:stroke-width .15s}circle.acg-s:hover{stroke-width:17}rect.acg-s:hover{fill:var(--blue-hi);fill-opacity:.14}' +
    '.acg-l,.acg-h{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;min-width:0}.acg-l button,.acg-h button{display:flex;align-items:center;gap:9px;width:100%;font:inherit;font-size:.82rem;color:var(--fg);background:none;border:0;border-radius:9px;padding:7px 8px;cursor:pointer;text-align:left}.acg-l button:hover,.acg-h button:hover{background:var(--panel-2)}' +
    '.acg-l i{flex:none;width:10px;height:10px;border-radius:3px}.acg-l span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.acg-l b,.acg-h b{font-variant-numeric:tabular-nums}.acg-l em,.acg-h em{font-style:normal;color:var(--muted);font-size:.72rem;min-width:40px;text-align:right}' +
    '.acg-n{flex:0 0 38%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.acg-k{flex:1;height:8px;background:var(--panel-2);border-radius:6px;overflow:hidden}.acg-k i{display:block;height:100%;border-radius:6px}.acg-b{width:100%;height:auto;display:block}' +
    '.acg-gr2{display:flex;gap:18px;flex-wrap:wrap;justify-content:space-around}.acg-ga{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:var(--fg);font:inherit;cursor:pointer;width:150px}.acg-ga svg{width:110px}.acg-ga span{font-size:.76rem;color:var(--muted);text-align:center;line-height:1.35}';
  var st = document.createElement('style'); st.id = 'acg-css'; st.textContent = css; document.head.appendChild(st);
  var root = $('#acct') || document.body; if (window.MutationObserver) new MutationObserver(schedule).observe(root, {childList: true, subtree: true});
  addEventListener('hashchange', schedule); schedule(); setTimeout(schedule, 1500); setTimeout(schedule, 4000);
})();
