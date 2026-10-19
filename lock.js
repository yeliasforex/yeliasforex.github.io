/* Quick unlock: asks for fingerprint, face or the phone's screen lock before showing My account.
   It is a lock on this device only (the sign-in itself stays the email link). Loaded in the head of my-account.html. */
(function () {
  if (window.parent !== window) return;                       // not inside the admin preview
  var K = 'gte_lock', T = 'gte_unlocked', GRACE = 120000, shown = false;
  function id() { try { return localStorage.getItem(K); } catch (e) { return null; } }
  function recent() { try { var t = +sessionStorage.getItem(T); return t && Date.now() - t < GRACE; } catch (e) { return false; } }
  function stamp() { try { sessionStorage.setItem(T, String(Date.now())); } catch (e) {} }
  function u8(b64) { b64 = b64.replace(/-/g, '+').replace(/_/g, '/'); var s = atob(b64 + '==='.slice((b64.length + 3) % 4)), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  var st = document.createElement('style');
  st.textContent = 'html.gte-locked body>*:not(#gte-lock){visibility:hidden}#gte-lock{position:fixed;inset:0;z-index:99999;background:#06080E;color:#E8ECF4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px;font-family:system-ui,sans-serif}#gte-lock img{width:84px;height:84px;border-radius:20px}#gte-lock h1{font-size:1.3rem;margin:6px 0 0}#gte-lock p{color:#9AA4B8;margin:0;max-width:300px;line-height:1.45}#gte-lock button{font:inherit;cursor:pointer;border:0;border-radius:12px;padding:13px 26px;font-weight:600}#gte-lock .go{background:#3EE09A;color:#04120B}#gte-lock .alt{background:none;color:#9AA4B8;text-decoration:underline;padding:6px}';
  document.head.appendChild(st);
  function unlock() {
    var cid = id(); if (!cid) return done();
    var m = document.getElementById('gte-lock-m');
    navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: u8(cid) }], userVerification: 'required', timeout: 60000 } })
      .then(function () { stamp(); done(); })
      .catch(function () { if (m) m.textContent = 'Not unlocked. Try again.'; });
  }
  function done() {
    shown = false; document.documentElement.classList.remove('gte-locked');
    var o = document.getElementById('gte-lock'); if (o) o.remove();
  }
  function lock() {
    if (shown || !id()) return; shown = true;
    document.documentElement.classList.add('gte-locked');
    function build() {
      var o = document.createElement('div'); o.id = 'gte-lock';
      o.innerHTML = '<img src="icon-192.png" alt=""><h1>GoldTriEngine is locked</h1><p id="gte-lock-m">Use your fingerprint, face or screen lock to open your account.</p><button class="go" type="button">Unlock</button><button class="alt" type="button">Sign out instead</button>';
      o.querySelector('.go').onclick = unlock;
      o.querySelector('.alt').onclick = function () {
        try { localStorage.removeItem(K); Object.keys(localStorage).forEach(function (k) { if (/^sb-/.test(k)) localStorage.removeItem(k); }); } catch (e) {}
        location.href = 'signin.html';
      };
      document.body.appendChild(o); unlock();
    }
    if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
  }
  window.gteLock = { id: id, stamp: stamp, lock: lock };
  if (id() && !recent()) lock();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (!shown) stamp(); } else if (id() && !shown && !recent()) lock();
  });
})();
