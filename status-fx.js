/* System status page, premium layer: one banner for the overall state and a tile for every check. Every tile opens what it checks,
   how fast it answered and what it means for you if it is down. Called by the checks on status.html; the plain list stays as the fallback. */
(function () {
  'use strict';
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  function sheet(c, when) {
    var rows = [['Status', c.ok ? 'Working' : 'Not answering', c.ok ? 'var(--mint)' : 'var(--red)'], ['Detail', c.text || '-']];
    if (c.ms != null) rows.push(['Answered in', c.ms + ' ms']);
    rows.push(['Checked', when]);
    return {k: 'explain', title: c.name, sub: c.ok ? 'Everything is fine here' : 'This check failed just now', html: '<p class="gs-lead">' + E(c.about) + '</p>'
      + '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + E(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + E(r[1]) + '</b></div>'; }).join('') + '</div>'
      + '<p class="gs-fine">' + E(c.ok ? 'If this ever stops answering, nothing you already run is affected.' : c.ifDown) + '</p>'};
  }
  window.gteStatus = function (checks) {
    var ul = document.getElementById('st'); if (!ul) return;
    var when = new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}) + ' (your time)', bad = checks.filter(function (c) { return !c.ok; });
    var box = document.createElement('div'); box.className = 'pubx-card ' + (bad.length ? 'warn' : 'ok'); box.style.margin = '6px 0 18px';
    box.innerHTML = '<div class="pubx-st"><span class="pubx-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + (bad.length ? '<path d="M12 7v6M12 17h.01"/>' : '<path d="M5 12.5l4.5 4.5L19 7.5"/>') + '</svg></span><div><small class="pubx-k">SYSTEM STATUS</small><h2>'
      + (bad.length ? (bad.length === 1 ? '1 check is not answering' : bad.length + ' checks are not answering') : 'Everything is answering') + '</h2><p>Checked at ' + when + ', from your own browser. Tap a check for what it means.</p></div></div>'
      + '<div class="pubx-t pstx">' + checks.map(function (c, i) { return '<button type="button" data-i="' + i + '"><small>' + E(c.name.toUpperCase()) + '</small><b class="' + (c.ok ? 'up' : 'dn') + '">' + (c.ok ? 'OK' : 'DOWN') + '</b><em>' + E(c.short || c.text || '') + '</em></button>'; }).join('') + '</div>';
    ul.parentNode.replaceChild(box, ul);
    [].forEach.call(box.querySelectorAll('[data-i]'), function (b) { b.onclick = function () { if (window.gteSheet) window.gteSheet.open(sheet(checks[+b.dataset.i], when)); }; });
    var w = document.getElementById('st-when'); if (w) w.textContent = 'Checked ' + when;
  };
})();
