/* Admin polish, round two: living background, status chips, reveal on scroll, celebration, day/night ripple.
   Purely visual; the admin works the same if this file does not load. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function cv(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }

  /* A. constellation: slow drifting nodes joined by thin lines; they lean away from the pointer */
  function net() {
    if (reduce) return;
    var c = document.createElement('canvas'); c.id = 'fxnet'; document.body.insertBefore(c, document.body.firstChild);
    var g = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), P = [], mx = -999, my = -999, A = '#a78bfa', B = '#22d3ee', run = true;
    function size() {
      W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(26, W * H / 21000)));
      while (P.length < n) P.push({x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: 1 + Math.random() * 1.6, h: Math.random() < .5});
      P.length = n;
    }
    function colors() { A = cv('--k1', '#a78bfa'); B = cv('--k2', '#22d3ee'); }
    function rgba(h, a) { var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a + ')' : h; }
    function light() { var t = document.documentElement.getAttribute('data-theme'); return t ? t === 'light' : (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches); }
    function frame() {
      if (!run) return;
      g.clearRect(0, 0, W, H);
      var k = light() ? .55 : 1, L = 120;
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { var f = (1 - d2 / 14000) * .6; p.x += dx * f * .02; p.y += dy * f * .02; }
        for (var j = i + 1; j < P.length; j++) {
          var q = P[j], ax = p.x - q.x, ay = p.y - q.y, dd = ax * ax + ay * ay;
          if (dd < L * L) { g.strokeStyle = rgba(p.h ? A : B, (1 - Math.sqrt(dd) / L) * .28 * k); g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
        }
        g.fillStyle = rgba(p.h ? A : B, .75 * k); g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
      }
      requestAnimationFrame(frame);
    }
    size(); colors(); frame();
    addEventListener('resize', size);
    addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, {passive: true});
    document.addEventListener('visibilitychange', function () { var was = run; run = !document.hidden; if (run && !was) frame(); });
    new MutationObserver(colors).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  }

  /* B. soft light that trails the pointer across the whole page */
  function glow() {
    if (reduce || !fine) return;
    var d = document.createElement('div'); d.id = 'fxglow'; document.body.appendChild(d);
    var x = innerWidth / 2, y = 200, tx = x, ty = y;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, {passive: true});
    (function loop() { x += (tx - x) * .12; y += (ty - y) * .12; d.style.transform = 'translate3d(' + (x - 260) + 'px,' + (y - 260) + 'px,0)'; requestAnimationFrame(loop); })();
  }

  /* C. status chips in the command bar, read from the red badges on the tabs; click one to jump there */
  function chips() {
    var hero = $('#hero'); if (!hero || !$('#tabs')) return;
    var box = $('#hrchips');
    if (!box) { box = document.createElement('div'); box.id = 'hrchips'; var l = hero.querySelector('.hr-l'); if (l) l.appendChild(box); }
    var out = [], nm = {orders: 'to check', health: 'health alerts', support: 'open tickets'};
    document.querySelectorAll('#tabs button[data-t]').forEach(function (b) {
      var bd = b.querySelector('.badge'); if (!bd) return;
      var n = parseInt(bd.textContent, 10); if (!n) return;
      out.push('<button type="button" class="hc2 ' + (b.dataset.t === 'health' ? 'bad' : 'warn') + '" data-go="' + b.dataset.t + '"><i></i><b>' + n + '</b> ' + (nm[b.dataset.t] || b.textContent.replace(/\d+$/, '').trim()) + '</button>');
    });
    var html = out.length ? out.join('') : '<span class="hc2 ok"><i></i>All clear</span>';
    if (box.dataset.h !== html) { box.dataset.h = html; box.innerHTML = html; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-go]'); if (!b) return;
    var t = $('#tabs button[data-t="' + b.dataset.go + '"]'); if (t) t.click();
  });

  /* D. cards below the fold rise into view as you scroll */
  var io = window.IntersectionObserver && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('fxin'); io.unobserve(e.target); } });
  }, {rootMargin: '0px 0px -6% 0px'}) : null;
  function reveal(root) {
    if (!io) return;
    root.querySelectorAll('.card:not([data-rv]),.kpi:not([data-rv])').forEach(function (el) {
      el.dataset.rv = '1';
      var r = el.getBoundingClientRect(); if (r.top < innerHeight * .92) return;
      el.classList.add('fxr'); io.observe(el);
    });
  }

  /* E. celebration when something good happens (a toast that reports success) */
  function confetti(ox, oy) {
    if (reduce) return;
    var c = document.createElement('canvas'); c.id = 'fxconf'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var g = c.getContext('2d'), cols = ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#2de2a6', '#ffffff'], P = [];
    for (var i = 0; i < 110; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 1.9, v = 6 + Math.random() * 9;
      P.push({x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], l: 1});
    }
    var t0 = performance.now();
    (function step(now) {
      g.clearRect(0, 0, c.width, c.height); var alive = false;
      P.forEach(function (p) {
        p.vy += .32; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.l = Math.max(0, 1 - (now - t0) / 2200);
        if (p.l > 0 && p.y < c.height + 20) { alive = true; g.save(); g.globalAlpha = p.l; g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); }
      });
      if (alive && now - t0 < 2600) requestAnimationFrame(step); else c.remove();
    })(t0);
    setTimeout(function () { c.remove(); }, 3200);
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType === 1 && n.classList && n.classList.contains('okk')) {
          n.classList.add('fxtoast');
          if (/received|approved|paid|created/i.test(n.textContent || '')) confetti(innerWidth / 2, innerHeight - 40);
        }
      });
    });
  }).observe(document.body, {childList: true});

  /* F. day / night change spreads out from the button like a ripple */
  function wipe() {
    if (!document.startViewTransition || reduce) return;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.thm'); if (!b || b.__fx) return;
      e.stopImmediatePropagation(); e.preventDefault();
      var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var t = document.startViewTransition(function () { b.__fx = true; b.click(); b.__fx = false; });
      t.ready.then(function () {
        document.documentElement.animate({clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)']}, {duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)'});
      }).catch(function () {});
    }, true);
  }

  /* G. main buttons lean a little toward the pointer */
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('button.pri'); if (!b) return;
      var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .08).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .15).toFixed(1) + 'px)';
    }, {passive: true});
    document.addEventListener('pointerout', function (e) { var b = e.target.closest && e.target.closest('button.pri'); if (b) b.style.transform = ''; }, {passive: true});
  }

  function boot() {
    net(); glow(); wipe();
    var nav = $('#tabs'), view = $('#view');
    setTimeout(chips, 50);
    if (nav) new MutationObserver(function () { setTimeout(chips, 0); }).observe(nav, {childList: true, subtree: true, characterData: true});
    if (view) {
      var tm;
      new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(function () { reveal(view); }, 60); }).observe(view, {childList: true, subtree: true});
      reveal(view);
    }
    var login = $('#login');
    if (login && !login.querySelector('.rings')) login.insertAdjacentHTML('afterbegin', '<div class="rings" aria-hidden="true"><i></i><i></i><i></i></div>');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
