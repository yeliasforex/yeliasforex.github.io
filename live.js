/* Live status card at the top of My account: EA online / waiting / offline / paused, a ring that shows how fresh the last
   report is, a heartbeat line, today's result and the open trade. Updates itself every second without reloading the page. */
(function () {
  var timer = null, D = null, shown = null;
  var ICON = {
    trade: '<path d="M3 17l5-6 4 3 8-9"/><path d="M14 5h6v6"/>',
    wait: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    rest: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    off: '<path d="M2 2l20 20"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5-2.7M19 12.9a10 10 0 0 0-2.4-1.9"/><path d="M12 20h.01"/>',
    warn: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
    "new": '<path d="M12 3v9"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0"/>',
    stop: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  var R = 42, C = 2 * Math.PI * R;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function marketClosed(now) {                                 // gold: closed from Friday ~22:00 UTC to Sunday ~22:00 UTC
    var d = new Date(now), w = d.getUTCDay(), h = d.getUTCHours();
    return w === 6 || (w === 5 && h >= 22) || (w === 0 && h < 22);
  }
  function span(min) {
    if (min < 1) return 'just now';
    if (min < 60) return Math.floor(min) + ' min ago';
    if (min < 1440) return Math.floor(min / 60) + ' h ' + Math.floor(min % 60) + ' min ago';
    return Math.floor(min / 1440) + ' d ago';
  }
  function model(d, now) {
    var l = d.l, st = d.st || {}, hb = st.last_heartbeat ? new Date(st.last_heartbeat).getTime() : null;
    var offMin = d.offMin, since = hb ? (now - hb) / 60000 : null, s;
    if (l.status === 'unused') s = 'new';
    else if (l.status === 'expired' || l.status === 'disabled') s = 'stop';
    else if (!hb) s = 'new';
    else if (st.online === false || since > offMin + 1) s = 'off';
    else if (d.err) s = 'warn';
    else if ((st.open_positions || 0) > 0) s = 'trade';
    else if (marketClosed(now)) s = 'rest';
    else s = 'wait';
    if (d.force) { s = d.force; }
    var m = { s: s, since: since, fresh: (s === 'off' || s === 'new' || s === 'stop' || since == null) ? 0 : Math.max(0, Math.min(1, 1 - since / offMin)) };
    var n = st.open_positions || 0, ago = since == null ? '' : span(since);
    if (s === 'trade') { m.title = 'EA online, trade open'; m.sub = 'Managing ' + n + ' open position' + (n === 1 ? '' : 's') + '. Every trade has a stop loss.'; }
    else if (s === 'wait') { m.title = 'EA online, watching gold'; m.sub = 'No open trade right now. That is normal between signals.'; }
    else if (s === 'rest') { m.title = 'Market closed, EA resting'; m.sub = 'Gold is closed for the weekend. The EA is online and picks up when trading resumes on Monday.'; }
    else if (s === 'off') { m.title = 'EA offline'; m.sub = 'No report for ' + (ago ? ago.replace(' ago', '') : 'a while') + '. Open trades keep their stop loss.'; }
    else if (s === 'warn') { m.title = d.err ? d.err.title : 'EA needs attention'; m.sub = d.err ? d.fill(d.err.explanation) : ''; }
    else if (s === 'new') { m.title = l.status === 'active' ? 'Waiting for the first report' : 'Not started yet'; m.sub = 'Attach your key to an XAUUSD chart in MT5. The EA reports here within a few minutes.'; }
    else { m.title = l.status === 'expired' ? 'License expired' : 'License disabled'; m.sub = l.status === 'expired' ? 'The EA no longer opens new trades. Renew to continue.' : 'This key was disabled. Contact support.'; }
    m.ago = ago;
    return m;
  }
  function foot(s, d) {
    var sup = '<a class="btn sm" href="https://t.me/GoldTriEngine_Support" rel="noopener">Ask support</a>';
    if (s === 'off') return '<div class="lv-steps"><b>What to do</b><ol><li>MT5 is open and connected (green bars bottom right).</li><li>Algo Trading is ON and the EA shows a smiling face on the chart.</li><li>Your PC or VPS and its internet are running.</li></ol></div><div class="row"><a class="btn sm" href="faq.html">Fix guide</a>' + sup + '</div>';
    if (s === 'warn') return '<div class="lv-steps"><b>What to do</b><p>' + esc(d.fill(d.err.solution)) + '</p></div>';
    if (s === 'new') return '<div class="row"><a class="btn sm mint" href="download.html">Download EA</a><a class="btn sm" href="download.html">Setup in 6 steps</a></div>';
    if (s === 'stop') return '<div class="row">' + (d.l.status === 'expired' ? '<a class="btn sm mint" href="#tab=billing" data-go="billing">Renew</a>' : '') + sup + '</div>';
    return '';
  }
  function html(d) {
    D = d; var now = Date.now(), m = model(d, now), st = d.st || {}, l = d.l;
    var online = m.s === 'trade' || m.s === 'wait' || m.s === 'rest' || m.s === 'warn';
    var fl = (st.equity != null && st.balance != null) ? st.equity - st.balance : null;
    var openTxt = online ? ((st.open_positions || 0) + (fl != null && (st.open_positions || 0) > 0 ? ' · ' + d.sgn(fl) : '')) : (st.open_positions == null ? '-' : st.open_positions + ' (last known)');
    return '<section class="lv lv-' + m.s + '" id="lv" aria-live="polite">'
      + '<div class="lv-orb"><i class="lv-ripple"></i><i class="lv-ripple r2"></i><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="lv-track" cx="50" cy="50" r="' + R + '"/><circle class="lv-arc" cx="50" cy="50" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - m.fresh)).toFixed(1) + '"/></svg>'
      + '<svg class="lv-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[m.s] + '</svg></div>'
      + '<div class="lv-main"><div class="lv-eyebrow"><span class="lv-live"></span>Live status</div>'
      + '<h2 class="lv-title">' + esc(m.title) + '</h2><p class="lv-sub">' + esc(m.sub) + '</p>'
      + '<div class="lv-meta"><span class="lv-ago">' + (m.ago ? 'Last report ' + esc(m.ago) : 'No report yet') + '</span>' + (st.ea_version ? '<span>EA v' + esc(st.ea_version) + '</span>' : '') + '<span class="lv-chk">Checked just now</span></div>'
      + '<svg class="lv-ecg" viewBox="0 0 240 36" preserveAspectRatio="none" aria-hidden="true"><path class="lv-flat" d="M0 18H240"/><path class="lv-base" pathLength="1" d="M0 18H40L48 18L54 6L62 30L68 12L74 18H120L128 18L134 6L142 30L148 12L154 18H200L208 18L214 6L222 30L228 12L234 18H240"/><path class="lv-beat" pathLength="1" d="M0 18H40L48 18L54 6L62 30L68 12L74 18H120L128 18L134 6L142 30L148 12L154 18H200L208 18L214 6L222 30L228 12L234 18H240"/></svg></div>'
      + '<div class="lv-stats"><div><span>Today, closed</span><b style="color:' + d.col(d.today) + '" data-cu="' + d.today + '" data-f="sgn">' + d.sgn(d.today) + '</b></div>'
      + '<div><span>Open trades</span><b class="lv-open">' + esc(openTxt) + '</b></div>'
      + '<div><span>Equity</span><b' + (st.equity != null ? ' data-cu="' + st.equity + '" data-f="usd"' : '') + '>' + (st.equity != null ? d.usd(st.equity) : '-') + '</b></div></div>'
      + '<div class="lv-foot">' + foot(m.s, d) + '</div></section>';
  }
  function paint() {
    var el = document.getElementById('lv'); if (!el || !D) return;
    var now = Date.now(), m = model(D, now);
    if (m.s !== shown) {
      shown = m.s; el.className = 'lv lv-' + m.s;
      el.querySelector('.lv-title').textContent = m.title; el.querySelector('.lv-sub').textContent = m.sub;
      el.querySelector('.lv-foot').innerHTML = foot(m.s, D);
      el.querySelector('.lv-ico').innerHTML = ICON[m.s];
      el.querySelectorAll('.lv-foot [data-go]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var t = document.querySelector('#subnav a[data-tab="' + a.dataset.go + '"]'); if (t) t.click(); }; });
    }
    var a = el.querySelector('.lv-arc'); if (a) a.setAttribute('stroke-dashoffset', (C * (1 - m.fresh)).toFixed(1));
    var g = el.querySelector('.lv-ago'); if (g) g.textContent = m.ago ? 'Last report ' + m.ago : 'No report yet';
    var c = el.querySelector('.lv-chk'); if (c) { var s = Math.floor((now - D.at) / 1000); c.textContent = 'Checked ' + (s < 5 ? 'just now' : s < 60 ? s + ' s ago' : Math.floor(s / 60) + ' min ago'); }
    el.classList.toggle('lv-late', m.s !== 'off' && m.since != null && m.since > D.beatMin * 1.6 && m.s !== 'new' && m.s !== 'stop');
  }
  function mount() {
    shown = null; if (timer) clearInterval(timer);
    var el = document.getElementById('lv'); if (!el) return;
    shown = (el.className.match(/lv-(\w+)/) || [])[1];
    el.querySelectorAll('.lv-foot [data-go]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var t = document.querySelector('#subnav a[data-tab="' + a.dataset.go + '"]'); if (t) t.click(); }; });
    timer = setInterval(function () { if (!document.hidden) paint(); }, 1000);
    paint();
  }
  window.gteLive = { html: html, mount: mount };
})();
