/* Public home page, order and calm. Keeps the 3D hero exactly as it is. Puts the proof first (live account, then backtest), then the story, then the offer,
   and hides sections that only repeat what is said elsewhere (their text stays in the page source). Only moves existing sections, never deletes text.
   Purely additive: if this file does not load, the page works as before. */
(function () {
  'use strict';
  var main = document.getElementById('main'); if (!main) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var kids = function () { return [].slice.call(main.children); };
  var bare = kids().filter(function (k) { return k.tagName === 'SECTION' && !k.id && k.classList.contains('sec'); });
  var stats = bare[0], tail = kids().filter(function (k) { return k.tagName === 'SECTION' && !k.id && !k.className; }).pop();                                   // the four big numbers, and the "live right now" call to action
  var wl = $('.wow-live', main), ORDER = [stats, 'account', 'backtest', 'transparency', 'free', 'how', 'telegram', 'myaccount', 'host', 'license', 'brokers', 'faq', 'contact'];
  $$('hr.rule', main).forEach(function (h) { h.hidden = true; });
  if (wl) wl.style.display = 'none';                                      // its numbers are the same as the live account
  ['about', 'stream-bot'].forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }); if (tail) tail.style.display = 'none';
  var ref = $('.band', main) || $('#hero-classic', main) || main.firstElementChild;      // the ticker band stays right under the hero
  ORDER.forEach(function (x) { var el = typeof x === 'string' ? document.getElementById(x) : x; if (!el) return; ref.parentNode.insertBefore(el, ref.nextSibling); ref = el; });
  var shown = 0; ORDER.forEach(function (x) { var el = typeof x === 'string' ? document.getElementById(x) : x; if (el && el.classList.contains('sec')) { el.classList.add('pubx-s'); if (shown++ % 2) el.classList.add('pubx-alt'); } });

  /* the four big numbers open their details */
  function open_(spec) { if (window.gteSheet && window.gteSheet.open) window.gteSheet.open(spec); }
  function sheet(title, sub, rows, text) { return {k: 'explain', title: title, sub: sub, html: '<p class="gs-lead">' + E(text) + '</p><div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + E(r[1]) + '</b></div>'; }).join('') + '</div>'}; }
  function statSheet(i) {
    var P = window.gtePub, H = (P && P.feed.history) || [], S = (P && P.feed.summary) || {}, money = function (v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2); };
    if (i === 0) return open_(sheet('Live 24/5', 'What this means', [['Stream', 'YouTube, Monday to Friday'], ['Market', 'Gold (XAUUSD), 24 hours, 5 days'], ['Who trades', 'The EA alone'], ['Who talks', 'An AI host, only to explain']], 'The robot trades by itself and the stream lets you watch it do it. The AI host explains what the EA did; it never decides a trade and never tells anyone to buy or sell.'));
    if (i === 1) return open_(sheet('Three engines', 'Alpha, Beta and Gamma', ['Alpha', 'Beta', 'Gamma'].map(function (n) { var l = H.filter(function (h) { return h.engine === n; }), net = l.reduce(function (a, h) { return a + Number(h.profit || 0); }, 0); return [n + ' (live demo)', l.length + ' trades, ' + money(net), net >= 0 ? 'var(--mint)' : 'var(--red)']; }), 'Three independent engines trade the same gold market, each on its own. The live demo results of each one are listed here, wins and losses alike.'));
    var live = P ? ' Live demo so far: profit factor ' + Number(S.profit_factor || 0).toFixed(2) + ' over ' + (S.trades || H.length) + ' trades.' : '';
    return open_(sheet(i === 2 ? 'Backtest trades' : 'Backtest profit factor', 'MT5 Strategy Tester', [['Period', '1 Jan 2024 to 17 Oct 2026'], ['Market', 'XAUUSD (gold)'], ['Data', 'Fusion Markets'], ['Trades', '1,302'], ['Profit factor', '2.00']], 'These are simulated results. A backtest shows what the rules would have done on past prices; it is not a promise.' + live + ' Open the backtest section to see it month by month.'));
  }
  if (stats) $$('.facts .fact', stats).forEach(function (f, i) { f.tabIndex = 0; f.setAttribute('role', 'button'); f.classList.add('pubx-ck'); f.addEventListener('click', function () { statSheet(i); }); f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); statSheet(i); } }); });

  /* backtest months open their trades */
  var BT = null, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function btTrades(key, label) {
    var go = function (D) {
      var L = (D.months[key] || []).map(function (x) { return {engine: x[7], dir: x[2], is_add: !!x[9], opened_at: new Date(x[0] * 1000).toISOString(), closed_at: new Date(x[1] * 1000).toISOString(), open_price: x[4], close_price: x[5], lots: x[3], profit: x[6], exit_reason: x[8], symbol: 'XAUUSD'}; });
      if (!L.length) return open_(sheet(label, 'Backtest', [['Trades', '0']], 'The robot made no trades in this month.'));
      var net = L.reduce(function (a, t) { return a + t.profit; }, 0), w = L.filter(function (t) { return t.profit > 0; }).length;
      window.GTE_MA = window.GTE_MA || {}; window.GTE_MA.rng = window.GTE_MA.rng || function (a) { return a; }; window.GTE_MA.trades = L;
      open_({k: 'trades', title: label + ' (backtest)', sub: 'Simulated: ' + L.length + ' trades, ' + (net >= 0 ? '+$' : '-$') + Math.abs(net).toFixed(2) + ', ' + Math.round(w / L.length * 100) + '% won. Not live results.', list: L, group: true});
    };
    if (BT) return go(BT); fetch('backtest-trades.json?v=1').then(function (r) { return r.json(); }).then(function (D) { BT = D; go(D); }).catch(function () {});
  }
  document.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('#backtest .m[data-m]'); if (!m || !window.gteSheet) return;
    var mm = /^([A-Za-z]{3})\w*\s+(\d{4})$/.exec(m.dataset.m); if (!mm) return; var mi = MON.indexOf(mm[1]); if (mi < 0) return;
    btTrades(mm[2] + '-' + String(mi + 1).padStart(2, '0'), m.dataset.m);
  });

  /* in-page links (the menu, buttons) always land on their section, even while charts above them are still loading and the page height changes */
  var anim = 0;
  function goTo(el) {
    var t0 = performance.now(), from = scrollY, cancel = function () { anim = 0; }; var id = ++anim;
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, cancel, {once: true, passive: true}); });
    (function step(now) {
      if (anim !== id) return; var p = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - p, 3), y = Math.max(0, el.getBoundingClientRect().top + scrollY - 72);
      scrollTo({top: from + (y - from) * e, behavior: 'auto'});
      if (now - t0 < 1500) requestAnimationFrame(step); else anim = 0;
    })(t0);
    var tick = setInterval(function () {        // the page may still grow while charts load: keep the section under the menu until it settles
      var y = Math.max(0, el.getBoundingClientRect().top + scrollY - 72); if (performance.now() - t0 > 5000 || (anim !== id && anim !== 0 && anim !== -1)) return clearInterval(tick);
      if (performance.now() - t0 > 600 && Math.abs(y - scrollY) > 3 && !moved) scrollTo({top: y, behavior: 'auto'});
    }, 200); var moved = false; ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, function () { moved = true; clearInterval(tick); }, {once: true, passive: true}); });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2 || e.defaultPrevented || a.closest('#pubd')) return;
    var el; try { el = document.querySelector(a.getAttribute('href')); } catch (x) { return; } if (!el || el.offsetHeight === 0) return;
    e.preventDefault(); try { history.replaceState(null, '', a.getAttribute('href')); } catch (x) {} goTo(el);
  });
})();
