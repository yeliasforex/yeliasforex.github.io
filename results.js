/* Results charts for the account page: equity curve, drawdown, per-engine, monthly, trade history. Pure SVG, no library.
   Input: closed trades of one license (as recorded by the EA). Everything shown is real data from those trades. */
(function () {
  const ENG = {M: 'Alpha', I: 'Beta', D: 'Gamma'};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const usd = (n, d = 2) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  const sgn = n => (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const day = d => new Date(d).toISOString().slice(0, 10);

  function stats(t) {
    const n = t.length, w = t.filter(x => x.profit > 0), l = t.filter(x => x.profit < 0);
    const gp = w.reduce((a, x) => a + x.profit, 0), gl = -l.reduce((a, x) => a + x.profit, 0);
    return {n, net: gp - gl, win: n ? 100 * w.length / n : 0, pf: gl > 0 ? gp / gl : null, avgR: n ? t.reduce((a, x) => a + (x.result_r || 0), 0) / n : 0,
            best: n ? Math.max(...t.map(x => x.profit)) : 0, worst: n ? Math.min(...t.map(x => x.profit)) : 0};
  }
  function curve(t) {
    let c = 0, peak = 0; return t.map(x => { c += x.profit; peak = Math.max(peak, c); return {t: new Date(x.closed_at).getTime(), c, dd: peak - c}; });
  }

  // line/area chart. series: [{t,v}], color; zero baseline drawn when values span it.
  function lineChart(id, pts, key, color, fmt, invert) {
    const W = 760, H = 220, P = {l: 56, r: 12, t: 12, b: 26};
    if (pts.length < 2) return '<div class="hint" style="padding:30px 0">Not enough trades yet to draw this chart.</div>';
    const xs = pts.map(p => p.t), ys = pts.map(p => p[key]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys);
    if (y1 === y0) y1 = y0 + 1;
    const X = t => P.l + (x1 === x0 ? 0 : (t - x0) / (x1 - x0)) * (W - P.l - P.r), Y = v => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p[key]).toFixed(1)).join(' ');
    const area = d + ' L' + X(x1).toFixed(1) + ' ' + Y(0).toFixed(1) + ' L' + X(x0).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z';
    const grid = [0, .25, .5, .75, 1].map(f => { const v = y0 + f * (y1 - y0), y = Y(v); return `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".1"/><text x="${P.l - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity=".6">${fmt(v)}</text>`; }).join('');
    const ticks = [0, .5, 1].map(f => { const t = x0 + f * (x1 - x0); return `<text x="${X(t)}" y="${H - 6}" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}" font-size="11" fill="currentColor" opacity=".6">${day(t)}</text>`; }).join('');
    return `<svg class="ch" id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:220px;color:var(--fg-2)" data-x0="${x0}" data-x1="${x1}">
      <defs><linearGradient id="g-${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}${ticks}<path d="${area}" fill="url(#g-${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
      <div class="hint" id="${id}-tip" style="min-height:1.4em"></div>`;
  }
  function barChart(items, fmt) {      // items: [{label, v}]
    if (!items.length) return '<div class="hint">No data yet.</div>';
    const W = 760, H = 200, P = {l: 56, r: 8, t: 10, b: 28}, mx = Math.max(1, ...items.map(i => Math.abs(i.v))), top = Math.max(0, ...items.map(i => i.v)), bot = Math.min(0, ...items.map(i => i.v));
    const Y = v => P.t + (1 - (v - bot) / ((top - bot) || 1)) * (H - P.t - P.b), bw = (W - P.l - P.r) / items.length;
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:200px;color:var(--fg-2)" preserveAspectRatio="none">
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".25"/>
      <text x="${P.l - 8}" y="${Y(top) + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity=".6">${fmt(top)}</text><text x="${P.l - 8}" y="${Y(bot) + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity=".6">${fmt(bot)}</text>
      ${items.map((it, i) => { const x = P.l + i * bw + bw * .15, w = bw * .7, y = Math.min(Y(it.v), Y(0)), h = Math.max(1, Math.abs(Y(it.v) - Y(0)));
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${it.v >= 0 ? '#3EE09A' : '#FF6B78'}"><title>${esc(it.label)}: ${fmt(it.v)}</title></rect><text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".65">${esc(it.label.slice(2))}</text>`; }).join('')}</svg>`;
  }

  function render(el, trades, opts) {
    opts = opts || {};
    if (!trades.length) { el.innerHTML = '<h2>Results</h2><p class="sub">Charts appear here after the EA closes its first trade on your account.</p>'; return; }
    trades = trades.slice().sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at));
    const st = stats(trades), first = day(trades[0].closed_at), last = day(trades[trades.length - 1].closed_at);
    let range = 'all';
    const draw = () => {
      const cut = range === 'all' ? 0 : Date.now() - (range === '1m' ? 30 : 90) * 864e5;
      const view = trades.filter(t => new Date(t.closed_at).getTime() >= cut);
      const cv = curve(view), s = stats(view);
      const byEng = ['M', 'I', 'D'].map(e => { const x = view.filter(t => t.engine === e); const q = stats(x); return {e, n: q.n, net: q.net, win: q.win}; });
      const months = {}; view.forEach(t => { const m = String(t.closed_at).slice(0, 7); months[m] = (months[m] || 0) + t.profit; });
      const monthItems = Object.keys(months).sort().map(m => ({label: m, v: months[m]}));
      const maxDD = cv.length ? Math.max(...cv.map(p => p.dd)) : 0;
      el.querySelector('#rs-body').innerHTML = `
        <div class="tiles">
          <div class="tile"><div class="l">Net result</div><div class="v" style="color:${s.net >= 0 ? 'var(--mint)' : 'var(--red)'}">${sgn(s.net)}</div><div class="s">${s.n} closed trades</div></div>
          <div class="tile"><div class="l">Win rate</div><div class="v">${s.win.toFixed(0)}%</div><div class="s">Profit factor ${s.pf == null ? '-' : s.pf.toFixed(2)}</div></div>
          <div class="tile"><div class="l">Largest drawdown</div><div class="v">${usd(maxDD, 0)}</div><div class="s">from a result peak</div></div>
          <div class="tile"><div class="l">Best / worst trade</div><div class="v" style="font-size:1.05rem">${sgn(s.best)} / ${sgn(s.worst)}</div><div class="s">Average ${s.avgR.toFixed(2)} R</div></div>
        </div>
        <h3 class="rh">Equity curve <span class="hint">cumulative net result of closed trades</span></h3>${lineChart('eq', cv, 'c', '#3EE09A', v => usd(v, 0))}
        <h3 class="rh">Drawdown <span class="hint">distance below the highest result so far</span></h3>${lineChart('dd', cv.map(p => ({t: p.t, dd: -p.dd})), 'dd', '#FF6B78', v => usd(v, 0))}
        <h3 class="rh">By engine</h3>
        <table class="tbl2"><tr><th>Engine</th><th>Trades</th><th>Win rate</th><th>Net result</th></tr>${byEng.map(b => `<tr><td>${ENG[b.e]}</td><td>${b.n}</td><td>${b.n ? b.win.toFixed(0) + '%' : '-'}</td><td style="color:${b.net >= 0 ? 'var(--mint)' : 'var(--red)'}">${b.n ? sgn(b.net) : '-'}</td></tr>`).join('')}</table>
        <h3 class="rh">Monthly result</h3>${barChart(monthItems, v => usd(v, 0))}
        <h3 class="rh">Trade history</h3>
        <div style="overflow-x:auto"><table class="tbl2" id="rs-hist"><tr><th>Closed</th><th>Engine</th><th>Side</th><th>Lots</th><th>Open</th><th>Close</th><th>Result</th></tr></table></div>
        <button class="btn sm" id="rs-more" style="margin-top:10px">Show more</button>`;
      let shown = 0; const hist = view.slice().reverse(), tb = el.querySelector('#rs-hist'), more = el.querySelector('#rs-more');
      const add = () => { hist.slice(shown, shown + 25).forEach(t => { tb.insertAdjacentHTML('beforeend', `<tr><td>${esc(String(t.closed_at).slice(0, 16).replace('T', ' '))}</td><td>${ENG[t.engine] || ''}${t.is_add ? ' add-on' : ''}</td><td>${t.dir > 0 ? 'Buy' : 'Sell'}</td><td>${Number(t.lots).toFixed(2)}</td><td>${Number(t.open_price).toFixed(2)}</td><td>${Number(t.close_price).toFixed(2)}</td><td style="color:${t.profit >= 0 ? 'var(--mint)' : 'var(--red)'}">${sgn(t.profit)}</td></tr>`); }); shown += 25; if (shown >= hist.length) more.style.display = 'none'; };
      add(); more.onclick = add;
      // hover read-out on the equity curve
      [['eq', 'c', cv], ['dd', 'dd', cv.map(p => ({t: p.t, dd: -p.dd}))]].forEach(([id, k, pts]) => { const svg = el.querySelector('#' + id); if (!svg || pts.length < 2) return; const tip = el.querySelector('#' + id + '-tip');
        svg.onmousemove = svg.ontouchmove = ev => { const r = svg.getBoundingClientRect(), cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left, f = Math.min(1, Math.max(0, (cx / r.width * 760 - 56) / (760 - 68))), t = +svg.dataset.x0 + f * (+svg.dataset.x1 - +svg.dataset.x0); let b = pts[0]; pts.forEach(p => { if (Math.abs(p.t - t) < Math.abs(b.t - t)) b = p; }); tip.textContent = day(b.t) + ': ' + usd(b[k], 2); }; });
    };
    el.innerHTML = `<div class="row sp"><div><h2>Results</h2><p class="sub" style="margin:0">Closed trades recorded by the EA on your account, ${first} to ${last}. Source: your own account's trade records.</p></div>
      <div class="tabsx" id="rs-tabs"><a href="#" data-r="1m">1 month</a><a href="#" data-r="3m">3 months</a><a href="#" data-r="all" class="on">All</a></div></div>
      <div id="rs-body"></div><p class="fine">Past results do not guarantee future results. Gold trading carries a high risk of loss. See the <a href="risk.html">risk disclaimer</a>.</p>`;
    el.querySelectorAll('#rs-tabs a').forEach(a => a.onclick = e => { e.preventDefault(); range = a.dataset.r; el.querySelectorAll('#rs-tabs a').forEach(x => x.classList.toggle('on', x === a)); draw(); });
    draw();
  }

  function demo() {     // sample data for ?demo=1 only
    let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647, out = [];
    for (let i = 0; i < 160; i++) { const eng = ['M', 'I', 'D'][Math.floor(r() * 3)], win = r() < .54, R = win ? .5 + r() * 2.5 : -(.4 + r() * .8), lots = .1 + Math.floor(r() * 3) / 10;
      out.push({engine: eng, dir: r() < .5 ? 1 : -1, is_add: false, closed_at: new Date(Date.now() - (160 - i) * 14 * 36e5).toISOString(), open_price: 2300 + r() * 100, close_price: 2300 + r() * 100, lots, result_r: R, profit: R * 55 * lots * 10}); }
    return out;
  }
  window.gteResults = {render, demo};
})();
