/* Shared polish for My account, Partner and Admin (see app-layer.css): a progress line when a tab changes a ripple with sparks when a tab is pressed
   and a hint bubble on hover. It only watches the page; nothing it does changes any data. */
(function () {
  'use strict';
  var P = location.pathname, still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var kind = /my-account/.test(P) ? 'ma' : /partner\.html/.test(P) ? 'pd' : /\/admin\//.test(P) ? 'ad' : ''; if (!kind) return;
  var ITEM = {ma: '#subnav a[data-tab]', pd: '.pd-bar > button:not(.pcol)', ad: '#tabs button[data-t]'}[kind];
  var HINT = {
    ma: {Overview: 'Live status, equity and what needs you', Results: 'Profit, drawdown and every closed trade', Trades: 'Open and closed trades, with the story of each', 'Keys & orders': 'Your licence keys and payments'},
    pd: {Overview: 'Your money, traffic and progress', Campaigns: 'One link per place you post', Customers: 'Who bought through you', Reports: 'Earnings, clicks and sales over time', Payouts: 'What you are owed and what was paid', 'Marketing kit': 'Banners, captions and your link'},
    ad: {Orders: 'Payments and what is waiting', Visitors: 'Who is on the site', 'Sign-ups': 'From first visit to account', Licenses: 'Every key and its status', Health: 'Is everything running', Customers: 'Everyone who bought', 'Proof Wall': 'Reviews and results shown on the site', Blog: 'Posts and what they bring in', Support: 'Tickets and chat', Email: 'Messages sent to customers', Revenue: 'Money in, by plan and day', Marketing: 'Campaigns and what they return', Affiliates: 'Partners and payouts', 'Plans & settings': 'Prices and options', Backtest: 'The tested results shown publicly', Videos: 'Shorts and recaps', 'Audit log': 'Who changed what'}
  }[kind] || {};
  function $(s, r) { return (r || document).querySelector(s); }
  function item(t) { return t && t.closest ? t.closest(ITEM) : null; }
  function label(el) { var n = el.textContent.replace(/\d+$/, '').trim(), t = el.getAttribute('data-hint') || ''; return (HINT[n] || t || (el.getAttribute('title') !== n ? el.getAttribute('title') : '') || '').trim(); }
  document.body.classList.add('app-' + kind);

  /* progress line */
  var prog = document.createElement('i'); prog.className = 'app-prog'; document.body.appendChild(prog);
  function sweep() { if (still) return; prog.classList.remove('go'); void prog.offsetWidth; prog.classList.add('go'); }

  /* ripple and sparks */
  function burst(el, e) {
    if (still) return; if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var r = el.getBoundingClientRect(), x = (e.clientX || r.left + r.width / 2) - r.left, y = (e.clientY || r.top + r.height / 2) - r.top;
    var rp = document.createElement('i'); rp.className = 'app-rip'; rp.style.left = x + 'px'; rp.style.top = y + 'px'; el.appendChild(rp); setTimeout(function () { rp.remove(); }, 700);
    for (var k = 0; k < 7; k++) { var sp = document.createElement('i'); sp.className = 'app-spk'; var a = (k / 7) * Math.PI * 2 + Math.random() * .5, d = 18 + Math.random() * 16; sp.style.left = x + 'px'; sp.style.top = y + 'px'; sp.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px'); sp.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px'); el.appendChild(sp); setTimeout(function (n) { return function () { n.remove(); }; }(sp), 800); }
    el.classList.remove('app-press'); void el.offsetWidth; el.classList.add('app-press'); setTimeout(function () { el.classList.remove('app-press'); }, 500);
  }
  document.addEventListener('pointerdown', function (e) { var it = item(e.target); if (it) burst(it, e); }, true);
  document.addEventListener('click', function (e) { var it = item(e.target); if (it && !it.classList.contains('on')) sweep(); }, true);

  /* hint bubble */
  var tip = document.createElement('div'); tip.className = 'app-hint'; document.body.appendChild(tip); var cur = null;
  function showHint(it) {
    var t = label(it); if (!t) return; if (it.getAttribute('title')) { it.setAttribute('data-hint', t); it.removeAttribute('title'); }
    tip.textContent = t; tip.classList.remove('on'); cur = it;
    var r = it.getBoundingClientRect(), side = r.height > 30 && r.width > 110 && r.left < innerWidth / 2;   // a side menu: bubble to the right
    tip.classList.toggle('below', !side);
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = (side ? r.right + 12 : Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px'; tip.style.top = (side ? r.top + r.height / 2 - h / 2 : r.bottom + 10) + 'px';
    requestAnimationFrame(function () { tip.classList.add('on'); });
  }
  if (!(window.matchMedia && matchMedia('(hover:none)').matches)) {
    document.addEventListener('mouseover', function (e) { var it = item(e.target); if (it && it !== cur) showHint(it); else if (!it && cur) { tip.classList.remove('on'); cur = null; } });
    document.addEventListener('click', function () { tip.classList.remove('on'); cur = null; }, true);
    addEventListener('scroll', function () { tip.classList.remove('on'); cur = null; }, {passive: true});
  }

})();
