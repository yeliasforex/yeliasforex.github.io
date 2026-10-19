/* GoldTriEngine app: service worker, install prompt, platform detection. */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  document.documentElement.classList.toggle('is-app', standalone);
  var ua = navigator.userAgent || '';
  var os = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios'
    : /Android/.test(ua) ? 'android' : 'desktop';
  window.gteApp = { os: os, standalone: standalone, prompt: null, install: function () {
    var p = window.gteApp.prompt; if (!p) return Promise.resolve('none');
    p.prompt(); return p.userChoice.then(function (c) { window.gteApp.prompt = null; sync(); return c.outcome; });
  } };
  function sync() {
    var ok = !!window.gteApp.prompt && !standalone;
    document.querySelectorAll('[data-install]').forEach(function (b) { b.hidden = !ok; });
    document.querySelectorAll('[data-installed]').forEach(function (b) { b.hidden = !standalone; });
    document.querySelectorAll('[data-noprompt]').forEach(function (b) { b.hidden = ok || standalone; });
  }
  function chip() {
    if (standalone || /apps\.html/.test(location.pathname) || document.querySelector('.app-chip')) return;
    try { var x = +localStorage.getItem('gte_chip_x'); if (x && Date.now() - x < 7 * 864e5) return; } catch (e) {}
    var c = document.createElement('div'); c.className = 'app-chip'; c.setAttribute('role', 'region'); c.setAttribute('aria-label', 'Install the app');
    c.innerHTML = '<img src="icon-192.png" alt="" width="36" height="36"><span><b>Get the app</b><small>Alerts and your account, one tap away</small></span><button type="button" class="go">Install</button><button type="button" class="x" aria-label="Not now">&times;</button>';
    c.querySelector('.go').onclick = function () { c.remove(); window.gteApp.install(); };
    c.querySelector('.x').onclick = function () { c.remove(); try { localStorage.setItem('gte_chip_x', String(Date.now())); } catch (e) {} };
    document.body.appendChild(c);
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.gteApp.prompt = e; sync(); setTimeout(chip, 6000); });
  window.addEventListener('appinstalled', function () { window.gteApp.prompt = null; standalone = true; sync(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-install]'); if (b) { e.preventDefault(); window.gteApp.install(); }
  });
  document.addEventListener('DOMContentLoaded', function () {
    sync();
    var m = document.querySelector('[data-os-' + os + ']');
    document.querySelectorAll('.ap-os').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-os') === os); });
  });
})();
