/* Site-wide extras: announcement banner (set in the admin), privacy notice, newsletter box, and Product data for search engines on the pricing page.
   Each part is independent and fails quietly: if the network or storage is blocked the page simply looks as before. */
(function () {
  var URL = 'https://ekljeyquxvlfbeadgszx.supabase.co', ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  var path = location.pathname;
  function rpc(fn, args) {
    return fetch(URL + '/rest/v1/rpc/' + fn, {method: 'POST', headers: {apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json'}, body: JSON.stringify(args || {})})
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || 'failed'); return j; }); });
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  var css = el('style');
  css.textContent = '.gx-banner{display:flex;gap:12px;align-items:center;justify-content:center;padding:9px 44px 9px 16px;background:linear-gradient(90deg,#1747C8,#5B86FF);color:#fff;font:500 .92rem/1.4 var(--sans,system-ui);text-align:center;position:relative}' +
    '.gx-banner a{color:#fff;text-decoration:underline;font-weight:600}.gx-banner button{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:1.3rem;cursor:pointer;line-height:1;padding:4px 8px}' +
    '.gx-cookie{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;z-index:60;background:var(--panel,#0E1322);color:var(--fg-2,#C3CADA);border:1px solid var(--line-2,rgba(170,190,230,.18));border-radius:14px;padding:14px 16px;font:400 .88rem/1.5 var(--sans,system-ui);box-shadow:0 10px 40px rgba(0,0,0,.5)}' +
    '.gx-cookie a{color:var(--blue-hi,#5B86FF)}.gx-cookie .gx-row{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}' +
    '.gx-btn{font:600 .85rem var(--sans,system-ui);padding:8px 14px;border-radius:10px;border:1px solid var(--line-2,rgba(170,190,230,.18));background:transparent;color:var(--fg,#ECEFF6);cursor:pointer}.gx-btn.p{background:var(--blue,#1747C8);border-color:transparent;color:#fff}' +
    '.gx-news{max-width:760px;margin:40px auto;padding:22px 22px 18px;border:1px solid var(--line-2,rgba(170,190,230,.18));border-radius:18px;background:var(--panel,#0E1322);color:var(--fg-2,#C3CADA)}' +
    '.gx-news h3{margin:0 0 6px;font:500 1.25rem var(--sans,system-ui);color:var(--fg,#ECEFF6)}.gx-news p{margin:0 0 12px;font-size:.95rem}.gx-news form{display:flex;gap:10px;flex-wrap:wrap}' +
    '.gx-news input[type=email]{flex:1 1 220px;padding:11px 13px;border-radius:10px;border:1px solid var(--line-2,rgba(170,190,230,.18));background:var(--ink,#06080E);color:var(--fg,#ECEFF6);font:400 1rem var(--sans,system-ui)}' +
    '.gx-news small{display:block;margin-top:10px;color:var(--muted,#8892A8);font-size:.8rem}.gx-news .gx-msg{margin-top:8px;font-size:.9rem}';
  document.head.appendChild(css);

  /* 1. announcement banner */
  function showBanner(b) {
    if (!b || !b.on || !b.text) return;
    var id = 'gx_b_' + b.text.length + '_' + b.text.charCodeAt(0) + b.text.charCodeAt(b.text.length - 1);
    if (get(id)) return;
    var bar = el('div', 'gx-banner', '<span>' + esc(b.text) + (b.link ? ' <a href="' + esc(b.link) + '">Learn more</a>' : '') + '</span><button type="button" aria-label="Close">&times;</button>');
    bar.querySelector('button').onclick = function () { set(id, '1'); bar.remove(); };
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (!/\/(admin|signin|my-account)/.test(path)) {
    var cached = null; try { cached = JSON.parse(get('gx_banner') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.t < 5 * 60 * 1000) showBanner(cached.b);
    else rpc('site_banner').then(function (b) { set('gx_banner', JSON.stringify({t: Date.now(), b: b})); showBanner(b); }).catch(function () {});
  }

  /* 2. privacy notice: says what is used and lets the visitor switch the anonymous visit counter off */
  if (!get('gte_consent') && !/\/admin/.test(path)) {
    var ck = el('div', 'gx-cookie', '<div>We keep a small amount of data in your browser to make the site work, and count visits anonymously (no ads, no third-party trackers). See the <a href="' + (path.indexOf('/blog/') === 0 ? '../' : '') + 'privacy.html">privacy policy</a>.</div><div class="gx-row"><button class="gx-btn p" type="button" data-ok>OK</button><button class="gx-btn" type="button" data-no>Do not count my visits</button></div>');
    ck.setAttribute('role', 'dialog'); ck.setAttribute('aria-label', 'Privacy notice');
    ck.querySelector('[data-ok]').onclick = function () { set('gte_consent', 'ok'); ck.remove(); };
    ck.querySelector('[data-no]').onclick = function () { set('gte_consent', 'no'); set('gte_notrack', '1'); ck.remove(); };
    document.body.appendChild(ck);
  }

  /* 3. newsletter box on the blog and the main reading pages */
  if (/^\/(blog\/|index\.html$|faq\.html$|guide\.html$|gold-ea-mt5\.html$|best-gold-ea-mt5\.html$)/.test(path) || path === '/') {
    var foot = document.querySelector('footer');
    if (foot && !document.querySelector('.gx-news')) {
      var box = el('section', 'gx-news', '<h3>Get new gold analysis by email</h3><p>The daily outlook, the weekly review and new lessons, in one short email. No spam, one click to unsubscribe.</p>' +
        '<form novalidate><input type="email" name="email" placeholder="you@example.com" autocomplete="email" aria-label="Email address" required><button class="gx-btn p" type="submit">Subscribe</button></form><div class="gx-msg" role="status"></div>' +
        '<small>By subscribing you agree to receive these emails. Trading involves risk; nothing here is financial advice.</small>');
      var f = box.querySelector('form'), m = box.querySelector('.gx-msg');
      f.onsubmit = function (e) {
        e.preventDefault(); var v = f.email.value.trim(); if (!v) return;
        var b = f.querySelector('button'); b.disabled = true;
        rpc('subscribe_newsletter', {p_email: v, p_source: path.slice(0, 40)}).then(function () { m.textContent = 'Thank you. You are on the list.'; f.style.display = 'none'; })
          .catch(function (er) { m.textContent = /valid/.test(er.message) ? 'Please enter a valid email address.' : 'Something went wrong. Please try again in a moment.'; b.disabled = false; });
      };
      foot.parentNode.insertBefore(box, foot);
    }
  }

  /* 4. Product data for search engines (real prices from the database; no ratings are invented) */
  if (/pricing\.html$/.test(path)) {
    Promise.all([fetch(URL + '/rest/v1/plans?select=id,name,price_usd,limit_usd&active=eq.true&order=sort', {headers: {apikey: ANON, Authorization: 'Bearer ' + ANON}}).then(function (r) { return r.json(); }), rpc('public_settings')]).then(function (a) {
      var plans = a[0], open = !a[1] || a[1].salesOpen !== false;
      if (!plans || !plans.length) return;
      var data = {'@context': 'https://schema.org', '@type': 'Product', name: 'GoldTriEngine Expert Advisor licence (1 year)', description: 'A gold (XAUUSD) Expert Advisor for MetaTrader 5. One licence covers one MT5 account in USD for one year.',
        brand: {'@type': 'Brand', name: 'GoldTriEngine'}, category: 'Trading software',
        offers: plans.map(function (p) { return {'@type': 'Offer', name: p.name + (p.limit_usd ? ' (deposits up to $' + p.limit_usd + ')' : ' (any deposit size)'), price: String(p.price_usd), priceCurrency: 'USD',
          availability: open ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: 'https://goldtriengine.com/pricing.html#buy-' + p.id}; })};
      var s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(data); document.head.appendChild(s);
    }).catch(function () {});
  }
})();
