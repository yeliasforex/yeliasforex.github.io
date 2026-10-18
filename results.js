/* Results helpers for the account page: statistics and SVG charts built from the closed trades the EA recorded.
   Everything shown is real data from those trades. No libraries. */
(function () {
  const ENG = {M: 'Alpha', I: 'Beta', D: 'Gamma'}, ECL = {M: '#5B86FF', I: '#E3B95F', D: '#B07CFF'};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const usd = (n, d = 2) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const sgn = (n, d = 2) => (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const col = n => n >= 0 ? 'var(--mint)' : 'var(--red)';
  const loc = d => new Date(d).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
  const locDay = d => new Date(d).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
  const dk = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const held = t => { if (!t.opened_at) return '-'; const m = Math.max(0, Math.round((new Date(t.closed_at) - new Date(t.opened_at)) / 60000)); return m < 60 ? m + 'm' : m < 1440 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : Math.floor(m / 1440) + 'd ' + Math.floor((m % 1440) / 60) + 'h'; };

  function stats(t) {
    const n = t.length, w = t.filter(x => x.profit > 0), l = t.filter(x => x.profit < 0);
    const gp = w.reduce((a, x) => a + x.profit, 0), gl = -l.reduce((a, x) => a + x.profit, 0);
    const cv = curve(t);
    return {n, net: gp - gl, win: n ? 100 * w.length / n : 0, wins: w.length, losses: l.length, pf: gl > 0 ? gp / gl : null,
            avgWin: w.length ? gp / w.length : 0, avgLoss: l.length ? -gl / l.length : 0,
            avgR: n ? t.reduce((a, x) => a + (x.result_r || 0), 0) / n : 0,
            best: n ? Math.max(...t.map(x => x.profit)) : 0, worst: n ? Math.min(...t.map(x => x.profit)) : 0,
            maxDD: cv.length ? Math.max(...cv.map(p => p.dd)) : 0};
  }
  function curve(t) {
    const s = t.slice().sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at));
    let c = 0, peak = 0; const out = [];
    if (s.length) out.push({t: new Date(s[0].opened_at || s[0].closed_at).getTime(), c: 0, dd: 0});
    s.forEach(x => { c += x.profit; peak = Math.max(peak, c); out.push({t: new Date(x.closed_at).getTime(), c, dd: peak - c, tr: x}); });
    return out;
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
    return `<div class="chw" id="${id}-w" data-x0="${x0}" data-x1="${x1}" data-pl="${P.l / W}" data-pr="${P.r / W}">
      <svg id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;color:var(--fg-2);display:block">
      <defs><linearGradient id="g-${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".38"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}${ticks}${zero}<path d="${area}" fill="url(#g-${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <line id="${id}-v" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="${color}" opacity="0" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
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
    return rows.map(r => `<div class="eb"><div class="ebh"><span class="chip" style="--c:${ECL[r.e]}">${ENG[r.e]}</span><span class="hint">${r.n} trades${r.n ? ' · ' + r.win.toFixed(0) + '% win' : ''}</span><b style="color:${col(r.net)}">${r.n ? sgn(r.net) : '-'}</b></div>
      <div class="ebb"><i style="width:${r.n ? Math.max(2, Math.abs(r.net) / mx * 100) : 0}%;background:${r.net >= 0 ? ECL[r.e] : 'var(--red)'}"></i></div></div>`).join('');
  }
  function bars(items, h) {
    if (!items.length) return '<div class="empty">No data yet.</div>';
    const W = 760, H = h || 190, P = {l: 58, r: 8, t: 10, b: 26}, top = Math.max(0, ...items.map(i => i.v)), bot = Math.min(0, ...items.map(i => i.v));
    const Y = v => P.t + (1 - (v - bot) / ((top - bot) || 1)) * (H - P.t - P.b), bw = (W - P.l - P.r) / items.length;
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;color:var(--fg-2);display:block" preserveAspectRatio="none">
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".25"/>
      <text x="${P.l - 8}" y="${Y(top) + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity=".55">${usd(top, 0)}</text><text x="${P.l - 8}" y="${Y(bot) + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity=".55">${usd(bot, 0)}</text>
      ${items.map((it, i) => { const x = P.l + i * bw + bw * .18, w = bw * .64, y = Math.min(Y(it.v), Y(0)), hh = Math.max(1.5, Math.abs(Y(it.v) - Y(0)));
        return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="3" fill="${it.v >= 0 ? '#3EE09A' : '#FF6B78'}"><title>${esc(it.label)}: ${sgn(it.v)}</title></rect><text x="${x + w / 2}" y="${H - 7}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".6">${esc(it.short)}</text>`; }).join('')}</svg>`;
  }
  function monthItems(t) {
    const m = {}; t.forEach(x => { const d = new Date(x.closed_at), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); m[k] = (m[k] || 0) + x.profit; });
    return Object.keys(m).sort().map(k => ({label: k, short: new Date(k + '-02').toLocaleDateString([], {month: 'short'}), v: m[k]}));
  }
  function dayItems(t, days) {
    const m = {}; t.forEach(x => { const k = dk(x.closed_at); m[k] = (m[k] || 0) + x.profit; });
    const out = []; const now = new Date(); now.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) { const d = new Date(now.getTime() - i * 864e5), k = dk(d); out.push({label: k, short: d.getDate() % 5 === 0 || i === 0 ? String(d.getDate()) : '', v: m[k] || 0, has: k in m}); }
    return out;
  }
  // profit calendar: columns = weeks, rows = Mon..Sun, colour = daily result
  function calendar(t, weeks) {
    const m = {}; t.forEach(x => { const k = dk(x.closed_at); m[k] = (m[k] || 0) + x.profit; });
    const mx = Math.max(1, ...Object.values(m).map(Math.abs));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = (today.getDay() + 6) % 7;                        // Monday = 0
    const start = new Date(today.getTime() - ((weeks - 1) * 7 + dow) * 864e5);
    let cells = '';
    for (let w = 0; w < weeks; w++) for (let r = 0; r < 7; r++) {
      const d = new Date(start.getTime() + (w * 7 + r) * 864e5); if (d > today) continue;
      const k = dk(d), v = m[k], a = v == null ? 0 : .25 + .75 * Math.min(1, Math.abs(v) / mx);
      const bg = v == null ? 'var(--panel-2)' : (v >= 0 ? `rgba(62,224,154,${a})` : `rgba(255,107,120,${a})`);
      cells += `<i class="cal-c" style="grid-column:${w + 1};grid-row:${r + 1};background:${bg}" title="${locDay(d)}: ${v == null ? 'no closed trades' : sgn(v)}"></i>`;
    }
    return `<div class="cal" style="grid-template-columns:repeat(${weeks},1fr)">${cells}</div><div class="hint cal-l"><span>Less</span><i style="background:rgba(255,107,120,.9)"></i><i style="background:rgba(255,107,120,.4)"></i><i style="background:var(--panel-2)"></i><i style="background:rgba(62,224,154,.4)"></i><i style="background:rgba(62,224,154,.9)"></i><span>Daily result: red loss, green profit</span></div>`;
  }
  function tradeRows(list) {
    return list.map(t => `<tr><td>${loc(t.closed_at)}</td><td><span class="chip" style="--c:${ECL[t.engine]}">${ENG[t.engine] || ''}${t.is_add ? ' add-on' : ''}</span></td>
      <td><span class="side ${t.dir > 0 ? 'b' : 's'}">${t.dir > 0 ? 'BUY' : 'SELL'}</span></td><td>${Number(t.lots).toFixed(2)}</td><td>${Number(t.open_price).toFixed(2)}</td><td>${Number(t.close_price).toFixed(2)}</td>
      <td class="hint">${held(t)}</td><td style="color:${col(t.profit)};font-weight:600">${sgn(t.profit)}<span class="hint" style="margin-left:6px;font-weight:400">${(t.result_r || 0) >= 0 ? '+' : ''}${(t.result_r || 0).toFixed(2)}R</span></td></tr>`).join('');
  }

  function demo() {     // sample data for ?demo=1 only
    let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647, out = [];
    for (let i = 0; i < 60; i++) { const eng = ['M', 'I', 'D'][Math.floor(r() * 3)], win = r() < .55, R = win ? .3 + r() * 2.2 : -(.5 + r() * .6), lots = .01 + Math.floor(r() * 3) / 100, hrs = 1 + r() * 20;
      const closed = Date.now() - (60 - i) * 6.5 * 36e5;
      out.push({engine: eng, dir: r() < .5 ? 1 : -1, is_add: false, opened_at: new Date(closed - hrs * 36e5).toISOString(), closed_at: new Date(closed).toISOString(), open_price: 4100 + r() * 100, close_price: 4100 + r() * 100, lots, result_r: R, profit: R * 25 * lots * 100}); }
    return out;
  }
  window.gteResults = {stats, curve, lineChart, bindHover, engineBars, bars, monthItems, dayItems, calendar, tradeRows, demo, ENG, ECL, sgn, usd, col, loc};
})();
