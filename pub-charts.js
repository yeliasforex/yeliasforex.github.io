/* Public home page: a key-facts strip and six clickable charts under the live account numbers. Built only from the live account feed the section already reads;
   it shows the account as it is, wins and losses alike. Purely additive: if this file does not load, the page works as before. */
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
    o = o || {}; var v = N(value), m = N(max) || 1, p = Math.min(100, v / m * 100), Rr = 38, C = 2 * Math.PI * Rr, c = o.color || (p > 100 ? 'var(--red)' : p > 85 ? 'var(--gold)' : 'var(--mint)'), id = reg([{label: o.label || 'Used', value: v, sheet: o.sheet}], {});
    return '<button type="button" class="acg-ga" data-g="' + id + '" data-i="0"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + Rr + '" fill="none" stroke="var(--line-2)" stroke-width="12"/><circle cx="50" cy="50" r="' + Rr + '" fill="none" stroke="' + c + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (C * Math.min(100, p) / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="53" text-anchor="middle" class="acg-t1" style="font-size:15px">' + Math.round(p) + '%</text></svg><span>' + E(o.caption || '') + '</span></button>';
  }
  function card(title, sub, body, hint, wide) { return body ? {html: '<section class="panel acg-c' + (wide ? ' acg-w' : '') + '"><h3>' + E(title) + '</h3><div class="hint">' + E(sub) + '</div>' + body + '<div class="acg-f">Tap any part for the details.</div></section>'} : {empty: true, title: title, hint: hint || ''}; }
  function fact(tone, title, text, act) { return {tone: tone, title: title, text: text, act: act}; }
  var TONE = {bad: '!', warn: '!', ok: '&#10003;', info: 'i', mute: '&middot;'};
  var css = '.pubg{margin:26px 0 8px}.pubg .acg-i{margin-top:6px}.pubg-h{margin:0 0 4px;font-size:1.15rem}.pubg-s{margin:0 0 12px;color:var(--muted);font-size:.9rem}.pubg .acg-c{background:var(--ink-2)}' +
    '.acg-lad{margin:6px 0 12px;display:flex;flex-direction:column;gap:6px}.acg-lad div{position:relative;display:flex;align-items:center;gap:8px;font-size:.84rem;padding:7px 10px 7px 24px;border-radius:9px;background:var(--panel-2)}.acg-lad i{position:absolute;left:8px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%}.acg-lad span{flex:1;min-width:0}.acg-lad b{font-variant-numeric:tabular-nums}.gs-head{margin:0 0 6px;font-size:14px;font-weight:600;line-height:1.4}' +
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

  /* ---------- the public live account: honest key facts and clickable charts from the same account.json the section above reads ---------- */
  var box = null, built = false;
  var ENGN = {Alpha: 'M', Beta: 'I', Gamma: 'D'}, WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function hold(t) { return (new Date(t.closed_at) - new Date(t.opened_at)) / 6e4; }
  function net(l) { return l.reduce(function (a, t) { return a + N(t.profit); }, 0); }
  function wr(l) { return l.length ? Math.round(l.filter(function (t) { return t.profit > 0; }).length / l.length * 100) : 0; }
  function listSheet(title, sub, list) { return {k: 'trades', title: title, sub: sub, list: list, group: true}; }
  function build(D) {
    var sec = $('#account'); if (!sec || !D || !D.history || !D.history.length || built) return;
    var T = D.history.map(function (h) { return {engine: ENGN[h.engine] || 'M', dir: h.side === 'sell' ? -1 : 1, is_add: false, opened_at: h.open_time, closed_at: h.close_time, open_price: h.open_price, close_price: h.close_price, lots: h.lots, profit: h.profit, exit_reason: h.exit_reason, result_r: h.result_r, mfe_r: h.mfe_r, mae_r: h.mae_r, mfe_usd: h.mfe_usd, mae_usd: h.mae_usd, mfe_pips: h.mfe_pips, mae_pips: h.mae_pips, peak_at: h.peak_at, stop_r: h.stop_r, risk_usd: h.risk_usd}; });
    T.sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); });
    window.GTE_MA = window.GTE_MA || {}; window.GTE_MA.trades = T; window.GTE_MA.rng = function (a) { return a; };
    var S = D.summary || {}, A = D.account || {}, wins = T.filter(function (t) { return t.profit > 0; }), loss = T.filter(function (t) { return t.profit < 0; });
    var aw = wins.length ? net(wins) / wins.length : 0, al = loss.length ? net(loss) / loss.length : 0, f = [], dm = {};
    T.forEach(function (t) { var k = dk(t.closed_at); dm[k] = (dm[k] || 0) + N(t.profit); }); var dks = Object.keys(dm).sort(function (a, b) { return dm[a] - dm[b]; });
    var days = Math.max(1, Math.round((Date.now() - new Date(A.started || T[0].opened_at).getTime()) / DAY)), nt = N(S.net_profit);
    f.push(fact('info', plural(T.length, 'trade') + ' in ' + plural(days, 'day') + ': still early', 'A live demo on ' + E(A.broker || 'MetaTrader 5') + ', shown as it is. A few weeks is short for any strategy, so judge it over months. Tap for the whole account.', function () {
      open(explain('The live account', (A.broker || 'MetaTrader 5') + ' ' + (A.type || 'demo') + ' account', [['Started', dstr(A.started)], ['Deposited', usd(S.deposits)], ['Balance now', usd(S.balance, 2)], ['Result', sgn(nt), col(nt)], ['Trades closed', String(T.length)], ['Win rate', N(S.win_rate).toFixed(1) + '%'], ['Profit factor', N(S.profit_factor).toFixed(2)], ['Deepest dip', N(S.max_drawdown_pct).toFixed(2) + '%'], ['Last update', ago(D.updated)]], 'These numbers come straight from MetaTrader 5 and are never edited. A demo account uses no real money, so judge the robot over weeks, not days.', []));
    }));
    if (wins.length && loss.length) f.push(fact(al && Math.abs(al) > aw ? 'warn' : 'ok', 'Average win ' + sgn(aw) + ', average loss ' + sgn(al), (N(S.profit_factor) < 1 ? 'The average loss is bigger than the average win, so the winners have not covered the losers yet.' : 'The average win is bigger than the average loss.'), function () {
      open(explain('Wins against losses', plural(wins.length, 'win') + ' and ' + plural(loss.length, 'loss', 'losses'), [['Winners', plural(wins.length, 'trade') + ', ' + sgn(net(wins)), 'var(--mint)'], ['Losers', plural(loss.length, 'trade') + ', ' + sgn(net(loss)), 'var(--red)'], ['Average win', sgn(aw), 'var(--mint)'], ['Average loss', sgn(al), 'var(--red)'], ['Profit factor', N(S.profit_factor).toFixed(2)]], 'Profit factor is the money the winners earned divided by the money the losers cost.', []));
    }));
    if (dks.length > 1) f.push(fact('info', 'Best day ' + sgn(dm[dks[dks.length - 1]]) + ', worst day ' + sgn(dm[dks[0]]), 'Tap for the trades of each day.', function () {
      var b = dks[dks.length - 1], w = dks[0];
      open(listSheet('Best and worst day', 'Best ' + sgn(dm[b]) + ' on ' + new Date(b + 'T12:00:00').toLocaleDateString([], {day: 'numeric', month: 'short'}) + ', worst ' + sgn(dm[w]) + ' on ' + new Date(w + 'T12:00:00').toLocaleDateString([], {day: 'numeric', month: 'short'}), T.filter(function (t) { var k = dk(t.closed_at); return k === b || k === w; })));
    }));
    var L = T[T.length - 1], op = arr(D.open);
    f.push(fact(op.length ? 'info' : 'mute', op.length ? plural(op.length, 'trade') + ' open now' : 'No trade open right now', 'Last trade ' + (L.dir > 0 ? 'BUY' : 'SELL') + ' closed ' + ago(L.closed_at) + ' with ' + sgn(L.profit) + '. Tap for its details.', function () { window.gteSheet && window.gteSheet.trade(L); }));
    // charts
    var byE = ['M', 'I', 'D'].map(function (k) { var l = T.filter(function (t) { return t.engine === k; }); return {k: k, l: l}; }).filter(function (x) { return x.l.length; });
    var ECL = R().ECL, EN = R().ENG;
    var engI = byE.map(function (x) { return {label: EN[x.k], short: EN[x.k], value: net(x.l), sheet: function () { return listSheet(EN[x.k] + ' trades', 'Net ' + sgn(net(x.l)) + ', ' + wr(x.l) + '% won', x.l); }}; });
    var buy = T.filter(function (t) { return t.dir > 0; }), sell = T.filter(function (t) { return t.dir < 0; });
    var side = [{label: 'BUY (up)', value: buy.length, color: 'var(--mint)', sheet: function () { return listSheet('BUY trades', 'Net ' + sgn(net(buy)) + ', ' + wr(buy) + '% won', buy); }}, {label: 'SELL (down)', value: sell.length, color: 'var(--red)', sheet: function () { return listSheet('SELL trades', 'Net ' + sgn(net(sell)) + ', ' + wr(sell) + '% won', sell); }}];
    var wdI = [1, 2, 3, 4, 5].map(function (d) { var l = T.filter(function (t) { return new Date(t.closed_at).getDay() === d; }); return {label: WD[d], short: WD[d], value: net(l), sheet: function () { return listSheet(WD[d] + ' trades', plural(l.length, 'trade') + '. Net ' + sgn(net(l)), l); }}; });
    var HB = [['Under 15 min', 0, 15], ['15 to 60 min', 15, 60], ['1 to 4 hours', 60, 240], ['4 to 12 hours', 240, 720], ['Over 12 hours', 720, 1e9]];
    var hI = HB.map(function (h) { var l = T.filter(function (t) { var v = hold(t); return v >= h[1] && v < h[2]; }); return {label: h[0], short: h[0].replace(' min', 'm').replace(' hours', 'h').replace('Under ', '<').replace('Over ', '>').replace(' to ', '-'), value: l.length, sheet: function () { return listSheet('Held ' + h[0].toLowerCase(), plural(l.length, 'trade') + '. Net ' + sgn(net(l)), l); }}; });
    var pr = T.map(function (t) { return N(t.profit); }), lo = Math.min.apply(null, pr), hi = Math.max.apply(null, pr), nb = Math.min(10, Math.max(5, Math.round(Math.sqrt(T.length)))), sp = Math.max(hi - lo, 1), bw = sp / nb, bins = [];
    for (var i = 0; i < nb; i++) bins.push({a: lo + i * bw, b: lo + (i + 1) * bw, l: []}); T.forEach(function (t) { bins[Math.min(nb - 1, Math.floor((N(t.profit) - lo) / bw))].l.push(t); });
    var hist = bins.map(function (b) { var mid = (b.a + b.b) / 2; return {label: sgn(b.a, 0) + ' to ' + sgn(b.b, 0), short: Math.round(mid), value: b.l.length, color: mid >= 0 ? 'var(--mint)' : 'var(--red)', sheet: function () { return listSheet('Results from ' + sgn(b.a, 0) + ' to ' + sgn(b.b, 0), plural(b.l.length, 'trade'), b.l); }}; });
    var cum = 0, pk = 0, dd = T.map(function (t) { cum += N(t.profit); pk = Math.max(pk, cum); return {label: new Date(t.closed_at).toLocaleDateString([], {day: 'numeric', month: 'short'}), short: new Date(t.closed_at).toLocaleDateString([], {day: 'numeric', month: 'short'}), value: cum - pk, sheet: function () { return {k: 'trade', t: t, day: true, title: 'Trade details', sub: 'Result ' + sgn(cum - pk) + ' below the best point so far'}; }}; });
    var cards = [
      card('Which engine made or lost money', 'Net result of each of the three engines. Green earned, red lost.', bars(engI, {title: 'Engines', fmt: function (v) { return sgn(v); }, labels: 3}), 'needs trades'),
      card('BUY and SELL', 'Which direction the robot traded most.', donut(side, {title: 'Direction', center: T.length, centerLabel: 'trades'}), 'needs trades'),
      card('Result by weekday', 'Net result of the trades that closed on each day.', bars(wdI, {title: 'Weekdays', fmt: function (v) { return sgn(v); }, labels: 5}), 'needs trades'),
      card('Time in a trade', 'How long trades stayed open.', bars(hI, {title: 'Time in a trade', color: 'var(--blue-hi)', labels: 5}), 'needs times'),
      card('How big the results were', 'Each bar counts trades by their result.', bars(hist, {title: 'Results', labels: 6}), 'needs trades'),
      card('How far below its best', 'The result against its highest point so far, after each trade. Zero is a new high.', line(dd, {title: 'Drawdown', fmt: function (v) { return sgn(v); }, color: 'var(--red)'}), 'needs trades')];
    var real = cards.filter(function (c) { return !c.empty; });
    box = document.createElement('div'); box.id = 'pubg'; box.className = 'pubg';
    box.innerHTML = '<div class="acg-gr">' + real.map(function (x) { return x.html; }).join('') + '</div>';
    var grid = $('.acct-grid', sec), host = grid && grid.parentNode; if (!host) return;
    host.insertBefore(box, grid); built = true;
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('#pubg [data-g][data-i]'); if (!el || !REG[el.dataset.g]) return; var r = REG[el.dataset.g], it = r.items[+el.dataset.i]; if (!it) return;
    e.preventDefault(); e.stopPropagation(); var sp = typeof it.sheet === 'function' ? it.sheet(it, r) : null;
    if (!sp) { var tot = r.items.reduce(function (s, x) { return s + N(x.value); }, 0); sp = explain(it.label, r.meta.title || 'Details', [['Amount', num(it.value)], ['Share', pct(N(it.value), tot) + '%']], '', []); }
    open(sp);
  }, true);
  var st = document.createElement('style'); st.id = 'pubg-css'; st.textContent = css; document.head.appendChild(st);
  function start() {
    var sec = $('#account'); if (!sec || !window.gteResults || !window.gteSheet) return setTimeout(start, 400);
    var url = sec.getAttribute('data-src'); if (!url) return;
    fetch(url, {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (D) { try { build(D); } catch (e) { if (window.console) console.warn('public charts', e); } }).catch(function () {});
  }
  start();
})();
