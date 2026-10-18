/* FAQ: live search over the questions and answers */
(function () {
  var wrap = document.querySelector('.faq'); if (!wrap) return;
  var items = [].slice.call(wrap.querySelectorAll('details'));
  var box = document.createElement('div'); box.className = 'faq-find';
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" placeholder="Search the questions (try: license, broker, backtest)" aria-label="Search the FAQ"><span class="faq-count"></span>';
  wrap.parentNode.insertBefore(box, wrap);
  var input = box.querySelector('input'), count = box.querySelector('.faq-count');
  var none = document.createElement('p'); none.className = 'faq-none'; none.textContent = 'No question matches. Ask us on Telegram and we will answer.'; none.hidden = true; wrap.appendChild(none);
  function run() {
    var q = input.value.trim().toLowerCase(), shown = 0;
    items.forEach(function (d) { var ok = !q || d.textContent.toLowerCase().indexOf(q) > -1; d.hidden = !ok; if (ok) shown++; if (q && ok && shown === 1) d.open = true; else if (q) d.open = false; });
    none.hidden = shown > 0; count.textContent = q ? shown + ' of ' + items.length : items.length + ' questions';
  }
  input.addEventListener('input', run); run();
})();
