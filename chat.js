/* Support chatbot widget. Talks to the "chat" Edge Function. Works on every page; if the visitor is signed in, the
   assistant also sees that customer's own license status (read with their token, so only their own rows). */
(function () {
  if (window.__gteChat || /\/admin\//.test(location.pathname)) return; window.__gteChat = 1;
  const FN = 'https://ekljeyquxvlfbeadgszx.supabase.co/functions/v1/chat', SUPPORT = 'https://t.me/GoldTriEngine_Support';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const fmt = s => esc(s).replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  let hist = []; try { hist = JSON.parse(sessionStorage.getItem('gte_chat') || '[]'); } catch (e) {}
  const save = () => { try { sessionStorage.setItem('gte_chat', JSON.stringify(hist.slice(-20))); } catch (e) {} };

  const css = document.createElement('style');
  css.textContent = `
  .gc-fab{position:fixed;right:18px;bottom:var(--gcb,18px);z-index:90;display:flex;align-items:center;gap:8px;height:50px;padding:0 18px;border-radius:999px;border:1px solid rgba(62,224,154,.5);background:#0c1322;color:#fff;font:600 .95rem/1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.5);transition:transform .2s}
  .gc-fab:hover{transform:translateY(-2px)}.gc-fab i{width:9px;height:9px;border-radius:50%;background:#3EE09A;box-shadow:0 0 0 0 rgba(62,224,154,.6);animation:gcp 2s infinite}
  @keyframes gcp{to{box-shadow:0 0 0 10px rgba(62,224,154,0)}}
  .gc-box{position:fixed;right:18px;bottom:calc(var(--gcb,18px) + 60px);z-index:91;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - var(--gcb,18px) - 90px));display:none;flex-direction:column;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:#0a0f1c;color:#e8edf8;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden;font-size:.93rem}
  .gc-box.on{display:flex;animation:gcu .25s ease-out}@keyframes gcu{from{opacity:0;transform:translateY(12px)}}
  .gc-h{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,#111a2f,#0a0f1c)}
  .gc-h b{font-size:1rem}.gc-h small{display:block;color:#8d98b3;font-size:.76rem;margin-top:2px}
  .gc-x{background:none;border:0;color:#8d98b3;font-size:1.4rem;cursor:pointer;line-height:1}
  .gc-m{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .gc-b{max-width:88%;padding:9px 12px;border-radius:14px;line-height:1.45;word-wrap:break-word}
  .gc-b.u{align-self:flex-end;background:#1c4fd6;color:#fff;border-bottom-right-radius:4px}
  .gc-b.a{align-self:flex-start;background:#141c30;border:1px solid rgba(255,255,255,.09);border-bottom-left-radius:4px}
  .gc-b a{color:#7fa4ff}.gc-b.e{border-color:rgba(255,107,120,.5)}
  .gc-s{display:flex;flex-wrap:wrap;gap:6px}.gc-s button{background:#101828;border:1px solid rgba(255,255,255,.14);color:#cdd6ea;border-radius:999px;padding:6px 11px;font:inherit;font-size:.82rem;cursor:pointer}.gc-s button:hover{border-color:#3EE09A;color:#fff}
  .gc-d{display:inline-flex;gap:4px}.gc-d i{width:6px;height:6px;border-radius:50%;background:#8d98b3;animation:gcd 1s infinite}.gc-d i:nth-child(2){animation-delay:.15s}.gc-d i:nth-child(3){animation-delay:.3s}@keyframes gcd{50%{transform:translateY(-4px);opacity:.4}}
  .gc-f{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.1)}
  .gc-f input{flex:1;min-width:0;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:#0f1627;color:#fff;padding:0 12px;font:inherit}
  .gc-f input:focus{outline:2px solid #3EE09A;outline-offset:1px}
  .gc-f button{height:42px;padding:0 16px;border-radius:12px;border:0;background:#3EE09A;color:#04120B;font:600 .92rem inherit;font-family:inherit;cursor:pointer}.gc-f button:disabled{opacity:.5}
  .gc-n{padding:7px 14px 10px;color:#7d88a3;font-size:.72rem;line-height:1.4}.gc-n a{color:#9db6f5}

  :root[data-theme="light"] .gc-fab{background:#fff;color:#0d1424;border-color:rgba(11,138,92,.55);box-shadow:0 8px 28px rgba(20,30,60,.22)}
  :root[data-theme="light"] .gc-box{background:#fff;color:#0d1424;border-color:rgba(25,40,80,.18);box-shadow:0 20px 60px rgba(20,30,60,.25)}
  :root[data-theme="light"] .gc-h{background:linear-gradient(180deg,#f1f4fb,#fff);border-color:rgba(25,40,80,.12)}
  :root[data-theme="light"] .gc-h small,:root[data-theme="light"] .gc-x,:root[data-theme="light"] .gc-n{color:#586379}
  :root[data-theme="light"] .gc-b.a{background:#eef2f9;border-color:rgba(25,40,80,.1);color:#0d1424}
  :root[data-theme="light"] .gc-b a,:root[data-theme="light"] .gc-n a{color:#1747c8}
  :root[data-theme="light"] .gc-s button{background:#f1f4fb;color:#2b3650;border-color:rgba(25,40,80,.18)}
  :root[data-theme="light"] .gc-s button:hover{color:#0d1424;border-color:#0b8a5c}
  :root[data-theme="light"] .gc-f{border-color:rgba(25,40,80,.12)}
  :root[data-theme="light"] .gc-f input{background:#f4f6fb;color:#0d1424;border-color:rgba(25,40,80,.2)}
  :root[data-theme="light"] .gc-f button{background:#0b8a5c;color:#fff}
  @media (prefers-reduced-motion:reduce){.gc-fab i,.gc-box.on{animation:none}}`;
  document.head.appendChild(css);
  if (document.querySelector('.fab')) document.documentElement.style.setProperty('--gcb', window.innerWidth <= 600 ? '82px' : '86px');   // sit above the Contact button, never on top of it

  const fab = document.createElement('button'); fab.className = 'gc-fab'; fab.setAttribute('aria-label', 'Open support chat'); fab.innerHTML = '<i></i>Ask us';
  const box = document.createElement('div'); box.className = 'gc-box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Support assistant');
  box.innerHTML = `<div class="gc-h"><div><b>GoldTriEngine assistant</b><small>AI answers about setup, plans and your license</small></div><button class="gc-x" aria-label="Close">&times;</button></div>
    <div class="gc-m" id="gcm"></div>
    <form class="gc-f" id="gcf"><input id="gci" maxlength="600" placeholder="Type your question..." autocomplete="off" aria-label="Your question"><button type="submit">Send</button></form>
    <div class="gc-n">AI assistant: it can make mistakes and is not financial advice. Past results do not guarantee future results; gold trading carries a high risk of loss (<a href="risk.html">risk disclaimer</a>). Never share passwords or your full key. Need a person? <a href="${SUPPORT}" target="_blank" rel="noopener">Telegram support</a>.</div>`;
  document.body.append(fab, box);
  const M = box.querySelector('#gcm'), F = box.querySelector('#gcf'), I = box.querySelector('#gci'), B = F.querySelector('button');
  const add = (cls, html) => { const d = document.createElement('div'); d.className = 'gc-b ' + cls; d.innerHTML = html; M.appendChild(d); M.scrollTop = M.scrollHeight; return d; };
  const SUG = ['How do I install the EA?', 'What does each plan cover?', 'Why are no new trades opening?', 'How do I move my key to another account?'];
  function start() {
    M.innerHTML = '';
    add('a', 'Hi! Ask me about setup, plans, your license or the account page. If you are signed in I can also look at your own license status.');
    hist.forEach(h => add(h.role === 'user' ? 'u' : 'a', fmt(h.text)));
    if (!hist.length) { const s = document.createElement('div'); s.className = 'gc-s'; SUG.forEach(q => { const b = document.createElement('button'); b.type = 'button'; b.textContent = q; b.onclick = () => { s.remove(); send(q); }; s.appendChild(b); }); M.appendChild(s); }
  }
  async function token() {
    try {
      if (window.gte && window.gte.session) { const s = await window.gte.session(); return s ? s.access_token : null; }
      const k = Object.keys(localStorage).find(x => /^sb-.*-auth-token$/.test(x)); if (!k) return null;
      return (JSON.parse(localStorage.getItem(k)) || {}).access_token || null;
    } catch (e) { return null; }
  }
  async function send(text) {
    text = text.trim(); if (!text) return;
    const sg = M.querySelector('.gc-s'); if (sg) sg.remove();
    add('u', esc(text)); hist.push({role: 'user', text}); save(); I.value = ''; B.disabled = true;
    const typing = add('a', '<span class="gc-d"><i></i><i></i><i></i></span>');
    try {
      const t = await token(), headers = {'Content-Type': 'application/json'}; if (t) headers.Authorization = 'Bearer ' + t;
      const r = await fetch(FN, {method: 'POST', headers, body: JSON.stringify({messages: hist.slice(-10)})});
      const j = await r.json().catch(() => ({}));
      typing.remove();
      if (!r.ok) { add('a e', fmt(j.error || 'Something went wrong. Please contact support: ' + SUPPORT)); hist.pop(); save(); }
      else { add('a', fmt(j.reply)); hist.push({role: 'model', text: j.reply}); save(); }
    } catch (e) { typing.remove(); add('a e', 'Could not reach the assistant. Please try again or contact support: ' + SUPPORT); hist.pop(); save(); }
    B.disabled = false; I.focus();
  }
  F.onsubmit = e => { e.preventDefault(); send(I.value); };
  const toggle = on => { box.classList.toggle('on', on); fab.style.display = on ? 'none' : 'flex'; if (on) { if (!M.childElementCount) start(); I.focus(); } };
  fab.onclick = () => toggle(true); box.querySelector('.gc-x').onclick = () => toggle(false);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('on')) toggle(false); });
})();
