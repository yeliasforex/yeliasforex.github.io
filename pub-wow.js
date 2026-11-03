/* The travelling menu and the motion layer for the public pages.
   One menu only: it floats as a glass pill while you scroll, a light slides under the section you are in, a line shows how far down you are,
   and every jump to a section plays a short scan-and-arrive animation. Plus depth: cards tilt towards the pointer, buttons lean in, a soft light follows the cursor,
   headlines rise word by word. Everything is skipped for visitors who prefer reduced motion, and the pointer effects are skipped on touch screens.
   Purely additive: if this file does not load, the page works as before. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hdr = $('header.top'), nav = $('#nav'); if (!hdr || !nav) return;

  /* ---- 1. the menu: one list, a light that slides, a progress line ---- */
  var key = function (a) { return (a.getAttribute('href') || '').replace(/^\//, '').replace(/^index\.html(?=#)/, ''); };
  var seen = {}; $$('a', nav).forEach(function (a) { var h = key(a); if (a.classList.contains('pill')) return; var k = (h === 'contact.html' && $$('a', nav).some(function (x) { return key(x) === '#contact'; })) ? 'dup' : h; if (seen[k] || k === 'dup') a.setAttribute('data-dup', '1'); else seen[k] = 1; });
  /* Guide, Blog and FAQ share one "Learn" menu, so the whole menu fits on one line */
  var learn = ['guide.html', 'blog/', 'faq.html'].map(function (h) { return $$('a', nav).filter(function (a) { return key(a) === h; })[0]; }).filter(Boolean);
  if (learn.length > 1) {
    var dd = document.createElement('div'); dd.className = 'wow-dd'; dd.innerHTML = '<button type="button" aria-haspopup="true" aria-expanded="false">Learn<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><div class="wow-dd-m" role="menu"></div>';
    learn[0].parentNode.insertBefore(dd, learn[0]); learn.forEach(function (a, i) { a.style.setProperty('--i', i); $('.wow-dd-m', dd).appendChild(a); });
    var db = $('button', dd); dd.addEventListener('pointerenter', function () { db.setAttribute('aria-expanded', 'true'); }); dd.addEventListener('pointerleave', function () { db.setAttribute('aria-expanded', 'false'); });
    db.addEventListener('click', function () { dd.classList.toggle('open'); db.setAttribute('aria-expanded', dd.classList.contains('open')); }); document.addEventListener('click', function (e) { if (!dd.contains(e.target)) dd.classList.remove('open'); });
  }
  var ind = document.createElement('i'); ind.className = 'wow-ind'; nav.insertBefore(ind, nav.firstChild);
  var prog = document.createElement('i'); prog.className = 'wow-prog'; hdr.appendChild(prog);
  var links = $$('nav > a:not(.pill):not([data-dup]), .wow-dd > button', nav.parentNode ? nav : nav).filter(function (l) { return !l.closest('.wow-dd-m'); }), active = null, burger = $('.menu-btn', hdr);
  function place(a, hov) {
    if (!a || (burger && burger.offsetParent !== null)) { ind.style.opacity = 0; return; }
    var nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect(); ind.style.opacity = 1; ind.style.width = r.width + 'px'; ind.style.transform = 'translate3d(' + (r.left - nr.left) + 'px,0,0)'; ind.classList.toggle('hov', !!hov);
  }
  function setActive(a) { if (a === active) return; active = a; links.forEach(function (l) { l.classList.toggle('on', l === a); }); place(a); }
  links.forEach(function (a) { a.addEventListener('pointerenter', function () { place(a, true); }); a.addEventListener('focus', function () { place(a, true); }); });
  nav.addEventListener('pointerleave', function () { place(active); });
  addEventListener('resize', function () { place(active); });
  var here = location.pathname.split('/').pop() || 'index.html';
  function linkFor(id) {
    var map = {account: '#account', how: '#how', backtest: '#backtest', free: 'free-backtest.html', license: 'pricing.html', faq: 'faq.html', contact: '#contact', transparency: '#backtest', telegram: '#how', myaccount: 'my-account.html', host: '#how', brokers: 'pricing.html'};
    var h = map[id]; if (id === 'faq') return $('.wow-dd > button', nav) || $('a[href="faq.html"]', nav); return h ? $('a[href="' + h + '"]:not([data-dup])', nav) : null;
  }
  if (here !== 'index.html' && here !== '') { var ml = $('a[href="' + here + '"]', nav); setActive(ml && ml.closest('.wow-dd') ? $('.wow-dd > button', nav) : ml || (/^blog/.test(location.pathname.replace(/^\//, '')) ? $('.wow-dd > button', nav) : null)); }
  var secs = $$('#main > section[id]').filter(function (s) { return s.offsetHeight > 0; });
  function spy() {
    var y = scrollY + innerHeight * .35, cur = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top + scrollY <= y) cur = s; });
    if (here === 'index.html' || here === '') setActive(cur ? linkFor(cur.id) : null);
  }
  var tick = false; function onScroll() {
    if (tick) return; tick = true; requestAnimationFrame(function () {
      tick = false; var max = Math.max(1, document.documentElement.scrollHeight - innerHeight); hdr.style.setProperty('--p', Math.min(1, scrollY / max).toFixed(4));
      hdr.classList.toggle('is-float', scrollY > 90); spy(); document.documentElement.style.setProperty('--sy', scrollY);
    });
  }
  addEventListener('scroll', onScroll, {passive: true}); onScroll(); setTimeout(function () { place(active); }, 400); setTimeout(function () { secs = $$('#main > section[id]').filter(function (s) { return s.offsetHeight > 0; }); spy(); }, 1800);

  /* ---- menu graphics: every item has an icon and a one-line hint that pops up on hover, and a press sends out a ripple and sparks ---- */
  var IC = {
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', flow: '<path d="M5 5h5v5H5zM14 14h5v5h-5zM10 7.5h2.5a2 2 0 0 1 2 2V14"/>', chart: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>', down: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
    tag: '<path d="M3 12l9-9h8v8l-9 9z"/><circle cx="16" cy="8" r="1.2"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', mail: '<path d="M3 6h18v12H3zM3 7l9 6 9-6"/>'
  };
  var HINT = {'#account': ['activity', 'Real numbers from MetaTrader'], '#how': ['flow', 'From a trade to an explanation'], '#backtest': ['chart', 'Tested trade by trade'], 'free-backtest.html': ['down', 'Run the real EA yourself'], 'pricing.html': ['tag', 'Plans and what they cover'], 'my-account.html': ['user', 'Your dashboard'], '#contact': ['mail', 'Chat or open a ticket'], 'contact.html': ['mail', 'Chat or open a ticket']};
  function dress(el, ic, hint) {
    if (!el || $('.nav-ic', el) || !ic) return; var ico = document.createElement('i'); ico.className = 'nav-ic'; ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[ic] + '</svg>'; el.insertBefore(ico, el.firstChild);
    var tip = document.createElement('span'); tip.className = 'nav-tip'; tip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[ic] + '</svg>' + hint; el.appendChild(tip);
  }
  $$('nav > a:not(.pill)', nav).forEach(function (a, i) { var h = HINT[key(a)]; a.style.setProperty('--i', i); if (h) dress(a, h[0], h[1]); });
  var lb = $('.wow-dd > button', nav); if (lb) dress(lb, 'book', 'Guide, Blog and FAQ');
  [['guide.html', 'book', 'How to judge a gold EA'], ['blog/', 'book', 'Gold outlook and lessons'], ['faq.html', 'book', 'Straight answers']].forEach(function (x) { dress($('.wow-dd-m a[href="' + x[0] + '"]', nav), x[1], x[2]); });
  function burst(el, e) {
    var r = el.getBoundingClientRect(), x = (e && e.clientX != null ? e.clientX : r.left + r.width / 2) - r.left, y = (e && e.clientY != null ? e.clientY : r.top + r.height / 2) - r.top;
    var rp = document.createElement('i'); rp.className = 'nav-rip'; rp.style.left = x + 'px'; rp.style.top = y + 'px'; el.appendChild(rp); setTimeout(function () { rp.remove(); }, 700);
    if (still) return; for (var k = 0; k < 7; k++) { var sp = document.createElement('i'); sp.className = 'nav-spk'; var ang = (k / 7) * Math.PI * 2 + Math.random() * .5, d = 18 + Math.random() * 16; sp.style.left = x + 'px'; sp.style.top = y + 'px'; sp.style.setProperty('--dx', (Math.cos(ang) * d).toFixed(1) + 'px'); sp.style.setProperty('--dy', (Math.sin(ang) * d).toFixed(1) + 'px'); el.appendChild(sp); setTimeout(function (n) { return function () { n.remove(); }; }(sp), 800); }
  }
  nav.addEventListener('pointerdown', function (e) { var a = e.target.closest('a, .wow-dd > button'); if (a && nav.contains(a)) { burst(a, e); a.classList.remove('pressed'); void a.offsetWidth; a.classList.add('pressed'); setTimeout(function () { a.classList.remove('pressed'); }, 600); } });
  if (burger) burger.addEventListener('click', function () { setTimeout(function () { $$('nav > a, .wow-dd-m a', nav).forEach(function (a, i) { a.style.setProperty('--i', i); }); }, 0); });


  /* ---- the Ask us button: a chat bubble, waving dots, then the questions people ask ---- */
  (function () {
    var Q = ['Ask us', null, 'Pricing?', null, 'Setup help?', null, 'Which broker?', null];
    function dress(f) {
      if (!f || f.querySelector('.gk-b')) return; var w = '';
      Q.forEach(function (t, i) { w += t ? '<em style="--i:' + i + '">' + t + '</em>' : '<b class="gk-d" style="--i:' + i + '"><u></u><u></u><u></u></b>'; });
      f.innerHTML = '<svg class="gk-b" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg><span class="gk-w" aria-hidden="true">' + w + '</span>';
    }
    var f = document.querySelector('.gc-fab'); if (f) { dress(f); return; }
    var mo = new MutationObserver(function () { var g = document.querySelector('.gc-fab'); if (g) { dress(g); mo.disconnect(); } }); mo.observe(document.body, {childList: true});
    setTimeout(function () { mo.disconnect(); }, 15000);
  })();

  /* phones: the floating buttons step aside while the page scrolls and return when it stops */
  (function () { var t = null, root = document.documentElement; addEventListener('scroll', function () { if (!matchMedia('(max-width:600px)').matches) return; root.classList.add('is-scrolling'); clearTimeout(t); t = setTimeout(function () { root.classList.remove('is-scrolling'); }, 700); }, {passive: true}); })();
  /* ---- 2. a jump to a section: the scan line, then the section arrives ---- */
  var scan = document.createElement('div'); scan.className = 'wow-scan'; document.body.appendChild(scan);
  function arrive(el) { el.classList.remove('wow-arrive'); void el.offsetWidth; el.classList.add('wow-arrive'); setTimeout(function () { el.classList.remove('wow-arrive'); }, 1400); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || still || a.getAttribute('href').length < 2) return; var el; try { el = document.querySelector(a.getAttribute('href')); } catch (x) { return; } if (!el || !el.offsetHeight) return;
    scan.classList.remove('go'); void scan.offsetWidth; scan.classList.add('go'); ind.classList.add('jump'); setTimeout(function () { ind.classList.remove('jump'); }, 700);
    var t0 = Date.now(), poll = setInterval(function () { var d = Math.abs(el.getBoundingClientRect().top - 72); if ((d < 6 && Date.now() - t0 > 450) || Date.now() - t0 > 2600) { clearInterval(poll); arrive(el); } }, 120);
  }, true);

  if (still) return;

  /* ---- 3. headlines rise word by word ---- */
  $$('#main .pubx-s h2').forEach(function (h) {
    if (h.__w) return; h.__w = 1; var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) { var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment(); parts.forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p)); else { var o = document.createElement('span'), s = document.createElement('span'); o.className = 'wow-w'; s.style.setProperty('--i', i++); s.textContent = p; o.appendChild(s); frag.appendChild(o); } }); node.replaceChild(frag, n); }
        else if (n.nodeType === 1 && n.tagName === 'EM') { var o = document.createElement('span'); o.className = 'wow-w'; var s = document.createElement('span'); s.style.setProperty('--i', i++); node.replaceChild(o, n); s.appendChild(n); o.appendChild(s); }
      });
    })(h);
  });

  if (!fine) { document.body.classList.add('wow-in'); return; }

  /* ---- 4. depth: tilt, lean-in buttons, a light that follows the cursor ---- */
  var orb = document.createElement('div'); orb.className = 'wow-orb'; document.body.appendChild(orb);
  var ox = innerWidth / 2, oy = innerHeight / 2, tx = ox, ty = oy;
  (function loop() { ox += (tx - ox) * .12; oy += (ty - oy) * .12; orb.style.transform = 'translate3d(' + (ox - 190) + 'px,' + (oy - 190) + 'px,0)'; requestAnimationFrame(loop); })();
  var TILT = '.ds-card, .pd-k, .pd-en, .plan, .facts .fact, .pd-today button';
  document.addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY; orb.classList.add('on');
    var c = e.target.closest && e.target.closest(TILT);
    if (c) { var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; if (r.width < 700) c.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-4px)'; c.classList.add('tilting'); }
    $$('.tilting').forEach(function (t) { if (t !== c) { t.style.transform = ''; t.classList.remove('tilting'); } });
    var b = e.target.closest && e.target.closest('.btn'); var near = $$('.btn.leaning'); near.forEach(function (n) { if (n !== b) { n.style.translate = ''; n.classList.remove('leaning'); } });
    if (b) { var br = b.getBoundingClientRect(); b.style.translate = ((e.clientX - br.left - br.width / 2) * .14).toFixed(1) + 'px ' + ((e.clientY - br.top - br.height / 2) * .22).toFixed(1) + 'px'; b.classList.add('leaning'); }
  }, {passive: true});
  document.addEventListener('pointerleave', function () { orb.classList.remove('on'); }, true);
  document.body.classList.add('wow-in');
})();

/* ---- command palette: Ctrl/Cmd + K (or "/") jumps anywhere on the site ---- */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var main = document.getElementById('main'); if (!main) return;
  var home = /(^|\/)(index\.html)?$/.test(location.pathname);
  var ITEMS = [];
  function add(t, hint, kind, run, words) { ITEMS.push({t: t, hint: hint, kind: kind, run: run, w: (t + ' ' + hint + ' ' + (words || '')).toLowerCase()}); }
  function go(href) { return function () { if (href.charAt(0) === '#' && !$(href)) { location.href = 'index.html' + href; return; } var a = document.createElement('a'); a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } document.body.appendChild(a); a.click(); a.remove(); }; }
  var P = home ? '' : 'index.html';
  [['Live account', 'Real numbers from MetaTrader', '#account', 'balance equity trades dashboard'], ['Backtest', 'Almost three years, trade by trade', '#backtest', 'months simulated tester'], ['Proof and trust', 'Why you can check everything', '#transparency', 'myfxbook track record'], ['Free backtest', 'Run the real EA yourself', '#free', 'download ex5 strategy tester'], ['How it works', 'From a trade to an explanation', '#how', 'stream bot ai host'], ['Telegram alerts', 'What the EA tells your phone', '#telegram', 'notifications'], ['My account example', 'A look inside the dashboard', '#myaccount', 'demo'], ['Meet the host', 'The AI voice and face', '#host', 'ai moods'], ['Plans and pricing', 'Which plan fits you', '#license', 'price deposit limit buy'], ['Brokers', 'Fusion Markets and IC Markets', '#brokers', 'raw account spreads'], ['Questions', 'Straight answers', '#faq', 'faq martingale grid ai'], ['Contact', 'Message the developer', '#contact', 'telegram support']].forEach(function (x) { add(x[0], x[1], 'Section', go(P + x[2]), x[3]); });
  [['Support ticket', 'Get a reference number and an answer by email', 'contact.html#write', 'help problem question'], ['My requests', 'Follow your tickets', 'support.html', 'reply'], ['My account', 'Sign in', 'my-account.html', 'license orders'], ['Pricing page', 'Plans and buying', 'pricing.html', 'buy license'], ['Download the free EA', 'Backtest on your own PC', 'free-backtest.html', 'ex5'], ['Guide', 'How to judge a gold EA', 'guide.html', 'learn'], ['Blog and academy', 'Gold outlook and lessons', 'blog/', 'learn news'], ['FAQ', 'All questions', 'faq.html', 'learn'], ['System status', 'Is everything answering', 'status.html', 'health'], ['Risk disclaimer', 'Read before you trade', 'risk.html', 'legal'], ['Terms', 'Terms of service', 'terms.html', 'legal'], ['Privacy', 'Privacy policy', 'privacy.html', 'legal']].forEach(function (x) { add(x[0], x[1], 'Page', go(x[2]), x[3]); });
  add('Watch the live stream', 'YouTube, Monday to Friday', 'Action', go('https://www.youtube.com/@GoldTriEngine/live'), 'watch youtube');
  add('Message support on Telegram', '@GoldTriEngine_Support', 'Action', go('https://t.me/GoldTriEngine_Support'), 'chat');
  add('Switch day / night', 'Change the theme', 'Action', function () { var b = $('#theme-toggle, .theme-toggle, button[aria-label*="theme" i], button[aria-label*="mode" i]'); if (b) b.click(); else { var r = document.documentElement; r.setAttribute('data-theme', r.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); } }, 'dark light theme');
  var box = document.createElement('div'); box.className = 'wow-k'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Jump to');
  box.innerHTML = '<div class="wow-k-bk"></div><div class="wow-k-p"><div class="wow-k-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="text" placeholder="Jump to a section, a page or an action..." aria-label="Search" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><ul class="wow-k-l" role="listbox"></ul><div class="wow-k-f"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
  document.body.appendChild(box);
  var inp = $('input', box), list = $('.wow-k-l', box), sel = 0, shown = [];
  function render() {
    var q = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean); shown = ITEMS.filter(function (it) { return q.every(function (w) { return it.w.indexOf(w) >= 0; }); }).slice(0, 9); sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length ? shown.map(function (it, i) { return '<li role="option" data-i="' + i + '" class="' + (i === sel ? 'on' : '') + '" style="--i:' + i + '"><span class="k">' + it.kind + '</span><b>' + it.t.replace(/</g, '&lt;') + '</b><em>' + it.hint.replace(/</g, '&lt;') + '</em><i>&crarr;</i></li>'; }).join('') : '<li class="none">Nothing matches. Try "pricing", "ticket" or "backtest".</li>';
  }
  function openK() { box.hidden = false; void box.offsetWidth; box.classList.add('in'); inp.value = ''; sel = 0; render(); setTimeout(function () { inp.focus(); }, 30); document.body.classList.add('wow-kopen'); }
  function closeK() { box.classList.remove('in'); document.body.classList.remove('wow-kopen'); setTimeout(function () { box.hidden = true; }, 260); }
  function pick(i) { var it = shown[i]; if (!it) return; closeK(); setTimeout(it.run, 240); }
  inp.addEventListener('input', function () { sel = 0; render(); });
  list.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) pick(+li.dataset.i); });
  list.addEventListener('pointermove', function (e) { var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; $$('li', list).forEach(function (x, k) { x.classList.toggle('on', k === sel); }); } });
  $('.wow-k-bk', box).addEventListener('click', closeK);
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '') && document.activeElement !== inp;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); box.hidden ? openK() : closeK(); return; }
    if (e.key === '/' && !typing && box.hidden && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openK(); return; }
    if (box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeK(); } else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); render(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); } else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
  });
  var b = document.createElement('button'); b.type = 'button'; b.className = 'wow-kb'; b.setAttribute('aria-label', 'Search the site'); b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>Search</span><kbd>Ctrl K</kbd>';
  b.addEventListener('click', openK); var hw = $('header.top .wrap'), mb = $('.menu-btn', hw); if (hw) hw.insertBefore(b, mb || null);
})();
