/* GoldTriEngine enhancement layer: hero atmosphere, live numbers strip, plan finder, card glow, stream-card tilt.
   Only real data is shown (the public account feed and the plan list). Nothing here changes any number. */
(function () {
  'use strict';
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia && matchMedia('(pointer: fine)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const usd = (n, d) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d});
  const sgn = n => (n >= 0 ? '+' : '-') + usd(Math.abs(n));
  const ago = d => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const onView = (el, fn) => { if (!('IntersectionObserver' in window)) return fn(); const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, {threshold: .25}); io.observe(el); };
  function countUp(el, to, fmt) {
    if (REDUCED || !isFinite(to)) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1300;
    const step = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------- hero: soft moving light and gold dust ----------
  function atmosphere() {
    const hero = document.querySelector('.hero'); if (!hero || hero.querySelector('.wow-aurora')) return;
    const a = document.createElement('div'); a.className = 'wow-aurora'; a.setAttribute('aria-hidden', 'true'); a.innerHTML = '<i></i><i></i><i></i>'; hero.prepend(a);
    if (REDUCED) return;
    const cv = document.createElement('canvas'); cv.className = 'wow-dust'; cv.setAttribute('aria-hidden', 'true'); hero.prepend(cv);
    const ctx = cv.getContext('2d'); let W = 0, H = 0, run = false, ps = [];
    const size = () => { const r = hero.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height + 68; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const n = innerWidth < 700 ? 26 : 56;
    for (let i = 0; i < n; i++) ps.push({x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.5, v: .02 + Math.random() * .05, a: .15 + Math.random() * .5, gold: Math.random() < .6, ph: Math.random() * 6.28});
    let last = performance.now();
    const loop = now => {
      if (!run) return; const dt = Math.min(50, now - last) / 1000; last = now; ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y -= p.v * dt; p.ph += dt * 1.2; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        const al = p.a * (.6 + .4 * Math.sin(p.ph)); ctx.beginPath(); ctx.arc(p.x * W + Math.sin(p.ph * .5) * 8, p.y * H, p.r, 0, 6.283);
        ctx.fillStyle = p.gold ? `rgba(227,185,95,${al})` : `rgba(120,170,255,${al})`; ctx.fill();
      }
      requestAnimationFrame(loop);
    };
    new IntersectionObserver(es => { const on = es[0].isIntersecting; if (on && !run) { run = true; last = performance.now(); requestAnimationFrame(loop); } else if (!on) run = false; }).observe(hero);
  }

  // ---------- stream card: gentle 3D tilt that follows the pointer ----------
  function tilt() {
    const el = document.querySelector('.stagewrap'); if (!el || REDUCED || !FINE) return;
    el.classList.add('wow-tilt'); const par = el.parentElement; par.style.perspective = '1100px';
    par.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 6).toFixed(2)}deg)`; });
    par.addEventListener('pointerleave', () => { el.style.transform = ''; });
  }

  // ---------- light that follows the cursor on cards ----------
  function glow() {
    if (!FINE) return;
    document.addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest('.plan,.fact,.kpi,.panel,.wow-n'); if (!c) return;
      if (!c.classList.contains('wow-glow')) c.classList.add('wow-glow');
      const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, {passive: true});
  }

  // ---------- live numbers from the public account feed ----------
  function spark(vals) {
    if (vals.length < 2) return '';
    const mn = Math.min(...vals), mx = Math.max(...vals), rg = (mx - mn) || 1, H = 64;
    if (vals.length > 90) { const st = (vals.length - 1) / 89; vals = Array.from({length: 90}, (_, i) => vals[Math.round(i * st)]); }
    const pts = vals.map((v, i) => [i / (vals.length - 1) * 100, 4 + (1 - (v - mn) / rg) * (H - 8)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg class="wow-spark" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="wowsg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3EE09A" stop-opacity=".35"/><stop offset="1" stop-color="#3EE09A" stop-opacity="0"/></linearGradient></defs>
      <g class="wow-line"><path d="${d} L100 ${H} L0 ${H} Z" fill="url(#wowsg)"/><path d="${d}" fill="none" stroke="#3EE09A" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></g></svg>`;
  }
  async function liveStrip() {
    const acct = document.getElementById('account'), band = document.querySelector('.band'); if (!acct || !band || document.querySelector('.wow-live')) return;
    let j; try { const r = await fetch(acct.dataset.src + '?t=' + Math.floor(Date.now() / 60000), {cache: 'no-store'}); if (!r.ok) return; j = await r.json(); } catch (e) { return; }
    const s = j.summary || {}, a = j.account || {}; if (s.balance == null) return;
    const eq = (j.equity_curve || []).map(p => +p[2]).filter(isFinite);
    const net = +s.net_profit || 0, kind = /demo/i.test(a.type || '') ? 'Live demo account' : 'Live account';
    const sec = document.createElement('section'); sec.className = 'wow-live';
    sec.innerHTML = `<div class="wrap"><div class="wow-box">
      <div class="wow-left"><span class="wow-tag"><i></i>${esc(kind)}${a.broker ? ' · ' + esc(a.broker) : ''}</span><h3>The numbers right now</h3><p>Straight from MetaTrader, updated ${j.updated ? esc(ago(j.updated)) : 'every few minutes'}.</p>${spark(eq)}</div>
      <div class="wow-nums">
        <div class="wow-n"><span>Balance</span><b data-v="${s.balance}" data-f="usd">${usd(s.balance)}</b><em>started with ${usd(+s.deposits || 0, 0)}</em></div>
        <div class="wow-n"><span>Net profit</span><b class="${net >= 0 ? 'wow-up' : 'wow-dn'}" data-v="${net}" data-f="sgn">${sgn(net)}</b><em>${s.gain_pct != null ? (s.gain_pct >= 0 ? '+' : '') + s.gain_pct + '% on deposits' : ''}</em></div>
        <div class="wow-n"><span>Win rate</span><b data-v="${s.win_rate}" data-f="pct">${s.win_rate}%</b><em>${s.profit_factor != null ? 'profit factor ' + s.profit_factor : ''}</em></div>
        <div class="wow-n"><span>Closed trades</span><b data-v="${s.trades}" data-f="int">${s.trades}</b><em>${s.max_drawdown_pct != null ? 'max drawdown ' + s.max_drawdown_pct + '%' : ''}</em></div>
      </div></div><p class="fine" style="margin:12px 4px 0;color:var(--muted);font-size:.8rem">${/demo/i.test(a.type || '') ? 'This is a demo account, so no real money is at stake yet. ' : ''}Past results do not guarantee future results. Trading gold carries a high risk of loss.</p></div>`;
    band.after(sec);
    const F = {usd: v => usd(v), sgn: v => sgn(v), pct: v => v.toFixed(1) + '%', int: v => String(Math.round(v))};
    onView(sec, () => sec.querySelectorAll('[data-v]').forEach(el => { const f = F[el.dataset.f], to = +el.dataset.v, end = el.textContent; if (REDUCED) return; countUp(el, to, f); setTimeout(() => { el.textContent = end; }, 1400); }));
  }

  // ---------- plan finder ----------
  async function finder() {
    const host = document.getElementById('homePlans') || document.getElementById('plans'); if (!host || document.querySelector('.wow-finder')) return;
    let plans = null; try { plans = window.gte && gte.plans ? await gte.plans() : null; } catch (e) {}
    plans = (plans && plans.length ? plans : [{id: 'investor', name: 'Investor', limit_usd: 5000, price_usd: 1000}, {id: 'tycoon', name: 'Tycoon', limit_usd: 10000, price_usd: 1900}, {id: 'mogul', name: 'Mogul', limit_usd: 20000, price_usd: 3600}, {id: 'billionaire', name: 'Billionaire', limit_usd: null, price_usd: 5000}])
      .slice().sort((a, b) => (a.limit_usd == null ? 1e12 : a.limit_usd) - (b.limit_usd == null ? 1e12 : b.limit_usd));
    const TOL = 1.05, MIN = 500, MAX = 30000;
    const box = document.createElement('div'); box.className = 'wow-finder';
    box.innerHTML = `<h3>Which plan fits you?</h3><p>Slide to the amount you plan to deposit on your MT5 account. A plan is a deposit limit, with 5% tolerance; profits never count.</p>
      <div class="wow-sl"><input type="range" min="${MIN}" max="${MAX}" step="500" value="5000" aria-label="Amount you plan to deposit in USD"><div class="wow-amt" id="wowAmt"></div>
      <div class="wow-ticks" aria-hidden="true"><span>$500</span><span>$7,500</span><span>$15,000</span><span>$22,500</span><span>$30,000+</span></div>
      <div class="wow-res" id="wowRes"></div></div>`;
    host.before(box);
    const rng = box.querySelector('input'), amt = box.querySelector('#wowAmt'), res = box.querySelector('#wowRes');
    function update() {
      const v = +rng.value; rng.style.setProperty('--p', ((v - MIN) / (MAX - MIN) * 100) + '%');
      amt.textContent = v >= MAX ? '$30,000+' : usd(v, 0);
      const pick = plans.find(p => p.limit_usd == null || v <= p.limit_usd * TOL) || plans[plans.length - 1];
      const price = Number(pick.price_usd), cover = pick.limit_usd == null ? 'any deposit size' : 'deposits up to ' + usd(pick.limit_usd * TOL, 0) + ' with tolerance';
      res.innerHTML = `<span class="wow-pick" key="${esc(pick.id)}"><span>Your plan</span><b>${esc(pick.name)}</b><span>${usd(price, 0)} / year</span></span>
        <span class="wow-day">about <b>${usd(price / 365)}</b> a day · covers ${cover}</span>
        <a class="btn ${'mint'}" href="pricing.html#buy-${esc(pick.id)}" data-pick="${esc(pick.id)}">Choose ${esc(pick.name)}</a>`;
      document.querySelectorAll('.plan').forEach(c => c.classList.toggle('wow-hl', c.id === 'plan-' + pick.id));
      const b = res.querySelector('[data-pick]'); b.onclick = e => { const t = document.querySelector('[data-buy="' + pick.id + '"]'); if (t && document.getElementById('plans')) { e.preventDefault(); t.click(); } };
    }
    rng.addEventListener('input', update); update();
    new MutationObserver(update).observe(host, {childList: true});         // plan cards may be drawn after the finder
  }


  // "My account" in the menu becomes a prominent pill; it shows who is signed in (read from the local session only)
  function acctNav() {
    const links = [...document.querySelectorAll('header .nav a[href="my-account.html"]')]; if (!links.length) return;
    let email = '';
    try {
      const k = Object.keys(localStorage).find(x => /^sb-.*-auth-token$/.test(x));
      if (k) { const s = JSON.parse(localStorage.getItem(k)) || {}, t = s.access_token;
        if (t) { const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); if (p.exp * 1000 > Date.now()) email = p.email || (s.user && s.user.email) || 'you'; } }
    } catch (e) {}
    const user = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4 3.5-6 7.5-6s6.9 2 7.5 6"/></svg>';
    links.forEach(a => {
      a.classList.add('acct-pill');
      a.innerHTML = '<span class="ap-av">' + (email ? String(email).charAt(0).toUpperCase().replace(/[<>&]/g, '') : user) + '</span><span class="ap-t">My account</span>' + (email ? '<i class="ap-dot" aria-hidden="true"></i>' : '');
      a.title = email ? 'Signed in as ' + email : 'Sign in or create your free account';
    });
  }

  const start = () => { try { acctNav(); atmosphere(); tilt(); glow(); liveStrip(); finder(); } catch (e) { console.error('wow', e); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
