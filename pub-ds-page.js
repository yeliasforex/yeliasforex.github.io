/* The same premium layer for the other public pages (pricing, FAQ, guide, download, contact...): chapter styling, glass cards with a pointer light,
   a section glow and a smooth reveal. Pure styling: if this file does not load, the page looks as before. */
(function () {
  'use strict';
  var main = document.getElementById('main'); if (!main) return;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var shown = 0;
  $$('section', main).forEach(function (s) {
    if (!s.offsetHeight || s.classList.contains('page-head') || s.classList.contains('pubx-s')) return;
    s.classList.add('pubx-s'); if (shown++ % 2) s.classList.add('pubx-alt');
    $$('.card, .plan', s).forEach(function (c, i) { c.classList.add('ds-card'); c.style.setProperty('--d', (i * 0.06).toFixed(2) + 's'); });
  });
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ds-in'); io.unobserve(e.target); } }); }, {threshold: .12}); $$('.pubx-s', main).forEach(function (s) { io.observe(s); }); } else $$('.pubx-s', main).forEach(function (s) { s.classList.add('ds-in'); });
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.ds-card'); if (!el) return; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive: true});
})();
