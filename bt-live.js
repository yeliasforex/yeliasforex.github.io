/* Home page: shows the backtest report that was published in Admin -> Backtest (return by year, months, balance curve, numbers).
   If none is published, or the request fails, the built-in numbers in the page stay as they are. */
(function () {
  var U = 'https://ekljeyquxvlfbeadgszx.supabase.co', K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ymd(s) { var p = s.split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function long(s) { var a = ymd(s); return a.d + ' ' + MON[a.m - 1] + ' ' + a.y; }
  function short(s) { var a = ymd(s); return a.d + ' ' + MON[a.m - 1].slice(0, 3) + ' ' + a.y; }
  function n0(v) { return Number(v).toLocaleString('en-US'); }

  function setCount(b, val, text) { if (!b) return; b.setAttribute('data-count', val); b.textContent = text; }
  function statByLabel(label) { var all = document.querySelectorAll('.stat'); for (var i = 0; i < all.length; i++) { var sp = all[i].querySelector('span'); if (sp && sp.textContent.trim() === label) return all[i].querySelector('b'); } return null; }
  function holdPhrase(h) { var p = String(h || '').split(':'); if (p.length < 2) return ''; var hh = +p[0], mm = +p[1]; return hh ? hh + ' h ' + (mm < 10 ? '0' : '') + mm + ' min' : mm + ' min'; }

  function yearsCard(r) {
    var g = $('.yrs-g'); if (!g || !r.years || !r.years.length) return;
    var e = ymd(r.end), part = e.m < 12 || e.d < 20, mx = Math.max.apply(null, r.years.map(function (y) { return y[1]; }).concat([1])), html = '';
    r.years.forEach(function (y, i) {
      var v = y[1], neg = v < 0, lab = (part && i === r.years.length - 1) ? y[0] + ' so far' : String(y[0]);
      html += '<div class="yrc"><small>' + lab + '</small><b' + (neg ? ' style="color:#FF6B78"' : '') + '>' + (neg ? '&minus;' : '+') + '<span>' + Math.abs(v) + '%</span></b><i style="--w:' + (neg ? 8 : Math.max(8, Math.round(v / mx * 100))) + '%"></i></div>';
    });
    g.innerHTML = html;
    g.style.gridTemplateColumns = r.years.length <= 4 ? 'repeat(' + r.years.length + ',1fr)' : 'repeat(auto-fit,minmax(88px,1fr))';
    var p = g.parentElement.querySelector('p');
    if (p) {
      var co = (r.company || '').replace(/\s+(Pty|Ltd|LLC|Limited|Inc)\b.*$/i, '').trim() || 'Fusion Markets', every = r.years.every(function (y) { return y[1] >= 100; });
      p.innerHTML = 'Backtest on gold, ' + short(r.start) + ' to ' + short(r.end) + ', ' + esc(co) + ' data, simulated. $' + n0(r.deposit) + ' start, MT5 Strategy Tester, ' + esc(r.leverage || '1:100') + ' leverage. '
        + (every ? 'Every year in the test finished well above +100%. ' : '') + 'Real trading will differ: results are never guaranteed and you can lose money. <a href="#backtest">See the full report</a>';
    }
  }

  function curveInner(r) {
    var pts = r.pts, d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L'), last = pts[pts.length - 1], first = pts[0];
    var area = d + ' L' + last[0] + ' 272.0 L' + first[0] + ' 272.0 Z';
    var grid = ['14.0', '78.5', '143.0', '207.5', '272.0'].map(function (y) { return '<line class="gridl" x1="8" x2="632" y1="' + y + '" y2="' + y + '"/>'; }).join('');
    var years = Object.keys(r.year_x).map(function (y) { var x = r.year_x[y]; return '<line class="gridl" x1="' + x + '" x2="' + x + '" y1="14" y2="272"/><text class="yl" x="' + (x + 6).toFixed(1) + '" y="292">' + y + '</text>'; }).join('');
    return '<defs><linearGradient id="eqFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3EE09A" stop-opacity=".22"/><stop offset="1" stop-color="#3EE09A" stop-opacity="0"/></linearGradient></defs>'
      + grid + years + '<path class="area" d="' + area + '"/><path class="line" d="' + d + '"/><circle class="tip" cx="' + last[0] + '" cy="' + last[1] + '" r="4"/><line class="xh" x1="0" x2="0" y1="14" y2="272"/><circle class="xd" cx="0" cy="0" r="4.5"/>';
  }

  function money(v) { return (v >= 0 ? '+' : '-') + '$' + n0(Math.abs(Math.round(v))); }
  function shortMoney(v) { var a = Math.abs(v), body = a >= 1000 ? (a / 1000).toFixed(1) + 'k' : String(Math.round(a)); return (v >= 0 ? '+' : '-') + '$' + body; }
  function monthGrid(r) {
    var by = {}; r.months.forEach(function (m) { by[m[0] * 12 + m[1] - 1] = m; });
    var s = ymd(r.start), e = ymd(r.end), cells = '<span></span>' + 'JFMAMJJASOND'.split('').map(function (c) { return '<span class="mh">' + c + '</span>'; }).join('');
    for (var y = s.y; y <= e.y; y++) {
      cells += '<span class="y">' + y + '</span>';
      for (var mo = 1; mo <= 12; mo++) {
        var m = by[y * 12 + mo - 1];
        if (m && m[2] !== 0) {
          var v = m[2], p = m[3], label = MON[mo - 1] + ' ' + y, part = (y === e.y && mo === e.m) ? ' data-part="1"' : '', sg = v >= 0 ? '+' : '-';
          var txt = label + ': ' + (v >= 0 ? 'won ' : 'lost ') + sg + '$' + n0(Math.abs(Math.round(v))) + ' (' + sg + Math.abs(p).toFixed(1) + '%)';
          cells += '<span class="m ' + (v > 0 ? 'p' : 'l') + '" tabindex="0" role="button" data-m="' + label + '" data-v="' + Math.round(v) + '" data-p="' + p.toFixed(1) + '" data-s="' + shortMoney(v) + '"' + part + ' aria-label="' + txt + '" title="' + txt + '"></span>';
        } else cells += '<span class="m" title="' + (m ? 'No trades' : 'Not tested yet') + '"></span>';
      }
    }
    return cells;
  }

  function apply(r) {
    var s = ymd(r.start), e = ymd(r.end), pf = r.pf.toFixed(2);
    yearsCard(r);
    document.querySelectorAll('.fact').forEach(function (f) {
      var sp = f.querySelector('span'), b = f.querySelector('b'); if (!sp || !b) return;
      if (/^Trades in the MT5 backtest/.test(sp.textContent)) { setCount(b, r.trades, n0(r.trades)); sp.textContent = 'Trades in the MT5 backtest, ' + s.y + ' to ' + e.y; }
      else if (/^Backtest profit factor/.test(sp.textContent)) setCount(b, pf, pf);
    });
    var wrap = $('.eq-wrap'), svg = wrap && $('svg.eq', wrap);
    if (svg) {
      wrap.setAttribute('data-pts', JSON.stringify(r.pts)); svg.innerHTML = curveInner(r);
      svg.setAttribute('aria-label', 'Backtest balance curve of GoldTriEngine from ' + MON[s.m - 1] + ' ' + s.y + ' to ' + MON[e.m - 1] + ' ' + e.y + ', log scale, rising overall with drawdowns');
      var ln = svg.querySelector('.line'); if (ln && ln.style) { ln.style.strokeDasharray = ''; ln.style.strokeDashoffset = ''; }
    }
    var tiles = [['Profit factor', r.pf, pf, ''], ['Trades', r.trades, n0(r.trades), ''], ['Winning trades', r.win_pct1, r.win_pct1.toFixed(1) + '%', '%'],
      ['Average win vs. average loss', r.payoff, r.payoff.toFixed(2) + '×', '×'], ['Largest equity drawdown (relative)', r.eq_dd_rel, r.eq_dd_rel.toFixed(1) + '%', '%']];
    tiles.forEach(function (t) { var b = statByLabel(t[0]); if (b) { b.setAttribute('data-count', t[1]); b.setAttribute('data-suf', t[3]); b.textContent = t[2]; } });
    var hb = statByLabel('Average time in a trade'); if (hb && holdPhrase(r.avg_hold)) hb.textContent = holdPhrase(r.avg_hold);
    var mh = $('.months-head h3'); if (mh) mh.textContent = r.months_pos + ' of ' + r.months_total + ' months closed positive';
    var g = $('.mgrid');
    if (g) {
      g.innerHTML = monthGrid(r); g.setAttribute('aria-label', 'Monthly backtest results: ' + r.months_pos + ' of ' + r.months_total + ' months positive. Tap a month for the amount.');
      g.querySelectorAll('.m').forEach(function (m, i) { m.style.transitionDelay = (i * 18) + 'ms'; });
      var rd = document.getElementById('mread'); if (rd) rd.textContent = 'Hover or tap a month to see how much it won or lost.';
      if (window.gteMonthsInit) window.gteMonthsInit();
    }
    var fn = $('.months .foot-note');
    if (fn) fn.innerHTML = fn.innerHTML.replace(/\$[0-9,]+ starting balance, [0-9:]+ leverage/, '$' + n0(r.deposit) + ' starting balance, ' + esc(r.leverage || '1:100') + ' leverage')
      .replace(/[A-Z][a-z]+ [0-9]{4} is a partial month\./, (e.m < 12 || e.d < 20) ? MON[e.m - 1] + ' ' + e.y + ' is a partial month.' : '');
    document.querySelectorAll('p.lead').forEach(function (p) {
      if (/^GoldTriEngine v[0-9.]+ on XAUUSD from /.test(p.textContent)) p.textContent = p.textContent.replace(/from .*? to .*?, using/, 'from ' + long(r.start) + ' to ' + long(r.end) + ', using');
    });
    document.querySelectorAll('dt').forEach(function (dt) {
      if (dt.textContent.trim() === 'Backtest' && dt.nextElementSibling) dt.nextElementSibling.textContent = MON[s.m - 1].slice(0, 3) + ' ' + s.y + ' – ' + MON[e.m - 1].slice(0, 3) + ' ' + e.y + ', profit factor ' + pf + ', ' + n0(r.trades) + ' trades (simulated)';
    });
    document.documentElement.setAttribute('data-bt', r.end);
  }

  fetch(U + '/rest/v1/rpc/public_backtest', { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: '{}' })
    .then(function (x) { return x.ok ? x.json() : null; })
    .then(function (r) { if (r && r.months && r.pts && r.years && r.start && r.end) apply(r); })
    .catch(function () {});
})();
