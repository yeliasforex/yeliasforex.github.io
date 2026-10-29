/* Customer Proof Wall: full page (customers.html) and a compact strip on the home page. Hidden on the home page until there are real cards. */
(async () => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const full = !!document.getElementById('pwgrid');
  const load = src => new Promise(r => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = r; document.head.appendChild(s); });
  if (!window.gte) await load('app.js?v=20261030pw2');
  if (!window.gte || !gte.client) return;
  let cards = [], tot = null;
  try {
    const c = await gte.client();
    const [a, b] = await Promise.all([c.rpc('proof_wall'), c.rpc('proof_totals')]);
    cards = Array.isArray(a.data) ? a.data : []; tot = b.data || null;
  } catch (e) {}
  const spark = pts => {
    if (!pts || pts.length < 2) return '';
    const w = 160, h = 44, mn = Math.min(0, ...pts), mx = Math.max(0.01, ...pts), sx = w / (pts.length - 1), sy = v => h - 3 - (v - mn) / (mx - mn || 1) * (h - 6);
    const d = pts.map((v, i) => (i ? 'L' : 'M') + (i * sx).toFixed(1) + ' ' + sy(v).toFixed(1)).join('');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="pw-sp" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  };
  const cn = c => { if (!c) return ''; if (/^[A-Za-z]{2}$/.test(c)) { try { return new Intl.DisplayNames(['en'], {type: 'region'}).of(c.toUpperCase()) || c; } catch (e) {} } return c; };
  const sign = v => (v > 0 ? '+' : '') + v;
  const card = x => {
    const ini = esc((x.name || '?').trim().charAt(0).toUpperCase());
    const av = x.photo ? '<span class="pw-av" style="background-image:url(' + esc(x.photo) + ')"></span>' : '<span class="pw-av">' + ini + '</span>';
    return '<article class="pw-card">' +
      '<header>' + av + '<div><b>' + esc(x.name) + '</b><small>' + esc([cn(x.country), 'since ' + x.joined].filter(Boolean).join(' · ')) + '</small></div>' +
      '</header>' +
      '<div class="pw-num"><div class="' + (x.gain_pct >= 0 ? 'up' : 'dn') + '"><b>' + sign(x.gain_pct) + '%</b><small>gain</small></div>' +
      '<div><b>' + esc(x.max_dd_pct) + '%</b><small>max drawdown</small></div>' +
      '<div><b>' + esc(x.trades) + '</b><small>trades</small></div>' +
      '<div><b>' + esc(x.win_rate == null ? '–' : x.win_rate + '%') + '</b><small>win rate</small></div></div>' +
      '<div class="' + (x.gain_pct >= 0 ? 'up' : 'dn') + '">' + spark(x.curve) + '</div>' +
      (x.quote ? '<blockquote>“' + esc(x.quote) + '”</blockquote>' : '') +
      '<footer><span class="pw-ver" title="Calculated from trades reported by this customer\'s own EA">Verified by GTE</span> ' + esc([x.broker, x.size, x.days + ' days live'].filter(Boolean).join(' · ')) + '</footer></article>';
  };
  const totals = () => tot && tot.active ? '<div><b>' + esc(tot.active) + '</b><small>live customer accounts</small></div><div><b>' + esc(tot.trades) + '</b><small>trades tracked</small></div><div><b>' + cards.length + '</b><small>shown here with consent</small></div>' : '';
  if (full) {
    document.getElementById('pwtot').innerHTML = totals();
    document.getElementById('pwgrid').innerHTML = cards.length ? cards.map(card).join('') :
      '<div class="pw-empty"><b>Be among the first to be featured.</b><p>Customers appear here automatically once their real account has 20 closed trades or 30 days of history. Until then, watch our own live account on <a href="index.html#account">the home page</a> or on <a href="https://www.myfxbook.com/portfolio/goldtriengine/12235544" rel="noopener">Myfxbook</a>.</p></div>';
    return;
  }
  if (!cards.length) return;                                    // home page: show nothing until real customers exist
  const anchor = document.querySelector('#gx') || document.querySelector('main');
  if (!anchor) return;
  const sec = document.createElement('section'); sec.className = 'pw-strip';
  sec.innerHTML = '<div class="wrap"><div class="pw-hd"><h2>Customer Proof Wall</h2><a href="customers.html">See all →</a></div><div class="pw-tot">' + totals() + '</div><div class="pw-grid pw-row">' + cards.slice(0, 4).map(card).join('') + '</div><p class="hint">Calculated from trades reported by each customer\'s own EA. Shown with their agreement. Past results do not guarantee future results.</p></div>';
  anchor.insertAdjacentElement('afterend', sec);
})();
