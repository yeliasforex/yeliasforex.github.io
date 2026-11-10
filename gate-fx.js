/* GTE gate scenes with the real 3D robot (robot3d.html in a transparent frame).
   GTEGate.preload()              load the robot quietly (call when a code screen is shown)
   GTEGate.success(done, opts)    right code / signed in: the page darkens, a hyperspace warp builds, slows and ends, the site appears (done() runs then),
                                  and the robot flies in from far away with a light trail, hovers, says "Welcome back" and flies off. Nothing blocks the page.
                                  opts.resident = { wrap, frame }: the page's own robot (sign-in page). It takes off from where it stands and flies into the warp,
                                  so only one robot is ever on screen. opts.skipTunnel: the warp already played on the previous page.
   GTEGate.wrong(done, opts)      wrong code: the robot comes flying out of the distance burning and smoking, reaches the glass and blows up: every part of the
                                  3D model flies apart in slow motion, with fire, smoke, sparks and embers. opts.shake = element that shakes.
   Honours "reduce motion" (then done() runs at once). */
(function () {
  var SRC = (document.currentScript && document.currentScript.src) || location.href, ROBOT = new URL('robot3d.html?scene=happy&full=1&lq=1&v=20261102fly3', SRC).href;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active = false, frame = null, ready = false, readyCbs = [], busy = false, SP = null;
  var cl = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeIn = function (t) { return t * t * t; }, easeOut = function (t) { return 1 - Math.pow(1 - t, 3); }, easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function sprites() {
    if (SP) return SP;
    function spr(r, stops) { var c = document.createElement('canvas'); c.width = c.height = r * 2; var g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c; }
    SP = {
      hot: spr(64, [[0, 'rgba(255,250,225,1)'], [.3, 'rgba(255,205,100,.85)'], [.7, 'rgba(255,115,35,.35)'], [1, 'rgba(255,80,20,0)']]),
      fire: spr(64, [[0, 'rgba(255,195,85,.9)'], [.5, 'rgba(255,100,25,.5)'], [1, 'rgba(200,40,10,0)']]),
      dark: spr(64, [[0, 'rgba(205,62,22,.7)'], [.6, 'rgba(120,30,15,.35)'], [1, 'rgba(60,15,10,0)']]),
      smoke: spr(64, [[0, 'rgba(105,98,95,.85)'], [.55, 'rgba(78,72,70,.42)'], [1, 'rgba(55,50,50,0)']]),
      cyan: spr(32, [[0, 'rgba(210,248,255,.95)'], [.4, 'rgba(60,210,255,.45)'], [1, 'rgba(60,210,255,0)']])
    };
    return SP;
  }
  function bot(S) {
    if (frame) { if (S) { frame.S = S; frame.w.style.width = frame.w.style.height = S + 'px'; } return frame; }
    S = S || Math.round(Math.min(innerWidth * .82, innerHeight * .64, 440));
    var w = document.createElement('div'); w.setAttribute('aria-hidden', 'true');
    w.style.cssText = 'position:fixed;left:0;top:0;width:' + S + 'px;height:' + S + 'px;z-index:2147482100;pointer-events:none;opacity:0;will-change:transform,opacity;transform:translate3d(-9999px,0,0)';
    var f = document.createElement('iframe'); f.title = 'GoldTriEngine host robot'; f.tabIndex = -1; f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;color-scheme:light';
    f.onload = function () { setTimeout(function () { ready = true; if (!active) post({ paused: true });  var c = readyCbs.slice(); readyCbs = []; c.forEach(function (x) { x(); }); }, 900); };
    f.src = ROBOT; w.appendChild(f); document.body.appendChild(w); frame = { w: w, f: f, S: S };
    return frame;
  }
  function post(m, fr) { try { (fr || (frame && frame.f)).contentWindow.postMessage(m, '*'); } catch (e) {} }
  function place(el, W, x, y, s, a, rot) { el.style.transform = 'translate3d(' + (x - W / 2) + 'px,' + (y - W / 2) + 'px,0) scale(' + s + ')' + (rot ? ' rotate(' + rot + 'deg)' : ''); el.style.opacity = a; }
  function layer() {
    var c = document.createElement('canvas'), dpr = innerWidth < 700 ? .5 : .6, w = innerWidth, h = innerHeight;      // the effects are soft, so they are drawn at about half size and stretched: much lighter for the graphics card
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147482000;pointer-events:none'; c.setAttribute('aria-hidden', 'true');
    var g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); document.body.appendChild(c); return { c: c, g: g, w: w, h: h };
  }
  function bubble(text) {
    var d = document.createElement('div'); d.textContent = text; d.setAttribute('role', 'status');
    d.style.cssText = 'position:fixed;z-index:2147482200;pointer-events:none;padding:10px 18px;border-radius:14px;background:rgba(10,18,40,.92);border:1px solid rgba(60,210,255,.7);color:#fff;font:600 17px system-ui,Segoe UI,Arial,sans-serif;opacity:0;transition:opacity .4s,transform .4s;transform:translateY(8px);box-shadow:0 0 24px rgba(60,210,255,.35)';
    document.body.appendChild(d); return d;
  }
  function finish(parts) { parts.forEach(function (p) { if (p && p.parentNode) p.parentNode.removeChild(p); }); busy = false; active = false; if (frame) { frame.w.style.opacity = 0; frame.w.style.transform = 'translate3d(-9999px,0,0)'; post({ explodeStop: true, zoom: 1, fxStop: true }); setTimeout(function () { if (!active) post({ paused: true }); }, 600); } }
  /* a puff = one soft sprite that drifts, grows and fades (fire, smoke, light trail) */
  function puff(list, o) { list.push(o); }
  function drawPuffs(g, list, dt, kind) {
    var k, q, f, r, sp;
    for (k = list.length - 1; k >= 0; k--) {
      q = list[k]; q.t += dt; if (q.t < 0) continue; if (q.t >= q.l) { list.splice(k, 1); continue; }
      f = q.t / q.l; q.x += q.vx * dt / 16; q.y += q.vy * dt / 16; q.vx *= q.dr; q.vy = q.vy * q.dr + q.by;
      r = q.r * (1 + f * q.gr);
      if (kind === 'smoke') { g.globalAlpha = Math.min(1, f * 6) * (1 - f) * q.a; sp = SP.smoke; }
      else if (kind === 'trail') { g.globalAlpha = (1 - f) * q.a; sp = SP.cyan; }
      else { g.globalAlpha = Math.pow(1 - f, 1.1) * q.a; sp = f < .18 ? SP.hot : f < .55 ? SP.fire : SP.dark; }
      g.drawImage(sp, q.x - r, q.y - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;
  }

  /* ---------------------------------------------------------------- right code / signed in */
  function success(done, opts) {
    opts = opts || {}; var fired = false; function end() { if (!fired) { fired = true; if (done) done(); } }
    if (reduce || busy) return end(); busy = true; active = true; sprites(); var res = opts.resident || null, B = bot(); post({ paused: false });
    var L = layer(), g = L.g, w = L.w, h = L.h, cx = w / 2, cy = h * .42, T0 = performance.now(), i, S = Math.hypot(w, h), small = w < 640, warp0 = 0, st = [], trail = [], T0r = 0;
    var slow = false, tA = 0, nA = 0, TK = res ? 1000 : 0, TUN = opts.skipTunnel ? 0 : 2400, FL = 2600, HOLD = 2400, LV = 1500, started = false, hold0 = 0, leave0 = 0, bub = null, gone = false, lastT = T0, hx = w < 700 ? w * .5 : w * .68, hy = h * (w < 700 ? .6 : .56), rect = null, RW = 0;
    for (i = 0; i < (small ? 130 : 240); i++) st.push({ a: Math.random() * 6.283, r: Math.random() * .25, k: .6 + Math.random() * .9, c: i % 5 === 0 ? [127, 184, 255] : [220, 235, 255] });
    if (res) { window.__gateTakeover = true; rect = res.wrap.getBoundingClientRect(); RW = res.wrap.offsetWidth || rect.width; res.wrap.style.transition = 'none'; res.wrap.style.opacity = '1'; post({ pose: 'front', fx: 'fly' }, res.frame); }
    function fin() { gone = true; end(); if (res) { res.wrap.style.opacity = '0'; } finish([L.c, bub]); }
    function emitTrail(x, y, sc) { if (slow && Math.random() < .6) return; for (var k = 0; k < 2; k++) puff(trail, { x: x + rnd(-8, 8), y: y + rnd(-4, 4), vx: rnd(-.4, .4), vy: rnd(.3, 1.2), dr: .98, by: 0, r: (6 + rnd(0, 10)) * (.5 + sc), gr: 1.1, l: 450, t: 0, a: .5 }); }
    function drawTrail(dt) { g.globalCompositeOperation = 'lighter'; drawPuffs(g, trail, dt, 'trail'); g.globalCompositeOperation = 'source-over'; }
    function loop(now) {
      if (gone) return; var t = now - T0, dt = Math.min(50, now - lastT); lastT = now;
      if (nA < 30 && t > 300) { tA += dt; nA++; if (nA === 30 && tA / nA > 30) slow = true; }
      g.clearRect(0, 0, w, h);
      /* the page darkens; the page's own robot takes off into the centre and shrinks away */
      var bgA = res && t < TK ? easeIO(t / TK) : opts.skipTunnel ? 0 : 1;
      if (!res && !opts.skipTunnel) bgA = Math.min(1, t / 350);
      if (res && t < TK) { var p0 = easeIn(t / TK), rx = rect.left + rect.width / 2, ry = rect.top + rect.height / 2; place(res.wrap, RW, rx + (cx - rx) * p0, ry + (cy - ry) * p0, 1 - p0 * .94, 1 - p0 * .5, -10 * Math.sin(p0 * 3.14)); }
      else if (res) res.wrap.style.opacity = '0';
      /* the warp starts once the robot is ready (so the 3D loading never stutters the tunnel), at most 2.5 s after the takeoff */
      if (!opts.skipTunnel && !warp0 && t >= TK && (ready || t > TK + 2500)) warp0 = now;
      var wt = warp0 ? now - warp0 : 0, bg = bgA;
      if (warp0 && wt > TUN) bg = Math.max(0, 1 - (wt - TUN) / 900);
      if (opts.skipTunnel) bg = 0;
      if (bg > 0) {
        g.fillStyle = 'rgba(3,6,16,' + bg + ')'; g.fillRect(0, 0, w, h);
        var v = !warp0 ? .03 : wt < 800 ? .03 + easeIn(wt / 800) * .97 : wt < 1500 ? 1 : wt < TUN ? 1 - easeOut((wt - 1500) / (TUN - 1500)) * .93 : .07;
        var vg = g.createRadialGradient(cx, cy, 0, cx, cy, S * .55); vg.addColorStop(0, 'rgba(60,140,255,' + (.2 * bg * (.4 + v)) + ')'); vg.addColorStop(1, 'rgba(60,140,255,0)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
        for (i = 0; i < st.length; i++) {
          var s = st[i], pr = s.r; s.r += (.003 + v * .05) * s.k * (1 + s.r * 3) * (dt / 16);
          if (s.r > 1.15) { s.r = Math.random() * .05; s.a = Math.random() * 6.283; pr = s.r; }
          var R1 = pr * S * .6, R2 = s.r * S * .6, ca = Math.cos(s.a), sa = Math.sin(s.a), al = Math.min(1, s.r * 3) * bg;
          g.strokeStyle = 'rgba(' + s.c[0] + ',' + s.c[1] + ',' + s.c[2] + ',' + al + ')'; g.lineWidth = .8 + s.r * 1.6; g.beginPath(); g.moveTo(cx + ca * R1, cy + sa * R1); g.lineTo(cx + ca * R2, cy + sa * R2); g.stroke();
        }
      }
      if (!fired && (opts.skipTunnel || (warp0 && wt >= TUN - 300))) end();
      /* the robot flies in from far away to hover next to the content */
      var RS = opts.skipTunnel ? 0 : warp0 ? warp0 + TUN - 700 : 0;
      if (!started && ((opts.skipTunnel && ((ready && t > 450) || t > 2500)) || (warp0 && now >= RS && ready))) { started = true; hold0 = 0; T0r = now; post({ pose: 'front', fx: 'fly' }); }
      if (started) {
        var rt = now - T0r, S2 = B.S;
        if (rt < FL) { var p = easeOut(cl(rt / FL, 0, 1)), qx = cx + (hx - cx) * p + Math.sin(p * 3.14) * -w * .12, qy = h * .4 + (hy - h * .4) * p + Math.sin(p * 3.14) * h * .1, sc = .035 + p * .86;
          place(B.w, S2, qx, qy, sc, cl(rt / 400, 0, 1), -9 * Math.sin(p * 3.14)); emitTrail(qx, qy + S2 * sc * .36, sc); }
        else if (!leave0) {
          if (!hold0) { hold0 = now; post({ fxStop: true }); setTimeout(function () { post({ pose: 'wave' }); }, 150); bub = bubble('Welcome back'); }
          var by = hy + Math.sin(now / 480) * 7; place(B.w, S2, hx, by, .86, 1, 0);
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = .3; g.drawImage(SP.cyan, hx - S2 * .3, by + S2 * .28, S2 * .6, S2 * .16); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
          if (bub) { bub.style.left = Math.max(12, Math.min(w - 200, hx - 75)) + 'px'; bub.style.top = Math.max(12, by - S2 * .42 * .86 - 8) + 'px'; bub.style.opacity = 1; bub.style.transform = 'translateY(0)'; }
          if (now - hold0 > HOLD) { leave0 = now; if (bub) bub.style.opacity = 0; post({ pose: 'front', fx: 'fly' }); }
        } else {
          var lp = easeIn(cl((now - leave0) / LV, 0, 1)), lx = hx + (w * 1.1 - hx) * lp, ly = hy + (-h * .25 - hy) * lp; place(B.w, S2, lx, ly, .86 - lp * .6, 1 - lp * .6, -14 * lp); emitTrail(lx, ly + S2 * .3, .5);
          if (lp >= 1) { drawTrail(dt); return fin(); }
        }
      }
      drawTrail(dt);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    setTimeout(function () { if (!gone) fin(); }, 16000);
  }

  /* ---------------------------------------------------------------- wrong code */
  function wrong(done, opts) {
    opts = opts || {}; var fired = false; function end() { if (!fired) { fired = true; if (done) done(); } }
    if (reduce || busy) return end(); busy = true; active = true; sprites();
    var L = layer(), g = L.g, w = L.w, h = L.h, u = Math.min(w, h) / 700, cx = w / 2, cy = h * .5, small = w < 640, S2 = Math.round(Math.min(Math.max(w, h) * .62, 620)), B = bot(S2), T0 = performance.now(), lastT = T0; post({ paused: false });
    var started = false, rs = 0, hit = 0, gone = false, fire = [], smoke = [], sparks = [], embers = [], FLY = 1700, k, N = small ? .45 : .7, fadedBot = false, tAcc = 0, nAcc = 0;
    function fin() { gone = true; end(); finish([L.c]); }
    function impact() {
      hit = performance.now(); post({ fxStop: true }); post({ explode: true, zoom: 1.9 });
      if (opts.shake) { opts.shake.style.animation = 'none'; void opts.shake.offsetWidth; opts.shake.style.animation = 'gateShake .8s'; }
      for (k = 0; k < 70 * N; k++) { var a = Math.random() * 6.283, v = Math.random() * 11 * u; puff(fire, { x: cx + Math.cos(a) * 20 * u, y: cy + Math.sin(a) * 20 * u, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, dr: .95, by: -.03, r: rnd(60, 170) * u, gr: .9, l: rnd(700, 1500), t: -rnd(0, 160), a: .9 }); }
      for (k = 0; k < 60 * N; k++) { var a2 = Math.random() * 6.283, v2 = Math.random() * 6 * u; puff(smoke, { x: cx + Math.cos(a2) * 40 * u, y: cy + Math.sin(a2) * 40 * u, vx: Math.cos(a2) * v2, vy: Math.sin(a2) * v2 - 1, dr: .975, by: -.025, r: rnd(70, 150) * u, gr: 1.8, l: rnd(1600, 2800), t: -rnd(60, 500), a: .8 }); }
      for (k = 0; k < 220 * N; k++) { var a3 = Math.random() * 6.283, v3 = (2 + Math.random() * 13) * u; sparks.push({ x: cx, y: cy, vx: Math.cos(a3) * v3, vy: Math.sin(a3) * v3 - 2, l: 600 + Math.random() * 1100, t: 0, c: k % 5 === 0 ? '255,255,255' : k % 5 < 3 ? '255,195,80' : '255,95,35' }); }
      for (k = 0; k < 70 * N; k++) { var a4 = Math.random() * 6.283, v4 = (1 + Math.random() * 5) * u; embers.push({ x: cx, y: cy, vx: Math.cos(a4) * v4, vy: Math.sin(a4) * v4 - 1.5, l: 1500 + Math.random() * 1500, t: 0, r: 3 + Math.random() * 5, o: Math.random() * 6 }); }
    }
    function loop(now) {
      if (gone) return; var t = now - T0, dt = Math.min(50, now - lastT); lastT = now;
      if (started && !hit && nAcc < 24) { tAcc += dt; nAcc++; if (nAcc === 24 && tAcc / nAcc > 30) N *= .55; }      // a slower PC gets fewer particles, never a stuttering picture
      g.clearRect(0, 0, w, h);
      var dim = hit ? Math.max(.35, .7 - (now - hit) / 2400) : Math.min(.62, t / 500);
      g.fillStyle = 'rgba(22,0,4,' + dim + ')'; g.fillRect(0, 0, w, h);
      if (!started && t > 450 && (ready || t > 2600)) { started = true; rs = now; post({ pose: 'front', fx: 'fly' }); }
      if (started && !hit) {
        var p = cl((now - rs) / FLY, 0, 1), e = Math.pow(p, 2.3), sc = .04 + e * .96, rx = cx + Math.sin(p * 7) * (1 - p) * 52 * u, ry = cy - h * .12 * (1 - e) + h * .02 * e, rot = Math.sin(p * 11) * 7 * (1 - p * .4);
        place(B.w, S2, rx, ry, sc, cl(p * 6, 0, 1), rot);
        var al = Math.max(0, .1 * Math.sin(now / 120) * p); g.fillStyle = 'rgba(255,40,40,' + al + ')'; g.fillRect(0, 0, w, h);      // alarm light
        if (p > .1) for (k = 0; k < 1; k++) { puff(smoke, { x: rx + rnd(-10, 10) * sc * 6, y: ry + rnd(-20, 40) * sc * 6, vx: rnd(-.5, .5), vy: rnd(-.4, .6), dr: .985, by: -.01, r: (14 + 50 * sc) * u * rnd(.7, 1.2), gr: 2.2, l: 1100, t: 0, a: .7 * p }); puff(fire, { x: rx + rnd(-8, 8) * sc * 6, y: ry + rnd(-10, 30) * sc * 6, vx: rnd(-.7, .7), vy: rnd(-.2, 1), dr: .97, by: -.02, r: (8 + 40 * sc) * u * rnd(.7, 1.2), gr: .6, l: 520, t: 0, a: .9 * p }); }
        if (p >= 1) impact();
      }
      if (hit) {
        var ht = now - hit;
        /* the light of the blast, the flash and the shock rings */
        var glow = Math.max(0, 1 - ht / 1200); g.globalCompositeOperation = 'lighter';
        var gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .7); gr.addColorStop(0, 'rgba(255,170,60,' + .55 * glow + ')'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'source-over';
        if (ht < 260) { g.fillStyle = 'rgba(255,238,205,' + Math.pow(1 - ht / 260, 1.5) * .95 + ')'; g.fillRect(0, 0, w, h); }
        for (k = 0; k < 2; k++) { var rr = (ht - k * 120) * (1.1 + k * .5); if (rr > 0) { g.beginPath(); g.arc(cx, cy, rr, 0, 6.283); g.strokeStyle = 'rgba(255,' + (190 - k * 60) + ',' + (110 - k * 40) + ',' + Math.max(0, .75 - ht / 900) + ')'; g.lineWidth = 5 - k * 2; g.stroke(); } }
        if (ht > 1400) end();
        if (ht > 2000 && !fadedBot) { fadedBot = true; B.w.style.transition = 'opacity .7s'; B.w.style.opacity = 0; }
      }
      drawPuffs(g, smoke, dt, 'smoke');
      g.globalCompositeOperation = 'lighter'; drawPuffs(g, fire, dt, 'fire');
      for (k = sparks.length - 1; k >= 0; k--) { var q = sparks[k]; q.t += dt; if (q.t > q.l) { sparks.splice(k, 1); continue; } var px = q.x, py = q.y; q.x += q.vx; q.y += q.vy; q.vy += .16; q.vx *= .99; var f = q.t / q.l; g.strokeStyle = 'rgba(' + q.c + ',' + (1 - f) + ')'; g.lineWidth = 1.7; g.beginPath(); g.moveTo(px, py); g.lineTo(q.x, q.y); g.stroke(); }
      for (k = embers.length - 1; k >= 0; k--) { var m = embers[k]; m.t += dt; if (m.t > m.l) { embers.splice(k, 1); continue; } m.x += m.vx; m.y += m.vy; m.vy += .02; var ff = m.t / m.l; g.globalAlpha = (1 - ff) * (.6 + .4 * Math.sin(m.t / 60 + m.o)); g.drawImage(SP.fire, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (hit && now - hit > 3100) return fin();
      requestAnimationFrame(loop);
    }
    if (!document.getElementById('gateShakeCss')) { var sty = document.createElement('style'); sty.id = 'gateShakeCss'; sty.textContent = '@keyframes gateShake{0%,100%{transform:translateX(0)}10%{transform:translateX(-16px)}22%{transform:translateX(14px)}34%{transform:translateX(-11px)}46%{transform:translateX(9px)}60%{transform:translateX(-5px)}75%{transform:translateX(3px)}}'; document.head.appendChild(sty); }
    requestAnimationFrame(loop);
    setTimeout(function () { if (!gone) fin(); }, 12000);
  }

  window.GTEGate = { preload: function () { if (!reduce) { bot(); sprites(); } }, success: success, wrong: wrong };
})();
