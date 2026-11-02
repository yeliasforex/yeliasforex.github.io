/* Chart hover help for the account charts (My account and the home page): an instant tooltip with the name and value of the bar, slice or point under the pointer.
   The native browser tooltip is replaced, because it waits a second and then disappears. Purely additive. */
(function () {
  'use strict';
  var tip = document.createElement('div'); tip.className = 'acg-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
  var st = document.createElement('style'); st.textContent = '.acg-tip{position:fixed;z-index:9400;pointer-events:none;max-width:260px;padding:7px 11px;border-radius:10px;font-size:.8rem;font-weight:600;line-height:1.3;color:var(--fg);background:var(--panel);border:1px solid color-mix(in srgb,var(--gold) 45%,var(--line-2));box-shadow:0 14px 30px -12px rgba(0,0,0,.55)}'
    + '.acg-bg .acg-bar{transition:filter .15s,opacity .15s}.acg-bg:hover .acg-bar{filter:brightness(1.22) saturate(1.15)}.acg-bg:hover .acg-s{fill:var(--gold);fill-opacity:.12}.acg-b:hover .acg-bg:not(:hover) .acg-bar{opacity:.55}'
    + 'circle.acg-s:hover{fill-opacity:1!important;stroke:var(--gold)}.acg-d:hover circle.acg-s:not(:hover){opacity:.6}';
  document.head.appendChild(st); document.body.appendChild(tip);
  function text(el) {
    var t = el.querySelector && el.querySelector('title'); if (t) { el.setAttribute('data-tip', t.textContent); t.remove(); }
    return el.getAttribute('data-tip') || '';
  }
  function move(e) { var w = tip.offsetWidth, x = Math.min(innerWidth - w - 8, Math.max(8, e.clientX + 14)), y = e.clientY - tip.offsetHeight - 14; tip.style.left = x + 'px'; tip.style.top = (y < 8 ? e.clientY + 18 : y) + 'px'; }
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('.acg-s'); if (!el) { tip.hidden = true; return; }
    var t = text(el); if (!t) { tip.hidden = true; return; }
    tip.textContent = t; tip.hidden = false; move(e);
  }, true);
  document.addEventListener('mousemove', function (e) { if (!tip.hidden) move(e); }, {passive: true});
  document.addEventListener('mouseleave', function () { tip.hidden = true; }, true);
  addEventListener('scroll', function () { tip.hidden = true; }, {passive: true});
})();
