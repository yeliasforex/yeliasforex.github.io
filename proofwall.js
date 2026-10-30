/* Customer Proof Wall: full page (customers.html) and a compact section on the home page. The home section stays hidden until there are real cards. */
(async () => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const full = !!document.getElementById('pwgrid');
  const PV = full && new URLSearchParams(location.search).get('preview') === '1';      // owner preview: only works for a signed-in, verified admin (the database decides)
  const load = src => new Promise(r => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = r; document.head.appendChild(s); });
  if (!window.gte) await load('app.js?v=20261030pw7');
  if (!window.gte || !gte.client) return;
  let cards = [], tot = null;
  try {
    const c = await gte.client();
    const [a, b] = await Promise.all([c.rpc('proof_wall', PV ? {p_preview: true} : {}), c.rpc('proof_totals')]);
    cards = Array.isArray(a.data) ? a.data : []; tot = b.data || null;
    if (PV && !cards.length) tot = Object.assign({}, tot, {on: true});
  } catch (e) {}
  cards.forEach(x => { if (x.gain_pct == null) x.gain_pct = 0; if (x.max_dd_pct == null) x.max_dd_pct = 0; });
  const cn = c => { if (!c) return ''; if (/^[A-Za-z]{2}$/.test(c)) { try { return new Intl.DisplayNames(['en'], {type: 'region'}).of(c.toUpperCase()) || c; } catch (e) {} } return c; };
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const coarse = matchMedia('(pointer:coarse)').matches;
  const fmtD = d => d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
  const startOf = x => x.start ? new Date(x.start + 'T00:00:00') : new Date(Date.now() - (x.days || 0) * 864e5);
  const pct = (v, d = 1) => (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';
  const key = {}; cards.forEach((x, i) => key[x.slug || i] = x);
  let gid = 0;

  /* ---------- per-customer chart: axes, shaded max drawdown, peak, end label, hover readout ---------- */
  const chart = (x, big) => {
    const raw = (x.curve && x.curve.length > 1) ? x.curve : null; if (!raw) return '';
    const pts = [0].concat(raw), n = pts.length, id = 'pwg' + (++gid);
    const W = big ? 640 : 320, H = big ? 250 : 156, L = 38, R = 12, T = 16, B = 24;
    const mn = Math.min(0, ...pts), mx = Math.max(0.01, ...pts), rg = (mx - mn) || 1, lo = mn - rg * .1, hi = mx + rg * .16;
    const X = i => L + i * (W - L - R) / (n - 1), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    const line = pts.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    const z = Y(0).toFixed(1), last = n - 1, up = pts[last] >= 0;
    // max drawdown span (running peak to deepest point below it)
    let pk = 0, pi = 0, dd = 0, d0 = 0, d1 = 0;
    pts.forEach((v, i) => { if (v > pts[pi]) pi = i; if (pts[pi] - v > dd) { dd = pts[pi] - v; d0 = pi; d1 = i; } });
    let ddSvg = '';
    if (dd > 0.15 && d1 > d0) {
      let back = ''; for (let k = d1; k >= d0; k--) back += 'L' + X(k).toFixed(1) + ' ' + Y(pts[k]).toFixed(1);
      ddSvg = '<path class="pw-dd" d="M' + X(d0).toFixed(1) + ' ' + Y(pts[d0]).toFixed(1) + 'L' + X(d1).toFixed(1) + ' ' + Y(pts[d0]).toFixed(1) + back + 'Z"/>' +
        '<line class="pw-ddl" x1="' + X(d0).toFixed(1) + '" x2="' + X(d1).toFixed(1) + '" y1="' + Y(pts[d0]).toFixed(1) + '" y2="' + Y(pts[d0]).toFixed(1) + '"/>' +
        '<text class="pw-ddt" x="' + X(d1).toFixed(1) + '" y="' + (Y(pts[d1]) + 13).toFixed(1) + '" text-anchor="' + (d1 > n * .7 ? 'end' : 'middle') + '">−' + dd.toFixed(1) + '% dip</text>';
    }
    // y ticks
    const tk = [0]; const top = Math.round(mx), bot = Math.round(mn);
    if (top > 0 && Y(top) < Y(0) - 18) tk.push(top); if (bot < 0 && Y(bot) > Y(0) + 18) tk.push(bot);
    const grid = tk.map(v => '<line class="pw-gl' + (v === 0 ? ' z' : '') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="pw-yt" x="' + (L - 6) + '" y="' + (Y(v) + 3).toFixed(1) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '%</text>').join('');
    const ex = X(last).toFixed(1), ey = Y(pts[last]).toFixed(1);
    const pkSvg = (pi > 0 && pi < last - 1) ? '<circle class="pw-pk" cx="' + X(pi).toFixed(1) + '" cy="' + Y(pts[pi]).toFixed(1) + '" r="3.4"/>' : '';
    const lab = pct(pts[last]), lw = lab.length * 6.2 + 12, lx = Math.min(W - R, Math.max(L + lw, +ex));
    return '<div class="pw-ch" data-slug="' + esc(x.slug) + '"><svg viewBox="0 0 ' + W + ' ' + H + '" class="pw-sp" role="img" aria-label="Equity curve, ' + esc(pct(pts[last])) + ' since start">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".34"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
      grid + ddSvg +
      '<path class="pw-area" d="' + line + 'L' + X(last).toFixed(1) + ' ' + z + 'L' + L + ' ' + z + 'Z" fill="url(#' + id + ')"/>' +
      '<path class="pw-line" pathLength="1" d="' + line + '"/>' + pkSvg +
      '<g class="pw-end"><circle class="pw-ring2" cx="' + ex + '" cy="' + ey + '" r="6"/><circle cx="' + ex + '" cy="' + ey + '" r="3.6"/>' +
      '<rect class="pw-pill" x="' + (lx - lw).toFixed(1) + '" y="' + (+ey - 27).toFixed(1) + '" width="' + lw.toFixed(1) + '" height="17" rx="8.5"/><text class="pw-pillt" x="' + (lx - lw / 2).toFixed(1) + '" y="' + (+ey - 15).toFixed(1) + '" text-anchor="middle">' + lab + '</text></g>' +
      '<text class="pw-xt" x="' + L + '" y="' + (H - 6) + '">' + esc(fmtD(startOf(x))) + '</text><text class="pw-xt" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fmtD(new Date())) + '</text>' +
      '<line class="pw-cl" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/><circle class="pw-cd" r="4.2" cx="0" cy="0"/>' +
      '<rect class="pw-hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '" data-w="' + W + '" data-h="' + H + '" data-l="' + L + '" data-r="' + R + '" data-t="' + T + '" data-b="' + B + '" data-lo="' + lo + '" data-hi="' + hi + '"/>' +
      '</svg><div class="pw-tip" hidden></div></div>';
  };

  const ring = v => '<svg class="pw-rg" viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="15.9" pathLength="100"/><circle class="fg" cx="18" cy="18" r="15.9" pathLength="100" style="--w:' + Math.max(0, Math.min(100, v || 0)) + '"/></svg>';
  const cu = (v, d, o = {}) => '<span class="cu" data-v="' + v + '" data-d="' + d + '"' + (o.sign ? ' data-sign="1"' : '') + (o.suf ? ' data-s="' + o.suf + '"' : '') + (o.grp ? ' data-g="1"' : '') + '>' + (o.sign && v > 0 ? '+' : '') + (o.grp ? Number(v).toLocaleString('en-US') : Number(v).toFixed(d)) + (o.suf || '') + '</span>';

  const card = (x, i) => {
    const up = x.gain_pct >= 0, ini = esc((x.name || '?').trim().charAt(0).toUpperCase());
    const av = x.photo ? '<span class="pw-av" style="background-image:url(' + esc(x.photo) + ')"></span>' : '<span class="pw-av">' + ini + '</span>';
    const ddw = Math.min(100, Math.round((x.max_dd_pct || 0) * 5));
    return '<article class="card pw-card ' + (up ? 'pw-up' : 'pw-dn') + ' rv" data-b="' + esc(x.broker || '') + '" data-g="' + x.gain_pct + '" data-d="' + x.days + '" data-n="' + i + '">' +
      '<i class="pw-shine"></i>' +
      '<header>' + av + '<div><b>' + esc(x.name) + '</b><span>' + esc([cn(x.country), 'since ' + x.joined].filter(Boolean).join(' · ')) + '</span></div>' + (x.pv ? '<span class="pw-ver pw-pvb" title="' + esc(x.pv) + '">Preview only</span>' : '<span class="pw-ver"><i></i>Verified</span>') + '</header>' +
      '<div class="pw-big"><b>' + cu(x.gain_pct, 1, {sign: 1, suf: '%'}) + '</b><span>gain since start · ' + esc(x.days) + ' days</span></div>' +
      chart(x) +
      '<dl class="pw-st">' +
        '<div><dt>Max drawdown</dt><dd>' + cu(x.max_dd_pct || 0, 1, {suf: '%'}) + '</dd><em class="pw-gg"><i style="--w:' + ddw + '%"></i></em></div>' +
        '<div><dt>Trades</dt><dd>' + cu(x.trades || 0, 0, {grp: 1}) + '</dd><em class="pw-gg b"><i style="--w:' + Math.min(100, (x.trades || 0)) + '%"></i></em></div>' +
        '<div><dt>Win rate</dt><dd>' + (x.win_rate == null ? '–' : cu(x.win_rate, 1, {suf: '%'})) + '</dd>' + (x.win_rate == null ? '' : ring(x.win_rate)) + '</div>' +
      '</dl>' +
      (x.quote ? '<blockquote>“' + esc(x.quote) + '”</blockquote>' : '') +
      (x.pv ? '<p class="pw-why">Visitors cannot see this account: ' + esc(x.pv) + '.</p>' : '') +
      '<footer>' + (x.plan ? '<span class="pw-plan">' + esc(x.plan) + ' plan</span>' : '') + '<small>' + esc([x.broker, x.size].filter(Boolean).join(' · ')) + '</small><small>Calculated by GTE servers from this account\'s own EA trades</small></footer></article>';
  };

  const totals = () => tot && tot.active ? '<div><b>' + cu(tot.active, 0, {grp: 1}) + '</b><span>live customer accounts</span></div><div><b>' + cu(tot.trades, 0, {grp: 1}) + '</b><span>trades tracked</span></div><div><b>' + cu(cards.length, 0) + '</b><span>shown with consent</span></div>' : '';

  /* ---------- all accounts on one timeline + ranking bars (full page only) ---------- */
  const composite = () => {
    const cs = cards.filter(x => x.curve && x.curve.length > 1); if (cs.length < (PV ? 1 : 2)) return '';     // visitors need 2+ accounts; the owner preview shows it with one so the layout can be checked
    const N = 48, rs = cs.map(x => { const p = [0].concat(x.curve), o = []; for (let k = 0; k < N; k++) { const t = k / (N - 1) * (p.length - 1), a = Math.floor(t), b = Math.min(p.length - 1, a + 1); o.push(p[a] + (p[b] - p[a]) * (t - a)); } return o; });
    const avg = Array.from({length: N}, (_, k) => rs.reduce((s, r) => s + r[k], 0) / rs.length);
    const all = rs.flat().concat(avg), mn = Math.min(0, ...all), mx = Math.max(0.01, ...all), rg = mx - mn || 1, lo = mn - rg * .1, hi = mx + rg * .12;
    const W = 640, H = 270, L = 40, R = 12, T = 14, B = 26, X = k => L + k * (W - L - R) / (N - 1), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    const path = r => r.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    const tk = [0]; const top = Math.round(mx), bot = Math.round(mn); [Math.round(top / 2), top].forEach(v => { if (v > 0 && Y(v) < Y(0) - 18 && !tk.includes(v)) tk.push(v); }); if (bot < 0 && Y(bot) > Y(0) + 18) tk.push(bot);
    const grid = tk.map(v => '<line class="pw-gl' + (v === 0 ? ' z' : '') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="pw-yt" x="' + (L - 6) + '" y="' + (Y(v) + 3).toFixed(1) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '%</text>').join('');
    const lines = rs.map((r, i) => '<path class="pw-ln ' + (r[N - 1] >= 0 ? 'u' : 'd') + '" pathLength="1" style="--i:' + i + '" d="' + path(r) + '"/>').join('');
    const a = avg[N - 1], gains = cs.map(x => x.gain_pct), best = Math.max(...gains), worst = Math.min(...gains);
    const maxAbs = Math.max(...gains.map(Math.abs), 1), rank = cs.slice().sort((p, q) => q.gain_pct - p.gain_pct).map((x, i) => '<li style="--i:' + i + '"><span>' + esc(x.name) + '</span><div class="pw-rk ' + (x.gain_pct >= 0 ? 'u' : 'd') + '"><i style="--w:' + (Math.abs(x.gain_pct) / maxAbs * 50).toFixed(1) + '%"></i></div><b>' + pct(x.gain_pct) + '</b></li>').join('');
    const sc = gains.filter(g => g > 0).length;
    return '<div class="pw-hero rv"><div class="pw-hc"><div class="pw-ht"><div><span class="kicker">All accounts, same start line</span><h2>How every account has moved <em class="s">since day one</em></h2></div>' +
      '<div class="pw-sum"><div><b class="' + (a >= 0 ? 'u' : 'd') + '">' + cu(a, 1, {sign: 1, suf: '%'}) + '</b><span>average</span></div><div><b class="u">' + cu(best, 1, {sign: 1, suf: '%'}) + '</b><span>best</span></div><div><b class="' + (worst >= 0 ? 'u' : 'd') + '">' + cu(worst, 1, {sign: 1, suf: '%'}) + '</b><span>weakest</span></div></div></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pw-sp pw-bigsp" role="img" aria-label="All customer equity curves with their average"><defs><linearGradient id="pwavg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gold)" stop-opacity=".32"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></linearGradient></defs>' +
      grid + lines + '<path class="pw-aavg" d="' + path(avg) + 'L' + X(N - 1).toFixed(1) + ' ' + Y(0).toFixed(1) + 'L' + L + ' ' + Y(0).toFixed(1) + 'Z" fill="url(#pwavg)"/><path class="pw-lavg" pathLength="1" d="' + path(avg) + '"/>' +
      '<g class="pw-end gold"><circle class="pw-ring2" cx="' + X(N - 1).toFixed(1) + '" cy="' + Y(a).toFixed(1) + '" r="6"/><circle cx="' + X(N - 1).toFixed(1) + '" cy="' + Y(a).toFixed(1) + '" r="4"/></g>' +
      '<text class="pw-xt" x="' + L + '" y="' + (H - 6) + '">Day one</text><text class="pw-xt" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">Today</text></svg>' +
      '<p class="pw-leg"><i class="u"></i>each line is one account <i class="a"></i>gold is the average of all</p>' + (cs.length < 2 ? '<p class="pw-leg" style="color:#d9822b">Preview: only one account so far, so the average is the same line. Visitors see this chart once 2 or more accounts qualify.</p>' : '') + '</div>' +
      '<aside class="pw-rank"><span class="kicker">Gain per account</span><ol>' + rank + '</ol><p>' + sc + ' of ' + cs.length + ' accounts are in profit. We show all of them.</p></aside></div>';
  };

  /* ---------- motion ---------- */
  const fmtCU = (el, val) => { const d = +el.dataset.d || 0, s = el.dataset.s || '', sg = el.dataset.sign ? (val > 0 ? '+' : '') : ''; return sg + (el.dataset.g ? Math.round(val).toLocaleString('en-US') : val.toFixed(d)) + s; };
  const runCU = el => {
    const v = +el.dataset.v; if (reduced || !isFinite(v)) return;
    const t0 = performance.now(), D = 1300; el.textContent = fmtCU(el, 0);
    const f = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 4); el.textContent = fmtCU(el, v * e); if (k < 1) requestAnimationFrame(f); else el.textContent = fmtCU(el, v); };
    requestAnimationFrame(f);
  };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { const t = en.target; t.classList.add('in'); t.querySelectorAll('.cu').forEach(runCU); io.unobserve(t); } }), {threshold: .15}) : null;
  const reveal = root => {
    [].slice.call(root.querySelectorAll('.rv:not(.in)')).forEach((e, i) => {
      e.style.setProperty('--d', (i % 4) * .09 + 's');
      if (io) io.observe(e); else e.classList.add('in');
    });
  };

  /* hover / touch readout on every chart, tilt + glow on cards (one delegated set of listeners) */
  const wire = root => {
    root.addEventListener('pointermove', e => {
      const hit = e.target.closest && e.target.closest('.pw-hit');
      if (hit) {
        const ch = hit.closest('.pw-ch'), svg = hit.ownerSVGElement, r = svg.getBoundingClientRect(), x = key[ch.dataset.slug]; if (!x) return;
        const W = +hit.dataset.w, H = +hit.dataset.h, L = +hit.dataset.l, R = +hit.dataset.r, T = +hit.dataset.t, B = +hit.dataset.b, lo = +hit.dataset.lo, hi = +hit.dataset.hi;
        const pts = [0].concat(x.curve), n = pts.length, fx = (e.clientX - r.left) / r.width * W;
        const i = Math.max(0, Math.min(n - 1, Math.round((fx - L) / (W - L - R) * (n - 1)))), vx = L + i * (W - L - R) / (n - 1), vy = T + (hi - pts[i]) / (hi - lo) * (H - T - B);
        const cl = svg.querySelector('.pw-cl'), cd = svg.querySelector('.pw-cd'), tip = ch.querySelector('.pw-tip');
        cl.setAttribute('x1', vx); cl.setAttribute('x2', vx); cd.setAttribute('cx', vx); cd.setAttribute('cy', vy); ch.classList.add('hv');
        const s0 = startOf(x), dt = new Date(s0.getTime() + i / (n - 1) * (Date.now() - s0.getTime()));
        const tr = i === 0 ? 'Opening' : 'Trade ~' + Math.max(1, Math.round(i / (n - 1) * (x.trades || n)));
        tip.innerHTML = '<b class="' + (pts[i] >= 0 ? 'u' : 'd') + '">' + pct(pts[i]) + '</b><span>' + esc(fmtD(dt)) + '</span><span>' + tr + '</span>'; tip.hidden = false;
        const pxL = vx / W * r.width; tip.style.left = Math.max(34, Math.min(r.width - 34, pxL)) + 'px';
      }
      const c = e.target.closest && e.target.closest('.pw-card');
      if (c && !coarse && !reduced) {
        const b = c.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        c.style.setProperty('--mx', (px * 100).toFixed(0) + '%'); c.style.setProperty('--my', (py * 100).toFixed(0) + '%');
        c.style.setProperty('--tf', 'perspective(1000px) rotateX(' + ((.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 6).toFixed(2) + 'deg) translateY(-4px)');
      }
    });
    root.addEventListener('pointerleave', () => root.querySelectorAll('.pw-card').forEach(c => c.style.removeProperty('--tf')), true);
    root.addEventListener('pointerout', e => {
      const ch = e.target.closest && e.target.closest('.pw-ch'); if (ch && !ch.contains(e.relatedTarget)) { ch.classList.remove('hv'); const t = ch.querySelector('.pw-tip'); if (t) t.hidden = true; }
      const c = e.target.closest && e.target.closest('.pw-card'); if (c && !c.contains(e.relatedTarget)) c.style.removeProperty('--tf');
    });
  };

  /* ---------- page ---------- */
  if (full) {
    const t = document.getElementById('pwtot'); t.innerHTML = totals(); t.hidden = !t.innerHTML; t.classList.add('rv');
    const g = document.getElementById('pwgrid'), hero = document.getElementById('pwhero');
    if (!cards.length) {
      const off = tot && tot.on === false;
      g.innerHTML = '<div class="pw-empty"><svg class="pw-eg" viewBox="0 0 200 70" aria-hidden="true"><path d="M4 58 C30 56 40 44 62 46 S100 30 124 26 S170 10 196 6" pathLength="1"/></svg>' +
        (off ? '<span class="kicker">Opening soon</span><h3>The Proof Wall <em class="s">opens soon.</em></h3><p>We are collecting the first customer results. It opens here once enough real accounts can be shown fairly. Until then, watch our own live account on <a href="index.html#account">the home page</a> or on <a href="https://www.myfxbook.com/portfolio/goldtriengine/12235544" rel="noopener">Myfxbook</a>.</p>'
             : '<span class="kicker">Growing</span><h3>Be among the first <em class="s">to be featured.</em></h3><p>Customers appear here automatically once their real account has enough closed trades or days of history. Until then, watch our own live account on <a href="index.html#account">the home page</a> or on <a href="https://www.myfxbook.com/portfolio/goldtriengine/12235544" rel="noopener">Myfxbook</a>.</p>') + '</div>';
      reveal(document.body); return;
    }
    if (hero) hero.innerHTML = (PV ? '<div class="pw-prev"><b>Owner preview.</b> You are seeing every account that has a license, including demo and not-agreed accounts, even while the wall is off. Visitors never see this. Accounts marked "Preview only" would not appear to visitors.</div>' : '') + composite();
    const brokers = [...new Set(cards.map(x => x.broker).filter(Boolean))];
    const bar = document.getElementById('pwbar');
    let fb = 'all', so = 'gain';
    const paint = () => {
      const list = cards.map((x, i) => [x, i]).filter(([x]) => fb === 'all' || x.broker === fb).sort((p, q) => so === 'gain' ? q[0].gain_pct - p[0].gain_pct : so === 'days' ? q[0].days - p[0].days : p[0].days - q[0].days);
      g.innerHTML = list.map(([x, i]) => card(x, i)).join(''); reveal(g);
    };
    if (bar && (brokers.length > 1 || cards.length > 3)) {
      bar.innerHTML = '<div class="pw-chips" role="group" aria-label="Broker">' + ['all'].concat(brokers).map(b => '<button type="button" data-f="' + esc(b) + '" class="' + (b === 'all' ? 'on' : '') + '">' + (b === 'all' ? 'All brokers' : esc(b)) + '</button>').join('') + '</div>' +
        '<div class="pw-chips" role="group" aria-label="Sort"><button type="button" data-s="gain" class="on">Best gain</button><button type="button" data-s="days">Longest live</button><button type="button" data-s="new">Newest</button></div>';
      bar.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.f !== undefined) { fb = b.dataset.f; bar.querySelectorAll('[data-f]').forEach(k => k.classList.toggle('on', k === b)); }
        if (b.dataset.s) { so = b.dataset.s; bar.querySelectorAll('[data-s]').forEach(k => k.classList.toggle('on', k === b)); }
        paint();
      });
    }
    paint(); reveal(document.body); wire(document.body);
    return;
  }
  if (!cards.length || (tot && (tot.on === false || tot.home === false))) return;   // home page: nothing until real customers exist, or when the owner switched it off
  const anchor = document.getElementById('account') || document.getElementById('gx') || document.querySelector('main');
  if (!anchor) return;
  const sec = document.createElement('section'); sec.className = 'sec pw-home'; sec.id = 'proof';
  sec.innerHTML = '<div class="wrap"><div class="sec-head"><span class="kicker rv"><span class="dot g" style="display:inline-block;margin-right:10px;vertical-align:1px"></span>Customer proof wall</span>' +
    '<h2 class="rv">Real customers. <em class="s">Real numbers.</em></h2>' +
    '<p class="lead rv">Every figure is calculated by our servers from the closed trades each customer\'s own EA reported. Shown with their agreement, weak results included.</p></div>' +
    '<div class="pw-tot rv">' + totals() + '</div><div class="pw-grid pw-row">' + cards.slice(0, 4).map(card).join('') + '</div>' +
    '<p class="pw-more rv"><a class="btn" href="customers.html">See the full Proof Wall &rarr;</a><small>Past results do not guarantee future results. <a href="risk.html">Risk disclaimer</a></small></p></div>';
  anchor.insertAdjacentElement('afterend', sec);
  reveal(sec); wire(sec);
})();
