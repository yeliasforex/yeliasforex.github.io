/* Partners page: live terms, earnings example, and the application form. */
(function () {
  var $ = function (s) { return document.querySelector(s); }, esc = function (s) { return gte.esc(s); };
  var T = { rate_sale: 20, rate_renewal: 10, hold_days: 14, cookie_days: 90, min_payout: 50, gold_paid: 10, gold_bonus: 5, open: true };
  var plans = [];
  function fillTerms() {
    var m = { sale: T.rate_sale, ren: T.rate_renewal, hold: T.hold_days, cookie: T.cookie_days, min: '$' + T.min_payout, gp: T.gold_paid, gb: T.gold_bonus };
    document.querySelectorAll('[data-t]').forEach(function (e) { var v = m[e.dataset.t]; if (v !== undefined) e.textContent = v; });
    $('#pt-stats').innerHTML = [[T.rate_sale + '%', 'on every new sale'], [T.rate_renewal + '%', 'on every renewal'], [T.cookie_days + ' days', 'your link is remembered'], ['USDT', 'paid to your wallet']]
      .map(function (x) { return '<div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('');
  }
  function calc() {
    var p = plans.find(function (x) { return x.id === $('#pc-sel').value; }) || plans[0]; if (!p) return;
    var n = +$('#pc-n').value, d = Math.min(+$('#pc-d').value, T.rate_sale), price = Number(p.price_usd);
    $('#pc-plan').textContent = gte.usd(price); $('#pc-nv').textContent = n; $('#pc-dv').textContent = d + '%';
    $('#pc-m1').textContent = gte.usd(Math.max(0, n * (price * T.rate_sale / 100 - price * d / 100)));
    $('#pc-ren').textContent = gte.usd(price * T.rate_renewal / 100);
    $('#pc-pay').textContent = gte.usd(price * (1 - d / 100));
  }
  function form(state) {
    var box = $('#pt-form');
    if (!T.open && !state) { box.innerHTML = '<div class="pt-state"><b>Applications are closed for now.</b><p class="meta" style="margin:4px 0 0">Check back soon or write to us on the contact page.</p></div>'; return; }
    if (state && state.status === 'pending') { box.innerHTML = '<div class="pt-state"><b>Your application is with us.</b><p class="meta" style="margin:4px 0 0">Code requested: <b>' + esc(state.code) + '</b>. We will review it and email you. You will see a Partner button in My account once it is approved.</p></div>'; return; }
    if (state && (state.status === 'active' || state.status === 'paused')) { box.innerHTML = '<div class="pt-state"><b>You are a partner.</b><p class="meta" style="margin:4px 0 8px">Your code is <b>' + esc(state.code) + '</b>.' + (state.status === 'paused' ? ' Your account is paused right now. Contact us if you have questions.' : '') + '</p><a class="btn mint" href="partner.html">Open your partner dashboard</a></div>'; return; }
    if (state && state.status === 'declined') { box.innerHTML = '<div class="pt-state"><b>Your application was not approved.</b><p class="meta" style="margin:4px 0 0">You are welcome to write to us on the <a href="contact.html">contact page</a> if your audience has grown.</p></div>'; return; }
    box.innerHTML = '<form id="pf" novalidate><div class="pt-row"><div><label for="pn">Your name or channel name</label><input id="pn" type="text" maxlength="80" autocomplete="name"></div><div><label for="pc">Code you would like</label><input id="pc" type="text" maxlength="20" placeholder="e.g. YOURNAME" autocapitalize="characters"></div></div>'
      + '<label for="pl">Link to your channel or profile</label><input id="pl" type="text" maxlength="300" placeholder="https://youtube.com/@you" inputmode="url">'
      + '<label for="pa">Audience size and where</label><input id="pa" type="text" maxlength="300" placeholder="e.g. 4,000 YouTube subscribers, Bangladesh">'
      + '<label for="pb">How will you share it?</label><textarea id="pb" rows="3" maxlength="900" placeholder="Videos, a Telegram group, a blog..."></textarea>'
      + '<input class="pt-hp" id="pw" tabindex="-1" autocomplete="off" aria-hidden="true">'
      + '<label style="text-transform:none;font:400 .95rem var(--sans,inherit);letter-spacing:0"><input type="checkbox" id="pg"> I will follow the fair play rules above and the <a href="terms.html">Terms</a>.</label>'
      + '<div style="margin-top:14px"><button class="btn mint" id="ps" type="submit">Send my application</button></div><div class="pt-msg" id="pm" role="status"></div></form>';
    $('#pf').onsubmit = async function (e) {
      e.preventDefault(); var m = $('#pm'); m.className = 'pt-msg'; m.textContent = '';
      var name = $('#pn').value.trim(); if (name.length < 2) { m.className = 'pt-msg err'; m.textContent = 'Enter your name or channel name.'; return; }
      if (!$('#pg').checked) { m.className = 'pt-msg err'; m.textContent = 'Please accept the fair play rules.'; return; }
      if ($('#pw').value) return;
      $('#ps').disabled = true;
      try {
        var c = await gte.client(), r = await c.rpc('partner_apply', { p_name: name, p_channel: $('#pl').value.trim(), p_audience: $('#pa').value.trim(), p_about: $('#pb').value.trim(), p_code: $('#pc').value.trim() || null, p_agree: true });
        if (r.error) throw r.error; try { gteEvent('partner_apply'); } catch (x) {}
        form({ status: r.data.status, code: r.data.code });
      } catch (err) { m.className = 'pt-msg err'; m.textContent = err.message || 'Something went wrong. Please try again.'; $('#ps').disabled = false; }
    };
  }
  async function init() {
    try { var t = await gte.rpcAnon('partner_public_terms', {}); if (t && t.rate_sale != null) T = Object.assign(T, t); } catch (e) {}
    fillTerms();
    try { plans = await gte.plans(); } catch (e) { plans = gte.fallbackPlans || []; }
    var sel = $('#pc-sel'); sel.innerHTML = plans.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' (' + gte.usd(p.price_usd) + ')</option>'; }).join('');
    sel.value = (plans.find(function (p) { return p.popular; }) || plans[0] || {}).id; ['#pc-sel', '#pc-n', '#pc-d'].forEach(function (s) { $(s).oninput = calc; }); calc();
    var s = await gte.session(), box = $('#pt-form');
    if (!s) { box.innerHTML = '<p>Sign in first so we can connect your partner dashboard to you. It is free and takes a minute.</p><a class="btn mint" href="signin.html?next=partners.html%23apply">Sign in to apply</a>'; return; }
    var st = null; try { var c = await gte.client(), r = await c.rpc('partner_status'); if (!r.error) st = r.data; } catch (e) {}
    form(st && st.status ? st : null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
