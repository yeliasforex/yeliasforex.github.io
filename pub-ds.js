/* Public home page: chapter numbers, a light that follows the pointer, and a details sheet for every card (trust points, steps, plans, brokers, Telegram messages).
   Uses the same detail sheet as My account. Only adds; if this file does not load, the page works as before. */
(function () {
  'use strict';
  var main = document.getElementById('main'); if (!main) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var txt = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
  function open_(spec) { if (window.gteSheet && window.gteSheet.open) window.gteSheet.open(spec); }
  function sheet(title, sub, lead, rows, links) {
    return {k: 'explain', title: title, sub: sub, html: (lead ? '<p class="gs-lead">' + E(lead) + '</p>' : '') + (rows && rows.length ? '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + E(r[1]) + '</b></div>'; }).join('') + '</div>' : '')
      + (links || []).filter(function (l) { return l && l[1]; }).map(function (l) { return '<a class="gs-more" href="' + E(l[1]) + '"' + (/^https?:/.test(l[1]) ? ' target="_blank" rel="noopener"' : '') + '>' + E(l[0]) + '</a>'; }).join('')};
  }
  var feed = function () { return window.gtePub && window.gtePub.feed; };
  var money = function (v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2); };
  var href = function (sel, scope) { var a = $(sel, scope || document); return a ? a.getAttribute('href') : ''; };

  /* ---- chapter numbers ---- */
  $$('.pubx-s', main).filter(function (s) { return s.offsetHeight > 0 && s.querySelector('.kicker'); }).forEach(function (s, i) {
    var k = $('.kicker', s); if (k && !$('.ds-n', k)) { var n = document.createElement('span'); n.className = 'ds-n'; n.textContent = String(i + 1).padStart(2, '0'); k.insertBefore(n, k.firstChild); }
  });
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ds-in'); io.unobserve(e.target); } }); }, {threshold: .15}); $$('.pubx-s', main).forEach(function (s) { io.observe(s); }); } else $$('.pubx-s', main).forEach(function (s) { s.classList.add('ds-in'); });

  /* ---- the detail sheets ---- */
  var TRUST = [
    function () { var F = feed(), H = F ? F.history : [], L = H[H.length - 1]; return sheet('Every trade on screen', 'Trust point 1', 'The live XAUUSD chart shows each entry and exit as it happens, with running stats. Losing trades stay on screen too.', F ? [['Trades closed so far', String(F.summary.trades || H.length)], ['Win rate', Number(F.summary.win_rate).toFixed(1) + '%'], ['Net result', money(Number(F.summary.net_profit)), Number(F.summary.net_profit) >= 0 ? 'var(--mint)' : 'var(--red)'], ['Last trade', L ? String(L.side).toUpperCase() + ' ' + money(Number(L.profit)) : '-']] : [], [['Watch the live stream', 'https://www.youtube.com/@GoldTriEngine/live'], ['See the live account', '#account']]); },
    function () { var F = feed(); return sheet('A third-party track record', 'Trust point 2', 'Results are tracked independently on Myfxbook. Every deposit, trade and drawdown is there for anyone to check.', F ? [['Account', (F.account.broker || '') + ' ' + (F.account.type || '')], ['Deposited', '$' + Number(F.summary.deposits).toFixed(2)], ['Balance now', '$' + Number(F.summary.balance).toFixed(2)], ['Deepest dip', Number(F.summary.max_drawdown_pct).toFixed(1) + '%']] : [], [['Open the Myfxbook record', href('#transparency .card a[href*="myfxbook"]')]]); },
    function () { return sheet('A developer with a name', 'Trust point 3', 'GoldTriEngine is built by Yelias, who runs the stream and answers support himself. The voice host is AI and labelled as AI. Nothing is hidden behind an "account manager".', [['Built by', 'Yelias'], ['Voice host', 'AI, labelled as AI'], ['Support', 'Answered by the developer']], [['Message the developer', href('#contact .btn.primary') || 'contact.html']]); }
  ];
  var STEPS = [
    ['The EA trades gold', [['Platform', 'MetaTrader 5'], ['Market', 'Gold (XAUUSD)'], ['Engines', 'Three independent engines'], ['Protection', 'A stop-loss with every trade']], 'The trading is done by the EA alone, on your own MetaTrader 5.', [['See the live account', '#account']]],
    ['The bot reads each event', [['Passes on', 'Entries, exits and account stats'], ['Speed', 'The moment they happen'], ['Decides trades?', 'No, it only reads']], 'The stream bot never makes a trading decision. It reads what the EA did and passes it on.', [['Read how it works', 'guide.html']]],
    ['The host explains it', [['Voice', 'AI, labelled as AI'], ['Explains', 'The trade, the risk and the result'], ['Never', 'Decides a trade or tells anyone to buy or sell']], 'The AI voice only describes what the EA has already done, and answers questions from the live chat.', [['Meet the host', '#host']]],
    ['You watch it live', [['Where', 'YouTube, 24/5'], ['Clips', 'Short daily clips as Shorts'], ['Updates', 'The official Telegram channel']], 'Watch it trade in public, ask the host a question in the chat, and judge it by what it does.', [['Open the live stream', 'https://www.youtube.com/@GoldTriEngine/live']]]
  ];
  function planSheet(el) {
    var t = txt(el), name = (t.match(/(Investor|Tycoon|Mogul|Billionaire)/) || [])[1] || txt($('h3', el)) || 'Plan', price = Number((t.match(/\$([\d,]+)\s*\/\s*year/) || [])[1] && (t.match(/\$([\d,]+)\s*\/\s*year/)[1]).replace(/,/g, '')), cov = (t.match(/up to \$([\d,]+)/) || [])[1], any = /any deposit/i.test(t), lim = cov ? Number(cov.replace(/,/g, '')) : null;
    var rows = [['Price', '$' + price.toLocaleString() + ' per year'], ['Covers', any ? 'Any deposit size' : 'Deposits up to $' + lim.toLocaleString()], ['Per day', '$' + (price / 365).toFixed(2)]];
    if (lim) { rows.push(['Per $1,000 covered', '$' + (price / lim * 1000).toFixed(0)]); rows.push(['With 5% tolerance', 'Up to $' + Math.round(lim * 1.05).toLocaleString()]); }
    var inc = txt($('.plan-inc')).replace(/^every plan includes\s*/i, '');
    return sheet(name + ' plan', 'One yearly licence, one MT5 account', 'A plan is a deposit limit, with 5% tolerance; profits never count against it. ' + (inc ? 'Every plan includes: ' + inc + '.' : ''), rows, [['Choose ' + name, href('a', el)], ['Read the pricing details', 'pricing.html']]);
  }
  function brokerSheet(el) {
    var n = txt($('b, strong, h3', el)) || 'Broker', why = $$('.bk-why li, .bk-why > *', main).map(txt).filter(Boolean).slice(0, 6);
    return sheet(n.split(' Raw')[0], 'A raw-spread account for a gold robot', 'A gold robot that trades often depends on tight spreads, low commission and fast execution, so GoldTriEngine requires a raw account at one of these two brokers.', [['Account type', 'Raw'], ['Platform', 'MetaTrader 5'], ['Market', 'Gold (XAUUSD)']].concat(why.length > 1 ? [['Why raw', 'Tight spreads, fast execution, low commission']] : []), [['Open a ' + n.split(' Raw')[0] + ' account', el.getAttribute('href')], ['Read the broker guide', 'fusion-markets-ic-markets-gold-ea.html']]);
  }
  var TG = {'EA started': 'Sent every time the EA starts on your MetaTrader, so you know it is alive, licensed and which engines are on.', 'Trade opened': 'Sent the moment a trade opens: which engine, which direction, the lot size, the entry price and the stop-loss.', 'EA offline detected': 'Sent when the EA stops reporting for a while, for example because the computer or VPS went offline.', 'EA back online': 'Sent when the EA reports again after being offline, so you know it is trading again.', 'Trade closed': 'Sent when a trade closes: the result, the exit, how long it was held and that engine’s result for the day.', 'Drawdown alert': 'Sent when the account reaches a drawdown level, so a rough patch never surprises you.', 'Daily report': 'Sent once a day: trades, win rate, net result and drawdown for the day.'};
  function tgSheet(el) {
    var t = txt(el), key = Object.keys(TG).filter(function (k) { return t.indexOf(k) === 0; })[0] || t.split(' ').slice(0, 2).join(' ');
    return sheet(key, 'A Telegram message from your EA', TG[key] || t, [['Sample', t.replace(key, '').trim() || '-']], [['See the Telegram channel', href('#contact a[href*="t.me"]') || 'https://t.me/+l7QyD_fRy25mNWJl']]);
  }

  /* ---- wire it up ---- */
  function arm(sel, fn, label) {
    $$(sel, main).forEach(function (el, i) {
      if (el.__ds) return; el.__ds = 1; el.classList.add('ds-card'); if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 0.07).toFixed(2) + 's');
      if (!fn) return; el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', (txt($('h3, h4, b, strong', el)) || 'Details') + ': ' + label);
      var go = function () { var s = fn(el, i); if (s) open_(s); };
      el.addEventListener('click', function (e) { if (e.target.closest('a,button')) return; go(); });
      el.addEventListener('keydown', function (e) { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
      if (!$('.ds-hint', el)) { var h = document.createElement('span'); h.className = 'ds-hint'; h.textContent = label; el.appendChild(h); }
    });
  }
  function armAll() {
    arm('#transparency .card', function (el, i) { return TRUST[i] && TRUST[i](); }, 'Tap for the details');
    arm('#how .step', function (el, i) { var s = STEPS[i]; return s && sheet(s[0], 'Step ' + (i + 1) + ' of 4', s[2], s[1], s[3]); }, 'Tap for the details');
    arm('#license .plan', null);
    var pl = $('#license .plans', main); if (pl && !$('.ds-note', pl.parentNode)) { var nt = document.createElement('p'); nt.className = 'ds-note'; nt.textContent = 'Tap a plan for what it covers, what it costs per day and how the limit works.'; pl.parentNode.insertBefore(nt, pl.nextSibling); }
    arm('#telegram .tg-msg', tgSheet, 'Tap for what it means');
    $$('#brokers .bk', main).forEach(function (el) {       // the card itself is a link to the broker, so the details have their own button
      el.classList.add('ds-card'); if ($('.ds-more', el)) return; var b = document.createElement('button'); b.type = 'button'; b.className = 'ds-more'; b.textContent = 'Why this broker?';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open_(brokerSheet(el)); }); el.appendChild(b);
    });
    arm('#backtest .chart-card', null);
    $$('.ds-card .ds-hint', main).forEach(function (h) { if (!h.textContent) h.remove(); });
  }
  armAll(); var pend = 0; if (window.MutationObserver) new MutationObserver(function () { cancelAnimationFrame(pend); pend = requestAnimationFrame(armAll); }).observe(main, {childList: true, subtree: true});

  /* plan finder extras: how much of the plan's limit the planned deposit uses, and the price per day on every card */
  var busy = false;
  function finderExtras() {
    if (busy) return; busy = true;
    try {
      $$('#license .plan-inc', main).slice(1).forEach(function (x) { x.style.display = 'none'; });
      var amt = Number((txt($('#wowAmt')).match(/[\d,]+/) || ['0'])[0].replace(/,/g, '')), res = $('#wowRes'), lim = res && (txt(res).match(/up to \$([\d,]+)/) || [])[1];
      if (res && lim && !$('.ds-fit', res)) { lim = Number(lim.replace(/,/g, '')); var pc = Math.min(100, amt / lim * 100), f = document.createElement('div'); f.className = 'ds-fit'; f.innerHTML = '<div><i class="' + (pc > 92 ? 'hot' : '') + '" style="width:' + pc.toFixed(0) + '%"></i></div><span>Your planned deposit uses ' + pc.toFixed(0) + '% of this plan\u2019s limit (including the 5% tolerance).</span>'; res.appendChild(f); }
      $$('#license .plan', main).forEach(function (p) { if ($('.ds-pday', p)) return; var m = txt(p).match(/\$([\d,]+)\s*\/\s*year/); if (!m) return; var d = document.createElement('span'); d.className = 'ds-pday'; d.textContent = 'about $' + (Number(m[1].replace(/,/g, '')) / 365).toFixed(2) + ' a day'; var cv = $('.covers', p); if (cv) cv.parentNode.insertBefore(d, cv.nextSibling); else p.appendChild(d); });
    } finally { busy = false; }
  }
  finderExtras(); if (window.MutationObserver) new MutationObserver(function () { requestAnimationFrame(finderExtras); }).observe($('#license', main) || main, {childList: true, subtree: true});

  /* the plan cards are redrawn by the price finder, so their click is delegated */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('#license .plan'); if (!el || e.target.closest('a,button')) return; open_(planSheet(el));
  });
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.ds-card'); if (!el) return; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive: true});
})();
