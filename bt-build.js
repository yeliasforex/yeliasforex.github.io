/* Reads an MetaTrader 5 Strategy Tester report (HTML) and returns the compact numbers the website shows.
   Used by Admin -> Backtest. Same maths as tools/bt_parse.py + tools/update_backtest.py. */
(function (root) {
  function unent(s) {
    return s.replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/ /g, ' ');
  }
  function cells(row) {
    var out = [], re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, m;
    while ((m = re.exec(row))) out.push(unent(m[1].replace(/<[^>]+>/g, '')).trim());
    return out;
  }
  function num(s) { s = String(s == null ? '' : s).replace(/\s/g, ''); var m = s.match(/^-?[0-9.]+/); return m ? parseFloat(m[0]) : NaN; }
  function decode(buf) {
    var u = new Uint8Array(buf), a = u[0], b = u[1];
    if (a === 0xff && b === 0xfe) return new TextDecoder('utf-16le').decode(buf);
    if (a === 0xfe && b === 0xff) return new TextDecoder('utf-16be').decode(buf);
    var t = new TextDecoder('utf-8').decode(buf);
    if (t.indexOf('\u0000') > -1) t = new TextDecoder('utf-16le').decode(buf);   // UTF-16 without a byte-order mark
    return t;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function need(kv, k) { if (!(k in kv)) throw new Error('This does not look like an MT5 Strategy Tester report (missing "' + k + '"). Save the report as HTML in English.'); return kv[k]; }

  function build(buf, label) {
    var t = decode(buf), rows = [], re = /<tr[^>]*>([\s\S]*?)<\/tr>/gi, m;
    while ((m = re.exec(t))) rows.push(cells(m[1]));
    var kv = {};
    rows.forEach(function (r) {
      r.forEach(function (c, i) {
        if (c.length > 1 && c.slice(-1) === ':') {
          var nx = ''; for (var j = i + 1; j < r.length; j++) if (r[j] !== '') { nx = r[j]; break; }
          if (nx.slice(-1) !== ':' && !(c.slice(0, -1) in kv)) kv[c.slice(0, -1)] = nx;
        }
      });
    });
    var deposit = num(need(kv, 'Initial Deposit')), trades = Math.round(num(need(kv, 'Total Trades'))), pf = num(need(kv, 'Profit Factor'));
    var pt = String(need(kv, 'Profit Trades (% of total)')), wins = parseInt(pt, 10);
    var avgWin = num(need(kv, 'Average profit trade')), avgLoss = Math.abs(num(need(kv, 'Average loss trade')));
    var dd = parseFloat((String(need(kv, 'Equity Drawdown Relative')).match(/([0-9.]+)%/) || [])[1]);
    var pm = String(need(kv, 'Period')).match(/\((\d{4})\.(\d\d)\.(\d\d) - (\d{4})\.(\d\d)\.(\d\d)\)/);
    if (!pm) throw new Error('Could not read the test period from the report.');
    var start = { y: +pm[1], m: +pm[2], d: +pm[3] }, end = { y: +pm[4], m: +pm[5], d: +pm[6] };
    var deals = [];
    rows.forEach(function (r) {
      var q = r.length >= 12 && r[0].match(/^(\d{4})\.(\d\d)\.(\d\d) (\d\d):(\d\d):(\d\d)$/);
      if (q && (r[3] === 'buy' || r[3] === 'sell' || r[3] === 'balance')) {
        deals.push({ t: Date.UTC(+q[1], +q[2] - 1, +q[3], +q[4], +q[5], +q[6]), y: +q[1], m: +q[2], type: r[3], pnl: r[3] === 'balance' ? 0 : num(r[10]) + num(r[8]) + num(r[9]), bal: num(r[11]) });
      }
    });
    if (!deals.length || !(trades > 0)) throw new Error('No trades were found in the report.');
    // month by month
    var mm = {}; deals.forEach(function (d) { if (d.type !== 'balance') { var k = d.y * 12 + d.m - 1; mm[k] = (mm[k] || 0) + d.pnl; } });
    var startBal = {}, last = null;
    deals.forEach(function (d) { var k = d.y * 12 + d.m - 1; if (!(k in startBal)) startBal[k] = last !== null ? last : (d.type === 'balance' ? d.bal : d.bal - d.pnl); last = d.bal; });
    var months = [], pos = 0;
    for (var k = start.y * 12 + start.m - 1; k <= end.y * 12 + end.m - 1; k++) {
      var v = mm[k] || 0, sb = startBal[k], p = sb ? v / sb * 100 : 0;
      months.push([Math.floor(k / 12), (k % 12) + 1, Math.round(v * 100) / 100, Math.round(p * 10) / 10]); if (v > 0) pos++;
    }
    // return per calendar year, compounded
    var lastBal = {}, order = []; deals.forEach(function (d) { if (!(d.y in lastBal)) order.push(d.y); lastBal[d.y] = d.bal; });
    var years = [], prev = deposit; order.forEach(function (y) { years.push([y, Math.round((lastBal[y] / prev - 1) * 100)]); prev = lastBal[y]; });
    // balance curve, log scale, 322 points at equal time steps
    var N = 322, W0 = 8, W1 = 632, Y0 = 14, Y1 = 272, t0 = deals[0].t, t1 = deals[deals.length - 1].t;
    var topV = 0; deals.forEach(function (d) { if (d.bal > topV) topV = d.bal; });
    var top = topV * 1.012, low = deals[0].bal * 0.96, Y = function (x) { return Y1 - (Math.log(x / low) / Math.log(top / low)) * (Y1 - Y0); };
    var peakTo = [], pk = 0; deals.forEach(function (d, i) { if (d.bal > pk) pk = d.bal; peakTo.push(pk); });
    var pts = [], idx = 0, r1 = function (x) { return Math.round(x * 10) / 10; };
    for (var i = 0; i < N; i++) {
      var tt = t0 + (t1 - t0) * i / (N - 1);
      while (idx + 1 < deals.length && deals[idx + 1].t <= tt) idx++;
      var dt = new Date(tt), v2 = deals[idx].bal;
      pts.push([r1(W0 + (W1 - W0) * i / (N - 1)), r1(Y(v2)), dt.getUTCFullYear() + '.' + pad(dt.getUTCMonth() + 1), r1((peakTo[idx] - v2) / peakTo[idx] * 100)]);
    }
    var yearX = {}; for (var y = start.y; y <= end.y; y++) yearX[y] = r1(W0 + (W1 - W0) * (Date.UTC(y, 0, 1) - t0) / (t1 - t0));
    var ex = String(kv['Expert'] || ''), vm = ex.match(/v?(\d+)[_.](\d+)/);
    return {
      v: 1, label: label || '', expert: ex, version: vm ? vm[1] + '.' + vm[2] : '', symbol: kv['Symbol'] || '', company: kv['Company'] || '',
      start: start.y + '-' + pad(start.m) + '-' + pad(start.d), end: end.y + '-' + pad(end.m) + '-' + pad(end.d),
      deposit: deposit, leverage: kv['Leverage'] || '', trades: trades, pf: Math.round(pf * 100) / 100,
      win_pct1: Math.floor(wins / trades * 1000 + 0.5) / 10, payoff: Math.round(avgWin / avgLoss * 100) / 100, eq_dd_rel: dd,
      avg_hold: kv['Average position holding time'] || '', net: num(kv['Total Net Profit']), final: deals[deals.length - 1].bal,
      months_pos: pos, months_total: months.length, months: months, years: years, pts: pts, year_x: yearX
    };
  }
  root.gteBt = { build: build };
  if (typeof module !== 'undefined') module.exports = root.gteBt;
})(typeof window !== 'undefined' ? window : this);
