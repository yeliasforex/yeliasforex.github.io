/* Partner dashboard. Everything on the page can be tapped for details. Add ?demo=1 to the address to see it with sample data. */
(function () {
  'use strict';
  var DEMO = new URLSearchParams(location.search).has('demo');
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return gte.esc(s); };
  var usd = function (n, d) { n = Number(n || 0); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); };
  var num = function (n) { return Number(n || 0).toLocaleString('en-US'); };
  var pct = function (a, b) { return b > 0 ? Math.round(a / b * 1000) / 10 : 0; };
  var ORIGIN = 'https://goldtriengine.com';
  var S = { me: null, stats: null, camps: [], custs: [], ledger: [], payouts: [], days: 30, compare: false, tab: 'overview', cfilter: 'latest', report: null, plans: [] };
  var tzo = -new Date().getTimezoneOffset();

  // ---------- data ----------
  async function api(fn, args) {
    if (DEMO) return demo(fn, args || {});
    var c = await gte.client(), r = await c.rpc(fn, args || {});
    if (r.error) throw r.error; return r.data;
  }
  function toast(t, bad) {
    var d = document.createElement('div'); d.className = 'pd-toast on'; d.setAttribute('role', 'status'); if (bad) d.style.borderColor = 'var(--red)', d.style.color = 'var(--red)';
    d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.classList.remove('on'); setTimeout(function () { d.remove(); }, 400); }, 2400);
  }
  async function copy(t, label) { try { await navigator.clipboard.writeText(t); toast((label || 'Copied')); } catch (e) { toast('Could not copy. Select it and copy by hand.', true); } }
  var col = function (n) { return getComputedStyle($('.pd')).getPropertyValue(n).trim() || '#3CD2FF'; };
  var linkOf = function (camp) { return ORIGIN + '/p/?ref=' + S.me.code + (camp ? '&c=' + camp : ''); };

  // ---------- details sheet ----------
  function sheet(title, help, rows, extra) {
    var bg = $('.pd-sheetbg'), sh = $('.pd-sheet');
    sh.innerHTML = '<button class="pd-x" aria-label="Close">&times;</button><h3>' + esc(title) + '</h3>' + (help ? '<div class="pd-help">' + help + '</div>' : '')
      + (rows || []).map(function (r) { return '<div class="pd-kv"><span>' + esc(r[0]) + '</span><b>' + (r[2] ? r[1] : esc(r[1])) + '</b></div>'; }).join('') + (extra || '');
    bg.classList.add('on'); sh.classList.add('on'); sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', title);
    $('.pd-x', sh).onclick = closeSheet; $('.pd-x', sh).focus(); return sh;
  }
  function closeSheet() { $('.pd-sheetbg').classList.remove('on'); $('.pd-sheet').classList.remove('on'); }
  function go(tab, filter) { closeSheet(); if (filter) { S.cfilter = filter; loadCusts().then(renderCustomers); } setTab(tab); }

  // ---------- tz to country ----------
  var TZ = { 'Asia/Dhaka': 'Bangladesh', 'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India', 'Asia/Dubai': 'UAE', 'Asia/Kuala_Lumpur': 'Malaysia', 'Asia/Karachi': 'Pakistan', 'Asia/Riyadh': 'Saudi Arabia', 'Asia/Singapore': 'Singapore', 'Asia/Jakarta': 'Indonesia', 'Asia/Manila': 'Philippines', 'Asia/Bangkok': 'Thailand', 'Asia/Ho_Chi_Minh': 'Vietnam', 'Asia/Colombo': 'Sri Lanka', 'Asia/Kathmandu': 'Nepal', 'Asia/Tehran': 'Iran', 'Asia/Baghdad': 'Iraq', 'Asia/Qatar': 'Qatar', 'Asia/Kuwait': 'Kuwait', 'Asia/Muscat': 'Oman', 'Asia/Tokyo': 'Japan', 'Asia/Seoul': 'South Korea', 'Asia/Shanghai': 'China', 'Asia/Hong_Kong': 'Hong Kong', 'Asia/Tashkent': 'Uzbekistan', 'Asia/Almaty': 'Kazakhstan', 'Africa/Cairo': 'Egypt', 'Africa/Lagos': 'Nigeria', 'Africa/Nairobi': 'Kenya', 'Africa/Johannesburg': 'South Africa', 'Africa/Casablanca': 'Morocco', 'Africa/Algiers': 'Algeria', 'Africa/Accra': 'Ghana', 'Europe/London': 'United Kingdom', 'Europe/Paris': 'France', 'Europe/Berlin': 'Germany', 'Europe/Madrid': 'Spain', 'Europe/Rome': 'Italy', 'Europe/Istanbul': 'Turkey', 'Europe/Moscow': 'Russia', 'Europe/Kiev': 'Ukraine', 'Europe/Warsaw': 'Poland', 'Europe/Amsterdam': 'Netherlands', 'America/New_York': 'USA (East)', 'America/Chicago': 'USA (Central)', 'America/Denver': 'USA (Mountain)', 'America/Los_Angeles': 'USA (West)', 'America/Toronto': 'Canada', 'America/Sao_Paulo': 'Brazil', 'America/Mexico_City': 'Mexico', 'America/Bogota': 'Colombia', 'America/Argentina/Buenos_Aires': 'Argentina', 'Australia/Sydney': 'Australia', 'Australia/Melbourne': 'Australia', 'Pacific/Auckland': 'New Zealand' };
  var place = function (tz) { return !tz || tz === 'unknown' ? 'Unknown' : TZ[tz] || tz.split('/').pop().replace(/_/g, ' '); };

  // ---------- small SVG helpers ----------
  function spark(v, c) { var W = 100, H = 34, mx = Math.max.apply(null, v.concat([1])), mn = Math.min.apply(null, v.concat([0])), d = v.map(function (y, i) { return (i ? 'L' : 'M') + (v.length > 1 ? i / (v.length - 1) * W : 0).toFixed(1) + ' ' + (H - 3 - (y - mn) / (mx - mn || 1) * (H - 8)).toFixed(1); }).join(' '); return '<svg viewBox="0 0 100 34" preserveAspectRatio="none" style="width:100%;height:34px;margin-top:6px"><path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2" vector-effect="non-scaling-stroke" class="pd-path" style="--len:400"/></svg>'; }
  function countUp(el) { var n = +el.dataset.n, p = el.dataset.p || '', t0 = null; if (window.GTE_REDUCED) { el.textContent = p + num(n); return; } function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = p + num(Math.round(n * e)); if (k < 1) requestAnimationFrame(f); } requestAnimationFrame(f); }

  // ---------- overview ----------
  function renderOverview() { renderOverviewRaw(); reveal(); }
  function renderOverviewRaw() {
    var st = S.stats, B = st.balances, cur = st.cur, prev = st.prev, me = S.me, minp = Number(me.minPayout);
    var ready = Number(B.ready), ringp = Math.max(0, Math.min(100, Math.round(ready / minp * 100)));
    var conv = pct(cur.paid, cur.clicks);
    var tiles = [
      ['clicks', 'Clicks', cur.clicks, prev.clicks, '', col('--cyan'), 'People who opened your link'],
      ['signups', 'Sign-ups', cur.signups, prev.signups, '', col('--vio'), 'Created an account'],
      ['paid', 'Paid', cur.paid, prev.paid, '', col('--green'), 'Bought a plan'],
      ['earned', 'Earned', Math.round(cur.earned), Math.round(prev.earned), '$', col('--amber'), 'Your commission']];
    var sparkSeries = function (k) { return (st.series || []).map(function (x) { return Number(x[k] || 0); }); };
    $('#pd-overview').innerHTML = '<div class="pd-hero">'
      + '<div class="pd-card pd-keepdark pd-fadeup"><div class="pd-bal"><div class="pd-ring" id="pd-ringc" role="button" tabindex="0" aria-label="Payout progress, tap for details"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="10"/><circle id="pd-rg" cx="60" cy="60" r="52" fill="none" stroke="url(#pd-gg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="327" stroke-dashoffset="327" style="transition:stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)"/><defs><linearGradient id="pd-gg"><stop offset="0" stop-color="#3CD2FF"/><stop offset="1" stop-color="#42C496"/></linearGradient></defs></svg><b>' + ringp + '%</b></div>'
      + '<div><small style="color:#B8C3D3">READY TO PAY OUT</small><div class="pd-big" data-n="' + Math.round(ready) + '" data-p="$">$0</div><div class="pd-help" style="margin:4px 0 8px;color:#B8C3D3">Money from sales that finished the ' + num(me.holdDays) + '-day refund wait.</div></div></div>'
      + '<div class="pd-row" style="margin-top:6px;gap:8px;flex-wrap:wrap"><button class="pd-btn" id="pd-req">Request payout</button><span class="pd-pill a" role="button" tabindex="0" id="pd-hold">' + usd(B.hold, 0) + ' on hold</span>' + (B.nextRelease ? '<span class="pd-pill c">next release ' + new Date(B.nextRelease).toISOString().slice(0, 10) + '</span>' : '') + '</div></div>'
      + '<div class="pd-card pd-fadeup"><div class="pd-row"><h3>Your link</h3><span class="pd-pill g">' + (me.discountPct || 0) + '% discount for fans</span></div><div class="pd-help">Share this. Every purchase through it is yours for ' + num(me.cookieDays) + ' days.</div>'
      + '<div class="pd-link" id="pd-lk" role="button" tabindex="0" title="Tap to copy">' + esc(linkOf()) + '</div>'
      + '<div class="pd-row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><button class="pd-btn ghost" id="pd-cl">Copy link</button><button class="pd-btn ghost" id="pd-cc">Code: ' + esc(me.code) + '</button><button class="pd-btn ghost" id="pd-sh">Share</button><button class="pd-btn ghost" id="pd-qr">QR</button></div></div></div>'
      + '<div class="pd-row" style="margin:18px 0 10px"><h3>Last <span id="pd-rl">' + S.days + '</span> days</h3><div class="pd-row" style="gap:8px"><div class="pd-seg" id="pd-seg" role="group" aria-label="Period">' + [7, 30, 90].map(function (d) { return '<button data-d="' + d + '" class="' + (d === S.days ? 'on' : '') + '">' + d + 'd</button>'; }).join('') + '</div><button class="pd-btn ghost" id="pd-cmp" style="padding:6px 12px;font-size:.8rem">' + (S.compare ? 'Hide compare' : 'Compare') + '</button></div></div>'
      + '<div class="pd-grid pd-g4" id="pd-kpis">' + tiles.map(function (t) { var d = t[2] - t[3], dp = t[3] > 0 ? Math.round(d / t[3] * 100) : (t[2] > 0 ? 100 : 0);
        return '<div class="pd-card pd-kpi pd-click pd-fadeup in" role="button" tabindex="0" data-k="' + t[0] + '"><small>' + t[1] + '</small><b data-n="' + t[2] + '" data-p="' + t[4] + '">0</b><em class="' + (d < 0 ? 'd' : '') + '">' + (S.compare ? 'before: ' + t[4] + num(t[3]) : (d >= 0 ? '+' : '') + dp + '% vs before') + '</em>' + spark(sparkSeries(t[0] === 'earned' ? 'earned' : 'clicks'), t[5]) + '<div class="pd-help" style="margin:4px 0 0">' + t[6] + '</div></div>'; }).join('') + '</div>'
      + '<div class="pd-grid pd-g4" style="margin-top:12px" id="pd-kpis2">'
      + [['conv', 'Click to sale', conv + '%', 'Out of every 100 clicks'], ['avg', 'Avg per sale', usd(cur.paid ? cur.earned / cur.paid : 0, 0), 'Your earning per paid sale'], ['life', 'Lifetime', usd(B.lifetime, 0), 'Everything you earned so far'], ['paidout', 'Paid out', usd(B.paidOut, 0), 'Already sent to your wallet']]
        .map(function (t) { return '<div class="pd-card pd-kpi pd-click pd-fadeup in" role="button" tabindex="0" data-k="' + t[0] + '"><small>' + t[1] + '</small><b style="font-size:1.4rem">' + t[2] + '</b><div class="pd-help" style="margin:4px 0 0">' + t[3] + '</div></div>'; }).join('') + '</div>'
      + '<div class="pd-grid pd-g2" style="margin-top:12px"><div class="pd-card pd-fadeup"><div class="pd-row"><h3>Earnings</h3><span class="pd-pill g">' + usd(st.series.reduce(function (s, x) { return s + Number(x.earned); }, 0), 0) + ' total</span></div><div class="pd-help">Money earned each day. Tap a day for details.</div><div style="position:relative"><svg class="pd-ch" id="pd-ech" viewBox="0 0 520 220"></svg><div class="pd-tip" id="pd-tip"></div></div></div>'
      + '<div class="pd-card pd-fadeup"><h3>From click to sale</h3><div class="pd-help">Tap a step to see how to improve it.</div><div id="pd-fun"></div></div></div>'
      + '<div class="pd-grid pd-g3" style="margin-top:12px"><div class="pd-card pd-fadeup"><h3>Best time to post</h3><div class="pd-help">Clicks by hour of day, your local time. Tap a bar.</div><svg class="pd-ch" id="pd-hr" viewBox="0 0 300 100"></svg></div>'
      + '<div class="pd-card pd-fadeup"><h3>Where fans are</h3><div class="pd-help">Top places. Tap one.</div><div id="pd-cn"></div></div>'
      + '<div class="pd-card pd-fadeup"><h3>Devices</h3><div class="pd-help">Tap a colour.</div><div class="pd-row" style="gap:12px"><svg id="pd-dn" viewBox="0 0 120 120" style="width:110px;flex:none"></svg><div id="pd-dl" style="font-size:.85rem"></div></div></div></div>'
      + '<div class="pd-grid pd-g2" style="margin-top:12px"><div class="pd-card pd-fadeup"><h3>Plans sold</h3><div class="pd-help">What your audience buys. Tap a bar.</div><div id="pd-pl"></div></div>'
      + '<div class="pd-card pd-fadeup"><div class="pd-row"><h3>Latest activity</h3><span class="pd-pill g">real data</span></div><div class="pd-help">Tap an item.</div><div class="pd-feed" id="pd-feed"></div></div></div>'
      + '<div class="pd-grid pd-g2" style="margin-top:12px"><div class="pd-card pd-fadeup" id="pd-disc"></div><div class="pd-card pd-fadeup pd-click" id="pd-tier" role="button" tabindex="0"></div></div>';
    $$('#pd-overview [data-n]').forEach(countUp);
    setTimeout(function () { var r = $('#pd-rg'); if (r) r.style.strokeDashoffset = 327 * (1 - ringp / 100); }, 200);
    drawCharts(); drawDiscount(); drawTier(); drawFeed();
    $$('#pd-seg button').forEach(function (b) { b.onclick = async function () { S.days = +b.dataset.d; await loadStats(); renderOverview(); }; });
    $('#pd-cmp').onclick = function () { S.compare = !S.compare; renderOverview(); };
    $('#pd-req').onclick = requestPayout; $('#pd-hold').onclick = function () { openBalance('hold'); }; $('#pd-ringc').onclick = function () { openBalance('ready'); };
    $('#pd-lk').onclick = $('#pd-cl').onclick = function () { copy(linkOf(), 'Link copied'); };
    $('#pd-cc').onclick = function () { copy(me.code, 'Code copied'); };
    $('#pd-sh').onclick = function () { if (navigator.share) navigator.share({ title: 'GoldTriEngine', text: 'An automatic gold EA with a live public record.', url: linkOf() }).catch(function () {}); else copy(linkOf(), 'Link copied'); };
    $('#pd-qr').onclick = function () { showQr(linkOf()); };
    $$('#pd-kpis .pd-kpi, #pd-kpis2 .pd-kpi').forEach(function (e) { e.onclick = function () { kpiSheet(e.dataset.k); }; e.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); kpiSheet(e.dataset.k); } }; });
  }
  function kpiSheet(k) {
    var st = S.stats, c = st.cur, p = st.prev, d = st.days, B = st.balances;
    var cmp = function (a, b) { return [num(a), 'before: ' + num(b)]; };
    var M = {
      clicks: ['Clicks', 'Each click is one visitor opening your link, counted once per visitor every 30 minutes.', [['This period (' + d + ' days)', num(c.clicks)], ['Before that', num(p.clicks)], ['Sign-ups from them', pct(c.signups, c.clicks) + '%']], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="campaigns">See which link works best</button></div>'],
      signups: ['Sign-ups', 'People who clicked and then created a free account.', [['This period', num(c.signups)], ['Before that', num(p.signups)], ['Became buyers', pct(c.paid, c.signups) + '%']], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="customers">See your customers</button></div>'],
      paid: ['Paid', 'Customers whose payment was confirmed in this period. Renewals are not counted here.', [['This period', num(c.paid)], ['Before that', num(p.paid)], ['Click to sale', pct(c.paid, c.clicks) + '%']], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="customers" data-f="paid">See paid customers</button></div>'],
      earned: ['Earned', 'Commission added in this period, including renewals and after refunds.', [['This period', usd(c.earned)], ['Before that', usd(p.earned)], ['On hold now', usd(B.hold)], ['Ready now', usd(B.ready)]], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="reports">Open the daily report</button></div>'],
      conv: ['Click to sale', 'Paid sales divided by clicks. Most creators see this between 0.5% and 3%. It rises when you send people to a landing page and show the live record.', [['Clicks', num(c.clicks)], ['Paid', num(c.paid)], ['Rate', pct(c.paid, c.clicks) + '%']], ''],
      avg: ['Average per sale', 'Your earning for each paid sale in this period.', [['Earned', usd(c.earned)], ['Paid sales', num(c.paid)], ['Average', usd(c.paid ? c.earned / c.paid : 0)]], ''],
      life: ['Lifetime', 'Everything you have earned since you joined, after refunds.', [['Lifetime', usd(B.lifetime)], ['Paid out', usd(B.paidOut)], ['Still to come', usd(B.hold + B.ready + B.requested)]], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="payouts">See payouts</button></div>'],
      paidout: ['Paid out', 'Money already sent to your wallet.', [['Total paid out', usd(B.paidOut)], ['Payouts', num(S.payouts.filter(function (x) { return x.status === 'paid'; }).length)]], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="payouts">See payouts</button></div>']
    }[k];
    var sh = sheet(M[0], M[1], M[2], M[3]); $$('[data-go]', sh).forEach(function (b) { b.onclick = function () { go(b.dataset.go, b.dataset.f); }; });
  }
  function openBalance(which) {
    var B = S.stats.balances, me = S.me;
    var map = { hold: ['On hold', 'Sales wait ' + num(me.holdDays) + ' days in case of a refund. After that the money becomes ready.', [['On hold now', usd(B.hold)], ['Next release', B.nextRelease ? new Date(B.nextRelease).toISOString().slice(0, 10) : 'nothing waiting']]],
      ready: ['Ready to pay out', 'You can ask for a payout when this reaches ' + usd(me.minPayout, 0) + '. We send USDT to your wallet and show the transaction ID.', [['Ready now', usd(B.ready)], ['Minimum payout', usd(me.minPayout, 0)], ['Already asked for', usd(B.requested)]]] }[which];
    var sh = sheet(map[0], map[1], map[2], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" id="pd-rq2">Request payout</button><button class="pd-btn ghost" data-go="payouts">Wallet and payouts</button></div>');
    $('#pd-rq2', sh).onclick = function () { closeSheet(); requestPayout(); }; $$('[data-go]', sh).forEach(function (b) { b.onclick = function () { go('payouts'); }; });
  }
  async function requestPayout() {
    try { var r = await api('partner_request_payout'); toast('Payout of ' + usd(r.amount) + ' requested. We will send it soon.'); await loadAll(); renderAll(); }
    catch (e) { sheet('Not yet', esc(e.message || 'Could not request a payout.') + ' ', [['Ready now', usd(S.stats.balances.ready)], ['Minimum', usd(S.me.minPayout, 0)], ['Wallet', S.me.wallet || 'not added']], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="payouts">Open wallet settings</button></div>'); $$('.pd-sheet [data-go]').forEach(function (b) { b.onclick = function () { go('payouts'); }; }); }
  }

  // ---------- charts ----------
  function drawCharts() {
    var st = S.stats, ser = st.series || [], days = ser.length, W = 520, H = 220, l = 40, b = 24, t = 10, cy = col('--cyan'), mut = col('--mut'), grid = col('--line');
    var v = ser.map(function (x) { return Number(x.earned); }), mx = Math.max.apply(null, v.concat([1])) * 1.1, X = function (i) { return l + (days > 1 ? i / (days - 1) : 0) * (W - l - 8); }, Y = function (y) { return t + (1 - y / mx) * (H - t - b); };
    var d = v.map(function (y, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1); }).join(' '), a = d + ' L' + X(days - 1) + ' ' + (H - b) + ' L' + l + ' ' + (H - b) + ' Z', g = '';
    for (var k = 0; k <= 4; k++) { var yy = t + (H - t - b) * k / 4; g += '<line x1="' + l + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" stroke="' + grid + '"/><text x="' + (l - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="' + mut + '">$' + Math.round(mx * (1 - k / 4)) + '</text>'; }
    [0, Math.floor(days / 2), days - 1].forEach(function (i) { if (ser[i]) g += '<text x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === days - 1 ? 'end' : 'middle') + '" font-size="10" fill="' + mut + '">' + String(ser[i].day).slice(5) + '</text>'; });
    var svg = $('#pd-ech'); svg.innerHTML = '<defs><linearGradient id="pd-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + cy + '" stop-opacity=".5"/><stop offset="1" stop-color="' + cy + '" stop-opacity="0"/></linearGradient></defs>' + g
      + '<path d="' + a + '" fill="url(#pd-ar)"/><path d="' + d + '" fill="none" stroke="' + cy + '" stroke-width="2.4" stroke-linejoin="round" class="pd-path" style="--len:1600"/><line id="pd-vl" y1="' + t + '" y2="' + (H - b) + '" stroke="' + col('--cream') + '" stroke-dasharray="3 3" opacity="0"/><circle id="pd-dot" r="5" fill="' + col('--cream') + '" opacity="0"/><rect x="' + l + '" y="0" width="' + (W - l) + '" height="' + H + '" fill="transparent" id="pd-hit" style="cursor:pointer"/>';
    var tip = $('#pd-tip'), vl = $('#pd-vl'), dot = $('#pd-dot'), hit = $('#pd-hit');
    function at(e) { var r = svg.getBoundingClientRect(), cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; return Math.max(0, Math.min(days - 1, Math.round(((cx / r.width * W) - l) / (W - l - 8) * (days - 1)))); }
    function mv(e) { if (!days) return; var i = at(e), x = X(i), y = Y(v[i]), r = svg.getBoundingClientRect(); vl.setAttribute('x1', x); vl.setAttribute('x2', x); vl.setAttribute('opacity', 1); dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('opacity', 1); tip.style.opacity = 1; tip.style.left = Math.min(r.width - 120, Math.max(0, x / W * r.width - 50)) + 'px'; tip.style.top = Math.max(0, y / H * r.height - 44) + 'px'; tip.textContent = ser[i].day + ': ' + usd(v[i]); }
    hit.onmousemove = hit.ontouchmove = hit.ontouchstart = mv; hit.onmouseleave = function () { tip.style.opacity = 0; vl.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); };
    hit.onclick = function (e) { if (!days) return; var i = at(e), x = ser[i]; sheet(x.day, 'What happened on this day.', [['Earned', usd(x.earned)], ['Clicks', num(x.clicks)], ['Share of this period\'s earnings', pct(x.earned, v.reduce(function (s, y) { return s + y; }, 0)) + '%']], '<div class="pd-row" style="margin-top:12px"><button class="pd-btn" data-go="reports">Open the daily report</button></div>'); $$('.pd-sheet [data-go]').forEach(function (bb) { bb.onclick = function () { go('reports'); }; }); };
    // funnel
    var c = st.cur, F = [['Clicks', c.clicks, 100, col('--cyan'), 'Everyone who opened your link.', 'To get more clicks: post at your best hours, add the link to every video description, and make one link per post so you learn what works.'], ['Signed up', c.signups, 100 * pct(c.signups, c.clicks) / 100 || 0, col('--vio'), pct(c.signups, c.clicks) + '% of clicks created an account.', 'To get more sign-ups: send people to your personal landing page and show the live record first.'], ['Bought', c.paid, pct(c.paid, c.clicks), col('--green'), pct(c.paid, c.signups) + '% of sign-ups bought.', 'To get more buyers: mention your fan discount, and answer questions in comments.']];
    $('#pd-fun').innerHTML = F.map(function (r, i) { return '<div class="pd-fun pd-click" role="button" tabindex="0" data-i="' + i + '"><div class="pd-row"><span>' + r[0] + '</span><span style="color:var(--cream);font-weight:600">' + num(r[1]) + '</span></div><div class="pd-bar2" style="height:16px"><i data-w="' + Math.max(r[2], 4) + '" style="background:' + r[3] + ';box-shadow:0 0 14px ' + r[3] + '"></i></div></div>'; }).join('');
    $$('#pd-fun .pd-fun').forEach(function (e) { e.onclick = function () { var r = F[+e.dataset.i]; sheet(r[0], r[4], [['This period', num(r[1])]], '<p class="pd-help" style="margin-top:10px">' + esc(r[5]) + '</p>'); }; });
    // hours
    var hrs = st.hours || [], hm = Math.max.apply(null, hrs.concat([1])), ho = '', tot = hrs.reduce(function (s, x) { return s + x; }, 0), best = hrs.indexOf(hm);
    hrs.forEach(function (n, i) { var h = n / hm * 74, x = i * 12.5 + 1; ho += '<rect class="pd-hb" data-h="' + i + '" x="' + x + '" y="' + (86 - h) + '" width="10" height="' + Math.max(h, 1) + '" rx="3" fill="' + (i === best && n > 0 ? col('--green') : col('--cyan')) + '" opacity="' + (i === best ? 1 : .6) + '" style="cursor:pointer"/>'; });
    [0, 6, 12, 18, 23].forEach(function (h) { ho += '<text x="' + (h * 12.5 + 5) + '" y="98" font-size="8" fill="' + mut + '" text-anchor="middle">' + h + '</text>'; });
    $('#pd-hr').innerHTML = ho; $$('#pd-hr .pd-hb').forEach(function (r) { r.onclick = function () { var i = +r.dataset.h, n = hrs[i]; sheet(String(i).padStart(2, '0') + ':00 to ' + String(i).padStart(2, '0') + ':59', 'Clicks that arrived in this hour (your local time).', [['Clicks', num(n)], ['Share of all clicks', pct(n, tot) + '%'], ['Best hour', String(best).padStart(2, '0') + ':00 with ' + num(hm) + ' clicks']]); }; });
    // places
    var zs = (st.zones || []), pm = zs.length ? zs[0].n : 1;
    $('#pd-cn').innerHTML = zs.length ? zs.slice(0, 5).map(function (z, i) { return '<div class="pd-fun pd-click" role="button" tabindex="0" data-i="' + i + '" style="margin:8px 0"><div class="pd-row"><span>' + esc(place(z.tz)) + '</span><span style="color:var(--cream)">' + num(z.n) + '</span></div><div class="pd-bar2"><i data-w="' + z.n / pm * 100 + '" style="background:linear-gradient(90deg,' + col('--cyan') + ',' + col('--vio') + ')"></i></div></div>'; }).join('') : '<div class="pd-help">No clicks yet.</div>';
    $$('#pd-cn .pd-fun').forEach(function (e) { e.onclick = function () { var z = zs[+e.dataset.i]; sheet(place(z.tz), 'Estimated from the visitor\'s time zone, so it is approximate.', [['Clicks', num(z.n)], ['Share', pct(z.n, zs.reduce(function (s, x) { return s + x.n; }, 0)) + '%'], ['Time zone', z.tz]]); }; });
    // devices
    var dv = st.devices || {}, dk = Object.keys(dv), dt = dk.reduce(function (s, k) { return s + dv[k]; }, 0), dc = { mobile: col('--cyan'), desktop: col('--vio'), tablet: col('--amber'), other: col('--mut') }, R = 44, C = 2 * Math.PI * R, off = 0, o = '', lg = '';
    dk.forEach(function (k, i) { var len = C * dv[k] / (dt || 1); o += '<circle class="pd-dseg" data-k="' + k + '" cx="60" cy="60" r="' + R + '" fill="none" stroke="' + dc[k] + '" stroke-width="16" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 60 60)" style="cursor:pointer"/>'; off += len; lg += '<div class="pd-click" data-k="' + k + '" role="button" tabindex="0" style="margin:4px 0"><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:' + dc[k] + ';margin-right:6px"></span>' + esc(k[0].toUpperCase() + k.slice(1)) + ' <b>' + pct(dv[k], dt) + '%</b></div>'; });
    $('#pd-dn').innerHTML = dt ? o : '<circle cx="60" cy="60" r="44" fill="none" stroke="' + col('--track') + '" stroke-width="16"/>'; $('#pd-dl').innerHTML = dt ? lg : '<span class="pd-help">No clicks yet.</span>';
    $$('#pd-dn circle[data-k], #pd-dl [data-k]').forEach(function (e) { e.onclick = function () { var k = e.dataset.k; sheet(k[0].toUpperCase() + k.slice(1), 'Which devices open your link.', [['Clicks', num(dv[k])], ['Share', pct(dv[k], dt) + '%']], '<p class="pd-help" style="margin-top:10px">' + (k === 'mobile' ? 'Most of your fans are on phones. Keep your message short and check your landing page on a phone.' : 'Check your link on this device type to make sure it looks right.') + '</p>'); }; });
    // plans
    var pl = st.plans || [], pmx = pl.length ? pl[0].n : 1;
    $('#pd-pl').innerHTML = pl.length ? pl.map(function (p, i) { return '<div class="pd-fun pd-click" role="button" tabindex="0" data-i="' + i + '" style="margin:8px 0"><div class="pd-row"><span>' + esc(p.plan) + '</span><span style="color:var(--cream)">' + num(p.n) + '</span></div><div class="pd-bar2"><i data-w="' + p.n / pmx * 100 + '" style="background:linear-gradient(90deg,' + col('--amber') + ',' + col('--green') + ')"></i></div></div>'; }).join('') : '<div class="pd-help">No sales in this period yet.</div>';
    $$('#pd-pl .pd-fun').forEach(function (e) { e.onclick = function () { var p = pl[+e.dataset.i]; sheet(p.plan, 'Paid sales of this plan in the period.', [['Sales', num(p.n)], ['Share of sales', pct(p.n, pl.reduce(function (s, x) { return s + x.n; }, 0)) + '%']]); }; });
    setTimeout(function () { $$('#pd-overview [data-w]').forEach(function (e) { e.style.width = e.dataset.w + '%'; }); }, 250);
  }
  function drawDiscount() {
    var me = S.me, mx = Number(me.maxDiscount), cur = Number(me.discountPct), price = (S.plans[1] || S.plans[0] || { price_usd: 1900 }).price_usd;
    $('#pd-disc').innerHTML = '<h3>Fan discount</h3><div class="pd-help">Your rate is <b>' + me.rateSale + '%</b>. Give fans part of it as a discount. What you give comes out of your share, never ours.</div>'
      + '<input type="range" id="pd-ds" min="0" max="' + mx + '" step="1" value="' + cur + '" aria-label="Discount for your fans"><div class="pd-slider-out"><div><small>Fans get</small><b id="pd-d1"></b></div><div><small>You keep</small><b id="pd-d2"></b></div><div><small>Example sale</small><b id="pd-d3"></b></div></div>'
      + '<div class="pd-row" style="margin-top:10px"><button class="pd-btn" id="pd-dsave">Save discount</button><span class="pd-help" style="margin:0" id="pd-dmsg">Applies to new orders only.</span></div>';
    var up = function () { var d = +$('#pd-ds').value; $('#pd-d1').textContent = d + '%'; $('#pd-d2').textContent = Math.max(0, me.rateSale - d) + '%'; $('#pd-d3').textContent = usd(price * (me.rateSale - d) / 100, 0) + ' for you'; };
    $('#pd-ds').oninput = up; up();
    $('#pd-dsave').onclick = async function () { try { var r = await api('partner_set_discount', { p_pct: +$('#pd-ds').value }); S.me.discountPct = r.discountPct; toast('Discount saved: ' + r.discountPct + '%'); } catch (e) { toast(e.message || 'Could not save', true); } };
  }
  function drawTier() {
    var me = S.me, n = Number(me.paidReferrals), g = Number(me.goldAt), p = Math.min(100, Math.round(n / g * 100)), gold = n >= g;
    $('#pd-tier').innerHTML = '<h3>Your level</h3><div class="pd-help">' + (gold ? 'You reached the top level: +' + me.goldBonus + '% on every sale.' : 'Reach ' + g + ' paid referrals and your rate goes up by ' + me.goldBonus + ' points. Tap for details.') + '</div><div class="pd-row"><b style="color:var(--amber)">Standard</b><b style="color:var(--cream)">Top level</b></div><div class="pd-bar2" style="height:14px"><i data-w="' + p + '" style="background:linear-gradient(90deg,#9aa8bb,#F5C165)"></i></div><div class="pd-row" style="font-size:.82rem;color:var(--mut)"><span>' + n + ' paid referrals</span><span>' + (gold ? 'reached' : (g - n) + ' to go') + '</span></div>';
    $('#pd-tier').onclick = function () { sheet('Levels', 'Your rate grows as your referrals buy.', [['Standard rate', me.baseSale + '% on sales'], ['Top level', (Number(me.baseSale) + Number(me.goldBonus)) + '% on sales, after ' + g + ' paid referrals'], ['Your paid referrals', num(n)], ['Your rate now', me.rateSale + '% sales, ' + me.rateRenewal + '% renewals']]); };
    setTimeout(function () { var e = $('#pd-tier [data-w]'); if (e) e.style.width = e.dataset.w + '%'; }, 250);
  }
  function drawFeed() {
    var ev = [];
    S.custs.slice(0, 8).forEach(function (c) { ev.push({ t: c.paid_at || c.joined, k: c.stage === 'paid' ? 'Sale' : c.stage === 'refunded' ? 'Refund' : 'Sign-up', txt: c.stage === 'paid' ? 'Customer ' + c.customer + ' bought ' + (c.plan || 'a plan') : c.stage === 'refunded' ? 'Customer ' + c.customer + ' was refunded' : 'Customer ' + c.customer + ' signed up' + (c.campaign ? ' from ' + c.campaign : ''), amt: c.stage === 'paid' ? '+' + usd(c.earned, 0) : '', cls: c.stage === 'paid' ? 'g' : c.stage === 'refunded' ? 'r' : 'c', c: c }); });
    S.payouts.slice(0, 4).forEach(function (p) { ev.push({ t: p.paid_at || p.requested_at, k: 'Payout', txt: 'Payout of ' + usd(p.amount) + ' ' + p.status, amt: '', cls: 'a', p: p }); });
    ev.sort(function (a, b) { return new Date(b.t) - new Date(a.t); }); ev = ev.slice(0, 7);
    $('#pd-feed').innerHTML = ev.length ? ev.map(function (e, i) { return '<div class="pd-it pd-click" role="button" tabindex="0" data-i="' + i + '"><span class="pd-pill ' + e.cls + '">' + e.k + '</span><span style="flex:1;font-size:.86rem">' + esc(e.txt) + '</span><b style="color:var(--green)">' + esc(e.amt) + '</b></div>'; }).join('') : '<div class="pd-help">Nothing yet. Share your link and the first activity shows here.</div>';
    $$('#pd-feed .pd-it').forEach(function (e) { e.onclick = function () { var x = ev[+e.dataset.i]; if (x.c) custSheet(x.c); else payoutSheet(x.p); }; });
  }
  function showQr(text) {
    var sh = sheet('QR code', 'Scan it to open your link. Right-click or long-press to save.', [], '<div id="pd-qrb" style="text-align:center;padding:10px"><div class="pd-help">Making it...</div></div>');
    function make() { try { var q = window.qrcode(0, 'M'); q.addData(text); q.make(); $('#pd-qrb', sh).innerHTML = '<div style="background:#fff;padding:12px;display:inline-block;border-radius:12px">' + q.createSvgTag({ cellSize: 6, margin: 0 }) + '</div><div class="pd-help" style="margin-top:8px;word-break:break-all">' + esc(text) + '</div>'; } catch (e) { $('#pd-qrb', sh).innerHTML = '<div class="pd-help">Could not make the QR code.</div>'; } }
    if (window.qrcode) return make(); var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = make; s.onerror = function () { $('#pd-qrb', sh).innerHTML = '<div class="pd-help">Could not load the QR maker. Check your connection.</div>'; }; document.head.appendChild(s);
  }

  // ---------- campaigns ----------
  function renderCampaigns() {
    var C = S.camps, el = $('#pd-campaigns');
    el.innerHTML = '<div class="pd-card"><div class="pd-row"><h3>Campaign links</h3><span class="pd-hint">tap a row for details</span></div><div class="pd-help">Make one link for each video, post or ad to see which one really brings buyers.</div>'
      + '<div class="pd-row" style="gap:8px;margin:6px 0 12px"><input class="pd-in" id="pd-cn-in" maxlength="40" placeholder="Name, e.g. YouTube review" style="flex:1;min-width:160px"><button class="pd-btn" id="pd-cn-add">+ New link</button></div>'
      + (C.length ? '<div class="pd-scroll"><table><tr><th>Link</th><th>Clicks</th><th>Sign-ups</th><th>Paid</th><th>Click to sale</th><th>Earned</th></tr>' + C.map(function (c, i) { return '<tr class="pd-tr" tabindex="0" data-i="' + i + '"><td><b>' + esc(c.label || c.slug || 'Main link') + '</b><br><span class="pd-help" style="margin:0">' + esc(c.slug ? '&c=' + c.slug : 'no campaign name') + '</span></td><td>' + num(c.clicks) + '</td><td>' + num(c.signups) + '</td><td>' + num(c.paid) + '</td><td>' + pct(c.paid, c.clicks) + '%</td><td><b>' + usd(c.earned, 0) + '</b></td></tr>'; }).join('') + '</table></div>' : '<div class="pd-help">No links yet. Create your first one above.</div>') + '</div>';
    $('#pd-cn-add').onclick = async function () { var v = $('#pd-cn-in').value.trim(); if (!v) { toast('Give the link a short name first', true); return; } try { var r = await api('partner_campaign_save', { p_name: v }); toast('Link created: ' + r.slug); S.camps = await api('partner_campaigns'); renderCampaigns(); } catch (e) { toast(e.message || 'Could not create the link', true); } };
    $$('#pd-campaigns tr.pd-tr').forEach(function (r) { var f = function () { campSheet(C[+r.dataset.i]); }; r.onclick = f; r.onkeydown = function (e) { if (e.key === 'Enter') f(); }; });
  }
  function campSheet(c) {
    var lk = linkOf(c.slug), sh = sheet(c.label || c.slug || 'Main link', 'Everything about this link.', [['Link', esc(lk), true], ['Clicks', num(c.clicks)], ['Sign-ups', num(c.signups)], ['Paid sales', num(c.paid)], ['Click to sale', pct(c.paid, c.clicks) + '%'], ['Earned', usd(c.earned)]],
      '<div class="pd-row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="pd-btn" id="pd-c1">Copy link</button><button class="pd-btn ghost" id="pd-c2">Share</button><button class="pd-btn ghost" id="pd-c3">QR</button></div>');
    $('#pd-c1', sh).onclick = function () { copy(lk, 'Link copied'); }; $('#pd-c2', sh).onclick = function () { if (navigator.share) navigator.share({ url: lk }).catch(function () {}); else copy(lk, 'Link copied'); }; $('#pd-c3', sh).onclick = function () { showQr(lk); };
  }

  // ---------- customers ----------
  async function loadCusts() { S.custs = await api('partner_customers', { p_limit: 100, p_filter: S.cfilter }); }
  function renderCustomers() {
    var C = S.custs, el = $('#pd-customers');
    el.innerHTML = '<div class="pd-card"><div class="pd-row"><h3>Customers</h3><span class="pd-hint">anonymous by design</span></div><div class="pd-help">You see activity, never names or emails. Tap a customer for the story.</div>'
      + '<div class="pd-seg2" style="margin:6px 0 10px">' + [['latest', 'Latest'], ['top', 'Top earners'], ['paid', 'Paid'], ['refunded', 'Refunded']].map(function (f) { return '<button class="pd-btn ghost ' + (S.cfilter === f[0] ? 'pd-on' : '') + '" data-f="' + f[0] + '" style="padding:6px 14px;font-size:.82rem">' + f[1] + '</button>'; }).join('') + '</div>'
      + (C.length ? C.map(function (c, i) { return '<div class="pd-item pd-click" role="button" tabindex="0" data-i="' + i + '"><div class="pd-ic">' + esc(c.customer) + '</div><div><b>' + esc(c.plan || (c.stage === 'signed up' ? 'Signed up' : '-')) + '</b><small>' + new Date(c.joined).toISOString().slice(0, 10) + (c.campaign ? ' from ' + esc(c.campaign) : '') + '</small></div><div style="text-align:right"><span class="pd-pill ' + (c.stage === 'paid' ? 'g' : c.stage === 'refunded' ? 'r' : 'a') + '">' + esc(c.stage) + '</span>' + (Number(c.earned) ? '<small style="display:block;color:var(--green)">+' + usd(c.earned, 0) + '</small>' : '') + '</div></div>'; }).join('') : '<div class="pd-help">Nobody here yet. Customers appear when someone signs up through your link.</div>') + '</div>';
    $$('#pd-customers [data-f]').forEach(function (b) { b.onclick = async function () { S.cfilter = b.dataset.f; await loadCusts(); renderCustomers(); }; });
    $$('#pd-customers .pd-item').forEach(function (r) { var f = function () { custSheet(C[+r.dataset.i]); }; r.onclick = f; r.onkeydown = function (e) { if (e.key === 'Enter') f(); }; });
  }
  function custSheet(c) {
    var tl = '<div class="pd-tl"><div>Signed up ' + new Date(c.joined).toISOString().slice(0, 10) + (c.campaign ? ' from <b>' + esc(c.campaign) + '</b>' : '') + '</div>' + (c.paid_at ? '<div>Payment confirmed ' + new Date(c.paid_at).toISOString().slice(0, 10) + '</div>' : '') + (c.stage === 'refunded' ? '<div>Refunded. The commission was cancelled or taken back.</div>' : '') + '</div>';
    sheet('Customer ' + c.customer, 'No name or email is shown to partners.', [['Stage', c.stage], ['Plan', c.plan || '-'], ['Your earning', usd(c.earned)], ['Link used', c.campaign || 'main link']], tl);
  }

  // ---------- reports ----------
  async function loadReport() { var to = new Date(), from = new Date(Date.now() - 29 * 864e5); S.report = { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), rows: [] }; S.report.rows = await api('partner_report', { p_from: S.report.from, p_to: S.report.to }); }
  function renderReports() {
    var R = S.report, rows = R.rows, T = rows.reduce(function (t, r) { ['clicks', 'signups', 'paid', 'renewals', 'refunds'].forEach(function (k) { t[k] += Number(r[k]); }); t.commission += Number(r.commission); return t; }, { clicks: 0, signups: 0, paid: 0, renewals: 0, refunds: 0, commission: 0 });
    $('#pd-reports').innerHTML = '<div class="pd-card"><div class="pd-row"><h3>Daily report</h3><span class="pd-hint">tap a day for details</span></div><div class="pd-help">Every day, ready for your own records.</div>'
      + '<div class="pd-row" style="gap:8px;margin:6px 0 12px;flex-wrap:wrap"><input class="pd-in" type="date" id="pd-rf" value="' + R.from + '"><input class="pd-in" type="date" id="pd-rt" value="' + R.to + '"><button class="pd-btn ghost" id="pd-rgo">Show</button><button class="pd-btn ghost" id="pd-rcsv">Download CSV</button></div>'
      + '<div class="pd-grid pd-g4" style="margin-bottom:10px">' + [['Clicks', T.clicks], ['Sign-ups', T.signups], ['Paid', T.paid], ['Commission', usd(T.commission, 0)]].map(function (x) { return '<div class="pd-card pd-kpi"><small>' + x[0] + '</small><b style="font-size:1.4rem">' + (typeof x[1] === 'number' ? num(x[1]) : x[1]) + '</b></div>'; }).join('') + '</div>'
      + '<div class="pd-scroll"><table><tr><th>Date</th><th>Clicks</th><th>Sign-ups</th><th>Paid</th><th>Renewals</th><th>Refunds</th><th>Commission</th></tr>' + rows.map(function (r, i) { return '<tr class="pd-tr" tabindex="0" data-i="' + i + '"><td>' + esc(String(r.day).slice(0, 10)) + '</td><td>' + num(r.clicks) + '</td><td>' + num(r.signups) + '</td><td>' + num(r.paid) + '</td><td>' + num(r.renewals) + '</td><td>' + num(r.refunds) + '</td><td><b style="color:' + (Number(r.commission) < 0 ? 'var(--red)' : 'inherit') + '">' + usd(r.commission) + '</b></td></tr>'; }).join('') + '</table></div></div>';
    $('#pd-rgo').onclick = async function () { var f = $('#pd-rf').value, t = $('#pd-rt').value; if (!f || !t || f > t) { toast('Choose a start date before the end date', true); return; } try { S.report = { from: f, to: t, rows: await api('partner_report', { p_from: f, p_to: t }) }; renderReports(); } catch (e) { toast(e.message, true); } };
    $('#pd-rcsv').onclick = function () { var head = ['date', 'clicks', 'signups', 'paid', 'renewals', 'refunds', 'commission_usd']; var csv = [head.join(',')].concat(rows.map(function (r) { return [String(r.day).slice(0, 10), r.clicks, r.signups, r.paid, r.renewals, r.refunds, r.commission].join(','); })).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'partner-report-' + R.from + '-' + R.to + '.csv'; document.body.appendChild(a); a.click(); a.remove(); toast('Report downloaded'); };
    $$('#pd-reports tr.pd-tr').forEach(function (e) { var f = function () { var r = rows[+e.dataset.i]; sheet(String(r.day).slice(0, 10), 'Everything that happened on this day.', [['Clicks', num(r.clicks)], ['Sign-ups', num(r.signups)], ['Paid sales', num(r.paid)], ['Renewals', num(r.renewals)], ['Refunds', num(r.refunds)], ['Commission', usd(r.commission)]]); }; e.onclick = f; e.onkeydown = function (ev) { if (ev.key === 'Enter') f(); }; });
  }

  // ---------- payouts ----------
  function renderPayouts() {
    var B = S.stats.balances, me = S.me, el = $('#pd-payouts');
    var tile = function (k, n, v, c) { return '<div class="pd-card pd-kpi pd-click" role="button" tabindex="0" data-b="' + k + '"><small>' + n + '</small><b style="font-size:1.4rem;color:' + c + '">' + usd(v, 0) + '</b></div>'; };
    var held = me.walletHoldUntil && new Date(me.walletHoldUntil) > new Date();
    el.innerHTML = '<div class="pd-grid pd-g4">' + tile('hold', 'On hold', B.hold, 'var(--amber)') + tile('ready', 'Ready', B.ready, 'var(--green)') + tile('requested', 'Asked for', B.requested, 'var(--cyan)') + tile('paidout', 'Paid out', B.paidOut, 'var(--cream)') + '</div>'
      + '<div class="pd-grid pd-g2" style="margin-top:12px"><div class="pd-card"><h3>Payout wallet</h3><div class="pd-help">USDT only. We pay by hand and show the transaction ID.</div>'
      + '<div class="pd-row" style="margin-bottom:8px">' + (me.wallet ? '<span class="pd-pill c">' + esc(me.network) + '</span><b class="mono">' + esc(me.wallet) + '</b>' : '<span class="pd-help" style="margin:0">No wallet added yet.</span>') + '</div>'
      + (held ? '<div class="pd-warn" style="margin-bottom:8px">Wallet changed recently. Payouts wait until ' + new Date(me.walletHoldUntil).toISOString().slice(0, 16).replace('T', ' ') + ' to protect you from theft.</div>' : '')
      + '<div class="pd-row" style="gap:8px;flex-wrap:wrap"><select class="pd-in" id="pd-wn"><option value="TRC20">TRON (TRC20)</option><option value="BEP20">BNB (BEP20)</option></select><input class="pd-in" id="pd-wa" placeholder="Paste your wallet address" style="flex:1;min-width:200px" autocomplete="off" spellcheck="false"></div>'
      + '<div class="pd-row" style="margin-top:8px"><button class="pd-btn" id="pd-wsave">Save wallet</button></div><div class="pd-help" style="margin:8px 0 0">Check the address twice. Sending to a wrong address cannot be undone. Changing it later pauses payouts for ' + 48 + ' hours.</div></div>'
      + '<div class="pd-card"><h3>Request a payout</h3><div class="pd-help">Ready now: <b>' + usd(B.ready) + '</b>. Minimum: ' + usd(me.minPayout, 0) + '.</div><button class="pd-btn" id="pd-req2">Request payout</button><div class="pd-help" style="margin-top:10px">After you ask, we send USDT, usually within a day or two. The transaction ID appears below.</div></div></div>'
      + '<div class="pd-card" style="margin-top:12px"><h3>Payout history</h3><div class="pd-help">Tap one for the transaction.</div>' + (S.payouts.length ? '<div class="pd-scroll"><table><tr><th>Asked</th><th>Amount</th><th>Network</th><th>Status</th><th>Transaction</th></tr>' + S.payouts.map(function (p, i) { return '<tr class="pd-tr" tabindex="0" data-i="' + i + '"><td>' + new Date(p.requested_at).toISOString().slice(0, 10) + '</td><td><b>' + usd(p.amount) + '</b></td><td>' + esc(p.network) + '</td><td><span class="pd-pill ' + (p.status === 'paid' ? 'g' : p.status === 'requested' ? 'a' : 'r') + '">' + esc(p.status) + '</span></td><td class="mono">' + esc(p.tx_hash ? p.tx_hash.slice(0, 10) + '...' : '') + '</td></tr>'; }).join('') + '</table></div>' : '<div class="pd-help">No payouts yet.</div>') + '</div>'
      + '<div class="pd-card" style="margin-top:12px"><h3>Money in and out</h3><div class="pd-help">Every commission and correction. Tap one.</div>' + (S.ledger.length ? '<div class="pd-scroll"><table><tr><th>Date</th><th>Type</th><th>Plan</th><th>Amount</th><th>Status</th></tr>' + S.ledger.slice(0, 40).map(function (l, i) { return '<tr class="pd-tr" tabindex="0" data-l="' + i + '"><td>' + new Date(l.created_at).toISOString().slice(0, 10) + '</td><td>' + esc(l.entry_kind) + '</td><td>' + esc(l.plan || '-') + '</td><td><b style="color:' + (Number(l.amount) < 0 ? 'var(--red)' : 'inherit') + '">' + usd(l.amount) + '</b></td><td>' + ledgerPill(l) + '</td></tr>'; }).join('') + '</table></div>' : '<div class="pd-help">Nothing yet.</div>') + '</div>';
    $$('#pd-payouts [data-b]').forEach(function (e) { e.onclick = function () { var k = e.dataset.b; if (k === 'hold' || k === 'ready') openBalance(k); else if (k === 'requested') sheet('Asked for', 'Money you requested that we have not sent yet.', [['Amount', usd(B.requested)]]); else sheet('Paid out', 'Money already sent to your wallet.', [['Total', usd(B.paidOut)]]); }; });
    $('#pd-wsave').onclick = async function () { var a = $('#pd-wa').value.trim(); if (!a) { toast('Paste your wallet address first', true); return; } try { var r = await api('partner_set_wallet', { p_network: $('#pd-wn').value, p_wallet: a }); toast(r.holdUntil ? 'Wallet saved. Payouts wait 48 hours.' : 'Wallet saved'); await loadAll(); renderAll(); } catch (e) { toast(e.message || 'Could not save', true); } };
    $('#pd-req2').onclick = requestPayout;
    $$('#pd-payouts tr[data-i]').forEach(function (e) { var f = function () { payoutSheet(S.payouts[+e.dataset.i]); }; e.onclick = f; e.onkeydown = function (ev) { if (ev.key === 'Enter') f(); }; });
    $$('#pd-payouts tr[data-l]').forEach(function (e) { var f = function () { var l = S.ledger[+e.dataset.l]; sheet(l.entry_kind === 'commission' ? 'Commission' : l.entry_kind === 'clawback' ? 'Refund correction' : l.entry_kind, l.entry_kind === 'clawback' ? 'A customer was refunded after you were paid, so this amount is taken off your next payout.' : 'Your earning for one order.', [['Amount', usd(l.amount)], ['Plan', l.plan || '-'], ['Status', ledgerText(l)], ['Created', new Date(l.created_at).toISOString().slice(0, 10)], ['Becomes ready', l.status === 'pending' ? new Date(l.release_at).toISOString().slice(0, 10) : '-']]); }; e.onclick = f; e.onkeydown = function (ev) { if (ev.key === 'Enter') f(); }; });
  }
  var ledgerText = function (l) { return l.status === 'pending' ? (new Date(l.release_at) > new Date() ? 'on hold' : 'ready') : l.status === 'reserved' ? 'asked for' : l.status === 'settled' ? 'paid' : 'cancelled'; };
  var ledgerPill = function (l) { var t = ledgerText(l); return '<span class="pd-pill ' + ({ 'on hold': 'a', ready: 'g', 'asked for': 'c', paid: 'g', cancelled: 'r' }[t]) + '">' + t + '</span>'; };
  function payoutSheet(p) {
    var ex = p.tx_hash ? (p.network === 'BEP20' ? 'https://bscscan.com/tx/' : 'https://tronscan.org/#/transaction/') + encodeURIComponent(p.tx_hash) : null;
    sheet('Payout of ' + usd(p.amount), p.status === 'paid' ? 'Sent to your wallet.' : p.status === 'requested' ? 'We received your request and will send it soon.' : 'This request was cancelled and the money went back to your ready balance.',
      [['Status', p.status], ['Network', p.network], ['Wallet ends', '...' + (p.wallet_end || '')], ['Asked', new Date(p.requested_at).toISOString().slice(0, 16).replace('T', ' ')], ['Sent', p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 16).replace('T', ' ') : '-'], ['Transaction ID', p.tx_hash || '-']],
      ex ? '<div class="pd-row" style="margin-top:12px;gap:8px"><a class="pd-btn" href="' + ex + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Check on the blockchain</a><button class="pd-btn ghost" id="pd-txc">Copy ID</button></div>' : '');
    var b = $('#pd-txc'); if (b) b.onclick = function () { copy(p.tx_hash, 'ID copied'); };
  }

  // ---------- marketing kit ----------
  var CAPS = {
    en: { n: 'English', risk: 'Trading gold can lose money.', disc: 'I earn a commission if you buy through my link.', p: ['Gold EA that trades MT5 for you around the clock, and its live record is public. See it here: {link}\n{off}', 'Most gold EAs hide their results. This one streams its live account on YouTube. Judge for yourself: {link}', 'Three engines, one MT5 account, no manual trading. Setup help is included. {link}\n{off}', 'Thinking about an automatic gold EA? Check the live record first, then decide: {link}', 'Before you buy any EA, ask for a live account, not just a backtest. GoldTriEngine shows both: {link}'], offT: 'Get {disc}% off with my link or code {code}.' },
    bn: { n: 'বাংলা', risk: 'গোল্ড ট্রেডিংয়ে লোকসান হতে পারে।', disc: 'আপনি আমার লিঙ্কের মাধ্যমে কিনলে আমি কমিশন পাই।', p: ['MT5-এ স্বয়ংক্রিয় গোল্ড EA, যার লাইভ রেকর্ড সবার জন্য খোলা। দেখুন: {link}\n{off}', 'বেশিরভাগ গোল্ড EA নিজেদের ফলাফল লুকায়। এটি ইউটিউবে লাইভ অ্যাকাউন্ট দেখায়। নিজেই যাচাই করুন: {link}', 'তিনটি ইঞ্জিন, একটি MT5 অ্যাকাউন্ট, নিজে ট্রেড করতে হয় না। সেটআপে সাহায্য আছে। {link}\n{off}', 'স্বয়ংক্রিয় গোল্ড EA নিয়ে ভাবছেন? আগে লাইভ রেকর্ড দেখুন, তারপর সিদ্ধান্ত নিন: {link}', 'যেকোনো EA কেনার আগে শুধু ব্যাকটেস্ট নয়, লাইভ অ্যাকাউন্ট দেখতে চান। GoldTriEngine দুটোই দেখায়: {link}'], offT: 'আমার লিঙ্ক বা কোড {code} দিলে {disc}% ছাড়।' },
    hi: { n: 'हिन्दी', risk: 'गोल्ड ट्रेडिंग में नुकसान हो सकता है।', disc: 'अगर आप मेरे लिंक से खरीदते हैं तो मुझे कमीशन मिलता है।', p: ['MT5 पर अपने-आप चलने वाला गोल्ड EA, जिसका लाइव रिकॉर्ड सबके सामने है। देखें: {link}\n{off}', 'ज़्यादातर गोल्ड EA अपने नतीजे छिपाते हैं। यह YouTube पर लाइव अकाउंट दिखाता है। खुद परखें: {link}', 'तीन इंजन, एक MT5 अकाउंट, हाथ से ट्रेड नहीं करना। सेटअप में मदद शामिल है। {link}\n{off}', 'ऑटोमैटिक गोल्ड EA के बारे में सोच रहे हैं? पहले लाइव रिकॉर्ड देखें, फिर फ़ैसला करें: {link}', 'कोई भी EA खरीदने से पहले सिर्फ़ बैकटेस्ट नहीं, लाइव अकाउंट माँगें। GoldTriEngine दोनों दिखाता है: {link}'], offT: 'मेरे लिंक या कोड {code} से {disc}% छूट।' },
    ar: { n: 'العربية', risk: 'التداول في الذهب قد يسبب خسائر.', disc: 'أحصل على عمولة إذا اشتريت عبر رابطي.', p: ['خبير ذهب آلي على MT5 وسجله المباشر متاح للجميع. شاهد: {link}\n{off}', 'معظم خبراء الذهب يخفون نتائجهم. هذا يعرض حسابه المباشر على يوتيوب. احكم بنفسك: {link}', 'ثلاثة محركات وحساب MT5 واحد ولا حاجة للتداول يدويا. مساعدة الإعداد مشمولة. {link}\n{off}', 'تفكر في خبير ذهب آلي؟ شاهد السجل المباشر أولا ثم قرر: {link}', 'قبل شراء أي خبير اطلب حسابا حيا لا اختبارا تاريخيا فقط. GoldTriEngine يعرض الاثنين: {link}'], offT: 'خصم {disc}% عبر رابطي أو الكود {code}.' }
  };
  var SIZES = [['Leaderboard', 728, 90], ['Medium rectangle', 300, 250], ['Skyscraper', 160, 600], ['Billboard', 970, 250], ['Mobile banner', 320, 100], ['Square post', 1080, 1080], ['Story or reel cover', 1080, 1920], ['YouTube thumbnail', 1280, 720]];
  function drawBanner(c, w, h) {
    var me = S.me, g = c.getContext('2d'), d = Number(me.discountPct) || 0; c.width = w; c.height = h;
    var bgc = g.createLinearGradient(0, 0, w, h); bgc.addColorStop(0, '#0f1b34'); bgc.addColorStop(.6, '#17315f'); bgc.addColorStop(1, '#0c5f8c'); g.fillStyle = bgc; g.fillRect(0, 0, w, h);
    var r1 = g.createRadialGradient(w * .9, 0, 0, w * .9, 0, Math.max(w, h) * .7); r1.addColorStop(0, 'rgba(60,210,255,.45)'); r1.addColorStop(1, 'transparent'); g.fillStyle = r1; g.fillRect(0, 0, w, h);
    var r2 = g.createRadialGradient(0, h, 0, 0, h, Math.max(w, h) * .6); r2.addColorStop(0, 'rgba(245,193,101,.35)'); r2.addColorStop(1, 'transparent'); g.fillStyle = r2; g.fillRect(0, 0, w, h);
    var wide = w / h > 2.2, u = wide ? h : Math.min(w, h * .8), pad = u * .08, F = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    g.textBaseline = 'top'; g.fillStyle = '#FFE9A8'; g.font = '700 ' + u * (wide ? .2 : .075) + 'px ' + F;
    var title = 'GoldTriEngine'; var head = 'Automatic gold EA for MT5';
    if (wide) {
      g.fillText(title, pad, pad); g.fillStyle = '#fff'; g.font = '700 ' + u * .28 + 'px ' + F; g.fillText(head, pad, pad + u * .3);
      var offt = d ? d + '% OFF' : 'Live record'; g.font = '800 ' + u * .26 + 'px ' + F; var tw = g.measureText(offt).width + u * .4, bx = w - tw - pad, by = pad; g.fillStyle = '#3CD2FF'; rr(g, bx, by, tw, u * .42, u * .21); g.fillStyle = '#07121f'; g.fillText(offt, bx + u * .2, by + u * .08);
      g.fillStyle = '#cfd8e6'; g.font = '500 ' + u * .15 + 'px ' + F; g.fillText((d ? 'Code ' + me.code + '  ' : '') + 'goldtriengine.com/p/?ref=' + me.code, pad, h - pad - u * .16);
    } else {
      var y = h * .1; g.fillText(title, pad, y); y += u * .13; g.fillStyle = '#fff'; g.font = '700 ' + u * .095 + 'px ' + F; wrap(g, head + ' with a public live record', pad, y, w - pad * 2, u * .115);
      var offt2 = d ? d + '% OFF' : 'Live record', by2 = h * .56; g.font = '800 ' + u * .16 + 'px ' + F; var tw2 = g.measureText(offt2).width + u * .3; g.fillStyle = '#3CD2FF'; rr(g, pad, by2, tw2, u * .24, u * .12); g.fillStyle = '#07121f'; g.fillText(offt2, pad + u * .15, by2 + u * .04);
      g.fillStyle = '#FFE9A8'; g.font = '700 ' + u * .075 + 'px ' + F; g.fillText(d ? 'Code ' + me.code : 'Use my link', pad, by2 + u * .31);
      g.fillStyle = '#cfd8e6'; g.font = '500 ' + u * .05 + 'px ' + F; wrap(g, 'goldtriengine.com/p/?ref=' + me.code, pad, h - pad - u * .08, w - pad * 2, u * .06);
      g.fillStyle = 'rgba(207,216,230,.8)'; g.font = '400 ' + u * .036 + 'px ' + F; g.fillText('Trading gold can lose money. I earn a commission.', pad, h - pad * .9 - u * .0);
    }
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
  function wrap(g, t, x, y, mw, lh) { var words = t.split(' '), line = ''; words.forEach(function (w) { var test = line + w + ' '; if (g.measureText(test).width > mw && line) { g.fillText(line, x, y); line = w + ' '; y += lh; } else line = test; }); g.fillText(line, x, y); }
  function renderKit() {
    var me = S.me, d = Number(me.discountPct) || 0, lang = S.lang || 'en', L = CAPS[lang], link = linkOf(), el = $('#pd-kit');
    var fillT = function (t) { return t.replace(/\{link\}/g, link).replace(/\{code\}/g, me.code).replace(/\{disc\}/g, d).replace(/\{off\}/g, d ? L.offT.replace(/\{code\}/g, me.code).replace(/\{disc\}/g, d) : ''); };
    var caps = L.p.map(function (t) { return fillT(t).trim() + '\n' + L.risk + ' ' + L.disc; });
    el.innerHTML = '<div class="pd-card"><h3>Your personal landing page</h3><div class="pd-help">Put this in your bio. It shows your name and your fan discount, and tracks your sales.</div><div class="pd-link" id="pd-k-lk" role="button" tabindex="0">' + esc(link) + '</div><div class="pd-row" style="margin-top:10px;gap:8px"><button class="pd-btn ghost" id="pd-k-c">Copy</button><a class="pd-btn ghost" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Preview</a><button class="pd-btn ghost" id="pd-k-q">QR</button></div></div>'
      + '<div class="pd-card" style="margin-top:12px"><h3>Banners and covers</h3><div class="pd-help">Made with your code' + (d ? ' and your ' + d + '% fan discount' : '') + '. Tap one to download it as a PNG.</div><div class="pd-banners">' + SIZES.map(function (s, i) { return '<div class="pd-bn"><canvas data-i="' + i + '"></canvas><div class="pd-row"><span style="font-size:.82rem"><b>' + s[0] + '</b><br><span class="pd-help" style="margin:0">' + s[1] + ' x ' + s[2] + '</span></span><button class="pd-btn ghost" data-dl="' + i + '" style="padding:6px 12px;font-size:.8rem">Download</button></div></div>'; }).join('') + '</div></div>'
      + '<div class="pd-card" style="margin-top:12px"><h3>Ready-to-post captions</h3><div class="pd-help">Tap a caption to copy it. Your link, code and discount are filled in. Have a native speaker check the wording before you post.</div><div class="pd-seg2" id="pd-lang">' + Object.keys(CAPS).map(function (k) { return '<button class="pd-btn ghost ' + (k === lang ? 'pd-on' : '') + '" data-l="' + k + '" style="padding:6px 14px;font-size:.82rem">' + CAPS[k].n + '</button>'; }).join('') + '</div><div id="pd-caps">' + caps.map(function (c, i) { return '<div class="pd-cap" data-c="' + i + '" role="button" tabindex="0" dir="auto">' + esc(c) + '</div>'; }).join('') + '</div></div>'
      + '<div class="pd-grid pd-g2" style="margin-top:12px"><div class="pd-card"><h3>Short video ideas</h3><div class="pd-help">30 seconds each. Tap one for the full script.</div>' + [['Is this EA real?', 'Show the live account on the home page and the YouTube stream. Say what you see, including losing days.'], ['Backtest vs live', 'Show the free backtest next to the live record. Explain why both matter.'], ['Setup in 3 steps', 'Show buying a plan, pasting the key into the EA, and the account page turning green.']].map(function (v, i) { return '<div class="pd-item pd-click" role="button" tabindex="0" data-v="' + i + '"><div class="pd-ic">' + (i + 1) + '</div><div><b>' + esc(v[0]) + '</b><small>tap for the script</small></div></div>'; }).join('') + '</div>'
      + '<div class="pd-card"><h3>Facts you can quote</h3><div class="pd-help">Only things that are true and published.</div><div id="pd-facts"></div></div></div>'
      + '<div class="pd-card" style="margin-top:12px"><h3>Rules and required lines</h3><div class="pd-warn"><b>Always say:</b> "I earn a commission if you buy through my link." and "Trading gold can lose money."<br><b>Never say:</b> guaranteed profit, risk-free, "you will earn", or show results that are not the real live record.</div><div class="pd-help" style="margin-top:8px">Breaking these rules can pause your partner account. See the fair play rules on the <a href="partners.html#apply">Partners page</a>.</div></div>';
    var VID = [['Is this EA real?', ['Hook: "Most gold EAs never show a live account. This one does."', 'Show: the live account section and the YouTube live stream. Say today\'s real result, even if it is a loss.', 'Close: "Judge for yourself, link in the description. I earn a commission if you buy. Trading gold can lose money."']], ['Backtest vs live', ['Hook: "A backtest is a promise. A live record is proof."', 'Show: the free backtest, then the live account. Explain the difference calmly.', 'Close: your link and code, the commission line, the risk line.']], ['Setup in 3 steps', ['Hook: "From purchase to running in one afternoon."', 'Show: 1 buy a plan, 2 paste the key into the EA, 3 the account page shows EA online.', 'Close: your link and code, the commission line, the risk line.']]];
    $$('#pd-kit canvas').forEach(function (c) { var s = SIZES[+c.dataset.i]; drawBanner(c, s[1], s[2]); });
    $$('#pd-kit [data-dl]').forEach(function (b) { b.onclick = function () { var s = SIZES[+b.dataset.dl], cv = document.createElement('canvas'); drawBanner(cv, s[1], s[2]); var a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = 'goldtriengine-' + s[0].toLowerCase().replace(/[^a-z]+/g, '-') + '-' + me.code + '.png'; document.body.appendChild(a); a.click(); a.remove(); toast('Downloaded'); api('partner_kit_log', { p_item: s[0] }).catch(function () {}); }; });
    $$('#pd-lang [data-l]').forEach(function (b) { b.onclick = function () { S.lang = b.dataset.l; renderKit(); }; });
    $$('#pd-caps .pd-cap').forEach(function (c) { var f = function () { copy(caps[+c.dataset.c], 'Caption copied'); api('partner_kit_log', { p_item: 'caption ' + lang }).catch(function () {}); }; c.onclick = f; c.onkeydown = function (e) { if (e.key === 'Enter') f(); }; });
    $$('#pd-kit [data-v]').forEach(function (e) { e.onclick = function () { var v = VID[+e.dataset.v]; sheet(v[0], 'A 30 second video. Use your own words.', [], '<div class="pd-tl">' + v[1].map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') + '</div>'); }; });
    $('#pd-k-lk').onclick = $('#pd-k-c').onclick = function () { copy(link, 'Link copied'); }; $('#pd-k-q').onclick = function () { showQr(link); };
    $('#pd-facts').innerHTML = ['One MT5 USD account per yearly license', 'Three engines trade gold automatically', 'Telegram alerts and personal setup help', 'Free updates during the year', 'A live public account and a free backtest you can check'].map(function (f) { return '<div class="pd-kv" style="display:flex;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><span style="color:var(--green)">&#10003;</span><span>' + esc(f) + '</span></div>'; }).join('') + (S.plans.length ? '<div class="pd-help" style="margin-top:8px">Plans: ' + S.plans.map(function (p) { return esc(p.name) + ' ' + usd(p.price_usd, 0); }).join(', ') + '</div>' : '');
  }

  // ---------- shell ----------
  var TABS = [['overview', 'Overview'], ['campaigns', 'Campaigns'], ['customers', 'Customers'], ['reports', 'Reports'], ['payouts', 'Payouts'], ['kit', 'Marketing kit']];
  function setTab(t) { S.tab = t; $$('.pd-bar button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); b.setAttribute('aria-selected', b.dataset.t === t); }); $$('.pd-panel').forEach(function (p) { p.classList.toggle('on', p.id === 'pd-' + t); }); try { history.replaceState(null, '', '#' + t); } catch (e) {} reveal(); window.scrollTo({ top: Math.max(0, $('.pd').offsetTop - 70), behavior: 'smooth' }); }
  function reveal() { $$('.pd-panel.on .pd-fadeup:not(.in)').forEach(function (e, i) { setTimeout(function () { e.classList.add('in'); }, window.GTE_REDUCED ? 0 : i * 70); }); setTimeout(function () { $$('.pd-panel.on [data-w]').forEach(function (e) { e.style.width = e.dataset.w + '%'; }); }, 200); }
  function renderAll() { renderOverview(); renderCampaigns(); renderCustomers(); renderReports(); renderPayouts(); renderKit(); reveal(); }
  async function loadStats() { S.stats = await api('partner_stats', { p_days: S.days, p_tz_min: tzo }); }
  async function loadAll() {
    var r = await Promise.all([api('partner_me'), api('partner_stats', { p_days: S.days, p_tz_min: tzo }), api('partner_campaigns'), api('partner_customers', { p_limit: 100, p_filter: S.cfilter }), api('partner_ledger_list', { p_limit: 100 }), api('partner_payouts_list'), loadReport()]);
    S.me = r[0]; S.stats = r[1]; S.camps = r[2]; S.custs = r[3]; S.ledger = r[4]; S.payouts = r[5];
  }
  function gate(html) { $('#pd-app').hidden = true; $('#pd-gate').hidden = false; $('#pd-gate').innerHTML = '<div class="pd-card">' + html + '</div>'; }
  async function init() {
    document.body.insertAdjacentHTML('beforeend', '<div class="pd-sheetbg"></div><div class="pd-sheet" tabindex="-1"></div>');
    $('.pd-sheetbg').onclick = closeSheet; document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    try { S.plans = await gte.plans(); } catch (e) { S.plans = []; }
    if (!DEMO) {
      var s = await gte.session();
      if (!s) { gate('<h2>Partner dashboard</h2><p class="pd-help">Sign in to see your numbers.</p><a class="pd-btn" href="signin.html?next=partner.html" style="text-decoration:none;display:inline-block">Sign in</a>'); return; }
    }
    try { await loadAll(); } catch (e) {
      var st = null; try { st = await api('partner_status'); } catch (x) {}
      if (st && st.status === 'pending') gate('<h2>Your application is with us</h2><p class="pd-help">We will email you when it is approved. Your code request: <b>' + esc(st.code) + '</b>.</p><a class="pd-btn ghost" href="partners.html" style="text-decoration:none;display:inline-block">Back to the Partners page</a>');
      else if (st && st.status === 'declined') gate('<h2>Application not approved</h2><p class="pd-help">You are welcome to write to us on the contact page.</p><a class="pd-btn ghost" href="contact.html" style="text-decoration:none;display:inline-block">Contact us</a>');
      else gate('<h2>This is for partners</h2><p class="pd-help">Want to earn with GoldTriEngine? See how the partner program works and apply.</p><a class="pd-btn" href="partners.html" style="text-decoration:none;display:inline-block">Become a partner</a>');
      return;
    }
    $('#pd-gate').hidden = true; $('#pd-app').hidden = false;
    $('#pd-name').textContent = S.me.name; $('#pd-status').hidden = S.me.status !== 'paused';
    $('#pd-bar').innerHTML = TABS.map(function (t) { return '<button role="tab" data-t="' + t[0] + '" aria-selected="false">' + t[1] + '</button>'; }).join('');
    $$('#pd-bar button').forEach(function (b) { b.onclick = function () { setTab(b.dataset.t); }; });
    renderAll(); var h = (location.hash || '').slice(1); setTab(TABS.some(function (t) { return t[0] === h; }) ? h : 'overview');
    api('partner_touch', { p_ua: navigator.userAgent.slice(0, 100) }).catch(function () {});
    new MutationObserver(function () { if (S.stats) { drawCharts(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ---------- demo data (only with ?demo=1) ----------
  function demo(fn, a) {
    var day = function (i) { return new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); }, iso = function (i) { return new Date(Date.now() + i * 864e5).toISOString(); };
    var seed = function (n, b, am, s) { var r = [], x = s; for (var i = 0; i < n; i++) { x = (x * 9301 + 49297) % 233280; r.push(Math.max(0, Math.round(b + (x / 233280 - .35) * am))); } return r; };
    var D = window.__demo = window.__demo || { discount: 20, wallet: null, camps: [{ slug: 'yt-review', label: 'YouTube review', clicks: 1420, signups: 118, paid: 17, earned: 1020 }, { slug: 'tg', label: 'Telegram channel', clicks: 880, signups: 64, paid: 9, earned: 540 }, { slug: '', label: '', clicks: 540, signups: 30, paid: 5, earned: 300 }], pay: [{ id: 5, amount: 820, network: 'TRC20', status: 'paid', tx_hash: '9f3ac1d4e8b27a6055c1aa', requested_at: iso(-12), paid_at: iso(-11), wallet_end: 'x7Kp2Q' }] };
    var R = {
      partner_me: function () { return { id: 'd', status: 'active', code: 'RAHIM', name: 'Rahim K.', rateSale: 30, rateRenewal: 15, baseSale: 30, maxDiscount: 30, discountPct: D.discount, network: D.wallet ? 'TRC20' : 'TRC20', wallet: D.wallet || 'TJ4Q...zQ3', walletHoldUntil: null, paidReferrals: 6, goldAt: 10, goldBonus: 5, holdDays: 14, cookieDays: 90, minPayout: 50 }; },
      partner_stats: function () { var n = a.p_days || 30, e = seed(n, 60, 110, n + 5), c = seed(n, 90, 120, n + 9); return { days: n, cur: { clicks: 2840, signups: 212, paid: 31, earned: 1860 }, prev: { clicks: 2400, signups: 194, paid: 27, earned: 1520 }, balances: { hold: 420, ready: 980, requested: 0, paidOut: 1430, lifetime: 2830, nextRelease: iso(5) }, series: e.map(function (x, i) { return { day: day(n - 1 - i), earned: x, clicks: c[i] }; }), hours: [2, 1, 1, 1, 2, 4, 8, 14, 20, 24, 22, 19, 17, 18, 21, 26, 30, 34, 38, 41, 36, 28, 15, 6], devices: { mobile: 1930, desktop: 770, tablet: 140 }, zones: [{ tz: 'Asia/Dhaka', n: 920 }, { tz: 'Asia/Kolkata', n: 610 }, { tz: 'Asia/Dubai', n: 340 }, { tz: 'Asia/Kuala_Lumpur', n: 260 }, { tz: 'Asia/Karachi', n: 190 }], plans: [{ plan: 'Billionaire', n: 14 }, { plan: 'Tycoon', n: 11 }, { plan: 'Investor', n: 6 }] }; },
      partner_campaigns: function () { return D.camps; },
      partner_customers: function () { return [{ customer: '#12', joined: iso(-1), campaign: 'yt-review', stage: 'paid', plan: 'Billionaire', earned: 150, paid_at: iso(-1) }, { customer: '#11', joined: iso(-2), campaign: 'tg', stage: 'signed up', plan: null, earned: 0, paid_at: null }, { customer: '#10', joined: iso(-4), campaign: null, stage: 'paid', plan: 'Tycoon', earned: 60, paid_at: iso(-3) }, { customer: '#9', joined: iso(-9), campaign: 'yt-review', stage: 'refunded', plan: 'Investor', earned: 0, paid_at: iso(-8) }]; },
      partner_ledger_list: function () { return [{ created_at: iso(-1), entry_kind: 'commission', amount: 150, status: 'pending', release_at: iso(13), plan: 'Billionaire' }, { created_at: iso(-20), entry_kind: 'commission', amount: 60, status: 'settled', release_at: iso(-6), plan: 'Tycoon' }, { created_at: iso(-8), entry_kind: 'clawback', amount: -30, status: 'pending', release_at: iso(-8), plan: 'Investor' }]; },
      partner_payouts_list: function () { return D.pay; },
      partner_report: function () { var n = 30, e = seed(n, 40, 90, 3); return e.map(function (x, i) { return { day: day(i), clicks: 100 + e[i], signups: Math.round(e[i] / 12), paid: i % 4 === 0 ? 1 : 0, renewals: i % 9 === 0 ? 1 : 0, refunds: i === 8 ? 1 : 0, commission: x }; }); },
      partner_set_discount: function () { D.discount = a.p_pct; return { ok: true, discountPct: a.p_pct }; },
      partner_set_wallet: function () { D.wallet = a.p_wallet.slice(0, 4) + '...' + a.p_wallet.slice(-4); return { ok: true, holdUntil: null }; },
      partner_campaign_save: function () { var s = String(a.p_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30); D.camps.unshift({ slug: s, label: a.p_name, clicks: 0, signups: 0, paid: 0, earned: 0 }); return { ok: true, slug: s }; },
      partner_request_payout: function () { return { ok: true, payout: 6, amount: 980 }; },
      partner_touch: function () { return null; }, partner_kit_log: function () { return null; }
    };
    return Promise.resolve((R[fn] || function () { return null; })());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
