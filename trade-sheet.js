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
  function exitOf(t) {
    if (t.exit_reason === 'stop') { var rr = Number(t.result_r), pr = Number(t.profit); if (pr > 0.01 && !(Math.abs(rr) < 0.1)) return ['Stop moved up, then hit', 'mint', 'The stop had moved into profit before the price reached it, so the trade closed with a gain.']; if (Math.abs(rr) < 0.1) return ['Stopped at breakeven', 'faint', 'The stop was at the entry price when the price reached it, so the trade closed about even.']; }
    return EXIT[t.exit_reason] || (t.exit_reason ? [String(t.exit_reason), 'faint', ''] : ['Exit not recorded', 'faint', '']); }
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
  function stopWord(t) { var v = t.stop_r; if (v == null) return null; return v <= -0.9 ? 'its original level' : v > 0.05 ? 'a locked profit of ' + v.toFixed(2) + 'R' : 'breakeven'; }
  function storyLine(t) {      // one plain sentence: what the trade did, in order
    if (!hasStory(t)) return '';
    var m = Math.max(0, Number(t.mfe_r)), rr = Number(t.result_r || 0), fin = (rr >= 0 ? '+' : '\u2212') + Math.abs(rr).toFixed(2) + 'R', up = '+' + m.toFixed(2) + 'R' + (t.mfe_usd ? ' (' + usd(t.mfe_usd) + ' at that point)' : '');
    var when = t.opened_at && t.peak_at ? ' after ' + R().fmtMin(Math.max(0, (new Date(t.peak_at) - new Date(t.opened_at)) / 6e4)) : '', keep = m > 1 ? Math.round(Math.max(0, rr) / m * 100) : null;
    if (m >= 0.5) {
      if (rr > 0.15 && keep != null && keep < 70) return 'The trade reached ' + up + when + ', then pulled back. It closed at ' + fin + ', keeping ' + keep + '% of its best point.';
      if (rr > 0.15) return 'The trade reached ' + up + when + ' and closed close to it at ' + fin + (keep != null ? ', keeping ' + keep + '% of its best point.' : '.');
      if (rr >= -0.15) return 'The trade reached ' + up + when + ', then fell all the way back. It closed at ' + fin + ', about breakeven.';
      return 'The trade was up ' + up + when + ', then reversed and closed at ' + fin + '.';
    }
    if (rr < -0.05) return 'The trade never got going. Its best point was only +' + m.toFixed(2) + 'R before it moved against you and closed at ' + fin + '.';
    return 'The trade stayed close to the entry and closed at ' + fin + '.';
  }
  /* the journey chart: time to scale, R and dollars, straight lines through the points the EA recorded, a night look and a day look */
  var jyN = 0;

  function jyCss() {
    if ($('#gs-jy-css')) return; var st = document.createElement('style'); st.id = 'gs-jy-css';
    var night = '--jy-bg:radial-gradient(120% 90% at 85% -10%,rgba(124,92,255,.28),transparent 55%),radial-gradient(90% 70% at 0% 110%,rgba(34,211,238,.18),transparent 60%),#070B1A;--jy-bd:rgba(120,140,255,.3);--jy-ink:#E6ECFF;--jy-mu:#7F8BB5;--jy-gr:rgba(130,150,255,.2);--jy-gz:#9FB0E8;--jy-up:#34F5A8;--jy-dn:#FF5D7A;--jy-gold:#FFC857;--jy-a:#22D3EE;--jy-b:#A78BFA;--jy-card:rgba(10,16,40,.93);--jy-box:rgba(20,28,60,.55);--jy-fx:1;--jy-glow:3.2;--jy-sh:0 0 0 1px rgba(34,211,238,.08) inset,0 26px 50px -30px rgba(80,90,255,.6);--jy-dim:#9FB0E8;--jy-ring:rgba(120,140,255,.18)';
    var day = '--jy-bg:linear-gradient(180deg,#FFFFFF,#EEF3FF);--jy-bd:rgba(42,85,217,.2);--jy-ink:#0B1330;--jy-mu:#6A76A0;--jy-gr:rgba(42,85,217,.14);--jy-gz:#3A4A80;--jy-up:#0B9E6B;--jy-dn:#D12B3A;--jy-gold:#B7791F;--jy-a:#2A55D9;--jy-b:#7C5CF5;--jy-card:rgba(255,255,255,.96);--jy-box:#FFFFFF;--jy-fx:0;--jy-glow:1.6;--jy-sh:0 22px 44px -30px rgba(42,85,217,.55);--jy-dim:#55648F;--jy-ring:rgba(42,85,217,.14)';
    st.textContent = '.jy{' + day + ';position:relative;border-radius:18px;margin:10px 0 8px;border:1px solid var(--jy-bd);background:var(--jy-bg);box-shadow:var(--jy-sh);color:var(--jy-ink);overflow:hidden}'
      + ':root[data-theme="dark"] .jy{' + night + '}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .jy{' + night + '}}'
      + '.jy:before{content:"";position:absolute;inset:0;opacity:var(--jy-fx);background-image:linear-gradient(rgba(130,150,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(130,150,255,.06) 1px,transparent 1px);background-size:22px 22px;-webkit-mask-image:radial-gradient(100% 80% at 50% 40%,#000,transparent);mask-image:radial-gradient(100% 80% at 50% 40%,#000,transparent);pointer-events:none}'
      + '.jy:after{content:"";position:absolute;left:0;right:0;top:-40%;height:40%;opacity:var(--jy-fx);background:linear-gradient(transparent,rgba(34,211,238,.1),transparent);animation:jySc 5s linear infinite;pointer-events:none}@keyframes jySc{to{top:110%}}'
      + '.jy>i{position:absolute;width:12px;height:12px;border:2px solid var(--jy-a);opacity:calc(.25 + var(--jy-fx) * .45);z-index:2}.jy>i.c1{left:7px;top:7px;border-right:0;border-bottom:0;border-top-left-radius:6px}.jy>i.c2{right:7px;top:7px;border-left:0;border-bottom:0;border-top-right-radius:6px}.jy>i.c3{left:7px;bottom:7px;border-right:0;border-top:0;border-bottom-left-radius:6px}.jy>i.c4{right:7px;bottom:7px;border-left:0;border-top:0;border-bottom-right-radius:6px}'
      + '.jy-in{position:relative;z-index:1;padding:12px 8px 10px}.jy-h{font:600 10px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--jy-mu);margin:0 4px 2px}'
      + '.jy-sv{display:block;width:100%;height:auto;overflow:visible}.jy-sv text{font-family:ui-monospace,Menlo,Consolas,monospace}'
      + '.jy-tx{font-size:12px;fill:var(--jy-dim)}.jy-px{font-size:11.5px;fill:var(--jy-dim)}.jy-px.z{fill:var(--jy-ink);font-weight:700}.jy-tx.z{fill:var(--jy-ink);font-weight:700}.jy-gr{stroke:var(--jy-gr);stroke-width:.7;stroke-dasharray:2 5}.jy-gr.z{stroke:var(--jy-gz);stroke-width:1.2;stroke-dasharray:none}'
      + '.jy-zu{fill:var(--jy-up);fill-opacity:.05}.jy-zd{fill:var(--jy-dn);fill-opacity:.06}.jy-sa.u{stop-color:var(--jy-up);stop-opacity:.34}.jy-sa.d{stop-color:var(--jy-dn);stop-opacity:.3}.jy-sa.z{stop-opacity:0}'
      + '.jy-l0{stop-color:var(--jy-a)}.jy-l1{stop-color:var(--jy-b)}.jy-l2.u{stop-color:var(--jy-up)}.jy-l2.d{stop-color:var(--jy-dn)}'
      + '.jy-ar{opacity:0;animation:jyFd 1s 1.2s forwards}@keyframes jyFd{to{opacity:1}}'
      + '.jy-ln{fill:none;stroke-width:3.4;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:jyDr 1.7s .2s cubic-bezier(.3,.7,.2,1) forwards}@keyframes jyDr{to{stroke-dashoffset:0}}'
      + '.jy-wl{stroke:var(--jy-dn);stroke-width:1.1;stroke-dasharray:1 4.5;stroke-linecap:round;opacity:.85}.jy-wt{font-size:11.5px;font-weight:600;fill:var(--jy-dn)}.jy-st{stroke:var(--jy-gold);stroke-width:1.6;stroke-dasharray:5 3}.jy-stt{font-size:11.5px;font-weight:600;fill:var(--jy-gold)}'
      + '.jy-br{fill:none;stroke:var(--jy-dn);stroke-width:1.4;stroke-linecap:round;opacity:0;animation:jyFd .6s 1.7s forwards}.jy-bt{font-size:12.5px;font-weight:700;fill:var(--jy-dn);opacity:0;animation:jyFd .6s 1.85s forwards}'
      + '.jy-dot{fill:var(--jy-ink);opacity:calc(.35 + var(--jy-fx) * .65)}.jy-scan{fill:var(--jy-a);fill-opacity:calc(.1 + var(--jy-fx) * .12);animation:jySw 2.2s .15s cubic-bezier(.4,0,.2,1) forwards;pointer-events:none}@keyframes jySw{from{transform:translateX(0);opacity:.9}to{transform:translateX(calc(100% * 14));opacity:0}}'
      + '.jy-o{fill:var(--jy-ink);stroke:var(--jy-card);stroke-width:2.5}'
      + '.jy-c{opacity:0;animation:jyFd .6s forwards}.jy-c line{stroke-width:1.2;opacity:.8}.jy-c rect{fill:var(--jy-card);stroke-width:1}.jy-c .a{font-size:13px;font-weight:700}.jy-c .b{font-size:11.5px;fill:var(--jy-dim)}'
      + '.jy-c.g line,.jy-c.g rect{stroke:var(--jy-up)}.jy-c.g .a,.jy-c.g .pt,.jy-c.g .rg{fill:var(--jy-up)}.jy-c.y line,.jy-c.y rect{stroke:var(--jy-gold)}.jy-c.y .a,.jy-c.y .pt{fill:var(--jy-gold)}'
      + '.jy-c .pt{stroke:var(--jy-card);stroke-width:2.5}.jy-c .rg{fill:none;stroke-width:1.4;transform-box:fill-box;transform-origin:center;animation:jyRg 2.4s ease-out infinite}.jy-c.g .rg{stroke:var(--jy-up)}.jy-c.y .rg{stroke:var(--jy-gold)}@keyframes jyRg{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.6);opacity:0}}'
      + '.jy-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:0 4px 4px}.jy-top .jy-h{margin:0}.jy-ps{display:flex;gap:6px;flex-wrap:wrap}.jy-p{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;padding:3px 10px 3px 7px;border-radius:999px;border:1px solid var(--jy-bd);background:var(--jy-box);color:var(--jy-dim);white-space:nowrap}.jy-p b{color:var(--jy-ink);font-weight:800}.jy-p svg{width:16px;height:16px;flex:none;color:var(--jy-a)}.jy-p svg .t{fill:none;stroke:var(--jy-ring);stroke-width:3}.jy-p svg .v{fill:none;stroke-width:3;stroke-linecap:round;stroke-dashoffset:50.3;animation:jyG 1.3s .6s cubic-bezier(.3,.7,.2,1) forwards}.jy-p svg .v.u{stroke:var(--jy-up)}.jy-p svg .v.y{stroke:var(--jy-gold)}.jy-p svg .v.d{stroke:var(--jy-dn)}.jy-bd{fill:var(--jy-a);fill-opacity:.07;stroke:var(--jy-a);stroke-opacity:.25;stroke-dasharray:3 4}.jy-n{margin:2px 6px 8px;font-size:11.5px;line-height:1.4;color:var(--jy-mu)}.jy-sp{display:grid;grid-template-columns:112px 1fr;gap:10px;align-items:stretch;margin-top:2px}.jy-g{position:relative;display:flex;align-items:center;justify-content:center}.jy-gs{width:104px;height:104px;filter:drop-shadow(0 0 calc(var(--jy-fx) * 6px) var(--jy-a))}.jy-gs .t{fill:none;stroke:var(--jy-ring);stroke-width:9}.jy-gs .v{fill:none;stroke-width:9;stroke-linecap:round;stroke-dashoffset:263.9;animation:jyG 1.5s .5s cubic-bezier(.3,.7,.2,1) forwards}@keyframes jyG{to{stroke-dashoffset:var(--to)}}.jy-l2.y{stop-color:var(--jy-gold)}.jy-gv{position:absolute;text-align:center;font-size:21px;font-weight:800;letter-spacing:-.02em}.jy-gv small{display:block;font:600 9px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--jy-mu);margin-top:1px}.jy-b{position:relative;border-radius:16px;padding:11px 12px 10px;background:var(--jy-box);border:1px solid var(--jy-bd);overflow:hidden;opacity:0;transform:translateY(8px);animation:jyUp .6s forwards}.jy-b.r{animation-delay:.9s}.jy-b.h{animation-delay:1.1s}@keyframes jyUp{to{opacity:1;transform:none}}.jy-b:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--jy-a),var(--jy-b))}.jy-b .ic{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:9px;color:#fff;background:linear-gradient(135deg,var(--jy-a),var(--jy-b));box-shadow:0 8px 18px -8px var(--jy-a)}.jy-b .ic svg{width:15px;height:15px}.jy-b small{display:block;margin-top:7px;font:700 10px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--jy-mu)}.jy-b b{display:block;font-size:20px;font-weight:800;letter-spacing:-.02em;margin-top:1px;white-space:nowrap}.jy-b em{display:block;font-style:normal;font-size:11px;line-height:1.3;color:var(--jy-dim);margin-top:2px}.jy-b.r:after{content:"";position:absolute;right:-18px;bottom:-18px;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,var(--jy-a),transparent 70%);opacity:calc(.1 + var(--jy-fx) * .2)}@media (prefers-reduced-motion:reduce){.jy:after,.jy-scan,.jy-dot,.jy-c .rg{display:none}.jy-ln{animation:none;stroke-dashoffset:0}.jy-ar,.jy-c,.jy-br,.jy-bt,.jy-b{animation:none;opacity:1;transform:none}.jy-gs .v{animation:none;stroke-dashoffset:var(--to)}}';
    document.head.appendChild(st);
  }
  function journey(t) {
    jyCss();
    if (!t.opened_at || !t.closed_at || t.mfe_r == null || t.mae_r == null) return '';
    var o = new Date(t.opened_at).getTime(), c = new Date(t.closed_at).getTime(); if (!(c > o)) return '';
    var pk = t.peak_at ? new Date(t.peak_at).getTime() : o; pk = Math.max(o, Math.min(c, isFinite(pk) ? pk : o));
    var pkv = pk, sp0 = c - o; if (pkv - o < sp0 * .06) pkv = o + sp0 * .08; else if (c - pkv < sp0 * .06) pkv = c - sp0 * .08;
    var best = Math.max(0, Number(t.mfe_r)), worst = Math.min(0, Number(t.mae_r)), rr = Number(t.result_r || 0), stop = t.stop_r == null ? null : Number(t.stop_r), gave = Math.max(0, best - rr);
    var per = Number(t.risk_usd) > 0 ? Number(t.risk_usd) : (t.mfe_usd && best > 0.05 ? Math.abs(Number(t.mfe_usd) / best) : (t.result_r ? Math.abs(Number(t.profit) / rr) : 0));
    var win = Number(t.profit) > 0, id = 'jy' + (++jyN), keep = best > 1 ? Math.max(0, Math.min(100, rr / best * 100)) : null;
    var ep = Number(t.open_price), cp = Number(t.close_price), dr = Number(t.dir) >= 0 ? 1 : -1;
    var ppr = (t.mfe_pips != null && best > 0.05) ? Number(t.mfe_pips) / best * 0.1 : (Math.abs(rr) > 0.1 ? Math.abs((cp - ep) / rr) : 0), hasP = isFinite(ppr) && ppr > 0 && isFinite(ep) && t.open_price != null;
    var pxOf = function (v) { return ep + dr * v * ppr; };
    var W = 340, H = 292, pl = 46, pr = hasP ? 56 : 12, pt = 58, pb = 68, mx = Math.ceil((best + .4) * 2) / 2, mn = Math.floor((Math.min(worst, -.25) - .15) * 2) / 2;
    var X = function (x) { return pl + (x - o) / (c - o) * (W - pl - pr); }, Y = function (v) { return pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb); };
    var hm = function (x) { return new Date(x).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false}); }, sg = function (v, d) { return (v > 0.004 ? '+' : v < -0.004 ? '\u2212' : '') + Math.abs(v).toFixed(d == null ? 2 : d); };
    var cls = win ? 'u' : 'd', out = '', xo = X(o), xp = X(pkv), xc = X(c), yo = Y(0), yp = Y(best), yc = Y(rr), yw = Y(worst), f = function (n) { return n.toFixed(1); };
    // a smooth path through the recorded points (flat at each point, so there are no sharp corners); it is a guide, the real price moved in between
    var path = best <= 0.05 ? 'M' + f(xo) + ' ' + f(yo) + ' C ' + f(xo + (xc - xo) * .5) + ' ' + f(yo) + ', ' + f(xc - (xc - xo) * .5) + ' ' + f(yc) + ', ' + f(xc) + ' ' + f(yc)
      : 'M' + f(xo) + ' ' + f(yo) + ' C ' + f(xo + (xp - xo) * .55) + ' ' + f(yo) + ', ' + f(xp - (xp - xo) * .42) + ' ' + f(yp) + ', ' + f(xp) + ' ' + f(yp) + ' C ' + f(xp + (xc - xp) * .42) + ' ' + f(yp) + ', ' + f(xc - (xc - xp) * .5) + ' ' + f(yc) + ', ' + f(xc) + ' ' + f(yc);
    out += '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="jy-sa ' + cls + '"/><stop offset="1" class="jy-sa ' + cls + ' z"/></linearGradient>'
      + '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="jy-l0"/><stop offset=".55" class="jy-l1"/><stop offset="1" class="jy-l2 ' + cls + '"/></linearGradient>'
      + '<filter id="' + id + 'g" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '<clipPath id="' + id + 'c"><rect x="' + pl + '" y="' + (pt - 6) + '" width="' + (W - pl - pr) + '" height="' + (H - pt - pb + 12) + '"/></clipPath></defs>';
    out += '<rect class="jy-zu" x="' + pl + '" y="' + pt + '" width="' + (W - pl - pr) + '" height="' + Math.max(0, yo - pt) + '"/><rect class="jy-zd" x="' + pl + '" y="' + f(yo) + '" width="' + (W - pl - pr) + '" height="' + Math.max(0, H - pb - yo) + '"/>';
    out += '<rect class="jy-bd" x="' + pl + '" y="' + f(yp) + '" width="' + (W - pl - pr) + '" height="' + Math.max(2, yw - yp).toFixed(1) + '" rx="6"/>';   // the range the price lived in
    var step = (mx - mn) > 3.2 ? 1 : .5;
    for (var v = Math.ceil(mn / step) * step; v <= mx + 1e-9; v += step) {
      var z = Math.abs(v) < 1e-9;
      out += '<line class="jy-gr' + (z ? ' z' : '') + '" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + f(Y(v)) + '" y2="' + f(Y(v)) + '"/><text class="jy-tx' + (z ? ' z' : '') + '" x="' + (pl - 7) + '" y="' + f(Y(v) + 4) + '" text-anchor="end">' + (z ? 'Entry' : sg(v, 1) + 'R') + '</text>' + (hasP ? '<text class="jy-px' + (z ? ' z' : '') + '" x="' + (W - pr + 6) + '" y="' + f(Y(v) + 4) + '">' + (z ? ep.toFixed(2) : pxOf(v).toFixed(1)) + '</text>' : '');
    }
    var span = (c - o) / 6e4, ticks = span > 480 ? 180 : span > 300 ? 120 : span > 150 ? 60 : span > 60 ? 30 : span > 20 ? 10 : 5, tick = ticks * 6e4, q0 = Math.ceil(o / tick) * tick, nt = 0;
    for (var q = q0; q <= c && nt < 5; q += tick, nt++) out += '<text class="jy-tx" x="' + f(X(q)) + '" y="' + (H - 8) + '" text-anchor="middle">' + hm(q) + '</text>';
    out += '<g clip-path="url(#' + id + 'c)"><path class="jy-ar" d="' + path + ' L' + f(xc) + ' ' + f(yo) + ' L' + f(xo) + ' ' + f(yo) + ' Z" fill="url(#' + id + 'a)"/></g>';
    out += '<line class="jy-wl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + f(yw) + '" y2="' + f(yw) + '"/>' + (worst < -0.05 ? '<text class="jy-wt" x="' + (pl + 6) + '" y="' + f(yw + (worst < -.6 ? -6 : 14)) + '">Worst dip ' + sg(worst) + 'R</text>' : '');
    if (stop != null && stop >= mn && stop <= mx) { var ys = Y(stop), sx = Math.max(xo + 6, xc - (W - pl - pr) * .3); out += '<line class="jy-st" x1="' + f(sx) + '" x2="' + f(xc) + '" y1="' + f(ys) + '" y2="' + f(ys) + '"/>' ; }
    out += '<path id="' + id + 'p" class="jy-ln" d="' + path + '" stroke="url(#' + id + 'l)" pathLength="1" filter="url(#' + id + 'g)"/>';
    if (gave > 0.3 && best >= 0.5) { var bx = xp + 16; out += '<path class="jy-br" d="M' + f(bx) + ' ' + f(yp + 4) + ' L' + f(bx + 7) + ' ' + f(yp + 4) + ' L' + f(bx + 7) + ' ' + f(yc - 4) + ' L' + f(bx) + ' ' + f(yc - 4) + '"/><text class="jy-bt" x="' + f(bx + 13) + '" y="' + f((yp + yc) / 2 - 2) + '">Gave back</text><text class="jy-bt" x="' + f(bx + 13) + '" y="' + f((yp + yc) / 2 + 12) + '">' + gave.toFixed(2) + 'R</text>'; }
    out += '<circle class="jy-dot" r="4"><animateMotion dur="3.6s" repeatCount="indefinite" begin="1.9s"><mpath href="#' + id + 'p"/></animateMotion></circle><rect class="jy-scan" x="' + pl + '" y="' + (pt - 6) + '" width="22" height="' + (H - pt - pb + 12) + '"/>';
    var call = function (cx, cy, k, l1, l2, above, dl) {
      var w = Math.max(l1.length * 7.6, l2.length * 6.6) + 22, x = Math.max(pl + 2, Math.min(W - pr - w + 8, cx - w / 2)), y = above ? pt - 52 : H - pb + 8;
      return '<g class="jy-c ' + k + '" style="animation-delay:' + dl + 's"><line x1="' + f(cx) + '" x2="' + f(cx) + '" y1="' + f(cy) + '" y2="' + f(above ? y + 42 : y) + '"/><rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="42" rx="11"/><text class="a" x="' + f(x + 11) + '" y="' + f(y + 18) + '">' + l1 + '</text><text class="b" x="' + f(x + 11) + '" y="' + f(y + 33) + '">' + l2 + '</text><circle class="rg" cx="' + f(cx) + '" cy="' + f(cy) + '" r="9"/><circle class="pt" cx="' + f(cx) + '" cy="' + f(cy) + '" r="5.5"/></g>';
    };
    out += '<circle class="jy-o" cx="' + f(xo) + '" cy="' + f(yo) + '" r="5.5"/>';
    if (best > 0.05) out += call(xp, yp, 'g', 'Best point +' + best.toFixed(2) + 'R', (hasP ? pxOf(best).toFixed(2) + ' \u00b7 ' : (per ? '$' + (best * per).toFixed(0) + ' \u00b7 ' : '')) + hm(pk), true, 1.2);
    out += call(xc, yc, 'y', 'Closed ' + sg(rr) + 'R', (isFinite(cp) ? cp.toFixed(2) : usd(t.profit)) + ' \u00b7 ' + hm(c), false, 1.5);
    var kc = keep == null ? 'n' : keep > 50 ? 'u' : keep > 20 ? 'y' : 'd', rc = 2 * Math.PI * 8, kd = (rc * (1 - (keep == null ? 0 : keep / 100))).toFixed(1);
    var pill1 = keep == null ? '' : '<span class="jy-p" title="How much of the best point was still there at the close"><svg viewBox="0 0 20 20"><circle class="t" cx="10" cy="10" r="8"/><circle class="v ' + kc + '" cx="10" cy="10" r="8" transform="rotate(-90 10 10)" stroke-dasharray="' + rc.toFixed(1) + '" style="--to:' + kd + '"/></svg><b>' + Math.round(keep) + '%</b> of the peak kept</span>';
    var pill2 = per ? '<span class="jy-p" title="The amount at stake on this trade, called 1R"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z"/></svg>Risk <b>' + usd(per) + '</b></span>' : '';
    return '<div class="jy"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><div class="jy-in"><div class="jy-top"><span class="jy-h">Trade journey</span><span class="jy-ps">' + pill1 + pill2 + '</span></div><svg class="jy-sv" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Journey of this trade: entry, best point and close, with time to scale">' + out + '</svg>'
      + '<p class="jy-n">Time to scale, gold price on the right. The line is smoothed between recorded points; the band is the range the price stayed in.</p></div></div>';
  }
  function storyBlock(t) {
    if (!hasStory(t) && t.result_r == null) return '';
    if (!hasStory(t)) return '<div class="gs-story"><h4>What happened inside this trade</h4><p class="gs-fine">Not recorded. Only trades closed by EA 1.09 or newer carry this; older ones are filled in when the EA re-syncs its history.</p></div>';
    var m = Math.max(0, Number(t.mfe_r)), w = Math.min(0, Number(t.mae_r)), rr = Number(t.result_r || 0), sw = stopWord(t), gave = m >= 0.5 ? Math.max(0, m - rr) : 0, span = Math.max(m - w, .01), sr = t.stop_r == null ? null : Number(t.stop_r);
    var py = function (v) { return (100 - Number(px(v))).toFixed(1); }, tm = function (d) { return new Date(d).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}); };
    var cl = function (x) { return Math.max(14, Math.min(86, Number(x))).toFixed(1); };
    var px = function (v) { return Math.max(0, Math.min(100, (v - w) / span * 100)).toFixed(1); };
    var tile = function (l, r, d, c) { return '<div class="gs-tl"><small>' + l + '</small><b style="color:' + c + '">' + r + '</b><em>' + d + '</em></div>'; };
    var jy = journey(t);
    var more = (t.peak_at ? '<div><span>Best point came</span><b>' + dt(t.peak_at) + (t.opened_at ? ' (' + R().fmtMin(Math.max(0, (new Date(t.peak_at) - new Date(t.opened_at)) / 6e4)) + ' in)' : '') + '</b></div>' : '')
      + (sw ? '<div><span>Stop when closed</span><b>' + sw + '</b></div>' : '') + (t.risk_usd != null ? '<div><span>Risked (1R)</span><b>' + usd(t.risk_usd) + '</b></div>' : '');
    return '<div class="gs-story"><h4>What happened inside this trade</h4><p class="gs-head">' + storyLine(t) + '</p>'
      + (jy ? jy : ''
        + '<div class="gs-lad"><div class="gs-lc"><span class="hi" style="top:0;height:' + py(0) + '%"></span><span class="lo" style="top:' + py(0) + '%;bottom:0"></span>' + (sr != null && sr >= w && sr <= m ? '<u style="top:' + py(sr) + '%" title="Stop"></u>' : '') + '<i class="n" style="top:' + py(0) + '%"></i><i class="r" style="top:' + py(rr) + '%"></i></div>'
      + '<span class="gs-lcl" style="top:' + py(rr) + '%">closed ' + (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R &#9654;</span>'
      + '<span class="gs-lr up top" style="top:0">best +' + m.toFixed(2) + 'R</span><span class="gs-lr en' + (Number(py(0)) > 84 ? ' up2' : '') + '" style="top:' + py(0) + '%">entry</span>' + (w < -0.05 ? '<span class="gs-lr dn" style="top:100%">worst ' + w.toFixed(2) + 'R</span>' : '') + '</div>'
      + (t.opened_at && t.peak_at ? '<p class="gs-tlp">Opened ' + tm(t.opened_at) + ' &middot; best point ' + tm(t.peak_at) + ' (' + R().fmtMin(Math.max(0, (new Date(t.peak_at) - new Date(t.opened_at)) / 6e4)) + ' in) &middot; closed ' + tm(t.closed_at) + '</p>' : '')
      + '<div class="gs-tls">' + tile('Best', '+' + m.toFixed(2) + 'R', usd(t.mfe_usd) + (t.mfe_pips != null ? ' &middot; ' + Number(t.mfe_pips).toFixed(0) + ' pips' : ''), 'var(--mint)')
      + tile('Worst', w.toFixed(2) + 'R', usd(t.mae_usd) + (t.mae_pips != null ? ' &middot; ' + Number(t.mae_pips).toFixed(0) + ' pips' : ''), w < -0.05 ? 'var(--red)' : 'inherit')
      + tile('Closed', (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R', usd(t.profit), col(t.profit)) + '</div>')
      + (sw ? '<div class="gs-chips"><span class="gs-chip"><i class="gs-sd"></i>Stop: ' + sw + '</span></div>' : '') + '</div>';
  }
  function injectCss() {
    if ($('#gs-story-css')) return; var st = document.createElement('style'); st.id = 'gs-story-css';
    st.textContent = '.gs-story{margin-top:12px;padding-top:10px;border-top:1px solid var(--line,rgba(255,255,255,.12))}.gs-story h4{margin:0 0 8px;font-size:13px;font-weight:700}'
      + '.gs-rail{position:relative;height:10px;border-radius:5px;background:rgba(255,255,255,.07);margin:6px 0 2px}.gs-rail .lo,.gs-rail .hi{position:absolute;top:3px;height:4px;border-radius:2px}.gs-rail .lo{background:var(--red,#ff5d6c);opacity:.7}.gs-rail .hi{background:var(--mint,#3ddc97);opacity:.7}'
      + '.gs-rail i{position:absolute;top:-3px;width:2px;height:16px;margin-left:-1px;border-radius:1px}.gs-rail i.n{background:rgba(255,255,255,.55)}.gs-rail i.r{background:var(--gold,#f5c451);width:4px;margin-left:-2px;top:-4px;height:18px}'
      + '.gs-lad{position:relative;height:132px;margin:12px 0 24px}.gs-lc{position:absolute;left:44%;top:0;bottom:0;width:10px;border-radius:6px;background:rgba(127,127,127,.12)}.gs-lc .hi,.gs-lc .lo{position:absolute;left:3px;width:4px;border-radius:2px;opacity:.75}.gs-lc .hi{background:var(--mint,#3ddc97)}.gs-lc .lo{background:var(--red,#ff5d6c)}.gs-lc i{position:absolute;left:-4px;width:18px;height:2px;margin-top:-1px;background:rgba(127,127,127,.7)}.gs-lc i.r{height:4px;margin-top:-2px;background:var(--gold,#f5c451);border-radius:2px;left:-6px;width:22px}.gs-lc u{position:absolute;left:-4px;width:18px;border-top:2px dashed rgba(127,127,127,.8)}.gs-lr{position:absolute;left:calc(44% + 22px);transform:translateY(-50%);font-size:11px;white-space:nowrap}.gs-lr.top{transform:none}.gs-lr.en{opacity:.75}.gs-lr.en.up2{transform:translateY(-100%)}.gs-lr.dn{transform:translateY(3px)}.gs-lcl{position:absolute;right:calc(56% + 12px);transform:translateY(-50%);font-size:11px;font-weight:700;white-space:nowrap;color:var(--gold,#f5c451)}.gs-tlp{margin:0 0 8px;font-size:12px;opacity:.8}.gs-story .gs-kv{margin:6px 0}'
      + '.gs-head{margin:0 0 6px;font-size:14px;font-weight:600;line-height:1.4}.gs-rail u{position:absolute;top:-2px;height:14px;border-left:2px dashed rgba(255,255,255,.7)}'
      + '.gs-tls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 8px}.gs-tl{background:rgba(255,255,255,.05);border-radius:10px;padding:8px 9px;min-width:0}.gs-tl small{display:block;font-size:11px;opacity:.7}.gs-tl b{display:block;font-size:16px;margin:1px 0}.gs-tl em{display:block;font-style:normal;font-size:11px;opacity:.75;overflow-wrap:anywhere}'
      + '.gs-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.gs-chip{font-size:11.5px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.08)}.gs-sd{display:inline-block;width:14px;border-top:2px dashed var(--gold,#f5c451);margin-right:6px;vertical-align:middle}.gs-chip.bad{background:rgba(255,93,108,.18);color:var(--red,#ff5d6c)}.gs-chip.ok{background:rgba(61,220,151,.16);color:var(--mint,#3ddc97)}'
      + '.gs-more2 summary{cursor:pointer;font-size:12px;opacity:.8;padding:4px 0}'
      + '.gs-hint{font-size:12px;opacity:.75;margin:6px 0 0}';
    document.head.appendChild(st);

    var bs = document.createElement('style'); bs.id = 'gs-out-css';
    bs.textContent = '.gs-out{position:relative;display:inline-flex;align-items:center;gap:6px;padding:5px 13px 5px 7px;border-radius:999px;color:#fff;font:800 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;overflow:hidden;isolation:isolate;border:0;animation:gsPop .75s cubic-bezier(.34,1.7,.5,1) both}'
      + '.gs-out b{font-weight:800;position:relative;z-index:2;text-shadow:0 1px 2px rgba(0,0,0,.25)}'
      + '.gs-out i{position:relative;z-index:2;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.24);box-shadow:0 0 0 1px rgba(255,255,255,.35) inset}.gs-out i svg{width:12px;height:12px}'
      + '.gs-out i svg path{stroke-dasharray:40;stroke-dashoffset:40;animation:gsDraw .7s .45s ease-out forwards}'
      + '.gs-out:before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(100deg,transparent 28%,rgba(255,255,255,.55) 50%,transparent 72%);transform:translateX(-130%);animation:gsSh 4s 1.2s ease-in-out infinite}'
      + '.gs-out.w{background:linear-gradient(135deg,#0E9F6E,#4BE3A6);color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 12px 24px -10px #0E9F6E;animation:gsPop .75s cubic-bezier(.34,1.7,.5,1) both,gsGlowW 2.8s 1.4s ease-in-out infinite}'
      + '.gs-out.l{background:linear-gradient(135deg,#D12B3A,#FF6B81);box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 12px 24px -10px #D12B3A;animation:gsShake .7s .05s both}.gs-out.l:before{animation-duration:6s}'
      + '.gs-out.z{background:linear-gradient(135deg,#5B678C,#8A95B5);box-shadow:0 0 0 1px rgba(255,255,255,.25) inset;animation:gsPop .75s cubic-bezier(.34,1.7,.5,1) both}.gs-out.z:before{display:none}'
      + '@keyframes gsPop{0%{opacity:0;transform:scale(.4) rotate(-8deg)}100%{opacity:1;transform:none}}'
      + '@keyframes gsShake{0%{opacity:0;transform:translateX(-10px)}30%{opacity:1;transform:translateX(7px)}55%{transform:translateX(-5px)}80%{transform:translateX(3px)}100%{transform:none}}'
      + '@keyframes gsDraw{to{stroke-dashoffset:0}}@keyframes gsSh{0%,55%{transform:translateX(-130%)}100%{transform:translateX(130%)}}'
      + '@keyframes gsGlowW{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 12px 24px -10px #0B9E6B}50%{box-shadow:0 0 0 1px rgba(255,255,255,.35) inset,0 0 18px 2px rgba(47,211,155,.55)}}'
      + '@media (prefers-reduced-motion:reduce){.gs-out,.gs-out:before,.gs-out i svg path{animation:none!important;stroke-dashoffset:0;opacity:1;transform:none}}';
    document.head.appendChild(bs);
  }
  function hasJourney(t) { return !!(t.opened_at && t.closed_at && t.mfe_r != null && t.mae_r != null && new Date(t.closed_at) > new Date(t.opened_at)); }
  function tradeCard(t, big) {
    var win = t.profit > 0, loss = t.profit < 0, ex = exitOf(t), hm = holdMin(t), mv = (Number(t.close_price) - Number(t.open_price)) * t.dir, eng = R().ENG[t.engine] || '', ec = R().ECL[t.engine] || 'var(--blue-hi)';
    var side = t.dir > 0 ? 'BUY' : 'SELL', rr = Number(t.result_r || 0);
    var sentence = side + ' ' + Number(t.lots).toFixed(2) + ' lots' + (t.symbol ? ' of ' + esc(t.symbol) : ' of gold') + ', opened ' + (t.opened_at ? dt(t.opened_at) : 'earlier') + ' at ' + Number(t.open_price).toFixed(2) + ', closed ' + dt(t.closed_at) + ' at ' + Number(t.close_price).toFixed(2) + '. The price moved ' + (mv >= 0 ? 'in your favour by ' : 'against you by ') + Math.abs(mv).toFixed(2) + '.';
    return '<div class="gs-t ' + (win ? 'w' : loss ? 'l' : 'z') + (big ? ' big' : '') + '"><div class="gs-t1"><span class="gs-side ' + (t.dir > 0 ? 'b' : 's') + '">' + side + '</span><span class="gs-eng" style="--c:' + ec + '">' + esc(eng) + (t.is_add ? ' add-on' : '') + '</span><span class="gs-time">' + (t.opened_at ? dt(t.opened_at) + ' &rarr; ' : '') + tm(t.closed_at) + '</span><b class="gs-res" style="color:' + col(t.profit) + '">' + sgn(t.profit) + '</b></div>'
      + '<div class="gs-t2"><div><small>Entry</small><b>' + Number(t.open_price).toFixed(2) + '</b></div><div class="gs-arw ' + (mv >= 0 ? 'up' : 'dn') + '"><i></i><em>' + (mv >= 0 ? '+' : '') + mv.toFixed(2) + '</em></div><div><small>Exit</small><b>' + Number(t.close_price).toFixed(2) + '</b></div><div><small>Lots</small><b>' + Number(t.lots).toFixed(2) + '</b></div>' + (t.result_r == null ? '' : '<div><small>Result</small><b>' + (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R</b></div>') + '<div><small>Held</small><b>' + (hm == null ? '-' : R().fmtMin(hm)) + '</b></div></div>'
      + '<div class="gs-t3"><span class="gs-ex ' + ex[1] + '">' + esc(ex[0]) + '</span><span class="gs-out ' + (win ? 'w' : loss ? 'l' : 'z') + '"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (win ? '<path d="M12 19V6M6 11l6-6 6 6"/>' : loss ? '<path d="M12 5v13M6 13l6 6 6-6"/>' : '<path d="M5 12h14"/>') + '</svg></i><b>' + (win ? 'WIN' : loss ? 'LOSS' : 'FLAT') + '</b></span></div>'
      + (big ? (hasJourney(t) ? '' : '<p class="gs-sent">' + sentence + ' ' + esc(ex[2]) + '</p>' + (t.result_r == null ? '' : '<p class="gs-fine">One R is the amount the EA risked on this trade; ' + (rr >= 0 ? '+' : '') + rr.toFixed(2) + 'R means this trade ' + (rr >= 0 ? 'earned ' : 'lost ') + Math.abs(rr).toFixed(2) + ' times that risk.</p>')) + storyBlock(t) : (hasStory(t) ? '<p class="gs-hint">Best +' + Math.max(0, Number(t.mfe_r)).toFixed(2) + 'R &middot; worst ' + Math.min(0, Number(t.mae_r)).toFixed(2) + 'R' + (stopWord(t) ? ' &middot; stop at ' + stopWord(t) : '') + '</p>' : '')) + '</div>';
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
