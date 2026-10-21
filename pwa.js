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

  /* ---- installed app only: no marketing site, just the account and its related pages ---- */
  function appOnly() {
    if (!window.gteApp.standalone && !/[?&]appui=1/.test(location.search)) return;
    var path = location.pathname.split('/').pop() || 'index.html';
    if (/^(index\.html|free-backtest\.html|gold-ea-mt5\.html|best-gold-ea-mt5\.html|goldtriengine-review\.html|fusion-markets-ic-markets-gold-ea\.html)$/.test(path) && !/appui=1/.test(location.search)) { location.replace('my-account.html'); return; }
    var keep = /^(my-account|pricing|guide|faq|download|apps)\.html/;
    document.querySelectorAll('.nav a').forEach(function (a) { var h = a.getAttribute('href') || ''; if (!keep.test(h) || a.classList.contains('pill')) a.hidden = true; });
    var br = document.querySelector('.brand'); if (br) br.setAttribute('href', 'my-account.html');
    var f = document.querySelector('body > footer, footer'); if (f) f.hidden = true;
  }

  /* ---- installed app only: bottom bar and a one-time welcome ---- */
  function appUi() {
    if ((!window.gteApp.standalone && !/[?&]appui=1/.test(location.search)) || window.innerWidth > 760) return;
    var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var items = [['Account', 'my-account.html#tab=overview', I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'), 'overview'],
                 ['Results', 'my-account.html#tab=results', I('<path d="M3 17l5-6 4 3 8-9"/><path d="M14 5h6v6"/>'), 'results'],
                 ['Settings', 'my-account.html#settings', I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'), 'settings'],
                 ['Plans', 'pricing.html', I('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>'), 'plans']];
    var nav = document.createElement('nav'); nav.className = 'app-tabs'; nav.setAttribute('aria-label', 'App');
    nav.innerHTML = items.map(function (x) { return '<a href="' + x[1] + '" data-k="' + x[3] + '">' + x[2] + '<span>' + x[0] + '</span></a>'; }).join('') + '<button type="button" class="tab-menu" aria-label="Menu">' + I('<path d="M4 7h16M4 12h16M4 17h16"/>') + '<span>Menu</span></button>';
    document.body.appendChild(nav); document.documentElement.classList.add('has-tabbar');
    function mark() {
      var path = location.pathname.split('/').pop() || 'index.html', h = (location.hash.match(/tab=(\w+)/) || [])[1] || 'overview';
      nav.querySelectorAll('a').forEach(function (a) { var k = a.dataset.k, on = path === 'pricing.html' ? k === 'plans' : path === 'my-account.html' ? (location.hash === '#settings' ? k === 'settings' : (k === h || (k === 'overview' && ['trades', 'inbox', 'billing', 'overview'].indexOf(h) > -1))) : false; a.classList.toggle('on', on); });
    }
    mark(); window.addEventListener('hashchange', mark);
    nav.querySelector('.tab-menu').onclick = function () { var b = document.querySelector('.menu-btn'); if (b) b.click(); };
    try { if (!localStorage.getItem('gte_welcome')) setTimeout(welcome, 1200); } catch (e) {}
  }
  function welcome() {
    if (document.getElementById('gte-welcome')) return;
    var o = document.createElement('div'); o.id = 'gte-welcome'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Welcome');
    o.innerHTML = '<div class="wl-card"><img src="icon-192.png" alt="" width="56" height="56"><h2>Welcome to GoldTriEngine</h2><p>Three steps to get going:</p>'
      + '<ol><li><b>Get the EA on your PC.</b> <a href="download.html">Download and set up</a> (MetaTrader 5 on Windows).</li><li><b>Paste your key</b> and attach it to a gold chart. Your status turns green here.</li><li><b>Turn on phone alerts</b> in <a href="my-account.html#settings">Settings</a>.</li></ol>'
      + '<button type="button" class="wl-ok">Got it</button></div>';
    o.querySelector('.wl-ok').onclick = function () { try { localStorage.setItem('gte_welcome', '1'); } catch (e) {} o.remove(); };
    o.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem('gte_welcome', '1'); } catch (e) {} }); });
    document.body.appendChild(o);
  }
  document.addEventListener('DOMContentLoaded', function () {
    sync();
    appOnly();
    appUi();
    var m = document.querySelector('[data-os-' + os + ']');
    document.querySelectorAll('.ap-os').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-os') === os); });
  });
})();
