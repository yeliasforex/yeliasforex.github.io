/* Detail sheets for My account: tap a calendar day, a week, a tile, a bar, a chart point, a table row... and see the trades behind it
   (buy or sell, entry and exit, stop or target, result, time held). Uses only the customer's own closed trades. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  function R() { return window.gteResults; }
  function M() { return window.GTE_MA || {}; }
  function all() { return M().trades || []; }
  function rng(a) { var m = M(); return m.rng ? m.rng(a) : a; }
  function dk(d) { var x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function sgn(v, d) { return R().sgn(v, d); } function col(v) { return R().col(v); }
  function usd(v, d) { return R().usd(v, d); }
  function dayName(k) { return new Date(k + 'T12:00:00').toLocaleDateString([], {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'}); }
  function tm(d) { return new Date(d).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}); }
  function dt(d) { return new Date(d).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}); }
  function holdMin(t) { return t.opened_at ? Math.max(0, (new Date(t.closed_at) - new Date(t.opened_at)) / 6e4) : null; }
  var EXIT = {stop: ['Stop-loss hit', 'red', 'The price reached the stop, so the EA’s protection closed the trade.'], target: ['Take-profit hit', 'mint', 'The price reached the target, so the trade closed with its planned profit.'], closed: ['Closed by the EA', 'faint', 'The EA closed this trade itself (for example to protect the result or on its exit rules).']};
  function exitOf(t) { return EXIT[t.exit_reason] || (t.exit_reason ? [String(t.exit_reason), 'faint', ''] : ['Exit not recorded', 'faint', '']); }
  function key(t) { return t.closed_at + '|' + t.lots + '|' + t.profit; }

  /* ---- the sheet itself ---- */
  var stack = [], cur = null, flt = 'all';
  function ensure() {
    injectCss(); var g = $('#gs'); if (g) return g;
    g = document.createElement('div'); g.id = 'gs'; g.className = 'gs';
    g.innerHTML = '<div class="gs-bk"></div><aside class="gs-p" role="dialog" aria-modal="true" aria-label="Details" tabindex="-1"><div class="gs-grab"></div><header class="gs-h"><button type="button" class="gs-back" aria-label="Back" hidden>&#8249;</button><div class="gs-ht"><h3 id="gs-t"></h3><p id="gs-s"></p></div><button type="button" class="gs-x" aria-label="Close">&times;</button></header><div class="gs-sum" id="gs-sum"></div><div class="gs-f" id="gs-f"></div><div class="gs-b" id="gs-b"></div><footer class="gs-ft" id="gs-ft"></footer></aside>';
    document.body.appendChild(g);
    $('.gs-bk', g).onclick = close; $('.gs-x', g).onclick = close; $('.gs-back', g).onclick = back;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#gs.on')) { e.stopImmediatePropagation(); close(); } }, true);
    return g;
  }
  function open(spec) { stack = []; show(spec, true); }
  function push(spec) { if (cur) stack.push(cur); show(spec, false); }
  function back() { var s = stack.pop(); if (s) show(s, false, true); }
  function close() { var g = $('#gs'); if (!g) return; g.classList.remove('on'); document.body.classList.remove('gs-lock'); stack = []; cur = null; }
  function show(spec, first, isBack) {
    var g = ensure(); cur = spec; flt = spec.flt === 'gr' ? 'green' : 'all';
    $('#gs-t').textContent = spec.title || 'Details'; $('#gs-s').textContent = spec.sub || '';
    $('.gs-back', g).hidden = !stack.length;
    render();
    g.classList.add('on'); document.body.classList.add('gs-lock'); var b = $('#gs-b'); if (b) b.scrollTop = 0; if (first) { var p = $('.gs-p', g); p.focus({preventScroll: true}); }
  }

  /* ---- pieces ---- */
  function chips(list) {
    if (!list.length) return '';
    var s = R().stats(list), c = function (l, v, cl) { return '<div class="gs-c"><small>' + l + '</small><b' + (cl ? ' style="color:' + cl + '"' : '') + '>' + v + '</b></div>'; };
    return c('Result', sgn(s.net), col(s.net)) + c('Trades', s.n) + c('Won / lost', s.wins + ' / ' + s.losses) + c('Win rate', s.win.toFixed(0) + '%') + (s.n > 1 ? c('Best', sgn(s.best), 'var(--mint)') + c('Worst', sgn(s.worst), s.worst < 0 ? 'var(--red)' : '') : '');
  }
  /* what the trade went through while it was open: best point, worst point, where the stop ended, and how that led to the close */
  function hasStory(t) { return t.mfe_r != null && t.mae_r != null; }
  function stopWord(t) { var v = t.stop_r; if (v == null) return null; return v <= -0.9 ? 'the original stop' : v > 0.05 ? 'a locked profit of ' + v.toFixed(2) + 'R' : 'breakeven'; }
  function storyLine(t) {      // one plain sentence: the whole story in two seconds
    if (!hasStory(t)) return '';
    var m = Number(t.mfe_r), w = Number(t.mae_r), rr = Number(t.result_r || 0), up = Math.max(0, m), fin = (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R';
    if (m >= 0.3 && rr < m - 0.3) return 'Went up +' + up.toFixed(2) + 'R (' + usd(t.mfe_usd) + '), then came back and closed at ' + fin + '.';
    if (m >= 0.3) return 'Went up +' + up.toFixed(2) + 'R (' + usd(t.mfe_usd) + ') and closed near the top at ' + fin + '.';
    if (rr < -0.05) return 'Went against you almost from the start and closed at ' + fin + '.';
    return 'Stayed close to the entry and closed at ' + fin + '.';
  }
  function storyBlock(t) {
    if (!hasStory(t)) return '<div class="gs-story"><h4>What happened inside this trade</h4><p class="gs-fine">Not recorded. Only trades closed by EA 1.09 or newer carry this; older ones are filled in when the EA re-syncs its history.</p></div>';
    var m = Math.max(0, Number(t.mfe_r)), w = Math.min(0, Number(t.mae_r)), rr = Number(t.result_r || 0), sw = stopWord(t), gave = m >= 0.5 ? Math.max(0, m - rr) : 0, span = Math.max(m - w, .01), sr = t.stop_r == null ? null : Number(t.stop_r);
    var px = function (v) { return Math.max(0, Math.min(100, (v - w) / span * 100)).toFixed(1); };
    var tile = function (l, r, d, c) { return '<div class="gs-tl"><small>' + l + '</small><b style="color:' + c + '">' + r + '</b><em>' + d + '</em></div>'; };
    var more = (t.peak_at ? '<div><span>Best point came</span><b>' + dt(t.peak_at) + (t.opened_at ? ' (' + R().fmtMin(Math.max(0, (new Date(t.peak_at) - new Date(t.opened_at)) / 6e4)) + ' in)' : '') + '</b></div>' : '')
      + (sw ? '<div><span>Stop when closed</span><b>' + sw + '</b></div>' : '') + (t.risk_usd != null ? '<div><span>Risked (1R)</span><b>' + usd(t.risk_usd) + '</b></div>' : '');
    return '<div class="gs-story"><h4>What happened inside this trade</h4><p class="gs-head">' + storyLine(t) + '</p>'
      + '<div class="gs-rail"><span class="lo" style="left:0;width:' + px(0) + '%"></span><span class="hi" style="left:' + px(0) + '%;right:0"></span>' + (sr != null && sr >= w && sr <= m ? '<u style="left:' + px(sr) + '%" title="Stop"></u>' : '') + '<i class="n" style="left:' + px(0) + '%"></i><i class="r" style="left:' + px(rr) + '%"></i></div>'
      + '<div class="gs-rl"><span style="color:var(--red)">worst</span><span>entry</span><span style="color:var(--gold)">closed</span><span style="color:var(--mint)">best</span></div>'
      + '<div class="gs-tls">' + tile('Best', '+' + m.toFixed(2) + 'R', usd(t.mfe_usd) + (t.mfe_pips != null ? ' &middot; ' + Number(t.mfe_pips).toFixed(0) + ' pips' : ''), 'var(--mint)')
      + tile('Worst', w.toFixed(2) + 'R', usd(t.mae_usd) + (t.mae_pips != null ? ' &middot; ' + Number(t.mae_pips).toFixed(0) + ' pips' : ''), w < -0.05 ? 'var(--red)' : 'inherit')
      + tile('Closed', (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R', usd(t.profit), col(t.profit)) + '</div>'
      + '<div class="gs-chips">' + (gave > 0.3 ? '<span class="gs-chip bad">Gave back ' + gave.toFixed(2) + 'R from the peak</span>' : m >= 0.5 ? '<span class="gs-chip ok">Kept most of the peak</span>' : '') + (sw ? '<span class="gs-chip">Stop: ' + sw + '</span>' : '') + '</div>'
      + (more ? '<details class="gs-more2"><summary>More details</summary><div class="gs-kv">' + more + '</div></details>' : '') + '</div>';
  }
  function injectCss() {
    if ($('#gs-story-css')) return; var st = document.createElement('style'); st.id = 'gs-story-css';
    st.textContent = '.gs-story{margin-top:12px;padding-top:10px;border-top:1px solid var(--line,rgba(255,255,255,.12))}.gs-story h4{margin:0 0 8px;font-size:13px;font-weight:700}'
      + '.gs-rail{position:relative;height:10px;border-radius:5px;background:rgba(255,255,255,.07);margin:6px 0 2px}.gs-rail .lo,.gs-rail .hi{position:absolute;top:3px;height:4px;border-radius:2px}.gs-rail .lo{background:var(--red,#ff5d6c);opacity:.7}.gs-rail .hi{background:var(--mint,#3ddc97);opacity:.7}'
      + '.gs-rail i{position:absolute;top:-3px;width:2px;height:16px;margin-left:-1px;border-radius:1px}.gs-rail i.n{background:rgba(255,255,255,.55)}.gs-rail i.r{background:var(--gold,#f5c451);width:4px;margin-left:-2px;top:-4px;height:18px}'
      + '.gs-rl{display:flex;justify-content:space-between;font-size:11px;opacity:.7;margin-bottom:8px}.gs-story .gs-kv{margin:6px 0}'
      + '.gs-head{margin:0 0 6px;font-size:14px;font-weight:600;line-height:1.4}.gs-rail u{position:absolute;top:-2px;height:14px;border-left:2px dashed rgba(255,255,255,.7)}'
      + '.gs-tls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 8px}.gs-tl{background:rgba(255,255,255,.05);border-radius:10px;padding:8px 9px;min-width:0}.gs-tl small{display:block;font-size:11px;opacity:.7}.gs-tl b{display:block;font-size:16px;margin:1px 0}.gs-tl em{display:block;font-style:normal;font-size:11px;opacity:.75;overflow-wrap:anywhere}'
      + '.gs-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.gs-chip{font-size:11.5px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.08)}.gs-chip.bad{background:rgba(255,93,108,.18);color:var(--red,#ff5d6c)}.gs-chip.ok{background:rgba(61,220,151,.16);color:var(--mint,#3ddc97)}'
      + '.gs-more2 summary{cursor:pointer;font-size:12px;opacity:.8;padding:4px 0}'
      + '.gs-hint{font-size:12px;opacity:.75;margin:6px 0 0}';
    document.head.appendChild(st);
  }
  function tradeCard(t, big) {
    var win = t.profit > 0, loss = t.profit < 0, ex = exitOf(t), hm = holdMin(t), mv = (Number(t.close_price) - Number(t.open_price)) * t.dir, eng = R().ENG[t.engine] || '', ec = R().ECL[t.engine] || 'var(--blue-hi)';
    var side = t.dir > 0 ? 'BUY' : 'SELL', rr = Number(t.result_r || 0);
    var sentence = side + ' ' + Number(t.lots).toFixed(2) + ' lots' + (t.symbol ? ' of ' + esc(t.symbol) : ' of gold') + ', opened ' + (t.opened_at ? dt(t.opened_at) : 'earlier') + ' at ' + Number(t.open_price).toFixed(2) + ', closed ' + dt(t.closed_at) + ' at ' + Number(t.close_price).toFixed(2) + '. The price moved ' + (mv >= 0 ? 'in your favour by ' : 'against you by ') + Math.abs(mv).toFixed(2) + '.';
    return '<div class="gs-t ' + (win ? 'w' : loss ? 'l' : 'z') + (big ? ' big' : '') + '"><div class="gs-t1"><span class="gs-side ' + (t.dir > 0 ? 'b' : 's') + '">' + side + '</span><span class="gs-eng" style="--c:' + ec + '">' + esc(eng) + (t.is_add ? ' add-on' : '') + '</span><span class="gs-time">' + (t.opened_at ? dt(t.opened_at) + ' &rarr; ' : '') + tm(t.closed_at) + '</span><b class="gs-res" style="color:' + col(t.profit) + '">' + sgn(t.profit) + '</b></div>'
      + '<div class="gs-t2"><div><small>Entry</small><b>' + Number(t.open_price).toFixed(2) + '</b></div><div class="gs-arw ' + (mv >= 0 ? 'up' : 'dn') + '"><i></i><em>' + (mv >= 0 ? '+' : '') + mv.toFixed(2) + '</em></div><div><small>Exit</small><b>' + Number(t.close_price).toFixed(2) + '</b></div><div><small>Lots</small><b>' + Number(t.lots).toFixed(2) + '</b></div><div><small>Result</small><b>' + (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R</b></div><div><small>Held</small><b>' + (hm == null ? '-' : R().fmtMin(hm)) + '</b></div></div>'
      + '<div class="gs-t3"><span class="gs-ex ' + ex[1] + '">' + esc(ex[0]) + '</span><span class="gs-out ' + (win ? 'w' : loss ? 'l' : 'z') + '">' + (win ? 'WIN' : loss ? 'LOSS' : 'FLAT') + '</span></div>'
      + (big ? '<p class="gs-sent">' + sentence + ' ' + esc(ex[2]) + '</p><p class="gs-fine">One R is the amount the EA risked on this trade; ' + (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R means this trade ' + (rr >= 0 ? 'earned ' : 'lost ') + Math.abs(rr).toFixed(2) + ' times that risk.</p>' + storyBlock(t) : (hasStory(t) ? '<p class="gs-hint">Best +' + Math.max(0, Number(t.mfe_r)).toFixed(2) + 'R &middot; worst ' + Math.min(0, Number(t.mae_r)).toFixed(2) + 'R' + (stopWord(t) ? ' &middot; stop at ' + stopWord(t) : '') + '</p>' : '')) + '</div>';
  }
  function tradesBody(list, group) {
    list = list.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); });
    if (flt === 'win') list = list.filter(function (t) { return t.profit > 0; }); else if (flt === 'loss') list = list.filter(function (t) { return t.profit < 0; });
    if (!list.length) return '<div class="gs-empty">No trades here.</div>';
    var cap = 150, more = list.length > cap; if (more) list = list.slice(-cap);
    if (!group) return list.map(function (t) { return tradeCard(t); }).join('') + (more ? '<p class="gs-fine">Showing the latest ' + cap + ' trades. Download the CSV for all of them.</p>' : '');
    var by = {}, order = []; list.forEach(function (t) { var k = dk(t.closed_at); if (!by[k]) { by[k] = []; order.push(k); } by[k].push(t); });
    return order.map(function (k) { var l = by[k], net = l.reduce(function (a, t) { return a + t.profit; }, 0); return '<button type="button" class="gs-day" data-gday="' + k + '"><span>' + dayName(k) + '</span><em>' + l.length + ' trade' + (l.length > 1 ? 's' : '') + '</em><b style="color:' + col(net) + '">' + sgn(net) + '</b><i>&rsaquo;</i></button>' + l.map(function (t) { return tradeCard(t); }).join(''); }).join('') + (more ? '<p class="gs-fine">Showing the latest ' + cap + ' trades. Download the CSV for all of them.</p>' : '');
  }
  function daysBody(days) {
    var list = days.slice(); if (flt === 'green') list = list.filter(function (d) { return d.v >= 0; }); else if (flt === 'red') list = list.filter(function (d) { return d.v < 0; });
    list.sort(function (a, b) { return a.key < b.key ? -1 : 1; }); if (!list.length) return '<div class="gs-empty">No days here.</div>';
    var mx = Math.max.apply(null, list.map(function (d) { return Math.abs(d.v); }).concat([1]));
    return list.map(function (d) { return '<button type="button" class="gs-dr" data-gday="' + d.key + '"><span class="gs-dn">' + dayName(d.key) + '<small>' + d.n + ' trade' + (d.n > 1 ? 's' : '') + '</small></span><span class="gs-bar"><i class="' + (d.v < 0 ? 'neg' : '') + '" style="width:' + Math.max(3, Math.abs(d.v) / mx * 100) + '%"></i></span><b style="color:' + col(d.v) + '">' + sgn(d.v) + '</b><i class="gs-ch">&rsaquo;</i></button>'; }).join('');
  }
  function daysOf(list) { var m = {}; list.forEach(function (t) { var k = dk(t.closed_at), o = m[k] || (m[k] = {key: k, v: 0, n: 0}); o.v += t.profit; o.n++; }); return Object.keys(m).map(function (k) { return m[k]; }); }
  function render() {
    var s = cur, b = $('#gs-b'), sum = $('#gs-sum'), f = $('#gs-f'), ft = $('#gs-ft'); f.innerHTML = ''; ft.innerHTML = '';
    if (s.k === 'explain') { sum.innerHTML = ''; b.innerHTML = s.html; wireBody(); return; }
    if (s.k === 'trade') { sum.innerHTML = ''; b.innerHTML = tradeCard(s.t, true) + (s.day ? '<button type="button" class="gs-more" data-gday="' + dk(s.t.closed_at) + '">All trades that day</button>' : ''); wireBody(); return; }
    var list = s.list || (s.days ? [] : []);
    if (s.k === 'days') {
      sum.innerHTML = ''; if (s.flt === 'gr') f.innerHTML = '<div class="gs-seg">' + [['green', 'Green days'], ['red', 'Red days'], ['all', 'All']].map(function (x) { return '<button type="button" data-f="' + x[0] + '" class="' + (flt === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
      b.innerHTML = (s.note ? '<p class="gs-fine" style="margin-top:0">' + esc(s.note) + '</p>' : '') + daysBody(s.days); wireBody(); wireFlt(); return;
    }
    sum.innerHTML = chips(list);
    f.innerHTML = '<div class="gs-seg">' + [['all', 'All'], ['win', 'Wins'], ['loss', 'Losses']].map(function (x) { return '<button type="button" data-f="' + x[0] + '" class="' + (flt === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    b.innerHTML = (s.note ? '<p class="gs-fine" style="margin-top:0">' + esc(s.note) + '</p>' : '') + tradesBody(list, s.group);
    ft.innerHTML = '<button type="button" class="btn sm" id="gs-csv">Download CSV</button>'; $('#gs-csv').onclick = function () { csv(list, s.title); };
    wireBody(); wireFlt();
  }
  function wireFlt() { $$('#gs-f [data-f]').forEach(function (b) { b.onclick = function () { flt = b.dataset.f; render(); }; }); }
  function wireBody() { $$('#gs-b [data-gday]').forEach(function (b) { b.onclick = function () { push(daySpec(b.dataset.gday)); }; }); $$('#gs-b [data-gsel]').forEach(function (b) { b.onclick = function () { var sp = selSpec(b.dataset.gsel); if (sp) push(sp); }; }); }
  function csv(list, name) {
    var rows = [['Closed', 'Opened', 'Engine', 'Side', 'Lots', 'Entry', 'Exit', 'Result USD', 'R', 'Exit']].concat(list.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }).map(function (t) { return [new Date(t.closed_at).toISOString(), t.opened_at ? new Date(t.opened_at).toISOString() : '', R().ENG[t.engine] || '', t.dir > 0 ? 'BUY' : 'SELL', t.lots, t.open_price, t.close_price, t.profit, t.result_r, t.exit_reason || '']; }));
    var txt = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], {type: 'text/csv'})); a.download = 'goldtriengine-' + String(name || 'trades').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---- specs: what each tap opens ---- */
  function daySpec(k) { var l = all().filter(function (t) { return dk(t.closed_at) === k; }), n = l.reduce(function (a, t) { return a + t.profit; }, 0); return {k: 'trades', title: dayName(k), sub: l.length ? (n >= 0 ? 'A green day' : 'A red day') + ': ' + sgn(n) + ' from ' + l.length + ' closed trade' + (l.length > 1 ? 's' : '') : 'No closed trades on this day', list: l}; }
  function monthSpec(ym) { var l = all().filter(function (t) { return dk(t.closed_at).slice(0, 7) === ym; }); return {k: 'trades', title: new Date(ym + '-02').toLocaleDateString([], {month: 'long', year: 'numeric'}), sub: 'Every closed trade of the month, day by day. Tap a day for its details.', list: l, group: true}; }
  function explain(title, sub, rows, links, text) {
    return {k: 'explain', title: title, sub: sub, html: (text ? '<p class="gs-lead">' + text + '</p>' : '') + '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + r[1] + '</b></div>'; }).join('') + '</div>' + (links || []).map(function (l) { return '<button type="button" class="gs-more" data-gsel="' + l[0] + '">' + l[1] + '</button>'; }).join('')};
  }
  function ddSegment(t) {
    var s = t.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }), c = 0, peak = 0, pi = -1, best = {dd: 0, from: -1, to: -1};
    s.forEach(function (x, i) { c += x.profit; if (c > peak) { peak = c; pi = i; } var dd = peak - c; if (dd > best.dd) best = {dd: dd, from: pi, to: i}; });
    return {dd: best.dd, list: best.dd > 0 ? s.slice(best.from + 1, best.to + 1) : []};
  }
  function streakList(t, sign) { var s = t.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }), best = [], run = []; s.forEach(function (x) { var g = x.profit > 0 ? 1 : x.profit < 0 ? -1 : 0; if (g === sign) { run.push(x); if (run.length > best.length) best = run.slice(); } else run = []; }); return best; }
  function curStreak(t) { var s = t.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }), out = [], sign = 0; for (var i = s.length - 1; i >= 0; i--) { var g = s[i].profit > 0 ? 1 : s[i].profit < 0 ? -1 : 0; if (!g) break; if (!sign) sign = g; if (g !== sign) break; out.unshift(s[i]); } return {sign: sign, list: out}; }
  function selSpec(sel, ctx) {
    var T = rng(all()), st = R().stats(T), p = sel.split(':'), k = p[0], wins = T.filter(function (t) { return t.profit > 0; }), losses = T.filter(function (t) { return t.profit < 0; }), gp = wins.reduce(function (a, t) { return a + t.profit; }, 0), gl = -losses.reduce(function (a, t) { return a + t.profit; }, 0);
    var by = function (l, f) { return l.slice().sort(f); };
    switch (k) {
      case 'net': return {k: 'days', title: 'Net result', sub: 'Day by day, for the selected period. Tap a day for its trades.', days: daysOf(T), flt: 'gr'};
      case 'win': case 'winloss': return {k: 'trades', title: 'Wins and losses', sub: st.wins + ' winning and ' + st.losses + ' losing trades in this period.', list: T, group: true};
      case 'wins': return {k: 'trades', title: 'Winning trades', sub: st.wins + ' trades closed in profit.', list: wins, group: true, flt0: 'win'};
      case 'losses': return {k: 'trades', title: 'Losing trades', sub: st.losses + ' trades closed at a loss. Every loss is limited by a stop.', list: losses, group: true};
      case 'avgwin': return {k: 'trades', title: 'Average win ' + sgn(st.avgWin), sub: 'The average is the total of the winning trades divided by their number.', list: wins, group: true};
      case 'avgloss': return {k: 'trades', title: 'Average loss ' + sgn(st.avgLoss), sub: 'The average is the total of the losing trades divided by their number.', list: losses, group: true};
      case 'best': return {k: 'trades', title: 'Your best trades', sub: 'The five biggest winners in this period.', list: by(T, function (a, b) { return b.profit - a.profit; }).slice(0, 5)};
      case 'worst': return {k: 'trades', title: 'Your worst trades', sub: 'The five biggest losers in this period.', list: by(T, function (a, b) { return a.profit - b.profit; }).slice(0, 5)};
      case 'pf': return explain('Profit factor', 'How much the winners earned for every dollar the losers cost.', [['Gross profit (winners)', usd(gp, 2), 'var(--mint)'], ['Gross loss (losers)', usd(gl, 2), 'var(--red)'], ['Profit factor', st.pf == null ? '-' : st.pf.toFixed(2)]], [['wins', 'See the winning trades'], ['losses', 'See the losing trades']], 'Profit factor is gross profit divided by gross loss. Above 1.00 the winners outweigh the losers. Past results do not guarantee future results.');
      case 'exp': return explain('Expectancy', 'The average result of one trade.', [['Total result', sgn(st.net), col(st.net)], ['Trades', st.n], ['Per trade on average', sgn(st.expectancy), col(st.expectancy)]], [['win', 'See all trades']], 'Expectancy is the total result divided by the number of trades.');
      case 'payoff': return explain('Payoff ratio', 'The size of an average win compared with an average loss.', [['Average win', sgn(st.avgWin), 'var(--mint)'], ['Average loss', sgn(st.avgLoss), 'var(--red)'], ['Payoff ratio', st.payoff == null ? '-' : st.payoff.toFixed(2)]], [['wins', 'See the winning trades'], ['losses', 'See the losing trades']], 'A payoff ratio of 2.00 means the average winner is twice as big as the average loser.');
      case 'dd': { var d = ddSegment(T); return d.list.length ? {k: 'trades', title: 'Largest drawdown ' + usd(d.dd, 2), sub: 'The result fell from its highest point by this much across these ' + d.list.length + ' trades.', list: d.list, group: true} : explain('Largest drawdown', 'No drawdown in this period.', [['Largest drawdown', usd(0, 2)]], [], 'The result never fell below an earlier peak in this period.'); }
      case 'streakwin': return {k: 'trades', title: 'Longest win streak: ' + st.maxWinStreak, sub: 'Winning trades in a row, in closing order.', list: streakList(T, 1)};
      case 'streakloss': return {k: 'trades', title: 'Longest loss streak: ' + st.maxLossStreak, sub: 'Losing trades in a row, in closing order.', list: streakList(T, -1)};
      case 'streaknow': { var c = curStreak(T); return {k: 'trades', title: c.sign ? 'Right now: ' + c.list.length + (c.sign > 0 ? ' win' : ' loss') + (c.list.length > 1 ? (c.sign > 0 ? 's' : 'es') : '') + ' in a row' : 'Right now', sub: 'The trades in your current streak.', list: c.list}; }
      case 'hold': return {k: 'trades', title: 'Time in a trade', sub: 'Average ' + (st.avgHold == null ? '-' : R().fmtMin(st.avgHold)) + '. The ten longest trades are shown.', list: by(T.filter(function (t) { return holdMin(t) != null; }), function (a, b) { return holdMin(b) - holdMin(a); }).slice(0, 10)};
      case 'month': { var n = new Date(), ym = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); return monthSpec(ym); }
      case 'week': return {k: 'trades', title: 'Last 7 days', sub: 'Closed trades of the last seven days, day by day.', list: all().filter(function (t) { return new Date(t.closed_at).getTime() >= Date.now() - 7 * 864e5; }), group: true};
      case 'allnet': return {k: 'days', title: 'Net result, all time', sub: 'Day by day. Tap a day for its trades.', days: daysOf(all()), flt: 'gr'};
      case 'bestday': case 'worstday': { var ds = daysOf(T).sort(function (a, b) { return a.v - b.v; }), d2 = k === 'bestday' ? ds[ds.length - 1] : ds[0]; return p[1] ? daySpec(p[1]) : (d2 ? daySpec(d2.key) : null); }
      case 'cm': return monthSpec(p[1]);
      case 'cdays': { var l = all().filter(function (t) { return dk(t.closed_at).slice(0, 7) === p[1]; }); return {k: 'days', title: 'Green and red days', sub: 'Every trading day of the month. A green day closed at or above zero.', days: daysOf(l), flt: 'gr'}; }
      case 'cday': return daySpec(p[1]);
      case 'wk': { var a = p[1], b2 = p[2], l2 = all().filter(function (t) { var k2 = dk(t.closed_at); return k2 >= a && k2 <= b2; }); return {k: 'trades', title: 'Week of ' + dayName(a).replace(/, \d{4}$/, ''), sub: 'Trades closed from ' + dayName(a).replace(/, \d{4}$/, '') + ' to ' + dayName(b2).replace(/, \d{4}$/, '') + ', day by day.', list: l2, group: true}; }
      case 'wd': { var i = +p[1], names = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']; return {k: 'trades', title: names[i], sub: 'Every trade that closed on this weekday in the selected period.', list: T.filter(function (t) { return (new Date(t.closed_at).getDay() + 6) % 7 === i; }), group: true}; }
      case 'hr': { var h = +p[1]; return {k: 'trades', title: String(h).padStart(2, '0') + ':00 to ' + String(h).padStart(2, '0') + ':59', sub: 'Trades that closed in this hour of the day (your local time).', list: T.filter(function (t) { return new Date(t.closed_at).getHours() === h; }), group: true}; }
      case 'eng': { var e = p[1]; return {k: 'trades', title: (R().ENG[e] || e) + ' engine', sub: 'Every trade this engine closed in the selected period.', list: T.filter(function (t) { return t.engine === e; }), group: true}; }
      case 'limit': { var m = M(), l = m.lic || {}, pl = m.plan || {}, st2 = m.st || {}, lim = pl.limit_usd, tol = m.tol == null ? 5 : m.tol, allowed = lim == null ? null : lim * (1 + tol / 100) + Number(l.extra_allowance_usd || 0); return explain('Plan limit', 'How much money your plan covers.', [['Your plan', esc(pl.name || '-')], ['Plan covers', lim == null ? 'No deposit limit' : usd(lim, 0)], ['Tolerance', tol + '%'], ['Extra allowance', usd(l.extra_allowance_usd || 0, 0)], ['Allowed in total', allowed == null ? '-' : usd(allowed, 0)], ['Deposited minus withdrawn', usd(st2.funded_usd || 0, 2), st2.over_limit ? 'var(--red)' : '']], [], 'Only deposits and withdrawals count towards the limit. Profits never do. If deposits go above the allowed amount, new trades pause until you upgrade or withdraw the excess.'); }
      case 'bar': { var kk = p[1]; return kk.length === 7 ? monthSpec(kk) : daySpec(kk); }
    }
    return null;
  }
  function licSpec(id) {
    var m = M(), l = (m.licenses || []).filter(function (x) { return x.id === id; })[0]; if (!l) return null; var pl = (m.plans || []).filter(function (p) { return p.id === l.plan_id; })[0] || {}, days = l.expires_at ? Math.ceil((new Date(l.expires_at) - Date.now()) / 864e5) : null;
    var d = function (x) { return x ? new Date(x).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'}) : '-'; };
    return explain('License ' + esc(String(l.key).slice(0, 4)) + '...' + esc(String(l.key).slice(-4)), (pl.name || 'Plan') + ' plan', [['Status', esc(l.status)], ['Plan', esc(pl.name || '-')], ['MT5 account', l.bound_account ? esc(l.bound_account) + (l.bound_is_demo ? ' (demo)' : '') : 'Not used yet'], ['Broker', esc(l.bound_broker || '-')], ['Activated', d(l.activated_at)], ['Valid until', d(l.expires_at)], ['Days left', days == null ? 'Starts when first used' : (days >= 0 ? days + ' days' : 'Expired')]], [], 'One key works on one MT5 account. Paste the key into the EA’s only setting. Your key is shown in full in the table.');
  }
  function ordSpec(id) {
    var m = M(), o = (m.orders || []).filter(function (x) { return x.id === id; })[0]; if (!o) return null; var d = function (x) { return x ? new Date(x).toLocaleString([], {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '-'; };
    return explain('Order ' + esc(o.ref), esc(String(o.kind || '')) + ' order', [['Amount', usd(o.amount_usd, 2)], ['Status', esc(String(o.status || '').replace('_', ' '))], ['Created', d(o.created_at)], ['Confirmed', d(o.confirmed_at)], ['Your payment reference', esc(o.paid_ref || '-')]], [], 'Payments are confirmed by us, usually within a few hours. Write to support if something looks wrong.');
  }
  function tradeByKey(kv) { var a = all(); for (var i = 0; i < a.length; i++) if (key(a[i]) === kv) return a[i]; return null; }

  /* ---- one place that listens for every tap ---- */
  var MAP = [['[data-ct]', function (e) { var t = tradeByKey(e.dataset.ct); return t ? {k: 'trade', t: t, day: true, title: 'Trade details', sub: dt(t.closed_at)} : null; }],
    ['[data-day]', function (e) { return daySpec(e.dataset.day); }], ['[data-wk]', function (e) { var a = e.dataset.wk.split('|'); return selSpec('wk:' + a[0] + ':' + a[1]); }],
    ['[data-cs]', function (e) { var v = e.dataset.cs, ym = e.dataset.ym; return v === 'month' || v === 'trades' ? selSpec('cm:' + ym) : v === 'days' ? selSpec('cdays:' + ym) : e.dataset.day ? daySpec(e.dataset.day) : null; }],
    ['[data-wd]', function (e) { return selSpec('wd:' + e.dataset.wd); }], ['[data-hr]', function (e) { return selSpec('hr:' + e.dataset.hr); }], ['[data-eng]', function (e) { return selSpec('eng:' + e.dataset.eng); }],
    ['[data-lk]', function (e) { return licSpec(e.dataset.lk); }], ['[data-ord]', function (e) { return ordSpec(e.dataset.ord); }],
    ['[data-bar]', function (e) { return selSpec('bar:' + e.dataset.bar); }], ['[data-sel]', function (e) { return selSpec(e.dataset.sel); }]];
  function handle(ev) {
    if (ev.target.closest && ev.target.closest('#gs')) return;
    if (!R() || !all().length) return;
    for (var i = 0; i < MAP.length; i++) { var el = ev.target.closest && ev.target.closest(MAP[i][0]); if (el && el.closest('#acct')) { var sp = MAP[i][1](el); if (sp) { if (ev.type === 'keydown') ev.preventDefault(); open(sp); return; } } }
  }
  document.addEventListener('click', handle);
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][tabindex]') && e.target.closest('#acct')) handle(e); });
  window.gteSheet = {open: open, trade: function (t) { open({k: 'trade', t: t, day: true, title: 'Trade details', sub: dt(t.closed_at)}); }, close: close, sel: function (s) { var sp = selSpec(s); if (sp) open(sp); }};
})();
