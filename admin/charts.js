/* Admin charts: one small kit (donut, bars, line, funnel, horizontal bars, gauge) and one detail sheet.
   Every slice, bar, point and row is clickable and opens the real records behind it. Tabs describe their charts in charts-tabs.js.
   Purely additive: if this file does not load, the admin works as before. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.GCA = window.GCA || {};
  G.build = G.build || {};

  /* ---------- helpers ---------- */
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var N = function (n) { n = Number(n); return isFinite(n) ? n : 0; };
  G.E = E; G.N = N;
  G.num = function (n) { return N(n).toLocaleString('en-US', {maximumFractionDigits: 1}); };
  G.money = function (n) { return '$' + N(n).toLocaleString('en-US', {maximumFractionDigits: 0}); };
  G.pct = function (a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; };
  G.day = function (d) { return new Date(d).toISOString().slice(0, 10); };
  G.dt = function (d) { return d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '-'; };
  G.lastDays = function (n) { var out = [], t = Date.now(); for (var i = n - 1; i >= 0; i--) out.push(new Date(t - i * 864e5).toISOString().slice(0, 10)); return out; };
  G.PAL = ['var(--k1,#a78bfa)', 'var(--k2,#22d3ee)', 'var(--k3,#f472b6)', 'var(--k4,#fbbf24)', 'var(--info)', 'var(--ok)', 'var(--warn)', 'var(--bad)'];
  var pal = function (i) { return G.PAL[i % G.PAL.length]; };
  G.go = function (tabKey, pre) { if (pre) { try { pre(); } catch (e) {} } var b = $('#tabs [data-t="' + tabKey + '"]'); if (b) b.click(); };

  /* ---------- registry: every chart keeps its items so a click can find the record behind it ---------- */
  var REG = {}, seq = 0;
  function reg(items, meta) { var id = 'g' + (++seq); REG[id] = {items: items, meta: meta || {}}; return id; }

  /* ---------- donut ---------- */
  G.donut = function (items, o) {
    o = o || {}; items = items.filter(function (i) { return N(i.value) > 0; });
    var tot = items.reduce(function (s, i) { return s + N(i.value); }, 0); if (!tot) return '';
    items.forEach(function (it, i) { if (!it.color) it.color = pal(i); });
    var id = reg(items, {total: tot, kind: 'donut', title: o.title, unit: o.unit}), R = 38, C = 2 * Math.PI * R, acc = 0, segs = '';
    items.forEach(function (it, i) {
      var len = N(it.value) / tot * C;
      segs += '<circle class="gcs" data-g="' + id + '" data-i="' + i + '" cx="50" cy="50" r="' + R + '" fill="none" stroke="' + it.color + '" stroke-width="14" stroke-dasharray="' + Math.max(0, len - (items.length > 1 ? 1.2 : 0)).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 50 50)"><title>' + E(it.label) + ': ' + E(o.fmt ? o.fmt(it.value) : G.num(it.value)) + '</title></circle>';
      acc += len;
    });
    var f = o.fmt || G.num;
    return '<div class="gcd"><svg viewBox="0 0 100 100" role="img" aria-label="' + E(o.title || 'Chart') + '">' + segs + '<text x="50" y="49" text-anchor="middle" class="gct1">' + E(o.center != null ? o.center : f(tot)) + '</text><text x="50" y="61" text-anchor="middle" class="gct2">' + E(o.centerLabel || 'total') + '</text></svg>' +
      '<ul class="gcl">' + items.map(function (it, i) { return '<li><button type="button" data-g="' + id + '" data-i="' + i + '"><i style="background:' + it.color + '"></i><span>' + E(it.label) + '</span><b>' + E(f(it.value)) + '</b><em>' + G.pct(N(it.value), tot) + '%</em></button></li>'; }).join('') + '</ul></div>';
  };

  /* ---------- vertical bars (also stacked: an item may carry parts) ---------- */
  G.bars = function (items, o) {
    o = o || {}; if (!items.length) return '';
    var H = 120, W = 300, pl = 6, pr = 6, pb = 18, pt = 14, n = items.length, id = reg(items, {kind: 'bars', title: o.title, unit: o.unit}), f = o.fmt || G.num;
    var mx = Math.max.apply(null, items.map(function (i) { return N(i.value); }).concat([o.min || 1])), step = (W - pl - pr) / n, bw = Math.max(2, Math.min(34, step * .7)), every = Math.ceil(n / (o.labels || 8));
    var grid = [0, .5, 1].map(function (g) { var y = pt + (H - pt - pb) * (1 - g); return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" class="gcg0"/>'; }).join('');
    var rects = items.map(function (it, i) {
      var x = pl + step * i + (step - bw) / 2, h = Math.max(N(it.value) > 0 ? 2 : 0, (H - pt - pb) * N(it.value) / mx), y = H - pb - h, col = it.color || o.color || pal(0), inner = '';
      if (it.parts) { var yy = H - pb; inner = it.parts.map(function (p, k) { var ph = (H - pt - pb) * N(p.v) / mx; yy -= ph; return ph > 0 ? '<rect x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + ph.toFixed(1) + '" fill="' + (p.c || pal(k)) + '" rx="1.5"/>' : ''; }).join(''); }
      else inner = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + col + '" rx="2"' + (reduce ? '' : ' class="gcr" style="animation-delay:' + Math.min(600, i * 18) + 'ms"') + '/>';
      var hit = '<rect class="gcs" data-g="' + id + '" data-i="' + i + '" x="' + (pl + step * i).toFixed(1) + '" y="' + pt + '" width="' + step.toFixed(1) + '" height="' + (H - pt - pb) + '" fill="transparent"><title>' + E(it.label) + ': ' + E(f(it.value)) + '</title></rect>';
      var lab = i % every === 0 || i === n - 1 ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" class="gct3">' + E(it.short || it.label) + '</text>' : '';
      var val = n <= 12 && N(it.value) > 0 ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 3).toFixed(1) + '" text-anchor="middle" class="gct4">' + E(f(it.value)) + '</text>' : '';
      return inner + hit + lab + val;
    }).join('');
    return '<svg class="gcb" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(o.title || 'Chart') + '">' + grid + rects + '</svg>';
  };

  /* ---------- line / area ---------- */
  G.line = function (items, o) {
    o = o || {}; if (items.length < 2) return '';
    var H = 120, W = 300, pl = 6, pr = 8, pb = 18, pt = 12, n = items.length, id = reg(items, {kind: 'line', title: o.title, unit: o.unit}), f = o.fmt || G.num, col = o.color || pal(1);
    var mx = Math.max.apply(null, items.map(function (i) { return N(i.value); }).concat([1])), sx = (W - pl - pr) / (n - 1), every = Math.ceil(n / (o.labels || 7));
    var pts = items.map(function (it, i) { return [pl + sx * i, pt + (H - pt - pb) * (1 - N(it.value) / mx)]; });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '), area = path + ' L' + pts[n - 1][0].toFixed(1) + ' ' + (H - pb) + ' L' + pl + ' ' + (H - pb) + ' Z';
    var gid = 'gl' + id;
    var grid = [0, .5, 1].map(function (g) { var y = pt + (H - pt - pb) * (1 - g); return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" class="gcg0"/>'; }).join('');
    var dots = items.map(function (it, i) { return '<circle class="gcs" data-g="' + id + '" data-i="' + i + '" cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="' + (n > 40 ? 3 : 4.5) + '" fill="' + col + '" fill-opacity="' + (n > 40 ? 0 : .9) + '" stroke="var(--panel)" stroke-width="1.5"><title>' + E(it.label) + ': ' + E(f(it.value)) + '</title></circle>'; }).join('');
    var labs = items.map(function (it, i) { return i % every === 0 || i === n - 1 ? '<text x="' + pts[i][0].toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" class="gct3">' + E(it.short || it.label) + '</text>' : ''; }).join('');
    return '<svg class="gcb" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(o.title || 'Chart') + '"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".32"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' + grid +
      '<path d="' + area + '" fill="url(#' + gid + ')"/><path d="' + path + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' + dots + labs + '</svg>';
  };

  /* ---------- horizontal bars (rows of label, bar, value) ---------- */
  G.hbars = function (items, o) {
    o = o || {}; items = items.filter(function (i) { return N(i.value) > 0 || o.keepZero; }); if (!items.length) return '';
    var id = reg(items, {kind: 'hbars', title: o.title, unit: o.unit}), mx = Math.max.apply(null, items.map(function (i) { return N(i.value); }).concat([1])), f = o.fmt || G.num, tot = items.reduce(function (s, i) { return s + N(i.value); }, 0);
    return '<ul class="gch">' + items.slice(0, o.max || 10).map(function (it, i) {
      return '<li><button type="button" data-g="' + id + '" data-i="' + i + '"><span class="gcn">' + E(it.label) + '</span><span class="gct"><i style="width:' + Math.max(2, N(it.value) / mx * 100).toFixed(1) + '%;background:' + (it.color || o.color || pal(i)) + '"></i></span><b>' + E(f(it.value)) + '</b>' + (o.share === false ? '' : '<em>' + G.pct(N(it.value), tot) + '%</em>') + '</button></li>';
    }).join('') + '</ul>';
  };

  /* ---------- funnel: each step against the one before it ---------- */
  G.funnel = function (steps, o) {
    o = o || {}; steps = steps.filter(function (s) { return s.value != null; }); if (!steps.length || !N(steps[0].value)) return '';
    var id = reg(steps, {kind: 'funnel', title: o.title}), top = N(steps[0].value);
    return '<ul class="gcf">' + steps.map(function (s, i) {
      var v = N(s.value), prev = i ? N(steps[i - 1].value) : v, conv = prev ? Math.round(v / prev * 1000) / 10 : 0;
      return '<li><button type="button" data-g="' + id + '" data-i="' + i + '"><span class="gcn">' + E(s.label) + '</span><span class="gct"><i style="width:' + Math.max(1.5, v / top * 100).toFixed(1) + '%;background:' + pal(i) + '"></i></span><b>' + G.num(v) + '</b><em>' + (i ? conv + '%' : '100%') + '</em></button></li>';
    }).join('') + '</ul>';
  };

  /* ---------- gauge: one number against its limit ---------- */
  G.gauge = function (value, max, o) {
    o = o || {}; var v = N(value), m = N(max) || 1, p = Math.min(100, v / m * 100), R = 38, C = 2 * Math.PI * R, col = o.color || (p > 90 ? 'var(--bad)' : p > 70 ? 'var(--warn)' : 'var(--ok)');
    var id = reg([{label: o.label || 'Used', value: v, max: m, sheet: o.sheet}], {kind: 'gauge', title: o.title});
    return '<button type="button" class="gcg" data-g="' + id + '" data-i="0"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="12"/><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="' + col + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (C * p / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="52" text-anchor="middle" class="gct1">' + Math.round(p) + '%</text></svg><span>' + E(o.caption || '') + '</span></button>';
  };

  /* ---------- a card that holds a chart ---------- */
  G.card = function (title, sub, body, o) {
    o = o || {}; if (!body) return {empty: true, title: title, hint: o.hint || ''};
    return {html: '<section class="gcc' + (o.wide ? ' wide' : '') + '"><div class="gcth"><b>' + E(title) + '</b>' + (sub ? '<span>' + E(sub) + '</span>' : '') + '</div>' + body + '<div class="gctf">' + E(o.foot || 'Click any part for the details.') + '</div></section>'};
  };

  /* ---------- the detail sheet ---------- */
  var cur = null;
  function closeSheet() { if (cur) { cur.bk.remove(); cur.sh.remove(); document.body.classList.remove('gas-lock'); cur = null; } }
  G.closeSheet = closeSheet;
  G.sheet = function (sp) {
    closeSheet(); var bk = document.createElement('div'), sh = document.createElement('aside'); bk.className = 'gas-bk'; sh.className = 'gas'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', sp.title || 'Details');
    var rows = sp.rows || [], cols = sp.cols || [], shown = rows.slice(0, 300);
    sh.innerHTML = '<div class="gas-h"><div>' + (sp.kicker ? '<small>' + E(sp.kicker) + '</small>' : '') + '<h3>' + E(sp.title || '') + '</h3></div><button type="button" class="gas-x" aria-label="Close">&times;</button></div>' +
      '<div class="gas-b">' + (sp.value != null ? '<div class="gas-v">' + E(sp.value) + (sp.sub ? '<span>' + E(sp.sub) + '</span>' : '') + '</div>' : '') +
      (sp.chips && sp.chips.length ? '<div class="gas-c">' + sp.chips.map(function (c) { return '<div><small>' + E(c.l) + '</small><b' + (c.tone ? ' class="t-' + c.tone + '"' : '') + '>' + E(c.v) + '</b></div>'; }).join('') + '</div>' : '') +
      (sp.note ? '<p class="gas-n">' + sp.note + '</p>' : '') +
      (shown.length ? '<div class="gas-t"><table><thead><tr>' + cols.map(function (c) { return '<th>' + E(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + shown.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + E(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + (rows.length > shown.length ? '<p class="gas-n">Showing the first ' + shown.length + ' of ' + rows.length + '. Download the CSV for all of them.</p>' : '') : (sp.empty ? '<p class="gas-n">' + E(sp.empty) + '</p>' : '')) + '</div>' +
      '<div class="gas-f">' + (sp.go ? '<button type="button" class="gas-go">' + E(sp.go.label || 'Open') + '</button>' : '') + (rows.length ? '<button type="button" class="gas-csv">Download CSV</button>' : '') + '<button type="button" class="gas-cl">Close</button></div>';
    document.body.appendChild(bk); document.body.appendChild(sh); document.body.classList.add('gas-lock'); cur = {bk: bk, sh: sh};
    requestAnimationFrame(function () { bk.classList.add('on'); sh.classList.add('on'); });
    bk.onclick = closeSheet; $('.gas-x', sh).onclick = closeSheet; $('.gas-cl', sh).onclick = closeSheet;
    if (sp.go) $('.gas-go', sh).onclick = function () { closeSheet(); G.go(sp.go.tab, sp.go.pre); };
    if (rows.length) $('.gas-csv', sh).onclick = function () {
      var csv = [cols].concat(rows).map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type: 'text/csv'})); a.download = 'goldtriengine-' + String(sp.title || 'details').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    var fb = $('.gas-x', sh); if (fb) fb.focus({preventScroll: true});
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) closeSheet(); });

  /* a click on any chart part: the item says what to show, or a plain default is built from its numbers */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-g][data-i]'); if (!el) return;
    var r = REG[el.dataset.g]; if (!r) return; var it = r.items[+el.dataset.i]; if (!it) return;
    e.preventDefault(); e.stopPropagation();
    var sp = typeof it.sheet === 'function' ? it.sheet(it, r) : null;
    if (!sp) {
      var tot = r.meta.total || r.items.reduce(function (s, x) { return s + N(x.value); }, 0);
      sp = {kicker: r.meta.title || 'Details', title: it.label, value: G.num(it.value), sub: r.meta.unit || '', chips: tot ? [{l: 'Share of the total', v: G.pct(N(it.value), tot) + '%'}, {l: 'Total', v: G.num(tot)}] : []};
    }
    G.sheet(sp);
  }, true);

  /* a small label that follows the pointer over a chart part (touch screens just open the sheet) */
  var tip;
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('.gcs'); if (!el) { if (tip) { tip.remove(); tip = null; } return; }
    var r = REG[el.dataset.g]; var it = r && r.items[+el.dataset.i]; if (!it) return;
    if (!tip) { tip = document.createElement('div'); tip.className = 'gtip'; document.body.appendChild(tip); }
    tip.innerHTML = '<b>' + E(it.label) + '</b>' + E(G.num(it.value) + (r.meta.unit ? ' ' + r.meta.unit : '')); tip.hidden = false;
  });
  document.addEventListener('mousemove', function (e) { if (tip) { tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 14) + 'px'; tip.style.top = Math.max(8, e.clientY - 40) + 'px'; } });
  document.addEventListener('mouseout', function (e) { if (tip && (!e.relatedTarget || !(e.relatedTarget.closest && e.relatedTarget.closest('.gcs')))) { tip.remove(); tip = null; } });

  /* ---------- style ---------- */
  var css = '' +
    '#gca{margin:0 0 14px}#gca .gah{display:flex;align-items:center;gap:10px;margin:2px 2px 10px;flex-wrap:wrap}#gca .gah b{font-size:.95rem;letter-spacing:.01em}#gca .gah span{color:var(--mute);font-size:.78rem}#gca .gah button{margin-left:auto;font:inherit;font-size:.78rem;color:var(--mute);background:var(--panel2);border:1px solid var(--line);border-radius:999px;padding:5px 12px;cursor:pointer}' +
    '.gci{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px}.gci button{display:flex;gap:11px;align-items:flex-start;text-align:left;font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--tone,var(--info));border-radius:12px;padding:11px 13px;cursor:pointer;transition:transform .15s,border-color .2s}.gci button:hover{transform:translateY(-2px);border-color:var(--tone,var(--info))}' +
    '.gci i{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:.8rem;color:#fff;background:var(--tone,var(--info))}.gci strong{display:block;font-size:.86rem;line-height:1.3}.gci small{display:block;color:var(--mute);font-size:.74rem;margin-top:2px;line-height:1.35}' +
    '.gci .t-bad{--tone:var(--bad)}.gci .t-warn{--tone:var(--warn)}.gci .t-ok{--tone:var(--ok)}.gci .t-info{--tone:var(--info)}.gci .t-mute{--tone:var(--mute)}' +
    '.gcg1{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.gcc{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px 16px;min-width:0}.gcc.wide{grid-column:1/-1}' +
    '.gcc .gcth{display:flex;flex-direction:column;gap:2px;margin-bottom:10px;text-align:left}.gcc .gcth b{font-size:.92rem}.gcc .gcth span{font-size:.76rem;color:var(--mute);line-height:1.35}.gcc .gctf{margin-top:10px;font-size:.7rem;color:var(--mute);opacity:.85}' +
    '.gcd{display:grid;grid-template-columns:132px 1fr;gap:14px;align-items:center}@media(max-width:520px){.gcd{grid-template-columns:1fr}.gcd svg{max-width:170px;margin:0 auto}}.gcd svg{width:100%}' +
    '.gct1{font:700 13px/1 inherit;font-family:inherit;fill:var(--text)}.gct2{font:500 5.5px inherit;font-family:inherit;fill:var(--mute)}.gct3{font:500 8px inherit;font-family:inherit;fill:var(--mute)}.gct4{font:600 8px inherit;font-family:inherit;fill:var(--text)}.gcg0{stroke:var(--line);stroke-width:.6;stroke-dasharray:3 3}' +
    '.gcs{cursor:pointer;transition:stroke-width .15s,opacity .15s}circle.gcs:hover{stroke-width:17}rect.gcs:hover{fill:var(--info);fill-opacity:.12}' +
    '.gcl,.gch,.gcf{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;min-width:0}.gcl button,.gch button,.gcf button{display:flex;align-items:center;gap:9px;width:100%;font:inherit;font-size:.8rem;color:var(--text);background:none;border:0;border-radius:9px;padding:6px 8px;cursor:pointer;text-align:left}.gcl button:hover,.gch button:hover,.gcf button:hover{background:var(--panel2)}' +
    '.gcl i{flex:none;width:10px;height:10px;border-radius:3px}.gcl span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gcl b,.gch b,.gcf b{font-variant-numeric:tabular-nums}.gcl em,.gch em,.gcf em{font-style:normal;color:var(--mute);font-size:.72rem;min-width:40px;text-align:right}' +
    '.gcn{flex:0 0 34%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gct{flex:1;height:8px;background:var(--panel2);border-radius:6px;overflow:hidden}.gct i{display:block;height:100%;border-radius:6px}' +
    '.gcb{width:100%;height:auto;display:block}.gcr{transform-box:fill-box;transform-origin:bottom;animation:gcgrow .6s cubic-bezier(.2,.8,.2,1) both}@keyframes gcgrow{from{transform:scaleY(0)}}' +
    '.gcg{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:0;color:var(--text);font:inherit;cursor:pointer;width:120px}.gcg svg{width:96px}.gcg span{font-size:.74rem;color:var(--mute);text-align:center}.gcgr{display:flex;gap:14px;flex-wrap:wrap;justify-content:space-around}' +
    '.gce{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.8rem;color:var(--mute);padding:6px 2px}.gce b{color:var(--text);font-weight:600}' +
    '.gtip{position:fixed;z-index:200;pointer-events:none;background:var(--panel-s,var(--panel));color:var(--text);border:1px solid var(--line);border-radius:9px;padding:6px 10px;font-size:.76rem;box-shadow:0 10px 26px -12px rgba(0,0,0,.5)}.gtip b{display:block;font-size:.7rem;color:var(--mute);font-weight:500}' +
    '.gas-bk{position:fixed;inset:0;z-index:120;background:rgba(5,8,16,.55);opacity:0;transition:opacity .22s}.gas-bk.on{opacity:1}.gas-lock{overflow:hidden}' +
    '.gas{position:fixed;z-index:121;right:0;top:0;bottom:0;width:min(520px,100vw);display:flex;flex-direction:column;background:var(--panel-s,var(--panel));border-left:1px solid var(--line);box-shadow:-24px 0 60px -30px rgba(0,0,0,.6);transform:translateX(100%);transition:transform .28s cubic-bezier(.2,.8,.2,1);color:var(--text)}.gas.on{transform:none}' +
    '@media(max-width:700px){.gas{top:auto;max-height:86vh;width:100%;border-left:0;border-top:1px solid var(--line);border-radius:18px 18px 0 0;transform:translateY(100%)}}' +
    '.gas>.gas-h{display:flex;align-items:flex-start;gap:10px;padding:16px 18px 10px;border-bottom:1px solid var(--line)}.gas>.gas-h div{flex:1;min-width:0}.gas>.gas-h small{display:block;color:var(--mute);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase}.gas>.gas-h h3{margin:2px 0 0;font-size:1.05rem;line-height:1.25}.gas-x{font-size:1.6rem;line-height:1;background:none;border:0;color:var(--mute);cursor:pointer;padding:0 4px}' +
    '.gas-b{flex:1;overflow:auto;padding:14px 18px}.gas-v{font-size:2rem;font-weight:700;line-height:1.1}.gas-v span{display:block;font-size:.8rem;font-weight:400;color:var(--mute);margin-top:3px}.gas-c{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:14px 0}.gas-c div{background:var(--panel2);border:1px solid var(--line);border-radius:11px;padding:8px 10px}.gas-c small{display:block;color:var(--mute);font-size:.68rem}.gas-c b{font-size:.95rem}' +
    '.gas-c .t-ok{color:var(--ok)}.gas-c .t-warn{color:var(--warn)}.gas-c .t-bad{color:var(--bad)}.gas-n{color:var(--mute);font-size:.8rem;line-height:1.5;margin:10px 0}.gas-t{overflow:auto;border:1px solid var(--line);border-radius:12px}.gas-t table{width:100%;border-collapse:collapse;font-size:.78rem}.gas-t th{position:sticky;top:0;background:var(--panel2);text-align:left;color:var(--mute);font-weight:600;padding:7px 10px;white-space:nowrap}.gas-t td{padding:7px 10px;border-top:1px solid var(--line);vertical-align:top}.gas-t td:first-child{white-space:nowrap}' +
    '.gas>.gas-f{display:flex;gap:8px;padding:12px 18px;border-top:1px solid var(--line);flex-wrap:wrap}.gas>.gas-f button{font:inherit;font-size:.82rem;border-radius:10px;padding:8px 14px;cursor:pointer;border:1px solid var(--line);background:var(--panel2);color:var(--text)}.gas-go{background:var(--gold,var(--info))!important;color:#fff!important;border-color:transparent!important;font-weight:600}.gas-cl{margin-left:auto}';
  var st = document.createElement('style'); st.id = 'gca-css'; st.textContent = css; document.head.appendChild(st);

  /* ---------- the block above each tab ---------- */
  var CAP = window.__cap = window.__cap || {}, pending = 0;
  function schedule() { clearTimeout(pending); pending = setTimeout(inject, 160); }
  if (typeof window.call === 'function' && !window.call.__gca) {      // every admin data request is remembered, so charts use exactly what the tab loaded
    var orig = window.call; window.call = async function (fn) { var r = await orig.apply(this, arguments); try { CAP[fn] = r; } catch (e) {} schedule(); return r; }; window.call.__gca = 1;
  }
  G.cap = function (k) { return CAP[k]; };
  G.data = function () { try { return typeof data !== 'undefined' ? data : null; } catch (e) { return null; } };
  var TONE = {bad: '!', warn: '!', ok: '&#10003;', info: 'i', mute: '&middot;'};

  function inject() {
    var view = $('#view'); if (!view || view.querySelector('#gca')) return;
    var tabKey = ''; try { tabKey = typeof tab !== 'undefined' ? tab : ''; } catch (e) {} var b = G.build[tabKey]; if (!b || !G.data()) return;
    if (view.firstElementChild && /^Loading/i.test(view.firstElementChild.textContent || '') && view.children.length === 1) return;
    var m; try { m = b(); } catch (e) { if (window.console) console.warn('charts: ' + tabKey, e); return; } if (!m) return;
    var cards = (m.cards || []).filter(Boolean), real = cards.filter(function (c) { return !c.empty; }), empty = cards.filter(function (c) { return c.empty; });
    var ins = (m.insights || []).filter(Boolean); if (!real.length && !ins.length && !empty.length) return;
    var box = document.createElement('div'); box.id = 'gca';
    var open = true; try { open = localStorage.getItem('gte_gca_' + tabKey) !== 'c'; } catch (e) {}
    box.innerHTML = '<div class="gah"><b>' + E(m.title || 'At a glance') + '</b><span>' + E(m.sub || 'Charts and key facts for this tab. Click any of them for the details.') + '</span><button type="button" id="gca-t">' + (open ? 'Hide' : 'Show') + '</button></div><div id="gca-b"' + (open ? '' : ' hidden') + '>' +
      (ins.length ? '<div class="gci">' + ins.map(function (i, k) { return '<button type="button" class="t-' + (i.tone || 'info') + '" data-gi="' + k + '"><i>' + (TONE[i.tone || 'info'] || 'i') + '</i><span><strong>' + E(i.title) + '</strong>' + (i.text ? '<small>' + E(i.text) + '</small>' : '') + '</span></button>'; }).join('') + '</div>' : '') +
      (real.length ? '<div class="gcg1">' + real.map(function (c) { return c.html; }).join('') + '</div>' : '') +
      (empty.length ? '<div class="gcc" style="margin-top:14px"><div class="gcth"><b>' + (real.length ? 'More charts, once there is data' : 'Charts appear as data comes in') + '</b></div><div class="gce">' + empty.map(function (c) { return '<span><b>' + E(c.title) + '</b>' + (c.hint ? ' &middot; ' + E(c.hint) : '') + '</span>'; }).join('') + '</div></div>' : '') + '</div>';
    var anchor = view.querySelector('.grid'); if (anchor && anchor.parentNode === view) view.insertBefore(box, anchor.nextSibling); else view.insertBefore(box, view.firstChild);
    $('#gca-t', box).onclick = function () { var bd = $('#gca-b', box), h = !bd.hidden; bd.hidden = h; this.textContent = h ? 'Show' : 'Hide'; try { localStorage.setItem('gte_gca_' + tabKey, h ? 'c' : 'o'); } catch (e) {} };
    $$('[data-gi]', box).forEach(function (btn) { btn.onclick = function () { var i = ins[+btn.dataset.gi]; if (i && typeof i.act === 'function') i.act(); else if (i && i.sheet) G.sheet(i.sheet); }; });
  }
  var vw = $('#view'); if (vw && window.MutationObserver) new MutationObserver(schedule).observe(vw, {childList: true});
  G.refresh = schedule; schedule();
})();
