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
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.gteApp.prompt = e; sync(); });
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
