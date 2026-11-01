/* Admin polish: tab icons, count-up numbers, light that follows the pointer, card tilt, command centre bar, quick search (Ctrl/Cmd+K), page-change sweep.
   Purely visual: it never touches data, and the admin works the same if this file does not load. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  var ICON = {
    orders: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    visitors: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    funnel: 'M22 3H2l8 9.46V19l4 2v-8.54z',
    licenses: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    health: 'M22 12h-4l-3 9L9 3l-3 9H2',
    customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    proof: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    blog: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
    support: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    email: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
    revenue: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    marketing: 'M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8a5 5 0 010 8M19 5a9 9 0 010 14',
    affiliates: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
    settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    backtest: 'M12 20V10M18 20V4M6 20v-4',
    videos: 'M5 3l14 9-14 9z',
    audit: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2zM9 12h6M9 16h6'
  };
  function svg(k) { return '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICON[k] || ICON.orders) + '"/></svg>'; }

  /* 1. tab icons (the tab bar is rebuilt on every render, so watch it) */
  function iconTabs() {
    var nav = $('#tabs'); if (!nav) return;
    nav.querySelectorAll('button[data-t]').forEach(function (b) { if (!b.querySelector('.ti')) b.insertAdjacentHTML('afterbegin', svg(b.dataset.t)); });
  }

  /* 2. numbers count up when a view opens */
  var RX = /^([^\d-]{0,3})(-?[\d,]+(?:\.\d+)?)([^\d]{0,4})$/;
  function countUp(root) {
    if (reduce) return;
    root.querySelectorAll('.kx b:not([data-cu]),.kpi b:not([data-cu]),.gt b:not([data-cu])').forEach(function (el) {
      el.dataset.cu = '1';
      if (el.children.length) return;
      var m = RX.exec(el.textContent.trim()); if (!m) return;
      var raw = m[2], dec = (raw.split('.')[1] || '').length, to = parseFloat(raw.replace(/,/g, '')), comma = raw.indexOf(',') > -1;
      if (!isFinite(to) || Math.abs(to) < 2 || Math.abs(to) > 1e9) return;
      var finalTxt = el.textContent; setTimeout(function () { el.textContent = finalTxt; }, 2200);
      var t0 = performance.now(), dur = 900 + Math.min(600, Math.log10(Math.abs(to) + 1) * 120);
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4), v = to * e;
        var s = v.toFixed(dec); if (comma) { var parts = s.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = parts.join('.'); }
        el.textContent = m[1] + s + m[3];
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* 3. page-change sweep */
  function sweep() {
    var bar = $('#fxbar'); if (!bar) return;
    bar.classList.remove('go'); void bar.offsetWidth; bar.classList.add('go');
  }

  /* 4. command centre bar under the tabs */
  function hero() {
    var app = $('#app'), nav = $('#tabs'); if (!app || !nav || $('#hero')) return;
    var h = document.createElement('div'); h.id = 'hero';
    h.innerHTML = '<div class="hr-l"><div class="hr-k"><span class="hr-dot"></span><span id="hrk">COMMAND CENTRE</span></div><div class="hr-t" id="hrt">Welcome back</div><div class="hr-s" id="hrs"></div></div>' +
      '<div class="hr-r"><button type="button" class="hr-q" id="hrq"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><span>Jump to...</span><kbd>Ctrl K</kbd></button></div>';
    nav.parentNode.insertBefore(h, nav.nextSibling);
    $('#hrq').onclick = openPalette;
    var DESC = {orders: 'Payments to confirm and every order, newest first', visitors: 'Who is visiting, from where, and what they read', funnel: 'From first visit to account to paying customer', licenses: 'Every key: who has it, until when, on which account', health: 'Your PC, website, payments and alerts, checked for you', customers: 'Everyone who signed up and what they own', proof: 'The public wall of results and reviews', blog: 'Articles that bring visitors in from search', support: 'Questions and requests from customers', email: 'Messages to customers and their delivery', revenue: 'Money in, refunds, renewals and the trend', marketing: 'Channels, campaigns and what each one earns', affiliates: 'Partners, commissions and payouts', settings: 'Plans, prices and how the platform behaves', backtest: 'Run the engine on past gold data', videos: 'Videos shown on the site', audit: 'A permanent record of every admin action'};
    function clock() {
      var d = new Date(), hr = d.getHours(), on = $('#tabs button.on'), k = on && on.dataset.t;
      var g = hr < 5 ? 'Working late' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
      $('#hrk').textContent = (g + ' · ' + d.toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})).toUpperCase();
      $('#hrt').textContent = on ? on.textContent.replace(/\d+$/, '').trim() : 'Overview';
      $('#hrs').textContent = DESC[k] || '';
    }
    window.__fxClock = clock;
    clock(); setInterval(clock, 15000);
  }

  /* 5. light that follows the pointer + gentle tilt on the number cards */
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.card,.kpi,.gt'); if (!el) return;
    var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
    if (fine && !reduce && el.classList.contains('kx')) {
      el.style.setProperty('--ry', ((x / r.width - .5) * 7).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((.5 - y / r.height) * 7).toFixed(2) + 'deg');
    }
  }, {passive: true});
  document.addEventListener('pointerout', function (e) {
    var el = e.target.closest && e.target.closest('.kx'); if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  }, {passive: true});

  /* 6. quick search: Ctrl/Cmd+K or "/" */
  var pal;
  function actions() {
    var out = [];
    document.querySelectorAll('#tabs button[data-t]').forEach(function (b) {
      out.push({k: b.dataset.t, name: b.textContent.replace(/\d+$/, '').trim(), hint: 'Open tab', run: function () { b.click(); }});
    });
    out.push({k: 'theme', name: 'Switch day / night', hint: 'Appearance', run: function () { var t = $('.thm'); if (t) t.click(); }});
    out.push({k: 'revenue', name: 'Reload this page', hint: 'Refresh', run: function () { location.reload(); }});
    return out;
  }
  function openPalette() {
    if (pal) return closePalette();
    var list = actions(), sel = 0, shown = list;
    pal = document.createElement('div'); pal.id = 'fxpal';
    pal.innerHTML = '<div class="fp-box" role="dialog" aria-label="Quick search"><div class="fp-in"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="fpq" placeholder="Jump to a tab or action..." autocomplete="off"><kbd>Esc</kbd></div><div class="fp-ls" id="fpl"></div></div>';
    document.body.appendChild(pal);
    var q = $('#fpq', pal), ls = $('#fpl', pal);
    function paint() {
      ls.innerHTML = shown.length ? shown.map(function (a, i) { return '<button type="button" class="fp-it' + (i === sel ? ' on' : '') + '" data-i="' + i + '">' + svg(a.k) + '<b>' + a.name.replace(/[<>&]/g, '') + '</b><small>' + a.hint + '</small></button>'; }).join('') : '<div class="fp-no">Nothing matches</div>';
      var on = $('.fp-it.on', ls); if (on && on.scrollIntoView) on.scrollIntoView({block: 'nearest'});
    }
    function go(i) { var a = shown[i]; if (!a) return; closePalette(); a.run(); }
    q.oninput = function () { var s = q.value.trim().toLowerCase(); shown = s ? list.filter(function (a) { return (a.name + ' ' + a.hint).toLowerCase().indexOf(s) > -1; }) : list; sel = 0; paint(); };
    q.onkeydown = function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === 'Enter') { go(sel); e.preventDefault(); }
    };
    ls.onclick = function (e) { var b = e.target.closest('.fp-it'); if (b) go(+b.dataset.i); };
    pal.onclick = function (e) { if (e.target === pal) closePalette(); };
    paint(); requestAnimationFrame(function () { pal.classList.add('in'); q.focus(); });
  }
  function closePalette() { if (!pal) return; var p = pal; pal = null; p.classList.remove('in'); setTimeout(function () { p.remove(); }, 180); }
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { if (!$('#app') || $('#app').classList.contains('hide')) return; e.preventDefault(); openPalette(); }
    else if (e.key === '/' && !typing && $('#app') && !$('#app').classList.contains('hide')) { e.preventDefault(); openPalette(); }
    else if (e.key === 'Escape' && pal) closePalette();
  });

  /* wire up */
  function boot() {
    var grain = document.createElement('div'); grain.id = 'fxgrain'; document.body.appendChild(grain);
    var bar = document.createElement('div'); bar.id = 'fxbar'; document.body.appendChild(bar);
    hero(); iconTabs();
    var nav = $('#tabs'), view = $('#view');
    if (nav) new MutationObserver(iconTabs).observe(nav, {childList: true});
    if (view) {
      var tmr; new MutationObserver(function () { clearTimeout(tmr); tmr = setTimeout(function () { countUp(view); }, 50); }).observe(view, {childList: true, subtree: true});
      new MutationObserver(function () { sweep(); }).observe(view, {childList: true});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
