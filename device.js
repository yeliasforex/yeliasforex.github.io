/* "This device" panel on My account: phone alerts (web push) and quick unlock (fingerprint / face). */
(function () {
  var PUSH_OK = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  function b64u(buf) { var s = ''; new Uint8Array(buf).forEach(function (b) { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function u8(b64) { b64 = b64.replace(/-/g, '+').replace(/_/g, '/'); var s = atob(b64 + '==='.slice((b64.length + 3) % 4)), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  var isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  window.gteDevice = {
    html: function () {
      return '<div class="panel" id="dv"><div class="row sp"><div><h2>This device</h2><p class="sub" style="margin:0">Alerts on your phone and a quick lock for this app. Both are per device.</p></div></div>'
        + '<div class="tog"><span><b>Phone alerts</b><br><span class="hint" id="pa-h">Checking...</span></span><label class="sw"><input type="checkbox" id="pa" disabled><span></span></label></div>'
        + '<div class="row" style="margin:2px 0 8px"><button class="btn sm" id="pa-test" type="button" hidden>Send a test alert</button></div>'
        + '<div class="tog"><span><b>Quick unlock</b><br><span class="hint" id="ql-h">Checking...</span></span><label class="sw"><input type="checkbox" id="ql" disabled><span></span></label></div></div>';
    },
    wire: function (rpc, toast, guard) {
      var pa = document.getElementById('pa'), ph = document.getElementById('pa-h'), pt = document.getElementById('pa-test');
      var ql = document.getElementById('ql'), qh = document.getElementById('ql-h');
      if (!pa || !ql) return;
      /* ---- phone alerts ---- */
      async function pushState() {
        if (!PUSH_OK) {
          ph.innerHTML = isIos ? 'On iPhone, first add the app to your Home Screen (<a href="apps.html">how</a>), then open it from there and switch this on.' : 'This browser cannot show phone alerts. Try Chrome or the Android app.';
          return;
        }
        if (Notification.permission === 'denied') { ph.textContent = 'Alerts are blocked for this site. Allow notifications in your browser or phone settings, then come back.'; return; }
        try { await rpc('push_public_key'); } catch (e) { ph.textContent = 'Phone alerts will be available shortly.'; return; }
        var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
        pa.disabled = false; pa.checked = !!sub && Notification.permission === 'granted'; pt.hidden = !pa.checked;
        ph.textContent = pa.checked ? 'On. Trades, EA offline, license and update alerts also arrive here.' : 'Get trades, EA offline, license and update alerts here. Follows your Telegram on/off choices above.';
      }
      pa.onchange = guard(async function () {
        pa.disabled = true;
        try {
          var reg = await navigator.serviceWorker.ready;
          if (pa.checked) {
            var perm = await Notification.requestPermission();
            if (perm !== 'granted') { pa.checked = false; throw new Error('Notifications were not allowed.'); }
            var key = await rpc('push_public_key');
            var sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(key) });
            var j = sub.toJSON();
            await rpc('push_subscribe', { p_endpoint: sub.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_ua: navigator.userAgent });
            await rpc('push_test');
            toast('Phone alerts are on');
          } else {
            var s = await reg.pushManager.getSubscription();
            if (s) { var ep = s.endpoint; await s.unsubscribe(); await rpc('push_unsubscribe', { p_endpoint: ep }); }
            toast('Phone alerts are off');
          }
        } finally { await pushState(); }
      });
      pt.onclick = guard(async function () { await rpc('push_test'); toast('Test alert sent'); });
      pushState().catch(function () { ph.textContent = 'Could not check alerts on this device.'; });
      /* ---- quick unlock ---- */
      async function lockState() {
        var ok = false;
        try { ok = !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) {}
        if (!ok) { qh.textContent = 'This device has no fingerprint, face or screen lock that the browser can use.'; return; }
        ql.disabled = false; ql.checked = !!(window.gteLock && gteLock.id());
        qh.textContent = ql.checked ? 'On. Opening My account asks for your fingerprint, face or screen lock.' : 'Ask for your fingerprint, face or screen lock before showing your account on this device.';
      }
      ql.onchange = guard(async function () {
        ql.disabled = true; var want = ql.checked;
        try {
          if (want) {
            var cred = await navigator.credentials.create({ publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'GoldTriEngine' },
              user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'GoldTriEngine app', displayName: 'GoldTriEngine app' },
              pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
              authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000 } });
            localStorage.setItem('gte_lock', b64u(cred.rawId)); gteLock.stamp(); toast('Quick unlock is on');
          } else { localStorage.removeItem('gte_lock'); toast('Quick unlock is off'); }
        } catch (e) { ql.checked = !want; throw new Error(want ? 'Quick unlock was not set up.' : 'Quick unlock could not be turned off.'); }
        finally { await lockState(); }
      });
      lockState();
    }
  };
})();
