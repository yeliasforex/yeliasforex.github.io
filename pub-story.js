/* Home page: the animated "How it works" pipeline with the host robot, and the Brokers section with exact terms and the reasons we chose each broker.
   Broker terms were read from the brokers' own official pages on 3 Nov 2026 and are shown with their source; they can change, so the broker's page is linked.
   Additive: the original markup is only hidden, never deleted. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function open_(spec) { if (window.gteSheet && window.gteSheet.open) window.gteSheet.open(spec); }

  /* ================= How it works: living pipeline + the host ================= */
  var how = document.getElementById('how'), pipe = how && $('.pipe', how);
  if (pipe && !$('.wow-pipe', pipe)) {
    var NODES = [
      {k: 'EA', t: 'MT5', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="ic-draw" d="M8 33 L18 22 L25 28 L40 12" fill="none" stroke="var(--mint)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle class="ic-dot" r="3.2" fill="var(--mint)"><animateMotion dur="3s" repeatCount="indefinite" path="M8 33 L18 22 L25 28 L40 12" keyPoints="0;1;1" keyTimes="0;.7;1" calcMode="linear"/></circle></svg>'},
      {k: 'Bot', t: 'Stream bot', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect class="ic-ring" x="9" y="9" width="30" height="30" rx="8" fill="none" stroke="var(--ac)" stroke-width="2.4" stroke-dasharray="8 6"/><path class="ic-plus" d="M24 17v14M17 24h14" stroke="var(--ac)" stroke-width="3" stroke-linecap="round"/></svg>'},
      {k: 'Host', t: 'AI host', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="var(--vio)" stroke-width="3.4" stroke-linecap="round"><path class="ic-bar b1" d="M13 20v8"/><path class="ic-bar b2" d="M19 14v20"/><path class="ic-bar b3" d="M25 18v12"/><path class="ic-bar b4" d="M31 11v26"/><path class="ic-bar b5" d="M37 19v10"/></g></svg>'},
      {k: 'You', t: 'You', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="ic-rip" cx="24" cy="24" r="14" fill="none" stroke="var(--red)" stroke-width="2"/><circle class="ic-rip r2" cx="24" cy="24" r="14" fill="none" stroke="var(--red)" stroke-width="2"/><path d="M20 16.5 L33 24 L20 31.5 Z" fill="var(--red)"/></svg>'}
    ];
    var wp = document.createElement('div'); wp.className = 'wow-pipe';
    wp.innerHTML = '<div class="wow-robot" aria-label="The AI host"><div class="wow-rb-glow"></div><div class="wow-rb-frame"></div><div class="wow-rb-bub"><b>I explain every trade.</b><span>I never decide one.</span></div></div>'
      + '<div class="wow-nodes">' + NODES.map(function (n, i) { return '<div class="wow-node" data-i="' + i + '"><div class="wow-orb2"><i></i><span>' + n.svg + '</span></div>' + (i < 3 ? '<div class="wow-wire"><i></i><i></i><i></i></div>' : '') + '</div>'; }).join('') + '</div>';
    var svg = $('.pipe-svg', pipe); if (svg) svg.style.display = 'none'; pipe.insertBefore(wp, $('.pipe-steps', pipe));
    var steps = $$('.step', pipe), nodes = $$('.wow-node', wp), cur = -1, frame = $('.wow-rb-frame', wp), loaded = false;
    var prev = 0, walkT = 0;
    function setOn(i) { nodes.forEach(function (n, k) { n.classList.toggle('on', k === i); n.classList.toggle('done', k < i); }); steps.forEach(function (s, k) { s.classList.toggle('pipe-on', k === i); }); wp.classList.toggle('talk', i === 2); var im = $('img.rb', frame); if (im) im.src = POSES[i] || POSES[2]; wp.style.setProperty('--rx', (12.5 + 25 * i) + '%');           // the host walks to the circle of the active step and stands on it
      if (i !== prev) { post({pose: i > prev ? 'side' : 'side2'}); clearTimeout(walkT); walkT = setTimeout(function () { post({pose: 'wave'}); }, 950); } prev = i; }
    function post(m) { try { var f = $('iframe', frame); f && f.contentWindow && f.contentWindow.postMessage(m, '*'); } catch (e) {} }
    function scheme() { var t = document.documentElement.getAttribute('data-theme'); return t === 'dark' || t === 'light' ? t : (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }
    function syncScheme() { post({scheme: scheme()}); }
    new MutationObserver(syncScheme).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    var POSES = ['host-point.webp', 'host-think.webp', 'host-wave.webp', 'host-thumbs.webp'];
    function loadRobot() {
      if (loaded) return; loaded = true;
      if (still) { frame.innerHTML = '<img class="rb" src="host-wave.webp" alt="Host robot">'; return; }
      var f = document.createElement('iframe'); f.title = 'Host robot'; f.setAttribute('loading', 'lazy'); f.setAttribute('tabindex', '-1'); f.allowTransparency = true; f.src = 'robot3d.html?scene=happy&full=1&cs=' + scheme() + '&v=20261103cs1'; frame.appendChild(f); frame.addEventListener('click', function () { post({pose: 'wave', talk: 1800}); });
    }
    var timer = 0; function run() { clearInterval(timer); cur = -1; timer = setInterval(function () { cur = (cur + 1) % 4; setOn(cur); }, 2100); setOn(0); cur = 0; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { loadRobot(); if (!timer) run(); wp.classList.add('live'); } else { clearInterval(timer); timer = 0; wp.classList.remove('live'); } }); }, {threshold: .25}).observe(wp);
    } else { loadRobot(); run(); }
    nodes.forEach(function (n, i) { n.addEventListener('pointerenter', function () { clearInterval(timer); timer = 0; cur = i; setOn(i); }); n.addEventListener('pointerleave', function () { if (!timer) timer = setInterval(function () { cur = (cur + 1) % 4; setOn(cur); }, 2100); }); n.addEventListener('click', function () { var s = steps[i]; if (s) s.click(); }); });
    addEventListener('pointermove', function (e) { if (!loaded || document.hidden) return; var r = frame.getBoundingClientRect(); post({look: [Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * .45))), Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight * .5)))]}); }, {passive: true});
  }

  /* ================= Brokers: exact terms, why we chose them ================= */
  var sec = document.getElementById('brokers'); if (!sec || $('.wow-bk', sec)) return;
  var old = $$('a.bk', sec), hrefs = old.map(function (a) { return a.getAttribute('href'); }), logos = old.map(function (a) { var l = $('.bk-logo', a); return l ? l.outerHTML.replace(/ loading="lazy"/g, '') : ''; });
  var B = [
    {id: 'fusion', name: 'Fusion Markets', acct: 'Zero account', role: 'Source of our published backtest data', href: hrefs[0] || 'https://fusionmarkets.com', logo: logos[0], src: 'https://fusionmarkets.com/en/Trading/Zero-Trading-Account', srcName: 'fusionmarkets.com, Zero account page',
      facts: [['Spreads from', '0.0 pips'], ['Commission', '$2.25 per lot, per side'], ['Round turn', '$4.50 per lot'], ['All-in cost (their figure)', 'about 0.5 pips'], ['Platforms', 'MT4, MT5, cTrader, TradingView'], ['Minimum account size', 'None'], ['Withdrawal fees', 'None'], ['Minimum trade size', '0.01 lot (forex, metals, commodities)']],
      reg: ['Australia: FMGP Trading Group Pty Ltd, AFSL 385620', 'Vanuatu: Gleneagle Securities Pty Ltd, VFSC', 'Seychelles: Fusion Markets International Ltd, FSA licence SD096'],
      why: ['The lowest commission of the two: $4.50 against $7.00 per lot round trip, which matters for a robot that trades often.', 'Our published backtest used Fusion Markets data, so the live conditions match what you saw tested.', 'No minimum account size and no withdrawal fees, so your first licence costs nothing extra to start.', 'Its own page calls the Zero account "perfect for EAs".'], bar: 4.5, key: [0, 1, 4, 5]},
    {id: 'ic', name: 'IC Markets', acct: 'Raw Spread account', role: 'Supported by GoldTriEngine', href: hrefs[1] || 'https://www.icmarkets.com', logo: logos[1], src: 'https://ic.com/trading-accounts/overview', srcName: 'ic.com, account overview',
      facts: [['Spreads from', '0.0 pips (EUR/USD average 0.1)'], ['Commission', '$3.50 per lot, per side'], ['Round turn', '$7.00 per lot'], ['Platforms', 'MetaTrader 4 and 5'], ['Minimum deposit', '$0'], ['Maximum leverage', '1:5000'], ['Servers', 'Equinix NY4, New York'], ['Prices from', 'up to 25 institutional sources']],
      reg: ['International entity: Raw Trading Ltd, Seychelles FSA, Securities Dealer licence SD018'],
      why: ['Built for "day traders, scalpers and expert advisors", in the broker’s own words.', 'MetaTrader servers sit in the Equinix NY4 data centre, a major trading hub, for fast order handling.', 'Prices are aggregated from up to 25 institutional sources, so quotes stay tight.', 'The same raw-spread model as Fusion, so the EA’s trading costs stay low on either broker.'], bar: 7, key: [0, 1, 3, 4]}
  ];
  var WHYRAW = [['Tight spreads', 'You pay the spread on every entry, so a robot that trades often needs it near zero.', '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="bk-pulse" d="M4 26 H14 L19 12 L27 38 L32 22 L36 26 H44" fill="none" stroke="var(--mint)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'], ['Fast execution', 'Orders must fill at the price the EA asked for. Slow fills turn a plan into a worse entry.', '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" fill="none" stroke="var(--ac)" stroke-width="3"/><path class="bk-hand" d="M24 24 V13" stroke="var(--ac)" stroke-width="3" stroke-linecap="round"/><path class="bk-hand2" d="M24 24 L32 28" stroke="var(--ac)" stroke-width="3" stroke-linecap="round"/></svg>'], ['Low commission', 'Raw pricing plus a small fixed fee is cheaper for a frequent trader and easier to read.', '<svg viewBox="0 0 48 48" aria-hidden="true"><g class="bk-coin"><circle cx="24" cy="24" r="16" fill="none" stroke="var(--vio)" stroke-width="3"/><path d="M28 17.5c-1-1.5-8-2-8 2 0 5 9 2 9 7 0 4-8 4-9 1.5M24 14v20" fill="none" stroke="var(--vio)" stroke-width="2.6" stroke-linecap="round"/></g></svg>']];
  var disc = $('.foot-note', sec);
  var box = document.createElement('div'); box.className = 'wow-bk';
  box.innerHTML = '<div class="wow-why">' + WHYRAW.map(function (w, i) { return '<button type="button" class="wow-why-i ds-clk" data-w="' + i + '"><span class="wi">' + w[2] + '</span><b>' + E(w[0]) + '</b><em>' + E(w[1]) + '</em></button>'; }).join('') + '</div>'
    + '<div class="wow-bks">' + B.map(function (b, i) {
      return '<article class="wow-b ds-card" data-b="' + i + '"><header><span class="wb-logo">' + (b.logo || '<b>' + E(b.name.charAt(0)) + '</b>') + '</span><div><h3>' + E(b.name) + '</h3><small>' + E(b.acct) + ' &middot; MT5</small></div><span class="wb-role">' + E(b.role) + '</span></header>'
        + '<div class="wb-cost"><small>Commission, one lot round trip</small><div class="wb-bar"><i style="--w:' + (b.bar / 7 * 100).toFixed(0) + '%"></i></div><b>$' + b.bar.toFixed(2) + '</b></div>'
        + '<dl class="wb-facts">' + b.key.map(function (k) { var f = b.facts[k]; return '<div><dt>' + E(f[0]) + '</dt><dd>' + E(f[1]) + '</dd></div>'; }).join('') + '</dl>'
        + '<h4>Why we chose it</h4><ul class="wb-why">' + b.why.slice(0, 3).map(function (w) { return '<li>' + E(w) + '</li>'; }).join('') + '</ul>'
        + '<div class="wb-foot"><a class="btn mint" href="' + E(b.href) + '" rel="noopener">Open an account <svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><button type="button" class="btn wb-more" data-b="' + i + '">All terms, regulation and sources</button></div></article>'; }).join('') + '</div>'
    + '<p class="wow-bk-note">Terms read from each broker’s official page on 3 November 2026. Spreads move with the market and brokers change their terms, so check the broker’s page before you open an account. Trading carries risk.</p>';
  old.forEach(function (a) { a.style.display = 'none'; }); var grid = $('.bk-grid', sec); if (grid) grid.style.display = 'none'; var why = $('.bk-why', sec); if (why) why.style.display = 'none';
  var anchor = grid || old[0]; (anchor ? anchor.parentNode : $('.wrap', sec)).insertBefore(box, anchor || null);
  if (disc) disc.parentNode.appendChild(disc);
  box.addEventListener('click', function (e) {
    var w = e.target.closest('.wow-why-i'); if (w) { var d = WHYRAW[+w.dataset.w]; open_({k: 'explain', title: d[0], sub: 'Why GoldTriEngine needs a raw account', html: '<p class="gs-lead">' + E(d[1]) + '</p><div class="gs-kv"><div><span>Fusion Markets</span><b>' + E(d[0] === 'Low commission' ? '$4.50 per lot round turn' : d[0] === 'Tight spreads' ? 'from 0.0 pips' : 'built for EAs') + '</b></div><div><span>IC Markets</span><b>' + E(d[0] === 'Low commission' ? '$7.00 per lot round turn' : d[0] === 'Tight spreads' ? 'from 0.0 pips' : 'Equinix NY4 servers') + '</b></div></div>'}); return; }
    var m = e.target.closest('.wb-more'); if (m) { var b = B[+m.dataset.b]; open_({k: 'explain', title: b.name, sub: b.acct + ' · regulation and sources', html: '<p class="gs-lead">' + E(b.why[0]) + '</p><div class="gs-kv">' + b.facts.map(function (f) { return '<div><span>' + E(f[0]) + '</span><b>' + E(f[1]) + '</b></div>'; }).join('') + '</div><h4 class="gs-h4">Regulation (from the broker’s page)</h4><ul class="gs-ul">' + b.reg.map(function (r) { return '<li>' + E(r) + '</li>'; }).join('') + '</ul><p class="gs-fine">Read on 3 November 2026 from ' + E(b.srcName) + '. Terms can change.</p><a class="gs-more" href="' + E(b.src) + '" target="_blank" rel="noopener">Open the broker’s page</a><a class="gs-more" href="' + E(b.href) + '" rel="noopener">Open an account</a>'}); }
  });
})();
