/* Blog motion: charts and numbers reveal when scrolled into view; the table of contents follows the reader. Everything works without it. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('bl-js');
  var reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fmt = function (el, v) {
    var dec = +el.dataset.d || 0, s = el.dataset.s || '', p = el.dataset.p || '';
    return p + (el.dataset.g ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + s;
  };
  var count = function (el) {
    var v = +el.dataset.v; if (reduced || !isFinite(v)) return;
    var t0 = performance.now(), D = 1200; el.textContent = fmt(el, 0);
    (function f(t) { var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(el, v * e); if (k < 1) requestAnimationFrame(f); else el.textContent = fmt(el, v); })(t0);
  };
  var seen = function (el) {
    el.classList.add('in');
    [].forEach.call(el.querySelectorAll('.cu'), count);
  };
  var els = d.querySelectorAll('.bl-fig,.bl-kn');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); } }); }, {threshold: .25});
    [].forEach.call(els, function (e) { io.observe(e); });
  } else { [].forEach.call(els, function (e) { e.classList.add('in'); }); }
  var toc = d.querySelectorAll('.bl-toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {}; [].forEach.call(toc, function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var heads = [].filter.call(d.querySelectorAll('.bl-body h2'), function (h) { return map[h.id]; });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { [].forEach.call(toc, function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); } });
    }, {rootMargin: '-90px 0px -65% 0px'});
    heads.forEach(function (h) { io2.observe(h); });
  }
})();
