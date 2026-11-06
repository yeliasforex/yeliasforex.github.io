/* Live status card at the top of My account: EA online / waiting / offline / paused, a ring that shows how fresh the last
   report is, a heartbeat line, today's result and the open trade. Updates itself every second without reloading the page. */
(function () {
  var timer = null, D = null, shown = null;
  var ICON = {
    trade: '<path d="M3 17l5-6 4 3 8-9"/><path d="M14 5h6v6"/>',
    wait: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
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
    if (s === 'new') return '<div class="row"><a class="btn sm mint" href="download.html">Set up in 6 steps</a></div>';
    if (s === 'stop') return '<div class="row">' + (d.l.status === 'expired' ? '<a class="btn sm mint" href="#tab=billing" data-go="billing">Renew</a>' : '') + sup + '</div>';
    return '';
  }
  function detail(d) {
    var R_ = d.R, tr = (d.todayTrades || []).slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); });
    var wins = tr.filter(function (x) { return x.profit > 0; }).length, run = 0, cum = tr.map(function (x) { run += x.profit; return run; });
    var rows = tr.slice().reverse().slice(0, 6).map(function (x) {
      return '<div class="lv-tr"><span class="lv-tt">' + new Date(x.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>'
        + '<span class="chip" style="--c:' + (R_.ECL[x.engine] || '#888') + '">' + esc(R_.ENG[x.engine] || '') + '</span>'
        + '<span class="lv-sd">' + (x.dir > 0 ? 'Buy' : 'Sell') + '</span><b style="color:' + d.col(x.profit) + '">' + d.sgn(x.profit) + '</b></div>';
    }).join('');
    return '<button class="lv-more" type="button" aria-expanded="false" aria-controls="lv-d"><span>Today in detail</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
      + '<div class="lv-detail" id="lv-d"><div class="lv-di"><div class="lv-dh"><b>Closed trades today</b><span>' + (tr.length ? tr.length + ' trade' + (tr.length === 1 ? '' : 's') + ', ' + wins + ' won' : 'none yet') + '</span></div>'
      + (tr.length ? '<div class="lv-sp">' + R_.spark(cum.length > 1 ? cum : [0].concat(cum), cum.length && cum[cum.length - 1] < 0 ? '#FF6B78' : '#3EE09A', 44) + '</div>' + rows : '<p class="lv-none">No trade has closed today. The EA only trades when its rules give a signal.</p>')
      + '</div></div>';
  }
  function html(d) {
    D = d; var now = Date.now(), m = model(d, now), st = d.st || {}, l = d.l;
    var online = m.s === 'trade' || m.s === 'wait' || m.s === 'rest' || m.s === 'warn';
    var fl = (st.equity != null && st.balance != null) ? st.equity - st.balance : null;
    var openHtml = st.open_positions == null ? '-' : esc(String(st.open_positions)) + ' <small class="lv-lk">last known</small>';
    var openTxt = online ? ((st.open_positions || 0) + (fl != null && (st.open_positions || 0) > 0 ? ' · ' + d.sgn(fl) : '')) : (st.open_positions == null ? '-' : st.open_positions + ' (last known)');
    return '<section class="lv lv-' + m.s + '" id="lv">'
      + '<div class="lv-orb"><i class="lv-ripple"></i><i class="lv-ripple r2"></i><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="lv-track" cx="50" cy="50" r="' + R + '"/><circle class="lv-arc" cx="50" cy="50" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - m.fresh)).toFixed(1) + '"/></svg>'
      + '<svg class="lv-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[m.s] + '</svg></div>'
      + '<div class="lv-main"><div class="lv-eyebrow"><span class="lv-live"></span>Live status</div>'
      + '<h2 class="lv-title" role="status">' + esc(m.title) + '</h2><p class="lv-sub">' + esc(m.sub) + '</p>'
      + '<div class="lv-meta"><span class="lv-ago">' + (m.ago ? 'Last report ' + esc(m.ago) : 'No report yet') + '</span>' + (st.ea_version ? '<span>EA v' + esc(st.ea_version) + '</span>' : '') + (d.upd ? '<a class="lv-up" href="download.html">Update v' + esc(d.upd) + ' available</a>' : '') + '<span class="lv-chk">Checked just now</span></div>'
      + '<svg class="lv-ecg" viewBox="0 0 240 36" preserveAspectRatio="none" aria-hidden="true"><path class="lv-flat" d="M0 18H240"/><path class="lv-base" pathLength="1" d="M0 18H40L48 18L54 6L62 30L68 12L74 18H120L128 18L134 6L142 30L148 12L154 18H200L208 18L214 6L222 30L228 12L234 18H240"/><path class="lv-beat" pathLength="1" d="M0 18H40L48 18L54 6L62 30L68 12L74 18H120L128 18L134 6L142 30L148 12L154 18H200L208 18L214 6L222 30L228 12L234 18H240"/></svg></div>'
      + '<div class="lv-stats"><div><span>Today, closed</span><b style="color:' + d.col(d.today) + '" data-cu="' + d.today + '" data-f="sgn">' + d.sgn(d.today) + '</b></div>'
      + '<div><span>Open trades</span><b class="lv-open">' + (online && (st.open_positions || 0) > 0 && fl != null ? (st.open_positions || 0) + ' &middot; <span style="color:' + d.col(fl) + '">' + esc(d.sgn(fl)) + '</span>' : (online ? esc(openTxt) : openHtml)) + '</b></div>'
      + '<div><span>Floating</span><b style="color:' + (fl == null ? 'inherit' : d.col(fl)) + '">' + (fl == null || !online ? '-' : d.sgn(fl)) + '</b></div></div>'
      + detail(d)
      + '<div class="lv-foot">' + foot(m.s, d) + '</div></section>';
  }
  function paint() {
    var el = document.getElementById('lv'); if (!el || !D) return;
    var now = Date.now(), m = model(D, now);
    if (m.s !== shown) {
      shown = m.s; el.className = 'lv lv-' + m.s + (el.classList.contains('lv-open') ? ' lv-open' : '') + (el.classList.contains('lv-late') ? ' lv-late' : '') + (el.classList.contains('lv-paused') ? ' lv-paused' : '');
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
    shown = (el.className.match(/lv-(\w+)/) || [])[1]; bind(el);
    el.querySelectorAll('.lv-foot [data-go]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var t = document.querySelector('#subnav a[data-tab="' + a.dataset.go + '"]'); if (t) t.click(); }; });
    var mb = el.querySelector('.lv-more'), dt = el.querySelector('.lv-detail');
    if (mb) mb.onclick = function () { var o = !el.classList.contains('lv-open'); el.classList.toggle('lv-open', o); mb.setAttribute('aria-expanded', o); try { sessionStorage.setItem('gte_lv_open', o ? '1' : ''); } catch (e) {} };
    try { if (sessionStorage.getItem('gte_lv_open') === '1') { el.classList.add('lv-open'); if (mb) mb.setAttribute('aria-expanded', 'true'); } } catch (e) {}
    try { if (window.IntersectionObserver) { if (window.__lvIO) window.__lvIO.disconnect(); window.__lvIO = new IntersectionObserver(function (es) { el.classList.toggle('lv-paused', !es[0].isIntersecting); }); window.__lvIO.observe(el); } } catch (e) {}
    timer = setInterval(function () { if (!document.hidden) paint(); }, 1000);
    paint();
  }
  function refresh(st) { if (!D || !st) return; D.st = st; D.at = Date.now(); paint(); }

  /* ---- every part of the card opens a sheet with the real details behind it ---- */
  function when(t) { return t ? new Date(t).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'never'; }
  function dkey(x) { var y = new Date(x); return y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); }
  function sheet(title, sub, text, rows, links) {
    if (!window.gteSheet || !D) return;
    var h = (text ? '<p class="gs-lead">' + text + '</p>' : '') + '<div class="gs-kv">' + rows.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><b' + (r[2] ? ' style="color:' + r[2] + '"' : '') + '>' + esc(r[1]) + '</b></div>'; }).join('') + '</div>'
      + (links || []).map(function (l) { return l[2] ? '<a class="gs-more" href="' + l[2] + '">' + esc(l[1]) + '</a>' : '<button type="button" class="gs-more" data-lv="' + l[0] + '">' + esc(l[1]) + '</button>'; }).join('');
    window.gteSheet.open({ k: 'explain', title: title, sub: sub, html: h });
  }
  function figs() {
    var st = D.st || {}, fl = (st.equity != null && st.balance != null) ? st.equity - st.balance : null, m = model(D, Date.now());
    return { st: st, fl: fl, m: m, online: m.s === 'trade' || m.s === 'wait' || m.s === 'rest' || m.s === 'warn' };
  }
  var STATES = [['Online, trade open', 'A report arrived and at least one trade is running.'], ['Online, watching gold', 'No trade now. Normal between signals.'], ['Market closed', 'Weekend: gold does not trade.'], ['Offline', 'No report for longer than the limit. Open trades keep their stop loss.'], ['Needs attention', 'The EA reported a problem, with what to do about it.']];
  var ENGC = { Alpha: '#7FA6FF', Beta: '#4BE3A6', Gamma: '#F2B84B', Momentum: '#7FA6FF', Intraday: '#4BE3A6', DayFlow: '#F2B84B' };
  function posSheet(P, st, f, asof, state, usd) {                         // one card per running position, from the EA report
    var tot = 0, now = Date.now();
    var cards = P.map(function (p) {
      var pl = Number(p.pl) || 0, dir = Number(p.dir) > 0 ? 1 : -1, risk = Math.abs(p.entry - p.stop), mv = (p.now - p.entry) * dir, r = risk > 0 && p.stop ? mv / risk : null, ec = ENGC[p.engine] || '#7FA6FF';
      var open = p.opened ? Math.max(0, now / 1000 - p.opened) : 0, held = open >= 3600 ? Math.floor(open / 3600) + 'h ' + Math.floor(open % 3600 / 60) + 'm' : Math.max(1, Math.floor(open / 60)) + 'm';
      var w = r == null ? 0 : Math.min(100, Math.abs(r) / 2 * 50), bar = r == null ? '' : '<div class="lv-rail"><i class="' + (r >= 0 ? 'g' : 'r') + '" style="' + (r >= 0 ? 'left:50%' : 'right:50%') + ';width:' + w.toFixed(1) + '%"></i></div>';
      tot += pl;
      var c = D.col(pl);
      return '<div class="lv-pos"><div class="lv-p1"><span class="lv-sd ' + (dir > 0 ? 'b' : 's') + '">' + (dir > 0 ? 'BUY' : 'SELL') + '</span><span class="lv-en" style="--c:' + ec + '">' + esc(p.engine || '') + '</span><span class="lv-lt">' + Number(p.lots).toFixed(2) + ' lot</span><b style="color:' + c + '">' + D.sgn(pl) + '</b></div>'
        + '<div class="lv-p2"><div><span>Entry</span><b>' + Number(p.entry).toFixed(2) + '</b></div><div><span>Now</span><b>' + Number(p.now).toFixed(2) + '</b></div><div><span>Stop</span><b>' + (p.stop ? Number(p.stop).toFixed(2) : 'none') + '</b></div><div><span>Open</span><b>' + held + '</b></div></div>' + bar + '</div>';
    }).join('');
    var css = '<style>.lv-pos{border:1px solid var(--line,rgba(128,140,170,.28));border-radius:14px;padding:12px 14px;margin:0 0 10px;background:var(--card,rgba(128,140,170,.08))}.lv-p1{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lv-p1 b{margin-left:auto;font-size:18px}.lv-sd{font:800 11px/1 inherit;padding:4px 8px;border-radius:999px;letter-spacing:.06em}.lv-sd.b{background:rgba(14,159,110,.16);color:#0E9F6E}.lv-sd.s{background:rgba(229,72,77,.16);color:#E5484D}.lv-en{font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px;color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent)}.lv-lt{font-size:13px;opacity:.75}.lv-p2{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.lv-p2 span{display:block;font-size:11px;opacity:.65}.lv-p2 b{font-size:14px}.lv-rail{position:relative;height:6px;border-radius:3px;margin-top:10px;background:rgba(128,140,170,.22)}.lv-rail:before{content:"";position:absolute;left:50%;top:-3px;width:2px;height:12px;background:rgba(128,140,170,.6)}.lv-rail i{position:absolute;top:0;height:6px;border-radius:3px}.lv-rail i.g{background:#0E9F6E}.lv-rail i.r{background:#E5484D}.lv-tot{display:flex;justify-content:space-between;padding:8px 2px 0;font-weight:600}</style>';
    var h = css + cards + '<div class="lv-tot"><span>Floating total</span><b style="color:' + D.col(tot) + '">' + D.sgn(tot) + '</b></div><p class="gs-lead" style="font-size:12px;opacity:.7;margin-top:8px">Last report ' + esc(asof) + '. Bar: distance from entry in risk units (full = 2R).</p>'
      + '<a class="gs-more" href="#" data-lv="trades" onclick="return false">All closed trades</a>';
    window.gteSheet.open({ k: 'explain', title: 'Open trades', sub: P.length + ' running', html: h });
  }
  function dayRange() {                                                  // the highest and lowest floating result of today, from the EA's reports (one about every 5 minutes)
    var L = (D && D.log) || [], v = L.map(function (x) { return { t: x.at, f: x.equity - x.balance }; }).filter(function (x) { return isFinite(x.f); });
    if (D && D.st && D.st.equity != null && D.st.balance != null) v.push({ t: new Date().toISOString(), f: D.st.equity - D.st.balance });
    if (v.length < 3) return [];
    var hi = v.reduce(function (a, x) { return x.f > a.f ? x : a; }), lo = v.reduce(function (a, x) { return x.f < a.f ? x : a; }), hm = function (x) { return new Date(x).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
    return [['Highest today', D.sgn(hi.f) + ' at ' + hm(hi.t), D.col(hi.f)], ['Lowest today', D.sgn(lo.f) + ' at ' + hm(lo.t), D.col(lo.f)], ['Reports today', String(v.length - 1)]];
  }
  function actions(a) {
    if (!D) return; var f = figs(), st = f.st, usd = D.usd || function (n) { return '$' + Number(n).toFixed(2); };
    if (a === 'status') {
      var t = f.m.s === 'warn' && D.err ? D.fill(D.err.explanation) + (D.err.solution ? ' What to do: ' + D.fill(D.err.solution) : '') : f.m.sub;
      sheet(f.m.title, 'Live status of your EA', esc(t), [['Last report', st.last_heartbeat ? when(st.last_heartbeat) + (f.m.ago ? ' (' + f.m.ago + ')' : '') : 'none yet'], ['Reports arrive', 'about every ' + D.beatMin + ' min'], ['Marked offline after', D.offMin + ' min without a report'], ['MT5 account', D.l && D.l.bound_account ? String(D.l.bound_account) : 'not attached yet'], ['Broker', D.l && D.l.bound_broker ? D.l.bound_broker : '-']], [['fresh', 'How fresh is this?']]);
    } else if (a === 'fresh') {
      sheet('How fresh is this?', 'The ring and the heartbeat line', 'The ring is full right after a report and empties as time passes. Open trades keep their stop loss if the EA goes offline.',
        [['Last report', st.last_heartbeat ? when(st.last_heartbeat) : 'none yet'], ['Age', f.m.ago || '-'], ['Page checked', Math.max(0, Math.floor((Date.now() - D.at) / 1000)) + ' s ago'], ['Reports arrive', 'about every ' + D.beatMin + ' min'], ['Offline after', D.offMin + ' min']]);
    } else if (a === 'version') {
      sheet('EA version', D.upd ? 'An update is available' : 'You are up to date', D.upd ? 'A newer version is ready. Download it, replace the file in MT5 and attach it to the chart again. Your key stays the same.' : 'This is the newest version we have published.',
        [['Installed on MT5', st.ea_version ? 'v' + st.ea_version : 'unknown yet'], ['Latest published', D.upd ? 'v' + D.upd : (st.ea_version ? 'v' + st.ea_version : '-')]], D.upd ? [['', 'Download the latest EA', 'download.html']] : [['', 'See what changed', 'changelog.html']]);
    } else if (a === 'open' || a === 'float') {
      var n = st.open_positions || 0, state = st.engine_state ? String(st.engine_state) : '-', asof = st.last_heartbeat ? when(st.last_heartbeat) + (f.m.ago ? ' (' + f.m.ago + ')' : '') : 'no report yet';
      var pct = (f.fl != null && st.balance) ? (f.fl / st.balance * 100) : null, fc = f.fl == null ? null : D.col(f.fl);
      var base = [['Last report from the EA', asof]];
      var P = Array.isArray(st.positions) ? st.positions : [];
      if (a === 'open' && P.length && f.online) { posSheet(P, st, f, asof, state, usd); return; }
      if (a === 'open') {
        sheet('Open trades', f.online ? (n ? n + ' open in the last report' : 'None open in the last report') : 'Last known: ' + n + ' open',
          (f.online ? '' : 'EA not reporting: last known state.'),
          base.concat([['Open positions', String(n)], ['Engine state', state], ['Floating result', f.fl == null ? '-' : D.sgn(f.fl), fc], ['Equity', st.equity != null ? usd(st.equity) : '-'], ['Balance', st.balance != null ? usd(st.balance) : '-']]),
          [['today', 'Trades closed today'], ['trades', 'All closed trades']]);
      } else {
        sheet('Floating result', 'Profit or loss on what is still open',
          'Equity minus balance: what open trades would make or lose if closed now.' + (f.online ? '' : ' EA not reporting: last known value.'),
          base.concat([['Equity', st.equity != null ? usd(st.equity) : '-'], ['Balance', st.balance != null ? usd(st.balance) : '-'], ['Floating (equity \u2212 balance)', f.fl == null ? '-' : D.sgn(f.fl), fc], ['As a share of the balance', pct == null ? '-' : (pct >= 0 ? '+' : '\u2212') + Math.abs(pct).toFixed(2) + '%', fc], ['Open positions', String(n)]].concat(dayRange())),
          [['open', 'Open trades']]);
      }
    } else if (a === 'today') {
      var tr = D.todayTrades || [];
      if (tr.length && window.gteSheet.sel) { window.gteSheet.sel('cday:' + dkey(tr[0].closed_at)); return; }
      sheet('Today, closed', 'Result of trades that closed today', '', [['Closed today', String(tr.length)], ['Result', D.sgn(D.today || 0), D.col(D.today || 0)]], [['trades', 'Open the Trades tab']]);
    } else if (a === 'trades') {
      var t = document.querySelector('#subnav a[data-tab="trades"]'); if (window.gteSheet.close) window.gteSheet.close(); if (t) t.click();
    }
  }
  function bind(el) {
    function mk(node, a, label) { if (!node) return; node.classList.add('lv-click'); node.setAttribute('role', 'button'); node.setAttribute('tabindex', '0'); if (label) node.setAttribute('aria-label', label); node.dataset.lva = a; }
    mk(el.querySelector('.lv-orb'), 'status', 'What this status means');
    mk(el.querySelector('.lv-title'), 'status'); mk(el.querySelector('.lv-sub'), 'status'); mk(el.querySelector('.lv-eyebrow'), 'status');
    mk(el.querySelector('.lv-ago'), 'fresh'); mk(el.querySelector('.lv-chk'), 'fresh'); mk(el.querySelector('.lv-ecg'), 'fresh');
    var ver = [].slice.call(el.querySelectorAll('.lv-meta > span')).filter(function (x) { return /^EA v/.test(x.textContent); })[0]; mk(ver, 'version');
    var up = el.querySelector('.lv-up'); if (up) { up.dataset.lva = 'version'; up.addEventListener('click', function (e) { e.preventDefault(); }); up.setAttribute('role', 'button'); }
    var st = el.querySelectorAll('.lv-stats > div'); mk(st[0], 'today', 'Today, closed: details'); mk(st[1], 'open', 'Open trades: details'); mk(st[2], 'float', 'Floating result: details');
    mk(el.querySelector('.lv-steps'), 'status');
    [].forEach.call(el.querySelectorAll('.lv-tr'), function (r, i) { r.classList.add('lv-click'); r.setAttribute('role', 'button'); r.setAttribute('tabindex', '0'); r.dataset.lvt = i; });
    if (el.__lvb) return; el.__lvb = 1;
    var go = function (e) {
      var t = e.target.closest ? e.target.closest('.lv-tr[data-lvt]') : null;
      if (t && el.contains(t)) { var tr = (D && D.todayTrades || []).slice().sort(function (a, b) { return new Date(a.closed_at) - new Date(b.closed_at); }).reverse()[+t.dataset.lvt]; if (tr && window.gteSheet) { e.preventDefault(); window.gteSheet.trade(tr); } return; }
      var n = e.target.closest ? e.target.closest('[data-lva]') : null; if (n && el.contains(n)) { e.preventDefault(); actions(n.dataset.lva); }
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.lv-click')) { e.preventDefault(); go(e); } });
  }
  if (!window.__lvDoc) { window.__lvDoc = 1; document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#gs [data-lv]'); if (b) { e.preventDefault(); actions(b.dataset.lv); } }); }
  window.gteLive = { html: html, mount: mount, refresh: refresh };
})();
