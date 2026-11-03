/* Scroll as a candle (see pub-candle.css). It only watches the scroll position and, for Watch live, a small public status file; nothing it does changes any data. */
(function () {
  'use strict';
  var hdr = document.querySelector('header.top'); if (!hdr) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fill = document.createElement('i'); fill.className = 'cd-fill'; hdr.insertBefore(fill, hdr.firstChild);
  var pill = $('.nav .pill', hdr), base = '', t1 = null;
  if (pill) base = pill.innerHTML;
  var dir = 1, last = window.pageYOffset, offline = false;

  /* Watch live: live, offline or unknown. Unknown (no status file yet, or the request failed) keeps the normal button, so it never claims anything. */
  function setStream(st) {
    if (!pill) return; pill.classList.remove('cd-live', 'cd-off');
    if (st === 'off') { offline = true; hdr.classList.add('cd-off'); pill.classList.add('cd-off'); pill.innerHTML = '<span class="dot"></span><span class="cd-tx">Offline</span>'; pill.setAttribute('href', 'https://www.youtube.com/@GoldTriEngine'); base = pill.innerHTML; }
    else if (st === 'on') { offline = false; pill.classList.add('cd-live'); }
  }
  var q = /[?&]stream=(on|off)/.exec(location.search);
  if (q) setStream(q[1]);
  else if (window.fetch) fetch('https://raw.githubusercontent.com/yeliasforex/gte-live/main/stream.json', {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j || typeof j.live !== 'boolean') return; var age = j.updated ? (Date.now() - Date.parse(j.updated)) : 0;
    setStream(j.live && age < 15 * 60 * 1000 ? 'on' : 'off');
  }).catch(function () {});

  /* the side rail: key sections as levels */
  var rail = null, levels = [];
  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
  function place() { if (!rail) return; var m = maxScroll(); levels.forEach(function (l) { var y = (l.el.getBoundingClientRect().top + window.pageYOffset - 90) / m; l.a.style.top = Math.max(2, Math.min(98, y * 100)) + '%'; }); }
  function buildRail() {
    var secs = $$('main section[id]').filter(function (s) { return s.offsetHeight > 0 && $('.kicker', s); }).slice(0, 9);
    if (secs.length < 4) return;
    rail = document.createElement('div'); rail.className = 'cd-rail'; rail.setAttribute('aria-label', 'Page sections');
    rail.innerHTML = '<i class="tk"></i><i class="fl"></i><i class="dt"></i>';
    secs.forEach(function (s) {
      var k = $('.kicker', s), name = k.textContent.replace(/^\s*\d+\s*/, '').replace(/\s*·.*$/, '').trim();
      var a = document.createElement('a'); a.href = '#' + s.id; a.setAttribute('aria-label', name); a.innerHTML = '<span>' + name + '</span>'; rail.appendChild(a); levels.push({el: s, a: a});
    });
    document.body.appendChild(rail); place(); frame();
  }

  /* scroll */
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.pageYOffset, m = maxScroll(), p = Math.max(0, Math.min(1, y / m)), d = y - last;
    if (Math.abs(d) > 3) { dir = d > 0 ? 1 : -1; last = y; }
    hdr.style.setProperty('--cd-p', p.toFixed(4)); hdr.classList.toggle('cd-up', dir > 0); hdr.classList.toggle('cd-dn', dir < 0);
    if (rail) {
      rail.style.setProperty('--cd-p', p.toFixed(4)); rail.style.setProperty('--cd-c', dir > 0 ? 'var(--cd-up)' : 'var(--cd-dn)'); rail.classList.toggle('on', y > 200);
      var cur = null; levels.forEach(function (l) { if (l.el.getBoundingClientRect().top < innerHeight * .4) cur = l; }); levels.forEach(function (l) { l.a.classList.toggle('cur', l === cur); });
    }
    if (pill && !offline && !still && Math.abs(d) > 3 && y > 80) {
      pill.innerHTML = '<span class="dot"></span><span class="cd-tx">' + (dir > 0 ? '▲ ' : '▼ ') + Math.round(p * 100) + '%</span>'; pill.classList.add('cd-flash');
      clearTimeout(t1); t1 = setTimeout(function () { pill.innerHTML = base; pill.classList.remove('cd-flash'); }, 1400);
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive: true});
  addEventListener('resize', place);
  setTimeout(buildRail, 1800); setTimeout(place, 4500); setTimeout(place, 9000);
  frame();
})();
