/* Results helpers for the account page: statistics and charts built from the closed trades the EA recorded.
   Everything shown is real data from those trades. No libraries. Motion is CSS only (see app.css, "account v3"). */
(function () {
  const ENG = {M: 'Alpha', I: 'Beta', D: 'Gamma'}, ECL = {M: '#5B86FF', I: '#E3B95F', D: '#B07CFF'};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const usd = (n, d = 2) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const sgn = (n, d = 2) => (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const compact = a => a >= 10000 ? Math.round(a / 1000) + 'k' : a >= 1000 ? (a / 1000).toFixed(1) + 'k' : a >= 100 ? String(Math.round(a)) : a.toFixed(1);
  const csgn = n => (n >= 0 ? '+' : '-') + compact(Math.abs(n));        // short form for small boxes: +12.5, -1.2k
  const col = n => n >= 0 ? 'var(--mint)' : 'var(--red)';
  const loc = d => new Date(d).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
  const locDay = d => new Date(d).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
  const dk = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const holdMin = t => t.opened_at ? Math.max(0, (new Date(t.closed_at) - new Date(t.opened_at)) / 60000) : null;
  const fmtMin = m => { m = Math.round(m); return m < 60 ? m + 'm' : m < 1440 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : Math.floor(m / 1440) + 'd ' + Math.floor((m % 1440) / 60) + 'h'; };
  const held = t => { const m = holdMin(t); return m == null ? '-' : fmtMin(m); };
  let gid = 0;

  function stats(t) {
    const n = t.length, w = t.filter(x => x.profit > 0), l = t.filter(x => x.profit < 0);
    const gp = w.reduce((a, x) => a + x.profit, 0), gl = -l.reduce((a, x) => a + x.profit, 0);
    const cv = curve(t), avgWin = w.length ? gp / w.length : 0, avgLoss = l.length ? -gl / l.length : 0;
    let run = 0, sign = 0, mw = 0, ml = 0;                              // streaks, in closing order
    t.slice().sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at)).forEach(x => {
      const g = x.profit > 0 ? 1 : x.profit < 0 ? -1 : 0;
      if (!g) { run = 0; sign = 0; return; }
      if (g === sign) run++; else { run = 1; sign = g; }
      if (g > 0) mw = Math.max(mw, run); else ml = Math.max(ml, run);
    });
    const hm = t.map(holdMin).filter(x => x != null);
    return {n, net: gp - gl, win: n ? 100 * w.length / n : 0, wins: w.length, losses: l.length, pf: gl > 0 ? gp / gl : null,
            avgWin, avgLoss, avgR: n ? t.reduce((a, x) => a + (x.result_r || 0), 0) / n : 0,
            best: n ? Math.max(...t.map(x => x.profit)) : 0, worst: n ? Math.min(...t.map(x => x.profit)) : 0,
            maxDD: cv.length ? Math.max(...cv.map(p => p.dd)) : 0,
            expectancy: n ? (gp - gl) / n : 0, payoff: avgLoss < 0 ? avgWin / -avgLoss : null,
            streak: sign * run, maxWinStreak: mw, maxLossStreak: ml, avgHold: hm.length ? hm.reduce((a, b) => a + b, 0) / hm.length : null};
  }
  function curve(t) {
    const s = t.slice().sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at));
    let c = 0, peak = 0; const out = [];
    if (s.length) out.push({t: new Date(s[0].opened_at || s[0].closed_at).getTime(), c: 0, dd: 0});
    s.forEach(x => { c += x.profit; peak = Math.max(peak, c); out.push({t: new Date(x.closed_at).getTime(), c, dd: peak - c, tr: x}); });
    return out;
  }
  function dayMap(t) { const m = {}; t.forEach(x => { const k = dk(x.closed_at), o = m[k] || (m[k] = {v: 0, n: 0}); o.v += x.profit; o.n++; }); return m; }

  // tiny trend line with soft area, for tiles and the hero
  function spark(vals, color, h) {
    h = h || 30; if (vals.length < 2) return '';
    if (vals.length > 80) { const step = (vals.length - 1) / 79; vals = Array.from({length: 80}, (_, i) => vals[Math.round(i * step)]); }
    const mn = Math.min(...vals), mx = Math.max(...vals), rg = (mx - mn) || 1, id = 'sp' + (++gid);
    const pts = vals.map((v, i) => [i / (vals.length - 1) * 100, 3 + (1 - (v - mn) / rg) * (h - 6)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg class="spark" viewBox="0 0 100 ${h}" preserveAspectRatio="none" style="height:${h}px"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <g class="rev"><path d="${d} L100 ${h} L0 ${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g></svg>`;
  }

  // area/line chart with a hover read-out. key: 'c' (equity) or 'dd' (drawdown, drawn negative)
  function lineChart(id, pts, key, color, neg) {
    const W = 760, H = 230, P = {l: 58, r: 14, t: 14, b: 28};
    if (pts.length < 2) return '<div class="empty">Not enough closed trades yet to draw this chart.</div>';
    const val = p => neg ? -p[key] : p[key];
    const xs = pts.map(p => p.t), ys = pts.map(val);
    const x0 = Math.min(...xs), x1 = Math.max(...xs); let y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys);
    if (y1 === y0) y1 = y0 + 1;
    const X = t => P.l + (x1 === x0 ? 0 : (t - x0) / (x1 - x0)) * (W - P.l - P.r), Y = v => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(val(p)).toFixed(1)).join(' ');
    const area = d + ' L' + X(x1).toFixed(1) + ' ' + Y(0).toFixed(1) + ' L' + X(x0).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z';
    const grid = [0, .25, .5, .75, 1].map(f => { const v = y0 + f * (y1 - y0), y = Y(v); return `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".09"/><text x="${P.l - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity=".55">${usd(v, 0)}</text>`; }).join('');
    const ticks = [0, .5, 1].map(f => { const t = x0 + f * (x1 - x0); return `<text x="${X(t)}" y="${H - 8}" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}" font-size="11" fill="currentColor" opacity=".55">${new Date(t).toLocaleDateString([], {month: 'short', day: 'numeric'})}</text>`; }).join('');
    const zero = (y0 < 0 && y1 > 0) ? `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".3" stroke-dasharray="4 4"/>` : '';
    const last = pts[pts.length - 1];
    return `<div class="chw" id="${id}-w" data-x0="${x0}" data-x1="${x1}" data-pl="${P.l / W}" data-pr="${P.r / W}">
      <svg id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;color:var(--fg-2);display:block">
      <defs><linearGradient id="g-${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".38"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}${ticks}${zero}<g class="rev"><path d="${area}" fill="url(#g-${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g>
      <line id="${id}-v" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="${color}" opacity="0" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
      <i class="endpt" style="left:${((W - P.r) / W * 100).toFixed(2)}%;top:${Y(val(last)).toFixed(1)}px;--c:${color}"></i>
      <div class="tipbox" id="${id}-t"></div></div>`;
  }
  function bindHover(root, id, pts, key, neg) {
    const w = root.querySelector('#' + id + '-w'); if (!w || pts.length < 2) return;
    const svg = w.querySelector('svg'), tip = w.querySelector('.tipbox'), vl = w.querySelector('#' + id + '-v');
    const x0 = +w.dataset.x0, x1 = +w.dataset.x1, pl = +w.dataset.pl, pr = +w.dataset.pr;
    const move = ev => {
      const r = svg.getBoundingClientRect(), cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left, f = Math.min(1, Math.max(0, (cx / r.width - pl) / (1 - pl - pr)));
      const t = x0 + f * (x1 - x0); let b = pts[0]; pts.forEach(p => { if (Math.abs(p.t - t) < Math.abs(b.t - t)) b = p; });
      const bx = (pl + (x1 === x0 ? 0 : (b.t - x0) / (x1 - x0)) * (1 - pl - pr)) * r.width;
      vl.setAttribute('x1', bx / r.width * 760); vl.setAttribute('x2', bx / r.width * 760); vl.setAttribute('opacity', '.5');
      const v = neg ? -b[key] : b[key];
      tip.style.display = 'block'; tip.style.left = Math.min(r.width - 150, Math.max(0, bx - 70)) + 'px';
      tip.innerHTML = `<b>${usd(v, 2)}</b><br><span>${loc(b.t)}</span>${b.tr ? '<br><span>' + (ENG[b.tr.engine] || '') + ' ' + (b.tr.dir > 0 ? 'Buy' : 'Sell') + ' ' + sgn(b.tr.profit) + '</span>' : ''}`;
    };
    svg.onmousemove = svg.ontouchmove = move; svg.onmouseleave = () => { tip.style.display = 'none'; vl.setAttribute('opacity', '0'); };
  }

  function engineBars(t) {
    const rows = ['M', 'I', 'D'].map(e => { const x = t.filter(y => y.engine === e), s = stats(x); return {e, n: s.n, net: s.net, win: s.win}; });
    const mx = Math.max(1, ...rows.map(r => Math.abs(r.net)));
    return rows.map((r, i) => `<div class="eb"><div class="ebh"><span class="chip" style="--c:${ECL[r.e]}">${ENG[r.e]}</span><span class="hint">${r.n} trades${r.n ? ' · ' + r.win.toFixed(0) + '% win' : ''}</span><b style="color:${col(r.net)}">${r.n ? sgn(r.net) : '-'}</b></div>
      <div class="ebb"><i style="width:${r.n ? Math.max(2, Math.abs(r.net) / mx * 100) : 0}%;background:${r.net >= 0 ? `linear-gradient(90deg,${ECL[r.e]}88,${ECL[r.e]})` : 'var(--red)'};--i:${i}"></i></div></div>`).join('');
  }

  // win/loss ring; the number in the middle counts up (data-cu)
  function donut(w, l) {
    const n = w + l, Rr = 48, C = 2 * Math.PI * Rr, wf = n ? w / n : 0;
    return `<svg class="donut" viewBox="0 0 120 120"><circle cx="60" cy="60" r="${Rr}" fill="none" stroke="${l ? 'var(--red)' : 'var(--panel-2)'}" stroke-width="12" opacity=".8"/>
      ${w ? `<circle class="arc" cx="60" cy="60" r="${Rr}" fill="none" stroke="var(--mint)" stroke-width="12" stroke-linecap="${wf >= 1 ? 'butt' : 'round'}" stroke-dasharray="${(C * wf).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)" style="--c:${C.toFixed(1)}"/>` : ''}
      <text x="60" y="63" text-anchor="middle" font-size="25" font-weight="600" style="fill:var(--fg)" data-cu="${(wf * 100).toFixed(2)}" data-f="pct">${(wf * 100).toFixed(0)}%</text>
      <text x="60" y="80" text-anchor="middle" font-size="9" fill="currentColor" opacity=".6" letter-spacing="1.2">WIN RATE</text></svg>`;
  }

  // daily / monthly bars with the amount on every bar. Pure HTML so the text never stretches. opt.full = whole amounts
  function bars(items, h, opt) {
    if (!items.length) return '<div class="empty">No data yet.</div>';
    opt = opt || {};
    const top = Math.max(0, ...items.map(i => i.v)), bot = Math.min(0, ...items.map(i => i.v)), rg = (top - bot) || 1;
    const upH = top / rg * 100, dnH = -bot / rg * 100, lab = v => opt.full ? sgn(v, 0) : csgn(v);
    const cols = items.map((it, i) => {
      const hasV = it.v !== 0 || it.has;
      const up = it.v > 0 ? `<div class="xbar xup" style="height:${(it.v / top * 100).toFixed(2)}%;--i:${i}"><u></u><b>${lab(it.v)}</b></div>` : (it.v === 0 && hasV ? `<div class="xbar z" style="--i:${i}"><u></u></div>` : '');
      const dn = it.v < 0 ? `<div class="xbar dn" style="height:${(it.v / bot * 100).toFixed(2)}%;--i:${i}"><u></u><b>${lab(it.v)}</b></div>` : '';
      return `<div class="dc ${it.v > 0 ? 'p' : it.v < 0 ? 'n' : 'e'}" title="${esc(it.label)}: ${it.v === 0 && !hasV ? 'no closed trades' : sgn(it.v)}"><div class="u" style="height:${upH}%">${up}</div><div class="d" style="height:${dnH}%">${dn}</div><span class="dx">${esc(it.short)}</span></div>`;
    }).join('');
    return `<div class="db ${bot < 0 ? 'neg' : ''} ${opt.full ? 'wide' : ''} ${items.length > 16 ? 'dense' : ''}" style="height:${h || 190}px"><div class="dbi">${cols}</div></div>`;
  }
  function monthItems(t) {
    const m = {}; t.forEach(x => { const d = new Date(x.closed_at), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); m[k] = (m[k] || 0) + x.profit; });
    return Object.keys(m).sort().map(k => ({label: k, short: new Date(k + '-02').toLocaleDateString([], {month: 'short'}), v: m[k], has: true}));
  }
  function dayItems(t, days) {
    const m = dayMap(t), out = [], now = new Date(); now.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) { const d = new Date(now.getTime() - i * 864e5), k = dk(d); out.push({label: locDay(d), short: d.getDate() % 2 === 0 || i === 0 ? String(d.getDate()) : '', v: m[k] ? m[k].v : 0, has: k in m}); }
    return out;
  }

  // profit calendar: one month at a time, amount and trade count inside every day, a total for every week
  const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function calendar(t, y, mo) {
    const m = dayMap(t), first = new Date(y, mo, 1), days = new Date(y, mo + 1, 0).getDate(), lead = (first.getDay() + 6) % 7, weeks = Math.ceil((lead + days) / 7);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const keys = Object.keys(m).filter(k => +k.slice(0, 4) === y && +k.slice(5, 7) === mo + 1), mx = Math.max(1, ...keys.map(k => Math.abs(m[k].v)));
    const ks = Object.keys(m).sort(), firstIdx = ks.length ? (+ks[0].slice(0, 4)) * 12 + (+ks[0].slice(5, 7) - 1) : y * 12 + mo, nowIdx = today.getFullYear() * 12 + today.getMonth(), idxM = y * 12 + mo;
    let cells = WD.map(d => `<div class="ch">${d}</div>`).join('') + '<div class="ch wk">Week</div>', idx = 0, net = 0, up = 0, dn = 0, trades = 0, best = null, worst = null;
    for (let w = 0; w < weeks; w++) {
      let ws = 0, wn = 0;
      for (let r = 0; r < 7; r++) {
        const no = w * 7 + r - lead + 1;
        if (no < 1 || no > days) { cells += '<div class="cd off"></div>'; continue; }
        const d = new Date(y, mo, no), o = m[dk(d)], fut = d > today;
        if (o) { ws += o.v; wn += o.n; net += o.v; trades += o.n; if (o.v >= 0) up++; else dn++; if (!best || o.v > best.v) best = {v: o.v, d}; if (!worst || o.v < worst.v) worst = {v: o.v, d}; }
        const a = o ? (.16 + .6 * Math.min(1, Math.abs(o.v) / mx)).toFixed(2) : 0, cls = (o ? (o.v >= 0 ? 'pos' : 'neg') : fut ? 'fut' : 'none') + (d.getTime() === today.getTime() ? ' today' : '');
        cells += `<div class="cd ${cls}" style="--a:${a};--i:${idx++}" title="${esc(locDay(d))}: ${o ? sgn(o.v) + ' · ' + o.n + ' trade' + (o.n > 1 ? 's' : '') : 'no closed trades'}"><span class="dnum">${no}</span>${o ? `<b class="full">${sgn(o.v)}</b><b class="cmp">${csgn(o.v)}</b><em>${o.n} trade${o.n > 1 ? 's' : ''}</em>` : ''}</div>`;
      }
      cells += `<div class="cw ${wn ? (ws >= 0 ? 'pos' : 'neg') : ''}" style="--i:${idx++}"><span>W${w + 1}</span>${wn ? `<b class="full">${sgn(ws)}</b><b class="cmp">${csgn(ws)}</b><em>${wn} trade${wn > 1 ? 's' : ''}</em>` : '<b class="mut">-</b>'}</div>`;
    }
    const dd = x => x ? x.d.toLocaleDateString([], {month: 'short', day: 'numeric'}) : '';
    return `<div class="calhead"><div class="calnav"><button class="btn sm" data-cal="-1" ${idxM <= firstIdx ? 'disabled' : ''} aria-label="Previous month">&#8249;</button><b>${first.toLocaleDateString([], {month: 'long', year: 'numeric'})}</b><button class="btn sm" data-cal="1" ${idxM >= nowIdx ? 'disabled' : ''} aria-label="Next month">&#8250;</button></div>
      <div class="calsum"><div><span>Month result</span><b style="color:${keys.length ? col(net) : 'var(--fg-2)'}">${keys.length ? sgn(net) : '-'}</b></div><div><span>Green / red days</span><b><i class="gd">${up}</i> / <i class="rd">${dn}</i></b></div>
      <div><span>Best day</span><b style="color:var(--mint)">${best ? sgn(best.v) + ' <small>' + dd(best) + '</small>' : '-'}</b></div><div><span>Worst day</span><b style="color:${worst && worst.v < 0 ? 'var(--red)' : 'var(--fg-2)'}">${worst ? sgn(worst.v) + ' <small>' + dd(worst) + '</small>' : '-'}</b></div><div><span>Trades</span><b>${trades}</b></div></div></div>
      <div class="calg">${cells}</div>`;
  }

  // results by weekday and by hour of the day (closing time, local time)
  function weekdayBars(t) {
    const a = WD.map(() => ({v: 0, n: 0})); t.forEach(x => { const o = a[(new Date(x.closed_at).getDay() + 6) % 7]; o.v += x.profit; o.n++; });
    const mx = Math.max(1, ...a.map(o => Math.abs(o.v)));
    return a.map((o, i) => (i > 4 && !o.n) ? '' : `<div class="wd"><span class="wdl">${WD[i]}</span><div class="wdb"><i class="${o.v < 0 ? 'neg' : ''}" style="width:${o.n ? Math.max(1.5, Math.abs(o.v) / mx * 100) : 0}%;--i:${i}"></i></div><b style="color:${o.n ? col(o.v) : 'var(--muted)'}">${o.n ? sgn(o.v) : '-'}</b><span class="hint wdn">${o.n} trade${o.n === 1 ? '' : 's'}</span></div>`).join('');
  }
  function hourStrip(t) {
    const h = Array.from({length: 24}, () => ({v: 0, n: 0})); t.forEach(x => { const o = h[new Date(x.closed_at).getHours()]; o.v += x.profit; o.n++; });
    const mx = Math.max(1, ...h.map(o => Math.abs(o.v)));
    return `<div class="hrs">${h.map((o, i) => `<div class="hc ${o.n ? (o.v >= 0 ? 'pos' : 'neg') : 'none'}" style="--a:${o.n ? (.16 + .6 * Math.min(1, Math.abs(o.v) / mx)).toFixed(2) : 0};--i:${i}" title="${String(i).padStart(2, '0')}:00 to ${String(i).padStart(2, '0')}:59 · ${o.n ? sgn(o.v) + ' · ' + o.n + ' trade' + (o.n > 1 ? 's' : '') : 'no closed trades'}"><span>${String(i).padStart(2, '0')}h</span><b>${o.n ? csgn(o.v) : ''}</b></div>`).join('')}</div>`;
  }

  function tradeRows(list) {
    return list.map(t => `<tr><td>${loc(t.closed_at)}</td><td><span class="chip" style="--c:${ECL[t.engine]}">${ENG[t.engine] || ''}${t.is_add ? ' add-on' : ''}</span></td>
      <td><span class="side ${t.dir > 0 ? 'b' : 's'}">${t.dir > 0 ? 'BUY' : 'SELL'}</span></td><td>${Number(t.lots).toFixed(2)}</td><td>${Number(t.open_price).toFixed(2)}</td><td>${Number(t.close_price).toFixed(2)}</td>
      <td class="hint">${held(t)}</td><td style="color:${col(t.profit)};font-weight:600">${sgn(t.profit)}<span class="hint" style="margin-left:6px;font-weight:400">${(t.result_r || 0) >= 0 ? '+' : ''}${(t.result_r || 0).toFixed(2)}R</span></td></tr>`).join('');
  }

  function demo() {     // sample data for ?demo=1 only
    let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647, out = [];
    for (let i = 0; i < 90; i++) { const eng = ['M', 'I', 'D'][Math.floor(r() * 3)], win = r() < .55, R = win ? .3 + r() * 2.2 : -(.5 + r() * .6), lots = .01 + Math.floor(r() * 3) / 100, hrs = 1 + r() * 20;
      const closed = Date.now() - (90 - i) * 5.2 * 36e5;
      out.push({engine: eng, dir: r() < .5 ? 1 : -1, is_add: false, opened_at: new Date(closed - hrs * 36e5).toISOString(), closed_at: new Date(closed).toISOString(), open_price: 4100 + r() * 100, close_price: 4100 + r() * 100, lots, result_r: R, profit: R * 25 * lots * 100}); }
    return out;
  }
  window.gteResults = {stats, curve, spark, lineChart, bindHover, engineBars, donut, bars, monthItems, dayItems, calendar, weekdayBars, hourStrip, tradeRows, demo, ENG, ECL, sgn, usd, col, loc, fmtMin};
})();
