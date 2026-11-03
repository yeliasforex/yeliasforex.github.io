/* Public home page: the live account as a real dashboard (overview, performance, trades, engines, calendar) built from the live account feed the section already reads.
   Everything is clickable and opens the same detail sheets as My account. Shows the account as it is, wins and losses alike. Additive: if this file does not load, the original section stays. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var N = function (n) { n = Number(n); return isFinite(n) ? n : 0; };
  var M = function () { return window.GTE_MA || null; }, R = function () { return window.gteResults || null; };
  var arr = function (a) { return Array.isArray(a) ? a : []; };
  var pct = function (a, b) { return b > 0 ? Math.round(a / b * 1000) / 10 : 0; };
  var num = function (n) { return N(n).toLocaleString('en-US', {maximumFractionDigits: 1}); };
  var usd = function (n, d) { return R() ? R().usd(N(n), d == null ? 0 : d) : '$' + N(n).toFixed(d == null ? 0 : d); };
  var sgn = function (n, d) { return R() ? R().sgn(N(n), d == null ? 2 : d) : (N(n) >= 0 ? '+$' : '-$') + Math.abs(N(n)).toFixed(2); };
  var col = function (n) { return R() ? R().col(N(n)) : ''; };
  var DAY = 864e5, plural = function (n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); };
  var PAL = ['var(--blue-hi)', 'var(--mint)', '#8b5cf6', 'var(--red)', '#a78bfa', '#22d3ee'], pal = function (i) { return PAL[i % PAL.length]; };
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
      return '<g class="acg-bg"><rect class="acg-bar" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + (it.color || (v < 0 ? 'var(--red)' : (o.color || 'var(--mint)'))) + '" rx="2"/>' +
        '<rect class="acg-s" data-g="' + id + '" data-i="' + i + '" x="' + (pl + step * i).toFixed(1) + '" y="' + pt + '" width="' + step.toFixed(1) + '" height="' + (H - pt - pb) + '" fill="transparent"><title>' + E(it.label) + ': ' + E(f(v)) + '</title></rect>' +
        (i % every === 0 || i === n - 1 ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" class="acg-t3">' + E(it.short || it.label) + '</text>' : '') + '</g>';
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
    o = o || {}; var v = N(value), m = N(max) || 1, p = Math.min(100, v / m * 100), Rr = 38, C = 2 * Math.PI * Rr, c = o.color || (p > 100 ? 'var(--red)' : p > 85 ? 'var(--warn,#E08A00)' : 'var(--mint)'), id = reg([{label: o.label || 'Used', value: v, sheet: o.sheet}], {});
    return '<button type="button" class="acg-ga" data-g="' + id + '" data-i="0"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + Rr + '" fill="none" stroke="var(--line-2)" stroke-width="12"/><circle cx="50" cy="50" r="' + Rr + '" fill="none" stroke="' + c + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (C * Math.min(100, p) / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="53" text-anchor="middle" class="acg-t1" style="font-size:15px">' + Math.round(p) + '%</text></svg><span>' + E(o.caption || '') + '</span></button>';
  }
  function card(title, sub, body, hint, wide) { return body ? {html: '<section class="panel acg-c' + (wide ? ' acg-w' : '') + '"><h3>' + E(title) + '</h3><div class="hint">' + E(sub) + '</div>' + body + '<div class="acg-f">Tap any part for the details.</div></section>'} : {empty: true, title: title, hint: hint || ''}; }
  function fact(tone, title, text, act) { return {tone: tone, title: title, text: text, act: act}; }
  var TONE = {bad: '!', warn: '!', ok: '&#10003;', info: 'i', mute: '&middot;'};
  var css = '.acg-lad{margin:6px 0 12px;display:flex;flex-direction:column;gap:6px}.acg-lad div{position:relative;display:flex;align-items:center;gap:8px;font-size:.84rem;padding:7px 10px 7px 24px;border-radius:9px;background:var(--panel-2)}.acg-lad i{position:absolute;left:8px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%}.acg-lad span{flex:1;min-width:0}.acg-lad b{font-variant-numeric:tabular-nums}.gs-head{margin:0 0 6px;font-size:14px;font-weight:600;line-height:1.4}' +
    '.acg{margin:0 0 18px}.acg-hd{display:flex;align-items:center;gap:10px;margin:0 0 10px}.acg-hd h3{margin:0;font-size:1.02rem}.acg-tg{margin-left:auto;font:inherit;font-size:.78rem;color:var(--muted);background:var(--panel-2);border:1px solid var(--line-2);border-radius:999px;padding:5px 12px;cursor:pointer}' +
    '.acg-i{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px}.acg-i button{display:flex;gap:11px;align-items:flex-start;text-align:left;font:inherit;color:var(--fg);background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--tone,var(--blue-hi));border-radius:14px;padding:11px 13px;cursor:pointer;transition:transform .15s,border-color .2s}.acg-i button:hover{transform:translateY(-2px);border-color:var(--tone,var(--blue-hi))}' +
    '.acg-i i{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:.8rem;color:#fff;background:var(--tone,var(--blue-hi))}.acg-i strong{display:block;font-size:.88rem;line-height:1.3}.acg-i small{display:block;color:var(--muted);font-size:.76rem;margin-top:2px;line-height:1.4}' +
    '.acg-i .t-bad{--tone:var(--red)}.acg-i .t-warn{--tone:var(--warn,#E08A00)}.acg-i .t-ok{--tone:var(--mint)}.acg-i .t-info{--tone:var(--blue-hi)}.acg-i .t-mute{--tone:var(--faint)}' +
    '.acg-gr{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.acg-c{min-width:0;padding:18px 18px 14px}.acg-c h3{margin:0 0 2px;font-size:.98rem}.acg-w{grid-column:1/-1}.acg-f{margin-top:10px;font-size:.72rem;color:var(--muted);opacity:.85}.acg-e{margin-top:12px}.acg-c .hint{margin:0 0 10px;font-size:.8rem}' +
    '.acg-d{display:grid;grid-template-columns:128px 1fr;gap:12px;align-items:center}@media(max-width:480px){.acg-d{grid-template-columns:1fr}.acg-d svg{max-width:160px;margin:0 auto}}.acg-d svg{width:100%}' +
    '.acg-t1{font-weight:700;font-family:inherit;fill:var(--fg)}.acg-t2{font-size:5.5px;font-weight:500;font-family:inherit;fill:var(--muted)}.acg-t3{font-size:8px;font-weight:500;font-family:inherit;fill:var(--muted)}.acg-g0{stroke:var(--line-2);stroke-width:.6;stroke-dasharray:3 3}' +
    '.acg-s{cursor:pointer;transition:stroke-width .15s}circle.acg-s:hover{stroke-width:17}rect.acg-s:hover{fill:var(--blue-hi);fill-opacity:.14}' +
    '.acg-l,.acg-h{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;min-width:0}.acg-l button,.acg-h button{display:flex;align-items:center;gap:9px;width:100%;font:inherit;font-size:.82rem;color:var(--fg);background:none;border:0;border-radius:9px;padding:7px 8px;cursor:pointer;text-align:left}.acg-l button:hover,.acg-h button:hover{background:var(--panel-2)}' +
    '.acg-l i{flex:none;width:10px;height:10px;border-radius:3px}.acg-l span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.acg-l b,.acg-h b{font-variant-numeric:tabular-nums}.acg-l em,.acg-h em{font-style:normal;color:var(--muted);font-size:.72rem;min-width:40px;text-align:right}' +
    '.acg-n{flex:0 0 38%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.acg-k{flex:1;height:8px;background:var(--panel-2);border-radius:6px;overflow:hidden}.acg-k i{display:block;height:100%;border-radius:6px}.acg-b{width:100%;height:auto;display:block}' +
    '.acg-gr2{display:flex;gap:18px;flex-wrap:wrap;justify-content:space-around}.acg-ga{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:var(--fg);font:inherit;cursor:pointer;width:150px}.acg-ga svg{width:110px}.acg-ga span{font-size:.76rem;color:var(--muted);text-align:center;line-height:1.35}';

  /* ================================================================ the dashboard */
  if (window.gteResults && window.gteResults.ECL) window.gteResults.ECL.I = (document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches))) ? '#22C3D8' : '#0A8AA6';       // on the public site the middle engine is teal, not yellow
  var D = null, T = [], tab = 'overview', range = 'all', mode = 'time', flt = 'all', engF = 'all', shown = 12, root = null;
  var ENGK = {Alpha: 'M', Beta: 'I', Gamma: 'D'}, WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var ICON = {
    overview: '<path d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>', performance: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', trades: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    engines: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'
  };
  var TABS = [['overview', 'Overview'], ['performance', 'Performance'], ['trades', 'Trades'], ['engines', 'Engines'], ['calendar', 'Calendar']];
  var tm = function (d) { return new Date(d).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}); };
  var dt = function (d) { return new Date(d).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}); };
  var dshort = function (d) { return new Date(d).toLocaleDateString([], {day: 'numeric', month: 'short'}); };
  function sum(l) { return l.reduce(function (a, t) { return a + N(t.profit); }, 0); }
  function wr(l) { return l.length ? Math.round(l.filter(function (t) { return t.profit > 0; }).length / l.length * 100) : 0; }
  function lst(title, sub, list) { return {k: 'trades', title: title, sub: sub, list: list, group: true}; }
  function mapT(h) {
    return {engine: ENGK[h.engine] || 'M', dir: h.side === 'sell' ? -1 : 1, is_add: false, opened_at: h.open_time, closed_at: h.close_time, open_price: h.open_price, close_price: h.close_price, lots: h.lots, profit: h.profit,
      exit_reason: h.exit_reason, result_r: h.result_r, mfe_r: h.mfe_r, mae_r: h.mae_r, mfe_usd: h.mfe_usd, mae_usd: h.mae_usd, mfe_pips: h.mfe_pips, mae_pips: h.mae_pips, peak_at: h.peak_at, stop_r: h.stop_r, risk_usd: h.risk_usd};
  }
  var money = function (v, s) { return s ? sgn(v, 2) : usd(v, 2); };
  var colr = function (v) { return N(v) >= 0 ? 'var(--mint)' : 'var(--red)'; };
  function pool() { window.GTE_MA = window.GTE_MA || {}; window.GTE_MA.trades = T; window.GTE_MA.rng = window.GTE_MA.rng || function (a) { return a; }; }
  function sheetOf(title, sub, rows, text) {
    return {k: 'explain', title: title, sub: sub, html: (text ? '<p class="gs-lead">' + E(text) + '</p>' : '') + '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + E(r[1]) + '</b></div>'; }).join('') + '</div>'};
  }

  /* ---- the facts behind every number ---- */
  function stats() {
    var S = D.summary || {}, wins = T.filter(function (t) { return t.profit > 0; }), loss = T.filter(function (t) { return t.profit < 0; }), curve = D.equity_curve || [], pk = 0, dd = 0;
    curve.forEach(function (p) { var v = N(p[1]); pk = Math.max(pk, v); dd = Math.max(dd, pk - v); });
    return {S: S, wins: wins, loss: loss, aw: wins.length ? sum(wins) / wins.length : 0, al: loss.length ? sum(loss) / loss.length : 0, ddUsd: dd, op: arr(D.open), fl: arr(D.open).reduce(function (a, o) { return a + N(o.profit); }, 0)};
  }
  function kpiSheet(k) {
    var s = stats(), S = s.S, A = D.account || {};
    var M_ = {
      balance: ['Balance', [['Balance now', usd(S.balance, 2)], ['Deposited', usd(S.deposits, 2)], ['Result of closed trades', sgn(S.net_profit), colr(S.net_profit)]], 'The money in the account, counting only trades that have closed.'],
      equity: ['Equity', [['Equity now', usd(S.equity, 2)], ['Balance', usd(S.balance, 2)], ['Open trades', String(s.op.length)], ['Floating result', sgn(s.fl), colr(s.fl)]], 'Balance plus the floating result of open trades. With nothing open it equals the balance.'],
      net: ['Net profit', [['Net result', sgn(S.net_profit), colr(S.net_profit)], ['On deposits', (N(S.gain_pct) >= 0 ? '+' : '') + N(S.gain_pct).toFixed(2) + '%'], ['Winners earned', sgn(sum(s.wins)), 'var(--mint)'], ['Losers cost', sgn(sum(s.loss)), 'var(--red)']], 'Everything the winning trades earned minus everything the losing trades cost. A demo account uses no real money, and a few weeks is a short time to judge any strategy.'],
      winrate: ['Win rate', [['Win rate', N(S.win_rate).toFixed(1) + '%'], ['Winning trades', String(s.wins.length), 'var(--mint)'], ['Losing trades', String(s.loss.length), 'var(--red)'], ['Average win', sgn(s.aw), 'var(--mint)'], ['Average loss', sgn(s.al), 'var(--red)']], 'Win rate alone does not say whether a strategy makes money. Compare the average win with the average loss: a robot can win half its trades and still profit if the wins are bigger.'],
      pf: ['Profit factor', [['Profit factor', N(S.profit_factor).toFixed(2)], ['Winners earned', sgn(sum(s.wins)), 'var(--mint)'], ['Losers cost', sgn(sum(s.loss)), 'var(--red)']], 'The money the winners earned divided by the money the losers cost. Above 1.00 the account is in profit, below 1.00 it is losing so far.'],
      dd: ['Max drawdown', [['Largest fall from a peak', N(S.max_drawdown_pct).toFixed(2) + '%'], ['In dollars', usd(s.ddUsd, 2)]], 'The biggest drop from the highest point the account reached. Every strategy has dips; what matters is how deep and how long.'],
      avg: ['Average win and loss', [['Average win', sgn(s.aw), 'var(--mint)'], ['Average loss', sgn(s.al), 'var(--red)'], ['Winning trades', String(s.wins.length)], ['Losing trades', String(s.loss.length)]], 'A robot can win half its trades and still make money if its wins are bigger than its losses, or lose money if they are smaller. This compares the two.'],
      bw: ['Best and worst trade', (function () { var b = T.reduce(function (a, t) { return !a || t.profit > a.profit ? t : a; }, null), w = T.reduce(function (a, t) { return !a || t.profit < a.profit ? t : a; }, null); return b ? [['Best trade', sgn(b.profit) + ' (' + dshort(b.closed_at) + ')', 'var(--mint)'], ['Worst trade', sgn(w.profit) + ' (' + dshort(w.closed_at) + ')', 'var(--red)']] : []; })(), 'The single biggest win and the single biggest loss since the account started tracking.'],
      deposit: ['Deposited', [['Deposited', usd(S.deposits, 2)], ['Withdrawn', usd(S.withdrawals, 2)], ['Balance now', usd(S.balance, 2)]], 'The money put into this demo account. Profit and loss are measured against it.'],
      trades: ['Trades', [['Closed trades', String(T.length)], ['Won', String(s.wins.length), 'var(--mint)'], ['Lost', String(s.loss.length), 'var(--red)'], ['Open now', String(s.op.length)]], 'Every closed trade of the account, wins and losses alike.']
    }[k];
    if (M_) open(sheetOf(M_[0], (A.broker || 'MetaTrader 5') + ' ' + (A.type || 'demo') + ' account', M_[1], M_[2]));
  }

  /* ---- top: status ---- */
  function top() {
    var A = D.account || {}, s = stats(), mins = (Date.now() - Date.parse(D.updated)) / 60000, fresh = mins < 45, since = A.started ? new Date(A.started).toLocaleDateString([], {day: 'numeric', month: 'short', year: 'numeric'}) : '';
    var head = !fresh ? 'Waiting for the next update' : s.op.length ? 'In ' + (s.op.length === 1 ? 'a trade' : s.op.length + ' trades') + ' right now' : 'Running, watching the market';
    return '<div class="pd-top ' + (fresh ? 'ok' : 'warn') + '"><button type="button" class="pd-st" data-a="status"><span class="pd-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + (fresh ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M12 7v6M12 17h.01"/>') + '</svg></span><span><small><i class="pd-bl"></i>LIVE &middot; STRAIGHT FROM METATRADER 5</small><b>' + head + '</b><em>Last report <span class="pd-ago">' + ago(D.updated) + '</span></em></span></button>'
      + '<div class="pd-chips"><span><small>Broker</small>' + E(A.broker || '-') + '</span><span><small>Account</small>' + E(A.type || 'Demo') + '</span><span><small>Leverage</small>' + E(A.leverage || '-') + '</span><span><small>Tracking since</small>' + E(since) + '</span></div></div>';
  }

  /* ---- today strip + live ticker ---- */
  function strip() {
    var s = stats(), td = T.filter(function (t) { return dk(t.closed_at) === dk(Date.now()); }), wk = T.filter(function (t) { return Date.now() - new Date(t.closed_at) < 7 * DAY; }), L = T[T.length - 1];
    var c = function (k, lab, big, sub, col) { return '<button type="button" data-a="' + k + '"><small>' + lab + '</small><b style="color:' + col + '">' + big + '</b><em>' + sub + '</em></button>'; };
    return '<div class="pd-today">' + c('today', 'Today, closed', sgn(sum(td)), plural(td.length, 'trade'), td.length ? colr(sum(td)) : 'var(--fg)') + c('opn', 'Open now', String(s.op.length), s.op.length ? sgn(s.fl) + ' floating' : 'none right now', 'var(--fg)')
      + (L ? c('lastt', 'Last trade', sgn(L.profit), (L.dir > 0 ? 'BUY ' : 'SELL ') + R().ENG[L.engine] + ' &middot; ' + ago(L.closed_at), colr(L.profit)) : '') + c('week', 'Last 7 days', sgn(sum(wk)), plural(wk.length, 'trade'), wk.length ? colr(sum(wk)) : 'var(--fg)') + '</div>';
  }
  function ticker() {
    var last = T.slice(-10).reverse(), one = last.map(function (t) { return '<span><i class="' + (t.dir > 0 ? 'u' : 's') + '"></i>' + (t.dir > 0 ? 'BUY' : 'SELL') + ' ' + R().ENG[t.engine] + ' <b style="color:' + colr(t.profit) + '">' + sgn(t.profit) + '</b> <em>' + ago(t.closed_at) + '</em></span>'; }).join('');
    return '<div class="pd-tick" aria-label="Latest closed trades"><div class="pd-tk"><div>' + one + '</div><div aria-hidden="true">' + one + '</div></div></div>';
  }
  /* ---- numbers that count up, light that follows the pointer ---- */
  var FMT = {usd: function (v) { return usd(v, 2); }, sgn: function (v) { return sgn(v, 2); }, p1: function (v) { return v.toFixed(1) + '%'; }, d2: function (v) { return v.toFixed(2); }, int: function (v) { return String(Math.round(v)); }};
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(scope) {
    $$('.pd-cu[data-n]', scope).forEach(function (el) {
      var to = +el.dataset.n, f = FMT[el.dataset.f] || FMT.int; if (still) { el.textContent = f(to); return; }
      var t0 = null; (function stp(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3); el.textContent = f(to * e); if (p < 1) requestAnimationFrame(stp); else el.textContent = f(to); })(window.performance.now());
    });
  }

  /* ---- overview ---- */
  var SERS = {};
  function eqSamples() { return arr(D.equity_curve).map(function (q) { return {t: Date.parse(q[0]), e: N(q[2])}; }); }
  function timeSeries() {      // the real balance and equity samples from MetaTrader: accurate to the minute and to the price
    var cut = range === '1w' ? Date.now() - 7 * DAY : range === '1m' ? Date.now() - 30 * DAY : 0, pts = arr(D.equity_curve).map(function (q) { return {t: Date.parse(q[0]), v: N(q[1]), e: N(q[2]), tr: null}; });
    if (cut) { var k = 0; pts.forEach(function (q, n) { if (q.t < cut) k = n; }); pts = pts.slice(k); }
    return pts.length > 1 ? pts : pts.slice(-2);
  }
  function series() {          // the balance after every closed trade, so each step of the curve is one trade and quiet days take no room; e = the lowest equity reached while those trades were open
    var dep = N((D.summary || {}).deposits), bal = dep, cut = range === '1w' ? Date.now() - 7 * DAY : range === '1m' ? Date.now() - 30 * DAY : 0, eq = eqSamples();
    var pts = [{t: Date.parse((D.account || {}).started || (T[0] || {}).opened_at || Date.now()), v: dep, e: dep, tr: null}];
    T.forEach(function (t) { bal += N(t.profit); var prev = pts[pts.length - 1], tt = Date.parse(t.closed_at), low = bal; eq.forEach(function (q) { if (q.t > prev.t && q.t <= tt && q.e < low) low = q.e; }); pts.push({t: tt, v: bal, e: Math.min(low, bal), tr: t}); });
    var lastP = pts[pts.length - 1], cur = N((D.summary || {}).equity); if (arr(D.open).length && cur) { pts.push({t: Date.parse(D.updated), v: lastP.v, e: cur, tr: null, now: true}); }
    if (cut) { var k = 0; pts.forEach(function (q, n) { if (q.t < cut) k = n; }); pts = pts.slice(k); }
    return pts.length > 1 ? pts : pts.slice(-2);
  }
  function ddSeries() { var cum = 0, pk = 0, pts = [{t: Date.parse((D.account || {}).started || (T[0] || {}).opened_at || Date.now()), v: 0, tr: null}]; T.forEach(function (t) { cum += N(t.profit); pk = Math.max(pk, cum); pts.push({t: Date.parse(t.closed_at), v: cum - pk, tr: t}); }); return pts; }
  function chartHtml(sid, pts, o) {
    SERS[sid] = {pts: pts, o: o}; var W = 600, H = o.h || 230, n = pts.length, dd = o.kind === 'dd';
    var vals = pts.map(function (p) { return p.v; }).concat(o.eq ? pts.map(function (p) { return p.e; }) : []).concat(dd ? [0] : []), mn0 = Math.min.apply(null, vals), mx0 = Math.max.apply(null, vals), pad = ((mx0 - mn0) || 1) * .14, lo = mn0 - pad, hi = dd ? Math.max(mx0, 0) + pad * .6 : mx0 + pad, rg = hi - lo;
    var t0 = pts[0].t, t1 = pts[n - 1].t, tm = !!o.time, X = function (i) { return tm ? (pts[i].t - t0) / ((t1 - t0) || 1) * W : (n > 1 ? i / (n - 1) * W : W / 2); }, Y = function (v) { return (1 - (v - lo) / rg) * H; }, pc = function (v) { return (Y(v) / H * 100).toFixed(2) + '%'; }, last = pts[n - 1];
    var d = pts.map(function (p, i) { return (i ? (tm ? 'H' + X(i).toFixed(1) + ' V' : 'L' + X(i).toFixed(1) + ' ') : 'M' + X(i).toFixed(1) + ' ') + Y(p.v).toFixed(1); }).join(' '), de = o.eq ? pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.e).toFixed(1); }).join(' ') : '';
    var step = Math.pow(10, Math.floor(Math.log10(rg / 4))), nice = [1, 2, 2.5, 5, 10].map(function (m) { return m * step; }).filter(function (v) { return rg / v <= 6; })[0] || step * 10, ticks = [];
    for (var v = Math.ceil(lo / nice) * nice; v <= hi; v += nice) ticks.push(v);
    var base = dd ? Y(0) : H, refIn = o.ref != null && o.ref >= lo && o.ref <= hi;
    var dots = tm ? (o.marks || []).map(function (m) { return '<i class="pd-pt ' + (m.profit >= 0 ? 'w' : 'l') + '" style="left:' + ((m.t - t0) / ((t1 - t0) || 1) * 100).toFixed(2) + '%;top:' + pc(m.v) + '"></i>'; }).join('') : o.dots !== false && n <= 70 ? pts.map(function (p, i) { return p.tr ? '<i class="pd-pt ' + (p.tr.profit >= 0 ? 'w' : 'l') + '" style="left:' + (X(i) / W * 100).toFixed(2) + '%;top:' + pc(p.v) + '"></i>' : ''; }).join('') : '';
    var xt = [0, .25, .5, .75, 1].map(function (f) { var tt = tm ? t0 + f * (t1 - t0) : pts[Math.round(f * (n - 1))].t; return '<span>' + dshort(tt) + '</span>'; }).join('');
    var c1 = dd ? 'var(--red)' : tm ? 'var(--mint)' : 'var(--ac)', c2 = dd ? 'var(--red)' : tm ? 'var(--mint)' : 'var(--vio)', uid = 'g' + sid;
    return '<div class="pd-chw"><div class="pd-ch" data-sid="' + sid + '" data-lo="' + lo + '" data-hi="' + hi + '" style="height:' + H + 'px"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + E(o.label || 'Chart') + '"><defs><linearGradient id="' + uid + 'a" x1="0" y1="' + (dd ? 1 : 0) + '" x2="0" y2="' + (dd ? 0 : 1) + '"><stop offset="0" style="stop-color:' + c2 + '" stop-opacity="' + (dd ? '.38' : '.34') + '"/><stop offset=".65" style="stop-color:' + c1 + '" stop-opacity=".09"/><stop offset="1" style="stop-color:' + c1 + '" stop-opacity="0"/></linearGradient><linearGradient id="' + uid + 'l" x1="0" y1="0" x2="1" y2="0">' + (dd ? '<stop offset="0" style="stop-color:var(--red)"/><stop offset="1" style="stop-color:var(--red)"/>' : tm ? '<stop offset="0" style="stop-color:var(--mint)"/><stop offset="1" style="stop-color:var(--mint)"/>' : '<stop offset="0" style="stop-color:var(--cy)"/><stop offset=".55" style="stop-color:var(--ac)"/><stop offset="1" style="stop-color:var(--vio)"/>') + '</linearGradient></defs>'
      + ticks.map(function (t) { return '<line x1="0" x2="' + W + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '" stroke="rgba(150,170,230,.14)" stroke-width="1" stroke-dasharray="2 6" vector-effect="non-scaling-stroke"/>'; }).join('')
      + (refIn ? '<line x1="0" x2="' + W + '" y1="' + Y(o.ref).toFixed(1) + '" y2="' + Y(o.ref).toFixed(1) + '" style="stroke:var(--muted)" stroke-width="1.2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" opacity=".8"/>' : '')
      + '<path d="' + d + ' L' + W + ' ' + base.toFixed(1) + ' L0 ' + base.toFixed(1) + ' Z" fill="url(#' + uid + 'a)"/>'
      + (de ? '<path class="pd-eqln" d="' + de + '" fill="none" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' : '')
      + '<path class="pd-ln' + (dd ? ' dd' : '') + '" d="' + d + '" fill="none" stroke="url(#' + uid + 'l)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>'
      + (refIn ? '<span class="pd-dp" style="top:' + pc(o.ref) + '">' + E(o.refLabel || '') + '</span>' : '') + dots
      + '<i class="pd-end' + (dd ? ' dd' : '') + '" style="top:' + pc(last.v) + '"></i><i class="pd-cx" hidden></i><i class="pd-dot" hidden></i><div class="pd-tipc" hidden></div></div>'
      + '<div class="pd-ya">' + ticks.map(function (t) { return '<span style="top:' + pc(t) + '">' + (o.yfmt ? o.yfmt(t) : usd(t, 0)) + '</span>'; }).join('') + '<span class="pd-now' + (dd ? ' dd' : '') + '" style="top:' + pc(last.v) + '">' + (o.yfmt ? o.yfmt(last.v) : usd(last.v, 0)) + '</span></div></div>'
      + '<div class="pd-axis">' + xt + '</div><div class="pd-key">' + (o.key || '') + '</div>';
  }
  function heroChart(pts) {
    var dep = N((D.summary || {}).deposits), tm = mode === 'time', marks = [];
    if (tm) { var run = dep, t0 = pts[0].t, t1 = pts[pts.length - 1].t; T.forEach(function (t) { run += N(t.profit); var tt = Date.parse(t.closed_at); if (tt >= t0 && tt <= t1) marks.push({t: tt, v: run, profit: t.profit, tr: t}); }); }
    return chartHtml('bal', pts, {kind: 'bal', time: tm, marks: marks, eq: true, ref: dep, refLabel: 'Deposit ' + usd(dep, 0), label: 'Balance and equity',
      key: tm ? '<span><i class="b"></i>Balance (closed trades)</span><span><i class="e"></i>Equity (including open trades)</span><span><i class="w"></i>Winning trade</span><span><i class="l"></i>Losing trade</span><span><i class="d"></i>Money deposited</span>'
        : '<span><i class="w"></i>Winning trade</span><span><i class="l"></i>Losing trade</span><span><i class="e"></i>Equity: the lowest point while trades were open</span><span><i class="d"></i>Money deposited</span><span class="pd-keyn">One step = one closed trade</span>'});
  }
  function ddChart() {
    var pts = ddSeries(), worst = pts.reduce(function (a, q) { return q.v < a.v ? q : a; }, pts[0]);
    return chartHtml('dd', pts, {kind: 'dd', h: 200, ref: 0, refLabel: 'Best point so far', dots: false, yfmt: function (v) { return v === 0 ? '$0' : sgn(v, 0); }, label: 'How far below its best the result was after each trade',
      key: '<span><i class="l"></i>Each step is one closed trade</span><span class="pd-keyn">Deepest dip ' + sgn(worst.v, 2) + ' on ' + dshort(worst.t) + '</span>'});
  }
  function miniKpi(k, label, big, sub, vis, color, cu, i) { return '<button type="button" class="pd-k" style="--i:' + (i || 0) + ';--t:' + (color || 'var(--blue-hi)') + '" data-a="k:' + k + '"><small>' + label + '</small><b class="pd-cu"' + (cu ? ' data-n="' + cu[0] + '" data-f="' + cu[1] + '"' : '') + (color ? ' style="color:' + color + '"' : '') + '>' + big + '</b><em>' + sub + '</em>' + (vis || '') + '</button>'; }
  function ringSvg(p, c) { return '<svg class="pd-rg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" style="stroke:var(--line-2)" stroke-width="3.2"/><circle cx="18" cy="18" r="15.9" fill="none" style="stroke:' + c + '" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="' + Math.max(0, Math.min(100, p)).toFixed(1) + ' 100" transform="rotate(-90 18 18)"/></svg>'; }
  function recentRows(list) {
    return list.map(function (t, i) {
      return '<button type="button" class="pd-r" data-a="t:' + i + '"><span class="pd-p ' + (t.dir > 0 ? 'u' : 's') + '">' + (t.dir > 0 ? 'BUY' : 'SELL') + '</span><span class="pd-p e" style="--c:' + R().ECL[t.engine] + '">' + R().ENG[t.engine] + '</span><em>' + dt(t.closed_at) + '</em><b style="color:' + colr(t.profit) + '">' + sgn(t.profit) + '</b></button>';
    }).join('');
  }
  var REC = [];
  function overview() {
    var s = stats(), S = s.S, pts = (mode === 'time' ? timeSeries() : series()), net = N(S.net_profit), last = T.slice().sort(function (a, b) { return new Date(b.closed_at) - new Date(a.closed_at); }); REC = last.slice(0, 6);
    var pfv = N(S.profit_factor), pfc = pfv >= 1 ? 'var(--mint)' : 'var(--red)';
    var best = T.reduce(function (a, t) { return !a || t.profit > a.profit ? t : a; }, null), worst = T.reduce(function (a, t) { return !a || t.profit < a.profit ? t : a; }, null), tot = s.aw + Math.abs(s.al) || 1;
    return '<div class="pd-hero"><div class="pd-hh"><div><small>BALANCE</small><b class="pd-big pd-cu" data-a="k:balance" data-f="usd" data-n="' + N(S.balance) + '">' + usd(S.balance, 2) + '</b><span class="pd-hm"><span class="pd-delta" data-a="k:net" style="color:' + colr(net) + '">' + sgn(net) + ' (' + (N(S.gain_pct) >= 0 ? '+' : '') + N(S.gain_pct).toFixed(2) + '%)</span><button type="button" class="pd-eq" data-a="k:equity">Equity <b>' + usd(S.equity, 2) + '</b></button><button type="button" class="pd-eq" data-a="k:deposit">Deposited <b>' + usd(S.deposits, 0) + '</b></button></span></div>'
      + '<div class="pd-seg" role="tablist">' + [['1w', '1W'], ['1m', '1M'], ['all', 'All']].map(function (r) { return '<button type="button" data-a="r:' + r[0] + '" aria-pressed="' + (range === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div><div class="pd-seg" role="tablist">' + [['time', 'Time'], ['trade', 'Per trade']].map(function (r) { return '<button type="button" data-a="m:' + r[0] + '" aria-pressed="' + (mode === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div></div>' + heroChart(pts) + '<p class="pd-note">Hover or tap the line for the balance at that moment.</p></div>'
      + '<div class="pd-ks">'
      + miniKpi('winrate', 'WIN RATE', N(S.win_rate).toFixed(1) + '%', s.wins.length + ' won, ' + s.loss.length + ' lost', ringSvg(N(S.win_rate), N(S.win_rate) >= 50 ? 'var(--mint)' : 'var(--warn)'), 'var(--fg)', [N(S.win_rate), 'p1'], 0)
      + miniKpi('pf', 'PROFIT FACTOR', pfv.toFixed(2), pfv >= 1 ? 'winners are ahead' : 'losers are ahead for now', '<div class="pd-pf"><i style="width:' + Math.min(100, pfv / 2 * 100).toFixed(0) + '%;background:' + (pfv >= 1 ? 'var(--mint)' : 'var(--red)') + '"></i><u></u></div>', 'var(--fg)', [pfv, 'd2'], 1)
      + miniKpi('dd', 'MAX DRAWDOWN', N(S.max_drawdown_pct).toFixed(1) + '%', 'deepest dip ' + usd(s.ddUsd, 0), '<div class="pd-pf"><i style="width:' + Math.min(100, N(S.max_drawdown_pct) / 20 * 100).toFixed(0) + '%;background:var(--blue-hi)"></i></div>', 'var(--fg)', [N(S.max_drawdown_pct), 'p1'], 2)
      + miniKpi('avg', 'AVERAGE WIN', sgn(s.aw), 'average loss ' + sgn(s.al), '<div class="pd-st2"><i style="width:' + (s.aw / tot * 100).toFixed(0) + '%;background:var(--mint)"></i><i style="flex:1;background:var(--red)"></i></div>', 'var(--mint)', [s.aw, 'sgn'], 3)
      + miniKpi('bw', 'BEST TRADE', best ? sgn(best.profit) : '-', worst ? 'worst ' + sgn(worst.profit) : '', '', 'var(--mint)', best ? [best.profit, 'sgn'] : null, 4)
      + miniKpi('trades', 'TRADES', String(T.length), 'closed so far', '<div class="pd-st2"><i style="width:' + wr(T) + '%;background:var(--mint)"></i><i style="flex:1;background:var(--red)"></i></div>', 'var(--fg)', [T.length, 'int'], 5)
      + '</div>'
      + '<div class="pd-two"><section class="panel pd-pn"><div class="pd-ph"><h3>Latest trades</h3><button type="button" class="pd-more" data-a="tab:trades">All trades</button></div><div class="pd-rows">' + recentRows(REC) + '</div></section>'
      + '<section class="panel pd-pn"><div class="pd-ph"><h3>Open trades</h3><span class="pd-live"><i></i>LIVE</span></div>' + (s.op.length ? '<div class="pd-rows">' + s.op.map(function (o, i) { return '<button type="button" class="pd-r" data-a="o:' + i + '"><span class="pd-p ' + (o.side === 'sell' ? 's' : 'u') + '">' + String(o.side).toUpperCase() + '</span><span class="pd-p e">' + E(o.engine || '') + '</span><em>' + N(o.lots).toFixed(2) + ' lots</em><b style="color:' + colr(o.profit) + '">' + sgn(o.profit) + '</b></button>'; }).join('') + '</div>' : '<p class="pd-empty">No trade open right now. The EA is watching the market and opens one only when its conditions are met.</p>') + '</section></div>';
  }

  /* ---- performance ---- */
  function performance() {
    var byE = ['M', 'I', 'D'].map(function (k) { return {k: k, l: T.filter(function (t) { return t.engine === k; })}; }).filter(function (x) { return x.l.length; }), EN = R().ENG;
    var engI = byE.map(function (x) { return {label: EN[x.k], short: EN[x.k], value: sum(x.l), sheet: function () { return lst(EN[x.k] + ' trades', 'Net ' + sgn(sum(x.l)) + ', ' + wr(x.l) + '% won', x.l); }}; });
    var buy = T.filter(function (t) { return t.dir > 0; }), sell = T.filter(function (t) { return t.dir < 0; });
    var side = [{label: 'BUY (up)', value: buy.length, color: 'var(--mint)', sheet: function () { return lst('BUY trades', 'Net ' + sgn(sum(buy)) + ', ' + wr(buy) + '% won', buy); }}, {label: 'SELL (down)', value: sell.length, color: 'var(--red)', sheet: function () { return lst('SELL trades', 'Net ' + sgn(sum(sell)) + ', ' + wr(sell) + '% won', sell); }}];
    var wdI = [1, 2, 3, 4, 5].map(function (d) { var l = T.filter(function (t) { return new Date(t.closed_at).getDay() === d; }); return {label: WD[d], short: WD[d], value: sum(l), sheet: function () { return lst(WD[d] + ' trades', plural(l.length, 'trade') + '. Net ' + sgn(sum(l)), l); }}; });
    var HB = [['Under 15 min', 0, 15], ['15 to 60 min', 15, 60], ['1 to 4 hours', 60, 240], ['4 to 12 hours', 240, 720], ['Over 12 hours', 720, 1e9]];
    var hI = HB.map(function (h) { var l = T.filter(function (t) { var v = (new Date(t.closed_at) - new Date(t.opened_at)) / 6e4; return v >= h[1] && v < h[2]; }); return {label: h[0], short: h[0].replace(' min', 'm').replace(' hours', 'h').replace('Under ', '<').replace('Over ', '>').replace(' to ', '-'), value: l.length, sheet: function () { return lst('Held ' + h[0].toLowerCase(), plural(l.length, 'trade') + '. Net ' + sgn(sum(l)), l); }}; });
    var dly = arr(D.daily).map(function (x) { return {label: dshort(x[0] + 'T12:00:00'), short: dshort(x[0] + 'T12:00:00'), value: N(x[1]), sheet: function () { var l = T.filter(function (t) { return dk(t.closed_at) === x[0]; }); return lst(dshort(x[0] + 'T12:00:00'), plural(l.length, 'trade') + '. Net ' + sgn(x[1]), l); }}; });
    var cum = 0, pk = 0, dd = T.slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }).map(function (t) { cum += N(t.profit); pk = Math.max(pk, cum); return {label: dshort(t.closed_at), short: dshort(t.closed_at), value: cum - pk, sheet: function () { return {k: 'trade', t: t, day: true, title: 'Trade details', sub: 'Result ' + sgn(cum - pk) + ' below the best point so far'}; }}; });
    var cards = [
      card('Profit and loss by day', 'Each bar is one trading day. Green earned, red lost.', bars(dly, {title: 'Days', fmt: function (v) { return sgn(v); }, labels: 6}), 'needs trades', true),
      card('Which engine made or lost money', 'Net result of each of the three engines.', bars(engI, {title: 'Engines', fmt: function (v) { return sgn(v); }, labels: 3}), 'needs trades'),
      card('BUY and SELL', 'Which direction the robot traded most.', donut(side, {title: 'Direction', center: T.length, centerLabel: 'trades'}), 'needs trades'),
      card('Result by weekday', 'Net result of trades closed on each day.', bars(wdI, {title: 'Weekdays', fmt: function (v) { return sgn(v); }, labels: 5}), 'needs trades'),
      card('Time in a trade', 'How long trades stayed open.', bars(hI, {title: 'Time in a trade', color: 'var(--blue-hi)', labels: 5}), 'needs times'),
      card('How far below its best', 'After each trade: how far the result sat below the highest point it had reached. Zero means a new high; the dip is the stretch you would have had to sit through.', ddChart(), 'needs trades', true)];
    return '<div class="acg-gr pd-gr">' + cards.filter(function (c) { return !c.empty; }).map(function (c) { return c.html; }).join('') + '</div>';
  }

  /* ---- trades ---- */
  var LIST = [];
  function tradesTab() {
    var all = T.slice().sort(function (a, b) { return new Date(b.closed_at) - new Date(a.closed_at); });
    var l = all.filter(function (t) { return (flt === 'all' || (flt === 'win' ? t.profit > 0 : t.profit < 0)) && (engF === 'all' || t.engine === engF); }); LIST = l.slice(0, shown);
    var pill = function (k, v, t) { return '<button type="button" data-a="' + k + ':' + v + '" aria-pressed="' + ((k === 'f' ? flt : engF) === v) + '">' + t + '</button>'; };
    return '<section class="panel pd-pn"><div class="pd-ph"><h3>Closed trades</h3><span class="pd-sub">' + l.length + ' shown &middot; net ' + sgn(sum(l)) + '. Tap a trade for its full story.</span></div>'
      + '<div class="pd-fl"><div class="pd-seg">' + pill('f', 'all', 'All') + pill('f', 'win', 'Wins') + pill('f', 'loss', 'Losses') + '</div><div class="pd-seg">' + pill('e', 'all', 'Every engine') + ['M', 'I', 'D'].map(function (k) { return pill('e', k, R().ENG[k]); }).join('') + '</div></div>'
      + '<div class="pd-tb">' + (LIST.length ? LIST.map(function (t, i) { var hm = (new Date(t.closed_at) - new Date(t.opened_at)) / 6e4;
        return '<button type="button" class="pd-tr" data-a="l:' + i + '"><span class="pd-p ' + (t.dir > 0 ? 'u' : 's') + '">' + (t.dir > 0 ? 'BUY' : 'SELL') + '</span><span class="pd-p e" style="--c:' + R().ECL[t.engine] + '">' + R().ENG[t.engine] + '</span><em class="pd-when">' + dt(t.closed_at) + '</em><span class="pd-px">' + N(t.open_price).toFixed(2) + ' &rarr; ' + N(t.close_price).toFixed(2) + '</span><span class="pd-held">' + N(t.lots).toFixed(2) + ' lots &middot; ' + R().fmtMin(hm) + '</span><b style="color:' + colr(t.profit) + '">' + sgn(t.profit) + '</b></button>'; }).join('') : '<p class="pd-empty">No trades match this filter.</p>') + '</div>'
      + (l.length > shown ? '<button type="button" class="pd-moreb" data-a="more">Show more trades</button>' : '') + '</section>';
  }

  /* ---- engines ---- */
  function enginesTab() {
    var EN = R().ENG, EC = R().ECL;
    return '<div class="pd-eg">' + ['M', 'I', 'D'].map(function (k) {
      var l = T.filter(function (t) { return t.engine === k; }).sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }), w = l.filter(function (t) { return t.profit > 0; }), lo = l.filter(function (t) { return t.profit < 0; }), net = sum(l), pf = lo.length ? sum(w) / -sum(lo) : null;
      var last = l.slice(-24), mx = Math.max.apply(null, last.map(function (t) { return Math.abs(t.profit); }).concat([1]));
      var spark = last.length ? '<svg class="pd-sp" viewBox="0 0 120 34" preserveAspectRatio="none">' + last.map(function (t, i) { var h = Math.max(2, Math.abs(t.profit) / mx * 15), x = i * (120 / last.length) + 1; return '<rect x="' + x.toFixed(1) + '" y="' + (t.profit >= 0 ? 17 - h : 17).toFixed(1) + '" width="' + (120 / last.length - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1" fill="' + (t.profit >= 0 ? 'var(--mint)' : 'var(--red)') + '"/>'; }).join('') + '</svg>' : '';
      return '<button type="button" class="pd-en" data-a="en:' + k + '" style="--c:' + EC[k] + '"><span class="pd-eh"><i></i>' + EN[k] + '</span><b style="color:' + colr(net) + '">' + sgn(net) + '</b><em>' + l.length + ' trades &middot; ' + wr(l) + '% won' + (pf != null ? ' &middot; PF ' + pf.toFixed(2) : '') + '</em>' + spark + '<small>Last ' + last.length + ' trades. Tap for all of them.</small></button>';
    }).join('') + '</div><p class="pd-note">Three independent engines trade the same gold market, each on its own. Their live results are listed here, wins and losses alike.</p>';
  }

  /* ---- calendar ---- */
  var DAYS = {};
  function calendarTab() {
    DAYS = {}; T.forEach(function (t) { var k = dk(t.closed_at); (DAYS[k] = DAYS[k] || []).push(t); });
    var now = new Date(), first = T.length ? new Date(Math.min.apply(null, T.map(function (t) { return new Date(t.closed_at).getTime(); }))) : now, out = '', mx = Math.max.apply(null, Object.keys(DAYS).map(function (k) { return Math.abs(sum(DAYS[k])); }).concat([1]));
    for (var m = 0; m < 6 && out.split('pd-cal').length <= 3; m++) {
      var d0 = new Date(now.getFullYear(), now.getMonth() - m, 1); if (new Date(d0.getFullYear(), d0.getMonth() + 1, 0) < new Date(first.getFullYear(), first.getMonth(), 1)) break;
      var pre = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0'); if (!Object.keys(DAYS).some(function (k) { return k.indexOf(pre) === 0; })) continue;
      var nd = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate(), lead = (d0.getDay() + 6) % 7, cells = '', tot = 0, cnt = 0;
      for (var i = 0; i < lead; i++) cells += '<span class="pd-d x"></span>';
      for (var d = 1; d <= nd; d++) {
        var key = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'), l = DAYS[key], v = l ? sum(l) : 0; if (l) { tot += v; cnt += l.length; }
        var a = l ? (0.22 + 0.6 * Math.abs(v) / mx).toFixed(2) : 0;
        cells += l ? '<button type="button" class="pd-d ' + (v >= 0 ? 'w' : 'l') + '" style="--a:' + a + '" data-a="d:' + key + '" title="' + E(key) + '"><small>' + d + '</small><b>' + (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(0)) + '</b></button>' : '<span class="pd-d e"><small>' + d + '</small></span>';
      }
      out += '<section class="panel pd-pn pd-cal"><div class="pd-ph"><h3>' + MN[d0.getMonth()] + ' ' + d0.getFullYear() + '</h3><span class="pd-sub" style="color:' + colr(tot) + '">' + (cnt ? sgn(tot) + ' &middot; ' + cnt + ' trades' : 'no trades') + '</span></div><div class="pd-wd">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="pd-cg">' + cells + '</div></section>';
    }
    return '<div class="pd-cals">' + out + '</div><p class="pd-note">Each day shows its net result in dollars. Tap a day for its trades.</p>';
  }

  /* ---- render + wiring ---- */
  function render() {
    var el = $('#pd-main', root); var html = tab === 'overview' ? overview() : tab === 'performance' ? performance() : tab === 'trades' ? tradesTab() : tab === 'engines' ? enginesTab() : calendarTab();
    el.innerHTML = html; el.className = 'pd-main pd-t-' + tab; void el.offsetWidth; el.classList.add('pd-swap');
    $$('.pd-nav button', root).forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'); });
    countUp(el);
    bindChart(el);
  }
  function bindChart(el) {
    $$('.pd-ch', el).forEach(function (ch) {
      var S = SERS[ch.dataset.sid]; if (!S) return; var pts = S.pts, o = S.o, n = pts.length, cx = $('.pd-cx', ch), dot = $('.pd-dot', ch), tp = $('.pd-tipc', ch), lo = +ch.dataset.lo, hi = +ch.dataset.hi, rg = (hi - lo) || 1, cur = 0, dd = o.kind === 'dd', tm = !!o.time, t0 = pts[0].t, t1 = pts[n - 1].t;
      function at(e) {
        var r = ch.getBoundingClientRect(), fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        if (tm) { var tt = t0 + fx * (t1 - t0), b = 0; pts.forEach(function (p, i) { if (Math.abs(p.t - tt) < Math.abs(pts[b].t - tt)) b = i; }); cur = b; } else cur = Math.round(fx * (n - 1));
        var q = pts[cur], x = tm ? (q.t - t0) / ((t1 - t0) || 1) * 100 : (n > 1 ? cur / (n - 1) * 100 : 50), y = (1 - (q.v - lo) / rg) * 100, t = q.tr, fl = q.e != null ? q.e - q.v : 0;
        cx.hidden = dot.hidden = false; cx.style.left = x + '%'; dot.style.left = x + '%'; dot.style.top = y + '%';
        tp.innerHTML = '<small>' + new Date(q.t).toLocaleString([], {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) + '</small>'
          + (dd ? '<b>' + sgn(q.v, 2) + '</b><span class="pd-tt">' + (q.v === 0 ? 'at its best point' : 'below its best') + '</span>' : '<b>' + usd(q.v, 2) + '</b>' + (o.eq && Math.abs(fl) > 0.005 ? '<span class="pd-tt e">Equity ' + usd(q.e, 2) + ' (' + sgn(fl, 2) + ' floating)</span>' : ''))
          + (t ? '<span class="pd-tt ' + (t.profit >= 0 ? 'w' : 'l') + '">' + (t.dir > 0 ? 'BUY' : 'SELL') + ' ' + R().ENG[t.engine] + '  ' + sgn(t.profit) + '</span>' : '');
        tp.hidden = false; var cw = ch.clientWidth, chh = ch.clientHeight, px = x / 100 * cw, py = y / 100 * chh, bw = tp.offsetWidth, bh = tp.offsetHeight, below = false, left = Math.max(bw / 2 + 4, Math.min(cw - bw / 2 - 4, px));
        var gap = 38; below = py < bh + gap + 4; var top = below ? py + gap : py - bh - gap; tp.style.left = (left - bw / 2) + 'px'; tp.style.top = top + 'px'; tp.style.setProperty('--ax', (px - left) + 'px'); tp.classList.toggle('below', below);
        cx.style.bottom = 'auto'; if (below) { cx.style.top = (py + 8) + 'px'; cx.style.height = Math.max(0, top - py - 8) + 'px'; } else { cx.style.top = (top + bh) + 'px'; cx.style.height = Math.max(0, py - 8 - top - bh) + 'px'; }
      }
      ch.addEventListener('pointermove', at); ch.addEventListener('pointerdown', at); ch.addEventListener('pointerleave', function () { cx.hidden = dot.hidden = tp.hidden = true; });
      ch.addEventListener('click', function (e) { at(e); var q = pts[cur]; pool(); if (q.tr) return window.gteSheet.trade(q.tr); var k = dk(q.t), l = T.filter(function (t) { return dk(t.closed_at) === k; }); if (l.length && !dd) return open(lst(dshort(q.t), plural(l.length, 'trade') + ', net ' + sgn(sum(l)), l)); open(sheetOf(dshort(q.t), 'Balance ' + usd(q.v, 2), [['Balance', usd(q.v, 2)], ['Equity', usd(q.e == null ? q.v : q.e, 2)]], 'The balance counts closed trades only; equity also counts the floating result of trades that are still open.')); });
    });
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('#pubd [data-a], #pubd [data-tab]'); if (!el || !D) return;
    var tb = el.dataset.tab; if (tb) { tab = tb; render(); return; }
    var a = el.dataset.a.split(':'), k = a[0], v = a.slice(1).join(':'); pool();
        if (k === 'k') return kpiSheet(v);
    if (k === 'today' || k === 'week') { var l0 = T.filter(function (t) { return k === 'today' ? dk(t.closed_at) === dk(Date.now()) : Date.now() - new Date(t.closed_at) < 7 * DAY; }); return l0.length ? open(lst(k === 'today' ? 'Closed today' : 'Last 7 days', plural(l0.length, 'trade') + ', net ' + sgn(sum(l0)), l0)) : open(sheetOf(k === 'today' ? 'Nothing closed today yet' : 'No trades in the last 7 days', 'Live account', [['Trades', '0']], 'The robot only trades when its conditions are met, so some days and even some weeks have no trade. That is normal and nothing is broken.')); }
    if (k === 'lastt') return T.length && window.gteSheet.trade(T[T.length - 1]);
    if (k === 'opn') { tab = 'overview'; render(); var op = arr(D.open); return op.length ? null : open(sheetOf('No trade open right now', 'Live account', [['Open trades', '0']], 'The EA is watching the market. When its conditions are met it opens a trade, with the stop-loss placed at the same moment.')); }
    if (k === 'r') { range = v; return render(); }
    if (k === 'm') { mode = v; return render(); }
    if (k === 'tab') { tab = v; return render(); }
    if (k === 'f') { flt = v; shown = 12; return render(); }
    if (k === 'e') { engF = v; shown = 12; return render(); }
    if (k === 'more') { shown += 15; return render(); }
    if (k === 't' && REC[+v]) return window.gteSheet.trade(REC[+v]);
    if (k === 'l' && LIST[+v]) return window.gteSheet.trade(LIST[+v]);
    if (k === 'd') { var l = DAYS[v] || []; return open(lst(new Date(v + 'T12:00:00').toLocaleDateString([], {weekday: 'long', day: 'numeric', month: 'long'}), plural(l.length, 'trade') + ', net ' + sgn(sum(l)), l)); }
    if (k === 'en') { var l2 = T.filter(function (t) { return t.engine === v; }); return open(lst(R().ENG[v] + ' trades', 'Net ' + sgn(sum(l2)) + ', ' + wr(l2) + '% won', l2)); }
    if (k === 'o') { var o = arr(D.open)[+v]; if (o) return open(sheetOf(String(o.side).toUpperCase() + ' ' + N(o.lots).toFixed(2) + ' lots, open now', (o.engine || 'Trade') + ' on the live demo', [['Floating result', sgn(o.profit), colr(o.profit)], ['Opened', o.open_time ? dt(o.open_time) : '-'], ['Entry price', N(o.open_price).toFixed(2)], ['Stop-loss', o.sl ? N(o.sl).toFixed(2) : 'none']], 'This trade is still open, so its result changes until it closes. The stop-loss was placed the moment it opened.')); }
    if (k === 'status') { var A = D.account || {}; return open(sheetOf('Is it running?', 'Live account', [['Last report', ago(D.updated)], ['Broker', A.broker || '-'], ['Account', (A.type || '') + ' ' + (A.leverage || '')], ['Tracking since', A.started ? dstr(A.started) : '-']], 'MetaTrader 5 sends the account state to this page automatically, every few minutes. It is shown green when the last report is under 45 minutes old. Nobody types these numbers in.')); }
  }, true);
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('#pubd [data-g][data-i]'); if (!el || !REG[el.dataset.g]) return; var r = REG[el.dataset.g], it = r.items[+el.dataset.i]; if (!it) return;
    e.preventDefault(); e.stopPropagation(); pool(); var sp = typeof it.sheet === 'function' ? it.sheet(it, r) : null;
    if (!sp) { var tot = r.items.reduce(function (s, x) { return s + N(x.value); }, 0); sp = explain(it.label, r.meta.title || 'Details', [['Amount', num(it.value)], ['Share', pct(N(it.value), tot) + '%']], '', []); }
    open(sp);
  }, true);
  function refresh() {          // the numbers stay alive: ask for the newest report once a minute and repaint only when something changed
    var sec = $('#account'), url = sec && sec.getAttribute('data-src'); if (!url || document.hidden) return;
    fetch(url + (url.indexOf('?') < 0 ? '?t=' : '&t=') + Date.now(), {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (F) {
      if (!F || !arr(F.history).length || F.updated === D.updated) return; var changed = F.history.length !== D.history.length || JSON.stringify(F.summary) !== JSON.stringify(D.summary);
      D = F; T = D.history.map(mapT).sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }); pool(); if (window.gtePub) { window.gtePub.feed = D; window.gtePub.trades = T; }
      var t = $('.pd-top', root); if (t) t.outerHTML = top(); var sx = $('.pd-sx', root); if (sx) sx.innerHTML = strip() + ticker();
      if (changed) { render(); root.classList.remove('pd-flash'); void root.offsetWidth; root.classList.add('pd-flash'); }
    }).catch(function () {});
  }
  function build(feed) {
    var sec = $('#account'); if (!sec || !feed || !arr(feed.history).length || root) return; D = feed;
    T = D.history.map(mapT).sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }); pool();
    root = document.createElement('div'); root.id = 'pubd'; root.className = 'pd';
    root.innerHTML = '<i class="pd-aur"></i><i class="pd-aur b"></i>' + top() + '<div class="pd-sx">' + strip() + ticker() + '</div><div class="pd-body"><nav class="pd-nav" aria-label="Account sections">' + TABS.map(function (t) { return '<button type="button" data-tab="' + t[0] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + ICON[t[0]] + '</svg><span>' + t[1] + '</span></button>'; }).join('') + '</nav><div id="pd-main" class="pd-main"></div></div><p class="pd-fine">Live demo account. Past results do not guarantee future results. Numbers come straight from MetaTrader 5 and are never edited.</p>';
    var acct = $('.acct', sec); if (!acct) return; acct.insertBefore(root, acct.firstChild); sec.classList.add('pd-on'); render();
    window.gtePub = {feed: D, trades: T, kpi: kpiSheet, stats: stats};
    root.addEventListener('pointermove', function (e) { var el = e.target.closest && e.target.closest('.pd-k, .pd-hero, .pd-en, .pd-pn, .pd-today button, .pd-d'); if (!el) return; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    setInterval(function () { $$('.pd-ago', root).forEach(function (x) { x.textContent = ago(D.updated); }); }, 30000);
    setInterval(refresh, 60000);
  }
  var st = document.createElement('style'); st.id = 'pd-css'; st.textContent = css; document.head.appendChild(st);
  function start() {
    var sec = $('#account'); if (!sec || !window.gteResults || !window.gteSheet) return setTimeout(start, 400);
    var url = sec.getAttribute('data-src'); if (!url) return;
    fetch(url, {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (F) { try { build(F); } catch (e) { if (window.console) console.warn('live dashboard', e); } }).catch(function () {});
  }
  start();
})();
