/* Blog motion: charts and numbers reveal when scrolled into view; the table of contents follows the reader. Everything works without it. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('bl-js');
  var reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fmt = function (el, v) {
    var dec = +el.dataset.d || 0, s = el.dataset.s || '', p = el.dataset.p || '';
    return p + (el.dataset.g ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + s;
  };
  var count = function (el) {
    var v = +el.dataset.v; if (reduced || !isFinite(v)) return;
    var t0 = performance.now(), D = 1200; el.textContent = fmt(el, 0);
    (function f(t) { var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(el, v * e); if (k < 1) requestAnimationFrame(f); else el.textContent = fmt(el, v); })(t0);
  };
  var seen = function (el) {
    el.classList.add('in');
    [].forEach.call(el.querySelectorAll('.cu'), count);
  };
  var els = d.querySelectorAll('.bl-fig,.bl-kn');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); } }); }, {threshold: .25});
    [].forEach.call(els, function (e) { io.observe(e); });
  } else { [].forEach.call(els, function (e) { e.classList.add('in'); }); }
  var toc = d.querySelectorAll('.bl-toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {}; [].forEach.call(toc, function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var heads = [].filter.call(d.querySelectorAll('.bl-body h2'), function (h) { return map[h.id]; });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { [].forEach.call(toc, function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); } });
    }, {rootMargin: '-90px 0px -65% 0px'});
    heads.forEach(function (h) { io2.observe(h); });
  }
})();

/* Likes and comments under a post. Comments are shown only after the owner approves them. Fails quietly if the network is blocked. */
(function () {
  var URL = 'https://ekljeyquxvlfbeadgszx.supabase.co', ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
  var m = location.pathname.match(/^\/blog\/([a-z0-9-]{3,100})\/$/);
  var body = document.querySelector('.bl-body');
  if (!m || !body || document.querySelector('.bl-react')) return;
  var slug = m[1];
  function rpc(fn, args) {
    return fetch(URL + '/rest/v1/rpc/' + fn, {method: 'POST', headers: {apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json'}, body: JSON.stringify(args)})
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || 'failed'); return j; }); });
  }
  var voter = null;
  try { voter = localStorage.getItem('gx_voter'); } catch (e) {}
  if (!voter) {
    voter = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
    try { localStorage.setItem('gx_voter', voter); } catch (e) {}
  }
  var sec = document.createElement('section'); sec.className = 'bl-react'; sec.setAttribute('aria-label', 'Reactions and comments');
  sec.innerHTML = '<div class="bl-r-bar"><button type="button" class="bl-like" aria-pressed="false"><span class="bl-heart" aria-hidden="true">&#9829;</span><span class="bl-lc">0</span><span class="bl-lt">Helpful</span></button><span class="bl-r-n"></span></div>' +
    '<h2 class="bl-r-h">Comments</h2><div class="bl-clist"></div>' +
    '<form class="bl-cform" novalidate><input type="text" name="name" maxlength="40" placeholder="Your name (optional)" autocomplete="nickname" aria-label="Your name"><textarea name="body" rows="3" maxlength="1000" placeholder="Share a thought or a question about this post" aria-label="Comment" required></textarea>' +
    '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="bl-hp"><div class="bl-cmsg" role="status"></div><button type="submit" class="bl-cbtn">Post comment</button><small>Comments are checked before they appear. Links are not allowed. Be kind; nothing here is financial advice.</small></form>';
  var anchor = document.querySelector('.bl-related');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor); else body.parentNode.insertBefore(sec, body.nextSibling);
  var btn = sec.querySelector('.bl-like'), lc = sec.querySelector('.bl-lc'), list = sec.querySelector('.bl-clist'), form = sec.querySelector('form'), msg = sec.querySelector('.bl-cmsg');
  function showLike(n, on) { lc.textContent = n; btn.classList.toggle('on', !!on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function showComments(cs) {
    list.textContent = '';
    if (!cs.length) { var p = document.createElement('p'); p.className = 'bl-none'; p.textContent = 'No comments yet. Be the first.'; list.appendChild(p); return; }
    cs.forEach(function (c) {
      var d = document.createElement('div'); d.className = 'bl-c';
      var h = document.createElement('b'); h.textContent = c.name; var t = document.createElement('span'); t.textContent = c.at; var q = document.createElement('p'); q.textContent = c.body;
      d.appendChild(h); d.appendChild(t); d.appendChild(q); list.appendChild(d);
    });
  }
  rpc('blog_post_stats', {p_slug: slug, p_voter: voter}).then(function (s) { showLike(s.likes, s.liked); showComments(s.comments || []); sec.querySelector('.bl-r-n').textContent = (s.comments || []).length ? (s.comments.length + ' comment' + (s.comments.length > 1 ? 's' : '')) : ''; })
    .catch(function () { sec.style.display = 'none'; });
  btn.onclick = function () {
    var on = !btn.classList.contains('on'); btn.disabled = true;
    rpc('blog_like', {p_slug: slug, p_voter: voter, p_on: on}).then(function (s) { showLike(s.likes, s.liked); }).catch(function () {}).then(function () { btn.disabled = false; });
  };
  form.onsubmit = function (e) {
    e.preventDefault(); var b = form.querySelector('.bl-cbtn'); msg.textContent = ''; msg.className = 'bl-cmsg';
    if (form.body.value.trim().length < 2) { msg.textContent = 'Please write a comment first.'; msg.className += ' err'; return; }
    b.disabled = true;
    rpc('blog_comment_add', {p_slug: slug, p_voter: voter, p_name: form.name.value, p_body: form.body.value, p_website: form.website.value})
      .then(function () { msg.textContent = 'Thank you. Your comment will appear after it has been checked.'; form.body.value = ''; })
      .catch(function (er) { msg.textContent = er.message && er.message.length < 120 ? er.message.charAt(0).toUpperCase() + er.message.slice(1) : 'Something went wrong. Please try again.'; msg.className += ' err'; })
      .then(function () { b.disabled = false; });
  };
})();
