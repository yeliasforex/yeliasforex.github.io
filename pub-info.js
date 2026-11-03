/* Public home page: every remaining box and tile opens its details (what the number means, where it comes from, what to look at next).
   Same detail sheet as My account. Only adds; if this file does not load, the page works as before. */
(function () {
  'use strict';
  var main = document.getElementById('main'); if (!main) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var txt = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
  function open_(spec) { if (window.gteSheet && window.gteSheet.open) window.gteSheet.open(spec); }
  function sheet(title, sub, lead, rows, links) {
    return {k: 'explain', title: title, sub: sub, html: (lead ? '<p class="gs-lead">' + E(lead) + '</p>' : '') + (rows && rows.length ? '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b>' + E(r[1]) + '</b></div>'; }).join('') + '</div>' : '')
      + (links || []).filter(function (l) { return l && l[1]; }).map(function (l) { return '<a class="gs-more" href="' + E(l[1]) + '"' + (/^https?:/.test(l[1]) ? ' target="_blank" rel="noopener"' : '') + '>' + E(l[0]) + '</a>'; }).join('')};
  }
  var BT = 'MT5 Strategy Tester, XAUUSD, 1 Jan 2024 to 31 Oct 2026, Fusion Markets data. Simulated: a backtest shows what the rules would have done on past prices, not a promise.';
  var DEF = {
    'profit factor': ['Profit factor', 'The money the winning trades earned divided by the money the losing trades cost. Above 1.00 the run is in profit; 2.00 means the winners earned twice what the losers cost.'],
    'trades': ['Trades', 'How many trades the EA closed in this run. More trades make the other numbers more reliable than a handful of lucky ones.'],
    'winning trades': ['Winning trades', 'The share of trades that closed in profit. A win rate alone says little: compare it with the average win and average loss.'],
    'average win': ['Average win versus average loss', 'The size of an average winning trade divided by the size of an average losing trade. A robot can win less than half its trades and still profit if its wins are bigger.'],
    'largest drawdown': ['Largest drawdown', 'The biggest fall from a high point of the account, as a share of that high point. It is the rough patch you would have lived through at its worst.'],
    'largest equity drawdown': ['Largest drawdown', 'The biggest fall from a high point of the account, as a share of that high point. It is the rough patch you would have lived through at its worst.'],
    'average time': ['Average time in a trade', 'How long a typical trade stays open from entry to exit.'],
    'months positive': ['Months positive', 'How many calendar months of the run ended in profit, out of all months tested. Tap a month in the backtest section to see its trades.']
  };
  function defFor(el, scope) {
    var t = txt(el).toLowerCase(), k = Object.keys(DEF).filter(function (x) { return t.indexOf(x) >= 0; })[0]; if (!k) return null; var d = DEF[k], val = txt($('b', el)) || (txt(el).match(/^[\d.,%x× ]+/) || [''])[0];
    return sheet(d[0], scope, d[1], [['Value', val || '-'], ['Run', scope === 'Published backtest' ? 'Simulated, not live' : 'Backtest']], [['Backtest it yourself, free', 'free-backtest.html'], ['See it month by month', '#backtest']]);
  }
  var WHY = {'tight spreads': 'The spread is what you pay to enter. A robot that trades often pays it again and again, so a raw account with tight spreads removes a cost on every single entry.', 'fast execution': 'Orders must fill at the price the EA asked for. Slow fills turn a planned entry into a worse one, so both brokers are chosen for fast, reliable execution.', 'low commission': 'Raw accounts show the market price with a small fixed fee instead of a wide spread. For a frequent trader that is cheaper and easier to see.'};
  var HERE = {
    'your balance': ['Your balance', 'What your amount would be today if you had started with it at the beginning of the backtest and the EA traded exactly as it did, with the lot size growing with the balance. Simulated, not a promise.'],
    'best month': ['Best month so far', 'The strongest month of the backtest up to the point the tour has reached, with its percentage and its dollar result.'],
    'worst month': ['Worst month so far', 'The weakest month so far. Every strategy has bad months; this is the worst one the tour has reached, shown on purpose.'],
    '2024 return': ['Yearly returns', 'The backtest result of each calendar year on the amount you picked. The current year shows the year to date.'],
    '2025 return': ['Yearly returns', 'The backtest result of each calendar year on the amount you picked. The current year shows the year to date.'],
    'ytd return': ['Year to date', 'The result of the current year up to the point reached.'],
    'profit factor': ['Profit factor', DEF['profit factor'][1]], 'trades': ['Trades', DEF.trades[1]], 'winning': ['Winning trades', DEF['winning trades'][1]], 'largest drawdown': ['Largest drawdown', DEF['largest equity drawdown'][1]]
  };
  function heroSheet(el) {
    var t = txt(el).toLowerCase(), k = Object.keys(HERE).filter(function (x) { return t.indexOf(x) >= 0; })[0]; if (!k) return null; var d = HERE[k];
    return sheet(d[0], 'Try it with your own money', d[1], [['Shown now', txt(el).slice(0, 80)], ['Source', 'MT5 backtest, simulated']], [['Backtest it yourself, free', 'free-backtest.html'], ['Open the backtest section', '#backtest']]);
  }
  var TG = {'start and stop': ['Start and stop', 'Every time the EA starts or stops you get a message with its version, which engines are on, the licence status, balance and equity, so you always know it is alive.'], 'offline watch': ['Offline watch', 'A built-in heartbeat warns you with "EA offline detected" if MT5 stops (computer asleep, internet down, VPS restart), and says "EA back online" when it recovers.'], 'every trade': ['Every trade', 'Each trade opened and closed is sent with the engine, the direction, the stop-loss and the result.'], 'pending orders': ['Pending orders', 'When an order is placed, changed or removed you hear about it, so a waiting order never surprises you.'], 'risk alerts': ['Risk alerts', 'Drawdown warnings at the levels you choose, and a message whenever a risk limit blocks a trade.'], 'daily report': ['Daily report', 'Every evening: trades, win rate, net result and drawdown for the day.']};
  var SIM = {'live status': ['Live status', 'The first thing in My account: is the EA running, when it last reported, its version, and what to do if something needs attention.'], 'today, closed': ['Today, closed', 'The result of the trades that closed today on your account.'], 'open trades': ['Open trades', 'How many trades are open right now and their floating result.'], 'floating': ['Floating result', 'The profit or loss of open trades if they closed now. It changes until they close.'], 'last 7 days': ['Last 7 days', 'A key fact in My account: the net result of the last week and the number of trades. Tap it there for the days.'], 'best day': ['Best day', 'Your strongest trading day, with the trades behind it one tap away.'], 'equity curve': ['Equity curve', 'The result of your closed trades over time. Tap any point in My account to see the trades of that day.'], 'gamma': ['Recent trades', 'Your latest closed trades with engine, direction, size, time held and result. Tap one for its full story.']};
  function simSheet(el) {
    var t = txt(el).toLowerCase(), k = Object.keys(SIM).filter(function (x) { return t.indexOf(x) >= 0; })[0] || 'live status', d = SIM[k];
    return sheet(d[0], 'My account, example data', d[1], [['Shown here', txt(el).slice(0, 70)], ['In your own account', 'Your real numbers, updated live']], [['Open my account', 'my-account.html'], ['Create a free account', 'signin.html']]);
  }
  var BOXES = [
    ['#backtest .stats > div', function (el) { return defFor(el, 'Backtest'); }],
    ['#backtest .months', function () { return sheet('Months closed positive', 'Backtest', 'Each cell is one calendar month of the run: green closed in profit, red in loss. Tap a month to see every trade of that month.', [['Months positive', txt($('#backtest .months-head, #backtest .months h3')).slice(0, 40) || '28 of 34'], ['Run', 'Simulated']], [['Backtest it yourself, free', 'free-backtest.html']]); }],
    ['.fz-stats > div', function (el) { return defFor(el, 'Published backtest'); }],
    ['.fz-file', function () { return sheet('GoldTriEngine.ex5', 'Free backtest download', 'The real EA, free for backtesting: it runs in the MT5 Strategy Tester on your own computer and needs no licence key. Live trading needs a licence.', [['Works in', 'MT5 Strategy Tester'], ['Symbol', 'XAUUSD (gold)'], ['Time', 'About 5 minutes']], [['Go to the free backtest', 'free-backtest.html']]); }],
    ['#brokers .bk-why > div', function (el) { var t = txt(el).toLowerCase(), k = Object.keys(WHY).filter(function (x) { return t.indexOf(x) === 0; })[0]; return sheet(txt($('b, strong', el)) || 'Why a raw account', 'Why GoldTriEngine needs a raw account', WHY[k] || txt(el), [['Required', 'Raw account at Fusion Markets or IC Markets'], ['Platform', 'MetaTrader 5']], [['Read the broker guide', 'fusion-markets-ic-markets-gold-ea.html']]); }],
    ['#contact li.safe', function () { return sheet('Stay safe', 'Scam protection', 'We never message you first and never ask for your MT5 password, your broker login or any key. The only support account is @GoldTriEngine_Support, so be careful with look-alike names.', [['Official support', '@GoldTriEngine_Support'], ['We never ask for', 'MT5 password or broker login'], ['We never', 'Message you first']], [['Message the real support', 'https://t.me/GoldTriEngine_Support'], ['Open a support ticket', 'contact.html#write']]); }],
    ['.host-bubble', function (el) { return sheet(txt($('b, strong', el)) || 'The AI host', 'Meet the host', txt(el), [['Voice', 'AI, labelled as AI'], ['Role', 'Explains what the EA did'], ['Never', 'Decides a trade or tells anyone to buy or sell']], [['Watch live', 'https://www.youtube.com/@GoldTriEngine/live']]); }],
    ['#license .plan-inc', function (el) { return sheet('Every plan includes', 'All four plans', 'The plans only differ in how much money you deposit. Everything else is the same.', $$('li', el).map(function (l, i) { return [String(i + 1), txt(l)]; }), [['See the plans', 'pricing.html'], ['Questions about licences', 'contact.html#write']]); }],
    ['#myaccount .mx-live, #myaccount .mx-tiles > div, #myaccount .mx-facts > div, #myaccount .mx-chart, #myaccount .mx-trades', simSheet],
    ['#telegram .tg-list li', function (el) { var t = txt(el).toLowerCase(), k = Object.keys(TG).filter(function (x) { return t.indexOf(x) === 0; })[0], d = TG[k] || ['Notification', txt(el)]; return sheet(d[0], 'A Telegram alert from your EA', d[1], [['Switch on or off', 'Each alert type can be switched on or off'], ['Times and messages', 'The phone sample is an example']], [['See the Telegram channel', 'https://t.me/+l7QyD_fRy25mNWJl']]); }],
    ['#gx .stats .big, #gx .stats > div, #gx .strip > div', heroSheet]
  ];
  function arm() {
    BOXES.forEach(function (b) {
      $$(b[0], document).forEach(function (el) {
        if (el.__info || el.closest('a,button,summary')) return; el.__info = 1; el.classList.add('ds-clk'); el.tabIndex = 0; el.setAttribute('role', 'button');
        var go = function () { var s = b[1](el); if (s) open_(s); };
        el.addEventListener('click', function (e) { if (e.target.closest('a,button,input,.m[data-m]')) return; go(); });   // a month cell opens its own month, not the card
        el.addEventListener('keydown', function (e) { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
      });
    });
  }
  arm(); var pend = 0; if (window.MutationObserver) new MutationObserver(function () { cancelAnimationFrame(pend); pend = requestAnimationFrame(arm); }).observe(document.body, {childList: true, subtree: true});
})();
