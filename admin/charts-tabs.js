/* Admin charts: what each tab charts, which key facts it surfaces, and what a click shows. Uses only data the tab itself loaded. */
(function () {
  'use strict';
  var G = window.GCA; if (!G) return;
  var E = G.E, N = G.N, money = G.money, num = G.num, pct = G.pct, dt = G.dt;
  var D = function () { return G.data() || {}; };
  var CAP = function (k) { return G.cap(k); };
  var DAY = 864e5, NOW = function () { return Date.now(); };
  var arr = function (a) { return Array.isArray(a) ? a : []; };
  var ago = function (t) { var s = (NOW() - new Date(t).getTime()) / 1000; return s < 90 ? 'just now' : s < 5400 ? Math.round(s / 60) + ' min ago' : s < 172800 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; };
  var plural = function (n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); };
  var count = function (rows, fn) { var m = {}; rows.forEach(function (r) { var k = fn(r); if (k == null || k === '') k = 'unknown'; m[k] = (m[k] || 0) + 1; }); return m; };
  var toItems = function (m, label, sheetFn, colors) { return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).map(function (k, i) { var it = {key: k, label: label ? label(k) : k, value: m[k]}; if (colors && colors[k]) it.color = colors[k]; if (sheetFn) it.sheet = function () { return sheetFn(k, it); }; return it; }); };
  var weekStart = function (t) { var d = new Date(t); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  var lastWeeks = function (n) { var out = [], base = new Date(weekStart(NOW())).getTime(); for (var i = n - 1; i >= 0; i--) out.push(new Date(base - i * 7 * DAY).toISOString().slice(0, 10)); return out; };
  var shortDay = function (s) { return String(s).slice(5); };
  var plansOf = function () { return arr(D().plans); };
  var pn = function (id) { var p = plansOf().filter(function (x) { return x.id === id; })[0]; return p ? p.name : (id || '-'); };
  var ins = function (tone, title, text, act) { return {tone: tone, title: title, text: text, act: act}; };
  var goI = function (tab, pre) { return function () { G.go(tab, pre); }; };

  /* =========================================================== ORDERS */
  G.build.orders = function () {
    var O = arr(D().orders), ST = {pending: ['Started, not paid', 'var(--mute)', 'notpaid'], paid_claimed: ['To check', 'var(--warn)', 'check'], paid: ['Paid', 'var(--ok)', 'paid'], refunded: ['Refunded', 'var(--bad)', 'refunded'], cancelled: ['Cancelled', 'var(--k3,#f472b6)', 'cancelled']};
    var rowsOf = function (rs) { return rs.map(function (o) { return [o.ref, o.email, o.kind, pn(o.plan_id), money(o.amount_usd), (ST[o.status] || [o.status])[0], dt(o.created_at).slice(0, 10)]; }); };
    var list = function (title, kicker, rs, filt) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'order' : 'orders', chips: [{l: 'Money', v: money(rs.reduce(function (s, o) { return s + N(o.amount_usd); }, 0))}], cols: ['Ref', 'Customer', 'Type', 'Plan', 'Amount', 'Status', 'Date'], rows: rowsOf(rs), go: {label: 'Open in Orders', tab: 'orders', pre: function () { window._of2 = filt || 'all'; }}}; };
    var paid = O.filter(function (o) { return o.status === 'paid'; }), claimed = O.filter(function (o) { return o.status === 'paid_claimed'; }), pend = O.filter(function (o) { return o.status === 'pending'; });
    var mon = function (o) { return String(o.created_at).slice(0, 7); }, thisM = new Date().toISOString().slice(0, 7), lastM = new Date(NOW() - 31 * DAY).toISOString().slice(0, 7);
    var rev = function (rs) { return rs.reduce(function (s, o) { return s + N(o.amount_usd); }, 0); };
    var insights = [];
    if (!O.length) insights.push(ins('info', 'No orders yet', 'The first order will show here with its status, plan and money.'));
    else {
      if (claimed.length) insights.push(ins('warn', plural(claimed.length, 'order') + ' to confirm', 'The customer says they paid. The oldest is ' + ago(claimed.map(function (o) { return o.created_at; }).sort()[0]) + '. Check the money, then press Payment received.', function () { G.sheet(list('Orders to check', 'Waiting for you', claimed, 'check')); }));
      var old = pend.filter(function (o) { return NOW() - new Date(o.created_at).getTime() > 3 * DAY; });
      if (old.length) insights.push(ins('mute', plural(old.length, 'order') + ' started more than 3 days ago, never paid', 'Often abandoned. Cancelling them keeps the list clean.', function () { G.sheet(list('Started, not paid for 3+ days', 'Possibly abandoned', old, 'notpaid')); }));
      var a = rev(paid.filter(function (o) { return mon(o) === thisM; })), b = rev(paid.filter(function (o) { return mon(o) === lastM; }));
      if (paid.length) insights.push(ins(a >= b ? 'ok' : 'warn', 'This month ' + money(a) + (b ? ' vs ' + money(b) + ' last month' : ''), paid.length + ' paid order(s) in total, average ' + money(rev(paid) / paid.length) + '.', function () { G.sheet(list('Paid orders', 'Money received', paid, 'paid')); }));
      var rf = O.filter(function (o) { return o.status === 'refunded'; }); if (rf.length) insights.push(ins('bad', plural(rf.length, 'refund') + ' (' + money(rev(rf)) + ')', 'Look at why customers asked for their money back.', function () { G.sheet(list('Refunded orders', 'Refunds', rf, 'refunded')); }));
    }
    var stI = toItems(count(O, function (o) { return o.status; }), function (k) { return (ST[k] || [k])[0]; }, function (k) { return list((ST[k] || [k])[0], 'Orders by status', O.filter(function (o) { return o.status === k; }), (ST[k] || [])[2]); }); stI.forEach(function (i) { if (ST[i.key]) i.color = ST[i.key][1]; });
    var days = G.lastDays(30), perDay = days.map(function (d) { var rs = O.filter(function (o) { return String(o.created_at).slice(0, 10) === d; }); return {label: d, short: shortDay(d), value: rs.length, sheet: function () { return list('Orders on ' + d, 'Orders per day', rs, 'all'); }}; });
    var months = {}; paid.forEach(function (o) { months[mon(o)] = (months[mon(o)] || 0) + N(o.amount_usd); });
    var mk = Object.keys(months).sort().slice(-8).map(function (k) { return {label: k, value: months[k], sheet: function () { return list('Paid in ' + k, 'Money per month', paid.filter(function (o) { return mon(o) === k; }), 'paid'); }}; });
    var byPlan = {}; paid.forEach(function (o) { byPlan[o.plan_id] = (byPlan[o.plan_id] || 0) + N(o.amount_usd); });
    var planI = Object.keys(byPlan).map(function (k) { return {label: pn(k), value: byPlan[k], sheet: function () { return list(pn(k) + ' orders', 'Money by plan', paid.filter(function (o) { return o.plan_id === k; }), 'paid'); }}; });
    var kindI = toItems(count(O.filter(function (o) { return o.status !== 'cancelled'; }), function (o) { return o.kind; }), function (k) { return {purchase: 'New purchase', renewal: 'Renewal', upgrade: 'Upgrade', unbind: 'Unbind'}[k] || k; }, function (k) { return list('Type: ' + k, 'Orders by type', O.filter(function (o) { return o.kind === k && o.status !== 'cancelled'; }), 'all'); });
    return {title: 'Orders at a glance', insights: insights, cards: [
      G.card('Orders by status', 'Where every order stands right now.', G.donut(stI, {title: 'Orders by status', center: O.length, centerLabel: 'orders'}), {hint: 'status split'}),
      G.card('Money received per month', 'Only orders you confirmed as paid.', G.bars(mk, {title: 'Money per month', fmt: money, color: 'var(--ok)'}), {hint: 'needs a paid order'}),
      G.card('Orders per day', 'Last 30 days, every order started.', O.length ? G.bars(perDay, {title: 'Orders per day', labels: 6, color: 'var(--info)'}) : '', {hint: 'last 30 days'}),
      G.card('Money by plan', 'Which plan brings the money.', G.donut(planI, {title: 'Money by plan', fmt: money, centerLabel: 'received'}), {hint: 'needs a paid order'}),
      G.card('Plans and prices', 'The price of each plan. Click a plan for its limit and how many licenses use it.', G.hbars(plansOf().filter(function (p) { return p.active !== false; }).map(function (p) { return {label: p.name + (p.popular ? ' (popular)' : ''), value: N(p.price_usd), sheet: function () { var ls = arr(D().licenses).filter(function (l) { return l.plan_id === p.id; }); return {kicker: 'Plan', title: p.name, value: money(p.price_usd), sub: 'price', chips: [{l: 'Account limit', v: money(p.limit_usd)}, {l: 'Licenses on it', v: ls.length}, {l: 'Active', v: ls.filter(function (l) { return l.status === 'active'; }).length}, {l: 'Money per $1000 of limit', v: money(N(p.price_usd) / Math.max(1, N(p.limit_usd)) * 1000)}], go: {label: 'Open Plans & settings', tab: 'settings'}}; }}; }), {title: 'Plans and prices', fmt: money, share: false}), {hint: 'plan prices'}),
      G.card('What was ordered', 'New purchases, renewals, upgrades.', G.donut(kindI, {title: 'Orders by type', centerLabel: 'orders'}), {hint: 'order types'})]};
  };

  /* =========================================================== LICENSES */
  G.build.licenses = function () {
    var L = arr(D().licenses), now = NOW(), live = L.filter(function (l) { return l.status === 'active'; });
    var rowsOf = function (rs) { return rs.map(function (l) { return [l.key, pn(l.plan_id), l.status, l.owner_email || '-', l.bound_account || 'not bound', l.balance != null ? money(l.balance) : '-', String(l.expires_at || '').slice(0, 10)]; }); };
    var list = function (title, kicker, rs, filt) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'license' : 'licenses', chips: [{l: 'Total balance', v: money(rs.reduce(function (s, l) { return s + N(l.balance); }, 0))}, {l: 'Active', v: rs.filter(function (l) { return l.status === 'active'; }).length}], cols: ['Key', 'Plan', 'Status', 'Customer', 'Account', 'Balance', 'Expires'], rows: rowsOf(rs), go: {label: 'Open in Licenses', tab: 'licenses', pre: function () { window._lf = filt || 'all'; }}}; };
    var exp30 = live.filter(function (l) { var t = new Date(l.expires_at).getTime(); return t > now && t - now < 30 * DAY; }), exp7 = exp30.filter(function (l) { return new Date(l.expires_at).getTime() - now < 7 * DAY; });
    var off = live.filter(function (l) { return l.online === false && l.last_heartbeat && now - new Date(l.last_heartbeat).getTime() > DAY; }), over = L.filter(function (l) { return l.over_limit; }), unbound = live.filter(function (l) { return !l.bound_account; });
    var insights = [];
    if (!L.length) insights.push(ins('info', 'No licenses yet', 'Licenses appear here after the first confirmed purchase or a free key.'));
    else {
      insights.push(ins(live.length ? 'ok' : 'warn', plural(live.length, 'active license') + ' of ' + L.length, live.filter(function (l) { return l.online; }).length + ' online right now.', function () { G.sheet(list('Active licenses', 'Licenses', live, 'active')); }));
      if (exp7.length) insights.push(ins('bad', plural(exp7.length, 'license') + ' end within 7 days', 'Send a renewal reminder before they stop.', function () { G.sheet(list('Ending within 7 days', 'Renewals', exp7, 'active')); }));
      else if (exp30.length) insights.push(ins('warn', plural(exp30.length, 'license') + ' end within 30 days', 'Plan the renewal follow-up.', function () { G.sheet(list('Ending within 30 days', 'Renewals', exp30, 'active')); }));
      if (off.length) insights.push(ins('warn', plural(off.length, 'license') + ' offline for over a day', 'The EA has not sent a heartbeat. The customer may have closed MetaTrader.', function () { G.sheet(list('Offline over 24 hours', 'EA offline', off, 'active')); }));
      if (over.length) insights.push(ins('bad', plural(over.length, 'license') + ' over the plan limit', 'The balance is above what the plan allows.', function () { G.sheet(list('Over the plan limit', 'Limit', over, 'over')); }));
      if (unbound.length) insights.push(ins('mute', plural(unbound.length, 'active license') + ' never used', 'No MetaTrader account is bound yet.', function () { G.sheet(list('Active but not bound to an account', 'Never used', unbound, 'active')); }));
    }
    var stI = toItems(count(L, function (l) { return l.status; }), null, function (k) { return list('Status: ' + k, 'Licenses by status', L.filter(function (l) { return l.status === k; }), k === 'active' ? 'active' : 'bad'); }, {active: 'var(--ok)', expired: 'var(--warn)', disabled: 'var(--bad)'});
    var plI = toItems(count(L, function (l) { return l.plan_id; }), pn, function (k) { return list(pn(k) + ' licenses', 'Licenses by plan', L.filter(function (l) { return l.plan_id === k; }), 'all'); });
    var onl = {Online: live.filter(function (l) { return l.online; }), Offline: live.filter(function (l) { return !l.online && l.last_heartbeat; }), 'Never connected': live.filter(function (l) { return !l.last_heartbeat; })};
    var onI = Object.keys(onl).map(function (k) { return {label: k, value: onl[k].length, color: {Online: 'var(--ok)', Offline: 'var(--warn)', 'Never connected': 'var(--mute)'}[k], sheet: function () { return list(k + ' (active licenses)', 'EA connection', onl[k], 'active'); }}; });
    var wk = lastWeeks(13), expI = wk.map(function (w, i) { var a = new Date(w).getTime(), b = a + 7 * DAY; var rs = live.filter(function (l) { var t = new Date(l.expires_at).getTime(); return t >= Math.max(a, now) && t < b; }); return {label: 'Week of ' + w, short: shortDay(w), value: rs.length, sheet: function () { return list('Ending in the week of ' + w, 'Expiry timeline', rs, 'active'); }}; });
    var wkF = []; for (var i = 0; i < 12; i++) { (function (i) { var a = now + i * 7 * DAY, b = a + 7 * DAY, rs = live.filter(function (l) { var t = new Date(l.expires_at).getTime(); return t >= a && t < b; }); wkF.push({label: new Date(a).toISOString().slice(0, 10) + ' to ' + new Date(b - DAY).toISOString().slice(0, 10), short: '+' + i + 'w', value: rs.length, sheet: function () { return list('Ending in week +' + i, 'Next 12 weeks', rs, 'active'); }}); })(i); }
    var eq = L.filter(function (l) { return N(l.equity) > 0 || N(l.balance) > 0; }).sort(function (a, b) { return N(b.equity || b.balance) - N(a.equity || a.balance); }).map(function (l) { return {label: (l.owner_email || l.key) + ' · ' + pn(l.plan_id), value: N(l.equity || l.balance), sheet: function () { return list('Account of ' + (l.owner_email || l.key), 'Equity', [l], 'all'); }}; });
    return {title: 'Licenses at a glance', insights: insights, cards: [
      G.card('Licenses by status', 'Active, expired or disabled.', G.donut(stI, {title: 'Licenses by status', center: L.length, centerLabel: 'licenses'})),
      G.card('Licenses by plan', 'How many people sit on each plan.', G.donut(plI, {title: 'Licenses by plan', center: L.length, centerLabel: 'licenses'})),
      G.card('EA connection', 'Which active licenses are online now.', G.donut(onI, {title: 'EA connection', center: onl.Online.length, centerLabel: 'online'})),
      G.card('Ending in the next 12 weeks', 'Renewals to plan for, week by week.', live.length ? G.bars(wkF, {title: 'Expiry timeline', labels: 6, color: 'var(--warn)'}) : '', {hint: 'expiry dates'}),
      G.card('Money on customer accounts', 'Equity per license (top 10).', G.hbars(eq, {title: 'Equity', fmt: money, share: false}), {hint: 'balances', wide: eq.length > 4})]};
  };

  /* =========================================================== CUSTOMERS */
  G.build.customers = function () {
    var C = arr(D().customers), leads = arr(CAP('admin_leads')), now = NOW();
    var rowsOf = function (rs) { return rs.map(function (c) { return [c.full_name || '-', c.email, c.licenses ? 'yes (' + c.licenses + ')' : 'no', c.telegram ? 'yes' : 'no', c.first_src || '-', String(c.created_at || '').slice(0, 10)]; }); };
    var list = function (title, kicker, rs, filt) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'person' : 'people', cols: ['Name', 'Email', 'License', 'Telegram', 'Came from', 'Joined'], rows: rowsOf(rs), go: {label: 'Open in Customers', tab: 'customers', pre: function () { window._cf = filt || 'all'; }}}; };
    var w7 = C.filter(function (c) { return now - new Date(c.created_at).getTime() < 7 * DAY; }), p7 = C.filter(function (c) { var a = now - new Date(c.created_at).getTime(); return a >= 7 * DAY && a < 14 * DAY; });
    var noLic = C.filter(function (c) { return !c.licenses; }), due = leads.filter(function (l) { return l.next_followup && new Date(l.next_followup).getTime() <= now && !l.optout; });
    var insights = [];
    if (!C.length) insights.push(ins('info', 'No customers yet', 'Sign-ups appear here with where they came from.'));
    else {
      insights.push(ins(w7.length >= p7.length ? 'ok' : 'warn', plural(w7.length, 'new sign-up') + ' in 7 days', 'The 7 days before had ' + p7.length + '. Total: ' + C.length + '.', function () { G.sheet(list('Joined in the last 7 days', 'New people', w7, 'all')); }));
      if (noLic.length) insights.push(ins('warn', plural(noLic.length, 'person', 'people') + ' without a license', pct(noLic.length, C.length) + '% of everyone. Good people to follow up.', function () { G.sheet(list('No license yet', 'Follow-up list', noLic, 'all')); }));
      if (due.length) insights.push(ins('bad', plural(due.length, 'follow-up') + ' due now', 'The automatic follow-up is ready for these people.', goI('funnel')));
    }
    var wk = lastWeeks(12), perW = wk.map(function (w) { var rs = C.filter(function (c) { return weekStart(c.created_at) === w; }); return {label: 'Week of ' + w, short: shortDay(w), value: rs.length, sheet: function () { return list('Joined in the week of ' + w, 'Sign-ups per week', rs, 'all'); }}; });
    var cum = 0, tot = C.length - perW.reduce(function (s, p) { return s + p.value; }, 0), cumI = perW.map(function (p) { tot += p.value; return {label: p.label, short: p.short, value: tot, sheet: p.sheet}; });
    var srcI = toItems(count(C, function (c) { return c.first_src || 'direct'; }), null, function (k) { return list('Came from: ' + k, 'First source', C.filter(function (c) { return (c.first_src || 'direct') === k; }), 'all'); });
    var licI = [{label: 'Own a license', value: C.length - noLic.length, color: 'var(--ok)', sheet: function () { return list('Own a license', 'Customers', C.filter(function (c) { return c.licenses; }), 'license'); }}, {label: 'No license yet', value: noLic.length, color: 'var(--warn)', sheet: function () { return list('No license yet', 'Customers', noLic, 'all'); }}];
    var tgI = [{label: 'Telegram connected', value: C.filter(function (c) { return c.telegram; }).length, color: 'var(--info)', sheet: function () { return list('Telegram connected', 'Alerts', C.filter(function (c) { return c.telegram; }), 'telegram'); }}, {label: 'Not connected', value: C.filter(function (c) { return !c.telegram; }).length, color: 'var(--mute)', sheet: function () { return list('Telegram not connected', 'Alerts', C.filter(function (c) { return !c.telegram; }), 'all'); }}];
    return {title: 'Customers at a glance', insights: insights, cards: [
      G.card('Sign-ups per week', 'New people, last 12 weeks.', C.length ? G.bars(perW, {title: 'Sign-ups per week', labels: 6, color: 'var(--k2,#22d3ee)'}) : '', {hint: 'weekly sign-ups'}),
      G.card('Customers over time', 'Running total by week.', C.length ? G.line(cumI, {title: 'Customers over time', labels: 6, color: 'var(--ok)'}) : '', {hint: 'growth line'}),
      G.card('Who owns a license', 'Paying or free-key holders vs the rest.', G.donut(licI, {title: 'License ownership', center: C.length, centerLabel: 'people'})),
      G.card('Where people came from', 'The first source that brought them.', G.donut(srcI, {title: 'First source', center: C.length, centerLabel: 'people'})),
      G.card('Telegram alerts', 'Who gets trade alerts on Telegram.', G.donut(tgI, {title: 'Telegram', center: tgI[0].value, centerLabel: 'connected'}))]};
  };

  /* =========================================================== VISITORS */
  G.build.visitors = function () {
    var V = CAP('admin_visitors'); if (!V || !V.daily) return null;
    var rec = arr(V.recent), vrows = function (rs) { return rs.map(function (r) { return [dt(r.at), r.path, r.src || '-', r.country || '-', r.device || '-', r.browser || '-', r.secs != null ? r.secs + ' s' : '-']; }); }, vcols = ['When', 'Page', 'Source', 'Country', 'Device', 'Browser', 'Time on page'];
    var visit = function (title, kicker, v, filt, note) { var rs = rec.filter(filt || function () { return true; }); return {kicker: kicker, title: title, value: num(v), sub: 'visitors', chips: [{l: 'Of all visitors', v: pct(N(v), N(V.visitors)) + '%'}, {l: 'Period', v: (V.days || 30) + ' days'}], note: (note || '') + (rs.length ? ' Below: the latest visits that match (the last ' + rec.length + ' visits are kept).' : ' No match among the latest visits.'), cols: vcols, rows: vrows(rs)}; };
    var fld = function (name, key, label, max) { return arr(V[name]).slice(0, max || 12).map(function (r) { var nm = r[key] || r.name || r.country || r.tz || 'unknown'; return {label: nm, value: N(r.visitors), sheet: function () { return visit(nm, label, r.visitors, function (x) { return String(x[{countries: 'country', sources: 'src', devices: 'device', browsers: 'browser', os: 'os'}[name]] || '').toLowerCase() === String(nm).toLowerCase(); }); }}; }); };
    var today = N((V.today || {}).visitors), yest = N((V.yesterday || {}).visitors), insights = [];
    insights.push(ins(today >= yest ? 'ok' : 'warn', 'Today ' + num(today) + ' visitors' + (yest ? ' vs ' + num(yest) + ' yesterday' : ''), num((V.today || {}).views) + ' page views today. ' + num(V.online_now || 0) + ' on the site right now.', function () { G.sheet({kicker: 'Today', title: 'Visitors today', value: num(today), sub: 'vs ' + num(yest) + ' yesterday', chips: [{l: 'Views today', v: num((V.today || {}).views)}, {l: 'Views yesterday', v: num((V.yesterday || {}).views)}, {l: 'Online now', v: num(V.online_now || 0)}], cols: vcols, rows: vrows(rec.slice(0, 40))}); }));
    if (V.bounce_pct != null) insights.push(ins(V.bounce_pct > 70 ? 'warn' : 'ok', V.bounce_pct + '% leave after one page', V.bounce_pct > 70 ? 'High. The first page may not answer what people came for.' : 'A healthy figure.', goI('visitors')));
    var best = arr(V.sources)[0]; if (best) insights.push(ins('info', 'Top source: ' + best.name, num(best.visitors) + ' of ' + num(V.visitors) + ' visitors (' + pct(best.visitors, V.visitors) + '%).', function () { G.sheet(visit(best.name, 'Top source', best.visitors, function (x) { return String(x.src || '').toLowerCase() === String(best.name).toLowerCase(); })); }));
    var hrs = arr(V.hours), peak = hrs.slice().sort(function (a, b) { return N(b.visitors) - N(a.visitors); })[0]; if (peak) insights.push(ins('info', 'Busiest hour: ' + String(peak.hr).padStart(2, '0') + ':00', num(peak.visitors) + ' visitors then. A good time to post or go live.'));
    var appShare = pct(N(V.app_views), N(V.views)); if (V.app_views) insights.push(ins('info', appShare + '% of views come from the app', num(V.app_views) + ' views opened in the installed app.'));
    var hoursI = []; for (var h = 0; h < 24; h++) { (function (h) { var r = hrs.filter(function (x) { return +x.hr === h; })[0]; hoursI.push({label: String(h).padStart(2, '0') + ':00', short: String(h).padStart(2, '0'), value: r ? N(r.visitors) : 0, sheet: function () { return visit('Around ' + String(h).padStart(2, '0') + ':00', 'Visitors by hour', r ? r.visitors : 0, function (x) { return new Date(x.at).getHours() === h; }, 'The hour is shown in the time zone your admin page uses.'); }}); })(h); }
    var pagesI = arr(V.pages).slice(0, 10).map(function (p) { return {label: p.path, value: N(p.views), sheet: function () { return {kicker: 'Most viewed pages', title: p.path, value: num(p.views), sub: 'views', chips: [{l: 'Visitors', v: num(p.visitors)}, {l: 'Average time on page', v: Math.round(N(p.avg_secs)) + ' s'}, {l: 'Views per visitor', v: (N(p.views) / Math.max(1, N(p.visitors))).toFixed(1)}], cols: vcols, rows: vrows(rec.filter(function (x) { return x.path === p.path; }))}; }}; });
    var chI = arr(V.channels).map(function (c) { return {label: c.name, value: N(c.revenue) || N(c.signups) || N(c.orders), sheet: function () { return {kicker: 'Channel', title: c.name, value: money(c.revenue), sub: 'revenue', chips: [{l: 'Sign-ups', v: num(c.signups)}, {l: 'Downloads', v: num(c.downloads)}, {l: 'Orders', v: num(c.orders)}, {l: 'Buyers', v: num(c.buyers)}]}; }}; });
    var cpI = arr(V.campaigns).map(function (c) { return {label: c.name + (c.source ? ' (' + c.source + ')' : ''), value: N(c.visitors), sheet: function () { return visit(c.name, 'Campaign', c.visitors, null, 'Campaign link: ' + (c.source || '-') + '.'); }}; });
    return {title: 'Visitors at a glance', insights: insights, cards: [
      G.card('Visitors by hour', 'When people are on the site (all 24 hours).', G.bars(hoursI, {title: 'Visitors by hour', labels: 8, color: 'var(--k2,#22d3ee)'})),
      G.card('Devices', 'Phone, computer or tablet.', G.donut(fld('devices', 'name', 'Devices'), {title: 'Devices', center: num(V.visitors), centerLabel: 'visitors'})),
      G.card('Browsers', 'What people open the site with.', G.donut(fld('browsers', 'name', 'Browsers'), {title: 'Browsers', center: num(V.visitors), centerLabel: 'visitors'})),
      G.card('Operating systems', 'Windows, Android, iPhone and so on.', G.donut(fld('os', 'name', 'Operating systems'), {title: 'Operating systems', center: num(V.visitors), centerLabel: 'visitors'})),
      G.card('Where visitors come from', 'The source that sent them.', G.hbars(fld('sources', 'name', 'Sources'), {title: 'Sources'})),
      G.card('Countries', 'Top countries by visitors.', G.hbars(fld('countries', 'country', 'Countries'), {title: 'Countries'})),
      G.card('Languages', 'The language of their browser.', G.hbars(fld('langs', 'name', 'Languages'), {title: 'Languages'})),
      G.card('Most viewed pages', 'Page views. Click a page for time and visitors.', G.hbars(pagesI, {title: 'Pages', share: false}), {wide: true}),
      G.card('Campaigns', 'Visitors from your tagged links.', G.hbars(cpI, {title: 'Campaigns'}), {hint: 'tagged links'}),
      G.card('Channels that earned', 'Revenue (or sign-ups) per channel.', G.hbars(chI, {title: 'Channels', share: false}), {hint: 'channel results'})]};
  };

  /* =========================================================== FUNNEL (sign-ups) */
  G.build.funnel = function () {
    var V = CAP('admin_visitors'), S = CAP('admin_stats'); var F = V && V.funnel; if (!F) return null;
    var steps = [['Visitors', F.visitors, 'Everyone who opened the site.'], ['Saw pricing', F.pricing, 'Opened the pricing page.'], ['Opened sign-in', F.signin, 'Reached the sign-in page.'], ['Signed up', F.signups, 'Created an account.'], ['Downloaded the EA', F.downloads, 'Downloaded the free backtest EA.'], ['Ordered', F.orders, 'Started an order.'], ['Paid', F.paid, 'Paid and confirmed.']].filter(function (s) { return s[1] != null; });
    var st = steps.map(function (s, i) { return {label: s[0], value: N(s[1]), sheet: function () { var prev = i ? N(steps[i - 1][1]) : N(s[1]), top = N(steps[0][1]); return {kicker: 'Sign-up funnel', title: s[0], value: num(s[1]), sub: s[2], chips: [{l: 'From the step before', v: i ? pct(N(s[1]), prev) + '%' : '100%'}, {l: 'From all visitors', v: pct(N(s[1]), top) + '%'}, {l: 'Lost at this step', v: i ? num(Math.max(0, prev - N(s[1]))) : '-', tone: i && prev - N(s[1]) > N(s[1]) ? 'warn' : ''}], note: i ? 'Of ' + num(prev) + ' people at the step before, ' + num(s[1]) + ' went on. ' + (pct(N(s[1]), prev) < 10 ? 'This is a big drop: look at what this step asks of people.' : '') : 'The start of the funnel.'}; }}; });
    var drops = steps.map(function (s, i) { return i ? {label: s[0], rate: pct(N(s[1]), N(steps[i - 1][1])), lost: N(steps[i - 1][1]) - N(s[1])} : null; }).filter(Boolean).filter(function (d) { return d.lost > 0; }).sort(function (a, b) { return b.lost - a.lost; });
    var insights = [];
    if (drops[0]) insights.push(ins('warn', 'Biggest loss: before "' + drops[0].label + '"', num(drops[0].lost) + ' people stop here (only ' + drops[0].rate + '% go on).'));
    insights.push(ins('info', pct(N(F.signups), N(F.visitors)) + '% of visitors sign up', num(F.signups) + ' sign-ups from ' + num(F.visitors) + ' visitors.'));
    if (S) insights.push(ins(N(S.signups_7d) ? 'ok' : 'warn', plural(N(S.signups_7d), 'sign-up') + ' in 7 days, ' + N(S.signups_30d) + ' in 30', num(S.downloads_7d) + ' downloads in 7 days. ' + num(S.license_holders) + ' people hold a license, ' + num(S.paid_buyers) + ' have paid.'));
    var sg = S ? [{label: 'Sign-ups, last 7 days', value: N(S.signups_7d), color: 'var(--k2,#22d3ee)'}, {label: 'Sign-ups, last 30 days', value: N(S.signups_30d), color: 'var(--k1,#a78bfa)'}, {label: 'Sign-ups, all time', value: N(S.signups), color: 'var(--ok)'}, {label: 'Downloads, last 7 days', value: N(S.downloads_7d), color: 'var(--warn)'}, {label: 'Downloads, all time', value: N(S.downloads), color: 'var(--k4,#fbbf24)'}] : [];
    return {title: 'Sign-up funnel', insights: insights, cards: [G.card('From visitor to paying customer', 'Each bar against the step before it. The percentage is how many went on.', G.funnel(st, {title: 'Funnel'}), {wide: true}), G.card('Sign-ups and downloads', 'Recent against all-time.', G.hbars(sg, {title: 'Sign-ups and downloads', share: false}))]};
  };

  /* =========================================================== REVENUE */
  G.build.revenue = function () {
    var R = CAP('admin_revenue'); if (!R) return null; var M = arr(R.months).slice(-12), T = R.totals || {}, L = R.licenses || {}, orders = arr(D().orders);
    var monthOrders = function (m) { return orders.filter(function (o) { return String(o.created_at).slice(0, 7) === m && o.status === 'paid'; }); };
    var ms = function (m) { var rs = monthOrders(m.month); return {kicker: 'Month', title: m.month, value: money(m.revenue_usd), sub: 'received', chips: [{l: 'New', v: m.purchases}, {l: 'Renewals', v: m.renewals}, {l: 'Upgrades', v: m.upgrades}, {l: 'Refunds', v: m.refunds ? m.refunds + ' (' + money(m.refunded_usd) + ')' : '0', tone: m.refunds ? 'bad' : ''}, {l: 'Discounts given', v: money(m.discounts_usd)}], cols: ['Ref', 'Customer', 'Type', 'Plan', 'Amount'], rows: rs.map(function (o) { return [o.ref, o.email, o.kind, pn(o.plan_id), money(o.amount_usd)]; }), go: {label: 'Open Orders', tab: 'orders', pre: function () { window._of2 = 'paid'; }}}; };
    var bars = M.map(function (m) { return {label: m.month, short: m.month.slice(2), value: N(m.revenue_usd), sheet: function () { return ms(m); }}; });
    var run = 0, cum = M.map(function (m) { run += N(m.revenue_usd); return {label: m.month, short: m.month.slice(2), value: run, sheet: function () { return ms(m); }}; });
    var stack = M.map(function (m) { return {label: m.month, short: m.month.slice(2), value: N(m.purchases) + N(m.renewals) + N(m.upgrades), parts: [{v: N(m.purchases), c: 'var(--ok)'}, {v: N(m.renewals), c: 'var(--info)'}, {v: N(m.upgrades), c: 'var(--gold,#e0b24a)'}], sheet: function () { return ms(m); }}; });
    var ref = M.map(function (m) { return {label: m.month, short: m.month.slice(2), value: N(m.refunded_usd) + N(m.discounts_usd), parts: [{v: N(m.refunded_usd), c: 'var(--bad)'}, {v: N(m.discounts_usd), c: 'var(--warn)'}], sheet: function () { return ms(m); }}; });
    var lic = [{label: 'Active', value: N(L.active), color: 'var(--ok)'}, {label: 'Ending within 30 days', value: N(L.expiring_30), color: 'var(--warn)'}, {label: 'Ended in 90 days', value: N(L.expired_90), color: 'var(--bad)'}, {label: 'Renewed in 90 days', value: N(L.renewed_90), color: 'var(--info)'}].filter(function (x) { return x.value > 0; });
    lic.forEach(function (x) { x.sheet = function () { return {kicker: 'Licenses and renewals', title: x.label, value: num(x.value), sub: 'licenses', chips: [{l: 'Renewal rate', v: L.renewal_rate_pct == null ? 'not enough data' : L.renewal_rate_pct + '%'}], note: 'The renewal rate is a rough guide: renewals paid in the last 90 days against licenses that ended in the same time.', go: {label: 'Open Licenses', tab: 'licenses'}}; }; });
    var priceOf = function (id) { return N((plansOf().filter(function (p) { return p.id === id; })[0] || {}).price_usd); }, liveL = arr(D().licenses).filter(function (l) { return l.status === 'active'; });
    var lrows = function (rs) { return rs.map(function (l) { return [l.key, l.owner_email || '-', pn(l.plan_id), money(priceOf(l.plan_id)), String(l.expires_at || '').slice(0, 10)]; }); };
    var m6 = []; for (var q = 0; q < 6; q++) { var dm = new Date(); dm.setUTCDate(1); dm.setUTCMonth(dm.getUTCMonth() + q); m6.push(dm.toISOString().slice(0, 7)); }
    var renew = m6.map(function (m) { var rs = liveL.filter(function (l) { return String(l.expires_at).slice(0, 7) === m; }), v = rs.reduce(function (s, l) { return s + priceOf(l.plan_id); }, 0); return {label: m, short: m.slice(2), value: v, sheet: function () { return {kicker: 'Renewals coming up', title: m, value: money(v), sub: rs.length + ' license(s) end, if each renews at the current plan price', cols: ['Key', 'Customer', 'Plan', 'Renewal price', 'Ends'], rows: lrows(rs), note: 'A forecast, not money received: it counts each ending license at the current plan price.', go: {label: 'Open Licenses', tab: 'licenses'}}; }}; });
    var byPlanV = {}; liveL.forEach(function (l) { byPlanV[l.plan_id] = (byPlanV[l.plan_id] || 0) + priceOf(l.plan_id); });
    var planV = Object.keys(byPlanV).map(function (k) { return {label: pn(k), value: byPlanV[k], sheet: function () { var rs = liveL.filter(function (l) { return l.plan_id === k; }); return {kicker: 'Value of active licenses', title: pn(k), value: money(byPlanV[k]), sub: rs.length + ' active license(s) at ' + money(priceOf(k)) + ' each', cols: ['Key', 'Customer', 'Plan', 'Price', 'Ends'], rows: lrows(rs), go: {label: 'Open Licenses', tab: 'licenses'}}; }}; });
    var r90 = liveL.filter(function (l) { var t = new Date(l.expires_at).getTime(); return t > NOW() && t - NOW() < 90 * DAY; }), r90v = r90.reduce(function (s, l) { return s + priceOf(l.plan_id); }, 0);
    var tot = M.reduce(function (s, m) { return s + N(m.revenue_usd); }, 0), best = M.slice().sort(function (a, b) { return N(b.revenue_usd) - N(a.revenue_usd); })[0], last = M[M.length - 1], prev = M[M.length - 2], insights = [];
    if (!M.length) insights.push(ins('info', 'No money received yet', 'Charts appear after the first payment is confirmed in Orders.', goI('orders')));
    else {
      insights.push(ins('ok', money(T.revenue_usd) + ' received in total', T.paid_orders + ' paid order(s), average ' + money(N(T.revenue_usd) / Math.max(1, N(T.paid_orders))) + '.', function () { G.sheet(ms(last)); }));
      if (last && prev) insights.push(ins(N(last.revenue_usd) >= N(prev.revenue_usd) ? 'ok' : 'warn', last.month + ' ' + money(last.revenue_usd) + ' vs ' + money(prev.revenue_usd) + ' before', (N(prev.revenue_usd) ? (N(last.revenue_usd) >= N(prev.revenue_usd) ? '+' : '') + Math.round((N(last.revenue_usd) / N(prev.revenue_usd) - 1) * 100) + '% against ' + prev.month + '.' : 'First month with money.'), function () { G.sheet(ms(last)); }));
      if (best) insights.push(ins('info', 'Best month: ' + best.month, money(best.revenue_usd) + ' received.', function () { G.sheet(ms(best)); }));
    }
    if (r90.length) insights.push(ins('info', money(r90v) + ' of renewals due in 90 days', plural(r90.length, 'license') + ' end soon. This is a forecast at the current plan prices.', function () { G.sheet({kicker: 'Renewals coming up', title: 'Ending within 90 days', value: money(r90v), sub: r90.length + ' license(s)', cols: ['Key', 'Customer', 'Plan', 'Renewal price', 'Ends'], rows: lrows(r90), go: {label: 'Open Licenses', tab: 'licenses'}}); }));
    if (N(T.refunded_usd)) insights.push(ins('bad', money(T.refunded_usd) + ' refunded', pct(N(T.refunded_usd), N(T.revenue_usd) + N(T.refunded_usd)) + '% of the money taken in.', goI('orders', function () { window._of2 = 'refunded'; })));
    if (L.renewal_rate_pct != null) insights.push(ins(L.renewal_rate_pct >= 50 ? 'ok' : 'warn', L.renewal_rate_pct + '% renewal rate', N(L.renewed_90) + ' renewed vs ' + N(L.expired_90) + ' ended in 90 days.', goI('licenses')));
    if (N(L.expiring_30)) insights.push(ins('warn', plural(N(L.expiring_30), 'license') + ' end within 30 days', 'Money you could lose or win with a renewal reminder.', goI('licenses')));
    return {title: 'Revenue at a glance', insights: insights, cards: [
      G.card('Money received per month', 'Click a month for its orders.', G.bars(bars, {title: 'Money per month', fmt: money, color: 'var(--ok)'}), {hint: 'needs a paid order'}),
      G.card('Total money over time', 'Running total, month by month.', M.length > 1 ? G.line(cum, {title: 'Total money', fmt: money, color: 'var(--ok)'}) : '', {hint: 'needs 2 months'}),
      G.card('What was sold', 'New (green), renewals (blue), upgrades (gold).', M.length ? G.bars(stack, {title: 'Sales by type', color: 'var(--ok)'}) : '', {hint: 'sales by type'}),
      G.card('Refunds and discounts', 'Money given back (red) and discounts (amber).', M.some(function (m) { return N(m.refunded_usd) + N(m.discounts_usd) > 0; }) ? G.bars(ref, {title: 'Refunds and discounts', fmt: money, color: 'var(--bad)'}) : '', {hint: 'refunds and discounts'}),
      G.card('Renewals coming up (forecast)', 'What ending licenses are worth if each renews at the current plan price.', renew.some(function (r) { return r.value > 0; }) ? G.bars(renew, {title: 'Renewals coming up', fmt: money, color: 'var(--info)'}) : '', {hint: 'needs licenses with end dates'}),
      G.card('Value of active licenses', 'One license period at the current plan prices, by plan.', G.donut(planV, {title: 'Active license value', fmt: money, centerLabel: 'per period'}), {hint: 'needs active licenses'}),
      G.card('Licenses and renewals', 'The base the next payments come from.', G.donut(lic, {title: 'Licenses', center: N(L.active), centerLabel: 'active'}), {hint: 'renewal base'})]};
  };

  /* =========================================================== MARKETING */
  G.build.marketing = function () {
    var A = CAP('admin_aff_stats'), V = CAP('admin_visitors'); if (!A && !V) return null; A = A || {}; V = V || {};
    var by = arr(A.by_broker), dly = arr(A.daily);
    var days = G.lastDays(30), cm = {}; dly.forEach(function (d) { cm[String(d.day).slice(0, 10)] = N(d.clicks); });
    var line = days.map(function (d) { return {label: d, short: shortDay(d), value: cm[d] || 0, sheet: function () { return {kicker: 'Clicks per day', title: d, value: num(cm[d] || 0), sub: 'clicks on your broker links'}; }}; });
    var br = by.map(function (b) { return {label: b.broker, value: N(b.d30), sheet: function () { return {kicker: 'Broker link', title: b.broker, value: num(b.total), sub: 'clicks, all time', chips: [{l: 'Last 7 days', v: num(b.d7)}, {l: 'Last 30 days', v: num(b.d30)}, {l: 'Signed in when clicking', v: num(b.signed_in)}, {l: 'Share signed in', v: pct(N(b.signed_in), N(b.total)) + '%'}], note: 'These are clicks on the links to ' + E(b.broker) + '. Signed in means the person had a GoldTriEngine account.'}; }}; });
    var tot7 = by.reduce(function (s, b) { return s + N(b.d7); }, 0), tot30 = by.reduce(function (s, b) { return s + N(b.d30); }, 0), totAll = by.reduce(function (s, b) { return s + N(b.total); }, 0), insights = [];
    if (by.length) { var top = by.slice().sort(function (a, b) { return N(b.d30) - N(a.d30); })[0]; insights.push(ins(tot7 ? 'ok' : 'warn', num(tot7) + ' broker clicks in 7 days', num(tot30) + ' in 30 days, ' + num(totAll) + ' in total.', function () { G.sheet({kicker: 'Broker clicks', title: 'All brokers', value: num(totAll), sub: 'clicks, all time', cols: ['Broker', '7 days', '30 days', 'All time', 'Signed in'], rows: by.map(function (b) { return [b.broker, b.d7, b.d30, b.total, b.signed_in]; })}); })); if (top && N(top.d30)) insights.push(ins('info', 'Most clicked: ' + top.broker, num(top.d30) + ' clicks in 30 days.')); }
    var cp = arr(V.campaigns).map(function (c) { return {label: c.name + (c.source ? ' (' + c.source + ')' : ''), value: N(c.visitors), sheet: function () { return {kicker: 'Campaign', title: c.name, value: num(c.visitors), sub: 'visitors', chips: [{l: 'Source', v: c.source || '-'}]}; }}; });
    var src = arr(V.sources).map(function (s) { return {label: s.name, value: N(s.visitors), sheet: function () { return {kicker: 'Source', title: s.name, value: num(s.visitors), sub: 'visitors', chips: [{l: 'Share of all visitors', v: pct(N(s.visitors), N(V.visitors)) + '%'}]}; }}; });
    var ch = arr(V.channels).map(function (c) { return {label: c.name, value: N(c.signups), sheet: function () { return {kicker: 'Channel', title: c.name, value: num(c.signups), sub: 'sign-ups', chips: [{l: 'Downloads', v: num(c.downloads)}, {l: 'Orders', v: num(c.orders)}, {l: 'Revenue', v: money(c.revenue)}, {l: 'Buyers', v: num(c.buyers)}]}; }}; });
    return {title: 'Marketing at a glance', insights: insights, cards: [
      G.card('Broker link clicks per day', 'Last 30 days.', tot30 ? G.line(line, {title: 'Clicks per day', labels: 6, color: 'var(--k3,#f472b6)'}) : '', {hint: 'daily clicks'}),
      G.card('Clicks by broker', 'Last 30 days. Click a broker for 7 days, all time and signed-in share.', G.hbars(br, {title: 'Clicks by broker'}), {hint: 'broker split'}),
      G.card('Where visitors come from', 'Top sources.', G.donut(src.slice(0, 8), {title: 'Sources', center: num(V.visitors), centerLabel: 'visitors'})),
      G.card('Campaign links', 'Visitors per tagged link.', G.hbars(cp, {title: 'Campaigns'}), {hint: 'tagged links'}),
      G.card('Channels: sign-ups', 'Which channel brings people who sign up.', G.hbars(ch, {title: 'Channels', share: false}), {hint: 'channels'})]};
  };

  /* =========================================================== SUPPORT */
  G.build.support = function () {
    var T = arr(CAP('admin_support_list')); if (CAP('admin_support_list') === undefined) return null;
    var stOf = function (t) { return String(t.status || (t.answered_at || t.answer ? 'answered' : 'open')); }, atOf = function (t) { return t.created_at || t.at || t.opened_at; };
    var rowsOf = function (rs) { return rs.map(function (t) { return [t.ref || String(t.id || '').slice(0, 8), t.email || t.name || '-', String(t.question || t.subject || t.message || '').slice(0, 80), stOf(t), String(atOf(t) || '').slice(0, 10)]; }); };
    var list = function (title, kicker, rs) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'request' : 'requests', cols: ['Ref', 'Customer', 'Question', 'Status', 'Date'], rows: rowsOf(rs), go: {label: 'Open Support', tab: 'support'}}; };
    var open = T.filter(function (t) { return !/answered|closed|done|resolved/.test(stOf(t)); }), insights = [];
    if (!T.length) insights.push(ins('ok', 'No support requests', 'Nobody is waiting for an answer.'));
    else { insights.push(ins(open.length ? 'warn' : 'ok', open.length ? plural(open.length, 'request') + ' waiting for an answer' : 'Everything is answered', open.length ? 'Oldest: ' + ago(open.map(atOf).sort()[0]) + '.' : T.length + ' request(s) in total.', function () { G.sheet(list('Waiting for an answer', 'Support', open)); })); }
    var stI = toItems(count(T, stOf), null, function (k) { return list('Status: ' + k, 'Support by status', T.filter(function (t) { return stOf(t) === k; })); });
    var days = G.lastDays(30), perDay = days.map(function (d) { var rs = T.filter(function (t) { return String(atOf(t)).slice(0, 10) === d; }); return {label: d, short: shortDay(d), value: rs.length, sheet: function () { return list('Requests on ' + d, 'Requests per day', rs); }}; });
    return {title: 'Support at a glance', insights: insights, cards: [G.card('Requests by status', 'Open, answered or closed.', G.donut(stI, {title: 'Support', center: T.length, centerLabel: 'requests'}), {hint: 'status split'}), G.card('Requests per day', 'Last 30 days.', T.length ? G.bars(perDay, {title: 'Requests per day', labels: 6, color: 'var(--info)'}) : '', {hint: 'last 30 days'})]};
  };

  /* =========================================================== EMAIL */
  G.build.email = function () {
    var S = CAP('admin_subscribers'), B = CAP('admin_broadcasts'), A = CAP('admin_auto_get'), TP = arr(CAP('admin_templates')); if (!S && !B && !A) return null; S = S || {}; B = B || {}; A = A || {};
    var insights = [];
    if (B.cap != null) insights.push(ins(N(B.sent_24h) / Math.max(1, N(B.cap)) > .8 ? 'warn' : 'ok', num(B.sent_24h) + ' of ' + num(B.cap) + ' emails sent in 24 hours', 'The daily cap protects your sender reputation.', function () { G.sheet({kicker: 'Newsletter', title: 'Emails sent in 24 hours', value: num(B.sent_24h), sub: 'of ' + num(B.cap) + ' allowed', chips: [{l: 'Subscribers', v: num(B.subscribers != null ? B.subscribers : S.active)}]}); }));
    if (A.enabled != null) insights.push(ins(A.enabled ? 'ok' : 'warn', 'Automatic follow-ups are ' + (A.enabled ? 'on' : 'off'), num(A.sent_today) + ' sent today of ' + num(A.daily_cap) + '. ' + arr(A.due).length + ' due now. Last run ' + (A.last_run ? ago(A.last_run) : 'never') + '.', function () { G.sheet({kicker: 'Follow-ups', title: 'Automatic follow-ups', value: num(A.sent_today), sub: 'sent today', chips: [{l: 'Due now', v: arr(A.due).length}, {l: 'Daily cap', v: num(A.daily_cap)}, {l: 'Steps in the sequence', v: arr(A.sequence).length}], cols: ['Step', 'After days', 'Name', 'Subject'], rows: arr(A.sequence).map(function (s) { return [s.step, s.delay, s.name, s.subject]; })}); }));
    if (S.active != null) insights.push(ins('info', num(S.active) + ' subscribers, ' + num(S.unsubscribed) + ' unsubscribed', S.unsubscribed ? pct(N(S.unsubscribed), N(S.active) + N(S.unsubscribed)) + '% have left.' : 'Nobody has left.'));
    var subI = [{label: 'Subscribed', value: N(S.active), color: 'var(--ok)'}, {label: 'Unsubscribed', value: N(S.unsubscribed), color: 'var(--bad)'}]; subI.forEach(function (x) { x.sheet = function () { return {kicker: 'Subscribers', title: x.label, value: num(x.value), sub: 'people', cols: ['Email', 'Joined'], rows: arr(S.rows).filter(function (r) { return x.label === 'Subscribed' ? !r.unsubscribed_at : !!r.unsubscribed_at; }).map(function (r) { return [r.email, String(r.created_at || '').slice(0, 10)]; })}; }; });
    var tpI = toItems(count(TP, function (t) { return t.audience; }), null, function (k) { return {kicker: 'Email templates', title: 'Audience: ' + k, value: String(TP.filter(function (t) { return (t.audience || 'unknown') === k; }).length), sub: 'templates', cols: ['Template', 'Automatic', 'After days', 'Marketing'], rows: TP.filter(function (t) { return (t.audience || 'unknown') === k; }).map(function (t) { return [t.name, t.auto_on ? 'yes' : 'no', t.auto_after_days == null ? '-' : t.auto_after_days, t.marketing ? 'yes' : 'no']; })}; });
    var seq = arr(A.sequence).map(function (s) { return {label: s.step + '. ' + s.name, value: N(s.delay), sheet: function () { return {kicker: 'Follow-up sequence', title: s.name, value: 'Day ' + N(s.delay), sub: 'after the trigger', chips: [{l: 'Track', v: s.track || '-'}, {l: 'Template', v: s.template || '-'}], note: 'Subject: <b>' + E(s.subject) + '</b>'}; }}; });
    var gauges = '';
    if (B.cap != null) gauges += G.gauge(N(B.sent_24h), N(B.cap), {title: 'Newsletter cap', caption: 'newsletter, last 24 h', sheet: function () { return {kicker: 'Newsletter', title: 'Daily sending cap', value: num(B.sent_24h) + ' / ' + num(B.cap), sub: 'emails in 24 hours'}; }});
    if (A.daily_cap != null) gauges += G.gauge(N(A.sent_today), N(A.daily_cap), {title: 'Follow-up cap', caption: 'follow-ups, today', sheet: function () { return {kicker: 'Follow-ups', title: 'Daily follow-up cap', value: num(A.sent_today) + ' / ' + num(A.daily_cap), sub: 'sent today'}; }});
    return {title: 'Email at a glance', insights: insights, cards: [
      G.card('Sending against the daily caps', 'How much of today\'s allowance is used.', gauges ? '<div class="gcgr">' + gauges + '</div>' : ''),
      G.card('Subscribers', 'Who still gets the newsletter.', G.donut(subI, {title: 'Subscribers', center: num(N(S.active) + N(S.unsubscribed)), centerLabel: 'people'}), {hint: 'subscribers'}),
      G.card('Email templates', 'Which audience each template is for.', G.donut(tpI, {title: 'Templates', center: TP.length, centerLabel: 'templates'})),
      G.card('Follow-up sequence', 'When each automatic email goes out (days after the trigger).', G.hbars(seq, {title: 'Sequence', share: false, fmt: function (v) { return 'day ' + v; }, max: 14}), {hint: 'follow-up timeline'})]};
  };

  /* =========================================================== AFFILIATES */
  G.build.affiliates = function () {
    var P = arr(CAP('admin_partners')), O = CAP('admin_partner_overview') || {}; if (CAP('admin_partners') === undefined) return null;
    var rowsOf = function (rs) { return rs.map(function (p) { return [p.display_name || p.code, p.code, p.status, num(p.clicks), num(p.signups), money(p.revenue), p.rate_sale + '%']; }); };
    var list = function (title, kicker, rs) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'partner' : 'partners', cols: ['Partner', 'Code', 'Status', 'Clicks', 'Sign-ups', 'Sales', 'Rate'], rows: rowsOf(rs), go: {label: 'Open Affiliates', tab: 'affiliates'}}; };
    var insights = [];
    if (!P.length) insights.push(ins('info', 'No partners yet', 'Approved partners and their results appear here.'));
    else {
      var pend = P.filter(function (p) { return p.status === 'pending'; }); if (pend.length) insights.push(ins('warn', plural(pend.length, 'application') + ' waiting', 'Approve or decline them so applicants are not left waiting.', function () { G.sheet(list('Applications waiting', 'Partners', pend)); }));
      if (N(O.requested) || N(O.due)) insights.push(ins('warn', plural(N(O.requested) || N(O.due), 'payout') + ' to handle', money(O.dueTo || 0) + ' is ready to pay out.', goI('affiliates')));
      var top = P.slice().sort(function (a, b) { return N(b.revenue) - N(a.revenue); })[0]; if (top && N(top.revenue)) insights.push(ins('ok', 'Top partner: ' + (top.display_name || top.code), money(top.revenue) + ' in sales, ' + num(top.signups) + ' sign-ups.', function () { G.sheet(list('Top partners', 'By sales', P.slice().sort(function (a, b) { return N(b.revenue) - N(a.revenue); }))); }));
      if (N(O.flagged)) insights.push(ins('bad', plural(N(O.flagged), 'partner') + ' flagged', 'Check the activity timeline for self-referral attempts.', goI('affiliates')));
      var cl = P.reduce(function (s, p) { return s + N(p.clicks); }, 0), sg = P.reduce(function (s, p) { return s + N(p.signups); }, 0); insights.push(ins('info', num(cl) + ' partner clicks, ' + num(sg) + ' sign-ups', cl ? pct(sg, cl) + '% of clicks sign up.' : 'No clicks yet.'));
    }
    var stI = toItems(count(P, function (p) { return p.status; }), null, function (k) { return list('Status: ' + k, 'Partners by status', P.filter(function (p) { return p.status === k; })); }, {active: 'var(--ok)', pending: 'var(--warn)', paused: 'var(--bad)', declined: 'var(--mute)'});
    var revI = P.filter(function (p) { return N(p.revenue) > 0; }).sort(function (a, b) { return N(b.revenue) - N(a.revenue); }).map(function (p) { return {label: p.display_name || p.code, value: N(p.revenue), sheet: function () { return {kicker: 'Partner', title: p.display_name || p.code, value: money(p.revenue), sub: 'sales brought in', chips: [{l: 'Code', v: p.code}, {l: 'Clicks', v: num(p.clicks)}, {l: 'Sign-ups', v: num(p.signups)}, {l: 'Rate on sales', v: p.rate_sale + '%'}, {l: 'Customer discount', v: p.discount_pct + '%'}, {l: 'Status', v: p.status}], go: {label: 'Open Affiliates', tab: 'affiliates'}}; }}; });
    var clI = P.filter(function (p) { return N(p.clicks) > 0; }).sort(function (a, b) { return N(b.clicks) - N(a.clicks); }).map(function (p) { return {label: p.display_name || p.code, value: N(p.clicks), sheet: revI.length ? null : function () { return {kicker: 'Partner', title: p.display_name || p.code, value: num(p.clicks), sub: 'clicks', chips: [{l: 'Sign-ups', v: num(p.signups)}, {l: 'Sales', v: money(p.revenue)}]}; }}; });
    clI.forEach(function (it, i) { var p = P.filter(function (x) { return (x.display_name || x.code) === it.label; })[0]; it.sheet = function () { return {kicker: 'Partner', title: it.label, value: num(it.value), sub: 'clicks on their links', chips: [{l: 'Sign-ups', v: num(p && p.signups)}, {l: 'Sales', v: money(p && p.revenue)}, {l: 'Click to sign-up', v: pct(N(p && p.signups), N(p && p.clicks)) + '%'}], go: {label: 'Open Affiliates', tab: 'affiliates'}}; }; });
    var money3 = [{label: 'All partner sales', value: N(O.allRevenue || O.revenue), color: 'var(--ok)'}, {label: 'Commission earned', value: N(O.commission), color: 'var(--k4,#fbbf24)'}].filter(function (x) { return x.value > 0; });
    money3.forEach(function (x) { x.sheet = function () { return {kicker: 'Partner money', title: x.label, value: money(x.value), sub: 'in USD', note: 'Commission is what partners earned on those sales. It is paid out after the refund wait.', go: {label: 'Open Affiliates', tab: 'affiliates'}}; }; });
    return {title: 'Affiliates at a glance', insights: insights, cards: [
      G.card('Partners by status', 'Active, waiting, paused or declined.', G.donut(stI, {title: 'Partners', center: P.length, centerLabel: 'partners'})),
      G.card('Sales per partner', 'Who earns the most.', G.hbars(revI, {title: 'Sales', fmt: money, share: false}), {hint: 'needs a sale'}),
      G.card('Clicks per partner', 'Whose links get used.', G.hbars(clI, {title: 'Clicks'}), {hint: 'needs clicks'}),
      G.card('Sales against commission', 'What partners brought in, and what they earned.', G.donut(money3, {title: 'Partner money', fmt: money, centerLabel: 'USD'}), {hint: 'needs a sale'})]};
  };

  /* =========================================================== BLOG */
  G.build.blog = function () {
    var B = CAP('admin_blog_state'), En = CAP('admin_blog_engagement'); if (!B) return null; var posts = arr(B.posts), runs = arr(B.runs), eng = arr((En || {}).posts), set = B.settings || {};
    var prow = function (rs) { return rs.map(function (p) { return [p.title, p.kind, p.status, p.category || '-', String(p.post_date || '').slice(0, 10)]; }); };
    var plist = function (title, kicker, rs) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'post' : 'posts', cols: ['Title', 'Kind', 'Status', 'Category', 'Date'], rows: prow(rs)}; };
    var failed = runs.filter(function (r) { return !r.ok; }), week = posts.filter(function (p) { return NOW() - new Date(p.post_date || p.updated_at).getTime() < 7 * DAY; }), insights = [];
    insights.push(ins(failed.length ? 'bad' : 'ok', failed.length ? plural(failed.length, 'job') + ' failed recently' : 'All recent blog jobs succeeded', runs.length + ' recent job run(s). ' + (set.paused ? 'The blog is paused.' : ''), function () { G.sheet({kicker: 'Blog jobs', title: 'Recent job runs', value: String(runs.length), sub: 'runs', chips: [{l: 'Failed', v: failed.length, tone: failed.length ? 'bad' : 'ok'}], cols: ['When', 'Job', 'Result', 'Summary'], rows: runs.map(function (r) { return [dt(r.at), r.job, r.ok ? 'ok' : 'failed', String(r.summary || r.detail || '').slice(0, 90)]; })}); }));
    insights.push(ins('info', plural(week.length, 'post') + ' in the last 7 days', posts.length + ' posts on record.', function () { G.sheet(plist('Posts of the last 7 days', 'Blog', week)); }));
    if (En && En.totals) insights.push(ins('info', num(En.totals.visits_30) + ' blog visits in 30 days', num(En.totals.likes) + ' likes, ' + num(En.totals.comments) + ' comments' + (N(En.totals.pending) ? ', ' + En.totals.pending + ' waiting for approval.' : '.'), function () { G.sheet({kicker: 'Blog readers', title: 'Blog engagement', value: num(En.totals.visits_30), sub: 'visits in 30 days', chips: [{l: 'All time', v: num(En.totals.visits_all)}, {l: 'Likes', v: num(En.totals.likes)}, {l: 'Comments', v: num(En.totals.comments)}], cols: ['Post', '7 days', '30 days', 'All time', 'Likes'], rows: eng.map(function (p) { return [p.slug, p.visits_7, p.visits_30, p.visits_all, p.likes]; })}); }));
    var kindI = toItems(count(posts, function (p) { return p.kind; }), null, function (k) { return plist('Kind: ' + k, 'Posts by kind', posts.filter(function (p) { return p.kind === k; })); });
    var stI = toItems(count(posts, function (p) { return p.status; }), null, function (k) { return plist('Status: ' + k, 'Posts by status', posts.filter(function (p) { return p.status === k; })); }, {published: 'var(--ok)', held: 'var(--warn)', draft: 'var(--mute)'});
    var wk = lastWeeks(10), perW = wk.map(function (w) { var rs = posts.filter(function (p) { return weekStart(p.post_date || p.updated_at) === w; }); return {label: 'Week of ' + w, short: shortDay(w), value: rs.length, sheet: function () { return plist('Posts in the week of ' + w, 'Posts per week', rs); }}; });
    var top = eng.filter(function (p) { return N(p.visits_30) > 0; }).sort(function (a, b) { return N(b.visits_30) - N(a.visits_30); }).map(function (p) { var po = posts.filter(function (x) { return x.slug === p.slug; })[0]; return {label: (po && po.title) || p.slug, value: N(p.visits_30), sheet: function () { return {kicker: 'Blog post', title: (po && po.title) || p.slug, value: num(p.visits_30), sub: 'visits in 30 days', chips: [{l: '7 days', v: num(p.visits_7)}, {l: 'All time', v: num(p.visits_all)}, {l: 'Readers', v: num(p.readers)}, {l: 'Average time', v: Math.round(N(p.avg_secs)) + ' s'}, {l: 'Likes', v: num(p.likes)}, {l: 'Comments', v: num(p.comments)}]}; }}; });
    var runI = [{label: 'Succeeded', value: runs.length - failed.length, color: 'var(--ok)'}, {label: 'Failed', value: failed.length, color: 'var(--bad)'}];
    runI.forEach(function (x) { x.sheet = function () { var rs = runs.filter(function (r) { return x.label === 'Succeeded' ? r.ok : !r.ok; }); return {kicker: 'Blog jobs', title: x.label + ' runs', value: String(rs.length), sub: 'runs', cols: ['When', 'Job', 'Summary'], rows: rs.map(function (r) { return [dt(r.at), r.job, String(r.summary || r.detail || '').slice(0, 100)]; })}; }; });
    return {title: 'Blog at a glance', insights: insights, cards: [
      G.card('Posts per week', 'How often the blog publishes.', posts.length ? G.bars(perW, {title: 'Posts per week', labels: 5, color: 'var(--k1,#a78bfa)'}) : '', {hint: 'weekly posts'}),
      G.card('Posts by kind', 'Recaps, outlooks, lessons and so on.', G.donut(kindI, {title: 'Posts by kind', center: posts.length, centerLabel: 'posts'})),
      G.card('Posts by status', 'Published, held for approval or draft.', G.donut(stI, {title: 'Posts by status', center: posts.length, centerLabel: 'posts'})),
      G.card('Most read posts', 'Visits in the last 30 days.', G.hbars(top, {title: 'Most read', share: false}), {hint: 'needs readers'}),
      G.card('Blog jobs', 'Did the recent jobs run well?', G.donut(runI, {title: 'Blog jobs', center: runs.length, centerLabel: 'runs'}))]};
  };

  /* =========================================================== PROOF WALL */
  G.build.proof = function () {
    var W = arr(CAP('admin_wall_overview')); if (CAP('admin_wall_overview') === undefined) return null;
    var rowsOf = function (rs) { return rs.map(function (w) { return [w.name || '-', w.email, pn(w.plan), w.trades, w.shown ? 'shown' : 'not shown', w.agreed ? 'yes' : 'no', w.reason || '']; }); };
    var list = function (title, kicker, rs) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'person' : 'people', cols: ['Name', 'Email', 'Plan', 'Trades', 'On the wall', 'Agreed', 'Why not'], rows: rowsOf(rs), go: {label: 'Open Proof Wall', tab: 'proof'}}; };
    var sh = W.filter(function (w) { return w.shown; }), hid = W.filter(function (w) { return !w.shown && w.agreed; }), na = W.filter(function (w) { return !w.agreed; }), insights = [];
    insights.push(ins(sh.length ? 'ok' : 'info', plural(sh.length, 'person', 'people') + ' on the public wall', W.length + ' account(s) considered. ' + na.length + ' have not agreed to show their results.', function () { G.sheet(list('On the Proof Wall', 'Public results', sh)); }));
    var it = [{label: 'Shown on the wall', value: sh.length, color: 'var(--ok)', sheet: function () { return list('Shown on the wall', 'Proof Wall', sh); }}, {label: 'Agreed, but hidden', value: hid.length, color: 'var(--warn)', sheet: function () { return list('Agreed but hidden', 'Proof Wall', hid); }}, {label: 'Have not agreed', value: na.length, color: 'var(--mute)', sheet: function () { return list('Have not agreed', 'Proof Wall', na); }}];
    return {title: 'Proof Wall at a glance', insights: insights, cards: [G.card('Who is on the wall', 'Only people who agreed to show their results.', G.donut(it, {title: 'Proof wall', center: W.length, centerLabel: 'accounts'}))]};
  };

  /* =========================================================== AUDIT */
  G.build.audit = function () {
    var A = arr(D().audit); if (!A.length) return null;
    var rowsOf = function (rs) { return rs.map(function (a) { return [dt(a.at), a.actor || '-', a.action, String(a.detail || '').slice(0, 100)]; }); };
    var list = function (title, kicker, rs) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'entry' : 'entries', cols: ['When', 'Who', 'Action', 'Detail'], rows: rowsOf(rs)}; };
    var today = A.filter(function (a) { return String(a.at).slice(0, 10) === G.day(NOW()); }), insights = [];
    insights.push(ins('info', plural(today.length, 'action') + ' today', 'Last: ' + (A[0] ? A[0].action + ' by ' + (A[0].actor || '-') + ', ' + ago(A[0].at) : 'none') + '.', function () { G.sheet(list('Actions today', 'Audit log', today)); }));
    var days = G.lastDays(14), perDay = days.map(function (d) { var rs = A.filter(function (a) { return String(a.at).slice(0, 10) === d; }); return {label: d, short: shortDay(d), value: rs.length, sheet: function () { return list('Actions on ' + d, 'Actions per day', rs); }}; });
    var act = toItems(count(A, function (a) { return a.action; }), null, function (k) { return list('Action: ' + k, 'Audit log', A.filter(function (a) { return a.action === k; })); });
    var who = toItems(count(A, function (a) { return a.actor; }), null, function (k) { return list('By ' + k, 'Audit log', A.filter(function (a) { return a.actor === k; })); });
    return {title: 'Audit log at a glance', insights: insights, cards: [G.card('Actions per day', 'Everything done in the admin, last 14 days.', G.bars(perDay, {title: 'Actions per day', labels: 7, color: 'var(--k1,#a78bfa)'})), G.card('What was done', 'Most common actions.', G.hbars(act, {title: 'Actions', max: 8})), G.card('Who did it', 'Admin accounts and the system.', G.donut(who, {title: 'Actors', center: A.length, centerLabel: 'entries'}))]};
  };

  /* =========================================================== HEALTH */
  G.build.health = function () {
    var H = CAP('admin_health'); if (!H) return null; var all = arr(H.checks).concat(arr(H.pc)), rows = function (rs) { return rs.map(function (c) { return [c.section, c.title, c.status, String(c.detail || '').slice(0, 110)]; }); };
    var list = function (title, kicker, rs) { return {kicker: kicker, title: title, value: String(rs.length), sub: rs.length === 1 ? 'check' : 'checks', cols: ['Area', 'Check', 'Status', 'Detail'], rows: rows(rs)}; };
    var bad = all.filter(function (c) { return c.status === 'bad'; }), warn = all.filter(function (c) { return c.status === 'warn'; }), insights = [];
    insights.push(ins(bad.length ? 'bad' : warn.length ? 'warn' : 'ok', bad.length ? plural(bad.length, 'problem') + ', ' + plural(warn.length, 'warning') : warn.length ? plural(warn.length, 'warning') : 'All ' + all.length + ' checks are fine', H.pc_at ? 'Your PC reported ' + ago(H.pc_at) + '.' : 'No report from your PC yet.', function () { G.sheet(list(bad.length ? 'Problems' : 'Warnings', 'Health', bad.length ? bad : warn)); }));
    var st = [{label: 'OK', value: all.length - bad.length - warn.length, color: 'var(--ok)'}, {label: 'Warnings', value: warn.length, color: 'var(--warn)'}, {label: 'Problems', value: bad.length, color: 'var(--bad)'}];
    st.forEach(function (x) { x.sheet = function () { return list(x.label, 'Health', all.filter(function (c) { return (x.label === 'OK' ? c.status === 'ok' : x.label === 'Warnings' ? c.status === 'warn' : c.status === 'bad'); })); }; });
    var secs = {}; all.forEach(function (c) { var s = c.section || 'Other'; (secs[s] = secs[s] || {ok: 0, bad: 0, n: 0}).n++; if (c.status !== 'ok') secs[s].bad++; else secs[s].ok++; });
    var secI = Object.keys(secs).map(function (s) { return {label: s, value: secs[s].n, parts: [{v: secs[s].ok, c: 'var(--ok)'}, {v: secs[s].bad, c: 'var(--bad)'}], color: secs[s].bad ? 'var(--warn)' : 'var(--ok)', sheet: function () { return list(s, 'Health area', all.filter(function (c) { return (c.section || 'Other') === s; })); }}; });
    return {title: 'Health at a glance', insights: insights, cards: [G.card('Checks by result', 'Everything the system looks at.', G.donut(st, {title: 'Health', center: all.length, centerLabel: 'checks'})), G.card('Checks per area', 'Click an area to see its checks.', G.hbars(secI.map(function (s) { return {label: s.label, value: s.value, color: s.color, sheet: s.sheet}; }), {title: 'Areas', share: false}))]};
  };

  /* =========================================================== a click on a plain summary tile (tabs whose tiles have no list behind them) */
  var KPI_NOTE = {
    revenue: {'Money received': 'The sum of orders you confirmed as paid. Free keys and refunds are not counted.', 'Refunded': 'Orders you marked as refunded in Orders.', 'Active licenses': 'Licenses that are active now, with how many end within 30 days.', 'Waiting for you': 'Orders started or claimed by the customer that you have not confirmed yet.'},
    marketing: {}, support: {}, email: {}, blog: {}, audit: {}, proof: {}
  };
  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('#view .kpi.kx'); if (!k || e.target.closest('button,a,input,select')) return;
    var tabKey = ''; try { tabKey = typeof tab !== 'undefined' ? tab : ''; } catch (x) {} if (!KPI_NOTE[tabKey]) return;
    var label = (k.firstChild ? String(k.firstChild.textContent) : '').trim(), val = (k.querySelector('b') || {}).textContent || '', sub = (k.querySelector('span') || {}).textContent || '';
    var sp = {kicker: 'Summary', title: label, value: val, sub: sub, note: KPI_NOTE[tabKey][label] || 'This number is worked out from the data this tab loads. The charts above break it down.'};
    var D0 = D();
    if (tabKey === 'revenue') {
      var R = CAP('admin_revenue') || {}, M = arr(R.months), os = arr(D0.orders);
      if (label === 'Money received') { sp.cols = ['Month', 'Received', 'New', 'Renewals', 'Upgrades']; sp.rows = M.slice().reverse().map(function (m) { return [m.month, money(m.revenue_usd), m.purchases, m.renewals, m.upgrades]; }); sp.go = {label: 'Open Orders', tab: 'orders', pre: function () { window._of2 = 'paid'; }}; }
      else if (label === 'Refunded') { var rf = os.filter(function (o) { return o.status === 'refunded'; }); sp.cols = ['Ref', 'Customer', 'Plan', 'Amount']; sp.rows = rf.map(function (o) { return [o.ref, o.email, pn(o.plan_id), money(o.amount_usd)]; }); sp.go = {label: 'Open Orders', tab: 'orders', pre: function () { window._of2 = 'refunded'; }}; }
      else if (label === 'Active licenses') { var ls = arr(D0.licenses).filter(function (l) { return l.status === 'active'; }); sp.cols = ['Key', 'Plan', 'Customer', 'Expires']; sp.rows = ls.map(function (l) { return [l.key, pn(l.plan_id), l.owner_email || '-', String(l.expires_at || '').slice(0, 10)]; }); sp.go = {label: 'Open Licenses', tab: 'licenses'}; }
      else if (label === 'Waiting for you') { var wt = os.filter(function (o) { return o.status === 'paid_claimed' || o.status === 'pending'; }); sp.cols = ['Ref', 'Customer', 'Amount', 'Status']; sp.rows = wt.map(function (o) { return [o.ref, o.email, money(o.amount_usd), o.status === 'paid_claimed' ? 'to check' : 'not paid']; }); sp.go = {label: 'Open Orders', tab: 'orders', pre: function () { window._of2 = 'check'; }}; }
    }
    e.preventDefault(); e.stopPropagation(); G.sheet(sp);
  }, true);

  if (G.refresh) G.refresh();
})();
