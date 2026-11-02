/* Chart hover help for the account charts (My account, the home page, Partner and Admin): an instant tooltip with the name and value of the bar, slice or point under the pointer.
   The native browser tooltip is replaced, because it waits a second and then disappears. Purely additive. */
(function () {
  'use strict';
  var tip = document.createElement('div'); tip.className = 'acg-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
  var st = document.createElement('style'); st.textContent = '.acg-tip{position:fixed;z-index:9400;pointer-events:none;min-width:120px;max-width:260px;padding:9px 13px 10px;border-radius:14px;line-height:1.25;color:var(--fg,var(--text,#222));background:var(--tipbg,var(--panel,#fff));border:1px solid color-mix(in srgb,var(--gold,var(--amber,#e3b95f)) 45%,transparent);box-shadow:0 18px 38px -14px rgba(0,0,0,.6),0 0 0 1px color-mix(in srgb,var(--gold,var(--amber,#e3b95f)) 12%,transparent)}'
    + '.acg-tip .t-l{display:flex;align-items:center;gap:7px;font-size:.74rem;font-weight:600;opacity:.75}.acg-tip .t-l i{width:9px;height:9px;border-radius:3px;flex:none}.acg-tip .t-v{display:block;margin-top:3px;font-size:1.12rem;font-weight:800;letter-spacing:-.01em}.acg-tip .t-h{display:block;margin-top:4px;font-size:.66rem;opacity:.55}'
    + '.acg-bg .acg-bar{transition:filter .15s,opacity .15s}.acg-bg .acg-bar{transform-box:fill-box;transform-origin:center bottom}.acg-bg:hover .acg-bar{filter:brightness(1.22) saturate(1.15) drop-shadow(0 4px 7px rgba(0,0,0,.35));transform:scaleX(1.16)}.acg-bg:hover [data-g]{fill:var(--gold,var(--amber,#e3b95f));fill-opacity:.12}svg:hover .acg-bg:not(:hover) .acg-bar{opacity:.55}'
    + 'circle[data-g]:not([fill="none"]):hover{fill-opacity:1!important;stroke:var(--gold,var(--amber,#e3b95f))}svg circle[fill="none"][data-g]{transition:stroke-width .18s,opacity .18s,filter .18s}button.acg-on{background:color-mix(in srgb,var(--gold,var(--amber,#e3b95f)) 14%,transparent)!important;font-weight:700}svg circle[fill="none"][data-g].acg-hot{stroke-width:19!important;filter:brightness(1.15) drop-shadow(0 0 5px color-mix(in srgb,currentColor 40%,transparent))}svg circle[fill="none"][data-g].acg-dim{opacity:.35}';
  document.head.appendChild(st); document.body.appendChild(tip);
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function text(el) {
    var t = el.querySelector && el.querySelector('title'); if (t) { el.setAttribute('data-tip', t.textContent); t.remove(); }
    return el.getAttribute('data-tip') || '';
  }
  function move(e) { var w = tip.offsetWidth, x = Math.min(innerWidth - w - 8, Math.max(8, e.clientX + 14)), y = e.clientY - tip.offsetHeight - 14; tip.style.left = x + 'px'; tip.style.top = (y < 8 ? e.clientY + 18 : y) + 'px'; }
  /* donut slices: the slice under the pointer (or its legend row) grows, the others dim, and the centre shows its share and name */
  var DON = 'circle[fill="none"][data-g]';
  function slices(c) { return [].slice.call(c.ownerSVGElement.querySelectorAll(DON)); }
  function hot(c, on) {
    var svg = c.ownerSVGElement, tx = svg.querySelectorAll('text'); if (!svg.__c) svg.__c = [tx[0] && tx[0].textContent, tx[1] && tx[1].textContent, tx[0] && tx[0].style.fontSize];
    slices(c).forEach(function (x) { x.classList.toggle('acg-hot', on && x === c); x.classList.toggle('acg-dim', on && x !== c); });
    var wrap = c.closest('.acg-d, .pdg-d, .gcd'); if (wrap) [].forEach.call(wrap.querySelectorAll('button[data-g][data-i]'), function (b) { b.classList.toggle('acg-on', on && b.dataset.g === c.dataset.g && b.dataset.i === c.dataset.i); });
    if (!tx[0]) return;
    if (!on) { tx[0].textContent = svg.__c[0]; if (tx[1]) tx[1].textContent = svg.__c[1]; tx[0].style.fontSize = svg.__c[2]; return; }
    var d = (c.getAttribute('stroke-dasharray') || '0').split(' '), r = +c.getAttribute('r') || 38, pc = Math.round((+d[0] + 1.2) / (2 * Math.PI * r) * 100), lab = (c.getAttribute('data-tip') || (c.querySelector('title') || {}).textContent || '').split(':')[0];
    tx[0].textContent = pc + '%'; tx[0].style.fontSize = '15px'; if (tx[1]) tx[1].textContent = lab.length > 16 ? lab.slice(0, 15) + '…' : lab;
  }
  function sliceFor(el) {            // a slice, or the legend row that belongs to one
    if (el.matches && el.matches(DON)) return el;
    var b = el.closest && el.closest('button[data-g][data-i]'); if (!b || !b.closest('.acg-d, .pdg-d, .gcd')) return null;
    var svg = b.closest('.acg-d, .pdg-d, .gcd').querySelector('svg'); return svg && svg.querySelector('circle[data-g="' + b.dataset.g + '"][data-i="' + b.dataset.i + '"]');
  }
  var lastHot = null;
  document.addEventListener('mouseover', function (e) {
    var c = e.target.closest && sliceFor(e.target.closest('circle,button') || e.target);
    if (c && c !== lastHot) { if (lastHot) hot(lastHot, false); text(c); lastHot = c; hot(c, true); }
    else if (!c && lastHot) { hot(lastHot, false); lastHot = null; }
  }, true);
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('.acg-s, .pdg-s, .gcs'); if (!el) { tip.hidden = true; return; }
    var t = text(el); if (!t || el.matches('circle[fill="none"]')) { tip.hidden = true; return; }
    var k = t.lastIndexOf(': '), lab = k > 0 ? t.slice(0, k) : t, val = k > 0 ? t.slice(k + 2) : '', g = el.parentNode, bar = g && g.querySelector && g.querySelector('.acg-bar'), colr = (bar && bar.getAttribute('fill')) || el.getAttribute('fill') || el.getAttribute('stroke') || 'var(--gold,var(--amber,#e3b95f))';
    if (colr === 'transparent' || colr === 'none') colr = 'var(--gold,var(--amber,#e3b95f))';
    tip.innerHTML = '<span class="t-l"><i style="background:' + colr + '"></i>' + esc(lab) + '</span>' + (val ? '<b class="t-v">' + esc(val) + '</b>' : '') + '<span class="t-h">Click for the details</span>'; tip.hidden = false; move(e);
  }, true);
  document.addEventListener('mousemove', function (e) { if (!tip.hidden) move(e); }, {passive: true});
  document.addEventListener('mouseleave', function () { tip.hidden = true; }, true);
  addEventListener('scroll', function () { tip.hidden = true; }, {passive: true});
})();
