/* My account page. Reads only the signed-in customer's own rows (enforced by database row-level security). */
(async function () {
  const {esc, usd, date, ago, DEMO} = gte, $ = s => document.querySelector(s), A = $('#acct');
  let c, S = {};            // client, state
  const NOTIFY = [['ea_started', 'EA started / stopped'], ['trade_open', 'Trade opened'], ['trade_close', 'Trade closed with result'], ['addon', 'Add-on filled / closed'], ['daily_report', 'Daily report'], ['offline', 'EA offline / back online']];
  const SEV = {error: 0, warning: 1, info: 2};

  // ---------- data ----------
  async function load() {
    if (DEMO) return demoData();
    const q = async (p) => { const r = await p; if (r.error) throw r.error; return r.data; };
    const [profile, licenses, statuses, plans, catalog, orders, settings] = await Promise.all([
      q(c.from('profiles').select('email,telegram_chat_id,notify_prefs').maybeSingle()),
      q(c.from('licenses').select('id,key,plan_id,status,activated_at,expires_at,bound_account,bound_broker,bound_is_demo,extra_allowance_usd,created_at').order('created_at')),
      q(c.from('license_status').select('*')),
      q(c.from('plans').select('*').order('sort')),
      q(c.from('message_catalog').select('*')),
      q(c.from('orders').select('*').order('created_at', {ascending: false})),
      gte.settings()]);
    return {profile, licenses, statuses, plans, catalog, orders, settings};
  }
  async function rpc(fn, args) {
    if (DEMO) { toast('Demo mode: ' + fn); return {id: 'demo', ref: 'GTE-DEMO01', amountUsd: 1700}; }
    const {data, error} = await c.rpc(fn, args || {});
    if (error) throw error;
    return data;
  }
  function demoData() {
    const d = n => new Date(Date.now() + n * 864e5).toISOString();
    return {profile: {email: 'amina@example.com', telegram_chat_id: null, notify_prefs: {}},
      licenses: [{id: '1', key: 'GTE-7QK2-XM9A-D4PF', plan_id: 'investor', status: 'active', activated_at: d(-30), expires_at: d(335), bound_account: 51234567, bound_broker: 'IC Markets', bound_is_demo: false, extra_allowance_usd: 0}],
      statuses: [{license_id: '1', online: true, last_heartbeat: d(-0.002), balance: 6120.4, equity: 6188.9, open_positions: 1, engine_state: 'IN TRADE', funded_usd: 5900, over_limit: true, ea_version: '1.08', problems: ['OVER_LIMIT', 'TELEGRAM_NOT_CONNECTED']}],
      plans: gte.fallbackPlans.map((p, i) => ({...p, sort: i})),
      catalog: [
        {code: 'OVER_LIMIT', severity: 'warning', title: 'Deposits above your plan limit', explanation: 'The money deposited on this account is above your plan size. New trades are paused; open trades are still managed and nothing is closed.', solution: 'Upgrade your plan on your account page, or withdraw the excess. Trading resumes by itself within minutes.'},
        {code: 'TELEGRAM_NOT_CONNECTED', severity: 'info', title: 'Telegram not connected', explanation: 'You will not get notifications on Telegram.', solution: 'Open your account page and tap Connect Telegram.'}],
      orders: [], settings: {salesOpen: true, supportUrl: 'https://t.me/GoldTriEngine_Support', botUsername: 'GoldTriEngine_Bot', unbindFeeUsd: 100, toleranceActive: 5}};
  }

  function toast(t, err) { const e = document.createElement('div'); e.className = 'msg ' + (err ? 'err' : 'ok'); e.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:99;min-width:260px;max-width:92vw'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 4000); }
  const guard = f => async (...a) => { try { await f(...a); } catch (e) { toast(e.message || String(e), true); } };

  // ---------- helpers ----------
  const planOf = id => S.plans.find(p => p.id === id) || {name: id};
  const stOf = id => S.statuses.find(s => s.license_id === id) || {};
  const fill = t => String(t || '').replace('{SUPPORT}', S.settings.supportUrl || 'the support link');
  function problems(l, st) {
    const codes = new Set(st.problems || []);
    if (l.status === 'expired') codes.add('KEY_EXPIRED');
    if (l.status === 'disabled') codes.add('KEY_DISABLED');
    if (l.status === 'unused') codes.add('__unused');
    if (l.status === 'active' && st.online === false) codes.add('HEARTBEAT_MISSING');
    const list = [...codes].map(code => code === '__unused'
      ? {severity: 'info', title: 'Not activated yet', explanation: 'Your key has not been attached to an MT5 account yet.', solution: 'Download the EA, paste this key into its only setting and attach it to a USD MT5 chart. See the setup steps on the Download page.'}
      : S.catalog.find(m => m.code === code)).filter(Boolean);
    return list.sort((a, b) => SEV[a.severity] - SEV[b.severity]);
  }
  const statePill = s => ({active: ['ok', 'Active'], unused: ['info', 'Ready to activate'], expired: ['warn', 'Expired'], disabled: ['bad', 'Disabled']}[s] || ['', s]);

  // ---------- render ----------
  function render() {
    const parts = [];
    for (const o of S.orders.filter(o => o.status === 'pending' || o.status === 'paid_claimed')) parts.push(`<div id="ord-${o.id}">` + orderPanel(o) + '</div>');
    if (!S.licenses.length) parts.push(emptyPanel());
    S.licenses.forEach(l => { parts.push(licensePanel(l)); if (l.status !== 'unused') parts.push(`<div class="panel" id="res-${l.id}"><span class="hint">Loading results...</span></div>`); });
    parts.push(telegramPanel(), claimPanel(), ordersPanel());
    A.innerHTML = parts.join('');
    wire();
    S.licenses.forEach(l => { if (l.status !== 'unused') mountResults(l.id); });
    const h = location.hash.match(/^#order=(.+)$/); if (h) { const e = document.getElementById('ord-' + h[1]); if (e) e.scrollIntoView({behavior: 'smooth', block: 'start'}); }
  }
  function emptyPanel() {
    return `<div class="panel"><h2>You don't have a license yet</h2><p class="sub">Choose a plan by the account size you trade. If we sent you a key, add it below.</p><a class="btn mint" href="pricing.html">See plans</a></div>`;
  }
  function licensePanel(l) {
    const st = stOf(l.id), pl = planOf(l.plan_id), [pc, pt] = statePill(l.status);
    const tol = S.settings.toleranceActive ?? 5, lim = pl.limit_usd, allowed = lim == null ? null : lim * (1 + tol / 100) + Number(l.extra_allowance_usd || 0);
    const funded = Number(st.funded_usd || 0), pct = allowed ? Math.min(100, funded / allowed * 100) : 0, mark = allowed ? Math.min(100, lim / allowed * 100) : 0;
    const over = st.over_limit, near = allowed && funded > lim * 0.9;
    const days = l.expires_at ? Math.ceil((new Date(l.expires_at) - Date.now()) / 864e5) : null;
    const probs = problems(l, st);
    const higher = S.plans.filter(p => p.active && Number(p.price_usd) > Number(pl.price_usd));
    const online = l.status === 'active' ? (st.online ? 'on' : 'off') : '';
    return `<div class="panel" data-lic="${l.id}">
      <div class="row sp"><div><h2>${esc(pl.name)} license</h2><p class="sub" style="margin:0">${days != null ? (days >= 0 ? 'Valid until <b>' + date(l.expires_at) + '</b> (' + days + ' days left)' : 'Expired on ' + date(l.expires_at)) : 'The year starts when you first attach the key'}</p></div><span class="pill ${pc}">${pt}</span></div>
      <div class="row" style="margin:16px 0"><span class="key" id="k-${l.id}">${esc(l.key)}</span><button class="btn sm" data-copy="${esc(l.key)}">Copy</button><a class="btn sm" href="download.html">Download EA</a></div>
      <div class="tiles">
        <div class="tile"><div class="l">MT5 account</div><div class="v" style="font-size:1.1rem">${l.bound_account ? esc(l.bound_account) : 'Not bound yet'}</div><div class="s">${l.bound_account ? esc(l.bound_broker || '') + (l.bound_is_demo ? ' · demo' : ' · real') : 'Binds on first start'}</div></div>
        <div class="tile"><div class="l">EA status</div><div class="v" style="font-size:1.1rem"><span class="dot2 ${online}"></span> ${l.status !== 'active' ? 'Not running' : st.online ? esc(prettyState(st.engine_state)) : 'Offline'}</div><div class="s">${st.last_heartbeat ? 'Last report ' + ago(st.last_heartbeat) : 'No report yet'}${st.ea_version ? ' · v' + esc(st.ea_version) : ''}</div></div>
        <div class="tile"><div class="l">Balance</div><div class="v">${st.balance != null ? usd(st.balance) : '-'}</div><div class="s">Equity ${st.equity != null ? usd(st.equity) : '-'}</div></div>
        <div class="tile"><div class="l">Open positions</div><div class="v">${st.open_positions ?? '-'}</div></div>
      </div>
      <div><div class="row sp"><b>Deposit limit</b><span class="hint">${lim == null ? 'No limit on your plan' : 'Plan covers ' + usd(lim) + ' · tolerance ' + tol + '%' + (Number(l.extra_allowance_usd) ? ' · +' + usd(l.extra_allowance_usd) + ' allowance' : '')}</span></div>
        ${lim == null ? '' : `<div class="meter ${over ? 'bad' : near ? 'warn' : ''}"><i style="width:${pct}%"></i><b style="left:${mark}%"></b></div>
        <div class="row sp"><span class="hint">Deposited minus withdrawn: <b>${usd(funded)}</b></span><span class="hint">Profits never count</span></div>`}
        ${over ? `<div class="msg err" style="margin-top:12px">Your deposits are above your plan. New trades are paused until you upgrade or withdraw the excess. Open trades keep being managed.</div>` : ''}
      </div>
      <h3 style="margin:24px 0 8px;font-size:1.05rem">Status and problems</h3>
      ${probs.length ? '<div class="prob">' + probs.map(p => `<div class="it ${p.severity}"><div class="t">${esc(p.title)}</div><div class="e">${esc(fill(p.explanation))}</div><div class="s">What to do: ${esc(fill(p.solution))}</div></div>`).join('') + '</div>' : '<div class="allgood">&#10003; Everything looks good. No problems reported.</div>'}
      <div class="row" style="margin-top:20px">
        ${higher.length ? `<select id="up-${l.id}" class="btn sm" style="background:var(--panel-2);color:var(--fg)">${higher.map(p => `<option value="${p.id}">Upgrade to ${esc(p.name)} (+${usd(Number(p.price_usd) - Number(pl.price_usd))})</option>`).join('')}</select><button class="btn sm ${over ? 'mint' : ''}" data-upgrade="${l.id}">Upgrade</button>` : ''}
        ${days != null && (days <= 45 || l.status === 'expired') ? `<button class="btn sm mint" data-renew="${l.id}">Renew for ${usd(pl.price_usd)}</button>` : ''}
      </div>
      <details style="margin-top:18px"><summary style="cursor:pointer;color:var(--fg-2)">Move this key to another account</summary>
        <p class="fine" style="margin-top:10px">A key is bound to the first MT5 account it was used on, demo or real. Moving it is not self-service: it costs <b>${usd(S.settings.unbindFeeUsd ?? 100)}</b>. Start a request below, pay the fee, then <b>contact support</b> on Telegram (<a href="${esc(S.settings.supportUrl || 'https://t.me/GoldTriEngine_Support')}" rel="noopener">@GoldTriEngine_Support</a>) and we unbind the key.</p>
        ${l.bound_account ? `<button class="btn sm danger" data-unbind="${l.id}">Start unbind request (${usd(S.settings.unbindFeeUsd ?? 100)})</button>` : '<span class="hint">This key is not bound yet, so there is nothing to move.</span>'}
      </details></div>`;
  }
  function prettyState(s) { s = String(s || ''); if (/^M:/.test(s)) return s.includes('IN') ? 'In trade' : 'Running'; return s ? s[0] + s.slice(1).toLowerCase() : 'Running'; }
  function orderPanel(o) {
    const pl = planOf(o.plan_id), kind = {purchase: 'New license', renewal: 'Renewal', upgrade: 'Upgrade', unbind: 'Unbind fee'}[o.kind];
    const claimed = o.status === 'paid_claimed';
    return `<div class="paybox"><div class="row sp"><div><b>Order ${esc(o.ref)}</b> <span class="hint">${esc(kind)} · ${esc(pl.name || '')}</span></div><span class="pill ${claimed ? 'warn' : 'info'}">${claimed ? 'Confirming payment' : 'Waiting for payment'}</span></div>
      <div class="amt" style="margin:10px 0">${usd(o.amount_usd)} <span class="hint">USD</span></div>
      <div id="pay-${o.id}"><span class="hint">Loading payment details...</span></div>
      ${claimed ? '<p class="hint">Thanks. We are confirming your payment. Your key appears here and on Telegram once it is confirmed.</p>'
      : `<div class="f" style="margin-top:14px"><label for="pr-${o.id}">After paying, enter your transaction ID or a note</label><input id="pr-${o.id}" placeholder="Transaction ID / reference"><div class="row"><button class="btn mint" data-paid="${o.id}">I have paid</button><button class="btn sm" data-cancel="${o.id}" style="display:none">Cancel</button></div></div>`}
      ${o.kind === 'unbind' ? '<p class="fine"><b>Next:</b> after paying, contact support on Telegram so we can unbind the key.</p>' : ''}</div>`;
  }
  function telegramPanel() {
    const on = !!S.profile.telegram_chat_id, prefs = S.profile.notify_prefs || {};
    return `<div class="panel"><div class="row sp"><div><h2>Telegram notifications</h2><p class="sub" style="margin:0">Trades, daily report, offline alerts and license warnings on your phone.</p></div><span class="pill ${on ? 'ok' : 'warn'}">${on ? 'Connected' : 'Not connected'}</span></div>
      ${on ? `<div style="margin-top:12px">${NOTIFY.map(([k, label]) => `<div class="tog"><span>${label}</span><label class="sw"><input type="checkbox" data-pref="${k}" ${prefs[k] === false || prefs[k] === 'false' ? '' : 'checked'}><span></span></label></div>`).join('')}
        <p class="hint" style="margin-top:10px">License and deposit-limit warnings are always sent.</p><button class="btn sm danger" id="tgOff" style="margin-top:8px">Disconnect Telegram</button></div>`
      : '<div class="row" style="margin-top:14px"><button class="btn mint" id="tgOn">Connect Telegram</button><span class="hint" id="tgHint">Opens Telegram. Tap Start in the bot.</span></div>'}</div>`;
  }
  function claimPanel() {
    return `<div class="panel"><h2>Add a license key</h2><p class="sub">If we gave you a key (a gift or a manual sale), add it to your account here.</p><div class="f"><input id="ck" placeholder="GTE-XXXX-XXXX-XXXX" autocapitalize="characters"><button class="btn" id="ckGo">Add key</button></div></div>`;
  }
  function ordersPanel() {
    if (!S.orders.length) return '';
    return `<div class="panel"><h2>Orders</h2><div style="overflow-x:auto"><table class="tbl2"><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>${S.orders.map(o => `<tr><td class="key" style="font-size:.85rem;padding:2px 6px">${esc(o.ref)}</td><td>${esc(o.kind)}</td><td>${usd(o.amount_usd)}</td><td>${esc(o.status.replace('_', ' '))}</td><td>${date(o.created_at)}</td></tr>`).join('')}</table></div></div>`;
  }

  // ---------- actions ----------
  function wire() {
    A.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); toast('Key copied'); });
    A.querySelectorAll('[data-upgrade]').forEach(b => b.onclick = guard(async () => { const o = await rpc('create_order', {p_kind: 'upgrade', p_plan_id: $('#up-' + b.dataset.upgrade).value, p_license_id: b.dataset.upgrade}); await refresh('#order=' + o.id); }));
    A.querySelectorAll('[data-renew]').forEach(b => b.onclick = guard(async () => { const o = await rpc('create_order', {p_kind: 'renewal', p_license_id: b.dataset.renew}); await refresh('#order=' + o.id); }));
    A.querySelectorAll('[data-unbind]').forEach(b => b.onclick = guard(async () => { if (!confirm('Unbinding costs ' + usd(S.settings.unbindFeeUsd ?? 100) + ' and needs support. Start the request?')) return; const o = await rpc('create_order', {p_kind: 'unbind', p_license_id: b.dataset.unbind}); await refresh('#order=' + o.id); }));
    A.querySelectorAll('[data-paid]').forEach(b => b.onclick = guard(async () => { const v = $('#pr-' + b.dataset.paid).value.trim(); if (!v) return toast('Enter your transaction ID or a short note', true); await rpc('claim_payment', {p_order: b.dataset.paid, p_paid_ref: v}); toast('Thank you. We will confirm your payment shortly.'); await refresh(); }));
    A.querySelectorAll('[id^="pay-"]').forEach(async el => { const id = el.id.slice(4); try { const d = DEMO ? {instructions: 'Payment instructions appear here.', link: ''} : await rpc('get_payment_details', {p_order: id});
      el.innerHTML = (d.instructions ? '<div style="white-space:pre-wrap">' + esc(d.instructions) + '</div>' : '<span class="hint">Payment details will be shown here. If nothing appears, contact support.</span>') + (d.link ? `<div class="row" style="margin-top:10px"><a class="btn sm mint" href="${esc(d.link)}" rel="noopener" target="_blank">Open payment link</a></div>` : '') + `<p class="hint">Use exactly <b>${usd(S.orders.find(o => o.id === id)?.amount_usd)}</b> and put <b>${esc(S.orders.find(o => o.id === id)?.ref)}</b> in the note if the payment method allows it.</p>`; } catch (e) { el.textContent = 'Could not load payment details.'; } });
    A.querySelectorAll('[data-pref]').forEach(i => i.onchange = guard(async () => { if (DEMO) return; const prefs = {...(S.profile.notify_prefs || {})}; prefs[i.dataset.pref] = i.checked; const {error} = await c.from('profiles').update({notify_prefs: prefs}).eq('user_id', (await gte.session()).user.id); if (error) throw error; S.profile.notify_prefs = prefs; toast('Saved'); }));
    const on = $('#tgOn'); if (on) on.onclick = guard(async () => {
      const bot = S.settings.botUsername || 'GoldTriEngine_Bot'; const tok = DEMO ? 'demo' : await rpc('create_telegram_link');
      window.open('https://t.me/' + bot + '?start=' + tok, '_blank', 'noopener'); $('#tgHint').textContent = 'Waiting for you to tap Start in Telegram...';
      for (let i = 0; i < 40 && !DEMO; i++) { await new Promise(r => setTimeout(r, 3000)); const {data} = await c.from('profiles').select('telegram_chat_id').maybeSingle(); if (data && data.telegram_chat_id) { await refresh(); toast('Telegram connected'); return; } } });
    const off = $('#tgOff'); if (off) off.onclick = guard(async () => { await rpc('disconnect_telegram'); await refresh(); });
    const go = $('#ckGo'); if (go) go.onclick = guard(async () => { const k = $('#ck').value.trim(); if (!k) return; await rpc('claim_license', {p_key: k}); toast('Key added'); await refresh(); });
  }
  const tradeCache = {};
  async function mountResults(id) {
    const el = document.getElementById('res-' + id); if (!el || !window.gteResults) return;
    const hit = tradeCache[id];
    if (!hit || Date.now() - hit.at > 300000) {
      let rows = [];
      if (DEMO) rows = gteResults.demo();
      else for (let from = 0; from < 20000; from += 1000) {
        const {data, error} = await c.from('trades').select('engine,dir,is_add,closed_at,open_price,close_price,lots,result_r,profit').eq('license_id', id).order('closed_at').range(from, from + 999);
        if (error) { el.innerHTML = '<div class="msg err">Could not load results.</div>'; return; }
        rows = rows.concat(data); if (data.length < 1000) break;
      }
      rows.forEach(t => { t.profit = Number(t.profit); t.result_r = Number(t.result_r); });
      tradeCache[id] = {at: Date.now(), rows};
    }
    gteResults.render(el, tradeCache[id].rows);
  }
  async function refresh(hash) { S = await load(); if (hash) history.replaceState(null, '', hash); render(); }

  // ---------- start ----------
  c = DEMO ? null : await gte.client();
  const sess = DEMO ? {user: {email: 'amina@example.com'}} : await gte.session();
  if (!sess) { $('#gate').classList.remove('hide'); return; }
  $('#who').textContent = sess.user.email || '';
  $('#out').onclick = async () => { if (!DEMO) await c.auth.signOut(); location.href = 'index.html'; };
  try { S = await load(); } catch (e) { A.innerHTML = '<div class="msg err">Could not load your account: ' + esc(e.message || e) + '</div>'; return; }
  render();
  if (!DEMO) setInterval(async () => { try { S = await load(); render(); } catch (e) {} }, 60000);
})();
