/* Adds a "Proof Wall" link to the menu and footer, only while the owner has the wall switched on and enough customers qualify. Result cached 30 minutes. */
(function () {
  var KEY = 'gte_pw_nav', TTL = 30 * 60 * 1000, URL = 'https://ekljeyquxvlfbeadgszx.supabase.co', ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  function add() {
    var nav = document.querySelector('nav.nav');
    if (nav && !nav.querySelector('[data-pw]')) {
      var a = document.createElement('a'); a.href = 'customers.html'; a.textContent = 'Proof Wall'; a.setAttribute('data-pw', '1');
      var pr = [].filter.call(nav.querySelectorAll('a'), function (x) { return /pricing/.test(x.getAttribute('href') || ''); })[0];
      nav.insertBefore(a, pr || null);
    }
    var li = [].filter.call(document.querySelectorAll('footer .foot a'), function (x) { return /pricing\.html/.test(x.getAttribute('href') || ''); })[0];
    if (li && li.parentNode && li.parentNode.parentNode && !li.parentNode.parentNode.querySelector('[data-pwf]')) {
      var n = document.createElement('li'); n.innerHTML = '<a href="customers.html" data-pwf="1">Proof Wall</a>'; li.parentNode.parentNode.insertBefore(n, li.parentNode.nextSibling);
    }
  }
  var c = null; try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (c && Date.now() - c.t < TTL) { if (c.on) add(); return; }
  fetch(URL + '/rest/v1/rpc/proof_totals', {method: 'POST', headers: {apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json'}, body: '{}'})
    .then(function (r) { return r.json(); }).then(function (j) {
      var on = !!(j && j.on && j.ready); try { localStorage.setItem(KEY, JSON.stringify({t: Date.now(), on: on})); } catch (e) {}
      if (on) add();
    }).catch(function () {});
})();
