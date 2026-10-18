/* Free backtest section: reveals, draws the real published equity curve and fills the numbers from the home page backtest, so it never goes stale. */
(function () {
  var cards = document.querySelectorAll('.fz');
  if (!cards.length) return;
  function fill(doc) {
    var line = doc.querySelector('svg.eq path.line');
    if (line) {
      var d = line.getAttribute('d');
      document.querySelectorAll('.fz-line').forEach(function (p) { p.setAttribute('d', d); });
      document.querySelectorAll('.fz-area').forEach(function (p) { p.setAttribute('d', d + ' L632 292 L8 292 Z'); });
    }
    var get = function (label) { var r = ''; doc.querySelectorAll('.stat').forEach(function (s) { var sp = s.querySelector('span'); if (sp && sp.textContent.trim().indexOf(label) === 0) r = (s.querySelector('b') || {}).textContent || ''; }); return r.trim(); };
    var pf = get('Profit factor'), dd = get('Largest equity drawdown');
    var h = doc.querySelector('.months-head h3'), mm = h ? h.textContent.match(/(\d+) of (\d+)/) : null;
    if (pf) document.querySelectorAll('[data-k="pf"]').forEach(function (e) { e.textContent = pf; });
    if (dd) document.querySelectorAll('[data-k="dd"]').forEach(function (e) { e.textContent = dd; });
    if (mm) document.querySelectorAll('[data-k="months"]').forEach(function (e) { e.textContent = mm[1] + ' of ' + mm[2]; });
  }
  function run() {
    if (document.querySelector('svg.eq path.line')) { fill(document); return; }
    fetch('index.html').then(function (r) { return r.text(); }).then(function (h) { fill(new DOMParser().parseFromString(h, 'text/html')); }).catch(function () {});
  }
  run();
  function go(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    el.querySelectorAll('animateMotion').forEach(function (a) { try { a.beginElement(); } catch (e) {} });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } }); }, {threshold: .25});
    cards.forEach(function (c) { io.observe(c); });
  } else cards.forEach(go);
  // tilt the chart card a little with the pointer (desktop only)
  document.querySelectorAll('.fz-card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 5) + 'deg)'; });
    c.addEventListener('pointerleave', function () { c.style.transform = ''; });
  });
})();
