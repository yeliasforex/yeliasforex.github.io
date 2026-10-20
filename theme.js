/* Animations: Auto follows the phone's setting; On ignores "reduce motion"; Off stops them (saved on this device). */
(function () {
  var mo = null; try { mo = localStorage.getItem('gte_motion'); } catch (e) {}
  var os = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.GTE_REDUCED = mo === 'off' ? true : mo === 'on' ? false : os;
  var r = document.documentElement; if (mo === 'off') r.classList.add('motion-off');
  if (mo === 'on' && os) {
    var strip = function () {
      try { for (var i = 0; i < document.styleSheets.length; i++) { var sh = document.styleSheets[i], rules; try { rules = sh.cssRules; } catch (e) { continue; }
        for (var j = rules.length - 1; j >= 0; j--) { var ru = rules[j]; if (ru.type === 4 && /prefers-reduced-motion/.test(ru.conditionText || (ru.media && ru.media.mediaText) || '')) sh.deleteRule(j); } } } catch (e) {}
    };
    document.addEventListener('DOMContentLoaded', strip); window.addEventListener('load', strip);
  }
})();
/* Day / night switch. Loaded in <head> so the chosen theme is applied before the page paints (no flash). Day mode is the default until the visitor switches; the choice is remembered. */
(function () {
  var KEY = 'gte_theme_v2', root = document.documentElement, t = null;
  try { t = localStorage.getItem(KEY); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = 'light';
  function apply(v) {
    root.setAttribute('data-theme', v);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', v === 'light' ? '#F4F6FB' : '#06080E');
    var b = document.querySelector('.theme-btn'); if (b) { b.setAttribute('aria-label', v === 'light' ? 'Switch to night mode' : 'Switch to day mode'); b.setAttribute('title', v === 'light' ? 'Night mode' : 'Day mode'); }
  }
  apply(t);
  function mount() {
    if (document.querySelector('.theme-btn')) return;
    var host = document.querySelector('.top .wrap'); if (!host) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'theme-btn';
    b.innerHTML = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8z"/></svg>' +
      '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var menu = host.querySelector('.menu-btn'); if (menu) menu.before(b); else host.appendChild(b);
    b.onclick = function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.classList.add('theme-anim'); apply(next); try { localStorage.setItem(KEY, next); } catch (e) {}
      setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    };
    apply(root.getAttribute('data-theme'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
