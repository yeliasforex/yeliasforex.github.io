/* GoldTriEngine customer pages: Supabase client + plan cards. The key below is the public anon key (access is enforced by the database). */
(function () {
  const URL_ = 'https://ekljeyquxvlfbeadgszx.supabase.co';
  const KEY_ = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  const DEMO = new URLSearchParams(location.search).has('demo');
  const gte = window.gte = {DEMO};
  const esc = gte.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  gte.usd = n => n == null ? 'No limit' : '$' + Number(n).toLocaleString('en-US', {maximumFractionDigits: 2});
  gte.date = d => d ? new Date(d).toISOString().slice(0, 10) : '-';
  gte.ago = d => { if (!d) return 'never'; const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

  const FALLBACK = [
    {id: 'investor', name: 'Investor', limit_usd: 5000, price_usd: 1000, popular: false},
    {id: 'tycoon', name: 'Tycoon', limit_usd: 10000, price_usd: 1900, popular: true},
    {id: 'mogul', name: 'Mogul', limit_usd: 20000, price_usd: 3600, popular: false},
    {id: 'billionaire', name: 'Billionaire', limit_usd: null, price_usd: 5000, popular: false}];
  gte.fallbackPlans = FALLBACK;

  let sb = null;
  gte.client = async () => {
    if (sb) return sb;
    if (!window.supabase) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    sb = window.supabase.createClient(URL_, KEY_, {auth: {detectSessionInUrl: true, persistSession: true, autoRefreshToken: true}});
    return sb;
  };
  gte.session = async () => { const c = await gte.client(); const {data} = await c.auth.getSession(); return data.session; };
  // counts a press on the Download button (works for visitors and signed-in customers; never blocks the download)
  gte.trackDownload = (ver) => {
    try {
      let tok = KEY_; const k = Object.keys(localStorage).find(x => /^sb-.*-auth-token$/.test(x));
      if (k) { const t = (JSON.parse(localStorage.getItem(k)) || {}).access_token; if (t) { const ex = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp; if (ex * 1000 > Date.now() + 30000) tok = t; } }
      const v = ver || ((document.getElementById('dlv') || {}).textContent || '').replace(/^v/, '') || null;
      fetch(URL_ + '/rest/v1/rpc/ea_track_download', {method: 'POST', keepalive: true, headers: {apikey: KEY_, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json'}, body: JSON.stringify({p_version: v})}).catch(() => {});
    } catch (e) {}
  };
  gte.rpcAnon = async (fn, args) => { const r = await fetch(URL_ + '/rest/v1/rpc/' + fn, {method: 'POST', headers: {apikey: KEY_, Authorization: 'Bearer ' + KEY_, 'Content-Type': 'application/json'}, body: JSON.stringify(args || {})}); if (!r.ok) throw new Error('request failed'); return r.json(); };
  gte.settings = async () => { try { const c = await gte.client(); const {data} = await c.rpc('public_settings'); return data || {}; } catch (e) { return {}; } };
  gte.plans = async () => { try { const c = await gte.client(); const {data} = await c.from('plans').select('*').eq('active', true).order('sort'); return data && data.length ? data : FALLBACK; } catch (e) { return FALLBACK; } };

  const FEATURES = ['One MT5 USD account for 1 year', 'All three engines, fully automatic', 'Telegram alerts on your phone', 'Personal setup help on Telegram', 'Free updates during the year'];
  gte.planCard = (p, open) => `<article class="plan${p.popular ? ' pop' : ''}" id="plan-${esc(p.id)}">${p.popular ? '<span class="flag">Most popular</span>' : ''}
    <h3>${esc(p.name)}</h3><div class="price">${gte.usd(p.price_usd)}<small> / year</small></div>
    <div class="covers">${p.limit_usd == null ? 'Covers <b>any deposit size</b>' : 'Covers deposits up to <b>' + gte.usd(p.limit_usd) + '</b>'}</div>
    
    <a class="btn ${p.popular ? 'mint' : 'primary'}${open === false ? ' off' : ''}" href="pricing.html#buy-${esc(p.id)}" data-buy="${esc(p.id)}">${open === false ? 'Opening soon' : 'Get ' + esc(p.name)}</a></article>`;
  gte.renderPlans = async (el, onBuy) => {
    const [plans, st] = await Promise.all([gte.plans(), gte.settings()]);
    const open = st.salesOpen !== false;
    el.innerHTML = plans.map(p => gte.planCard(p, open)).join('');
    if (!el.previousElementSibling || !el.previousElementSibling.classList.contains('plan-inc')) el.insertAdjacentHTML('beforebegin', '<div class="plan-inc"><b>Every plan includes</b><ul>' + FEATURES.map(f => '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' + f + '</li>').join('') + '</ul></div>');
    if (onBuy) el.querySelectorAll('[data-buy]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); onBuy(a.dataset.buy); }));
  };
  gte.buy = async planId => {
    const s = await gte.session();
    if (!s) { location.href = 'signin.html?next=' + encodeURIComponent('pricing.html#buy-' + planId); return; }
    const c = await gte.client();
    const {data, error} = await c.rpc('create_order', {p_kind: 'purchase', p_plan_id: planId});
    if (error) { alert(error.message.includes('not open') ? 'Sales are not open right now.' : error.message); return; }
    location.href = 'my-account.html#order=' + data.id;
  };
})();
