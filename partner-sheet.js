/* Partner dashboard: tap any tile, chart, bar, row or badge and see the real records behind it
   (customers by first name, commission entries, days, links, payouts) in a side sheet, like My account.
   It only uses what the dashboard already receives for this partner. Customers are shown by first name only. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var usd = function (n, d) { n = Number(n || 0); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', {maximumFractionDigits: d == null ? 2 : d}); };
  var num = function (n) { return Number(n || 0).toLocaleString('en-US'); };
  var pct = function (a, b) { return b > 0 ? Math.round(a / b * 1000) / 10 : 0; };
  function S() { return window.GTE_PD || null; }
  function day(d) { return new Date(d).toISOString().slice(0, 10); }
  function dayName(k) { return new Date(k + 'T12:00:00Z').toLocaleDateString([], {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}); }
  function from() { var s = S(); return Date.now() - (s.days || 30) * 864e5; }
  var TZ = {'Asia/Dhaka': 'Bangladesh', 'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India', 'Asia/Dubai': 'UAE', 'Asia/Kuala_Lumpur': 'Malaysia', 'Asia/Karachi': 'Pakistan', 'Asia/Riyadh': 'Saudi Arabia', 'Asia/Singapore': 'Singapore', 'Asia/Jakarta': 'Indonesia'};
  function place(tz) { return !tz || tz === 'unknown' ? 'Unknown' : TZ[tz] || String(tz).split('/').pop().replace(/_/g, ' '); }
  function hourName(h) { return (h % 12 || 12) + (h < 12 ? ' AM' : ' PM'); }

  /* ---- sheet shell ---- */
  var stack = [], cur = null, flt = 'all';
  function ensure() {
    var g = $('#ps'); if (g) return g;
    g = document.createElement('div'); g.id = 'ps'; g.className = 'ps';
    g.innerHTML = '<div class="ps-bk"></div><aside class="ps-p" role="dialog" aria-modal="true" aria-label="Details" tabindex="-1"><div class="ps-grab"></div><header class="ps-h"><button type="button" class="ps-back" aria-label="Back" hidden>&#8249;</button><div class="ps-ht"><h3 id="ps-t"></h3><p id="ps-s"></p></div><button type="button" class="ps-x" aria-label="Close">&times;</button></header><div class="ps-sum" id="ps-sum"></div><div class="ps-f" id="ps-f"></div><div class="ps-b" id="ps-b"></div><footer class="ps-ft" id="ps-ft"></footer></aside>';
    ($('.pd') || document.body).appendChild(g); $('.ps-bk', g).onclick = close; $('.ps-x', g).onclick = close; $('.ps-back', g).onclick = back;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#ps.on')) { e.stopImmediatePropagation(); close(); } }, true);
    return g;
  }
  function open(spec) { stack = []; show(spec, true); }
  function push(spec) { if (cur) stack.push(cur); show(spec, false); }
  function back() { var s = stack.pop(); if (s) show(s, false); }
  function close() { var g = $('#ps'); if (!g) return; g.classList.remove('on'); document.body.classList.remove('ps-lock'); stack = []; cur = null; }
  function show(spec, first) {
    var g = ensure(); cur = spec; flt = spec.flt || 'all'; $('#ps-t').textContent = spec.title || 'Details'; $('#ps-s').textContent = spec.sub || ''; $('.ps-back', g).hidden = !stack.length;
    render(); g.classList.add('on'); document.body.classList.add('ps-lock'); var b = $('#ps-b'); if (b) b.scrollTop = 0; if (first) $('.ps-p', g).focus({preventScroll: true});
  }

  /* ---- record cards ---- */
  var STAGE = {paid: ['Paid', 'g'], 'signed up': ['Signed up', 'c'], refunded: ['Refunded', 'r']};
  function custCard(c, big) {
    var st = STAGE[c.stage] || [c.stage, 'c'], nm = c.first_name || 'Customer ' + c.customer;
    return '<div class="ps-r' + (big ? ' big' : '') + '"' + (big ? '' : ' data-pcust="' + esc(c.customer) + '" role="button" tabindex="0"') + '><div class="ps-av">' + esc((nm.replace(/^Customer\s*/, '#').charAt(0) || '#').toUpperCase()) + '</div><div class="ps-rb"><b>' + esc(nm) + '</b><small>' + esc(c.plan || (c.stage === 'signed up' ? 'Signed up, not bought yet' : '-')) + ' &middot; joined ' + day(c.joined) + (c.campaign ? ' &middot; ' + esc(c.campaign) : '') + '</small></div><div class="ps-rr"><span class="ps-pill ' + st[1] + '">' + st[0] + '</span>' + (Number(c.earned) ? '<b class="ps-amt">+' + usd(c.earned, 0) + '</b>' : '') + '</div></div>';
  }
  var KIND = {commission: 'Commission', renewal: 'Renewal commission', clawback: 'Refund correction', bonus: 'Level bonus'};
  function ledCard(l) {
    var amt = Number(l.amount), rel = l.release_at ? Math.ceil((new Date(l.release_at) - Date.now()) / 864e5) : null, sm = {pending: ['On hold', 'a'], settled: ['Ready', 'g'], reserved: ['In a payout', 'c'], cancelled: ['Cancelled', 'r']}[l.status] || [l.status, 'c'];
    return '<div class="ps-r"><div class="ps-av ' + (amt < 0 ? 'neg' : 'pos') + '">' + (amt < 0 ? '&minus;' : '+') + '</div><div class="ps-rb"><b>' + esc(KIND[l.entry_kind] || l.entry_kind) + (l.plan ? ' &middot; ' + esc(l.plan) : '') + '</b><small>' + day(l.created_at) + (l.status === 'pending' && rel != null ? ' &middot; ' + (rel > 0 ? 'ready in ' + rel + ' day' + (rel === 1 ? '' : 's') : 'ready soon') : '') + '</small></div><div class="ps-rr"><span class="ps-pill ' + sm[1] + '">' + sm[0] + '</span><b class="ps-amt" style="color:' + (amt < 0 ? 'var(--red)' : 'var(--green)') + '">' + (amt < 0 ? '-' : '+') + usd(Math.abs(amt), 2) + '</b></div></div>';
  }
  function payCard(p) {
    var sm = {paid: ['Paid', 'g'], requested: ['Asked for', 'a'], cancelled: ['Cancelled', 'r']}[p.status] || [p.status, 'c'];
    return '<div class="ps-r"><div class="ps-av pos">$</div><div class="ps-rb"><b>' + usd(p.amount, 2) + ' &middot; ' + esc(p.network) + '</b><small>asked ' + day(p.requested_at) + (p.paid_at ? ' &middot; sent ' + day(p.paid_at) : '') + (p.wallet_end ? ' &middot; wallet ...' + esc(p.wallet_end) : '') + (p.tx_hash ? '<br>Transaction ' + esc(p.tx_hash) : '') + '</small></div><div class="ps-rr"><span class="ps-pill ' + sm[1] + '">' + sm[0] + '</span></div></div>';
  }
  function dayRow(d) {
    return '<button type="button" class="ps-d" data-pday="' + d.day + '"><span class="ps-dn">' + dayName(d.day) + '<small>' + esc(d.sub || '') + '</small></span><span class="ps-bar"><i style="width:' + Math.max(3, d.w) + '%"></i></span><b>' + esc(d.val) + '</b><i class="ps-ch">&rsaquo;</i></button>';
  }
  function rowBtn(label, sub, val, attr, w, col) {
    return '<button type="button" class="ps-d" ' + attr + '><span class="ps-dn">' + esc(label) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><span class="ps-bar"><i style="width:' + Math.max(3, w || 0) + '%;' + (col ? 'background:' + col : '') + '"></i></span><b>' + esc(val) + '</b><i class="ps-ch">&rsaquo;</i></button>';
  }
  function chips(arr) { return arr.map(function (c) { return '<div class="ps-c"><small>' + esc(c[0]) + '</small><b' + (c[2] ? ' style="color:' + c[2] + '"' : '') + '>' + esc(c[1]) + '</b></div>'; }).join(''); }
  function section(t, html) { return html ? '<h4 class="ps-sh">' + esc(t) + '</h4>' + html : ''; }
  function tip(t) { return '<p class="ps-tip">' + esc(t) + '</p>'; }
  function btn(label, attr) { return '<button type="button" class="ps-more" ' + attr + '>' + esc(label) + '</button>'; }

  function render() {
    var s = cur, b = $('#ps-b'), sum = $('#ps-sum'), f = $('#ps-f'), ft = $('#ps-ft'); f.innerHTML = ''; ft.innerHTML = '';
    sum.innerHTML = s.chips ? chips(s.chips) : '';
    if (s.filters) f.innerHTML = '<div class="ps-seg">' + s.filters.map(function (x) { return '<button type="button" data-pf="' + x[0] + '" class="' + (flt === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    b.innerHTML = typeof s.body === 'function' ? s.body(flt) : (s.body || '');
    wire();
    if (s.csv) { ft.innerHTML = '<button type="button" class="ps-btn" id="ps-csv">Download CSV</button>'; $('#ps-csv').onclick = s.csv; }
  }
  function wire() {
    $$('#ps-f [data-pf]').forEach(function (b) { b.onclick = function () { flt = b.dataset.pf; render(); }; });
    $$('#ps-b [data-pday]').forEach(function (b) { b.onclick = function () { push(daySpec(b.dataset.pday)); }; });
    $$('#ps-b [data-pcust]').forEach(function (b) { var f = function () { var c = findCust(b.dataset.pcust); if (c) push(custSpec(c)); }; b.onclick = f; b.onkeydown = function (e) { if (e.key === 'Enter') f(); }; });
    $$('#ps-b [data-ps]').forEach(function (b) { b.onclick = function () { var sp = spec(b.dataset.ps); if (sp) push(sp); }; });
    $$('#ps-b [data-pgo]').forEach(function (b) { b.onclick = function () { close(); var t = $('#pd-bar button[data-t="' + b.dataset.pgo + '"]'); if (t) t.click(); }; });
    $$('#ps-b [data-pcopy]').forEach(function (b) { b.onclick = function () { try { navigator.clipboard.writeText(b.dataset.pcopy); b.textContent = 'Copied'; } catch (e) {} }; });
  }

  /* ---- data helpers ---- */
  function allCusts() { var s = S(); return s.allCusts || s.custs || []; }
  function findCust(id) { var a = allCusts(); for (var i = 0; i < a.length; i++) if (a[i].customer === id) return a[i]; return null; }
  function inPeriod(d) { return new Date(d).getTime() >= from(); }
  function seriesBy(k) { return (S().stats.series || []).map(function (x) { return {day: String(x.day).slice(0, 10), v: Number(x[k] || 0)}; }); }
  function custList(list, empty) { return list.length ? list.map(function (c) { return custCard(c); }).join('') : '<div class="ps-empty">' + esc(empty || 'Nobody here yet.') + '</div>'; }

  /* ---- specs ---- */
  function daySpec(k) {
    var s = S(), ser = (s.stats.series || []).filter(function (x) { return String(x.day).slice(0, 10) === k; })[0] || {}, rep = ((s.report && s.report.rows) || []).filter(function (r) { return String(r.day).slice(0, 10) === k; })[0] || {};
    var cs = allCusts(), joined = cs.filter(function (c) { return day(c.joined) === k; }), sold = cs.filter(function (c) { return c.paid_at && day(c.paid_at) === k && c.stage === 'paid'; }), led = (s.ledger || []).filter(function (l) { return day(l.created_at) === k; });
    var earned = rep.commission != null ? Number(rep.commission) : Number(ser.earned || 0), clicks = rep.clicks != null ? Number(rep.clicks) : Number(ser.clicks || 0);
    return {title: dayName(k), sub: earned > 0 ? 'A day with ' + usd(earned) + ' of commission' : 'A day with no commission', chips: [['Clicks', num(clicks)], ['Sign-ups', num(rep.signups != null ? rep.signups : joined.length)], ['Paid', num(rep.paid != null ? rep.paid : sold.length)], ['Commission', usd(earned), earned > 0 ? 'var(--green)' : earned < 0 ? 'var(--red)' : ''], ['Share of period', pct(earned, seriesBy('earned').reduce(function (a, x) { return a + x.v; }, 0)) + '%']],
      body: function () { return section('Sales that day', sold.length ? custList(sold) : '') + section('New sign-ups', joined.length ? custList(joined) : '') + section('Commission entries', led.length ? led.map(ledCard).join('') : '') + (!sold.length && !joined.length && !led.length ? '<div class="ps-empty">' + (clicks ? num(clicks) + ' people opened your link, but nobody signed up or bought on this day.' : 'No activity on this day.') + '</div>' + tip('Quiet days are normal. Posting at your best hours and one link per post helps.') : '') + btn('Open the daily report', 'data-pgo="reports"'); }};
  }
  function clicksSpec() {
    var s = S(), c = s.stats.cur, p = s.stats.prev, ser = seriesBy('clicks'), best = ser.slice().sort(function (a, b) { return b.v - a.v; })[0] || {v: 0}, mx = Math.max(1, best.v), d = p.clicks > 0 ? Math.round((c.clicks - p.clicks) / p.clicks * 100) : null;
    return {title: 'Clicks', sub: 'People who opened your link in the last ' + s.days + ' days.', chips: [['Clicks', num(c.clicks)], ['Before', num(p.clicks)], ['Change', d == null ? '-' : (d >= 0 ? '+' : '') + d + '%', d == null ? '' : d >= 0 ? 'var(--green)' : 'var(--red)'], ['Per day', num(Math.round(c.clicks / (s.days || 30)))], ['Best day', num(best.v)]],
      body: function () { return section('Days, busiest first', ser.slice().sort(function (a, b) { return b.v - a.v; }).slice(0, 15).map(function (x) { return dayRow({day: x.day, w: x.v / mx * 100, val: num(x.v) + ' clicks'}); }).join('')) + section('By link', (s.camps || []).map(function (k, i) { return rowBtn(k.label || k.slug || 'Main link', pct(k.paid, k.clicks) + '% click to sale', num(k.clicks), 'data-ps="camp:' + i + '"', k.clicks / Math.max(1, (s.camps[0] || {}).clicks) * 100); }).join('')) + tip('More clicks come from posting at your best hours, adding your link to every video description and making one link per post.'); }};
  }
  function signupsSpec() { var s = S(), c = s.stats.cur, l = allCusts().filter(function (x) { return inPeriod(x.joined); }); return {title: 'Sign-ups', sub: 'People who created an account from your link in the last ' + s.days + ' days.', chips: [['Sign-ups', num(c.signups)], ['Of clicks', pct(c.signups, c.clicks) + '%'], ['Bought', num(l.filter(function (x) { return x.stage === 'paid'; }).length)], ['Not yet', num(l.filter(function (x) { return x.stage === 'signed up'; }).length)]], flt: 'all', filters: [['all', 'All'], ['paid', 'Bought'], ['signed up', 'Not yet']], body: function (f) { return custList(l.filter(function (x) { return f === 'all' || x.stage === f; }), 'Nobody signed up in this period yet.') + tip('To turn sign-ups into sales, mention your fan discount and answer questions in the comments.'); }}; }
  function paidSpec() { var s = S(), c = s.stats.cur, l = allCusts().filter(function (x) { return x.stage === 'paid' && x.paid_at && inPeriod(x.paid_at); }).sort(function (a, b) { return new Date(b.paid_at) - new Date(a.paid_at); }); return {title: 'Paid sales', sub: 'Customers who bought through your link in the last ' + s.days + ' days.', chips: [['Sales', num(c.paid)], ['Of sign-ups', pct(c.paid, c.signups) + '%'], ['Commission', usd(c.earned), 'var(--green)'], ['Average', usd(c.paid ? c.earned / c.paid : 0, 0)]], body: function () { return custList(l, 'No sales in this period yet.'); }}; }
  function earnedSpec() { var s = S(), c = s.stats.cur, l = (s.ledger || []).filter(function (x) { return inPeriod(x.created_at); }); return {title: 'Commission earned', sub: 'Every commission entry of the last ' + s.days + ' days.', chips: [['Earned', usd(c.earned), 'var(--green)'], ['Before', usd(s.stats.prev.earned)], ['Entries', num(l.length)], ['On hold', usd(s.stats.balances.hold, 0), 'var(--amber)']], body: function () { return (l.length ? l.map(ledCard).join('') : '<div class="ps-empty">No commission entries in this period.</div>') + tip('A commission waits out the refund period, then becomes ready to pay out.'); }}; }
  function convSpec() { var s = S(), c = s.stats.cur; return {title: 'Click to sale', sub: 'Out of every 100 clicks, how many become buyers.', chips: [['Click to sale', pct(c.paid, c.clicks) + '%'], ['Clicks', num(c.clicks)], ['Sign-ups', num(c.signups)], ['Sales', num(c.paid)]], body: function () { return rowBtn('Clicks', 'Everyone who opened your link', num(c.clicks), 'data-ps="clicks"', 100, 'var(--cyan)') + rowBtn('Sign-ups', pct(c.signups, c.clicks) + '% of clicks', num(c.signups), 'data-ps="signups"', Math.max(4, pct(c.signups, c.clicks)), 'var(--vio)') + rowBtn('Sales', pct(c.paid, c.signups) + '% of sign-ups', num(c.paid), 'data-ps="paid"', Math.max(4, pct(c.paid, c.clicks)), 'var(--green)') + tip('Most partners see 1 to 3 sales per 100 clicks. Send fans to your personal landing page and put the discount code in the first line.'); }}; }
  function avgSpec() { var s = S(), l = allCusts().filter(function (x) { return x.stage === 'paid'; }).sort(function (a, b) { return Number(b.earned) - Number(a.earned); }), e = l.map(function (x) { return Number(x.earned); }); return {title: 'Average per sale', sub: 'What one sale earns you on average.', chips: [['Average', usd(e.length ? e.reduce(function (a, b) { return a + b; }, 0) / e.length : 0, 0)], ['Best sale', usd(e[0] || 0, 0), 'var(--green)'], ['Smallest', usd(e.length ? e[e.length - 1] : 0, 0)], ['Sales', num(e.length)]], body: function () { return custList(l, 'No sales yet.'); }}; }
  function lifeSpec() { var s = S(), B = s.stats.balances, l = s.ledger || []; return {title: 'Lifetime earnings', sub: 'Everything you earned so far.', chips: [['Lifetime', usd(B.lifetime, 0), 'var(--green)'], ['Paid out', usd(B.paidOut, 0)], ['Ready', usd(B.ready, 0), 'var(--green)'], ['On hold', usd(B.hold, 0), 'var(--amber)']], body: function () { return (l.length ? l.map(ledCard).join('') : '<div class="ps-empty">No entries yet.</div>') + btn('Open payouts', 'data-pgo="payouts"'); }}; }
  function paidoutSpec() { var s = S(); return {title: 'Paid out', sub: 'Money already sent to your wallet.', chips: [['Paid out', usd(s.stats.balances.paidOut, 0), 'var(--green)'], ['Payouts', num((s.payouts || []).filter(function (p) { return p.status === 'paid'; }).length)]], body: function () { var l = (s.payouts || []).filter(function (p) { return p.status === 'paid'; }); return l.length ? l.map(payCard).join('') : '<div class="ps-empty">No payouts sent yet.</div>'; }}; }
  function balSpec(k) {
    var s = S(), B = s.stats.balances, led = s.ledger || [];
    if (k === 'hold') return {title: 'On hold', sub: 'Commission waiting out the ' + s.me.holdDays + '-day refund period.', chips: [['On hold', usd(B.hold, 0), 'var(--amber)'], ['Next release', B.nextRelease ? day(B.nextRelease) : '-']], body: function () { var l = led.filter(function (x) { return x.status === 'pending' && Number(x.amount) > 0; }); return (l.length ? l.map(ledCard).join('') : '<div class="ps-empty">Nothing on hold.</div>') + tip('If a customer asks for a refund inside the period, that commission is cancelled. After the period it is yours.'); }};
    if (k === 'ready') return {title: 'Ready to pay out', sub: 'Past the refund period. You can ask for it.', chips: [['Ready', usd(B.ready, 0), 'var(--green)'], ['Minimum', usd(s.me.minPayout, 0)]], body: function () { var l = led.filter(function (x) { return x.status === 'settled'; }); return (l.length ? l.map(ledCard).join('') : '<div class="ps-empty">Nothing ready yet.</div>') + btn('Open payouts', 'data-pgo="payouts"'); }};
    if (k === 'requested') return {title: 'Asked for', sub: 'Payouts waiting to be sent.', chips: [['Asked for', usd(B.requested, 0), 'var(--cyan)']], body: function () { var l = (s.payouts || []).filter(function (p) { return p.status === 'requested'; }); return l.length ? l.map(payCard).join('') : '<div class="ps-empty">No payout is waiting.</div>'; }};
    return paidoutSpec();
  }
  function hourSpec(h) {
    var hrs = S().stats.hours || [], tot = hrs.reduce(function (a, b) { return a + b; }, 0), mx = Math.max.apply(null, hrs.concat([1])), rank = hrs.map(function (n, i) { return {i: i, n: n}; }).sort(function (a, b) { return b.n - a.n; });
    return {title: String(h).padStart(2, '0') + ':00 to ' + String(h).padStart(2, '0') + ':59', sub: 'Clicks that arrived in this hour (your local time).', chips: [['Clicks', num(hrs[h])], ['Share', pct(hrs[h], tot) + '%'], ['Rank', '#' + (rank.findIndex(function (x) { return x.i === h; }) + 1) + ' of 24']], body: function () { return section('Your busiest hours', rank.slice(0, 8).map(function (x) { return rowBtn(hourName(x.i), String(x.i).padStart(2, '0') + ':00', num(x.n) + ' clicks', 'data-ps="hour:' + x.i + '"', x.n / mx * 100); }).join('')) + tip('Post 15 to 30 minutes before your best hour so the post is fresh when your fans are online.'); }};
  }
  function zoneSpec(i) {
    var zs = S().stats.zones || [], z = zs[i], tot = zs.reduce(function (a, x) { return a + x.n; }, 0), mx = zs[0] ? zs[0].n : 1; if (!z) return null;
    return {title: place(z.tz), sub: 'Estimated from the visitor’s time zone, so it is approximate.', chips: [['Clicks', num(z.n)], ['Share', pct(z.n, tot) + '%'], ['Rank', '#' + (i + 1)], ['Time zone', z.tz]], body: function () { return section('All places', zs.map(function (x, j) { return rowBtn(place(x.tz), x.tz, num(x.n), 'data-ps="zone:' + j + '"', x.n / mx * 100, 'linear-gradient(90deg,var(--cyan),var(--vio))'); }).join('')) + tip('Write captions in the language of your biggest place. The marketing kit has four languages.'); }};
  }
  function deviceSpec(k) {
    var dv = S().stats.devices || {}, ks = Object.keys(dv), tot = ks.reduce(function (a, x) { return a + dv[x]; }, 0);
    return {title: k[0].toUpperCase() + k.slice(1), sub: 'Which devices open your link.', chips: [['Clicks', num(dv[k])], ['Share', pct(dv[k], tot) + '%']], body: function () { return section('All devices', ks.map(function (x) { return rowBtn(x[0].toUpperCase() + x.slice(1), '', pct(dv[x], tot) + '%', 'data-ps="device:' + x + '"', dv[x] / Math.max(1, tot) * 100); }).join('')) + tip(k === 'mobile' ? 'Most fans are on phones. Keep your message short and test your landing page on a phone.' : 'Open your link on this device type once to check that it looks right.'); }};
  }
  function planSpec(i) {
    var pl = (S().stats.plans || [])[i]; if (!pl) return null; var tot = (S().stats.plans || []).reduce(function (a, x) { return a + x.n; }, 0), l = allCusts().filter(function (c) { return c.stage === 'paid' && c.plan === pl.plan; });
    return {title: pl.plan, sub: 'Paid sales of this plan in the period.', chips: [['Sales', num(pl.n)], ['Share', pct(pl.n, tot) + '%'], ['Commission', usd(l.reduce(function (a, c) { return a + Number(c.earned); }, 0), 0), 'var(--green)']], body: function () { return custList(l, 'The customers who bought this plan appear here.'); }};
  }
  function campSpec(i) {
    var s = S(), k = (s.camps || [])[i]; if (!k) return null; var lk = 'https://goldtriengine.com/p/?ref=' + s.me.code + (k.slug ? '&c=' + k.slug : ''), l = allCusts().filter(function (c) { return (c.campaign || '') === (k.slug || ''); });
    return {title: k.label || k.slug || 'Main link', sub: 'Everything about this link.', chips: [['Clicks', num(k.clicks)], ['Sign-ups', num(k.signups)], ['Paid', num(k.paid)], ['Click to sale', pct(k.paid, k.clicks) + '%'], ['Earned', usd(k.earned, 0), 'var(--green)']], body: function () { return '<div class="ps-link">' + esc(lk) + '</div><button type="button" class="ps-btn" data-pcopy="' + esc(lk) + '">Copy link</button>' + section('Customers from this link', custList(l, 'Nobody has signed up from this link yet.')); }};
  }
  function custSpec(c) {
    var nm = c.first_name || 'Customer ' + c.customer, steps = [['Signed up', c.joined, true], ['Payment confirmed', c.paid_at, !!c.paid_at && c.stage !== 'signed up'], ['Refunded', c.stage === 'refunded' ? (c.paid_at || c.joined) : null, c.stage === 'refunded']];
    return {title: nm, sub: 'Only the first name is shared with partners, never the surname, email or payment details.', chips: [['Stage', (STAGE[c.stage] || [c.stage])[0]], ['Plan', c.plan || '-'], ['You earned', usd(c.earned, 0), Number(c.earned) ? 'var(--green)' : '']], body: function () { return custCard(c, true) + '<div class="ps-tl">' + steps.filter(function (x) { return x[2] && x[1]; }).map(function (x) { return '<div><i></i><b>' + x[0] + '</b><small>' + day(x[1]) + '</small></div>'; }).join('') + '</div>' + (c.campaign ? '<p class="ps-tip">Came from your link <b>' + esc(c.campaign) + '</b>.</p>' : '') + tip('Please treat customers with respect: never contact them about their account or payments, and never share their names.'); }};
  }
  function badgeSpec(k) {
    var s = S(), me = s.me, B = s.stats.balances, sales = Number(me.paidReferrals || 0), life = Number(B.lifetime || 0), gold = Number(me.goldAt || 10);
    var M = {first: ['First sale', sales, 1, 'sales'], five: ['5 sales', sales, 5, 'sales'], c100: ['$100 earned', life, 100, '$'], c500: ['$500 earned', life, 500, '$'], pay: ['First payout', Number(B.paidOut || 0), 0.01, '$']}[k]; if (!M) return null;
    var done = M[1] >= M[2];
    return {title: M[0], sub: done ? 'Unlocked. Well done.' : 'Not unlocked yet.', chips: [['Progress', Math.min(100, Math.round(M[1] / M[2] * 100)) + '%'], ['You have', M[3] === '$' ? usd(M[1], 0) : num(M[1])], ['Needed', M[3] === '$' ? usd(M[2], 0) : num(M[2])]], body: function () { return (done ? '<div class="ps-empty">You unlocked this achievement.</div>' : '<div class="ps-empty">' + (M[3] === '$' ? usd(M[2] - M[1], 0) + ' more to go.' : num(M[2] - M[1]) + ' more sale' + (M[2] - M[1] === 1 ? '' : 's') + ' to go.') + '</div>') + tip('At ' + gold + ' paid sales you reach Gold level and earn a higher rate on every sale.') + btn('See your customers', 'data-pgo="customers"'); }};
  }
  function insSpec(k) {
    if (k === 'hour') { var hrs = S().stats.hours || [], mx = Math.max.apply(null, hrs.concat([0])); return hourSpec(hrs.indexOf(mx)); }
    if (k === 'wd') { var ser = (S().stats.series || []), wd = [0, 0, 0, 0, 0, 0, 0], names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; ser.forEach(function (x) { var d = new Date(String(x.day).slice(0, 10) + 'T12:00:00Z'); wd[d.getUTCDay()] += Number(x.clicks || 0); }); var m = Math.max.apply(null, wd.concat([1]));
      return {title: 'Clicks by weekday', sub: 'The last ' + S().days + ' days added up per weekday.', chips: [['Strongest', names[wd.indexOf(Math.max.apply(null, wd))]]], body: function () { return wd.map(function (v, i) { return rowBtn(names[i], '', num(v) + ' clicks', '', v / m * 100); }).join('') + tip('Plan your best post for your strongest weekday.'); }}; }
    if (k === 'conv') return convSpec();
    return null;
  }
  function planCalc() { var p = $('#pdx-p'), conv = p && +p.dataset.conv, avg = p && +p.dataset.avg; if (!p || !conv) return null; var sl = $('#pdx-sl'), c = sl ? +sl.value : 0; return {title: 'How the planner works', sub: 'Your own numbers, nothing guessed.', chips: [['Click to sale', (conv * 100).toFixed(1) + '%'], ['Per sale', usd(avg, 2)], ['Clicks / month', num(c)]], body: function () { return '<div class="ps-empty">' + num(c) + ' clicks &times; ' + (conv * 100).toFixed(1) + '% = ' + (Math.round(c * conv * 10) / 10) + ' sales<br>' + (Math.round(c * conv * 10) / 10) + ' sales &times; ' + usd(avg, 2) + ' = <b>' + usd(c * conv * avg, 0) + '</b> per month</div>' + tip('It is an estimate from your last ' + S().days + ' days. Results vary and nothing is guaranteed.'); }}; }
  function readySpec() { return balSpec('ready'); }
  function spec(key) {
    var p = String(key).split(':'), k = p[0];
    switch (k) {
      case 'clicks': return clicksSpec(); case 'signups': return signupsSpec(); case 'paid': return paidSpec(); case 'earned': return earnedSpec(); case 'conv': return convSpec(); case 'avg': return avgSpec(); case 'life': return lifeSpec(); case 'paidout': return paidoutSpec();
      case 'bal': return balSpec(p[1]); case 'ready': return readySpec(); case 'day': return daySpec(p[1]); case 'hour': return hourSpec(+p[1]); case 'zone': return zoneSpec(+p[1]); case 'device': return deviceSpec(p[1]); case 'plan': return planSpec(+p[1]); case 'camp': return campSpec(+p[1]);
      case 'badge': return badgeSpec(p[1]); case 'ins': return insSpec(p[1]); case 'calc': return planCalc(); case 'funnel': return [clicksSpec, signupsSpec, paidSpec][+p[1]]();
    }
    return null;
  }

  /* ---- who opens what (capture phase, so the older plain sheets give way to these) ---- */
  function chartIndex(ev) { var svg = $('#pd-ech'), days = (S().stats.series || []).length, r = svg.getBoundingClientRect(), W = 520, l = 40, cx = ev.clientX - r.left; return Math.max(0, Math.min(days - 1, Math.round(((cx / r.width * W) - l) / (W - l - 8) * (days - 1)))); }
  function resolve(ev) {
    var t = ev.target; if (!t.closest) return null; if (t.closest('#ps')) return null;
    var e;
    if ((e = t.closest('[data-ps]')) && !e.closest('#ps')) return spec(e.dataset.ps);
    if (t.closest('#pd-hit')) { var i = chartIndex(ev), x = (S().stats.series || [])[i]; return x ? daySpec(String(x.day).slice(0, 10)) : null; }
    if ((e = t.closest('#pd-kpis .pd-kpi[data-k],#pd-kpis2 .pd-kpi[data-k]'))) return spec(e.dataset.k);
    if ((e = t.closest('#pd-payouts .pd-kpi[data-b]'))) return balSpec(e.dataset.b);
    if ((e = t.closest('#pd-hr .pd-hb'))) return hourSpec(+e.dataset.h);
    if ((e = t.closest('#pd-cn .pd-fun'))) return zoneSpec(+e.dataset.i);
    if ((e = t.closest('#pd-dn circle[data-k],#pd-dl [data-k]'))) return deviceSpec(e.dataset.k);
    if ((e = t.closest('#pd-pl .pd-fun'))) return planSpec(+e.dataset.i);
    if ((e = t.closest('#pd-fun .pd-fun'))) return spec('funnel:' + e.dataset.i);
    if ((e = t.closest('#pd-campaigns tr.pd-tr'))) return campSpec(+e.dataset.i);
    if ((e = t.closest('#pd-reports tr.pd-tr'))) { var row = ((S().report && S().report.rows) || [])[+e.dataset.i]; return row ? daySpec(String(row.day).slice(0, 10)) : null; }
    if ((e = t.closest('#pd-customers .pd-item[data-i]'))) { var c = (S().custs || [])[+e.dataset.i]; return c ? custSpec(c) : null; }
    if ((e = t.closest('#pd-feed .pd-it[data-i]'))) return null;
    return null;
  }
  function onTap(ev) {
    if (!S() || !S().stats) return;
    var pre; try { pre = resolve(ev); } catch (x) { pre = null; }
    if (!pre) return; ev.stopImmediatePropagation(); ev.preventDefault();
    prep().then(function () { var sp; try { sp = resolve(ev); } catch (x) { sp = null; } open(sp || pre); });
  }
  var prepped = false;
  function prep() {
    var s = S(); if (prepped || !window.GTE_PD_API) return Promise.resolve();
    return window.GTE_PD_API('partner_customers', {p_limit: 200, p_filter: 'latest'}).then(function (r) { s.allCusts = r || s.custs; prepped = true; }, function () { prepped = true; });
  }
  document.addEventListener('click', onTap, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('[role=button],tr.pd-tr') && !e.target.closest('#ps')) onTap(e); }, true);
  window.gtePdSheet = {open: open, spec: spec};
})();
