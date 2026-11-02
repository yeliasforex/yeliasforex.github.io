/* Public home page, premium layer. Keeps the 3D hero exactly as it is. Puts the proof first (live status, live account, backtest), then the story, then the offer;
   adds a sticky section menu and a live status card that follows the live feed. Only moves existing sections, never deletes text.
   Purely additive: if this file does not load, the page works as before. */
(function () {
  'use strict';
  var main = document.getElementById('main'); if (!main) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var money = function (v, sign) { var n = Number(v) || 0, s = '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); return sign ? (n > 0 ? '+' : n < 0 ? '-' : '') + s : (n < 0 ? '-' : '') + s; };
  var ago = function (iso) { var m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 2 ? 'just now' : m < 90 ? m + ' min ago' : m < 2880 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; };
  var dk = function (d) { var x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };

  /* ---- 1. order: proof first, then how it works, then the offer ---- */
  var kids = function () { return [].slice.call(main.children); };
  var stats = kids().filter(function (k) { return k.tagName === 'SECTION' && !k.id && k.classList.contains('sec'); })[0];       // the four big numbers
  var tail = kids().filter(function (k) { return k.tagName === 'SECTION' && !k.id && k.classList.contains('sec'); })[1];        // "live right now" call to action
  var live = document.createElement('section'); live.id = 'pubx-live'; live.className = 'pubx-live'; live.setAttribute('aria-label', 'Live status');
  var ORDER = ['pubx-live', stats, 'account', 'backtest', 'transparency', 'free', 'how', 'telegram', 'myaccount', 'host', 'license', 'brokers', 'faq', 'contact'];
  var wl = $('.wow-live', main), anchor = wl || $('#hero-classic', main) || main.firstElementChild;
  $$('hr.rule', main).forEach(function (h) { h.hidden = true; });
  if (wl) wl.style.display = 'none';                  // its numbers are the same as the live account section
  var ref = anchor;
  ORDER.forEach(function (x) {
    var el = x === 'pubx-live' ? live : typeof x === 'string' ? document.getElementById(x) : x; if (!el) return;
    ref.parentNode.insertBefore(el, ref.nextSibling); ref = el;
  });
  ['about', 'stream-bot'].forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }); if (tail) tail.style.display = 'none';
  var shown = 0; ORDER.forEach(function (x) { var el = x === 'pubx-live' ? live : typeof x === 'string' ? document.getElementById(x) : x; if (el && el.classList.contains('sec')) { el.classList.add('pubx-s'); if (shown++ % 2) el.classList.add('pubx-alt'); } });

  /* ---- 2. sticky section menu ---- */
  var MENU = [['Live', 'pubx-live'], ['Account', 'account'], ['Backtest', 'backtest'], ['Proof', 'transparency'], ['Try it free', 'free'], ['How it works', 'how'], ['Telegram', 'telegram'], ['My account', 'myaccount'], ['Pricing', 'license'], ['Brokers', 'brokers'], ['FAQ', 'faq'], ['Contact', 'contact']].filter(function (m) { return document.getElementById(m[1]); });
  var bar = document.createElement('nav'); bar.className = 'pubx-bar'; bar.setAttribute('aria-label', 'Sections');
  bar.innerHTML = '<div class="pubx-bar-in">' + MENU.map(function (m) { return '<a href="#' + m[1] + '" data-s="' + m[1] + '">' + E(m[0]) + '</a>'; }).join('') + '</div>';
  var ph = document.createElement('div'); ph.className = 'pubx-ph'; live.parentNode.insertBefore(ph, live); ph.appendChild(bar);
  var fix = function () { var on = ph.getBoundingClientRect().top <= 0; if (on !== bar.classList.contains('fx')) { bar.classList.toggle('fx', on); ph.style.height = on ? bar.offsetHeight + 'px' : ''; } };
  addEventListener('scroll', fix, {passive: true}); addEventListener('resize', fix);
  $$('a', bar).forEach(function (a) { a.addEventListener('click', function (e) { var t = document.getElementById(a.dataset.s); if (!t) return; e.preventDefault(); var y = t.getBoundingClientRect().top + scrollY - bar.offsetHeight - 8; scrollTo({top: Math.max(0, y), behavior: 'smooth'}); }); });
  if ('IntersectionObserver' in window) {
    var cur = null, io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) cur = en.target.id; });
      $$('a', bar).forEach(function (a) { var on = a.dataset.s === cur; a.classList.toggle('on', on); if (on && bar.scrollWidth > bar.clientWidth) { var inn = a.parentNode; inn.scrollTo ? 0 : 0; bar.scrollTo({left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth'}); } });
    }, {rootMargin: '-35% 0px -60% 0px'});
    MENU.forEach(function (m) { var el = document.getElementById(m[1]); if (el) io.observe(el); });
  }

  var FEED = null;
  /* ---- 3. the live status card, from the same feed as the live account section ---- */
  function paint(D) {
    var S = D.summary || {}, A = D.account || {}, H = D.history || [], op = D.open || [], upd = D.updated, mins = (Date.now() - Date.parse(upd)) / 60000;
    var fresh = mins < 45, today = dk(Date.now()), td = H.filter(function (h) { return dk(h.close_time) === today; }), tdSum = td.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0);
    var fl = op.reduce(function (a, o) { return a + Number(o.profit || 0); }, 0), L = H.slice().sort(function (a, b) { return Date.parse(b.close_time) - Date.parse(a.close_time); })[0];
    var wkL = H.filter(function (h) { return Date.now() - Date.parse(h.close_time) < 7 * 864e5; }), wk = wkL.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0), wkn = wkL.length;
    FEED = {D: D, today: td, wk: wkL, L: L, op: op, fresh: fresh, mins: mins};
    var tone = fresh ? 'ok' : 'warn', head = !fresh ? 'Waiting for the next update' : op.length ? 'In a trade right now' : 'Running, watching the market';
    var since = A.started ? new Date(A.started).toLocaleDateString([], {day: 'numeric', month: 'short'}) : '';
    live.innerHTML = '<div class="wrap"><div class="pubx-card ' + tone + '"><button type="button" class="pubx-st" data-t="status"><span class="pubx-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + (fresh ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M12 7v6M12 17h.01"/>') + '</svg></span><div><small class="pubx-k">LIVE DEMO &middot; ' + E(A.broker || 'MetaTrader 5').toUpperCase() + '</small><h2>' + head + '</h2><p>Last report ' + ago(upd) + (since ? ' &middot; trading since ' + since : '') + '. Every number is real and never edited.</p></div></button>'
      + '<div class="pubx-t"><button type="button" data-t="today"><small>TODAY, CLOSED</small><b class="' + (tdSum >= 0 ? 'up' : 'dn') + '">' + money(tdSum, true) + '</b><em>' + td.length + ' trade' + (td.length === 1 ? '' : 's') + '</em></button>'
      + '<button type="button" data-t="open"><small>OPEN TRADES</small><b>' + op.length + '</b><em>' + (op.length ? money(fl, true) + ' floating' : 'none right now') + '</em></button>'
      + '<button type="button" data-t="last"><small>LAST TRADE</small><b class="' + (L && L.profit >= 0 ? 'up' : 'dn') + '">' + (L ? money(L.profit, true) : '-') + '</b><em>' + (L ? E(L.side).toUpperCase() + ' &middot; ' + ago(L.close_time) : '') + '</em></button>'
      + '<button type="button" data-t="week"><small>LAST 7 DAYS</small><b class="' + (wk >= 0 ? 'up' : 'dn') + '">' + money(wk, true) + '</b><em>' + wkn + ' trade' + (wkn === 1 ? '' : 's') + '</em></button></div>'
      + '<div class="pubx-cta"><a class="btn mint" href="#account">See the full account</a><a class="btn" href="#backtest">See the backtest</a></div></div></div>';
    $$('[data-t]', live).forEach(function (b) { b.onclick = function () { tileSheet(b.dataset.t); }; });
    $$('.pubx-cta a', live).forEach(function (a) { a.addEventListener('click', function (e) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return; e.preventDefault(); scrollTo({top: t.getBoundingClientRect().top + scrollY - bar.offsetHeight - 8, behavior: 'smooth'}); }); });
  }

  /* ---- 4. every tile opens its details ---- */
  function open_(spec) { if (window.gteSheet && window.gteSheet.open) window.gteSheet.open(spec); }
  function sheet(title, sub, rows, text, tone) {
    return {k: 'explain', title: title, sub: sub, html: (text ? '<p class="gs-lead">' + text + '</p>' : '') + '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + E(r[1]) + '</b></div>'; }).join('') + '</div>'};
  }
  var UP = 'var(--mint)', DN = 'var(--red)', cl = function (v) { return Number(v) >= 0 ? UP : DN; };
  function tl(list) { return list.map(function (h) { return {engine: {Alpha: 'M', Beta: 'I', Gamma: 'D'}[h.engine] || 'M', dir: h.side === 'sell' ? -1 : 1, is_add: false, opened_at: h.open_time, closed_at: h.close_time, open_price: h.open_price, close_price: h.close_price, lots: h.lots, profit: h.profit}; }); }
  function tileSheet(t) {
    if (!FEED) return; var D = FEED.D, S = D.summary || {}, A = D.account || {};
    window.GTE_MA = window.GTE_MA || {}; window.GTE_MA.trades = tl(D.history || []); window.GTE_MA.rng = window.GTE_MA.rng || function (a) { return a; };
    if (t === 'status') return open_(sheet('Is it running?', 'Live demo on ' + (A.broker || 'MetaTrader 5'), [['Last report', ago(D.updated), FEED.fresh ? UP : 'var(--gold)'], ['Account', (A.broker || '-') + ' ' + (A.type || '')], ['Leverage', A.leverage || '-'], ['Tracking since', A.started ? new Date(A.started).toLocaleDateString([], {day: 'numeric', month: 'long', year: 'numeric'}) : '-']], 'MetaTrader 5 sends the account state to this page automatically, every few minutes. It is shown green when the last report is under 45 minutes old. Nobody types these numbers in.'));
    if (t === 'today') return FEED.today.length ? open_({k: 'trades', title: 'Closed today', sub: FEED.today.length + ' trade' + (FEED.today.length === 1 ? '' : 's') + ', ' + money(FEED.today.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0), true), list: tl(FEED.today), group: true}) : open_(sheet('Nothing closed today yet', 'Live demo', [['Trades closed today', '0'], ['Open trades now', String(FEED.op.length)]], 'The robot only trades when its conditions are met, so some days have no trade at all. That is normal and nothing is broken.'));
    if (t === 'open') return open_(sheet(FEED.op.length ? 'Trades open now' : 'No trade open right now', 'Live demo', FEED.op.length ? FEED.op.map(function (o) { return [(o.engine || 'Trade') + ' ' + String(o.side || '').toUpperCase() + ' ' + (o.lots || ''), money(o.profit, true), cl(o.profit)]; }) : [['Open trades', '0']], FEED.op.length ? 'The result of an open trade is floating: it changes until the trade closes.' : 'The EA is watching the market. When its conditions are met it opens a trade, with the stop-loss placed at the same moment.'));
    if (t === 'last') return FEED.L && window.gteSheet ? window.gteSheet.trade(tl([FEED.L])[0]) : null;
    if (t === 'week') { var w = FEED.wk; return w.length ? open_({k: 'trades', title: 'Last 7 days', sub: w.length + ' trades, ' + money(w.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0), true), list: tl(w), group: true}) : open_(sheet('No trades in the last 7 days', 'Live demo', [['Trades', '0']], 'Quiet weeks happen. The robot does not trade just to be busy.')); }
  }
  var fmt = function (v) { return money(v); };
  function kpiSheet(key) {
    if (!FEED) return; var D = FEED.D, S = D.summary || {}, H = D.history || [], wins = H.filter(function (h) { return h.profit > 0; }), loss = H.filter(function (h) { return h.profit < 0; }), sum = function (l) { return l.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0); };
    var curve = D.equity_curve || [], pk = 0, dd = 0; curve.forEach(function (p) { var v = Number(p[1]); pk = Math.max(pk, v); dd = Math.max(dd, pk - v); });
    var M = {
      balance: ['Balance', [['Balance now', fmt(S.balance)], ['Deposited', fmt(S.deposits)], ['Result of closed trades', money(S.net_profit, true), cl(S.net_profit)]], 'The money in the account, counting only trades that have closed.'],
      equity: ['Equity', [['Equity now', fmt(S.equity)], ['Balance', fmt(S.balance)], ['Open trades', String(FEED.op.length)]], 'Balance plus the floating result of open trades. With nothing open it equals the balance.'],
      net: ['Net profit', [['Net result', money(S.net_profit, true), cl(S.net_profit)], ['On deposits', (Number(S.gain_pct) >= 0 ? '+' : '') + Number(S.gain_pct || 0).toFixed(2) + '%'], ['Winners earned', money(sum(wins), true), UP], ['Losers cost', money(sum(loss), true), DN]], 'Everything the winning trades earned minus everything the losing trades cost. A demo account uses no real money, and a few weeks is a short time to judge any strategy.'],
      deposits: ['Deposits', [['Deposited', fmt(S.deposits)], ['Withdrawn', fmt(S.withdrawals)]], 'The money put into this demo account. Profit and loss are measured against it.'],
      winrate: ['Win rate', [['Win rate', Number(S.win_rate || 0).toFixed(1) + '%'], ['Winning trades', String(wins.length), UP], ['Losing trades', String(loss.length), DN], ['Average win', money(wins.length ? sum(wins) / wins.length : 0, true), UP], ['Average loss', money(loss.length ? sum(loss) / loss.length : 0, true), DN]], 'Win rate alone does not say whether a strategy makes money. Compare the average win with the average loss: a robot can win half its trades and still profit if the wins are bigger.'],
      maxdd: ['Max drawdown', [['Largest fall from a peak', Number(S.max_drawdown_pct || 0).toFixed(2) + '%'], ['In dollars', fmt(dd)], ['Profit factor', Number(S.profit_factor || 0).toFixed(2)]], 'The biggest drop from the highest point the account reached. Profit factor is what the winners earned divided by what the losers cost: above 1.00 is a profit, below 1.00 is a loss.']
    }[key];
    if (M) open_(sheet(M[0], 'Live demo account', M[1], M[2]));
  }
  var KP = ['balance', 'equity', 'net', 'deposits', 'winrate', 'maxdd'];
  function bindKpis() { $$('#account .kpis .kpi').forEach(function (k, i) { if (k.dataset.pb || !KP[i]) return; k.dataset.pb = 1; k.tabIndex = 0; k.setAttribute('role', 'button'); k.classList.add('pubx-ck'); k.addEventListener('click', function () { kpiSheet(KP[i]); }); k.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kpiSheet(KP[i]); } }); }); }
  function statSheet(i) {
    var D = FEED && FEED.D, H = (D && D.history) || [], bt = '1 Jan 2024 to 17 Oct 2026';
    if (i === 0) return open_(sheet('Live 24/5', 'What this means', [['Stream', 'YouTube, Monday to Friday'], ['Market', 'Gold (XAUUSD), 24 hours, 5 days'], ['Who trades', 'The EA alone'], ['Who talks', 'An AI host, only to explain']], 'The robot trades by itself and the stream lets you watch it do it. The AI host explains what the EA did; it never decides a trade and never tells anyone to buy or sell.'));
    if (i === 1) { var rows = ['Alpha', 'Beta', 'Gamma'].map(function (n) { var l = H.filter(function (h) { return h.engine === n; }), net = l.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0); return [n + ' (live demo)', l.length + ' trades, ' + money(net, true), cl(net)]; }); return open_(sheet('Three engines', 'Alpha, Beta and Gamma', rows, 'Three independent engines trade the same gold market, each on its own. The live demo results of each one are listed here, wins and losses alike.')); }
    var live = FEED ? ' Live demo so far: profit factor ' + Number(D.summary.profit_factor || 0).toFixed(2) + ' over ' + (D.summary.trades || H.length) + ' trades.' : '';
    return open_(sheet(i === 2 ? 'Backtest trades' : 'Backtest profit factor', 'MT5 Strategy Tester', [['Period', bt], ['Market', 'XAUUSD (gold)'], ['Data', 'Fusion Markets'], ['Trades', '1,302'], ['Profit factor', '2.00']], 'These are simulated results. A backtest shows what the rules would have done on past prices; it is not a promise.' + live + ' Open the backtest section to see it month by month.'));
  }
  function bindStats() { if (!stats) return; $$('.facts .fact', stats).forEach(function (f, i) { if (f.dataset.pb) return; f.dataset.pb = 1; f.tabIndex = 0; f.setAttribute('role', 'button'); f.classList.add('pubx-ck'); f.addEventListener('click', function () { statSheet(i); }); f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); statSheet(i); } }); }); }
  bindStats(); setInterval(bindKpis, 1200); setTimeout(bindKpis, 300);

  /* ---- 5. every live trade and every backtest month opens its trades, with the same sheet as My account ---- */
  function histList() {
    var f = ($('#account .p-hist .seg button[aria-pressed="true"]') || {dataset: {}}).dataset.f || 'all';
    var h = ((FEED && FEED.D.history) || []).slice().sort(function (a, b) { return Date.parse(b.close_time) - Date.parse(a.close_time); });
    return f === 'win' ? h.filter(function (t) { return +t.profit > 0; }) : f === 'loss' ? h.filter(function (t) { return +t.profit <= 0; }) : h;
  }
  document.addEventListener('click', function (e) {
    if (!FEED || !window.gteSheet) return;
    window.GTE_MA = window.GTE_MA || {}; window.GTE_MA.trades = tl((FEED.D.history) || []); window.GTE_MA.rng = window.GTE_MA.rng || function (a) { return a; };
    var tr = e.target.closest && e.target.closest('#histBody tr'), ot = e.target.closest && e.target.closest('#openList .otrade');
    if (tr) { var i = $$('#histBody tr').indexOf(tr), t = histList()[i]; if (t) window.gteSheet.trade(tl([t])[0]); return; }
    if (ot) {
      var o = (FEED.D.open || [])[$$('#openList .otrade').indexOf(ot)]; if (!o) return; var pl = Number(o.profit || 0);
      open_(sheet(String(o.side || '').toUpperCase() + ' ' + Number(o.lots || 0).toFixed(2) + ' lots, open now', (o.engine || 'Trade') + ' &middot; live demo', [['Floating result', money(pl, true), cl(pl)], ['Opened', o.open_time ? new Date(o.open_time).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '-'], ['Entry price', Number(o.open_price).toFixed(2)], ['Stop-loss', o.sl ? Number(o.sl).toFixed(2) : 'none'], ['Take-profit', o.tp ? Number(o.tp).toFixed(2) : 'none']], 'This trade is still open, so its result changes until it closes. The stop-loss was placed at the same moment the trade opened.'));
    }
  });
  var BT = null, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function btTrades(key, label) {
    var go = function (D) {
      var L = (D.months[key] || []).map(function (x) { return {engine: x[7], dir: x[2], is_add: !!x[9], opened_at: new Date(x[0] * 1000).toISOString(), closed_at: new Date(x[1] * 1000).toISOString(), open_price: x[4], close_price: x[5], lots: x[3], profit: x[6], exit_reason: x[8], symbol: 'XAUUSD'}; });
      if (!L.length) return open_(sheet(label, 'Backtest', [['Trades', '0']], 'The robot made no trades in this month.'));
      var net = L.reduce(function (a, t) { return a + t.profit; }, 0), w = L.filter(function (t) { return t.profit > 0; }).length;
      window.GTE_MA = window.GTE_MA || {}; window.GTE_MA.rng = window.GTE_MA.rng || function (a) { return a; }; window.GTE_MA.trades = L;
      open_({k: 'trades', title: label + ' (backtest)', sub: 'Simulated: ' + L.length + ' trades, ' + money(net, true) + ', ' + Math.round(w / L.length * 100) + '% won. Not live results.', list: L, group: true});
    };
    if (BT) return go(BT); fetch('backtest-trades.json?v=1').then(function (r) { return r.json(); }).then(function (D) { BT = D; go(D); }).catch(function () {});
  }
  document.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('#backtest .m[data-m]'); if (!m || !window.gteSheet) return;
    var mm = /^([A-Za-z]{3})\w*\s+(\d{4})$/.exec(m.dataset.m); if (!mm) return; var mi = MON.indexOf(mm[1]); if (mi < 0) return;
    btTrades(mm[2] + '-' + String(mi + 1).padStart(2, '0'), m.dataset.m);
  });
  var src = ($('#account') || {getAttribute: function () { return null; }}).getAttribute('data-src');
  if (src) fetch(src, {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (D) { if (D) paint(D); else live.hidden = true; }).catch(function () { live.hidden = true; }); else live.hidden = true;
})();
