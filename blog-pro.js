/* Blog pro layer: reading progress, the host robot, a readout under the finger on every chart, and bars inside the odds table. Everything works without it. */
(function () {
  var d = document, reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var body = d.querySelector('.bl-body');
  if (!body) return;

  /* reading progress */
  var bar = d.createElement('div'); bar.className = 'bl-prog'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>'; d.body.appendChild(bar);
  var fill = bar.firstChild, tick = false;
  function prog() {
    tick = false;
    var r = body.getBoundingClientRect(), top = r.top + scrollY, h = r.height - innerHeight * .5;
    var k = h > 0 ? Math.max(0, Math.min(1, (scrollY - top + innerHeight * .25) / h)) : 0;
    fill.style.transform = 'scaleX(' + k.toFixed(4) + ')';
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
  addEventListener('resize', prog); prog();

  /* the host robot beside the title: the pose follows the kind of post */
  var head = d.querySelector('.bl-head'), chip = d.querySelector('.bl-chip');
  if (head && chip && !head.querySelector('.bl-host')) {
    var c = (chip.textContent || '').toLowerCase(), pose = /outlook|forecast/.test(c) ? 'tablet' : /news|data/.test(c) ? 'surprised' : /risk|psych/.test(c) ? 'concerned' : /education|ea|academy|lesson/.test(c) ? 'think' : /gold|market|recap/.test(c) ? 'point' : 'wave';
    var im = d.createElement('img'); im.className = 'bl-host'; im.src = '/host-' + pose + '.webp'; im.alt = ''; im.width = 220; im.height = 286; im.decoding = 'async'; im.setAttribute('aria-hidden', 'true');
    head.insertBefore(im, head.firstChild);
  }

  /* readout: touch or hover a chart to read the value under the finger */
  function pts(path) {
    var m = (path.getAttribute('d') || '').match(/-?\d+(?:\.\d+)?/g) || [], o = [];
    for (var i = 0; i + 1 < m.length; i += 2) o.push([+m[i], +m[i + 1]]);
    return o;
  }
  function line(svg) {
    var path = svg.querySelector('path.bl-line'), u = svg.dataset.u || '', vals = svg.dataset.v ? svg.dataset.v.split(',').map(Number) : null;
    if (!path) return;
    var P = pts(path);
    if (!vals) {                                          /* posts drawn before the data attribute existed: read the value back from the axis labels */
      var T = [].map.call(svg.querySelectorAll('.bl-yt'), function (t) { return [+t.getAttribute('y') - 3, parseFloat(String(t.textContent).replace(/[^0-9.\-]/g, ''))]; }).filter(function (t) { return isFinite(t[0]) && isFinite(t[1]); });
      if (T.length < 2 || T[0][0] === T[T.length - 1][0]) return;
      var k = (T[T.length - 1][1] - T[0][1]) / (T[T.length - 1][0] - T[0][0]);
      vals = P.map(function (p) { return T[0][1] + (p[1] - T[0][0]) * k; });
      var fg = svg.closest('.bl-fig'), sub = fg && fg.querySelector('.bl-sub'); u = sub && /dollar/i.test(sub.textContent) ? '$' : u;
    }
    if (P.length < 3 || P.length !== vals.length) return;
    var fig = svg.closest('.bl-fig'); if (!fig) return;
    var NS = 'http://www.w3.org/2000/svg', g = d.createElementNS(NS, 'g'); g.setAttribute('class', 'bl-xh'); g.style.display = 'none';
    var vl = d.createElementNS(NS, 'line'), dot = d.createElementNS(NS, 'circle'); dot.setAttribute('r', '5');
    g.appendChild(vl); g.appendChild(dot); svg.appendChild(g);
    var tip = d.createElement('div'); tip.className = 'bl-tip'; tip.hidden = true; fig.appendChild(tip);
    var vb = svg.viewBox.baseVal, y0 = 18, y1 = vb.height - 30;
    function at(e) {
      var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * vb.width, best = 0;
      for (var i = 1; i < P.length; i++) if (Math.abs(P[i][0] - x) < Math.abs(P[best][0] - x)) best = i;
      var p = P[best], last = best === P.length - 1;
      g.style.display = ''; vl.setAttribute('x1', p[0]); vl.setAttribute('x2', p[0]); vl.setAttribute('y1', y0); vl.setAttribute('y2', y1); dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]);
      var v = vals[best], txt = (v < 0 ? '−' : '') + (u === '$' ? '$' : '') + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2 }) + (u && u !== '$' ? u : '');
      tip.innerHTML = '<b>' + txt + '</b><span>' + (last ? 'latest' : (P.length - 1 - best) + (P.length - 1 - best === 1 ? ' day' : ' days') + ' before latest') + '</span>';
      tip.hidden = false;
      var fr = fig.getBoundingClientRect(), px = r.left - fr.left + p[0] / vb.width * r.width, py = r.top - fr.top + p[1] / vb.height * r.height;
      tip.style.left = Math.max(8, Math.min(fr.width - 8 - tip.offsetWidth, px - tip.offsetWidth / 2)) + 'px'; tip.style.top = Math.max(6, py - tip.offsetHeight - 14) + 'px';
    }
    function off() { g.style.display = 'none'; tip.hidden = true; }
    svg.addEventListener('pointermove', at); svg.addEventListener('pointerdown', at); svg.addEventListener('pointerleave', off); svg.addEventListener('pointercancel', off);
    svg.classList.add('bl-touch');
  }
  function bars(svg) {
    var rects = svg.querySelectorAll('rect.bl-bar'); if (rects.length < 2) return;
    var vs = svg.querySelectorAll('.bl-bv'), xs = svg.querySelectorAll('.bl-xt'), fig = svg.closest('.bl-fig'); if (!fig) return;
    var tip = d.createElement('div'); tip.className = 'bl-tip'; tip.hidden = true; fig.appendChild(tip);
    [].forEach.call(rects, function (r, i) {
      function show() {
        [].forEach.call(rects, function (x) { x.classList.toggle('on', x === r); });
        tip.innerHTML = '<b>' + (vs[i] ? vs[i].textContent : '') + '</b><span>' + (xs[i] ? xs[i].textContent : '') + '</span>'; tip.hidden = false;
        var fr = fig.getBoundingClientRect(), b = r.getBoundingClientRect();
        tip.style.left = Math.max(8, Math.min(fr.width - 8 - tip.offsetWidth, b.left - fr.left + b.width / 2 - tip.offsetWidth / 2)) + 'px'; tip.style.top = Math.max(6, b.top - fr.top - tip.offsetHeight - 8) + 'px';
      }
      r.addEventListener('pointerenter', show); r.addEventListener('pointerdown', show);
    });
    svg.addEventListener('pointerleave', function () { tip.hidden = true; [].forEach.call(rects, function (x) { x.classList.remove('on'); }); });
    svg.classList.add('bl-touch');
  }
  [].forEach.call(d.querySelectorAll('svg.bl-svg'), function (s) { if (s.querySelector('path.bl-line')) line(s); else bars(s); });

  /* odds table: a small bar under every percentage */
  [].forEach.call(d.querySelectorAll('.bl-tw table'), function (t) {
    var cells = [].filter.call(t.querySelectorAll('tbody td'), function (td) { return /^\d+(?:\.\d+)?%$/.test(td.textContent.trim()); });
    if (cells.length < 3) return;
    cells.forEach(function (td, i) { td.classList.add('pb'); td.style.setProperty('--w', Math.min(100, parseFloat(td.textContent) * 2.2)); td.style.setProperty('--i', i % 3); });
    if (reduced || !('IntersectionObserver' in window)) { t.classList.add('pb-in'); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { t.classList.add('pb-in'); io.disconnect(); } }); }, { threshold: .3 });
    io.observe(t);
  });
})();
