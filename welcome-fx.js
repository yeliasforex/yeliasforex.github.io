/* Customer entry moment after an email-link or Google sign-in, using the gate scenes (gate-fx.js): a calm warp, the site appears, our 3D robot flies in
   from far away, says "Welcome back" and flies off. Loaded in <head> so it sees the sign-in link before the page's own code removes it.
   Never plays on a normal visit. Skips itself for people who asked for reduced motion. */
(function () {
  var link = /[#&?]access_token=/.test(location.hash + location.search) || /[?&]code=[0-9a-f-]{30,}/i.test(location.search);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, SRC = (document.currentScript && document.currentScript.src) || '';
  function loadGate(cb) {
    if (window.GTEGate) return cb();
    var s = document.createElement('script'); s.src = new URL('gate-fx.js?v=1', SRC || location.href).href; s.onload = cb; s.onerror = cb; document.head.appendChild(s);
  }
  function arrive() {
    var flag = false; try { var t = +sessionStorage.getItem('gte_arrive') || 0; flag = Date.now() - t < 20000; sessionStorage.removeItem('gte_arrive'); } catch (e) {}
    if (reduce || !(link || flag)) return;
    loadGate(function () { if (window.GTEGate) GTEGate.success(null, { skipTunnel: flag && !link }); });
  }
  window.GTEWelcome = {
    fromLink: link,
    play: function (done) {                                    // signin page, Google sign-in: warp now, the robot flight continues on the next page
      if (reduce) return done && done();
      loadGate(function () { if (!window.GTEGate) return done && done(); try { sessionStorage.setItem('gte_arrive', String(Date.now())); } catch (e) {} var wr = document.getElementById('siRoam'), fr = document.getElementById('siRobot'); GTEGate.success(done, wr && fr && wr.classList.contains('on') ? { resident: { wrap: wr, frame: fr } } : {}); });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrive); else arrive();
})();
