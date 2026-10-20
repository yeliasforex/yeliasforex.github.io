/* My account page. Reads only the signed-in customer's own rows (enforced by database row-level security). */
(async function () {
  const {esc, date, ago, DEMO} = gte, R = window.gteResults, $ = s => document.querySelector(s), A = $('#acct');
  const usd = (n, d) => d !== undefined ? R.usd(n, d) : (Number.isInteger(+n) ? R.usd(n, 0) : R.usd(n, 2));   // always two decimals unless a whole amount
  let c, S = {}, cur = null, range = 'all';
  const tflt = {eng: 'all', res: 'all', page: 1};
  let tab = (location.hash.match(/tab=(\w+)/) || [])[1] || 'overview';
  const TABS = [['overview', 'Overview'], ['results', 'Results'], ['trades', 'Trades'], ['inbox', 'Notifications'], ['alerts', 'Alerts'], ['billing', 'Orders & keys']];
  const NOTIFY = [['ea_started', 'EA started / stopped'], ['trade_open', 'Trade opened'], ['trade_close', 'Trade closed with result'], ['addon', 'Add-on filled / closed'], ['daily_report', 'Daily report'], ['offline', 'EA offline / back online']];
  const SEV = {error: 0, warning: 1, info: 2}, tradeCache = {};
  const QS = new URLSearchParams(location.search), INJ = QS.has('inject');
  const AS = QS.get('as') || (INJ ? 'inject' : null);      // admin "view as customer" (read-only). inject = the admin panel posts the data in
  let quiet = false, calM = null;                      // quiet = background refresh: no replayed animations
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // numbers count up from zero: any element with data-cu (target) and data-f (format)
  function countUp(root) {
    const fmt = {usd: v => R.usd(v, 2), sgn: v => R.sgn(v, 2), pct: v => v.toFixed(0) + '%', dec: v => v.toFixed(2), int: v => String(Math.round(v))};
    root.querySelectorAll('[data-cu]').forEach(el => {
      const to = +el.dataset.cu, f = fmt[el.dataset.f] || fmt.int, end = el.textContent;
      if (quiet || REDUCED || !isFinite(to)) return;
      const t0 = performance.now(), dur = 1100;
      const step = now => { const p = Math.min(1, (now - t0) / dur); if (p < 1) { el.textContent = f(to * (1 - Math.pow(1 - p, 3))); requestAnimationFrame(step); } else el.textContent = end; };
      el.textContent = f(0); requestAnimationFrame(step);
    });
  }

  // ---------- data ----------
  async function load() {
    if (DEMO) return demoData();
    if (INJ) return window.__inj.S;
    const q = async p => { const r = await p; if (r.error) throw r.error; return r.data; };
    const notices = AS ? [] : (await c.from('customer_notices').select('*').order('created_at', {ascending: false}).limit(60)).data || [];
    const [profile, licenses, statuses, plans, catalog, orders, settings] = await Promise.all([
      AS ? Promise.resolve(null) : q(c.from('profiles').select('email,telegram_chat_id,notify_prefs').maybeSingle()),
      q(c.from('licenses').select('id,key,plan_id,owner_user_id,status,activated_at,expires_at,bound_account,bound_broker,bound_is_demo,extra_allowance_usd,created_at').order('created_at')),
      q(c.from('license_status').select('*')), q(c.from('plans').select('*').order('sort')), q(c.from('message_catalog').select('*')),
      q(c.from('orders').select('*').order('created_at', {ascending: false})), gte.settings()]);
    if (!AS) return {profile, licenses, statuses, plans, catalog, orders, settings, notices};
    // Admin view: the database lets an admin (signed in and verified with the Telegram code) read everything; show just this one customer's license
    const lic = licenses.filter(l => l.id === AS), owner = lic[0] && lic[0].owner_user_id;
    const prof = owner ? await q(c.from('profiles').select('email,telegram_chat_id,notify_prefs').eq('user_id', owner).maybeSingle()) : null;
    return {profile: prof || {email: null, telegram_chat_id: null, notify_prefs: {}}, licenses: lic, statuses: statuses.filter(s => s.license_id === AS), plans, catalog,
            orders: orders.filter(o => o.license_id === AS || (owner && o.user_id === owner)), settings, notices: []};
  }
  async function rpc(fn, args) {
    if (AS) throw new Error('This is the admin view of a customer account: it is read-only.');
    if (DEMO) { toast('Demo mode: ' + fn); return {id: 'demo', ref: 'GTE-DEMO01', amountUsd: 1700}; }
    const {data, error} = await c.rpc(fn, args || {}); if (error) throw error; return data;
  }
  const TCOLS = 'engine,dir,is_add,opened_at,closed_at,open_price,close_price,lots,result_r,profit';
  const tnorm = rows => { rows.forEach(t => { t.profit = Number(t.profit); t.result_r = Number(t.result_r); t.lots = Number(t.lots); }); return rows; };
  async function tradesFor(id) {
    const hit = tradeCache[id]; if (hit && Date.now() - hit.at < 55000) return hit.rows;
    if (hit && hit.rows.length && !INJ && !DEMO) {                      // background refresh: fetch only the trades closed since the last one we have
      try {
        const last = hit.rows[hit.rows.length - 1].closed_at;
        const {data, error} = await c.from('trades').select(TCOLS).eq('license_id', id).gte('closed_at', last).order('closed_at').limit(1000);
        if (!error && data) {
          const key = x => x.opened_at + '|' + x.closed_at + '|' + x.lots + '|' + x.profit, have = new Set(hit.rows.map(key));
          hit.rows = hit.rows.concat(tnorm(data).filter(x => !have.has(key(x)))); hit.at = Date.now(); return hit.rows;
        }
      } catch (e) {}
    }
    let rows = [];
    if (INJ) rows = window.__inj.trades.map(t => ({...t}));
    else
    if (DEMO) rows = R.demo();
    else for (let from = 0; from < 20000; from += 1000) {
      const {data, error} = await c.from('trades').select(TCOLS).eq('license_id', id).order('closed_at').range(from, from + 999);
      if (error) throw error; rows = rows.concat(data); if (data.length < 1000) break;
    }
    tnorm(rows);
    tradeCache[id] = {at: Date.now(), rows}; return rows;
  }
  function demoData() {
    const d = n => new Date(Date.now() + n * 864e5).toISOString();
    return {profile: {email: 'amina@example.com', telegram_chat_id: null, notify_prefs: {}},
      licenses: [{id: '1', key: 'GTE-7QK2-XM9A-D4PF', plan_id: 'investor', status: 'active', activated_at: d(-30), expires_at: d(335), bound_account: 51234567, bound_broker: 'IC Markets', bound_is_demo: false, extra_allowance_usd: 0}, {id: '2', key: 'GTE-NEW1-ABCD-EFGH', plan_id: 'tycoon', status: 'unused', activated_at: null, expires_at: null, bound_account: null, bound_broker: null, bound_is_demo: false, extra_allowance_usd: 0}],
      statuses: [{license_id: '1', online: true, last_heartbeat: d(-0.002), balance: 6120.4, equity: 6188.9, open_positions: 1, engine_state: 'IN TRADE', funded_usd: 5900, over_limit: true, ea_version: '1.08', problems: ['OVER_LIMIT', 'TELEGRAM_NOT_CONNECTED']}],
      plans: gte.fallbackPlans.map((p, i) => ({...p, sort: i, active: true})),
      catalog: [{code: 'OVER_LIMIT', severity: 'warning', title: 'Deposits above your plan limit', explanation: 'The money deposited on this account is above your plan size. New trades are paused; open trades are still managed and nothing is closed.', solution: 'Upgrade your plan on your account page, or withdraw the excess. Trading resumes by itself within minutes.'},
        {code: 'TELEGRAM_NOT_CONNECTED', severity: 'info', title: 'Telegram not connected', explanation: 'You will not get notifications on Telegram.', solution: 'Open your account page and tap Connect Telegram.'}],
      orders: [], settings: {salesOpen: true, supportUrl: 'https://t.me/GoldTriEngine_Support', botUsername: 'GoldTriEngine_Bot', unbindFeeUsd: 100, toleranceActive: 5, latestVersion: '1.09', downloadUrl: '', releaseNotes: 'Smoother exits and a faster panel.'},
      notices: [{id: 2, kind: 'update', title: 'New EA version 1.09 is available', body: 'Smoother exits and a faster panel. Download it from your account page, replace the old file and restart MT5.', link: 'download.html', created_at: d(-0.1), read_at: null}, {id: 1, kind: 'license', title: 'Deposits above your plan limit', body: 'New trades are paused until you upgrade or withdraw the excess.', link: null, created_at: d(-2), read_at: d(-1.9)}]};
  }
  function toast(t, err) { const e = document.createElement('div'); e.className = 'msg ' + (err ? 'err' : 'ok'); e.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:99;min-width:260px;max-width:92vw'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 4000); }
  const guard = f => async (...a) => { try { await f(...a); } catch (e) { toast(e.message || String(e), true); } };

  // ---------- helpers ----------
  const unread = () => (S.notices || []).filter(x => !x.read_at).length;
  const planOf = id => S.plans.find(p => p.id === id) || {name: id};
  const stOf = id => S.statuses.find(s => s.license_id === id) || {};
  const fill = t => String(t || '').replace('{SUPPORT}', S.settings.supportUrl || 'the support link');
  const statePill = s => ({active: ['ok', 'Active'], unused: ['info', 'Ready to activate'], expired: ['warn', 'Expired'], disabled: ['bad', 'Disabled']}[s] || ['', s]);
  const inRange = (t, r) => r === 'all' ? t : t.filter(x => new Date(x.closed_at).getTime() >= Date.now() - (r === '1m' ? 30 : 90) * 864e5);
  const prettyState = s => { s = String(s || ''); if (/^M:/.test(s)) return s.includes('IN') ? 'In trade' : 'Running'; return s ? s[0] + s.slice(1).toLowerCase() : 'Running'; };
  function problems(l, st) {
    const codes = new Set(st.problems || []);
    if (l.status === 'expired') codes.add('KEY_EXPIRED');
    if (l.status === 'disabled') codes.add('KEY_DISABLED');
    if (l.status === 'unused') codes.add('__unused');
    if (l.status === 'active' && st.online === false) codes.add('HEARTBEAT_MISSING');
    return [...codes].map(code => code === '__unused'
      ? {severity: 'info', title: 'Not activated yet', explanation: 'Your key has not been attached to an MT5 account yet.', solution: 'Download the EA, paste this key into its only setting and attach it to a USD MT5 chart. See the setup steps on the Download page.'}
      : S.catalog.find(m => m.code === code)).filter(Boolean).sort((a, b) => SEV[a.severity] - SEV[b.severity]);
  }

  // ---------- render ----------
  async function render() {
    const lic = S.licenses.find(l => l.id === cur) || S.licenses[0]; cur = lic ? lic.id : null;
    const parts = [];
    if (AS) parts.push(`<div class="msg" style="border-color:var(--gold);color:var(--gold);margin-bottom:12px"><b>Admin view.</b> This is ${esc(S.profile.email || 'this customer')}'s account exactly as they see it. Read-only: nothing here can be changed.${INJ ? '' : ' <a href="admin/" style="color:inherit;text-decoration:underline">Back to admin</a>'}</div>`);
    if (AS && !S.licenses.length) { parts.push('<div class="panel"><h2>Not found</h2><p class="sub">No such license, or this login is not a verified admin.</p></div>'); A.innerHTML = parts.join(''); return; }
    for (const o of S.orders.filter(o => o.status === 'pending' || o.status === 'paid_claimed')) parts.push(`<div id="ord-${o.id}">` + orderPanel(o) + '</div>');
    if (!lic) { parts.push(emptyPanel(), claimPanel(), alertsPanels(), ordersPanel()); A.innerHTML = parts.join(''); wire(); return; }
    let trades = []; try { trades = await tradesFor(lic.id); } catch (e) { toast('Could not load your trades: ' + e.message, true); }
    if (window.gteLive) {
      const lst = stOf(lic.id), lprobs = problems(lic, lst), td = trades.filter(x => new Date(x.closed_at).toDateString() === new Date().toDateString()).reduce((a, x) => a + x.profit, 0);
      const fs = DEMO ? new URLSearchParams(location.search).get('state') : null;
      parts.push(gteLive.html({l: lic, st: lst, today: td, err: lprobs.find(p => (p.severity === 'error' || p.severity === 'warning') && p.code !== 'HEARTBEAT_MISSING') || null, force: fs, offMin: Number(S.settings.offlineMinutes) || 15, beatMin: Number(S.settings.heartbeatMinutes) || 5, at: Date.now(), R, todayTrades: trades.filter(x => new Date(x.closed_at).toDateString() === new Date().toDateString()), usd, sgn: R.sgn, col: R.col, fill}));
    }
    if (S.licenses.length > 1) parts.push(`<div class="row" style="margin-bottom:6px"><span class="hint">License</span><select id="licSel" class="btn sm" style="background:var(--panel-2);color:var(--fg)">${S.licenses.map(l => `<option value="${l.id}" ${l.id === cur ? 'selected' : ''}>${esc(planOf(l.plan_id).name)} · ${esc(l.key)}</option>`).join('')}</select></div>`);
    const lv = S.settings.latestVersion, cv = stOf(lic.id).ea_version, vc = (x, y) => { const p = String(x).split('.').map(Number), q = String(y).split('.').map(Number); for (let i = 0; i < Math.max(p.length, q.length); i++) { const d = (p[i] || 0) - (q[i] || 0); if (d) return d; } return 0; };
    if (lv && cv && lic.status === 'active' && vc(lv, cv) > 0) parts.push(`<div class="msg" style="border-color:var(--gold);margin-bottom:12px"><b>A new EA version is available: v${esc(lv)}.</b> Your EA reports v${esc(cv)}. ${S.settings.releaseNotes ? esc(S.settings.releaseNotes) + ' ' : ''}<a href="${esc(S.settings.downloadUrl || 'download.html')}">Download the new file</a>, replace the old one in MetaTrader's MQL5 &rarr; Experts folder, and restart MT5. Open trades are not affected.</div>`);
    const nn = unread();
    if (nn && tab !== 'inbox') parts.push(`<div class="msg" style="border-color:var(--blue-hi);margin-bottom:12px"><b>You have ${nn} new notification${nn > 1 ? 's' : ''}.</b> ${esc((S.notices.find(x => !x.read_at) || {}).title || '')} <a href="#tab=inbox" data-go="inbox">Open</a></div>`);
    parts.push(hero(lic, trades));
    parts.push(`<div class="subnav" id="subnav">${TABS.map(([k, n]) => `<a href="#tab=${k}" data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}${k === 'inbox' && unread() ? `<span class="nb">${unread()}</span>` : ''}</a>`).join('')}</div><div id="tabbody"></div>`);
    A.classList.toggle('still', quiet); A.innerHTML = parts.join(''); countUp(A); if (window.gteLive) gteLive.mount();
    const sel = $('#licSel'); if (sel) sel.onchange = e => { cur = e.target.value; render(); };
    A.querySelectorAll('#subnav a').forEach(a => a.onclick = e => { e.preventDefault(); tab = a.dataset.tab; history.replaceState(null, '', '#tab=' + tab); A.querySelectorAll('#subnav a').forEach(x => x.classList.toggle('on', x === a)); drawTab(lic, trades); });
    drawTab(lic, trades);
    const h = location.hash.match(/^#order=(.+)$/); if (h) { const e = document.getElementById('ord-' + h[1]); if (e) e.scrollIntoView({behavior: 'smooth', block: 'start'}); }
  }
  function hero(l, trades) {
    const st = stOf(l.id), pl = planOf(l.plan_id), [pc, pt] = statePill(l.status), s = R.stats(trades);
    const days = l.expires_at ? Math.ceil((new Date(l.expires_at) - Date.now()) / 864e5) : null, pct = days == null ? 0 : Math.max(0, Math.min(100, days / 365 * 100));
    const today = trades.filter(t => new Date(t.closed_at).toDateString() === new Date().toDateString()).reduce((a, t) => a + t.profit, 0);
    const week = trades.filter(t => new Date(t.closed_at).getTime() >= Date.now() - 7 * 864e5).reduce((a, t) => a + t.profit, 0);
    const online = l.status === 'active' ? (st.online ? 'on' : 'off') : '';
    const fl = (st.equity != null && st.balance != null) ? st.equity - st.balance : null;
    return `<div class="hero">
      <div class="hero-l">
        <div class="row"><span class="plan-chip">${esc(pl.name)}</span><span class="pill ${pc}">${pt}</span><span class="pill ${l.bound_is_demo ? 'info' : ''}">${l.bound_account ? (l.bound_is_demo ? 'Demo account' : 'Real account') : 'Not bound'}</span></div>
        <div class="eyebrow">EQUITY</div>
        <div class="eqbig"${st.equity != null ? ` data-cu="${st.equity}" data-f="usd"` : ''}>${st.equity != null ? usd(st.equity) : '-'}</div>
        <div class="hint">Balance ${st.balance != null ? usd(st.balance) : '-'}${fl != null ? ' · Floating <b style="color:' + R.col(fl) + '">' + R.sgn(fl) + '</b>' : ''} · ${st.open_positions ?? 0} open position${(st.open_positions ?? 0) === 1 ? '' : 's'}</div>
        <div class="live"><span class="dot2 ${online}"></span> ${l.status !== 'active' ? 'EA not running' : st.online ? esc(prettyState(st.engine_state)) : 'EA offline'}<span class="hint"> · ${st.last_heartbeat ? 'last report ' + ago(st.last_heartbeat) : 'no report yet'}${st.ea_version ? ' · v' + esc(st.ea_version) : ''}</span></div>
        ${R.spark(R.curve(trades).map(p => p.c), '#3EE09A', 54)}
      </div>
      <div class="hero-r">
        <div class="tile"><div class="l">Today (closed)</div><div class="v" style="color:${R.col(today)}" data-cu="${today}" data-f="sgn">${R.sgn(today)}</div></div>
        <div class="tile"><div class="l">Last 7 days</div><div class="v" style="color:${R.col(week)}" data-cu="${week}" data-f="sgn">${R.sgn(week)}</div></div>
        <div class="tile"><div class="l">Net result · all time</div><div class="v" style="color:${R.col(s.net)}"${s.n ? ` data-cu="${s.net}" data-f="sgn"` : ''}>${s.n ? R.sgn(s.net) : '-'}</div><div class="s">${s.n} closed trades</div></div>
        <div class="tile"><div class="l">Win rate</div><div class="v"${s.n ? ` data-cu="${s.win}" data-f="pct"` : ''}>${s.n ? s.win.toFixed(0) + '%' : '-'}</div><div class="s">${s.pf == null ? '' : 'Profit factor ' + s.pf.toFixed(2)}</div></div>
      </div>
      <div class="hero-f">
        <div class="row"><span class="key" id="k-${l.id}">${esc(l.key)}</span><button class="btn sm" data-copy="${esc(l.key)}">Copy</button><a class="btn sm" href="download.html">Download EA</a></div>
        <div class="yr"><div class="row sp"><span class="hint">${days != null ? (days >= 0 ? 'License valid until <b>' + date(l.expires_at) + '</b>' : 'Expired on ' + date(l.expires_at)) : 'The year starts when you first attach the key'}</span><span class="hint">${days != null && days >= 0 ? days + ' days left' : ''}</span></div><div class="meter ${days != null && days <= 30 ? 'warn' : ''}"><i style="width:${pct}%"></i></div></div>
      </div></div>`;
  }
  function drawTab(lic, trades) {
    const body = $('#tabbody'); if (!body) return;
    A.classList.toggle('still', quiet);
    body.innerHTML = ({overview: tOverview, results: tResults, trades: tTrades, inbox: tInbox, alerts: () => alertsPanels(), billing: tBilling}[tab] || tOverview)(lic, trades);
    wire(); afterDraw(lic, trades); countUp(body);
    if (tab === 'inbox' && unread() && !DEMO && !AS) markRead();
  }
  function keysPanel(cur) {
    if (!S.licenses.length) return '';
    return `<div class="panel"><h2>Your license keys</h2><p class="sub">Each key works on one MT5 account. Paste a key into the EA's only setting.</p>
      <div style="overflow-x:auto"><table class="tbl2"><tr><th>Key</th><th>Plan</th><th>Status</th><th>MT5 account</th><th>Valid until</th><th></th></tr>
      ${S.licenses.map(l => { const [pc, pt] = statePill(l.status); return `<tr><td><span class="key" style="font-size:.85rem;padding:3px 7px">${esc(l.key)}</span> <button class="btn sm" data-copy="${esc(l.key)}">Copy</button></td><td>${esc(planOf(l.plan_id).name)}</td><td><span class="pill ${pc}">${pt}</span></td><td>${l.bound_account ? esc(l.bound_account) + (l.bound_is_demo ? ' (demo)' : '') : 'Not used yet'}</td><td>${l.expires_at ? date(l.expires_at) : 'Starts when first used'}</td><td>${l.id === cur ? '<span class="hint">shown above</span>' : `<button class="btn sm" data-lic="${l.id}">View</button>`}</td></tr>`; }).join('')}</table></div></div>`;
  }
  function tOverview(l, trades) {
    const st = stOf(l.id), pl = planOf(l.plan_id), probs = problems(l, st);
    const tol = S.settings.toleranceActive ?? 5, lim = pl.limit_usd, allowed = lim == null ? null : lim * (1 + tol / 100) + Number(l.extra_allowance_usd || 0);
    const funded = Number(st.funded_usd || 0), pct = allowed ? Math.min(100, funded / allowed * 100) : 0, mark = allowed ? Math.min(100, lim / allowed * 100) : 0, over = st.over_limit, near = allowed && funded > lim * 0.9;
    const recent = trades.slice().sort((a, b) => new Date(b.closed_at) - new Date(a.closed_at)).slice(0, 6);
    return `${S.licenses.length > 1 ? keysPanel(l.id) : ''}<div class="grid2">
      <div class="panel"><h2>Status</h2><p class="sub">What the EA reports for this license.</p>
        ${probs.length ? '<div class="prob">' + probs.map(p => `<div class="it ${p.severity}"><div class="t">${esc(p.title)}</div><div class="e">${esc(fill(p.explanation))}</div><div class="s">What to do: ${esc(fill(p.solution))}</div></div>`).join('') + '</div>' : '<div class="allgood">&#10003; Everything looks good. No problems reported.</div>'}</div>
      <div class="panel"><h2>Account &amp; limit</h2><p class="sub">The account this key is bound to.</p>
        <div class="kv"><span>MT5 account</span><b>${l.bound_account ? esc(l.bound_account) : 'Not bound yet'}</b></div>
        <div class="kv"><span>Broker</span><b>${esc(l.bound_broker || '-')}</b></div>
        <div class="kv"><span>Plan covers</span><b>${lim == null ? 'No deposit limit' : usd(lim, 0)}</b></div>
        <div class="kv"><span>Deposited minus withdrawn</span><b>${usd(funded)}</b></div>
        ${lim == null ? '' : `<div class="meter ${over ? 'bad' : near ? 'warn' : ''}"><i style="width:${pct}%"></i><b style="left:${mark}%"></b></div><div class="hint">Limit ${usd(lim, 0)} + ${tol}% tolerance${Number(l.extra_allowance_usd) ? ' + ' + usd(l.extra_allowance_usd, 0) + ' allowance' : ''}. Profits never count.</div>`}
        ${over ? '<div class="msg err" style="margin-top:12px">Deposits are above your plan. New trades are paused until you upgrade or withdraw the excess. Open trades keep being managed.</div><div class="row" style="margin-top:10px"><a class="btn sm mint" href="#tab=billing" data-go="billing">Upgrade plan</a></div>' : ''}</div></div>
      <div class="panel"><div class="row sp"><div><h2>Equity curve</h2><p class="sub" style="margin:0">Cumulative net result of closed trades.</p></div><a class="btn sm" href="#tab=results" data-go="results">All charts</a></div><div id="ov-eq"></div></div>
      <div class="panel"><div class="row sp"><div><h2>Recent trades</h2><p class="sub" style="margin:0">Times in your local time.</p></div><a class="btn sm" href="#tab=trades" data-go="trades">All trades</a></div>
        ${recent.length ? `<div style="overflow-x:auto"><table class="tbl2"><tr><th>Closed</th><th>Engine</th><th>Side</th><th>Lots</th><th>Open</th><th>Close</th><th>Held</th><th>Result</th></tr>${R.tradeRows(recent)}</table></div>` : '<div class="empty">The EA has not closed a trade on this account yet. Charts and history appear here automatically.</div>'}</div>
      ${trades.length ? `<div class="panel"><div class="row sp"><div><h2>Last 14 days</h2><p class="sub" style="margin:0">Result per day, amounts in USD.</p></div><a class="btn sm" href="#tab=results" data-go="results">Profit calendar</a></div>${R.bars(R.dayItems(trades, 14), 190)}</div>
      <div class="panel"><h2>By engine</h2><p class="sub">Which part of the strategy earned what.</p>${R.engineBars(trades)}</div>` : ''}`;
  }
  function rangeTabs() { return `<div class="tabsx" id="rs-tabs">${[['1m', '1 month'], ['3m', '3 months'], ['all', 'All']].map(([k, n]) => `<a href="#" data-r="${k}" class="${k === range ? 'on' : ''}">${n}</a>`).join('')}</div>`; }
  function tResults(l, all) {
    if (!all.length) return `<div class="panel"><h2>Results</h2><div class="empty">Charts appear here after the EA closes its first trade on your account.</div></div>`;
    const t = inRange(all, range), s = R.stats(t), k = (lab, v, sub, clr, cu, f) => `<div class="tile"><div class="l">${lab}</div><div class="v"${clr ? ` style="color:${clr}"` : ''}${cu != null ? ` data-cu="${cu}" data-f="${f}"` : ''}>${v}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
    if (!calM) { const n = new Date(); calM = {y: n.getFullYear(), m: n.getMonth()}; }
    const dayTot = {}; t.forEach(x => { const d = new Date(x.closed_at).toDateString(); dayTot[d] = (dayTot[d] || 0) + x.profit; });
    const dv = Object.entries(dayTot), bestD = dv.length ? dv.reduce((a, b) => b[1] > a[1] ? b : a) : null, worstD = dv.length ? dv.reduce((a, b) => b[1] < a[1] ? b : a) : null;
    const dshort = d => new Date(d).toLocaleDateString([], {month: 'short', day: 'numeric'});
    const stk = s.streak > 0 ? s.streak + ' win' + (s.streak > 1 ? 's' : '') + ' in a row' : s.streak < 0 ? -s.streak + ' loss' + (s.streak < -1 ? 'es' : '') + ' in a row' : '-';
    return `<div class="panel"><div class="row sp"><div><h2>Results</h2><p class="sub" style="margin:0">Closed trades recorded by the EA on your account. Source: your own trade records. Times in your local time.</p></div>${rangeTabs()}</div>
      <div class="tiles">${k('Net result', s.n ? R.sgn(s.net) : '-', s.n + ' closed trades' + R.spark(R.curve(t).map(p => p.c), s.net >= 0 ? '#3EE09A' : '#FF6B78', 26), R.col(s.net), s.n ? s.net : null, 'sgn')}${k('Win rate', s.win.toFixed(0) + '%', s.wins + ' wins · ' + s.losses + ' losses', '', s.win, 'pct')}${k('Profit factor', s.pf == null ? '-' : s.pf.toFixed(2), 'gross profit / gross loss', '', s.pf, 'dec')}${k('Largest drawdown', usd(s.maxDD, 2), 'below a result peak', 'var(--red)', s.maxDD, 'usd')}
        ${k('Average win', R.sgn(s.avgWin), 'per winning trade', 'var(--mint)', s.avgWin, 'sgn')}${k('Average loss', R.sgn(s.avgLoss), 'per losing trade', 'var(--red)', s.avgLoss, 'sgn')}${k('Best trade', R.sgn(s.best), '', 'var(--mint)', s.best, 'sgn')}${k('Worst trade', R.sgn(s.worst), '', 'var(--red)', s.worst, 'sgn')}
        ${k('Expectancy', R.sgn(s.expectancy), 'average result per trade', R.col(s.expectancy), s.expectancy, 'sgn')}${k('Payoff ratio', s.payoff == null ? '-' : s.payoff.toFixed(2), 'average win / average loss', '', s.payoff, 'dec')}
        ${k('Best day', bestD ? R.sgn(bestD[1]) : '-', bestD ? dshort(bestD[0]) : '', 'var(--mint)', bestD ? bestD[1] : null, 'sgn')}${k('Worst day', worstD ? R.sgn(worstD[1]) : '-', worstD ? dshort(worstD[0]) : '', worstD && worstD[1] < 0 ? 'var(--red)' : '', worstD ? worstD[1] : null, 'sgn')}</div></div>
      <div class="grid2"><div class="panel"><h3 class="rh" style="margin-top:0">Wins and losses</h3><div class="winbox">${R.donut(s.wins, s.losses)}
          <div class="wfacts"><div class="kv"><span>Winning trades</span><b style="color:var(--mint)">${s.wins}</b></div><div class="kv"><span>Losing trades</span><b style="color:var(--red)">${s.losses}</b></div><div class="kv"><span>Longest win streak</span><b>${s.maxWinStreak}</b></div><div class="kv"><span>Longest loss streak</span><b>${s.maxLossStreak}</b></div><div class="kv"><span>Right now</span><b>${stk}</b></div><div class="kv"><span>Average time in a trade</span><b>${s.avgHold == null ? '-' : R.fmtMin(s.avgHold)}</b></div></div></div></div>
        <div class="panel"><h3 class="rh" style="margin-top:0">By engine</h3>${R.engineBars(t)}</div></div>
      <div class="panel"><h3 class="rh" style="margin-top:0">Equity curve <span class="hint">hover to read a point</span></h3><div id="rs-eq"></div></div>
      <div class="panel"><h3 class="rh" style="margin-top:0">Drawdown <span class="hint">distance below the highest result so far</span></h3><div id="rs-dd"></div></div>
      <div class="panel"><h3 class="rh" style="margin-top:0">Profit calendar <span class="hint">result of each day, by closing time</span></h3><div id="calhost">${R.calendar(all, calM.y, calM.m)}</div></div>
      <div class="panel"><h3 class="rh" style="margin-top:0">Daily result <span class="hint">last 30 days, amounts in USD</span></h3>${R.bars(R.dayItems(all, 30), 210)}</div>
      <div class="panel"><h3 class="rh" style="margin-top:0">By weekday <span class="hint">closing day</span></h3>${R.weekdayBars(t)}</div>
      <div class="panel"><h3 class="rh" style="margin-top:0">Monthly result</h3>${R.bars(R.monthItems(t), 230, {full: true})}<p class="fine">Past results do not guarantee future results. Gold trading carries a high risk of loss. See the <a href="risk.html">risk disclaimer</a>.</p></div>`;
  }
  function tInbox() {
    const list = S.notices || [];
    return `<div class="panel"><div class="row sp"><div><h2>Notifications</h2><p class="sub" style="margin:0">Important messages about your license, deposits, orders and EA updates. Trade alerts go to Telegram.</p></div></div>
      ${list.length ? list.map(n => `<div class="nt ${n.read_at ? '' : 'new'}"><div class="row sp"><b>${esc(n.title)}</b><span class="hint">${ago(n.created_at)}</span></div>${n.body ? `<div class="nb2">${esc(n.body).replace(/\n/g, '<br>')}</div>` : ''}${n.link ? `<a class="btn sm" href="${esc(n.link)}" style="margin-top:8px">${n.kind === 'update' ? 'Download the update' : 'Open'}</a>` : ''}${/^A license key was added/.test(n.title) ? '<a class="btn sm mint" href="#tab=billing" data-go="billing" style="margin-top:8px">See your keys</a>' : ''}</div>`).join('') : '<div class="empty">No notifications yet. Important messages appear here.</div>'}</div>`;
  }
  function tTrades(l, all) {
    if (!all.length) return `<div class="panel"><h2>Trades</h2><div class="empty">No closed trades yet.</div></div>`;
    let t = all.slice().sort((a, b) => new Date(b.closed_at) - new Date(a.closed_at));
    if (tflt.eng !== 'all') t = t.filter(x => x.engine === tflt.eng);
    if (tflt.res === 'win') t = t.filter(x => x.profit > 0);
    if (tflt.res === 'loss') t = t.filter(x => x.profit < 0);
    const per = 25, pages = Math.max(1, Math.ceil(t.length / per)); tflt.page = Math.min(tflt.page, pages);
    const sel = (id, opts, cur) => `<select id="${id}" class="btn sm" style="background:var(--panel-2);color:var(--fg)">${opts.map(([v, n]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    return `<div class="panel"><div class="row sp"><div><h2>Trade history</h2><p class="sub" style="margin:0">${t.length} of ${all.length} closed trades. Times in your local time.</p></div>
      <div class="row">${sel('f-eng', [['all', 'All engines'], ['M', 'Alpha'], ['I', 'Beta'], ['D', 'Gamma']], tflt.eng)}${sel('f-res', [['all', 'Wins and losses'], ['win', 'Wins'], ['loss', 'Losses']], tflt.res)}</div></div>
      <div style="overflow-x:auto;margin-top:10px"><table class="tbl2"><tr><th>Closed</th><th>Engine</th><th>Side</th><th>Lots</th><th>Open</th><th>Close</th><th>Held</th><th>Result</th></tr>${R.tradeRows(t.slice((tflt.page - 1) * per, tflt.page * per)) || '<tr><td colspan="8" class="hint">No trades match.</td></tr>'}</table></div>
      <div class="row sp" style="margin-top:12px"><button class="btn sm" id="pg-prev" ${tflt.page <= 1 ? 'disabled' : ''}>Previous</button><span class="hint">Page ${tflt.page} of ${pages}</span><button class="btn sm" id="pg-next" ${tflt.page >= pages ? 'disabled' : ''}>Next</button></div></div>`;
  }
  function tBilling(l) {
    const pl = planOf(l.plan_id), higher = S.plans.filter(p => p.active && Number(p.price_usd) > Number(pl.price_usd)), days = l.expires_at ? Math.ceil((new Date(l.expires_at) - Date.now()) / 864e5) : null;
    return `${keysPanel(l.id)}<div class="panel"><h2>Upgrade or renew</h2><p class="sub">Upgrading costs the price difference and keeps your expiry date. Renewing adds a year. Payments are confirmed by us, usually within a few hours.</p>
      <div class="row">${higher.length ? `<select id="up-${l.id}" class="btn sm" style="background:var(--panel-2);color:var(--fg)">${higher.map(p => `<option value="${p.id}">Upgrade to ${esc(p.name)} (+${usd(Number(p.price_usd) - Number(pl.price_usd))})</option>`).join('')}</select><button class="btn sm mint" data-upgrade="${l.id}">Upgrade</button>` : '<span class="hint">You are on the highest plan.</span>'}
      <button class="btn sm ${days != null && (days <= 45 || l.status === 'expired') ? 'mint' : ''}" data-renew="${l.id}">Renew for ${usd(pl.price_usd)}</button></div></div>
      ${claimPanel()}
      <div class="panel"><h2>Move this key to another account</h2><p class="sub">A key is bound to the first MT5 account it was used on, demo or real. Moving it is not self-service: it costs <b>${usd(S.settings.unbindFeeUsd ?? 100)}</b>. Start a request, pay the fee, then <b>contact support</b> on Telegram (<a href="${esc(S.settings.supportUrl || 'https://t.me/GoldTriEngine_Support')}" rel="noopener">@GoldTriEngine_Support</a>) and we unbind the key.</p>
        ${l.bound_account ? `<button class="btn sm danger" data-unbind="${l.id}">Start unbind request (${usd(S.settings.unbindFeeUsd ?? 100)})</button>` : '<span class="hint">This key is not bound yet, so there is nothing to move.</span>'}</div>
      ${ordersPanel()}`;
  }
  function afterDraw(l, all) {
    const t = inRange(all, range), cv = R.curve(t), cvAll = R.curve(all);
    for (const [host, key, color, neg, pts] of [['ov-eq', 'c', '#3EE09A', false, cvAll], ['rs-eq', 'c', '#3EE09A', false, cv], ['rs-dd', 'dd', '#FF6B78', true, cv]]) {
      const el = document.getElementById(host); if (!el) continue;
      el.innerHTML = R.lineChart(host + 'c', pts, key, color, neg); R.bindHover(el, host + 'c', pts, key, neg);
    }
    const calHost = document.getElementById('calhost');
    if (calHost) calHost.onclick = e => {
      const b = e.target.closest('[data-cal]'); if (!b || b.disabled) return;
      const d = new Date(calM.y, calM.m + (+b.dataset.cal), 1); calM = {y: d.getFullYear(), m: d.getMonth()};
      calHost.innerHTML = R.calendar(all, calM.y, calM.m);
    };
    A.querySelectorAll('#rs-tabs a').forEach(a => a.onclick = e => { e.preventDefault(); range = a.dataset.r; drawTab(l, all); });
    const fe = $('#f-eng'), fr = $('#f-res');
    if (fe) fe.onchange = () => { tflt.eng = fe.value; tflt.page = 1; drawTab(l, all); };
    if (fr) fr.onchange = () => { tflt.res = fr.value; tflt.page = 1; drawTab(l, all); };
    const pp = $('#pg-prev'), pn = $('#pg-next');
    if (pp) pp.onclick = () => { tflt.page--; drawTab(l, all); };
    if (pn) pn.onclick = () => { tflt.page++; drawTab(l, all); };
    A.querySelectorAll('[data-go]').forEach(a => a.onclick = e => { e.preventDefault(); tab = a.dataset.go; history.replaceState(null, '', '#tab=' + tab); A.querySelectorAll('#subnav a').forEach(x => x.classList.toggle('on', x.dataset.tab === tab)); drawTab(l, all); });
  }

  async function markRead() {
    const now = new Date().toISOString();
    try { const {error} = await c.from('customer_notices').update({read_at: now}).is('read_at', null); if (error) throw error; } catch (e) { return; }
    setTimeout(() => { (S.notices || []).forEach(n => { if (!n.read_at) n.read_at = now; }); const b = A.querySelector('#subnav [data-tab="inbox"] .nb'); if (b) b.remove(); }, 2500);
  }
  function emptyPanel() { return `<div class="panel"><h2>You don't have a license yet</h2><p class="sub">Choose a plan by the account size you trade. If we sent you a key, add it below.</p><a class="btn mint" href="pricing.html">See plans</a></div>`; }
  function orderPanel(o) {
    const pl = planOf(o.plan_id), kind = {purchase: 'New license', renewal: 'Renewal', upgrade: 'Upgrade', unbind: 'Unbind fee'}[o.kind], claimed = o.status === 'paid_claimed';
    return `<div class="paybox"><div class="row sp"><div><b>Order ${esc(o.ref)}</b> <span class="hint">${esc(kind)} · ${esc(pl.name || '')}</span></div><span class="pill ${claimed ? 'warn' : 'info'}">${claimed ? 'Confirming payment' : 'Waiting for payment'}</span></div>
      <div class="amt" style="margin:10px 0">${usd(o.amount_usd)} <span class="hint">USD</span></div>
      <div id="pay-${o.id}"><span class="hint">Loading payment details...</span></div>
      ${claimed ? '<p class="hint">Thanks. We are confirming your payment. Your key appears here and on Telegram once it is confirmed.</p>'
      : `<div class="f" style="margin-top:14px"><label for="pr-${o.id}">After paying, enter your transaction ID or a note</label><input id="pr-${o.id}" placeholder="Transaction ID / reference"><div class="row"><button class="btn mint" data-paid="${o.id}">I have paid</button></div></div>`}
      ${o.kind === 'unbind' ? '<p class="fine"><b>Next:</b> after paying, contact support on Telegram so we can unbind the key.</p>' : ''}</div>`;
  }
  function alertsPanels() { return telegramPanel() + (!AS && window.gteDevice ? gteDevice.html() : ''); }
  function telegramPanel() {
    const on = !!S.profile.telegram_chat_id, prefs = S.profile.notify_prefs || {};
    return `<div class="panel"><div class="row sp"><div><h2>Telegram notifications</h2><p class="sub" style="margin:0">Trades, daily report, offline alerts and license warnings on your phone.</p></div><span class="pill ${on ? 'ok' : 'warn'}">${on ? 'Connected' : 'Not connected'}</span></div>
      ${on ? `<div style="margin-top:12px">${NOTIFY.map(([k, label]) => `<div class="tog"><span>${label}</span><label class="sw"><input type="checkbox" data-pref="${k}" ${prefs[k] === false || prefs[k] === 'false' ? '' : 'checked'}><span></span></label></div>`).join('')}
        <p class="hint" style="margin-top:10px">License and deposit-limit warnings are always sent.</p><button class="btn sm danger" id="tgOff" style="margin-top:8px">Disconnect Telegram</button></div>`
      : '<div class="row" style="margin-top:14px"><button class="btn mint" id="tgOn">Connect Telegram</button><span class="hint" id="tgHint">Opens Telegram. Tap Start in the bot.</span></div>'}</div>`;
  }
  function claimPanel() { return `<div class="panel"><h2>Add a license key</h2><p class="sub">If we gave you a key (a gift or a manual sale), add it to your account here.</p><div class="f"><input id="ck" placeholder="GTE-XXXX-XXXX-XXXX" autocapitalize="characters"><button class="btn" id="ckGo">Add key</button></div></div>`; }
  function ordersPanel() {
    if (!S.orders.length) return '';
    return `<div class="panel"><h2>Orders</h2><div style="overflow-x:auto"><table class="tbl2"><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>${S.orders.map(o => `<tr><td class="key" style="font-size:.85rem;padding:2px 6px">${esc(o.ref)}</td><td>${esc(o.kind)}</td><td>${usd(o.amount_usd)}</td><td>${esc(o.status.replace('_', ' '))}</td><td>${date(o.created_at)}</td></tr>`).join('')}</table></div></div>`;
  }
  function addrHtml(d) {
    if (!d.address) return '';
    return `<div style="margin:6px 0 14px"><div class="hint">Send to this address (${esc(d.network || '')})</div>
      <div class="row" style="margin-top:6px"><span class="key" style="font-size:.88rem;word-break:break-all;line-height:1.4">${esc(d.address)}</span><button class="btn sm" data-copy="${esc(d.address)}">Copy address</button></div>
      <div class="row" style="margin-top:12px;align-items:flex-start"><div style="background:#fff;padding:8px;border-radius:10px;width:fit-content" data-qr="${esc(d.address)}"></div>
      <div class="hint" style="max-width:26rem">Scan with your wallet or exchange app. Check that the network is <b>${esc(d.network || '')}</b>: coins sent on another network can be lost.</div></div></div>`;
  }
  async function drawQr(el) {
    const q = el.querySelector('[data-qr]'); if (!q || q.dataset.done) return;
    if (!window.QRCode) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }).catch(() => {});
    if (window.QRCode) { q.dataset.done = '1'; new QRCode(q, {text: q.dataset.qr, width: 150, height: 150}); }
    el.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); });
  }

  // ---------- actions ----------
  function wire() {
    A.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); });
    A.querySelectorAll('[data-lic]').forEach(b => b.onclick = () => { cur = b.dataset.lic; tab = 'overview'; history.replaceState(null, '', '#tab=overview'); render(); window.scrollTo({top: 0, behavior: 'smooth'}); });
    A.querySelectorAll('[data-upgrade]').forEach(b => b.onclick = guard(async () => { const o = await rpc('create_order', {p_kind: 'upgrade', p_plan_id: $('#up-' + b.dataset.upgrade).value, p_license_id: b.dataset.upgrade}); await refresh('#order=' + o.id); }));
    A.querySelectorAll('[data-renew]').forEach(b => b.onclick = guard(async () => { const o = await rpc('create_order', {p_kind: 'renewal', p_license_id: b.dataset.renew}); await refresh('#order=' + o.id); }));
    A.querySelectorAll('[data-unbind]').forEach(b => b.onclick = guard(async () => { if (!confirm('Unbinding costs ' + usd(S.settings.unbindFeeUsd ?? 100) + ' and needs support. Start the request?')) return; const o = await rpc('create_order', {p_kind: 'unbind', p_license_id: b.dataset.unbind}); await refresh('#order=' + o.id); }));
    A.querySelectorAll('[data-paid]').forEach(b => b.onclick = guard(async () => { const v = $('#pr-' + b.dataset.paid).value.trim(); if (!v) return toast('Enter your transaction ID or a short note', true); await rpc('claim_payment', {p_order: b.dataset.paid, p_paid_ref: v}); toast('Thank you. We will confirm your payment shortly.'); await refresh(); }));
    A.querySelectorAll('[id^="pay-"]').forEach(async el => {
      if (el.dataset.done) return; el.dataset.done = '1'; const id = el.id.slice(4);
      try {
        const d = DEMO ? {instructions: 'Payment instructions appear here.', link: '', network: 'USDT on TRON (TRC20)', address: 'TDemoAddressOnlyForThePreview000000'} : await rpc('get_payment_details', {p_order: id}), o = S.orders.find(x => x.id === id);
        el.innerHTML = addrHtml(d) + (d.instructions ? '<div style="white-space:pre-wrap">' + esc(d.instructions) + '</div>' : (d.address ? '' : '<span class="hint">Payment details will be shown here. If nothing appears, contact support.</span>')) + (d.link ? `<div class="row" style="margin-top:10px"><a class="btn sm mint" href="${esc(d.link)}" rel="noopener" target="_blank">Open payment link</a></div>` : '') + `<p class="hint">Send exactly <b>${usd(o?.amount_usd)}</b>. Order reference: <b>${esc(o?.ref)}</b>.</p>`;
        drawQr(el);
      } catch (e) { el.textContent = 'Could not load payment details.'; }
    });
    A.querySelectorAll('[data-pref]').forEach(i => i.onchange = guard(async () => { if (AS) { i.checked = !i.checked; throw new Error('Read-only admin view.'); } if (DEMO) return; const prefs = {...(S.profile.notify_prefs || {})}; prefs[i.dataset.pref] = i.checked; const {error} = await c.from('profiles').update({notify_prefs: prefs}).eq('user_id', (await gte.session()).user.id); if (error) throw error; S.profile.notify_prefs = prefs; toast('Saved'); }));
    const on = $('#tgOn'); if (on) on.onclick = guard(async () => {
      const bot = S.settings.botUsername || 'GoldTriEngine_Bot'; const tok = DEMO ? 'demo' : await rpc('create_telegram_link');
      window.open('https://t.me/' + bot + '?start=' + tok, '_blank', 'noopener'); $('#tgHint').textContent = 'Waiting for you to tap Start in Telegram...';
      for (let i = 0; i < 40 && !DEMO; i++) { await new Promise(r => setTimeout(r, 3000)); const {data} = await c.from('profiles').select('telegram_chat_id').maybeSingle(); if (data && data.telegram_chat_id) { await refresh(); toast('Telegram connected'); return; } }
    });
    const off = $('#tgOff'); if (off) off.onclick = guard(async () => { await rpc('disconnect_telegram'); await refresh(); });
    if (!AS && window.gteDevice) gteDevice.wire(rpc, toast, guard);
    const go = $('#ckGo'); if (go) go.onclick = guard(async () => { const k = $('#ck').value.trim(); if (!k) return; await rpc('claim_license', {p_key: k}); toast('Key added'); await refresh(); });
  }
  function resizeSquare(f, s) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(f);
      img.onload = () => { const m = Math.min(img.width, img.height), cv = document.createElement('canvas'); cv.width = cv.height = s; cv.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s); URL.revokeObjectURL(u); res(cv.toDataURL('image/jpeg', .85)); };
      img.onerror = () => rej(new Error('Could not read that image.')); img.src = u;
    });
  }
  async function initAvatar() {
    const av = $('#maav'), btn = $('#maavb'), file = $('#avf'), rm = $('#marm'); if (!av || !btn || !file) return;
    const show = u => { av.classList.toggle('has-img', !!u); av.style.backgroundImage = u ? 'url(' + u + ')' : ''; if (rm) rm.hidden = !u; };
    let cur = null, nm = '', em = (($('#who') || {}).textContent || '');
    const paintName = () => {
      const w = $('#who'), e2 = $('#whoe'), k = $('#hello'), ed = $('#maed'); if (!w) return;
      w.textContent = nm || em; const nr = $('#manm'); if (nr) nr.classList.toggle('noname', !nm); if (e2) e2.textContent = nm ? em : ''; if (k) k.hidden = !!nm;
      if (ed) { ed.classList.toggle('add', !nm); ed.querySelector('span').textContent = nm ? '' : 'Add your name'; ed.title = nm ? 'Edit name' : 'Add your name'; ed.hidden = AS; }
    };
    const wireName = () => {
      const ed = $('#maed'), form = $('#maform'), inp = $('#mani'), row = $('#manm'), no = $('#manc'); if (!ed || !form) return;
      const open = () => { row.hidden = true; form.hidden = false; $('#whoe').hidden = true; inp.value = nm; inp.focus(); inp.select(); };
      const close = () => { form.hidden = true; row.hidden = false; $('#whoe').hidden = false; };
      ed.onclick = open; no.onclick = close;
      inp.onkeydown = e => { if (e.key === 'Escape') close(); };
      form.onsubmit = guard(async e => {
        e.preventDefault(); const v = inp.value.replace(/\s+/g, ' ').trim();
        if (v.length < 2) throw new Error('Enter at least 2 characters.');
        if (v === nm) return close();
        if (DEMO) { try { localStorage.setItem('gte_demo_name', v); } catch (x) {} } else await rpc('set_full_name', {p_name: v});
        nm = v; paintName(); close(); toast('Name saved');
      });
    };
    if (DEMO) { try { cur = localStorage.getItem('gte_demo_avatar'); } catch (e) {} }
    else if (!AS) {
      try { await c.rpc('sync_profile_identity'); } catch (e) {}
      try {
        const {data} = await c.from('profiles').select('avatar,full_name,picture_url,email').maybeSingle();
        cur = data && (data.avatar || data.picture_url) || null; nm = data && data.full_name || ''; em = data && data.email || em;
      } catch (e) {}
    }
    if (DEMO) { nm = new URLSearchParams(location.search).has('noname') ? '' : (localStorage.getItem('gte_demo_name') || 'Amina Rahman'); em = 'amina@example.com'; }
    paintName();
    if (!AS) wireName();
    show(cur);
    if (AS) { btn.disabled = true; btn.classList.add('ro'); return; }
    btn.onclick = () => file.click();
    window.gteAvatarApi = {pick: () => file.click(), remove: () => rm && rm.onclick && rm.onclick(), has: () => av.classList.contains('has-img')};
    file.onchange = guard(async () => {
      const f = file.files[0]; file.value = ''; if (!f) return;
      if (!/^image\//.test(f.type)) throw new Error('Choose an image file.');
      const url = await resizeSquare(f, 192);
      if (DEMO) { try { localStorage.setItem('gte_demo_avatar', url); } catch (e) {} } else await rpc('set_avatar', {p_data: url});
      show(url); toast('Photo updated');
    });
    if (rm) rm.onclick = guard(async () => { if (DEMO) { try { localStorage.removeItem('gte_demo_avatar'); } catch (e) {} } else await rpc('set_avatar', {p_data: null}); show(null); toast('Photo removed'); });
  }
  async function refresh(hash) { S = await load(); Object.keys(tradeCache).forEach(k => delete tradeCache[k]); if (hash) history.replaceState(null, '', hash); await render(); }

  // ---------- start ----------
  if (INJ) {                                                        // admin panel: wait for the customer's data, then draw the same page the customer sees
    document.body.classList.add('inject'); A.innerHTML = '<div class="empty">Loading customer account...</div>';
    await new Promise(res => { addEventListener('message', e => { if (e.source === window.parent && e.data && e.data.gteAdminView) { window.__inj = e.data; res(); } }); window.parent.postMessage({gteReady: true}, '*'); });
    try { S = await load(); await render(); } catch (e) { A.innerHTML = '<div class="msg err">Could not show this account: ' + esc(e.message || e) + '</div>'; }
    return;
  }
  c = DEMO ? null : await gte.client();
  const sess = DEMO ? {user: {email: 'amina@example.com'}} : await gte.session();
  if (!sess) { $('#gate').classList.remove('hide'); return; }
  $('#who').textContent = sess.user.email || '';
  $('#out').onclick = async () => { if (!DEMO) await c.auth.signOut(); location.href = 'index.html'; };
  try { S = await load(); } catch (e) { A.innerHTML = '<div class="msg err">Could not load your account: ' + esc(e.message || e) + '</div>'; return; }
  await render();
  initAvatar();
  (async () => {                                              // first-visit source from the sign-in link (new accounts only; the database ignores everyone else)
    if (DEMO || AS) return;
    try {
      const u = new URL(location.href), fs = u.searchParams.get('fs'); if (!fs) return;
      const o = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(fs)))));
      await c.rpc('record_first_touch', {p_src: o.s || '', p_medium: o.m || '', p_campaign: o.c || '', p_ref: o.r === undefined ? (o.ref || '') : o.r, p_landing: o.l || ''});
      u.searchParams.delete('fs'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) {}
  })();
  const sigNow = () => JSON.stringify([S.licenses, (S.statuses || []).map(s => { const {last_heartbeat, ...r} = s; return r; }), S.notices, S.orders, S.profile, S.settings]);
  if (!DEMO) setInterval(async () => {
    const ae = document.activeElement; if (document.hidden || (ae && /INPUT|SELECT|TEXTAREA/.test(ae.tagName))) return;
    quiet = true;
    try {
      const before = sigNow(), n0 = (tradeCache[cur] || {rows: []}).rows.length;
      S = await load(); const n1 = cur ? (await tradesFor(cur)).length : 0;
      if (sigNow() === before && n1 === n0) { if (window.gteLive) gteLive.refresh(stOf(cur)); }       // nothing changed: only the live card moves, no rebuild, no lag
      else await render();
    } catch (e) {} finally { quiet = false; }
  }, 60000);
})();
