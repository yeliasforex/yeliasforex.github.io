/* Smart call-to-action for readers who arrive from search or social. It says something that fits the page they are reading:
   - inside articles (blog posts and guides) a card appears between the 2nd and 3rd section, where interest is highest;
   - everywhere eligible, a small pill waits at the bottom corner after a third of the page and opens into the same two choices;
   - the pill steps away as soon as the card is on screen, and nothing shows to signed-in customers, in the installed app, on account/checkout pages,
     or for 3 days after the reader closed it. Links are tagged so Admin > Visitors shows what each placement brings. */
(function () {
  var path = location.pathname;
  if (/\/(admin|signin|my-account|pricing|download|support|partner|p\/|unsubscribe|oauth|404|status|changelog|refund|privacy|terms|risk|contact|apps|free-backtest)/.test(path)) return;
  try { if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return; } catch (e) {}
  try {
    if (Date.now() - (+localStorage.getItem('gte_fbx') || 0) < 3 * 864e5) return;
    for (var i = 0; i < localStorage.length; i++) { if (/^sb-.*auth-token$/.test(localStorage.key(i))) return; }
  } catch (e) {}
  var slug = (path.replace(/\/index\.html$/, '/').replace(/^\/|\/$/g, '') || 'home').replace(/[^a-z0-9-]+/gi, '-').slice(0, 60), isHome = slug === 'home';
  var LIVE = 'https://www.youtube.com/@GoldTriEngine/live';
  function tag(u, k) { return (u.indexOf('http') === 0 ? u : u + '?utm_source=site&utm_medium=' + k + '&utm_campaign=' + encodeURIComponent(slug)); }
  function ev(n, d) { try { if (window.gteEvent) gteEvent(n, d); } catch (e) {} }
  /* what to say depends on what they are reading */
  var M;
  if (/outlook|recap|gold-on-|forecast|gold-price|how-much-does-gold/.test(slug)) M = { t: 'Curious how an EA trades days like this?', s: 'Watch GoldTriEngine trade gold live, every entry and exit explained.', a: ['Watch it live', LIVE, 'live'], b: ['Free backtest', '/free-backtest.html', 'backtest'], pill: 'Watch it trade live' };
  else if (/martingale|safe|risk|scam|legit|review|best-gold|choose|check/.test(slug)) M = { t: 'Check it before you trust it.', s: 'Run the free backtest EA on your own MT5, then watch the live trades. No key needed.', a: ['Free backtest', '/free-backtest.html', 'backtest'], b: ['See plans', '/pricing.html', 'plans'], pill: 'Test it free first' };
  else if (/backtest|expectancy|overfit|drawdown|position|leverage|margin|psychology|risk-reward|expert-advisor|what-is/.test(slug)) M = { t: 'Want to test this on real gold data?', s: 'The free backtest EA runs in your own MT5 Strategy Tester. No key, no card.', a: ['Free backtest', '/free-backtest.html', 'backtest'], b: ['Watch it live', LIVE, 'live'], pill: 'Free backtest EA' };
  else M = { t: 'See it before you pay.', s: 'Test the EA free on your own PC, or watch it trade gold live.', a: ['Free backtest', '/free-backtest.html', 'backtest'], b: ['Watch it live', LIVE, 'live'], pill: 'See it before you pay' };
  function btns(where) {
    return '<a class="gte-p" href="' + tag(M.a[1], where + '_' + M.a[2]) + '"' + (M.a[1].indexOf('http') === 0 ? ' rel="noopener"' : '') + ' data-k="' + M.a[2] + '">' + M.a[0] + '</a>' +
           '<a class="gte-g" href="' + tag(M.b[1], where + '_' + M.b[2]) + '"' + (M.b[1].indexOf('http') === 0 ? ' rel="noopener"' : '') + ' data-k="' + M.b[2] + '">' + M.b[0] + '</a>';
  }
  var st = document.createElement('style');
  st.textContent =
    '@keyframes gtePulse{0%{box-shadow:0 0 0 0 rgba(255,75,92,.55)}70%{box-shadow:0 0 0 9px rgba(255,75,92,0)}100%{box-shadow:0 0 0 0 rgba(255,75,92,0)}}' +
    '.gte-ic{margin:28px 0;padding:18px 20px;border-radius:16px;border:1px solid var(--line-2,rgba(120,140,190,.3));background:linear-gradient(135deg,rgba(62,224,154,.09),rgba(23,71,200,.10)),var(--panel,#fff);display:flex;gap:12px 18px;align-items:center;flex-wrap:wrap;color:var(--fg,inherit)}' +
    '.gte-ic .d,.gte-pill .d{width:9px;height:9px;border-radius:50%;background:#ff4b5c;animation:gtePulse 1.9s infinite;flex:none}' +
    '.gte-ic .tx{flex:1 1 230px;min-width:200px}.gte-ic b{display:block;font-size:1.05rem;line-height:1.3}.gte-ic small{display:block;margin-top:3px;opacity:.78;font-size:.9rem;line-height:1.45}' +
    '.gte-ic .bt{display:flex;gap:8px;flex-wrap:wrap}.gte-p,.gte-g{border-radius:11px;padding:10px 15px;text-decoration:none;font-weight:600;font-size:.92rem;white-space:nowrap}' +
    '.gte-p{background:#3EE09A;color:#06251A}.gte-g{border:1px solid var(--line-2,rgba(120,140,190,.4));color:var(--fg,inherit)}' +
    '#gtePill{position:fixed;right:12px;bottom:14px;z-index:60;font:600 13.5px/1.3 system-ui,Segoe UI,Arial,sans-serif;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s;transform:translateY(160%);opacity:0}' +
    '#gtePill.on{transform:none;opacity:1}#gtePill.off{transform:translateY(160%);opacity:0;pointer-events:none}' +
    '.gte-pill{display:block;border:0;background:none;box-shadow:none;cursor:pointer;padding:6px 2px;font:600 13.5px/1.3 system-ui,Segoe UI,Arial,sans-serif;color:#3EE09A;text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 8px rgba(6,8,14,.5);text-decoration:underline;text-decoration-color:rgba(62,224,154,.5);text-underline-offset:4px;transition:opacity .4s}' +
    '.gte-pill:hover,.gte-pill:focus-visible{opacity:1!important}.gte-pill.mini{opacity:.6}' +
    'html[data-theme="light"] .gte-pill{color:#087A4A;text-shadow:0 1px 2px rgba(255,255,255,.9),0 0 8px rgba(255,255,255,.8);text-decoration-color:rgba(8,122,74,.5)}' +
    '#gtePill .card{display:none;position:absolute;right:0;bottom:calc(100% + 10px);width:min(320px,calc(100vw - 24px));padding:14px;border-radius:16px;background:rgba(14,19,34,.98);color:#EAF0FF;border:1px solid rgba(170,190,230,.25);box-shadow:0 14px 40px rgba(0,0,0,.4)}' +
    '#gtePill.open .card{display:block}#gtePill .card b{display:block;font-size:.98rem;margin-bottom:3px}#gtePill .card small{display:block;opacity:.8;font-weight:400;margin-bottom:10px;font-size:.86rem}#gtePill .card .bt{display:flex;gap:8px;flex-wrap:wrap}' +
    '#gtePill .card .gte-g{color:#EAF0FF;border-color:rgba(170,190,230,.4)}#gtePill .x{position:absolute;top:6px;right:8px;background:none;border:0;color:inherit;opacity:.6;font-size:18px;cursor:pointer}' +
    'html[data-theme="light"] #gtePill .card{background:rgba(255,255,255,.98);color:#0B1630;border-color:rgba(20,40,90,.2)}html[data-theme="light"] #gtePill .card .gte-g{color:#0B1630;border-color:rgba(20,40,90,.3)}' +
    '@media (prefers-reduced-motion:reduce){#gtePill{transition:none}.gte-ic .d,.gte-pill .d{animation:none}}';
  document.head.appendChild(st);

  /* 1. the card inside the article, before the third section */
  var card = null, host = document.querySelector('article.bl-body') || document.querySelector('section.pg .narrow');
  if (host && !isHome) {
    var hs = host.querySelectorAll(':scope > h2, :scope > section > h2'), target = hs[2] || null;
    if (target) {
      var anchor = target.closest('section') && target.closest('section').parentNode === host ? target.closest('section') : target;
      card = document.createElement('aside'); card.className = 'gte-ic'; card.setAttribute('aria-label', 'Next step');
      card.innerHTML = '<span class="d" aria-hidden="true"></span><div class="tx"><b>' + M.t + '</b><small>' + M.s + '</small></div><div class="bt">' + btns('inline') + '</div>';
      anchor.parentNode.insertBefore(card, anchor);
      var seen = false;
      if (window.IntersectionObserver) new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; ev('funnel_card_seen', slug); hidePill(); o.disconnect(); } }); }, { threshold: .6 }).observe(card);
      card.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { ev('funnel_card_click', slug + ':' + a.getAttribute('data-k')); try { localStorage.setItem('gte_fbx', String(Date.now())); } catch (e) {} }); });
    }
  }

  /* 2. the pill: waits in the corner, opens into the same two choices */
  var pill = null, shownPill = false;
  function hidePill() { if (pill) { pill.classList.add('off'); pill.classList.remove('on', 'open'); } shownPill = true; }
  /* keep the pill clear of everything else that floats in the corner (chat button, cookie notice, other round buttons) */
  function place() {
    if (!pill) return; var vw = innerWidth, vh = innerHeight, W = Math.min((pill.firstChild && pill.querySelector('.gte-pill') ? pill.querySelector('.gte-pill').offsetWidth : 190) || 190, vw - 24), left = vw - 12 - W, base = 14, kids = document.body.children, i, e, r, cs;
    for (i = 0; i < kids.length; i++) {
      e = kids[i]; if (e === pill || e.tagName === 'SCRIPT' || e.tagName === 'STYLE' || (e.tagName === 'CANVAS')) continue;
      cs = getComputedStyle(e); if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || r.bottom < vh - 220 || r.top >= vh || r.top < vh * .3) continue;       // only small things near the bottom
      if (r.right <= left - 4 || r.left >= vw) continue;                                                                                     // not in the pill's column
      base = Math.max(base, vh - r.top + 10);
    }
    pill.style.bottom = base + 'px';
  }
  function showPill() {
    if (shownPill || (card && card.getAttribute('data-seen'))) return; shownPill = true;
    pill = document.createElement('div'); pill.id = 'gtePill';
    pill.innerHTML = '<div class="card" role="dialog" aria-label="Next step"><button class="x" type="button" aria-label="Close">&times;</button><b>' + M.t + '</b><small>' + M.s + '</small><div class="bt">' + btns('pill') + '</div></div>' +
      '<button class="gte-pill" type="button" aria-expanded="false" aria-label="' + M.pill + '"><span class=\"lb\">' + M.pill + ' &rsaquo;</span></button>';
    document.body.appendChild(pill); place(); addEventListener('resize', place); var pi = setInterval(function () { if (!document.getElementById('gtePill')) clearInterval(pi); else place(); }, 1200); var pt; addEventListener('scroll', function () { clearTimeout(pt); pt = setTimeout(place, 350); }, { passive: true });
    requestAnimationFrame(function () { requestAnimationFrame(function () { pill.classList.add('on'); }); });
    ev('funnel_pill_show', slug);
    var bt = pill.querySelector('.gte-pill'); setTimeout(function () { if (!pill.classList.contains('open')) { bt.classList.add('mini'); place(); } }, 4500);
    bt.addEventListener('mouseenter', function () { bt.classList.remove('mini'); }); bt.addEventListener('mouseleave', function () { if (!pill.classList.contains('open')) setTimeout(function () { bt.classList.add('mini'); }, 1500); });
    pill.querySelector('.gte-pill').onclick = function () { var o = pill.classList.toggle('open'); this.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) ev('funnel_pill_open', slug); };
    pill.querySelector('.x').onclick = function () { try { localStorage.setItem('gte_fbx', String(Date.now())); } catch (e) {} hidePill(); ev('funnel_pill_close', slug); };
    pill.querySelectorAll('.card a').forEach(function (a) { a.addEventListener('click', function () { ev('funnel_pill_click', slug + ':' + a.getAttribute('data-k')); try { localStorage.setItem('gte_fbx', String(Date.now())); } catch (e) {} }); });
  }
  function onScroll() { var h = document.documentElement, p = (window.scrollY + innerHeight) / Math.max(1, h.scrollHeight); if (p > .33) { removeEventListener('scroll', onScroll); showPill(); } }
  addEventListener('scroll', onScroll, { passive: true });
  setTimeout(showPill, 25000);
})();
